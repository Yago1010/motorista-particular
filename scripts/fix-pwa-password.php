<?php
// Atualiza a senha de todos os usuários do PWA para 'Admin123!'
// Uso: php scripts/fix-pwa-password.php

$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = (getenv('DB_PORT') !== false && getenv('DB_PORT') !== '') ? (int) getenv('DB_PORT') : 3306;
$user = getenv('DB_USERNAME') ?: 'root';
$pass = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '';
$db = getenv('DB_DATABASE') ?: 'uberx';

$mysqli = @new mysqli($host, $user, $pass, $db, $port);
if ($mysqli->connect_error) {
    fwrite(STDERR, "Ligação falhou: " . $mysqli->connect_error . "\n");
    exit(1);
}
$mysqli->set_charset('utf8');

$novaSenha = 'Admin123!';
$hash = password_hash($novaSenha, PASSWORD_BCRYPT, array('cost' => 10));

// Atualiza todos os usuários (owner)
$sql = "UPDATE owner SET password = ?";
$stmt = $mysqli->prepare($sql);
$stmt->bind_param('s', $hash);
if ($stmt->execute()) {
    echo "Senha de todos os passageiros (owner) atualizada para: $novaSenha\n";
} else {
    echo "Erro ao atualizar: " . $stmt->error . "\n";
}
$stmt->close();
$mysqli->close();
