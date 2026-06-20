@extends('web.providerLayout')

@section('content')

@if(Session::has('message'))
<div class="alert alert-{{ Session::get('type') }} chama-alert">
    <b>{{ Session::get('message') }}</b>
</div>
@endif

<div class="chama-provider-toolbar">
    <div class="chama-provider-toolbar-left">
        <div class="chama-online-pill {{ $walker->is_active ? 'is-online' : 'is-offline' }}" id="online-pill">
            <span class="chama-online-dot"></span>
            <span id="online-label">{{ $walker->is_active ? 'Online' : 'Offline' }}</span>
        </div>
        <button type="button" class="btn btn-theme chama-toggle-online" id="btn-toggle-online" data-active="{{ (int) $walker->is_active }}">
            {{ $walker->is_active ? 'Ficar offline' : 'Ficar online' }}
        </button>
        @if((int) $walker->is_approved !== 1)
        <span class="label label-warning chama-badge-warn">Aguardando aprovação</span>
        @endif
    </div>
    <div class="chama-provider-toolbar-right">
        <a href="{{ url('/pwa-motoristas/') }}" target="_blank" rel="noopener" class="btn btn-default chama-btn-pwa">
            <i class="fa fa-mobile"></i> App Motorista (PWA)
        </a>
        @if($active_request)
        <a href="{{ URL::Route('providerTripInProgress') }}" class="btn btn-success">
            <i class="fa fa-location-arrow"></i> Corrida em andamento #{{ $active_request->id }}
        </a>
        @endif
    </div>
</div>

@if(count($banners))
<div class="chama-provider-banners">
    @foreach($banners as $banner)
    <div class="chama-provider-banner">
        <strong>{{ $banner->title }}</strong>
        @if($banner->subtitle)<span>{{ $banner->subtitle }}</span>@endif
        @if($banner->link_url)
        <a href="{{ $banner->link_url }}" target="_blank" rel="noopener">{{ $banner->cta_label ?: 'Saiba mais' }}</a>
        @endif
    </div>
    @endforeach
</div>
@endif

@if(count($pending_requests))
<div class="chama-panel chama-panel--highlight">
    <div class="chama-panel-head">
        <h4><i class="fa fa-bell"></i> Corridas aguardando resposta ({{ count($pending_requests) }})</h4>
        <p>Aceite ou recuse em até 10 minutos.</p>
    </div>
    <div class="row">
        @foreach($pending_requests as $pending)
        <?php
            $waMsg = chama_ride_whatsapp_message($pending, 'driver');
            $waUrl = !empty($pending->phone) ? chama_whatsapp_url($pending->phone, 'Olá! Sou o motorista da corrida #' . $pending->id . ' pelo Chama no 12.') : '';
        ?>
        <div class="col-md-6 col-sm-12">
            <div class="chama-ride-card chama-ride-card--pending">
                <div class="chama-ride-card-top">
                    <strong>#{{ $pending->id }}</strong>
                    <span class="label label-warning">Nova solicitação</span>
                </div>
                <p class="chama-ride-passenger">
                    <i class="fa fa-user"></i>
                    {{ $pending->first_name }} {{ $pending->last_name }}
                </p>
                @if($pending->type)
                <p><i class="fa fa-car"></i> {{ $pending->type }}</p>
                @endif
                @if($pending->address)
                <p class="chama-ride-address"><i class="fa fa-map-marker"></i> {{ $pending->address }}</p>
                @endif
                <p class="chama-ride-price">{{ $currency }} {{ number_format((float) $pending->total, 2, ',', '.') }}</p>
                <div class="chama-ride-actions">
                    <a href="{{ url('provider/request/accept/' . $pending->id) }}" class="btn btn-success btn-sm">
                        <i class="fa fa-check"></i> Aceitar
                    </a>
                    <a href="{{ url('provider/request/decline/' . $pending->id) }}" class="btn btn-danger btn-sm">
                        <i class="fa fa-times"></i> Recusar
                    </a>
                    @if($waUrl)
                    <a href="{{ $waUrl }}" target="_blank" rel="noopener" class="btn btn-default btn-sm chama-wa-btn">
                        <i class="fa fa-whatsapp"></i> WhatsApp
                    </a>
                    @endif
                </div>
            </div>
        </div>
        @endforeach
    </div>
</div>
@endif

<div class="row chama-stat-row">
    <div class="col-md-3 col-sm-6">
        <div class="chama-stat-card">
            <span class="chama-stat-label">Corridas hoje</span>
            <strong>{{ $rides_today }}</strong>
        </div>
    </div>
    <div class="col-md-3 col-sm-6">
        <div class="chama-stat-card">
            <span class="chama-stat-label">Ganhos hoje</span>
            <strong>{{ $currency }} {{ number_format((float) $earnings_today, 2, ',', '.') }}</strong>
        </div>
    </div>
    <div class="col-md-3 col-sm-6">
        <div class="chama-stat-card">
            <span class="chama-stat-label">Distância total</span>
            <strong>{{ chama_format_distance_km($total_distance) }}</strong>
        </div>
    </div>
    <div class="col-md-3 col-sm-6">
        <div class="chama-stat-card">
            <span class="chama-stat-label">Avaliação média</span>
            <strong><i class="fa fa-star" style="color:#e8c547"></i> {{ number_format((float) $average_rating, 1, ',', '.') }}</strong>
        </div>
    </div>
</div>

<div class="chama-panel">
    <div class="chama-panel-head">
        <h4>Filtrar histórico</h4>
    </div>
    <form class="form-inline chama-filter-form" method="get" action="{{ URL::Route('ProviderTrips') }}">
        <div class="form-group">
            <label>De</label>
            <input type="text" class="form-control" id="start-date" name="start_date" value="{{ Input::get('start_date') }}" placeholder="dd/mm/aaaa">
        </div>
        <div class="form-group">
            <label>Até</label>
            <input type="text" class="form-control" id="end-date" name="end_date" value="{{ Input::get('end_date') }}" placeholder="dd/mm/aaaa">
        </div>
        <button type="submit" name="submit" value="filter" class="btn btn-theme"><i class="fa fa-filter"></i> Filtrar</button>
        <button type="submit" name="submit" value="export" class="btn btn-default"><i class="fa fa-download"></i> Exportar CSV</button>
    </form>
</div>

<div class="chama-panel">
    <div class="chama-panel-head chama-panel-head--row">
        <div>
            <h4>Histórico de corridas</h4>
            <p>{{ $total_rides }} concluídas · {{ $currency }} {{ number_format((float) $total_earnings, 2, ',', '.') }} total</p>
        </div>
    </div>
    <div class="table-responsive">
        <table class="table table-hover chama-table" id="trip-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Data</th>
                    <th>Passageiro</th>
                    <th>Categoria</th>
                    <th>Distância</th>
                    <th>Ganho</th>
                    <th>Status</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                @if(count($requests))
                @foreach($requests as $request)
                <?php $status = chama_ride_status_label($request); ?>
                <tr class="trip-basic" data-id="{{ URL::Route('ProviderTripDetail', $request->id) }}">
                    <td>{{ $request->id }}</td>
                    <td>{{ date('d/m/Y H:i', strtotime($request->request_start_time)) }}</td>
                    <td>
                        {{ $request->first_name }} {{ $request->last_name }}
                        @if($request->phone)<br><small>{{ $request->phone }}</small>@endif
                    </td>
                    <td>{{ $request->type ?: '—' }}</td>
                    <td>{{ chama_format_distance_km($request->distance) }}</td>
                    <td><strong>{{ $currency }} {{ number_format((float) $request->total, 2, ',', '.') }}</strong></td>
                    <td><span class="label label-{{ $status['class'] }}">{{ $status['label'] }}</span></td>
                    <td class="chama-table-actions" onclick="event.stopPropagation();">
                        @if(!empty($request->phone))
                        <a href="{{ chama_whatsapp_url($request->phone, 'Olá! Corrida #' . $request->id . ' — Chama no 12.') }}" target="_blank" rel="noopener" class="btn btn-xs chama-wa-btn" title="WhatsApp">
                            <i class="fa fa-whatsapp"></i>
                        </a>
                        @endif
                        <a href="{{ URL::Route('ProviderTripDetail', $request->id) }}" class="btn btn-xs btn-info">Detalhes</a>
                    </td>
                </tr>
                <tr class="trip-detail" style="display:none;">
                    <td colspan="8"><center>Carregando...</center></td>
                </tr>
                @endforeach
                @else
                <tr>
                    <td colspan="8" class="text-center chama-empty">Nenhuma corrida concluída ainda.</td>
                </tr>
                @endif
            </tbody>
        </table>
    </div>
</div>

<script type="text/javascript">
$(function() {
    $('.trip-basic').click(function() {
        var $this = $(this);
        var id = $(this).data('id');
        $this.next().toggle();
        $.ajax({
            url: id,
            type: 'get',
            success: function(msg) {
                if (msg === 'false') {
                    $this.next().html('<td colspan="8"><center>Sem detalhes</center></td>');
                } else {
                    $this.next().html(msg);
                }
            }
        });
    });

    $('#btn-toggle-online').on('click', function() {
        var $btn = $(this);
        $btn.prop('disabled', true);
        $.get('{{ URL::Route('toggle_availability') }}?format=json', function(data) {
            var online = parseInt(data.is_active, 10) === 1;
            $('#online-label').text(online ? 'Online' : 'Offline');
            $('#online-pill').toggleClass('is-online', online).toggleClass('is-offline', !online);
            $btn.text(online ? 'Ficar offline' : 'Ficar online').data('active', online ? 1 : 0);
        }).always(function() {
            $btn.prop('disabled', false);
        });
    });

    $('#start-date, #end-date').datepicker({
        dateFormat: 'dd/mm/yy',
        changeMonth: true,
        changeYear: true
    });
});
</script>

@stop
