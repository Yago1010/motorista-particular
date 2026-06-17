<?php
$mysqli = @new mysqli('127.0.0.1', 'root', '', 'uberx');
if (!$mysqli->connect_error) {
    $mysqli->query('DROP DATABASE IF EXISTS uberx');
    $mysqli->query('CREATE DATABASE uberx DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci');
    $mysqli->close();
    echo "Banco recriado OK\n";
} else {
    echo "Erro: " . $mysqli->connect_error . "\n";
}
