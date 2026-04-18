<?php
/**
 * Teste rápido: porta MySQL + PDO com as mesmas variáveis que o Laravel.
 * Uso: php scripts/check-db-connection.php
 */

require_once __DIR__.'/../bootstrap/ensure-local-db-env.php';

$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = (getenv('DB_PORT') !== false && getenv('DB_PORT') !== '') ? (int) getenv('DB_PORT') : 3306;
$user = getenv('DB_USERNAME') ?: 'root';
$pass = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '';
$db = getenv('DB_DATABASE') ?: 'uberx';

foreach (array(3306, 3307) as $p) {
	$fp = @fsockopen('127.0.0.1', $p, $errno, $errstr, 1.0);
	echo "Porta $p: ".($fp ? "aberta\n" : "fechada ($errno $errstr)\n");
	if ($fp) {
		fclose($fp);
	}
}

echo "\nTentativa Laravel (host=$host port=$port db=$db user=$user):\n";
try {
	$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8";
	$pdo = new PDO($dsn, $user, $pass, array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION));
	$n = (int) $pdo->query('SELECT COUNT(*) FROM admin')->fetchColumn();
	echo "OK — PDO ligou. Linhas na tabela admin: $n\n";
} catch (Exception $e) {
	echo "FALHOU — ".$e->getMessage()."\n";
	exit(1);
}
