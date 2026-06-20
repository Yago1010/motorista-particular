<?php

/**
 * Base para API JSON dos PWAs (passageiro + motorista).
 * Traduz Bearer token ↔ token legacy do UberX.
 */
class ApiBaseController extends BaseController
{
	protected function jsonInput()
	{
		$content = Request::getContent();
		if ($content) {
			$decoded = json_decode($content, true);
			if (is_array($decoded)) {
				return $decoded;
			}
		}
		return Input::all();
	}

	protected function bearerToken()
	{
		$auth = Request::header('Authorization');
		if ($auth && preg_match('/Bearer\s+(\S+)/i', $auth, $m)) {
			return $m[1];
		}
		return null;
	}

	protected function ownerFromBearer()
	{
		$token = $this->bearerToken();
		if (!$token) {
			return null;
		}
		return Owner::where('token', $token)->first();
	}

	protected function walkerFromBearer()
	{
		$token = $this->bearerToken();
		if (!$token) {
			return null;
		}
		return Walker::where('token', $token)->first();
	}

	protected function jsonError($message, $code = 400, $extra = array())
	{
		return Response::json(array_merge(array('message' => $message), $extra), $code);
	}

	/** Laravel 4 + PHP 8: parâmetro {id} da rota via segmento da URL. */
	protected function routeRideId($id = null)
	{
		if ($id !== null && $id !== '') {
			return $id;
		}
		$segments = Request::segments();
		$idx = array_search('rides', $segments);
		if ($idx !== false && isset($segments[$idx + 1])) {
			return $segments[$idx + 1];
		}
		return Input::segment(4);
	}

	protected function decodeLegacyResponse($response)
	{
		if (is_object($response) && method_exists($response, 'getContent')) {
			return json_decode($response->getContent(), true);
		}
		if (is_string($response)) {
			return json_decode($response, true);
		}
		return is_array($response) ? $response : array();
	}

	protected function mapRideStatus($request)
	{
		if (!$request) {
			return 'searching';
		}
		if ($request->is_cancelled) {
			return 'cancelled';
		}
		if ($request->is_completed) {
			return 'completed';
		}
		if (chama_ride_is_destination_arrived($request->id)) {
			return 'destination_arrived';
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
		if ($request->current_walker) {
			return 'searching';
		}
		return 'searching';
	}

	protected function paymentLabel($mode)
	{
		$map = array(0 => 'cash', 1 => 'card', 2 => 'pix', 3 => 'wallet');
		return isset($map[(int) $mode]) ? $map[(int) $mode] : 'cash';
	}

	protected function paymentModeFromString($method)
	{
		$map = array('cash' => 0, 'card' => 1, 'pix' => 2, 'wallet' => 3);
		$method = strtolower((string) $method);
		return isset($map[$method]) ? $map[$method] : 0;
	}

	protected function ridePayloadFromRequest($request, $extra = array())
	{
		if (!$request) {
			return $extra;
		}
		chama_ensure_ride_wallet_tables();
		$owner = Owner::find($request->owner_id);
		$addrs = chama_get_ride_addresses($request->id);
		$ride = array_merge(array(
			'id' => (int) $request->id,
			'status' => $this->mapRideStatus($request),
			'origin_lat' => $owner ? (float) $owner->latitude : null,
			'origin_lng' => $owner ? (float) $owner->longitude : null,
			'dest_lat' => $request->D_latitude ? (float) $request->D_latitude : null,
			'dest_lng' => $request->D_longitude ? (float) $request->D_longitude : null,
			'origin_address' => $addrs['origin_address'] ?: ($owner ? $owner->address : ''),
			'pickup_address' => $addrs['origin_address'] ?: ($owner ? $owner->address : ''),
			'destination_address' => $addrs['destination_address'],
			'estimated_fare' => (float) $request->total,
			'fare' => (float) $request->total,
			'distance_km' => (float) $request->distance,
			'duration_min' => (float) $request->time,
			'payment_method' => $this->paymentLabel($request->payment_mode),
			'is_paid' => (bool) $request->is_paid,
		), $extra);

		if ($request->confirmed_walker) {
			$walker = Walker::find($request->confirmed_walker);
			if ($walker) {
				$vehicle = chama_driver_vehicle_for_request($request->id);
				$ride['driver'] = array(
					'first_name' => $walker->first_name,
					'last_name' => $walker->last_name,
					'name' => trim($walker->first_name . ' ' . $walker->last_name),
					'avatar' => $walker->picture,
					'picture' => $walker->picture,
					'phone' => $walker->phone,
					'rating' => (float) (DB::table('review_walker')->where('walker_id', $walker->id)->avg('rating') ?: 5),
					'latitude' => (float) $walker->latitude,
					'longitude' => (float) $walker->longitude,
					'vehicle_model' => $vehicle['vehicle_model'],
					'vehicle_plate' => $vehicle['vehicle_plate'],
					'vehicle_color' => '',
					'type' => $vehicle['type'],
				);
				$ride['driver_lat'] = (float) $walker->latitude;
				$ride['driver_lng'] = (float) $walker->longitude;
			}
		}

		return $ride;
	}
}
