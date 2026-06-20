<?php

// My common functions

/**
 * Logo pública da marca. Se app.use_theme_upload_logo for false, ignora o logo guardado no tema (uploads).
 */
function app_brand_logo()
{
	if ( ! Config::get('app.use_theme_upload_logo', false)) {
		return Config::get('app.default_logo');
	}
	if (Config::get('database.connections.mysql.database') === '' || Config::get('database.connections.mysql.database') === null) {
		return Config::get('app.default_logo');
	}
	try {
		$logo = Config::get('app.default_logo');
		foreach (Theme::all() as $themes) {
			$logo = '/uploads/'.$themes->logo;
		}
		if ($logo === '/uploads/' || $logo === '/uploads') {
			$logo = Config::get('app.default_logo');
		}
		return $logo;
	} catch (Exception $e) {
		return Config::get('app.default_logo');
	}
}

/**
 * Normaliza telefone BR para link wa.me (somente dígitos, prefixo 55).
 */
function chama_whatsapp_phone($phone)
{
	$digits = preg_replace('/\D/', '', (string) $phone);
	if ($digits === '') {
		return '';
	}
	if (strlen($digits) >= 10 && strlen($digits) <= 11) {
		$digits = '55' . $digits;
	}
	return $digits;
}

function chama_whatsapp_url($phone, $message)
{
	$normalized = chama_whatsapp_phone($phone);
	if ($normalized === '') {
		return '';
	}
	return 'https://wa.me/' . $normalized . '?text=' . rawurlencode($message);
}

/**
 * Formata distância armazenada (metros na API PWA ou valor legado) para exibição em km.
 */
function chama_format_distance_km($meters)
{
	$value = (float) $meters;
	if ($value <= 0) {
		return '0 km';
	}
	if ($value < 100) {
		$value = $value * 1000;
	}
	return number_format($value / 1000, 1, ',', '.') . ' km';
}

function chama_admin_nav_stats()
{
	try {
		return array(
			'pending_rides' => (int) DB::table('request')->where('is_cancelled', 0)->where('status', 0)->count(),
			'pending_drivers' => (int) DB::table('walker')->where('is_approved', 0)->count(),
			'active_rides' => (int) DB::table('request')->where('is_completed', 0)->where('is_cancelled', 0)->count(),
		);
	} catch (Exception $e) {
		return array('pending_rides' => 0, 'pending_drivers' => 0, 'active_rides' => 0);
	}
}

/** URLs dos portais: passageiro (PWA), motorista (PWA) e admin. */
function chama_pwa_dist_ready($which = null)
{
	$root = function_exists('base_path') ? base_path() : dirname(__DIR__);
	$map = array(
		'rider' => $root . '/pwa-rider/dist/index.html',
		'driver' => $root . '/pwa-motoristas/dist/index.html',
	);
	if ($which !== null) {
		return isset($map[$which]) && is_file($map[$which]);
	}
	return is_file($map['rider']) && is_file($map['driver']);
}

function chama_portal_urls()
{
	$base = rtrim(Config::get('app.url', 'http://localhost:8888'), '/');
	$rider = Config::get('app.chama_rider_app_url');
	$driver = Config::get('app.chama_driver_app_url');

	if (!$rider) {
		if (chama_pwa_dist_ready('rider')) {
			$rider = $base . '/pwa-rider';
		} else {
			$rider = Config::get('app.debug') ? 'http://localhost:3000' : $base . '/pwa-rider';
		}
	}
	if (!$driver) {
		if (chama_pwa_dist_ready('driver')) {
			$driver = $base . '/pwa-motoristas';
		} else {
			$driver = Config::get('app.debug') ? 'http://localhost:3001' : $base . '/pwa-motoristas';
		}
	}

	return array(
		'rider' => rtrim($rider, '/') . '/',
		'driver' => rtrim($driver, '/') . '/',
		'admin' => $base . '/admin/login',
		'home' => $base . '/',
		'rider_built' => chama_pwa_dist_ready('rider'),
		'driver_built' => chama_pwa_dist_ready('driver'),
	);
}

function chama_portal_url($key, $path = '')
{
	$urls = chama_portal_urls();
	$url = isset($urls[$key]) ? $urls[$key] : $urls['home'];
	if ($path !== '' && $path !== null) {
		$url = rtrim($url, '/') . '/' . ltrim($path, '/');
	}
	return $url;
}

/** Mapeia rotas web legadas /user/* para paths do PWA passageiro. */
function chama_legacy_rider_path($httpPath)
{
	$path = trim($httpPath, '/');
	$parts = explode('/', $path);
	$action = isset($parts[1]) ? $parts[1] : '';

	$map = array(
		'signin' => 'login',
		'signup' => 'register',
		'request-trip' => '',
		'trips' => 'trips',
		'profile' => 'profile',
		'payments' => 'wallet',
		'request-fare' => '',
		'requesteta' => '',
	);

	if ($action === 'trip' && !empty($parts[2])) {
		return 'ride/' . $parts[2];
	}

	return isset($map[$action]) ? $map[$action] : '';
}

/** Mapeia rotas web legadas /provider/* para paths do PWA motorista. */
function chama_legacy_driver_path($httpPath)
{
	$path = trim($httpPath, '/');
	$parts = explode('/', $path);
	$action = isset($parts[1]) ? $parts[1] : '';

	$map = array(
		'signin' => 'login',
		'signup' => 'register',
		'trips' => '',
		'profile' => 'profile',
		'documents' => 'documents',
		'availability' => 'availability',
		'tripinprogress' => '',
		'request' => '',
	);

	if ($action === 'trip' && !empty($parts[2])) {
		return 'ride/' . $parts[2];
	}

	return isset($map[$action]) ? $map[$action] : '';
}

function chama_ride_status_label($ride)
{
	if (!empty($ride->is_cancelled)) {
		return array('label' => 'Cancelada', 'class' => 'danger');
	}
	if (!empty($ride->is_completed)) {
		return array('label' => 'Concluída', 'class' => 'success');
	}
	if (!empty($ride->is_started)) {
		return array('label' => 'Em viagem', 'class' => 'info');
	}
	if (!empty($ride->is_walker_arrived)) {
		return array('label' => 'No embarque', 'class' => 'warning');
	}
	if (!empty($ride->is_walker_started)) {
		return array('label' => 'A caminho', 'class' => 'warning');
	}
	if (!empty($ride->confirmed_walker)) {
		return array('label' => 'Aceita', 'class' => 'primary');
	}
	if (isset($ride->status) && (int) $ride->status === 0) {
		return array('label' => 'Aguardando', 'class' => 'default');
	}
	return array('label' => '—', 'class' => 'default');
}

function chama_ride_whatsapp_message($ride, $recipient = 'driver')
{
	$id = isset($ride->id) ? $ride->id : '';
	$passenger = trim((isset($ride->owner_first_name) ? $ride->owner_first_name : '') . ' ' . (isset($ride->owner_last_name) ? $ride->owner_last_name : ''));
	$driver = trim((isset($ride->walker_first_name) ? $ride->walker_first_name : '') . ' ' . (isset($ride->walker_last_name) ? $ride->walker_last_name : ''));
	$total = isset($ride->total) ? $ride->total : '0';
	$distance = isset($ride->distance) ? round((float) $ride->distance / 1000, 1) : '—';
	$app = Config::get('app.website_title', 'Chama no 12');

	if ($recipient === 'driver') {
		return "🚗 *{$app}* — Nova corrida #{$id}\n\n"
			. "Passageiro: {$passenger}\n"
			. "Valor: R$ {$total}\n"
			. "Distância: ~{$distance} km\n\n"
			. "Abra o app motorista para aceitar. Obrigado!";
	}

	return "📍 *{$app}* — Sua corrida #{$id}\n\n"
		. "Motorista: " . ($driver !== '' ? $driver : 'Aguardando') . "\n"
		. "Valor: R$ {$total}\n\n"
		. "Acompanhe pelo app passageiro.";
}

/**
 * Garante tabelas do módulo Chama (cidades, atrações, banners).
 */
function chama_ensure_admin_tables($seedDemo = false)
{
	static $ready = false;
	if ($ready) {
		return true;
	}

	try {
		if (!Schema::hasTable('chama_cities')) {
			Schema::create('chama_cities', function ($table) {
				$table->increments('id');
				$table->string('name', 120);
				$table->string('state', 80)->nullable();
				$table->string('country', 80)->default('Brasil');
				$table->decimal('latitude', 10, 7)->nullable();
				$table->decimal('longitude', 10, 7)->nullable();
				$table->boolean('is_active')->default(true);
				$table->timestamps();
			});
		}

		if (!Schema::hasTable('chama_attractions')) {
			Schema::create('chama_attractions', function ($table) {
				$table->increments('id');
				$table->integer('city_id')->unsigned()->nullable();
				$table->string('name', 160);
				$table->text('description')->nullable();
				$table->decimal('latitude', 10, 7)->nullable();
				$table->decimal('longitude', 10, 7)->nullable();
				$table->string('image_url', 500)->nullable();
				$table->boolean('is_active')->default(true);
				$table->integer('sort_order')->default(0);
				$table->timestamps();
			});
		}

		if (!Schema::hasTable('chama_banners')) {
			Schema::create('chama_banners', function ($table) {
				$table->increments('id');
				$table->string('title', 200);
				$table->string('subtitle', 300)->nullable();
				$table->text('description')->nullable();
				$table->string('cta_label', 80)->default('Saiba mais');
				$table->string('image_url', 500)->nullable();
				$table->string('link_url', 500)->nullable();
				$table->string('target_app', 20)->default('both');
				$table->string('placement', 40)->default('home');
				$table->integer('city_id')->unsigned()->nullable();
				$table->boolean('is_active')->default(true);
				$table->dateTime('starts_at')->nullable();
				$table->dateTime('ends_at')->nullable();
				$table->integer('sort_order')->default(0);
				$table->timestamps();
			});
		}

		if ($seedDemo && Schema::hasTable('chama_cities') && DB::table('chama_cities')->count() === 0) {
			$now = date('Y-m-d H:i:s');
			DB::table('chama_cities')->insert(array(
				array('name' => 'São Paulo', 'state' => 'SP', 'country' => 'Brasil', 'latitude' => -23.5505, 'longitude' => -46.6333, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now),
				array('name' => 'Rio de Janeiro', 'state' => 'RJ', 'country' => 'Brasil', 'latitude' => -22.9068, 'longitude' => -43.1729, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now),
			));
		}

		if ($seedDemo && Schema::hasTable('chama_banners') && DB::table('chama_banners')->count() === 0) {
			DB::table('chama_banners')->insert(array(
				'title' => 'Chama no 12',
				'subtitle' => 'Peça sua corrida com segurança e preço justo.',
				'description' => 'Motoristas verificados perto de você.',
				'cta_label' => 'Pedir agora',
				'link_url' => '',
				'target_app' => 'both',
				'placement' => 'home',
				'is_active' => 1,
				'sort_order' => 0,
				'created_at' => date('Y-m-d H:i:s'),
				'updated_at' => date('Y-m-d H:i:s'),
			));
		}

		$ready = true;
		return true;
	} catch (Exception $e) {
		Log::error('chama_ensure_admin_tables: ' . $e->getMessage());
		return false;
	}
}

function chama_ensure_ride_wallet_tables()
{
	static $ready = false;
	if ($ready) {
		return true;
	}
	try {
		if (!Schema::hasTable('chama_ride_meta')) {
			Schema::create('chama_ride_meta', function ($table) {
				$table->increments('id');
				$table->integer('request_id')->unsigned();
				$table->integer('owner_id')->unsigned()->nullable();
				$table->string('origin_address', 500)->nullable();
				$table->string('destination_address', 500)->nullable();
				$table->timestamps();
				$table->unique('request_id');
			});
		}
		if (!Schema::hasTable('wallet_transactions')) {
			Schema::create('wallet_transactions', function ($table) {
				$table->increments('id');
				$table->string('owner_type', 20);
				$table->integer('owner_id')->unsigned();
				$table->string('type', 32);
				$table->decimal('amount', 10, 2);
				$table->integer('ride_id')->unsigned()->nullable();
				$table->string('description', 255)->nullable();
				$table->string('status', 20)->default('completed');
				$table->timestamps();
			});
		}
		if (!Schema::hasTable('wallet_topup_requests')) {
			Schema::create('wallet_topup_requests', function ($table) {
				$table->increments('id');
				$table->integer('owner_id')->unsigned();
				$table->decimal('amount', 10, 2);
				$table->string('pix_code', 500)->nullable();
				$table->string('status', 20)->default('pending');
				$table->timestamps();
			});
		}
		if (!Schema::hasTable('wallet_withdraw_requests')) {
			Schema::create('wallet_withdraw_requests', function ($table) {
				$table->increments('id');
				$table->integer('walker_id')->unsigned();
				$table->decimal('amount', 10, 2);
				$table->string('status', 20)->default('pending');
				$table->timestamps();
			});
		}
		if (Schema::hasTable('chama_ride_meta')) {
			if (!Schema::hasColumn('chama_ride_meta', 'destination_arrived')) {
				Schema::table('chama_ride_meta', function ($table) {
					$table->boolean('destination_arrived')->default(0);
				});
			}
			if (!Schema::hasColumn('chama_ride_meta', 'pix_code')) {
				Schema::table('chama_ride_meta', function ($table) {
					$table->string('pix_code', 500)->nullable();
				});
			}
		}
		$ready = true;
	} catch (Exception $e) {
		Log::error('chama_ensure_ride_wallet_tables: ' . $e->getMessage());
	}
	return true;
}

function chama_ride_meta_row($requestId)
{
	chama_ensure_ride_wallet_tables();
	return DB::table('chama_ride_meta')->where('request_id', (int) $requestId)->first();
}

function chama_ride_is_destination_arrived($requestId)
{
	$row = chama_ride_meta_row($requestId);
	return $row && !empty($row->destination_arrived);
}

function chama_ride_set_destination_arrived($requestId)
{
	chama_ensure_ride_wallet_tables();
	$now = date('Y-m-d H:i:s');
	$exists = DB::table('chama_ride_meta')->where('request_id', (int) $requestId)->exists();
	if ($exists) {
		DB::table('chama_ride_meta')->where('request_id', (int) $requestId)->update(array(
			'destination_arrived' => 1,
			'updated_at' => $now,
		));
		return;
	}
	DB::table('chama_ride_meta')->insert(array(
		'request_id' => (int) $requestId,
		'destination_arrived' => 1,
		'created_at' => $now,
		'updated_at' => $now,
	));
}

function chama_ride_pix_code($request)
{
	if (!$request) {
		return '';
	}
	$row = chama_ride_meta_row($request->id);
	if ($row && !empty($row->pix_code)) {
		return $row->pix_code;
	}
	$amount = str_replace('.', '', number_format((float) $request->total, 2, '.', ''));
	$code = '00020126580014BR.GOV.BCB.PIX0136chama-no-12-ride-' . $request->id . '-' . $amount;
	chama_ensure_ride_wallet_tables();
	$exists = DB::table('chama_ride_meta')->where('request_id', (int) $request->id)->exists();
	if ($exists) {
		DB::table('chama_ride_meta')->where('request_id', (int) $request->id)->update(array(
			'pix_code' => $code,
			'updated_at' => date('Y-m-d H:i:s'),
		));
	} else {
		DB::table('chama_ride_meta')->insert(array(
			'request_id' => (int) $request->id,
			'pix_code' => $code,
			'created_at' => date('Y-m-d H:i:s'),
			'updated_at' => date('Y-m-d H:i:s'),
		));
	}
	return $code;
}

function chama_category_id_from_body($body)
{
	if (is_array($body) && isset($body['category_id']) && (int) $body['category_id'] > 0) {
		return (int) $body['category_id'];
	}
	$name = is_array($body) && isset($body['category']) ? strtolower(trim($body['category'])) : '';
	$map = array('moto' => 1, 'carro' => 2, 'carro premium' => 3);
	return isset($map[$name]) ? $map[$name] : 2;
}

/** Tipo de serviço legacy (ProviderType) usado no dispatch — fallback se categoria PWA não existir no DB. */
function chama_resolve_service_type($categoryId)
{
	$categoryId = (int) $categoryId;
	try {
		$hasService = DB::table('walker_services')->where('type', (string) $categoryId)->exists();
		if ($hasService) {
			return $categoryId;
		}
		$default = ProviderType::where('is_default', 1)->first();
		if ($default) {
			return (int) $default->id;
		}
		$row = DB::table('walker_services')->first();
		if ($row && isset($row->type)) {
			return (int) $row->type;
		}
	} catch (Exception $e) {
	}
	return 1;
}

/** Motoristas online elegíveis para receber corrida (sem exigir aprovação admin). */
function chama_find_eligible_walkers($latitude, $longitude, $serviceType = 1, $limit = 50)
{
	$settings = Settings::where('key', 'default_search_radius')->first();
	$radius = $settings ? (float) $settings->value : 50;
	if ($radius <= 0) {
		$radius = 50;
	}

	$serviceType = (int) chama_resolve_service_type($serviceType);
	$lat = (float) $latitude;
	$lng = (float) $longitude;
	$distSql = "(1.609344 * 3956 * acos( cos( radians('$lat') ) * cos( radians(latitude) ) * cos( radians(longitude) - radians('$lng') ) + sin( radians('$lat') ) * sin( radians(latitude) ) ) )";
	$onlineSql = " is_active = 1 AND is_available = 1 AND deleted_at IS NULL AND $distSql <= $radius ";

	$providerIds = array();
	try {
		$rows = DB::table('walker_services')->where('type', (string) $serviceType)->get();
		foreach ($rows as $row) {
			$providerIds[] = (int) $row->provider_id;
		}
	} catch (Exception $e) {
	}

	$runQuery = function ($filterIds) use ($onlineSql, $distSql, $limit) {
		$sql = "SELECT walker.id, walker.latitude, walker.longitude, $distSql AS distance FROM walker WHERE $onlineSql";
		if (!empty($filterIds)) {
			$sql .= ' AND walker.id IN (' . implode(',', array_map('intval', $filterIds)) . ')';
		}
		$sql .= " ORDER BY distance ASC LIMIT " . (int) $limit;
		return DB::select(DB::raw($sql));
	};

	$walkers = $runQuery($providerIds);
	if (empty($walkers) && !empty($providerIds)) {
		$walkers = $runQuery(array());
	}
	if (empty($walkers)) {
		$walkers = DB::select(DB::raw(
			"SELECT id, latitude, longitude, 0 AS distance FROM walker WHERE is_active = 1 AND is_available = 1 AND deleted_at IS NULL LIMIT " . (int) $limit
		));
	}

	return $walkers;
}

function chama_ensure_walker_dispatch_ready($walkerId, $serviceType = 1)
{
	$walkerId = (int) $walkerId;
	Walker::where('id', $walkerId)->update(array('is_approved' => 1));
	$serviceType = (int) chama_resolve_service_type($serviceType);
	$exists = DB::table('walker_services')
		->where('provider_id', (string) $walkerId)
		->where('type', (string) $serviceType)
		->exists();
	if (!$exists) {
		$now = date('Y-m-d H:i:s');
		DB::table('walker_services')->insert(array(
			'provider_id' => (string) $walkerId,
			'type' => (string) $serviceType,
			'base_price' => 0,
			'price_per_unit_distance' => 0,
			'price_per_unit_time' => 0,
			'created_at' => $now,
			'updated_at' => $now,
		));
	}
}

/** Envia corrida para todos os motoristas online (modelo 99 — primeiro a aceitar leva). */
function chama_broadcast_ride($requestId, $latitude, $longitude, $serviceType = 1)
{
	$request = Requests::find($requestId);
	if (!$request) {
		return 0;
	}

	$walkers = chama_find_eligible_walkers($latitude, $longitude, $serviceType);
	RequestMeta::where('request_id', $requestId)->delete();

	foreach ($walkers as $w) {
		chama_ensure_walker_dispatch_ready($w->id, $serviceType);
		$meta = new RequestMeta();
		$meta->request_id = $requestId;
		$meta->walker_id = (int) $w->id;
		$meta->status = 0;
		$meta->is_cancelled = 0;
		$meta->save();
	}

	$request->current_walker = 0;
	$request->confirmed_walker = 0;
	$request->status = 0;
	$request->updated_at = date('Y-m-d H:i:s');
	$request->save();

	$owner = Owner::find($request->owner_id);
	$addrs = chama_get_ride_addresses($requestId);
	foreach ($walkers as $w) {
		$msg = array(
			'unique_id' => 1,
			'request_id' => (int) $requestId,
			'time_left_to_respond' => 60,
			'request_data' => array(
				'owner' => array(
					'name' => $owner ? trim($owner->first_name . ' ' . $owner->last_name) : 'Passageiro',
					'latitude' => $owner ? $owner->latitude : $latitude,
					'longitude' => $owner ? $owner->longitude : $longitude,
					'address' => $addrs['origin_address'] ?: ($owner ? $owner->address : ''),
					'd_latitude' => $request->D_latitude,
					'd_longitude' => $request->D_longitude,
				),
				'payment_mode' => $request->payment_mode,
			),
		);
		try {
			send_notifications($w->id, 'walker', 'Nova corrida disponível', $msg);
		} catch (Throwable $e) {
		}
	}

	return count($walkers);
}

function chama_pending_rides_for_walker($walkerId)
{
	$walkerId = (int) $walkerId;
	$time = date('Y-m-d H:i:s');
	$timeoutRow = Settings::where('key', 'provider_timeout')->first();
	$timeout = $timeoutRow ? (int) $timeoutRow->value : 60;

	$sql = "SELECT r.id, r.later, r.D_latitude, r.D_longitude, r.payment_mode, r.request_start_time, r.owner_id, r.total,
		TIMESTAMPDIFF(SECOND, r.updated_at, '$time') AS diff
		FROM request r
		INNER JOIN request_meta rm ON rm.request_id = r.id AND rm.walker_id = $walkerId
		WHERE r.is_cancelled = 0 AND r.status = 0 AND r.confirmed_walker = 0
		AND rm.status = 0 AND rm.is_cancelled = 0
		AND TIMESTAMPDIFF(SECOND, r.updated_at, '$time') <= $timeout
		ORDER BY r.id DESC";

	$rows = DB::select(DB::raw($sql));
	$rides = array();

	foreach ($rows as $request) {
		$owner = Owner::find($request->owner_id);
		$addrs = chama_get_ride_addresses($request->id);
		$paymentMap = array(0 => 'cash', 1 => 'card', 2 => 'pix', 3 => 'wallet');

		$rides[] = array(
			'id' => (int) $request->id,
			'status' => 'pending',
			'estimated_fare' => (float) $request->total,
			'distance' => 0,
			'estimated_duration' => 0,
			'payment_method' => isset($paymentMap[(int) $request->payment_mode]) ? $paymentMap[(int) $request->payment_mode] : 'cash',
			'time_left' => max(0, $timeout - (int) $request->diff),
			'passenger_name' => $owner ? trim($owner->first_name . ' ' . $owner->last_name) : 'Passageiro',
			'passenger_rating' => (float) (DB::table('review_dog')->where('owner_id', $owner ? $owner->id : 0)->avg('rating') ?: 5),
			'origin_lat' => $owner ? (float) $owner->latitude : null,
			'origin_lng' => $owner ? (float) $owner->longitude : null,
			'dest_lat' => $request->D_latitude ? (float) $request->D_latitude : null,
			'dest_lng' => $request->D_longitude ? (float) $request->D_longitude : null,
			'origin_address' => $addrs['origin_address'] ?: ($owner ? $owner->address : ''),
			'destination_address' => $addrs['destination_address'],
			'created_at' => $request->request_start_time,
		);
	}

	return $rides;
}

function chama_accept_ride_for_walker($requestId, $walkerId)
{
	$requestId = (int) $requestId;
	$walkerId = (int) $walkerId;
	$request = Requests::find($requestId);

	if (!$request || $request->is_cancelled || $request->confirmed_walker) {
		return array('success' => false, 'error' => 'Corrida indisponível ou já aceita por outro motorista');
	}

	$meta = RequestMeta::where('request_id', $requestId)->where('walker_id', $walkerId)->where('status', 0)->first();
	if (!$meta) {
		return array('success' => false, 'error' => 'Você não está na fila desta corrida');
	}

	$updated = DB::table('request')
		->where('id', $requestId)
		->where('confirmed_walker', 0)
		->where('is_cancelled', 0)
		->update(array(
			'confirmed_walker' => $walkerId,
			'current_walker' => $walkerId,
			'status' => 1,
			'request_start_time' => date('Y-m-d H:i:s'),
			'updated_at' => date('Y-m-d H:i:s'),
		));

	if (!$updated) {
		return array('success' => false, 'error' => 'Corrida já foi aceita por outro motorista');
	}

	RequestMeta::where('request_id', $requestId)->where('walker_id', $walkerId)->update(array('status' => 1));
	RequestMeta::where('request_id', $requestId)->where('walker_id', '!=', $walkerId)->where('status', 0)->update(array('status' => 3));
	Walker::where('id', $walkerId)->update(array('is_available' => 0));

	$walker = Walker::find($walkerId);
	if ($walker) {
		$walkerPayload = array(
			'first_name' => $walker->first_name,
			'last_name' => $walker->last_name,
			'phone' => $walker->phone,
			'picture' => $walker->picture,
			'latitude' => $walker->latitude,
			'longitude' => $walker->longitude,
			'rating' => DB::table('review_walker')->where('walker_id', $walkerId)->avg('rating') ?: 5,
		);
		try {
			$driver = Keywords::where('id', 1)->first();
			$trip = Keywords::where('id', 4)->first();
			$title = ($driver ? $driver->keyword : 'Motorista') . ' aceitou a ' . ($trip ? $trip->keyword : 'corrida');
			send_notifications($request->owner_id, 'owner', $title, array(
				'success' => true,
				'request_id' => $requestId,
				'walker' => $walkerPayload,
			));
		} catch (Throwable $e) {
		}
	}

	return array('success' => true);
}

function chama_decline_ride_for_walker($requestId, $walkerId)
{
	RequestMeta::where('request_id', (int) $requestId)
		->where('walker_id', (int) $walkerId)
		->where('status', 0)
		->update(array('status' => 3));
	return array('success' => true);
}

function chama_provider_timeout_seconds()
{
	$timeoutRow = Settings::where('key', 'provider_timeout')->first();
	return $timeoutRow ? max(30, (int) $timeoutRow->value) : 60;
}

/** Cancela corridas aguardando motorista após o timeout (provider_timeout). */
function chama_cancel_stale_unaccepted_rides($ownerId = null)
{
	$timeout = chama_provider_timeout_seconds();
	$cutoff = date('Y-m-d H:i:s', time() - $timeout);
	$query = DB::table('request')
		->where('is_completed', 0)
		->where('is_cancelled', 0)
		->where('confirmed_walker', 0)
		->where('updated_at', '<', $cutoff);
	if ($ownerId) {
		$query->where('owner_id', (int) $ownerId);
	}
	$ids = $query->lists('id');
	foreach ($ids as $id) {
		DB::table('request')->where('id', $id)->update(array(
			'is_cancelled' => 1,
			'updated_at' => date('Y-m-d H:i:s'),
		));
		RequestMeta::where('request_id', $id)->update(array('is_cancelled' => 1));
	}
	return count($ids);
}

/** Cancela corridas pendentes (sem motorista) do passageiro — nova solicitação substitui a anterior. */
function chama_cancel_owner_pending_rides($ownerId)
{
	$ids = DB::table('request')
		->where('owner_id', (int) $ownerId)
		->where('is_completed', 0)
		->where('is_cancelled', 0)
		->where('confirmed_walker', 0)
		->lists('id');
	foreach ($ids as $id) {
		DB::table('request')->where('id', $id)->update(array(
			'is_cancelled' => 1,
			'updated_at' => date('Y-m-d H:i:s'),
		));
		RequestMeta::where('request_id', $id)->delete();
	}
	return count($ids);
}

function chama_category_fare_multiplier($categoryId)
{
	$map = array(1 => 0.88, 2 => 1.0, 3 => 1.45);
	return isset($map[(int) $categoryId]) ? $map[(int) $categoryId] : 1.0;
}

function chama_category_label($categoryId)
{
	$map = array(1 => 'Moto', 2 => 'Carro', 3 => 'Carro Premium');
	return isset($map[(int) $categoryId]) ? $map[(int) $categoryId] : 'Carro';
}

function chama_fare_surge_multiplier($rain = false)
{
	$multiplier = 1.0;
	$labels = array();
	$hour = (int) date('G');
	$day = (int) date('w');

	if ($hour >= 22 || $hour < 6) {
		$multiplier *= 1.15;
		$labels[] = 'Noturno';
	}
	if ($day === 0 || $day === 6) {
		$multiplier *= 1.10;
		$labels[] = 'Fim de semana';
	}
	if ($rain) {
		$multiplier *= 1.12;
		$labels[] = 'Chuva';
	}
	if ($multiplier > 1.35) {
		$multiplier = 1.35;
	}
	return array('multiplier' => round($multiplier, 2), 'labels' => $labels);
}

function chama_calculate_fare($distanceMeters, $durationSeconds, $categoryId = 2, $rain = false)
{
	$distanceMeters = max(0, (float) $distanceMeters);
	$durationSeconds = max(0, (float) $durationSeconds);
	$km = $distanceMeters * 0.001;
	$min = $durationSeconds / 60.0;

	$rates = array(
		1 => array('base' => 3.5, 'per_km' => 1.35, 'per_min' => 0.22),
		2 => array('base' => 4.0, 'per_km' => 1.70, 'per_min' => 0.25),
		3 => array('base' => 6.0, 'per_km' => 2.40, 'per_min' => 0.35),
	);
	$r = isset($rates[(int) $categoryId]) ? $rates[(int) $categoryId] : $rates[2];
	$catMult = chama_category_fare_multiplier($categoryId);

	$base = $r['base'] * $catMult;
	$distanceCost = $km * $r['per_km'] * $catMult;
	$timeCost = $min * $r['per_min'] * $catMult;
	$subtotal = $base + $distanceCost + $timeCost;

	$surge = chama_fare_surge_multiplier($rain);
	$total = round($subtotal * $surge['multiplier'], 2);

	return array(
		'estimated_fare' => $total,
		'base_price' => round($base, 2),
		'price_per_km' => round($r['per_km'] * $catMult, 2),
		'price_per_min' => round($r['per_min'] * $catMult, 2),
		'distance_cost' => round($distanceCost, 2),
		'time_cost' => round($timeCost, 2),
		'surge_multiplier' => $surge['multiplier'],
		'surge_labels' => $surge['labels'],
		'currency' => 'BRL',
		'category_id' => (int) $categoryId,
	);
}

function chama_get_ride_addresses($requestId)
{
	chama_ensure_ride_wallet_tables();
	$row = DB::table('chama_ride_meta')->where('request_id', $requestId)->first();
	if (!$row) {
		return array('origin_address' => '', 'destination_address' => '');
	}
	return array(
		'origin_address' => $row->origin_address ?: '',
		'destination_address' => $row->destination_address ?: '',
	);
}

function chama_persist_ride_quote($requestId, $ownerId, array $body)
{
	chama_ensure_ride_wallet_tables();
	$distanceMeters = isset($body['distance_meters']) ? (float) $body['distance_meters'] : 0;
	$durationSeconds = isset($body['duration_seconds']) ? (float) $body['duration_seconds'] : 0;
	$categoryId = chama_category_id_from_body($body);
	$fare = chama_calculate_fare($distanceMeters, $durationSeconds, $categoryId);

	$request = Requests::find($requestId);
	if (!$request) {
		return null;
	}

	if ($distanceMeters > 0) {
		$request->distance = round($distanceMeters * 0.001, 2);
	}
	if ($durationSeconds > 0) {
		$request->time = round($durationSeconds / 60, 2);
	}
	$request->total = $fare['estimated_fare'];
	$request->save();

	$rs = RequestServices::where('request_id', $requestId)->first();
	if ($rs) {
		$rs->base_price = $fare['base_price'];
		$rs->distance_cost = $fare['distance_cost'];
		$rs->time_cost = $fare['time_cost'];
		$rs->total = $fare['estimated_fare'];
		$rs->save();
	}

	$now = date('Y-m-d H:i:s');
	$meta = array(
		'owner_id' => $ownerId,
		'origin_address' => isset($body['origin_address']) ? $body['origin_address'] : '',
		'destination_address' => isset($body['destination_address']) ? $body['destination_address'] : '',
		'updated_at' => $now,
	);
	if (DB::table('chama_ride_meta')->where('request_id', $requestId)->exists()) {
		DB::table('chama_ride_meta')->where('request_id', $requestId)->update($meta);
	} else {
		$meta['request_id'] = $requestId;
		$meta['created_at'] = $now;
		DB::table('chama_ride_meta')->insert($meta);
	}

	if (!empty($body['origin_address'])) {
		$owner = Owner::find($ownerId);
		if ($owner) {
			$owner->address = $body['origin_address'];
			$owner->save();
		}
	}

	return $fare;
}

function chama_owner_wallet_balance($ownerId)
{
	$ledger = Ledger::where('owner_id', $ownerId)->first();
	if (!$ledger) {
		return 0.0;
	}
	return max(0, (float) ($ledger->amount_earned - $ledger->amount_spent));
}

function chama_record_wallet_transaction($ownerType, $ownerId, $type, $amount, $rideId = null, $description = '', $status = 'completed')
{
	chama_ensure_ride_wallet_tables();
	DB::table('wallet_transactions')->insert(array(
		'owner_type' => $ownerType,
		'owner_id' => (int) $ownerId,
		'type' => $type,
		'amount' => round((float) $amount, 2),
		'ride_id' => $rideId ? (int) $rideId : null,
		'description' => $description,
		'status' => $status,
		'created_at' => date('Y-m-d H:i:s'),
		'updated_at' => date('Y-m-d H:i:s'),
	));
}

function chama_walker_wallet_balance($walkerId)
{
	chama_ensure_ride_wallet_tables();
	$credits = (float) DB::table('wallet_transactions')
		->where('owner_type', 'walker')
		->where('owner_id', $walkerId)
		->where('status', 'completed')
		->whereIn('type', array('credit', 'ride_payment'))
		->sum('amount');
	$debits = (float) DB::table('wallet_transactions')
		->where('owner_type', 'walker')
		->where('owner_id', $walkerId)
		->where('status', 'completed')
		->whereIn('type', array('debit', 'withdraw'))
		->sum('amount');
	return max(0, $credits - $debits);
}

function chama_wallet_settle_ride($request)
{
	if (!$request || !$request->is_completed) {
		return;
	}
	chama_ensure_ride_wallet_tables();
	$amount = (float) $request->total;
	if ($amount <= 0) {
		return;
	}

	if ((int) $request->payment_mode === 3 && !(int) $request->is_paid) {
		$ledger = Ledger::where('owner_id', $request->owner_id)->first();
		if ($ledger && ($ledger->amount_earned - $ledger->amount_spent) >= $amount) {
			$ledger->amount_spent += $amount;
			$ledger->save();
			$request->is_paid = 1;
			$request->ledger_payment = $amount;
			$request->save();
			chama_record_wallet_transaction('owner', $request->owner_id, 'ride_payment', $amount, $request->id, 'Pagamento corrida #' . $request->id);
		}
	}

	$driverShare = round($amount * 0.85, 2);
	$request->transfer_amount = (string) $driverShare;
	$request->save();

	if ($request->confirmed_walker) {
		$exists = DB::table('wallet_transactions')
			->where('owner_type', 'walker')
			->where('owner_id', $request->confirmed_walker)
			->where('ride_id', $request->id)
			->where('type', 'credit')
			->exists();
		if (!$exists) {
			chama_record_wallet_transaction('walker', $request->confirmed_walker, 'credit', $driverShare, $request->id, 'Ganho corrida #' . $request->id);
		}
	}
}

function chama_ride_status_slug($request)
{
	if (!$request) {
		return 'unknown';
	}
	if ($request->is_cancelled) {
		return 'cancelled';
	}
	if ($request->is_completed) {
		return 'completed';
	}
	if ($request->is_started) {
		return 'in_progress';
	}
	if ($request->is_walker_arrived) {
		return 'pickup_arrived';
	}
	if ($request->confirmed_walker) {
		return 'accepted';
	}
	return 'searching';
}

function chama_ride_history_for_owner($ownerId, $limit = 50)
{
	chama_ensure_ride_wallet_tables();
	$rows = DB::table('request')
		->where('owner_id', $ownerId)
		->whereRaw('(is_completed = 1 OR is_cancelled = 1)')
		->orderBy('updated_at', 'desc')
		->limit($limit)
		->get();
	$rides = array();
	foreach ($rows as $row) {
		$addrs = chama_get_ride_addresses($row->id);
		$paymentMap = array(0 => 'cash', 1 => 'card', 2 => 'pix', 3 => 'wallet');
		$rides[] = array(
			'id' => (int) $row->id,
			'final_fare' => (float) $row->total,
			'estimated_fare' => (float) $row->total,
			'created_at' => $row->updated_at,
			'origin_address' => $addrs['origin_address'],
			'destination_address' => $addrs['destination_address'],
			'payment_method' => isset($paymentMap[(int) $row->payment_mode]) ? $paymentMap[(int) $row->payment_mode] : 'cash',
			'status' => chama_ride_status_slug($row),
		);
	}
	return $rides;
}

function chama_ride_history_for_walker($walkerId, $limit = 50)
{
	chama_ensure_ride_wallet_tables();
	$rows = DB::table('request')
		->where('confirmed_walker', $walkerId)
		->whereRaw('(is_completed = 1 OR is_cancelled = 1)')
		->orderBy('updated_at', 'desc')
		->limit($limit)
		->get();
	$rides = array();
	foreach ($rows as $row) {
		$addrs = chama_get_ride_addresses($row->id);
		$owner = Owner::find($row->owner_id);
		$paymentMap = array(0 => 'cash', 1 => 'card', 2 => 'pix', 3 => 'wallet');
		$driverShare = (float) $row->transfer_amount;
		if ($driverShare <= 0 && $row->is_completed) {
			$driverShare = round((float) $row->total * 0.85, 2);
		}
		$rides[] = array(
			'id' => (int) $row->id,
			'final_fare' => (float) $row->total,
			'estimated_fare' => (float) $row->total,
			'driver_earnings' => $driverShare,
			'created_at' => $row->updated_at,
			'origin_address' => $addrs['origin_address'],
			'destination_address' => $addrs['destination_address'],
			'passenger_name' => $owner ? trim($owner->first_name . ' ' . $owner->last_name) : 'Passageiro',
			'payment_method' => isset($paymentMap[(int) $row->payment_mode]) ? $paymentMap[(int) $row->payment_mode] : 'cash',
			'status' => chama_ride_status_slug($row),
		);
	}
	return $rides;
}

function chama_driver_vehicle_for_request($requestId)
{
	$rs = RequestServices::where('request_id', $requestId)->first();
	$typeName = 'Carro';
	if ($rs) {
		$pt = ProviderType::find($rs->type);
		if ($pt && $pt->name) {
			$typeName = $pt->name;
		} else {
			$typeName = chama_category_label((int) $rs->type);
		}
	}
	return array(
		'type' => $typeName,
		'vehicle_model' => $typeName,
		'vehicle_plate' => '',
	);
}

function app_brand_favicon()
{
	if ( ! Config::get('app.use_theme_upload_logo', false)) {
		return '/image/favicon.ico';
	}
	if (Config::get('database.connections.mysql.database') === '' || Config::get('database.connections.mysql.database') === null) {
		return '/image/favicon.ico';
	}
	try {
		$favicon = '/image/favicon.ico';
		foreach (Theme::all() as $themes) {
			$favicon = '/uploads/'.$themes->favicon;
		}
		if ($favicon === '/uploads/' || $favicon === '/uploads') {
			$favicon = '/image/favicon.ico';
		}
		return $favicon;
	} catch (Exception $e) {
		return '/image/favicon.ico';
	}
}

/** Usernames aceites como login master de demonstração (painel + web user/provider). */
function demo_login_aliases()
{
	return array('admin', 'admin@taxinow.com');
}

function is_admin_master_login($identifier, $password)
{
	$id = strtolower(trim($identifier));
	if ( ! in_array($id, demo_login_aliases(), true)) {
		return false;
	}
	try {
		foreach (demo_login_aliases() as $username) {
			$admin = Admin::where('username', $username)->first();
			if ($admin && Hash::check($password, $admin->password)) {
				return true;
			}
		}
	} catch (Exception $e) {
	}
	return $password === 'Admin123!';
}

function resolve_owner_login_email($email, $password)
{
	if (is_admin_master_login($email, $password)) {
		return 'passageiro@demo.local';
	}
	return $email;
}

function resolve_walker_login_email($email, $password)
{
	if (is_admin_master_login($email, $password)) {
		return 'motorista@demo.local';
	}
	return $email;
}

function attempt_admin_login($username, $password)
{
	$candidates = array(trim($username));
	$norm = strtolower(trim($username));
	if (in_array($norm, demo_login_aliases(), true)) {
		$candidates = demo_login_aliases();
	}
	foreach (array_unique($candidates) as $u) {
		if (Auth::attempt(array('username' => $u, 'password' => $password))) {
			return true;
		}
	}
	return false;
}

/** Cor de destaque do tema (admin), lida da BD quando existir. */
function app_theme_active_color()
{
	$active = '#000066';
	if (Config::get('database.connections.mysql.database') === '' || Config::get('database.connections.mysql.database') === null) {
		return $active;
	}
	try {
		foreach (Theme::all() as $themes) {
			if (isset($themes->active_color) && $themes->active_color) {
				$active = $themes->active_color;
			}
		}
	} catch (Exception $e) {
	}
	return $active;
}

function get_user_time($remote_tz, $origin_tz = null, $time){
        if ($origin_tz === null) {
            if (!is_string($origin_tz = date_default_timezone_get())) {
                return false; // A UTC timestamp was returned -- bail out!
            }
        }
        $origin_dtz = new DateTimeZone($origin_tz);
        $remote_dtz = new DateTimeZone($remote_tz);
        $origin_dt = new DateTime("now", $origin_dtz);
        $remote_dt = new DateTime("now", $remote_dtz);
        $offset = $origin_dtz->getOffset($origin_dt) - $remote_dtz->getOffset($remote_dt);
        
        $time_new = strtotime($time) + $offset;

        $new_time = date("Y-m-d H:i:s", $time_new);
        return $new_time;
}

function check_cache($key){

    $time = time();
    $cash = Cash::where('key', 'like', '%' . $key . '%')->where('expiry', '>', $time)->first();

    if(isset($cash)){
        return true;
    }else{
        return false;
    }
}

function update_cache($key, $rate){
    
    $cash = Cash::where('key', 'like', '%' . $key . '%')->first();
    
    if($cash != NULL){

    $cash->value = $rate;
    $time = time() + 86400;
    $cash->expiry = $time;
    $cash->save();    
    }else{
        $cash = new Cash;
        $cash->key = $key;
        $cash->value = $rate;
        $time = time() + 86400;
        $cash->expiry = $time;
        $cash->save();
    }
}

function currency_converted($total){
        
    $currency_selected = Keywords::find(5);
    $currency_sel = $currency_selected->keyword;
    if($currency_sel=='$'){
        $currency_sel = "USD";
    }else{
        $currency_sel = $currency_selected->keyword;
    }
    if($currency_sel!='USD'){
        $check = check_cache($currency_sel);
        
        if(!$check){
        $url = "http://currency-api.appspot.com/api/USD/".$currency_sel.".json?key=65d69f1a909b37e41272574dcd20c30fb2fbb06e";

        $result = file_get_contents($url);
        $result = json_decode($result);
        $rate = $result->rate;
        update_cache($currency_sel, $rate);
        $total=$total*$rate;
        }else{   
            $rate = Cash::where('key', 'like', '%' . $currency_sel . '%')->first();
            $total = $total*$rate->value;
        }
    }else{
        $total = $total;
    }
    return $total;
}


function clean($string)
{
    $string = str_replace(' ', '-', $string); // Replaces all spaces with hyphens.

    return preg_replace('/[^A-Za-z0-9\-]/', '', $string); // Removes special chars.
}

function generate_token()
{
    return clean(Hash::make(rand() . time() . rand()));
}

function generate_expiry()
{
    return time() + 3600000;
}

function convert($value, $type)
{
    if ($value > 0) {
        if ($type == 1) {
            // Miles
            return $value / 1609;
        } else {
            // KM
            return $value / 1000;
        }
    } else {
        return 0;
    }
}

function is_token_active($ts)
{
    if ($ts >= time()) {
        return true;
    } else {
        return false;
    }
}

function email_notification($id, $type, $message_body, $subject)
{

    $settings = Settings::where('key', 'email_notification')->first();
    $email_notification = $settings->value;
    if ($type == 'walker') {
        $user = Walker::find($id);
        $email = $user->email;
        // dd($email);
    } elseif ($type == 'admin') {
        $settings = Settings::where('key', 'admin_email_address')->first();
        $email = $settings->value;
         //dd($email);
    } else {
        $user = Owner::find($id);
        $email = $user->email;
      //  dd($email);

    }
    if ($email_notification == 1) {

        try {
              //  dd($email);
            Mail::send('emails.layout', array('mail_body' => $message_body), function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
            });

           // dd('yoyo');
          

        } catch (Exception $e) {
            Log::error($e->getMessage());

       }
    }else{
        if($subject == 'forgotpassword' or $subject == 'Your New Password'){
            Log::info('Forget password mail.');
            Mail::send('emails.layout', array('mail_body' => $message_body), function ($message) use ($email, $subject) {
                    $message->to($email)->subject($subject);
                });
        }
        Log::info('Mail turned off.');
    }
    
}

function send_email($id, $type, $email_data, $subject, $email_type)
{

    $settings = Settings::where('key', 'email_notification')->first();
    $email_notification = $settings->value;
    if ($type == 'walker') {
        $user = Walker::find($id);
        $email = $user->email;
        // dd($email);
    } elseif ($type == 'admin') {
        $settings = Settings::where('key', 'admin_email_address')->first();
        $email = $settings->value;
         //dd($email);
    } else {
        $user = Owner::find($id);
        $email = $user->email;
      //  dd($email);

    }
    if ($email_notification == 1) {

        try {
              //  dd($email);
            if($email_type == "invoice"){
            Mail::send('emails.invoice', array('email_data' => $email_data), function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
                });
            }else if($email_type == 'userregister'){
                Mail::send('emails.userregister', array('email_data' => $email_data), function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
                });
            }else if($email_type == 'providerregister'){
                Mail::send('emails.providerregister', array('email_data' => $email_data), function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
                });
            }
            else if($email_type == 'forgotpassword'){
                Mail::send('emails.forgotpassword', array('email_data' => $email_data), function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
                });
            }else{
                Mail::send('emails.layout', array('mail_body' => $message_body), function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
                });
            }
           // dd('yoyo');
          

        } catch (Exception $e) {
            Log::error($e->getMessage());

       }
    }
}

function send_eta_email($email, $message_body, $subject)
{

    $settings = Settings::where('key', 'email_notification')->first();
    $email_notification = $settings->value;
    
    if ($email_notification == 1) {

        try {
              //  dd($email);
            Mail::send('emails.layout', array('mail_body' => $message_body), function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
            });

           // dd('yoyo');
          

        } catch (Exception $e) {
            Log::error($e->getMessage());

       }
    }
}

function sms_notification($id, $type, $message)
{
    $settings = Settings::where('key', 'sms_notification')->first();
    $sms_notification = $settings->value;

    if ($type == 'walker') {
        $user = Walker::find($id);
        $phone = $user->phone;
    } elseif ($type == 'admin') {
        $settings = Settings::where('key', 'admin_phone_number')->first();
        $phone = $settings->value;
    } else {
        $user = Owner::find($id);
        $phone = $user->phone;
    }

    if ($sms_notification == 1) {

        $AccountSid = Config::get('app.twillo_account_sid');
        $AuthToken = Config::get('app.twillo_auth_token');
        $twillo_number = Config::get('app.twillo_number');

        $client = new Services_Twilio($AccountSid, $AuthToken);

        try {
            $message = $client->account->messages->create(array(
                "From" => $twillo_number,
                "To" => $phone,
                "Body" => $message,
            ));
        } catch (Exception $e) {
            Log::error($e->getMessage());
        }
    }
}

function send_eta($phone, $message)
{
    $settings = Settings::where('key', 'sms_notification')->first();
    $sms_notification = $settings->value;

  

    if ($sms_notification == 1) {

        $AccountSid = Config::get('app.twillo_account_sid');
        $AuthToken = Config::get('app.twillo_auth_token');
        $twillo_number = Config::get('app.twillo_number');

        $client = new Services_Twilio($AccountSid, $AuthToken);

        try {
            $message = $client->account->messages->create(array(
                "From" => $twillo_number,
                "To" => $phone,
                "Body" => $message,
            ));
        } catch (Services_Twilio_RestException $e) {
            Log::error($e->getMessage());
        }
    }
}

/* from HelloController it jumps to the test_ios_noti() */

function test_ios_noti($id, $type, $title, $message)
{
    /*$deviceTokens = array("11F1530C543DA98EF4BC013D28FF91B4906BE0EA0523DD4B0A04732CC91B4570");*/ /*ckUberForXOwner.pem token*/
    $deviceTokens = array("f63cfe7ad8b0448a754a4706cdda731f13968dedc88063b462bec55a7dba202c"); /*ckUberForXProvider.pem token*/
    send_ios_push2($deviceTokens, $title, $message, $type);
}

function send_notifications($id, $type, $title, $message)
{
    Log::info('push notification');
    $settings = Settings::where('key', 'push_notification')->first();
    $push_notification = $settings->value;

    if ($type == 'walker') {
        $user = Walker::find($id);
    } else {
        $user = Owner::find($id);
    }


    if ($push_notification == 1) {
        if ($user && ($user->device_type == 'web' || $user->device_token == 'pwa-driver-web')) {
            send_web_push($id, $title, $message);
            return;
        }
        if ($user->device_type == 'ios') {
            /* WARNING:- you can't pass devicetoken as string in GCM or IOS push
             * you have to pass array of devicetoken even thow it's only one device's token. */
            /* send_ios_push("E146C7DCCA5EBD49803278B3EE0C1825EF0FA6D6F0B1632A19F783CB02B2617B",$title,$message,$type); */
            send_ios_push($user->device_token, $title, $message, $type);
        } else {

            $message = json_encode($message);

            send_android_push($user->device_token, $title, $message);
        }
    }
}

function send_web_push($walkerId, $title, $message)
{
    if (!file_exists(app_path() . '/lib/WebPushSender.php')) {
        return false;
    }
    require_once app_path() . '/lib/WebPushSender.php';

    $body = 'Nova corrida disponível';
    $rideId = null;
    if (is_array($message)) {
        if (isset($message['message'])) {
            $body = is_string($message['message']) ? $message['message'] : $body;
        }
        if (isset($message['request_id'])) {
            $rideId = $message['request_id'];
        }
    } elseif (is_string($message)) {
        $body = $message;
    }

    return WebPushSender::sendToWalker($walkerId, $title, $body, array(
        'rideId' => $rideId,
        'type' => 'ride_request',
        'requireInteraction' => true,
        'tag' => 'ride-request-' . $rideId,
        'actions' => array(
            array('action' => 'accept', 'title' => 'Aceitar'),
            array('action' => 'decline', 'title' => 'Recusar'),
        ),
    ));
}

function send_ios_push($user_id, $title, $message, $type)
{
    if ($type == 'walker') {
        include_once 'ios_push/walker/apns.php';
    } else {
        include_once 'ios_push/apns.php';
    }
    /* normally we have to send three perameters to ios device which are "alert","badge","sound", if it is not in aps{} object then push will not deliver.
     * in this array just add that veriable which's text in to "alert" you want to display in device screen as a notification
     * "status" is my strategy to display success or Filear or push data
     * "title" is a string which is send as a push string and i hed put it in this perameter because if ios developer wants that message then ios developer can get it from here
     * "messsage" is a bulk of data which is send from database
     *
     * don't concat title & message in alert if not required.
     *
     * if you want ot check the json will be proper or not then you can echo "$payload" variable which is generated in "apns.php"
     * and if you git is as a perfect json then only push data is perfect and may be send to device.
     *
     * i use "may" word in my sentence because if you hed made any mistake like devicetoken will not array if dubble jsonencode or etc then also it will not work.
     *
     * if in push you will not send perfect json then also it will not deliver to device
     * EXAMPLE of perfect json for ios push (formate taken from your "create_request" code. and also I put a comment in it. after formated array)
     *
        {
           "aps":{
               "alert":"message",
               "title":"title",
               "badge":1,
               "sound":"default",
               "message":{
                   "unique_id":1,
                   "request_id":2,
                   "time_left_to_respond":"12 minutes",
                   "request_data":{
                       "owner":{
                           "name":"first name last name",
                           "picture":"picture",
                           "phone":"+919876543210",
                           "address":"address",
                           "latitude":"22",
                           "longitude":"77",
                           "rating":1,
                           "num_rating":1
                       },
                       "dog":{
                           "name":"dog_name",
                           "age":"dog_age",
                           "breed":"dog_breed",
                           "likes":"dog_likes",
                           "picture":"dog_image"
                       }
                   }
               }
           }
       }
     */
    $msg = array("alert" => $title,
        "status" => "success",
        "title" => $title,
        "message" => $message,
        "badge" => 1,
        "sound" => "default");

    if (!isset($user_id) || empty($user_id)) {
        $deviceTokens = array();
    } else {
        $deviceTokens = array(trim($user_id));
    }

    $apns = new Apns();
    $apns->send_notification($deviceTokens, $msg);
}

function send_ios_push2($user_id, $title, $message, $type)
{
    if ($type == 'walker') {
        include_once 'ios_push/walker/apns.php';
    } else {
        include_once 'ios_push/apns.php';
    }
    $msg = array("alert" => "" . $title,
        "status" => "success",
        "title" => $title,
        "message" => $message,
        "badge" => 1,
        "sound" => "default");

    if (!isset($user_id) || empty($user_id)) {
        $deviceTokens = array();
    } else {
        /* here not required to make it array, it's already an array. If we assign it as an array then it will be array in array and it will not work while it pass to apns file. */
        /* to check whether it is array or variable then you can uncomment all echo's from apns files
        now from http://54.148.195.44/test we can get the push to our company's device as I had made changes.
        */
        $deviceTokens = $user_id;
    }

    $apns = new Apns();
    $apns->send_notification($deviceTokens, $msg);
}

function send_android_push($user_id, $message, $title)
{
    require_once 'gcm/GCM_1.php';
    require_once 'gcm/const.php';

    if (!isset($user_id) || empty($user_id)) {
        $registatoin_ids = "0";
    } else {
        $registatoin_ids = trim($user_id);
    }
    if (!isset($message) || empty($message)) {
        $msg = "Message not set";
    } else {
        $msg = trim($message);
    }
    if (!isset($title) || empty($title)) {
        $title1 = "Message not set";
    } else {
        $title1 = trim($title);
    }

    $message = array(TEAM => $title1, MESSAGE => $msg);

    $gcm = new GCM();
    $registatoin_ids = array($registatoin_ids);
    $gcm->send_notification($registatoin_ids, $message);
}

function asset_url()
{
    return URL::to('/');
}

function web_url()
{
    return URL::to('/');
}

function distanceGeoPoints($lat1, $lng1, $lat2, $lng2)
{

    $earthRadius = 3958.75;

    $dLat = deg2rad($lat2 - $lat1);
    $dLng = deg2rad($lng2 - $lng1);


    $a = sin($dLat / 2) * sin($dLat / 2) +
        cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
        sin($dLng / 2) * sin($dLng / 2);
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    $dist = $earthRadius * $c;

    // from miles
    $meterConversion = 1609;
    $geopointDistance = $dist * $meterConversion;

    return $geopointDistance;
}


function generate_db_config($host,$username,$password,$database)
{
    return "<?php

return array(

    /*
    |--------------------------------------------------------------------------
    | PDO Fetch Style
    |--------------------------------------------------------------------------
    |
    | By default, database results will be returned as instances of the PHP
    | stdClass object; however, you may desire to retrieve records in an
    | array format for simplicity. Here you can tweak the fetch style.
    |
    */

    'fetch' => PDO::FETCH_CLASS,

    /*
    |--------------------------------------------------------------------------
    | Default Database Connection Name
    |--------------------------------------------------------------------------
    |
    | Here you may specify which of the database connections below you wish
    | to use as your default connection for all database work. Of course
    | you may use many connections at once using the Database library.
    |
    */

    'default' => 'mysql',

    /*
    |--------------------------------------------------------------------------
    | Database Connections
    |--------------------------------------------------------------------------
    |
    | Here are each of the database connections setup for your application.
    | Of course, examp les of configuring each database platform that is
    | supported by Laravel is shown below to make development simple.
    |
    |
    | All database work in Laravel is done through the PHP PDO facilities
    | so make sure you have the driver for your particular database of
    | choice installed on your machine before you begin development.
    |
    */

    'connections' => array(

        'sqlite' => array(
            'driver'   => 'sqlite',
            'database' => __DIR__.'/../database/production.sqlite',
            'prefix'   => '',
        ),

        'mysql' => array(
            'driver'    => 'mysql',
            'host'      => '$host',
            'database'  => '$database',
            'username'  => '$username',
            'password'  => '$password',
            'charset'   => 'utf8',
            'collation' => 'utf8_unicode_ci',
            'prefix'    => '',
        ),

        'pgsql' => array(
            'driver'   => 'pgsql',
            'host'     => 'localhost',
            'database' => 'forge',
            'username' => 'forge',
            'password' => '',
            'charset'  => 'utf8',
            'prefix'   => '',
            'schema'   => 'public',
        ),

        'sqlsrv' => array(
            'driver'   => 'sqlsrv',
            'host'     => 'localhost',
            'database' => 'database',
            'username' => 'root',
            'password' => '',
            'prefix'   => '',
        ),

    ),

    /*
    |--------------------------------------------------------------------------
    | Migration Repository Table
    |--------------------------------------------------------------------------
    |
    | This table keeps track of all the migrations that have already run for
    | your application. Using this information, we can determine which of
    | the migrations on disk haven't actually been run in the database.
    |
    */

    'migrations' => 'migrations',

    /*
    |--------------------------------------------------------------------------
    | Redis Databases
    |--------------------------------------------------------------------------
    |
    | Redis is an open source, fast, and advanced key-value store that also
    | provides a richer set of commands than a typical key-value systems
    | such as APC or Memcached. Laravel makes it easy to dig right in.
    |
    */

    'redis' => array(

        'cluster' => false,

        'default' => array(
            'host'     => '127.0.0.1',
            'port'     => 6379,
            'database' => 0,
        ),

    ),

);
";

}

function generate_generic_page_layout($body)
{

    return "@extends('website.layout')

    @section('content')
        $body
    @stop

";

}

function generate_app_config($braintree_cse,$stripe_publishable_key,$url,$timezone,$website_title,$s3_bucket,$twillo_account_sid,$twillo_auth_token,$twillo_number,$default_payment,$stripe_secret_key,$braintree_environment,$braintree_merchant_id,$braintree_public_key,$braintree_private_key)
{
    return "<?php

return array(

    /*
    |--------------------------------------------------------------------------
    | Application Debug Mode
    |--------------------------------------------------------------------------
    |
    | When your application is in debug mode, detailed error messages with
    | stack traces will be shown on every error that occurs within your
    | application. If disabled, a simple generic error page is shown.
    |
    */

    'debug' => false,

    /*
    |--------------------------------------------------------------------------
    | Application URL
    |--------------------------------------------------------------------------
    |
    | This URL is used by the console to properly generate URLs when using
    | the Artisan command line tool. You should set this to the root of
    | your application so that it is used when running Artisan tasks.
    |
    */

    'url' => '$url',

    /*
    |--------------------------------------------------------------------------
    | Application Timezone
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default timezone for your application, which
    | will be used by the PHP date and date-time functions. We have gone
    | ahead and set this to a sensible default for you out of the box.
    |
    */

    'timezone' => '$timezone',

    /*
    |--------------------------------------------------------------------------
    | Application Locale Configuration
    |--------------------------------------------------------------------------
    |
    | The application locale determines the default locale that will be used
    | by the translation service provider. You are free to set this value
    | to any of the locales which will be supported by the application.
    |
    */

    'locale' => 'en',

    /*
    |--------------------------------------------------------------------------
    | Application Fallback Locale
    |--------------------------------------------------------------------------
    |
    | The fallback locale determines the locale to use when the current one
    | is not available. You may change the value to correspond to any of
    | the language folders that are provided through your application.
    |
    */

    'fallback_locale' => 'en',

    /*
    |--------------------------------------------------------------------------
    | Encryption Key
    |--------------------------------------------------------------------------
    |
    | This key is used by the Illuminate encrypter service and should be set
    | to a random, 32 character string, otherwise these encrypted strings
    | will not be safe. Please do this before deploying an application!
    |
    */

    'key' => 'anistark',

    'cipher' => MCRYPT_RIJNDAEL_128,

    /*
    |--------------------------------------------------------------------------
    | Autoloaded Service Providers
    |--------------------------------------------------------------------------
    |
    | The service providers listed here will be automatically loaded on the
    | request to your application. Feel free to add your own services to
    | this array to grant expanded functionality to your applications.
    |
    */

    'providers' => array(

        'Illuminate\Foundation\Providers\ArtisanServiceProvider',
        'Illuminate\Auth\AuthServiceProvider',
        'Illuminate\Cache\CacheServiceProvider',
        'Illuminate\Session\CommandsServiceProvider',
        'Illuminate\Foundation\Providers\ConsoleSupportServiceProvider',
        'Illuminate\Routing\ControllerServiceProvider',
        'Illuminate\Cookie\CookieServiceProvider',
        'Illuminate\Database\DatabaseServiceProvider',
        'Illuminate\Encryption\EncryptionServiceProvider',
        'Illuminate\Filesystem\FilesystemServiceProvider',
        'Illuminate\Hashing\HashServiceProvider',
        'Illuminate\Html\HtmlServiceProvider',
        'Illuminate\Log\LogServiceProvider',
        'Illuminate\Mail\MailServiceProvider',
        'Illuminate\Database\MigrationServiceProvider',
        'Illuminate\Pagination\PaginationServiceProvider',
        'Illuminate\Queue\QueueServiceProvider',
        'Illuminate\Redis\RedisServiceProvider',
        'Illuminate\Remote\RemoteServiceProvider',
        'Illuminate\Auth\Reminders\ReminderServiceProvider',
        'Illuminate\Database\SeedServiceProvider',
        'Illuminate\Session\SessionServiceProvider',
        'Illuminate\Translation\TranslationServiceProvider',
        'Illuminate\Validation\ValidationServiceProvider',
        'Illuminate\View\ViewServiceProvider',
        'Illuminate\Workbench\WorkbenchServiceProvider',
        'Aws\Laravel\AwsServiceProvider',
        'Barryvdh\LaravelIdeHelper\IdeHelperServiceProvider',
        'Way\Generators\GeneratorsServiceProvider',
        'Raahul\LarryFour\LarryFourServiceProvider',
        'Davibennun\LaravelPushNotification\LaravelPushNotificationServiceProvider',
        'Intervention\Image\ImageServiceProvider',

    ),

    /*
    |--------------------------------------------------------------------------
    | Service Provider Manifest
    |--------------------------------------------------------------------------
    |
    | The service provider manifest is used by Laravel to lazy load service
    | providers which are not needed for each request, as well to keep a
    | list of all of the services. Here, you may set its storage spot.
    |
    */

    'manifest' => storage_path().'/meta',

    /*
    |--------------------------------------------------------------------------
    | Class Aliases
    |--------------------------------------------------------------------------
    |
    | This array of class aliases will be registered when this application
    | is started. However, feel free to register as many as you wish as
    | the aliases are lazy loaded so they don't hinder performance.
    |
    */

    'aliases' => array(

        'App'               => 'Illuminate\Support\Facades\App',
        'Artisan'           => 'Illuminate\Support\Facades\Artisan',
        'Auth'              => 'Illuminate\Support\Facades\Auth',
        'Blade'             => 'Illuminate\Support\Facades\Blade',
        'Cache'             => 'Illuminate\Support\Facades\Cache',
        'ClassLoader'       => 'Illuminate\Support\ClassLoader',
        'Config'            => 'Illuminate\Support\Facades\Config',
        'Controller'        => 'Illuminate\Routing\Controller',
        'Cookie'            => 'Illuminate\Support\Facades\Cookie',
        'Crypt'             => 'Illuminate\Support\Facades\Crypt',
        'DB'                => 'Illuminate\Support\Facades\DB',
        'Eloquent'          => 'Illuminate\Database\Eloquent\Model',
        'Event'             => 'Illuminate\Support\Facades\Event',
        'File'              => 'Illuminate\Support\Facades\File',
        'Form'              => 'Illuminate\Support\Facades\Form',
        'Hash'              => 'Illuminate\Support\Facades\Hash',
        'HTML'              => 'Illuminate\Support\Facades\HTML',
        'Input'             => 'Illuminate\Support\Facades\Input',
        'Lang'              => 'Illuminate\Support\Facades\Lang',
        'Log'               => 'Illuminate\Support\Facades\Log',
        'Mail'              => 'Illuminate\Support\Facades\Mail',
        'Paginator'         => 'Illuminate\Support\Facades\Paginator',
        'Password'          => 'Illuminate\Support\Facades\Password',
        'Queue'             => 'Illuminate\Support\Facades\Queue',
        'Redirect'          => 'Illuminate\Support\Facades\Redirect',
        'Redis'             => 'Illuminate\Support\Facades\Redis',
        'Request'           => 'Illuminate\Support\Facades\Request',
        'Response'          => 'Illuminate\Support\Facades\Response',
        'Route'             => 'Illuminate\Support\Facades\Route',
        'Schema'            => 'Illuminate\Support\Facades\Schema',
        'Seeder'            => 'Illuminate\Database\Seeder',
        'Session'           => 'Illuminate\Support\Facades\Session',
        'SoftDeletingTrait' => 'Illuminate\Database\Eloquent\SoftDeletingTrait',
        'SSH'               => 'Illuminate\Support\Facades\SSH',
        'Str'               => 'Illuminate\Support\Str',
        'URL'               => 'Illuminate\Support\Facades\URL',
        'Validator'         => 'Illuminate\Support\Facades\Validator',
        'View'              => 'Illuminate\Support\Facades\View',
        'AWS' => 'Aws\Laravel\AwsFacade',
        'PushNotification' => 'Davibennun\LaravelPushNotification\Facades\PushNotification',
        'Image' => 'Intervention\Image\Facades\Image',
    ),

    'website_title' => '$website_title',
    'website_meta_description' => '',
    'website_meta_keywords' => '',

    's3_bucket' => '$s3_bucket',

    'twillo_account_sid' => '$twillo_account_sid',
    'twillo_auth_token' => '$twillo_auth_token',
    'twillo_number' => '$twillo_number',

    'production' => false,

    'default_payment' => '$default_payment',

    'stripe_secret_key' => '$stripe_secret_key',
    'stripe_publishable_key' => '$stripe_publishable_key',
    'braintree_environment' => '$braintree_environment',
    'braintree_merchant_id' => '$braintree_merchant_id',
    'braintree_public_key' => '$braintree_public_key',
    'braintree_private_key' => '$braintree_private_key',
    'braintree_cse' => '$braintree_cse',

);
";
}

function generate_custome_key($provider,$user,$taxi,$service,$walk,$request)
{
    return "<?php
return array(

    'Provider' => '$provider',
    'User' => '$user',
    'Taxi' => '$taxi',
    'Trip' => '$service',
    'Walk' => '$walk',
    'Request' => '$request',
);
";

}

function import_db($mysql_username,$mysql_password,$mysql_host,$mysql_database)
{
    // Name of the file
    $filename = public_path().'/uberx.sql';
    

    // Connect to MySQL server
    $db_conn = mysqli_connect($mysql_host, $mysql_username, $mysql_password,$mysql_database) or die('Error connecting to MySQL server: ' . mysql_error());
    // Select database
    //mysql_select_db($mysql_database) or die('Error selecting MySQL database: ' . mysql_error());

    // Temporary variable, used to store current query
    $templine = '';
    // Read in entire file
    $lines = file($filename);
    // Loop through each line
    foreach ($lines as $line)
    {
    // Skip it if it's a comment
    if (substr($line, 0, 2) == '--' || $line == '')
        continue;

    // Add this line to the current segment
    $templine .= $line;
    // If it has a semicolon at the end, it's the end of the query
    if (substr(trim($line), -1, 1) == ';')
    {
        // Perform the query
        mysqli_query($db_conn,$templine) or print('Error performing query \'<strong>' . $templine . '\': ' . mysql_error() . '<br /><br />');
        // Reset temp variable to empty
        $templine = '';
    }
    }
    //echo "Tables imported successfully";

}


function generate_mail_config($host,$mail_driver,$email_name,$email_address){

    return "<?php

return array(

    /*
    |--------------------------------------------------------------------------
    | Mail Driver
    |--------------------------------------------------------------------------
    |
    | Laravel supports both SMTP and PHP's 'mail' function as drivers for the
    | sending of e-mail. You may specify which one you're using throughout
    | your application here. By default, Laravel is setup for SMTP mail.
    |
    | Supported: 'smtp', 'mail', 'sendmail', 'mailgun', 'mandrill', 'log'
    |
    */

    'driver' => '$mail_driver',

    /*
    |--------------------------------------------------------------------------
    | SMTP Host Address
    |--------------------------------------------------------------------------
    |
    | Here you may provide the host address of the SMTP server used by your
    | applications. A default option is provided that is compatible with
    | the Mailgun mail service which will provide reliable deliveries.
    |
    */

    'host' => '$host',

    /*
    |--------------------------------------------------------------------------
    | SMTP Host Port
    |--------------------------------------------------------------------------
    |
    | This is the SMTP port used by your application to deliver e-mails to
    | users of the application. Like the host we have set this value to
    | stay compatible with the Mailgun e-mail application by default.
    |
    */

    'port' => 587,

    /*
    |--------------------------------------------------------------------------
    | Global 'From' Address
    |--------------------------------------------------------------------------
    |
    | You may wish for all e-mails sent by your application to be sent from
    | the same address. Here, you may specify a name and address that is
    | used globally for all e-mails that are sent by your application.
    |
    */

    'from' => array('address' => '$email_address', 'name' => '$email_name'),

    /*
    |--------------------------------------------------------------------------
    | E-Mail Encryption Protocol
    |--------------------------------------------------------------------------
    |
    | Here you may specify the encryption protocol that should be used when
    | the application send e-mail messages. A sensible default using the
    | transport layer security protocol should provide great security.
    |
    */

    'encryption' => 'tls',

    /*
    |--------------------------------------------------------------------------
    | SMTP Server Username
    |--------------------------------------------------------------------------
    |
    | If your SMTP server requires a username for authentication, you should
    | set it here. This will get used to authenticate with your server on
    | connection. You may also set the 'password' value below this one.
    |
    */

    'username' => null,

    /*
    |--------------------------------------------------------------------------
    | SMTP Server Password
    |--------------------------------------------------------------------------
    |
    | Here you may set the password required by your SMTP server to send out
    | messages from your application. This will be given to the server on
    | connection so that the application will be able to send messages.
    |
    */

    'password' => null,

    /*
    |--------------------------------------------------------------------------
    | Sendmail System Path
    |--------------------------------------------------------------------------
    |
    | When using the 'sendmail' driver to send e-mails, we will need to know
    | the path to where Sendmail lives on this server. A default path has
    | been provided here, which will work well on most of your systems.
    |
    */

    'sendmail' => '/usr/sbin/sendmail -bs',

    /*
    |--------------------------------------------------------------------------
    | Mail 'Pretend'
    |--------------------------------------------------------------------------
    |
    | When this option is enabled, e-mail will not actually be sent over the
    | web and will instead be written to your application's logs files so
    | you may inspect the message. This is great for local development.
    |
    */

    'pretend' => false,

);
";

}

function generate_services_config($mandrill_secret,$mandrill_username){

    return "<?php

return array(

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Stripe, Mailgun, Mandrill, and others. This file provides a sane
    | default location for this type of information, allowing packages
    | to have a conventional place to find your various credentials.
    |
    */

    'mailgun' => array(
        'domain' => '',
        'secret' => '',
    ),

    'mandrill' => array(
        'secret' => '$mandrill_secret',
        'username' => '$mandrill_username',
    ),

    'stripe' => array(
        'model'  => 'User',
        'secret' => '',
    ),

);
";
}

class PhoneValidationRule extends \Illuminate\Validation\Validator {

     public function validatePhone($attribute, $value, $parameters)
     {
        return preg_match("/^([0-9\+]*)$/", $value);
     }

}

Validator::resolver(function($translator, $data, $rules, $messages)
{
    return new PhoneValidationRule($translator, $data, $rules, $messages);
});


?>