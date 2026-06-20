<td colspan="8">
	<div class="row chama-trip-detail">
		<div id="trip-map" class="col-lg-4 col-md-5">
			<img class="img-responsive chama-trip-map-img" src="{{ $map_url }}" alt="Mapa da corrida">
		</div>
		<div id="trip-info" class="col-lg-4 col-md-4">
			<h3 class="chama-trip-price">{{ $currency }} {{ number_format((float) ($request->total - $request->ledger_payment), 2, ',', '.') }}</h3>
			<p class="text-muted">{{ date('d/m/Y H:i', strtotime($request->request_start_time)) }}</p>
			<div class="chama-trip-stop">
				<span class="chama-trip-dot chama-trip-dot--origin"></span>
				<div>
					<small>Embarque · {{ date('H:i', strtotime($start->created_at)) }}</small>
					<div>{{ $start_address }}</div>
				</div>
			</div>
			<div class="chama-trip-stop">
				<span class="chama-trip-dot chama-trip-dot--dest"></span>
				<div>
					<small>Destino · {{ date('H:i', strtotime($end->created_at)) }}</small>
					<div>{{ $end_address }}</div>
				</div>
			</div>
			<p><strong>Distância:</strong> {{ chama_format_distance_km($request->distance) }}</p>
		</div>
		<div id="trip-action" class="col-lg-4 col-md-3">
			<div class="chama-trip-passenger">
				<img src="{{ $owner->picture ?: asset_url() . '/web/default_profile.png' }}" class="img-circle" width="56" alt="">
				<div>
					<strong>{{ $owner->first_name }} {{ $owner->last_name }}</strong>
					<div class="chama-trip-rating">
						@for ($i = 1; $i <= min(5, (int) round($rating)); $i++)
						<i class="fa fa-star" style="color:#e8c547"></i>
						@endfor
					</div>
					@if($owner->phone)
					<a href="{{ chama_whatsapp_url($owner->phone, 'Olá! Corrida #' . $request->id . ' — Chama no 12.') }}" target="_blank" rel="noopener" class="btn btn-sm chama-wa-btn" style="margin-top:8px;">
						<i class="fa fa-whatsapp"></i> WhatsApp
					</a>
					@endif
				</div>
			</div>
			<div class="chama-fare-breakdown">
				<h5>Detalhe da tarifa</h5>
				<table id="fare-table" class="table table-condensed">
					<tr><td>Tarifa base</td><td class="text-right">{{ $currency }} {{ number_format((float) $request_services->base_price, 2, ',', '.') }}</td></tr>
					<tr><td>Distância</td><td class="text-right">{{ $currency }} {{ number_format((float) $request_services->distance_cost, 2, ',', '.') }}</td></tr>
					<tr><td>Tempo</td><td class="text-right">{{ $currency }} {{ number_format((float) $request_services->time_cost, 2, ',', '.') }}</td></tr>
					<tr class="chama-fare-divider"><td>Subtotal</td><td class="text-right">{{ $currency }} {{ number_format((float) $request_services->total, 2, ',', '.') }}</td></tr>
					@if($request->ledger_payment > 0)
					<tr><td>Promoção</td><td class="text-right">- {{ $currency }} {{ number_format((float) $request->ledger_payment, 2, ',', '.') }}</td></tr>
					@endif
					<tr><td><strong>Cobrado</strong></td><td class="text-right"><strong>{{ $currency }} {{ number_format((float) ($request->payment_mode == 1 ? $request->total : $request->card_payment), 2, ',', '.') }}</strong></td></tr>
				</table>
			</div>
		</div>
	</div>
</td>
