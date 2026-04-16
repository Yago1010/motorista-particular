<?php
/**
 * Cria ou atualiza utilizador do painel admin (/admin/login).
 *
 * Uso:
 *   php scripts/seed-admin.php
 *   php scripts/seed-admin.php meuuser "MinhaSenha123"
 *
 * Credenciais por omissão: admin / UberLocal2026
 */

$username = isset($argv[1]) ? $argv[1] : 'admin';
$password = isset($argv[2]) ? $argv[2] : 'UberLocal2026';

$host = getenv('DB_HOST') ?: '127.0.0.1';
$user = getenv('DB_USERNAME') ?: 'root';
$pass = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '';
$db = getenv('DB_DATABASE') ?: 'uberx';

if (!preg_match('/^[a-zA-Z0-9_.@-]{1,200}$/', $username))
{
	fwrite(STDERR, "Username inválido.\n");
	exit(1);
}
if (strlen($password) < 6)
{
	fwrite(STDERR, "Password deve ter pelo menos 6 caracteres.\n");
	exit(1);
}

$mysqli = @new mysqli($host, $user, $pass, $db);
if ($mysqli->connect_error)
{
	fwrite(STDERR, "Ligação falhou: ".$mysqli->connect_error."\n");
	exit(1);
}

$hash = password_hash($password, PASSWORD_BCRYPT, array('cost' => 10));
if ($hash === false)
{
	fwrite(STDERR, "Erro ao gerar hash.\n");
	exit(1);
}

$stmt = $mysqli->prepare('SELECT id FROM admin WHERE username = ? LIMIT 1');
$stmt->bind_param('s', $username);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
$stmt->close();

$remember = '';
$addr = 'Local dev';
$lat = 0.0;
$lng = 0.0;

if ($row)
{
	$id = (int) $row['id'];
	$stmt = $mysqli->prepare('UPDATE admin SET password = ?, remember_token = ?, address = ?, latitude = ?, longitude = ?, updated_at = NOW() WHERE id = ?');
	$stmt->bind_param('sssddi', $hash, $remember, $addr, $lat, $lng, $id);
	$stmt->execute();
	if ($stmt->error)
	{
		fwrite(STDERR, $stmt->error."\n");
		exit(1);
	}
	$stmt->close();
	echo "Admin atualizado: username=\"$username\"\n";
}
else
{
	$stmt = $mysqli->prepare('INSERT INTO admin (username, password, remember_token, created_at, updated_at, address, latitude, longitude) VALUES (?, ?, ?, NOW(), NOW(), ?, ?, ?)');
	$stmt->bind_param('ssssdd', $username, $hash, $remember, $addr, $lat, $lng);
	$stmt->execute();
	if ($stmt->error)
	{
		fwrite(STDERR, $stmt->error."\n");
		exit(1);
	}
	$stmt->close();
	echo "Admin criado: username=\"$username\"\n";
}

$mysqli->close();
echo "Entra em: /admin/login\n";
echo "Password definida (a que acabaste de usar no comando ou a omissão).\n";
