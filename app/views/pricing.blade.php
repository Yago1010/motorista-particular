@extends('layout')

@section('content')

@if(Session::has('msg'))
<div class="alert alert-success alert-dismissable">
    <button type="button" class="close" data-dismiss="alert">&times;</button>
    {{ Session::get('msg') }}
</div>
@endif

<div class="box box-primary">
    <div class="box-header with-border">
        <h3 class="box-title">Configuração de tarifas — Chama no 12</h3>
    </div>
    <form method="post" action="{{ URL::Route('AdminPricingSave') }}">
        <div class="box-body">
            <p class="chama-pricing-hint">
                Fórmula: <strong>Tarifa = Base + (distância × R$/km) + (tempo × R$/min)</strong>.
                Os apps passageiro e motorista usam estes valores na estimativa via API.
            </p>

            <div class="chama-pricing-grid" style="margin-top:16px;">
                <div class="chama-pricing-field">
                    <label for="base_price">Tarifa base ({{ $currency }})</label>
                    <input type="number" step="0.01" min="0" id="base_price" name="base_price" value="{{ $pricing['base_price'] }}" required>
                </div>
                <div class="chama-pricing-field">
                    <label for="price_per_unit_distance">Preço por km ({{ $currency }})</label>
                    <input type="number" step="0.01" min="0" id="price_per_unit_distance" name="price_per_unit_distance" value="{{ $pricing['price_per_unit_distance'] }}" required>
                </div>
                <div class="chama-pricing-field">
                    <label for="price_per_unit_time">Preço por minuto ({{ $currency }})</label>
                    <input type="number" step="0.01" min="0" id="price_per_unit_time" name="price_per_unit_time" value="{{ $pricing['price_per_unit_time'] }}" required>
                </div>
                <div class="chama-pricing-field">
                    <label for="default_distance_unit">Unidade de distância</label>
                    <select id="default_distance_unit" name="default_distance_unit">
                        <option value="0" {{ $pricing['default_distance_unit'] == '0' ? 'selected' : '' }}>Quilômetros (KM)</option>
                        <option value="1" {{ $pricing['default_distance_unit'] == '1' ? 'selected' : '' }}>Milhas</option>
                    </select>
                </div>
                <div class="chama-pricing-field">
                    <label for="default_charging_method_for_users">Método de cobrança</label>
                    <select id="default_charging_method_for_users" name="default_charging_method_for_users">
                        <option value="1" {{ $pricing['default_charging_method_for_users'] == '1' ? 'selected' : '' }}>Tempo + Distância</option>
                        <option value="0" {{ $pricing['default_charging_method_for_users'] == '0' ? 'selected' : '' }}>Preço fixo</option>
                    </select>
                </div>
            </div>

            <div class="chama-pricing-hint" style="margin-top:20px;">
                Exemplo: corrida de 8 km e 18 min →
                {{ $currency }} {{ number_format((float)$pricing['base_price'] + 8 * (float)$pricing['price_per_unit_distance'] + 18 * (float)$pricing['price_per_unit_time'], 2, ',', '.') }}
            </div>
        </div>
        <div class="box-footer">
            <button type="submit" class="btn btn-success btn-lg"><i class="fa fa-save"></i> Salvar tarifas</button>
            <a href="{{ URL::Route('AdminSettings') }}" class="btn btn-default">Outras configurações</a>
        </div>
    </form>
</div>

@stop
