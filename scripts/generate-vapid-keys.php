<?php
/**
 * Gera par de chaves VAPID para Web Push.
 * php scripts/generate-vapid-keys.php
 */
$key = openssl_pkey_new(array(
	'curve_name' => 'prime256v1',
	'private_key_type' => OPENSSL_KEYTYPE_EC,
));

if (!$key) {
	echo "Erro ao gerar chaves\n";
	exit(1);
}

$details = openssl_pkey_get_details($key);
$x = $details['ec']['x'];
$y = $details['ec']['y'];
$publicRaw = chr(4) . $x . $y;
$publicB64 = rtrim(strtr(base64_encode($publicRaw), '+/', '-_'), '=');

openssl_pkey_export($key, $privatePem);
preg_match('/-----BEGIN EC PRIVATE KEY-----(.*?)-----END EC PRIVATE KEY-----/s', $privatePem, $m);
$privateDer = base64_decode(str_replace(array("\n", "\r", " "), '', $m[1]));
$privateB64 = rtrim(strtr(base64_encode($privateDer), '+/', '-_'), '=');

echo "VAPID_PUBLIC_KEY={$publicB64}\n";
echo "VAPID_PRIVATE_KEY={$privateB64}\n";
echo "\nCole em app/config/webpush.php\n";
