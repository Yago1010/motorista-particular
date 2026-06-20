<?php

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');

/** Atalhos amigáveis para PWAs no servidor local. */
if ($uri === '/taxmeter' || $uri === '/taxmeter/') {
	header('Location: /pwa-motoristas/taxmeter', true, 302);
	exit;
}

/** Serve builds PWA em /pwa-rider/ e /pwa-motoristas/ pelo mesmo servidor PHP (:8888). */
$pwaRoots = array(
	'/pwa-rider' => __DIR__ . '/pwa-rider/dist',
	'/pwa-motoristas' => __DIR__ . '/pwa-motoristas/dist',
);

foreach ($pwaRoots as $prefix => $rootDir) {
	if ($uri === $prefix) {
		header('Location: ' . $prefix . '/', true, 302);
		exit;
	}

	if (strpos($uri, $prefix . '/') === 0 && is_dir($rootDir)) {
		$relative = substr($uri, strlen($prefix) + 1);
		if ($relative === '' || $relative === false) {
			$relative = 'index.html';
		}

		$candidate = $rootDir . '/' . str_replace(array('../', '..\\'), '', $relative);
		$realRoot = realpath($rootDir);
		$realFile = realpath($candidate);

		if ($realFile && $realRoot && strpos($realFile, $realRoot) === 0 && is_file($realFile)) {
			$ext = strtolower(pathinfo($realFile, PATHINFO_EXTENSION));
			$mimes = array(
				'html' => 'text/html; charset=utf-8',
				'js' => 'application/javascript; charset=utf-8',
				'css' => 'text/css; charset=utf-8',
				'json' => 'application/json; charset=utf-8',
				'webmanifest' => 'application/manifest+json; charset=utf-8',
				'svg' => 'image/svg+xml',
				'png' => 'image/png',
				'jpg' => 'image/jpeg',
				'jpeg' => 'image/jpeg',
				'ico' => 'image/x-icon',
				'woff2' => 'font/woff2',
				'woff' => 'font/woff',
			);
			if (isset($mimes[$ext])) {
				header('Content-Type: ' . $mimes[$ext]);
			}
			readfile($realFile);
			exit;
		}

		$index = $rootDir . '/index.html';
		if (is_file($index)) {
			header('Content-Type: text/html; charset=utf-8');
			readfile($index);
			exit;
		}
	}
}

$file = __DIR__ . $uri;
if ($uri !== '/' && is_file($file)) {
	return false;
}

require __DIR__ . '/index.php';
