<?php

class ApiRiderController extends ApiBaseController
{
	public function login()
	{
		$body = $this->jsonInput();
		Input::merge(array(
			'email' => isset($body['email']) ? $body['email'] : '',
			'password' => isset($body['password']) ? $body['password'] : '',
			'login_by' => 'manual',
			'device_type' => 'android',
			'device_token' => isset($body['device_token']) ? $body['device_token'] : 'pwa-rider-web',
		));

		$data = $this->decodeLegacyResponse((new OwnerController())->login());
		if (empty($data['success'])) {
			return $this->jsonError(isset($data['error']) ? $data['error'] : 'Credenciais inválidas', 401);
		}

		$ledger = Ledger::where('owner_id', $data['id'])->first();
		$balance = 0;
		if ($ledger) {
			$balance = (float) ($ledger->amount_earned - $ledger->amount_spent);
		}

		return Response::json(array(
			'token' => $data['token'],
			'user' => array(
				'id' => (int) $data['id'],
				'first_name' => $data['first_name'],
				'last_name' => isset($data['last_name']) ? $data['last_name'] : '',
				'email' => $data['email'],
				'phone' => isset($data['phone']) ? $data['phone'] : '',
				'avatar' => isset($data['picture']) ? $data['picture'] : '',
				'wallet_balance' => $balance,
			),
		));
	}

	public function register()
	{
		$body = $this->jsonInput();
		Input::merge(array(
			'first_name' => isset($body['first_name']) ? $body['first_name'] : '',
			'last_name' => isset($body['last_name']) ? $body['last_name'] : '',
			'email' => isset($body['email']) ? $body['email'] : '',
			'phone' => isset($body['phone']) ? $body['phone'] : '',
			'password' => isset($body['password']) ? $body['password'] : '',
			'login_by' => 'manual',
			'device_type' => 'android',
			'device_token' => 'pwa-rider-web',
		));

		$data = $this->decodeLegacyResponse((new OwnerController())->register());
		if (empty($data['success'])) {
			return $this->jsonError(isset($data['error']) ? $data['error'] : 'Erro ao registrar', 422);
		}

		return Response::json(array(
			'token' => $data['token'],
			'user' => array(
				'id' => (int) $data['id'],
				'first_name' => $data['first_name'],
				'last_name' => isset($data['last_name']) ? $data['last_name'] : '',
				'email' => $data['email'],
				'phone' => isset($body['phone']) ? $body['phone'] : '',
			),
		));
	}

	public function logout()
	{
		return Response::json(array('success' => true));
	}

	public function location()
	{
		$owner = $this->ownerFromBearer();
		if (!$owner) {
			return $this->jsonError('Não autorizado', 401);
		}
		$body = $this->jsonInput();
		Input::merge(array(
			'token' => $owner->token,
			'id' => $owner->id,
			'latitude' => isset($body['latitude']) ? $body['latitude'] : 0,
			'longitude' => isset($body['longitude']) ? $body['longitude'] : 0,
		));
		$data = $this->decodeLegacyResponse((new DogController())->set_location());
		if (empty($data['success'])) {
			return $this->jsonError(isset($data['error']) ? $data['error'] : 'Erro', 400);
		}
		return Response::json(array('success' => true));
	}

	public function requestRide()
	{
		$owner = $this->ownerFromBearer();
		if (!$owner) {
			return $this->jsonError('Não autorizado', 401);
		}
		$body = $this->jsonInput();
		$categoryId = chama_category_id_from_body($body);
		$serviceType = chama_resolve_service_type($categoryId);
		$paymentMode = $this->paymentModeFromString(isset($body['payment_method']) ? $body['payment_method'] : 'cash');

		$distanceMeters = isset($body['distance_meters']) ? (float) $body['distance_meters'] : 0;
		$durationSeconds = isset($body['duration_seconds']) ? (float) $body['duration_seconds'] : 0;
		$farePreview = chama_calculate_fare($distanceMeters, $durationSeconds, $categoryId);

		if ($paymentMode === 3 && chama_owner_wallet_balance($owner->id) < $farePreview['estimated_fare']) {
			return $this->jsonError('Saldo insuficiente na carteira', 422);
		}

		chama_cancel_stale_unaccepted_rides($owner->id);
		chama_cancel_owner_pending_rides($owner->id);

		Input::merge(array(
			'token' => $owner->token,
			'id' => $owner->id,
			'latitude' => isset($body['origin_lat']) ? $body['origin_lat'] : (isset($body['latitude']) ? $body['latitude'] : $owner->latitude),
			'longitude' => isset($body['origin_lng']) ? $body['origin_lng'] : (isset($body['longitude']) ? $body['longitude'] : $owner->longitude),
			'd_latitude' => isset($body['dest_lat']) ? $body['dest_lat'] : null,
			'd_longitude' => isset($body['dest_lng']) ? $body['dest_lng'] : null,
			'type' => $serviceType,
			'payment_mode' => $paymentMode,
		));

		$data = $this->decodeLegacyResponse((new DogController())->create_request());
		if (empty($data['success'])) {
			return $this->jsonError(isset($data['error']) ? $data['error'] : 'Erro ao solicitar corrida', 422);
		}

		$rideId = isset($data['request_id']) ? $data['request_id'] : null;
		if ($rideId) {
			chama_persist_ride_quote($rideId, $owner->id, $body);
			$originLat = isset($body['origin_lat']) ? $body['origin_lat'] : $owner->latitude;
			$originLng = isset($body['origin_lng']) ? $body['origin_lng'] : $owner->longitude;
			$dispatched = chama_broadcast_ride($rideId, $originLat, $originLng, $serviceType);
			if ($dispatched <= 0) {
				return $this->jsonError('Nenhum motorista online no momento. Tente novamente em instantes.', 422);
			}
		}

		$request = $rideId ? Requests::find($rideId) : null;
		return Response::json(array(
			'ride' => $request
				? $this->ridePayloadFromRequest($request)
				: $this->buildRidePayload($rideId, $owner, $body, $farePreview),
		));
	}

	public function getRide()
	{
		$id = $this->routeRideId();
		$owner = $this->ownerFromBearer();
		if (!$owner) {
			return $this->jsonError('Não autorizado', 401);
		}

		$request = Requests::find($id);
		if (!$request || (int) $request->owner_id !== (int) $owner->id) {
			return $this->jsonError('Corrida não encontrada', 404);
		}

		return Response::json(array('ride' => $this->ridePayloadFromRequest($request)));
	}

	public function getRideLocation()
	{
		$id = $this->routeRideId();
		$owner = $this->ownerFromBearer();
		if (!$owner) {
			return $this->jsonError('Não autorizado', 401);
		}

		Input::merge(array(
			'token' => $owner->token,
			'id' => $owner->id,
			'request_id' => $id,
		));

		$data = $this->decodeLegacyResponse((new DogController())->get_request_location());
		if (empty($data['success'])) {
			return $this->jsonError(isset($data['error']) ? $data['error'] : 'Localização indisponível', 404);
		}

		return Response::json(array(
			'latitude' => (float) $data['latitude'],
			'longitude' => (float) $data['longitude'],
			'distance' => isset($data['distance']) ? $data['distance'] : null,
			'time' => isset($data['time']) ? (int) $data['time'] : null,
			'unit' => isset($data['unit']) ? $data['unit'] : 'kms',
		));
	}

	public function rideHistory()
	{
		$owner = $this->ownerFromBearer();
		if (!$owner) {
			return $this->jsonError('Não autorizado', 401);
		}

		return Response::json(array('rides' => chama_ride_history_for_owner($owner->id)));
	}

	public function cancelRide()
	{
		$id = $this->routeRideId();
		$owner = $this->ownerFromBearer();
		if (!$owner) {
			return $this->jsonError('Não autorizado', 401);
		}
		$body = $this->jsonInput();

		Input::merge(array(
			'token' => $owner->token,
			'id' => $owner->id,
			'request_id' => $id,
			'cancel_reason' => isset($body['reason']) ? $body['reason'] : 'Cancelado pelo passageiro',
		));

		$data = $this->decodeLegacyResponse((new DogController())->cancel_request());
		if (empty($data['success'])) {
			return $this->jsonError(isset($data['error']) ? $data['error'] : 'Erro ao cancelar', 422);
		}
		return Response::json(array('success' => true));
	}

	public function rateDriver()
	{
		$id = $this->routeRideId();
		$owner = $this->ownerFromBearer();
		if (!$owner) {
			return $this->jsonError('Não autorizado', 401);
		}
		$body = $this->jsonInput();

		Input::merge(array(
			'token' => $owner->token,
			'id' => $owner->id,
			'request_id' => $id,
			'rating' => isset($body['rating']) ? $body['rating'] : 5,
			'comment' => isset($body['comment']) ? $body['comment'] : '',
		));

		$data = $this->decodeLegacyResponse((new DogController())->set_walker_rating());
		if (empty($data['success'])) {
			return $this->jsonError(isset($data['error']) ? $data['error'] : 'Erro ao avaliar', 422);
		}
		return Response::json(array('success' => true));
	}

	public function estimateFare()
	{
		$owner = $this->ownerFromBearer();
		if (!$owner) {
			return $this->jsonError('Não autorizado', 401);
		}
		$body = $this->jsonInput();
		$distanceMeters = isset($body['distance_meters']) ? (float) $body['distance_meters'] : (isset($body['distance']) ? (float) $body['distance'] : 5000);
		$durationSeconds = isset($body['duration_seconds']) ? (float) $body['duration_seconds'] : (isset($body['time']) ? (float) $body['time'] : 900);
		$categoryId = chama_category_id_from_body($body);
		$fare = chama_calculate_fare($distanceMeters, $durationSeconds, $categoryId);

		return Response::json(array(
			'estimated_fare' => $fare['estimated_fare'],
			'currency' => $fare['currency'],
			'base_price' => $fare['base_price'],
			'price_per_km' => $fare['price_per_km'],
			'price_per_min' => $fare['price_per_min'],
			'category_id' => $categoryId,
		));
	}

	public function wallet()
	{
		$owner = $this->ownerFromBearer();
		if (!$owner) {
			return $this->jsonError('Não autorizado', 401);
		}

		Input::merge(array(
			'token' => $owner->token,
			'id' => $owner->id,
		));

		$data = $this->decodeLegacyResponse((new OwnerController())->get_credits());
		$balance = 0;
		if (!empty($data['success']) && !empty($data['credits']['balance'])) {
			$balance = (float) $data['credits']['balance'];
		}

		$cards = array();
		$cardsData = $this->decodeLegacyResponse((new OwnerController())->get_cards());
		if (!empty($cardsData['success']) && !empty($cardsData['payments'])) {
			foreach ($cardsData['payments'] as $card) {
				$cards[] = array(
					'id' => $card['id'],
					'last_four' => isset($card['last_four']) ? $card['last_four'] : '****',
					'is_default' => !empty($card['is_default']),
				);
			}
		}

		return Response::json(array(
			'balance' => $balance,
			'pending' => 0,
			'payment_methods' => $cards,
		));
	}

	public function walletTransactions()
	{
		$owner = $this->ownerFromBearer();
		if (!$owner) {
			return $this->jsonError('Não autorizado', 401);
		}
		chama_ensure_ride_wallet_tables();

		$rows = DB::table('wallet_transactions')
			->where('owner_type', 'owner')
			->where('owner_id', $owner->id)
			->orderBy('created_at', 'desc')
			->limit(50)
			->get();

		$transactions = array();
		foreach ($rows as $row) {
			$type = $row->type;
			$direction = in_array($type, array('topup', 'credit', 'refund')) ? 'credit' : 'debit';
			$transactions[] = array(
				'id' => (int) $row->id,
				'type' => $direction,
				'raw_type' => $type,
				'description' => $row->description,
				'amount' => (float) $row->amount,
				'status' => $row->status,
				'created_at' => $row->created_at,
			);
		}

		return Response::json(array('transactions' => $transactions));
	}

	public function payRide()
	{
		$id = $this->routeRideId();
		$owner = $this->ownerFromBearer();
		if (!$owner) {
			return $this->jsonError('Não autorizado', 401);
		}
		$body = $this->jsonInput();
		$method = isset($body['payment_method']) ? strtolower(trim($body['payment_method'])) : 'cash';

		$request = Requests::find($id);
		if (!$request || $request->owner_id != $owner->id) {
			return $this->jsonError('Corrida não encontrada', 404);
		}
		$atDestination = chama_ride_is_destination_arrived($id);
		if (!$request->is_completed && !$atDestination) {
			return $this->jsonError('Aguarde chegar ao destino para pagar', 422);
		}
		if ($request->is_paid) {
			return Response::json(array('success' => true, 'is_paid' => true, 'message' => 'Pagamento já confirmado'));
		}

		if ($method === 'wallet') {
			$ledger = Ledger::where('owner_id', $owner->id)->first();
			if (!$ledger || ($ledger->amount_earned - $ledger->amount_spent) < $request->total) {
				return $this->jsonError('Saldo insuficiente', 422);
			}
			$ledger->amount_spent += $request->total;
			$ledger->save();
			$request->is_paid = 1;
			$request->payment_mode = 3;
			$request->save();
			chama_record_wallet_transaction('owner', $owner->id, 'debit', $request->total, $request->id, 'Pagamento corrida #' . $request->id, 'completed');
			return Response::json(array('success' => true, 'is_paid' => true));
		}

		if ($method === 'pix') {
			$pixCode = chama_ride_pix_code($request);
			$request->is_paid = 1;
			$request->payment_mode = 2;
			$request->save();
			return Response::json(array(
				'success' => true,
				'is_paid' => true,
				'pix_code' => $pixCode,
				'message' => 'Pagamento Pix confirmado',
			));
		}

		if ($method === 'cash') {
			$request->is_paid = 1;
			$request->payment_mode = 0;
			$request->save();
			return Response::json(array('success' => true, 'is_paid' => true, 'message' => 'Pagamento em dinheiro registrado'));
		}

		$request->is_paid = 1;
		$request->payment_mode = $this->paymentModeFromString($method);
		$request->save();
		return Response::json(array('success' => true, 'is_paid' => true, 'message' => 'Pagamento processado'));
	}

	public function paymentPix()
	{
		$id = $this->routeRideId();
		$owner = $this->ownerFromBearer();
		if (!$owner) {
			return $this->jsonError('Não autorizado', 401);
		}
		$request = Requests::find($id);
		if (!$request || $request->owner_id != $owner->id) {
			return $this->jsonError('Corrida não encontrada', 404);
		}
		$atDestination = chama_ride_is_destination_arrived($id);
		if (!$request->is_completed && !$atDestination) {
			return $this->jsonError('Aguarde chegar ao destino para gerar o Pix', 422);
		}
		$pixCode = chama_ride_pix_code($request);
		$amount = (float) $request->total;
		return Response::json(array(
			'pix_code' => $pixCode,
			'amount' => $amount,
			'qr_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' . rawurlencode($pixCode),
		));
	}

	public function confirmCashPayment()
	{
		return $this->payRide();
	}

	public function addFunds()
	{
		$owner = $this->ownerFromBearer();
		if (!$owner) {
			return $this->jsonError('Não autorizado', 401);
		}
		$body = $this->jsonInput();
		$amount = isset($body['amount']) ? (float) $body['amount'] : 0;
		if ($amount <= 0) {
			return $this->jsonError('Valor inválido', 422);
		}

		chama_ensure_ride_wallet_tables();
		$pixCode = '00020126580014BR.GOV.BCB.PIX0136chama-no-12-' . $owner->id . '-' . str_replace('.', '', (string) $amount);
		$now = date('Y-m-d H:i:s');
		DB::table('wallet_topup_requests')->insert(array(
			'owner_id' => $owner->id,
			'amount' => $amount,
			'pix_code' => $pixCode,
			'status' => 'completed',
			'created_at' => $now,
			'updated_at' => $now,
		));

		$ledger = Ledger::where('owner_id', $owner->id)->first();
		if (!$ledger) {
			$ledger = new Ledger();
			$ledger->owner_id = $owner->id;
			$ledger->referral_code = '0';
			$ledger->total_referrals = 0;
			$ledger->amount_earned = 0;
			$ledger->amount_spent = 0;
		}
		$ledger->amount_earned = (float) $ledger->amount_earned + $amount;
		$ledger->save();

		chama_record_wallet_transaction('owner', $owner->id, 'topup', $amount, null, 'Recarga Pix', 'completed');

		return Response::json(array(
			'success' => true,
			'pix_code' => $pixCode,
			'status' => 'completed',
			'message' => 'Recarga creditada na carteira.',
			'balance' => chama_owner_wallet_balance($owner->id),
		));
	}

	public function nearbyDrivers()
	{
		$lat = (float) Input::get('lat', 0);
		$lng = (float) Input::get('lng', 0);
		if (!$lat || !$lng) {
			return Response::json(array('drivers' => array()));
		}

		$settings = Settings::where('key', 'default_search_radius')->first();
		$radius = $settings ? $settings->value : 5;
		$query = "SELECT id, latitude, longitude from walker where is_available = 1 and is_active = 1 and is_approved = 1 and deleted_at IS NULL and (1.609344 * 3956 * acos( cos( radians('$lat') ) * cos( radians(latitude) ) * cos( radians(longitude) - radians('$lng') ) + sin( radians('$lat') ) * sin( radians(latitude) ) ) ) <= $radius order by (1.609344 * 3956 * acos( cos( radians('$lat') ) * cos( radians(latitude) ) * cos( radians(longitude) - radians('$lng') ) + sin( radians('$lat') ) * sin( radians(latitude) ) )) limit 20";
		$walkers = DB::select(DB::raw($query));
		$drivers = array();
		foreach ($walkers as $w) {
			$drivers[] = array(
				'id' => (int) $w->id,
				'lat' => (float) $w->latitude,
				'lng' => (float) $w->longitude,
				'heading' => rand(0, 359),
			);
		}
		return Response::json(array('drivers' => $drivers));
	}

	public function activeRide()
	{
		$owner = $this->ownerFromBearer();
		if (!$owner) {
			return $this->jsonError('Não autorizado', 401);
		}

		$request = DB::table('request')
			->where('owner_id', $owner->id)
			->where('is_cancelled', 0)
			->whereRaw('(is_completed = 0 OR (is_completed = 1 AND is_paid = 1))')
			->orderBy('id', 'desc')
			->first();

		if (!$request) {
			return Response::json(array('ride' => null));
		}

		return Response::json(array('ride' => $this->ridePayloadFromRequest(Requests::find($request->id))));
	}

	protected function buildRidePayload($rideId, $owner, $body, $farePreview = null)
	{
		$request = $rideId ? Requests::find($rideId) : null;
		if ($request) {
			return $this->ridePayloadFromRequest($request);
		}
		$fare = $farePreview;
		if (!$fare && isset($body['distance_meters'], $body['duration_seconds'])) {
			$fare = chama_calculate_fare($body['distance_meters'], $body['duration_seconds'], chama_category_id_from_body($body));
		}
		return array(
			'id' => $rideId,
			'status' => 'searching',
			'origin_lat' => isset($body['origin_lat']) ? $body['origin_lat'] : $owner->latitude,
			'origin_lng' => isset($body['origin_lng']) ? $body['origin_lng'] : $owner->longitude,
			'dest_lat' => isset($body['dest_lat']) ? $body['dest_lat'] : null,
			'dest_lng' => isset($body['dest_lng']) ? $body['dest_lng'] : null,
			'origin_address' => isset($body['origin_address']) ? $body['origin_address'] : '',
			'destination_address' => isset($body['destination_address']) ? $body['destination_address'] : '',
			'estimated_fare' => $fare ? $fare['estimated_fare'] : (isset($body['estimated_fare']) ? $body['estimated_fare'] : null),
			'payment_method' => isset($body['payment_method']) ? $body['payment_method'] : 'cash',
		);
	}

	protected function transformGetRequest($data, $rideId)
	{
		$request = Requests::find($rideId);
		if ($request) {
			return $this->ridePayloadFromRequest($request, array(
				'is_walker_started' => !empty($data['is_walker_started']),
				'is_walker_arrived' => !empty($data['is_walker_arrived']),
				'is_walk_started' => !empty($data['is_walk_started']),
				'is_completed' => !empty($data['is_completed']),
			));
		}

		$walker = isset($data['walker']) ? $data['walker'] : null;
		$bill = isset($data['bill']) ? $data['bill'] : null;
		$ride = array(
			'id' => (int) $rideId,
			'status' => 'searching',
			'origin_lat' => isset($data['owner_latitude']) ? (float) $data['owner_latitude'] : null,
			'origin_lng' => isset($data['owner_longitude']) ? (float) $data['owner_longitude'] : null,
			'dest_lat' => isset($data['D_latitude']) ? (float) $data['D_latitude'] : null,
			'dest_lng' => isset($data['D_longitude']) ? (float) $data['D_longitude'] : null,
		);
		if ($walker) {
			$vehicle = chama_driver_vehicle_for_request($rideId);
			$ride['driver'] = array(
				'first_name' => $walker['first_name'],
				'last_name' => isset($walker['last_name']) ? $walker['last_name'] : '',
				'avatar' => isset($walker['picture']) ? $walker['picture'] : '',
				'phone' => isset($walker['phone']) ? $walker['phone'] : '',
				'rating' => isset($walker['rating']) ? (float) $walker['rating'] : 5,
				'vehicle_model' => $vehicle['vehicle_model'],
				'vehicle_plate' => $vehicle['vehicle_plate'],
			);
		}
		if ($bill && isset($bill['total'])) {
			$ride['fare'] = (float) $bill['total'];
			$ride['estimated_fare'] = (float) $bill['total'];
		}
		return $ride;
	}
}
