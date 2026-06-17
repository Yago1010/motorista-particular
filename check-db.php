<?php
$mysqli = @new mysqli('127.0.0.1', 'root', '', 'uberx');
if ($mysqli->connect_error) {
    echo "Erro na conexão: " . $mysqli->connect_error;
} else {
    echo "=== ADMINS ===\n";
    $result = $mysqli->query("SELECT id, username FROM admin");
    while ($row = $result->fetch_assoc()) {
        echo "ID: {$row['id']}, Username: {$row['username']}\n";
    }
    
    echo "\n=== PASSAGEIROS (OWNERS) ===\n";
    $result = $mysqli->query("SELECT id, email, first_name, password FROM owner LIMIT 5");
    while ($row = $result->fetch_assoc()) {
        echo "ID: {$row['id']}, Email: {$row['email']}, Nome: {$row['first_name']}, Pass: " . substr($row['password'], 0, 20) . "...\n";
    }
    
    echo "\n=== MOTORISTAS (WALKER/DRIVERS) ===\n";
    $result = $mysqli->query("SELECT id, email, first_name, password FROM walker LIMIT 5");
    if (!$result) {
        echo "Erro na query walker: " . $mysqli->error . "\n";
    } else {
        while ($row = $result->fetch_assoc()) {
            echo "ID: {$row['id']}, Email: {$row['email']}, Nome: {$row['first_name']}, Pass: " . substr($row['password'], 0, 20) . "...\n";
        }
    }
    $mysqli->close();
}
