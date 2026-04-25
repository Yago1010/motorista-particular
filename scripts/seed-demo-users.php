<?php
/**
 * Cria utilizadores de demonstração (admin, passageiro, motorista).
 * Palavra-passe única para todos: Admin123!
 *
 * Uso: php scripts/seed-demo-users.php
 */

$demoPassword = 'Admin123!';

$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = (getenv('DB_PORT') !== false && getenv('DB_PORT') !== '') ? (int) getenv('DB_PORT') : 3306;
$user = getenv('DB_USERNAME') ?: 'root';
$pass = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '';
$db = getenv('DB_DATABASE') ?: 'uberx';

$mysqli = @new mysqli($host, $user, $pass, $db, $port);
if ($mysqli->connect_error)
{
	fwrite(STDERR, "Ligação falhou: ".$mysqli->connect_error."\n");
	exit(1);
}
$mysqli->set_charset('utf8');

function bcrypt_hash($plain)
{
	return password_hash($plain, PASSWORD_BCRYPT, array('cost' => 10));
}

function upsert_admin($mysqli, $username, $hash)
{
	$remember = '';
	$addr = 'Local';
	$lat = 0.0;
	$lng = 0.0;
	$stmt = $mysqli->prepare('SELECT id FROM admin WHERE username = ? LIMIT 1');
	$stmt->bind_param('s', $username);
	$stmt->execute();
	$res = $stmt->get_result();
	$row = $res->fetch_assoc();
	$stmt->close();
	if ($row)
	{
		$id = (int) $row['id'];
		$stmt = $mysqli->prepare('UPDATE admin SET password = ?, remember_token = ?, address = ?, latitude = ?, longitude = ?, updated_at = NOW() WHERE id = ?');
		$stmt->bind_param('sssddi', $hash, $remember, $addr, $lat, $lng, $id);
		$stmt->execute();
		$stmt->close();
		echo "Admin atualizado: $username\n";
	}
	else
	{
		$stmt = $mysqli->prepare('INSERT INTO admin (username, password, remember_token, created_at, updated_at, address, latitude, longitude) VALUES (?, ?, ?, NOW(), NOW(), ?, ?, ?)');
		$stmt->bind_param('ssssdd', $username, $hash, $remember, $addr, $lat, $lng);
		$stmt->execute();
		$stmt->close();
		echo "Admin criado: $username\n";
	}
}

$hash = bcrypt_hash($demoPassword);
upsert_admin($mysqli, 'admin', $hash);
upsert_admin($mysqli, 'admin@taxinow.com', $hash);

$pe = bcrypt_hash($demoPassword);
$emailP = 'passageiro@demo.local';
$stmt = $mysqli->prepare('SELECT id FROM owner WHERE email = ? LIMIT 1');
$stmt->bind_param('s', $emailP);
$stmt->execute();
$ownerRow = $stmt->get_result()->fetch_assoc();
$stmt->close();

$fn = 'Demo'; $ln = 'Passageiro'; $phone = '+5511999990001'; $pic = ''; $bio = '';
$addr = 'Rua Demo'; $st = 'SP'; $country = 'BR'; $zip = '00000';
$tok = ''; $tex = 0; $dtok = ''; $dev = 'android'; $lb = 'manual'; $soc = '';
$lat = -23.55; $lng = -46.63; $ref = 0; $tz = 'UTC';

if ($ownerRow)
{
	$oid = (int) $ownerRow['id'];
	$stmt = $mysqli->prepare('UPDATE owner SET password = ?, first_name = ?, last_name = ?, phone = ?, updated_at = NOW() WHERE id = ?');
	$stmt->bind_param('ssssi', $pe, $fn, $ln, $phone, $oid);
	$stmt->execute();
	$stmt->close();
	echo "Passageiro atualizado: $emailP\n";
}
else
{
	$dogId = 0;
	$debt = 0.0;
	$e = function ($s) use ($mysqli) {
		return "'".$mysqli->real_escape_string($s)."'";
	};
	$sql = 'INSERT INTO owner (first_name, last_name, phone, email, picture, bio, address, state, country, zipcode, dog_id, password, token, token_expiry, device_token, device_type, login_by, social_unique_id, created_at, updated_at, latitude, longitude, referred_by, debt, timezone) VALUES ('
		.$e($fn).','.$e($ln).','.$e($phone).','.$e($emailP).','.$e($pic).','.$e($bio).','.$e($addr).','.$e($st).','.$e($country).','.$e($zip).','
		.(int) $dogId.','.$e($pe).','.$e($tok).','.(int) $tex.','.$e($dtok).','.$e($dev).','.$e($lb).','.$e($soc).',NOW(),NOW(),'
		.(float) $lat.','.(float) $lng.','.(int) $ref.','.(float) $debt.','.$e($tz).')';
	if (!$mysqli->query($sql))
	{
		fwrite(STDERR, "owner insert: ".$mysqli->error."\n");
		exit(1);
	}
	$oid = (int) $mysqli->insert_id;

	$dogName = 'Perfil'; $age = '0'; $breed = 'n/a'; $likes = ''; $img = '';
	$stmt = $mysqli->prepare('INSERT INTO dog (name, age, breed, likes, image_url, owner_id, created_at, updated_at) VALUES (?,?,?,?,?,?,NOW(),NOW())');
	$stmt->bind_param('sssssi', $dogName, $age, $breed, $likes, $img, $oid);
	$stmt->execute();
	$did = (int) $mysqli->insert_id;
	$stmt->close();

	$mysqli->query("UPDATE owner SET dog_id = $did WHERE id = $oid");
	echo "Passageiro criado: $emailP\n";
}

$we = bcrypt_hash($demoPassword);
$emailW = 'motorista@demo.local';
$stmt = $mysqli->prepare('SELECT id FROM walker WHERE email = ? LIMIT 1');
$stmt->bind_param('s', $emailW);
$stmt->execute();
$wRow = $stmt->get_result()->fetch_assoc();
$stmt->close();

$wfn = 'Demo'; $wln = 'Motorista'; $wphone = '+5511999990002';
$waddr = 'Rua Demo'; $wst = 'SP'; $wct = 'BR'; $wzip = '00000';
$wmerch = ''; $wacc = ''; $w4 = ''; $wact = 'ok';

if ($wRow)
{
	$wid = (int) $wRow['id'];
	$stmt = $mysqli->prepare('UPDATE walker SET password = ?, email_activation = 1, is_approved = 1, is_active = 1, updated_at = NOW() WHERE id = ?');
	$stmt->bind_param('si', $we, $wid);
	$stmt->execute();
	$stmt->close();
	echo "Motorista atualizado: $emailW\n";
}
else
{
	$type = 1;
	$eact = 1;
	$iap = 1;
	$iav = 1;
	$isa = 1;
	$texW = 0;
	$e = function ($s) use ($mysqli) {
		return "'".$mysqli->real_escape_string($s)."'";
	};
	$sqlW = 'INSERT INTO walker (first_name, last_name, phone, email, password, picture, bio, address, state, country, zipcode, device_token, device_type, login_by, social_unique_id, token, email_activation, token_expiry, created_at, updated_at, is_active, is_available, latitude, longitude, is_approved, type, merchant_id, account_id, last_4, activation_code, timezone) VALUES ('
		.$e($wfn).','.$e($wln).','.$e($wphone).','.$e($emailW).','.$e($we).','.$e($pic).','.$e($bio).','.$e($waddr).','.$e($wst).','.$e($wct).','.$e($wzip).','
		.$e($dtok).','.$e($dev).','.$e($lb).','.$e($soc).','.$e($tok).','.(int) $eact.','.(int) $texW.',NOW(),NOW(),'
		.(int) $isa.','.(int) $iav.','.(float) $lat.','.(float) $lng.','.(int) $iap.','.(int) $type.','
		.$e($wmerch).','.$e($wacc).','.$e($w4).','.$e($wact).','.$e($tz).')';
	if (!$mysqli->query($sqlW))
	{
		fwrite(STDERR, "walker insert: ".$mysqli->error."\n");
		exit(1);
	}
	$wid = (int) $mysqli->insert_id;
	echo "Motorista criado: $emailW\n";
}

$serviceType = '1';
$stmt = $mysqli->prepare('SELECT id FROM walker_services WHERE provider_id = ? AND type = ? LIMIT 1');
$providerIdStr = (string) $wid;
$stmt->bind_param('ss', $providerIdStr, $serviceType);
$stmt->execute();
$serviceRow = $stmt->get_result()->fetch_assoc();
$stmt->close();

if ($serviceRow)
{
	$serviceId = (int) $serviceRow['id'];
	$stmt = $mysqli->prepare('UPDATE walker_services SET base_price = 5.00, price_per_unit_distance = 1.00, price_per_unit_time = 0.50, updated_at = NOW() WHERE id = ?');
	$stmt->bind_param('i', $serviceId);
	$stmt->execute();
	$stmt->close();
	echo "Serviço do motorista atualizado (type=1)\n";
}
else
{
	$stmt = $mysqli->prepare('INSERT INTO walker_services (provider_id, type, created_at, updated_at, price_per_unit_distance, price_per_unit_time, base_price) VALUES (?, ?, NOW(), NOW(), 1.00, 0.50, 5.00)');
	$stmt->bind_param('ss', $providerIdStr, $serviceType);
	$stmt->execute();
	$stmt->close();
	echo "Serviço do motorista criado (type=1)\n";
}

$mysqli->close();

echo "\n--- Credenciais (password: $demoPassword) ---\n";
echo "Painel admin:  http://localhost:8888/admin/login\n";
echo "  - admin  OU  admin@taxinow.com\n";
echo "Passageiro:    http://localhost:8888/user/signin\n";
echo "  - $emailP\n";
echo "Motorista:     http://localhost:8888/provider/signin\n";
echo "  - $emailW\n";
