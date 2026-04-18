<?php
/**
 * Garante DB_* quando o servidor PHP não usa auto_prepend_file (ex.: IDE a correr
 * `php -S localhost:8888 router.php`).
 *
 * Prioridade **sem Docker**: MySQL/MariaDB local na porta **3306** (root, palavra-passe vazia por defeito).
 * Se 3306 não estiver disponível, tenta **3307** (MySQL do docker-compose deste projeto: uberx / uberx_local).
 */
if (!function_exists('uberx_seed_db_env')) {
	function uberx_seed_db_env($key, $value)
	{
		$value = (string) $value;
		putenv($key.'='.$value);
		$_ENV[$key] = $value;
		$_SERVER[$key] = $value;
	}

	function uberx_tcp_port_open($host, $port, $timeoutSec = 0.2)
	{
		$fp = @fsockopen($host, $port, $errno, $errstr, $timeoutSec);
		if ($fp)
		{
			fclose($fp);

			return true;
		}

		return false;
	}
}

$db = getenv('DB_DATABASE');
if ($db !== false && $db !== '')
{
	return;
}

$prepend = __DIR__.'/db-env-prepend.php';
if (is_file($prepend))
{
	require $prepend;

	return;
}

$host = getenv('DB_HOST');
if ($host === false || $host === '')
{
	uberx_seed_db_env('DB_HOST', '127.0.0.1');
}

$h = getenv('DB_HOST') ?: '127.0.0.1';
$portEnv = getenv('DB_PORT');
if ($portEnv !== false && $portEnv !== '')
{
	$p = (int) $portEnv;
	if ($p === 3306)
	{
		uberx_seed_db_env('DB_PORT', '3306');
		if (getenv('DB_DATABASE') === false || getenv('DB_DATABASE') === '')
		{
			uberx_seed_db_env('DB_DATABASE', 'uberx');
		}
		if (getenv('DB_USERNAME') === false || getenv('DB_USERNAME') === '')
		{
			uberx_seed_db_env('DB_USERNAME', 'root');
		}
		if (getenv('DB_PASSWORD') === false)
		{
			uberx_seed_db_env('DB_PASSWORD', '');
		}

		return;
	}
	if ($p === 3307)
	{
		uberx_seed_db_env('DB_PORT', '3307');
		uberx_seed_db_env('DB_DATABASE', (getenv('DB_DATABASE') !== false && getenv('DB_DATABASE') !== '') ? getenv('DB_DATABASE') : 'uberx');
		if (getenv('DB_USERNAME') === false || getenv('DB_USERNAME') === '')
		{
			uberx_seed_db_env('DB_USERNAME', 'uberx');
		}
		if (getenv('DB_PASSWORD') === false)
		{
			uberx_seed_db_env('DB_PASSWORD', 'uberx_local');
		}

		return;
	}
}

if (uberx_tcp_port_open($h, 3306))
{
	uberx_seed_db_env('DB_PORT', '3306');
	if (getenv('DB_DATABASE') === false || getenv('DB_DATABASE') === '')
	{
		uberx_seed_db_env('DB_DATABASE', 'uberx');
	}
	if (getenv('DB_USERNAME') === false || getenv('DB_USERNAME') === '')
	{
		uberx_seed_db_env('DB_USERNAME', 'root');
	}
	if (getenv('DB_PASSWORD') === false)
	{
		uberx_seed_db_env('DB_PASSWORD', '');
	}
}
elseif (uberx_tcp_port_open($h, 3307))
{
	uberx_seed_db_env('DB_PORT', '3307');
	uberx_seed_db_env('DB_DATABASE', 'uberx');
	uberx_seed_db_env('DB_USERNAME', 'uberx');
	uberx_seed_db_env('DB_PASSWORD', 'uberx_local');
}
else
{
	/* Nenhuma porta detetada: assume MySQL local típico (sem Docker). */
	uberx_seed_db_env('DB_PORT', '3306');
	uberx_seed_db_env('DB_DATABASE', 'uberx');
	uberx_seed_db_env('DB_USERNAME', 'root');
	if (getenv('DB_PASSWORD') === false)
	{
		uberx_seed_db_env('DB_PASSWORD', '');
	}
}
