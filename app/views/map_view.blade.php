@extends('layout')

@section('content')

<div class="rh-page-header">
    <h1 class="rh-page-title">Mapa ao vivo</h1>
    <p class="rh-page-subtitle">Motoristas e corridas ativas — atualização a cada 10s</p>
</div>

<div class="rh-toolbar rh-toolbar--map">
    <label class="rh-filter">
        <input type="checkbox" id="filter-online" checked> Online
    </label>
    <label class="rh-filter">
        <input type="checkbox" id="filter-onride" checked> Em corrida
    </label>
    <label class="rh-filter">
        <input type="checkbox" id="filter-offline"> Offline
    </label>
    <span id="map-updated" class="rh-muted"></span>
</div>

<div class="rh-map-legend">
    <span><i class="rh-dot rh-dot--online"></i> Online</span>
    <span><i class="rh-dot rh-dot--onride"></i> Em corrida</span>
    <span><i class="rh-dot rh-dot--offline"></i> Offline</span>
    <span><i class="rh-dot rh-dot--ride"></i> Corrida ativa</span>
</div>

<div id="admin-live-map" class="rh-live-map"></div>

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<style>
.rh-live-map { height: 620px; width: 100%; border-radius: 12px; border: 1px solid rgba(57,255,106,.15); }
.rh-toolbar--map { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; margin-bottom: .75rem; }
.rh-filter { color: #cbd5e1; font-size: .9rem; display: flex; gap: .35rem; align-items: center; }
.rh-map-legend { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: .75rem; color: #94a3b8; font-size: .85rem; }
.rh-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 4px; }
.rh-dot--online { background: #39ff6a; }
.rh-dot--onride { background: #fbbf24; }
.rh-dot--offline { background: #64748b; }
.rh-dot--ride { background: #38bdf8; }
.rh-muted { color: #64748b; font-size: .8rem; margin-left: auto; }
</style>
<script>
(function () {
    var centerLat = {{ (float) $center_latitude }};
    var centerLng = {{ (float) $center_longitude }};
    var map = L.map('admin-live-map', { zoomControl: true }).setView([centerLat, centerLng], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19
    }).addTo(map);

    var driverLayer = L.layerGroup().addTo(map);
    var rideLayer = L.layerGroup().addTo(map);

    function driverIcon(state) {
        var color = state === 'online' ? '#39ff6a' : (state === 'on_ride' ? '#fbbf24' : '#64748b');
        return L.divIcon({
            className: '',
            html: '<div style="background:' + color + ';width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });
    }

    function rideLineColor() { return '#38bdf8'; }

    function filters() {
        return {
            online: document.getElementById('filter-online').checked,
            onride: document.getElementById('filter-onride').checked,
            offline: document.getElementById('filter-offline').checked
        };
    }

    function shouldShowDriver(d, f) {
        if (d.state === 'online') return f.online;
        if (d.state === 'on_ride' || d.state === 'busy') return f.onride;
        return f.offline;
    }

    function loadMapData() {
        fetch('/admin/map_data', { credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                driverLayer.clearLayers();
                rideLayer.clearLayers();
                var f = filters();
                (data.drivers || []).forEach(function (d) {
                    if (!d.lat || !d.lng || !shouldShowDriver(d, f)) return;
                    var m = L.marker([d.lat, d.lng], { icon: driverIcon(d.state) });
                    m.bindPopup('<strong>' + (d.name || 'Motorista') + '</strong><br>Estado: ' + d.state + (d.ride_id ? '<br>Corrida #' + d.ride_id : ''));
                    driverLayer.addLayer(m);
                });
                (data.rides || []).forEach(function (r) {
                    if (!r.origin_lat || !r.dest_lat) return;
                    var line = L.polyline([[r.origin_lat, r.origin_lng], [r.dest_lat, r.dest_lng]], { color: rideLineColor(), weight: 3, opacity: 0.85 });
                    line.bindPopup('Corrida #' + r.id + '<br>' + (r.origin_address || '') + ' → ' + (r.destination_address || '') + '<br>R$ ' + (r.fare || 0).toFixed(2));
                    rideLayer.addLayer(line);
                    L.circleMarker([r.origin_lat, r.origin_lng], { radius: 5, color: '#39ff6a', fillColor: '#39ff6a', fillOpacity: 1 }).addTo(rideLayer);
                    L.circleMarker([r.dest_lat, r.dest_lng], { radius: 5, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1 }).addTo(rideLayer);
                });
                document.getElementById('map-updated').textContent = 'Atualizado: ' + new Date().toLocaleTimeString('pt-BR');
            })
            .catch(function () {
                document.getElementById('map-updated').textContent = 'Erro ao carregar mapa';
            });
    }

    ['filter-online', 'filter-onride', 'filter-offline'].forEach(function (id) {
        document.getElementById(id).addEventListener('change', loadMapData);
    });

    loadMapData();
    setInterval(loadMapData, 10000);
})();
</script>

@endsection
