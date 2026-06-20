<?php

class ApiDriverController extends ApiBaseController
{
	public function login()
	{
		$body = $this->jsonInput();
		Input::merge(array(
			'email' => isset($body['email']) ? $body['email'] : (isset($body['cpf']) ? $body['cpf'] : ''),
			'password' => isset($body['password']) ? $body['password'] : '',
			'login_by' => 'manual',
			'device_type' => 'android',
			'device_token' => isset($body['device_token']) ? $body['device_token'] : 'pwa-driver-web',
		));

		$data = $this->decodeLegacyResponse((new WalkerController())->login());
		if (empty($data['success'])) {
			return $this->jsonError(isset($data['error']) ? $data['error'] : 'Credenciais inválidas', 401);
		}

		return Response::json(array(
			'token' => $data['token'],
			'user' => array(
				'id' => (int) $data['id'],
				'first_name' => $data['first_name'],
				'last_name' => isset($data['last_name']) ? $data['last_name'] : '',
				'email' => $data['email'],
				'phone' => isset($data['phone']) ? $data['phone'] : '',
				'is_approved' => !empty($data['is_approved']),
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
			'device_token' => 'pwa-driver-web',
		));

		$data = $this->decodeLegacyResponse((new WalkerController())->register());
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
			),
		));
	}

	public function logout()
	{
		return Response::json(array('success' => true));
	}

	public function location()
	{
		$walker = $this->walkerFromBearer();
		if (!$walker) {
			return $this->jsonError('Não autorizado', 401);
		}
		$body = $this->jsonInput();
		Input::merge(array(
			'token' => $walker->token,
			'id' => $walker->id,
			'latitude' => isset($body['latitude']) ? $body['latitude'] : 0,
			'longitude' => isset($body['longitude']) ? $body['longitude'] : 0,
		));
		$data = $this->decodeLegacyResponse((new WalkerController())->walker_location());
		if (empty($data['success'])) {
			return $this->jsonError(isset($data['error']) ? $data['error'] : 'Erro', 400);
		}
		return Response::json(array('success' => true));
	}

	public function toggleOnline()
	{
		$walker = $this->walkerFromBearer();
		if (!$walker) {
			return $this->jsonError('Não autorizado', 401);
		}
		$body = $this->jsonInput();
		$online = !empty($body['is_online']);

		Walker::where('id', $walker->id)->update(array(
			'is_active' => $online ? 1 : 0,
			'is_available' => $online ? 1 : 0,
		));
		if ($online) {
			chama_ensure_walker_dispatch_ready($walker->id);
		}

		return Response::json(array('success' => true, 'is_online' => $online, 'is_active' => $online ? 1 : 0));
	}

	public function pendingRides()
	{
		$walker = $this->walkerFromBearer();
		if (!$walker) {
			return $this->jsonError('Não autorizado', 401);
		}

		chama_ensure_walker_dispatch_ready($walker->id);

		return Response::json(array('rides' => chama_pending_rides_for_walker($walker->id)));
	}

	public function acceptRide()
	{
		return $this->respondRide($this->routeRideId(), 1);
	}

	public function declineRide()
	{
		return $this->respondRide($this->routeRideId(), 0);
	}

	protected function respondRide($rideId, $accepted)
	{
		$walker = $this->walkerFromBearer();
		if (!$walker) {
			return $this->jsonError('Não autorizado', 401);
		}

		try {
			if ($accepted) {
				$result = chama_accept_ride_for_walker($rideId, $walker->id);
			} else {
				$result = chama_decline_ride_for_walker($rideId, $walker->id);
			}

			if (empty($result['success'])) {
				return $this->jsonError(isset($result['error']) ? $result['error'] : 'Erro na resposta', 422);
			}

			return Response::json(array(
				'success' => true,
				'ride' => $this->transformDriverRide($rideId, $walker),
			));
		} catch (Throwable $e) {
			Log::error('respondRide: ' . $e->getMessage());
			return $this->jsonError('Erro ao processar corrida', 500);
		}
	}

	public function getRide()
	{
		$id = $this->routeRideId();
		$walker = $this->walkerFromBearer();
		if (!$walker) {
			return $this->jsonError('Não autorizado', 401);
		}

		Input::merge(array(
			'token' => $walker->token,
			'id' => $walker->id,
			'request_id' => $id,
		));

		$data = $this->decodeLegacyResponse((new WalkerController())->get_request());
		if (empty($data['success'])) {
			return Response::json(array('ride' => $this->transformDriverRide($id, $walker)));
		}

		return Response::json(array('ride' => $this->transformDriverRide($id, $walker, $data)));
	}

	public function arrivePickup()
	{
		return $this->driverAction('request_walker_arrived', $this->routeRideId());
	}

	public function startRide()
	{
		return $this->driverAction('request_walk_started', $this->routeRideId());
	}

	public function arriveDestination()
	{
		$id = $this->routeRideId();
		$walker = $this->walkerFromBearer();
		if (!$walker) {
			return $this->jsonError('Não autorizado', 401);
		}
		$request = Requests::find($id);
		if (!$request || (int) $request->confirmed_walker !== (int) $walker->id) {
			return $this->jsonError('Corrida não encontrada', 404);
		}
		if (!$request->is_started) {
			return $this->jsonError('Inicie a corrida antes de marcar chegada no destino', 422);
		}
		chama_ride_set_destination_arrived($id);
		return Response::json(array(
			'success' => true,
			'ride' => $this->transformDriverRide($id, $walker),
		));
	}

	public function completeRide()
	{
		$id = $this->routeRideId();
		$walker = $this->walkerFromBearer();
		if (!$walker) {
			return $this->jsonError('Não autorizado', 401);
		}

		Input::merge(array(
			'token' => $walker->token,
			'id' => $walker->id,
			'request_id' => $id,
			'time' => 1,
		));

		$complete = $this->decodeLegacyResponse((new WalkerController())->request_walk_completed());
		if (empty($complete['success'])) {
			return $this->jsonError(isset($complete['error']) ? $complete['error'] : 'Erro ao finalizar', 422);
		}

		Input::merge(array(
			'token' => $walker->token,
			'id' => $walker->id,
			'request_id' => $id,
			'time' => isset($complete['time']) ? $complete['time'] : 1,
		));
		$payment = $this->decodeLegacyResponse((new WalkerController())->pre_payment());

		$request = Requests::find($id);
		if ($request) {
			$request->is_completed = 1;
			$request->save();
			chama_wallet_settle_ride($request);
		}
		$fare = $request ? (float) $request->total : 0;

		return Response::json(array(
			'success' => true,
			'fare' => $fare,
			'ride' => $this->transformDriverRide($id, $walker),
		));
	}

	public function cancelRide()
	{
		$id = $this->routeRideId();
		$walker = $this->walkerFromBearer();
		if (!$walker) {
			return $this->jsonError('Não autorizado', 401);
		}
		$request = Requests::find($id);
		if ($request && (int) $request->confirmed_walker === (int) $walker->id) {
			$request->is_cancelled = 1;
			$request->save();
			Walker::where('id', $walker->id)->update(array('is_available' => 1));
		}
		return Response::json(array('success' => true, 'ride' => $this->transformDriverRide($id, $walker)));
	}

	public function ratePassenger()
	{
		$id = $this->routeRideId();
		$walker = $this->walkerFromBearer();
		if (!$walker) {
			return $this->jsonError('Não autorizado', 401);
		}
		$body = $this->jsonInput();

		Input::merge(array(
			'token' => $walker->token,
			'id' => $walker->id,
			'request_id' => $id,
			'rating' => isset($body['rating']) ? $body['rating'] : 5,
			'comment' => isset($body['comment']) ? $body['comment'] : '',
		));

		$data = $this->decodeLegacyResponse((new WalkerController())->set_dog_rating());
		if (empty($data['success'])) {
			return $this->jsonError(isset($data['error']) ? $data['error'] : 'Erro ao avaliar', 422);
		}
		return Response::json(array('success' => true));
	}

	public function rideHistory()
	{
		$walker = $this->walkerFromBearer();
		if (!$walker) {
			return $this->jsonError('Não autorizado', 401);
		}

		return Response::json(array('rides' => chama_ride_history_for_walker($walker->id)));
	}

	public function wallet()
	{
		$walker = $this->walkerFromBearer();
		if (!$walker) {
			return $this->jsonError('Não autorizado', 401);
		}
		chama_ensure_ride_wallet_tables();

		$balance = chama_walker_wallet_balance($walker->id);
		$totalEarned = (float) DB::table('wallet_transactions')
			->where('owner_type', 'walker')
			->where('owner_id', $walker->id)
			->where('type', 'credit')
			->where('status', 'completed')
			->sum('amount');

		$transactions = DB::table('wallet_transactions')
			->where('owner_type', 'walker')
			->where('owner_id', $walker->id)
			->orderBy('created_at', 'desc')
			->limit(30)
			->get();

		$txList = array();
		foreach ($transactions as $row) {
			$type = $row->type;
			$direction = in_array($type, array('credit', 'ride_payment', 'topup', 'refund')) ? 'credit' : 'debit';
			$txList[] = array(
				'id' => (int) $row->id,
				'type' => $direction,
				'raw_type' => $type,
				'description' => $row->description,
				'amount' => (float) $row->amount,
				'status' => $row->status,
				'created_at' => $row->created_at,
			);
		}

		return Response::json(array(
			'balance' => $balance,
			'pending_balance' => 0,
			'total_earned' => $totalEarned > 0 ? $totalEarned : $balance,
			'transactions' => $txList,
		));
	}

	public function withdraw()
	{
		$walker = $this->walkerFromBearer();
		if (!$walker) {
			return $this->jsonError('Não autorizado', 401);
		}
		$body = $this->jsonInput();
		$amount = isset($body['amount']) ? (float) $body['amount'] : 0;
		if ($amount <= 0) {
			return $this->jsonError('Valor inválido', 422);
		}
		if (chama_walker_wallet_balance($walker->id) < $amount) {
			return $this->jsonError('Saldo insuficiente', 422);
		}

		chama_ensure_ride_wallet_tables();
		$now = date('Y-m-d H:i:s');
		DB::table('wallet_withdraw_requests')->insert(array(
			'walker_id' => $walker->id,
			'amount' => $amount,
			'status' => 'pending',
			'created_at' => $now,
			'updated_at' => $now,
		));
		chama_record_wallet_transaction('walker', $walker->id, 'withdraw', $amount, null, 'Saque solicitado', 'pending');

		return Response::json(array(
			'success' => true,
			'message' => 'Saque solicitado. Processamento manual pelo admin.',
			'amount' => $amount,
		));
	}

	public function earningsDetails()
	{
		$walker = $this->walkerFromBearer();
		if (!$walker) {
			return $this->jsonError('Não autorizado', 401);
		}

		$period = Input::get('period', 'week');
		$days = $period === 'year' ? 365 : ($period === 'month' ? 30 : 7);
		$since = date('Y-m-d 00:00:00', strtotime('-' . (int) $days . ' days'));

		$rows = DB::table('request')
			->where('confirmed_walker', $walker->id)
			->where('is_completed', 1)
			->where('updated_at', '>=', $since)
			->orderBy('updated_at', 'desc')
			->get(array('id', 'total', 'distance', 'updated_at'));

		$grouped = array();
		foreach ($rows as $row) {
			$day = date('Y-m-d', strtotime($row->updated_at));
			if (!isset($grouped[$day])) {
				$grouped[$day] = array(
					'date' => $day,
					'rides_count' => 0,
					'distance' => 0,
					'amount' => 0,
				);
			}
			$grouped[$day]['rides_count']++;
			$grouped[$day]['distance'] += (float) $row->distance;
			$grouped[$day]['amount'] += (float) $row->total;
		}

		$details = array();
		$id = 1;
		foreach ($grouped as $item) {
			$details[] = array(
				'id' => $id++,
				'date' => $item['date'],
				'rides_count' => (int) $item['rides_count'],
				'distance' => (float) $item['distance'],
				'amount' => round($item['amount'], 2),
			);
		}

		return Response::json($details);
	}

	public function earningsSummary()
	{
		$walker = $this->walkerFromBearer();
		if (!$walker) {
			return $this->jsonError('Não autorizado', 401);
		}

		$today = (float) DB::table('request')
			->where('confirmed_walker', $walker->id)
			->where('is_completed', 1)
			->where('updated_at', '>=', date('Y-m-d 00:00:00'))
			->sum('total');

		$week = (float) DB::table('request')
			->where('confirmed_walker', $walker->id)
			->where('is_completed', 1)
			->where('updated_at', '>=', date('Y-m-d 00:00:00', strtotime('-7 days')))
			->sum('total');

		return Response::json(array(
			'today' => $today,
			'week' => $week,
			'total' => (float) DB::table('request')->where('confirmed_walker', $walker->id)->where('is_completed', 1)->sum('total'),
			'trips_count' => (int) DB::table('request')->where('confirmed_walker', $walker->id)->where('is_completed', 1)->count(),
			'rides_count' => (int) DB::table('request')->where('confirmed_walker', $walker->id)->where('is_completed', 1)->count(),
			'total_distance' => (float) DB::table('request')->where('confirmed_walker', $walker->id)->where('is_completed', 1)->sum('distance'),
			'total_time' => 0,
			'avg_rating' => 5,
			'available_balance' => chama_walker_wallet_balance($walker->id),
		));
	}

	protected function driverAction($method, $rideId)
	{
		$walker = $this->walkerFromBearer();
		if (!$walker) {
			return $this->jsonError('Não autorizado', 401);
		}

		Input::merge(array(
			'token' => $walker->token,
			'id' => $walker->id,
			'request_id' => $rideId,
		));

		$controller = new WalkerController();
		$data = $this->decodeLegacyResponse($controller->$method());
		if (empty($data['success'])) {
			$request = Requests::find($rideId);
			if ($request) {
				if ($method === 'request_walker_arrived') {
					$request->is_walker_arrived = 1;
				} elseif ($method === 'request_walk_started') {
					$request->is_started = 1;
				} elseif ($method === 'request_walker_started') {
					$request->is_walker_started = 1;
				}
				$request->save();
			}
		}

		return Response::json(array(
			'success' => true,
			'ride' => $this->transformDriverRide($rideId, $walker),
		));
	}

	protected function transformDriverRide($rideId, $walker, $data = null)
	{
		$request = Requests::find($rideId);
		if (!$request) {
			return array('id' => $rideId, 'status' => 'unknown');
		}

		$owner = Owner::find($request->owner_id);
		$addrs = chama_get_ride_addresses($rideId);
		$status = $this->mapRideStatus($request);
		if ($request->is_walker_arrived && !$request->is_started) {
			$status = 'pickup_arrived';
		}
		if ($request->is_walker_started && !$request->is_completed && !$request->is_started) {
			$status = 'accepted';
		}
		if ($request->is_started && !$request->is_completed && !chama_ride_is_destination_arrived($rideId)) {
			$status = 'in_progress';
		}
		if (chama_ride_is_destination_arrived($rideId) && !$request->is_completed) {
			$status = 'destination_arrived';
		}

		return array(
			'id' => (int) $rideId,
			'status' => $status,
			'estimated_fare' => (float) $request->total,
			'fare' => (float) $request->total,
			'price' => (float) $request->total,
			'payment_method' => $this->paymentLabel($request->payment_mode),
			'is_paid' => (bool) $request->is_paid,
			'origin_lat' => $owner ? (float) $owner->latitude : null,
			'origin_lng' => $owner ? (float) $owner->longitude : null,
			'dest_lat' => $request->D_latitude ? (float) $request->D_latitude : null,
			'dest_lng' => $request->D_longitude ? (float) $request->D_longitude : null,
			'origin_address' => $addrs['origin_address'] ?: ($owner ? $owner->address : ''),
			'destination_address' => $addrs['destination_address'],
			'pickup_address' => $addrs['origin_address'],
			'dropoff_address' => $addrs['destination_address'],
			'passenger_name' => $owner ? trim($owner->first_name . ' ' . $owner->last_name) : 'Passageiro',
			'passenger_phone' => $owner ? $owner->phone : '',
			'passenger_rating' => (float) (DB::table('review_dog')->where('owner_id', $owner ? $owner->id : 0)->avg('rating') ?: 5),
			'created_at' => $request->created_at ? (string) $request->created_at : date('Y-m-d H:i:s'),
		);
	}

	public function vapidPublicKey()
	{
		$config = Config::get('webpush');
		return Response::json(array('publicKey' => isset($config['public_key']) ? $config['public_key'] : ''));
	}

	public function pushSubscribe()
	{
		$walker = $this->walkerFromBearer();
		if (!$walker) {
			return $this->jsonError('Não autorizado', 401);
		}
		$body = $this->jsonInput();
		if (empty($body['endpoint']) || empty($body['keys']['p256dh']) || empty($body['keys']['auth'])) {
			return $this->jsonError('Subscription inválida', 422);
		}

		if (Schema::hasTable('web_push_subscriptions')) {
			WebPushSubscription::where('walker_id', $walker->id)->delete();
			WebPushSubscription::create(array(
				'walker_id' => $walker->id,
				'endpoint' => $body['endpoint'],
				'p256dh' => $body['keys']['p256dh'],
				'auth_key' => $body['keys']['auth'],
				'created_at' => date('Y-m-d H:i:s'),
			));
		}

		$walker->device_type = 'web';
		$walker->device_token = 'pwa-driver-web';
		$walker->save();

		return Response::json(array('success' => true));
	}

	public function pushUnsubscribe()
	{
		$walker = $this->walkerFromBearer();
		if (!$walker) {
			return $this->jsonError('Não autorizado', 401);
		}
		if (Schema::hasTable('web_push_subscriptions')) {
			WebPushSubscription::where('walker_id', $walker->id)->delete();
		}
		return Response::json(array('success' => true));
	}
}
