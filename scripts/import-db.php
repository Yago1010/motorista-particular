<?php
/**
 * Cria a base (se não existir) e importa uberx.sql.
 * Uso: php scripts/import-db.php
 * Variáveis: DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE (opcional)
 */

$host = getenv('DB_HOST') ?: '127.0.0.1';
$user = getenv('DB_USERNAME') ?: 'root';
$pass = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '';
$db = getenv('DB_DATABASE') ?: 'uberx';
$sqlFile = dirname(__DIR__).DIRECTORY_SEPARATOR.'uberx.sql';

if (!is_readable($sqlFile))
{
	fwrite(STDERR, "Ficheiro não encontrado: $sqlFile\n");
	exit(1);
}

if (!extension_loaded('mysqli'))
{
	fwrite(STDERR, "Extensão mysqli do PHP não está ativa.\n");
	exit(1);
}

$mysqli = @new mysqli($host, $user, $pass);
if ($mysqli->connect_error)
{
	fwrite(STDERR, "Ligação MySQL falhou: ".$mysqli->connect_error."\n");
	fwrite(STDERR, "Confirma que o MySQL/MariaDB está a correr e que user/password estão corretos.\n");
	exit(1);
}

if (!preg_match('/^[a-zA-Z0-9_]+$/', $db))
{
	fwrite(STDERR, "Nome de base inválido.\n");
	exit(1);
}

$mysqli->set_charset('utf8');
if (!$mysqli->query("CREATE DATABASE IF NOT EXISTS `$db` CHARACTER SET utf8 COLLATE utf8_unicode_ci"))
{
	fwrite(STDERR, "CREATE DATABASE: ".$mysqli->error."\n");
	exit(1);
}
$mysqli->select_db($db);

$sql = file_get_contents($sqlFile);
$sql = preg_replace('/^\xEF\xBB\xBF/', '', $sql);

if (!$mysqli->multi_query($sql))
{
	fwrite(STDERR, "Importação: ".$mysqli->error."\n");
	exit(1);
}

do
{
	if ($res = $mysqli->store_result())
	{
		$res->free();
	}
} while ($mysqli->next_result());

if ($mysqli->error)
{
	fwrite(STDERR, "Importação: ".$mysqli->error."\n");
	exit(1);
}

$mysqli->close();
echo "Base \"$db\" criada/atualizada com sucesso.\n";
