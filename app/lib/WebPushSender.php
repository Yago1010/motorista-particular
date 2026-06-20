<?php

/**
 * Envio Web Push (VAPID) para PWAs de motorista.
 */
class WebPushSender
{
	public static function config()
	{
		return Config::get('webpush');
	}

	public static function sendToWalker($walkerId, $title, $body, $data = array())
	{
		if (!Schema::hasTable('web_push_subscriptions')) {
			return false;
		}

		$subs = WebPushSubscription::where('walker_id', $walkerId)->get();
		if ($subs->isEmpty()) {
			return false;
		}

		$config = self::config();
		if (empty($config['public_key']) || empty($config['private_key']) || strpos($config['private_key'], 'REPLACE') !== false) {
			Log::info('WebPush: VAPID não configurado');
			return false;
		}

		$payload = json_encode(array(
			'title' => $title,
			'body' => $body,
			'tag' => isset($data['tag']) ? $data['tag'] : 'chama-push',
			'requireInteraction' => !empty($data['requireInteraction']),
			'data' => $data,
			'actions' => isset($data['actions']) ? $data['actions'] : array(),
		));

		$sent = false;
		foreach ($subs as $sub) {
			if (self::sendOne($sub, $payload, $config)) {
				$sent = true;
			}
		}
		return $sent;
	}

	protected static function sendOne($sub, $payload, $config)
	{
		$endpoint = $sub->endpoint;
		$userPublicKey = $sub->p256dh;
		$userAuth = $sub->auth_key;

		$jwt = self::createJwt($config['subject'], $config['private_key'], parse_url($endpoint, PHP_URL_HOST));

		$encrypted = self::encryptPayload($payload, $userPublicKey, $userAuth);
		if (!$encrypted) {
			return false;
		}

		$headers = array(
			'Content-Type: application/octet-stream',
			'Content-Encoding: aes128gcm',
			'Content-Length: ' . strlen($encrypted),
			'TTL: 60',
			'Authorization: vapid t=' . $jwt . ', k=' . $config['public_key'],
		);

		$ch = curl_init($endpoint);
		curl_setopt($ch, CURLOPT_POST, true);
		curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $encrypted);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_TIMEOUT, 10);
		$response = curl_exec($ch);
		$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		curl_close($ch);

		if ($code === 404 || $code === 410) {
			WebPushSubscription::where('id', $sub->id)->delete();
		}

		return $code >= 200 && $code < 300;
	}

	protected static function createJwt($subject, $privateKeyB64, $audience)
	{
		$header = self::b64url(json_encode(array('typ' => 'JWT', 'alg' => 'ES256')));
		$payload = self::b64url(json_encode(array(
			'aud' => 'https://' . $audience,
			'exp' => time() + 43200,
			'sub' => $subject,
		)));

		$der = self::base64UrlDecode($privateKeyB64);
		$key = openssl_pkey_get_private($der);
		if (!$key) {
			$pem = "-----BEGIN EC PRIVATE KEY-----\n" . chunk_split(base64_encode($der), 64, "\n") . "-----END EC PRIVATE KEY-----\n";
			$key = openssl_pkey_get_private($pem);
		}

		openssl_sign($header . '.' . $payload, $signature, $key, OPENSSL_ALGO_SHA256);
		$sig = self::derToJose($signature);

		return $header . '.' . $payload . '.' . self::b64url($sig);
	}

	protected static function encryptPayload($payload, $userPublicKeyB64, $userAuthB64)
	{
		$userPublicKey = self::base64UrlDecode($userPublicKeyB64);
		$userAuth = self::base64UrlDecode($userAuthB64);

		$localKey = openssl_pkey_new(array('curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC));
		$localDetails = openssl_pkey_get_details($localKey);
		$localPublic = chr(4) . $localDetails['ec']['x'] . $localDetails['ec']['y'];

		openssl_pkey_export($localKey, $localPem);
		$remoteKey = openssl_pkey_get_public(array('curve_name' => 'prime256v1', 'x' => substr($userPublicKey, 1, 32), 'y' => substr($userPublicKey, 33, 32)));
		if (!$remoteKey) {
			return false;
		}

		$sharedSecret = '';
		openssl_pkey_derive($remoteKey, $localKey, $sharedSecret);

		$salt = openssl_random_pseudo_bytes(16);
		$ikm = self::hkdf($userAuth, $sharedSecret, 'Content-Encoding: auth' . chr(0), 32);
		$cek = self::hkdf($salt, $ikm, 'Content-Encoding: aes128gcm' . chr(0), 16);
		$nonce = self::hkdf($salt, $ikm, 'Content-Encoding: nonce' . chr(0), 12);

		$record = $payload . chr(2);
		$padLen = (16 - (strlen($record) % 16)) % 16;
		$record .= str_repeat(chr(0), $padLen);

		$tag = '';
		$ciphertext = openssl_encrypt($record, 'aes-128-gcm', $cek, OPENSSL_RAW_DATA, $nonce, $tag);

		$header = $salt . pack('N', 4096) . chr(strlen($localPublic)) . $localPublic;
		return $header . $ciphertext . $tag;
	}

	protected static function hkdf($salt, $ikm, $info, $length)
	{
		$prk = hash_hmac('sha256', $ikm, $salt, true);
		$t = '';
		$output = '';
		for ($i = 1; strlen($output) < $length; $i++) {
			$t = hash_hmac('sha256', $t . $info . chr($i), $prk, true);
			$output .= $t;
		}
		return substr($output, 0, $length);
	}

	protected static function b64url($data)
	{
		return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
	}

	protected static function base64UrlDecode($data)
	{
		return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
	}

	protected static function derToJose($der)
	{
		$pos = 0;
		if (ord($der[$pos++]) !== 0x30) return $der;
		$pos++;
		if (ord($der[$pos++]) !== 0x02) return $der;
		$rLen = ord($der[$pos++]);
		$r = substr($der, $pos, $rLen);
		$pos += $rLen;
		if (ord($der[$pos++]) !== 0x02) return $der;
		$sLen = ord($der[$pos++]);
		$s = substr($der, $pos, $sLen);
		$r = str_pad(ltrim($r, "\x00"), 32, "\x00", STR_PAD_LEFT);
		$s = str_pad(ltrim($s, "\x00"), 32, "\x00", STR_PAD_LEFT);
		return $r . $s;
	}
}
