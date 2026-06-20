<?php
require __DIR__ . '/../bootstrap/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/start.php';
$app->boot();

chama_ensure_admin_tables(true);
echo "Setup Chama admin concluído.\n";
