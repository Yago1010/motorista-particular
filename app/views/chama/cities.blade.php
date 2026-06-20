@extends('layout')

@section('content')
@include('chama._flash')
<?php
    $rhToolbarLinks = array(
        array('url' => URL::Route('AdminReport'), 'label' => 'Dashboard', 'icon' => 'fa-th-large'),
        array('url' => URL::Route('AdminChamaCities'), 'label' => 'Cidades', 'icon' => 'fa-building', 'active' => true),
    );
?>
@include('partials.rh_toolbar')

<div class="rh-admin-content row">
    <div class="col-md-5">
        <div class="box box-primary">
            <div class="box-header"><h3 class="box-title">Nova / Editar cidade</h3></div>
            <form method="post" action="{{ URL::Route('AdminChamaCitiesSave') }}">
                <div class="box-body">
                    <input type="hidden" name="id" id="city_id" value="">
                    <div class="form-group">
                        <label>Nome da cidade *</label>
                        <input type="text" name="name" id="city_name" class="form-control" required placeholder="Ex: São Paulo">
                    </div>
                    <div class="form-group">
                        <label>Estado (UF)</label>
                        <input type="text" name="state" id="city_state" class="form-control" maxlength="2" placeholder="SP">
                    </div>
                    <div class="form-group">
                        <label>País</label>
                        <input type="text" name="country" id="city_country" class="form-control" value="Brasil">
                    </div>
                    <div class="row">
                        <div class="col-xs-6">
                            <div class="form-group">
                                <label>Latitude</label>
                                <input type="text" name="latitude" id="city_lat" class="form-control" placeholder="-23.5505">
                            </div>
                        </div>
                        <div class="col-xs-6">
                            <div class="form-group">
                                <label>Longitude</label>
                                <input type="text" name="longitude" id="city_lng" class="form-control" placeholder="-46.6333">
                            </div>
                        </div>
                    </div>
                    <div class="checkbox">
                        <label><input type="checkbox" name="is_active" value="1" id="city_active" checked> Cidade ativa</label>
                    </div>
                </div>
                <div class="box-footer">
                    <button type="submit" class="btn btn-success">Salvar cidade</button>
                    <button type="button" class="btn btn-default" onclick="clearCityForm()">Limpar</button>
                </div>
            </form>
        </div>
    </div>
    <div class="col-md-7">
        <div class="box box-info tbl-box">
            <div class="box-header"><h3 class="box-title">Cidades cadastradas ({{ count($cities) }})</h3></div>
            <table class="table table-bordered table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cidade</th>
                        <th>UF</th>
                        <th>Coordenadas</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($cities as $city)
                    <tr>
                        <td>{{ $city->id }}</td>
                        <td><strong>{{ $city->name }}</strong></td>
                        <td>{{ $city->state }}</td>
                        <td>{{ $city->latitude }}, {{ $city->longitude }}</td>
                        <td>{!! $city->is_active ? '<span class="label label-success">Ativa</span>' : '<span class="label label-default">Inativa</span>' !!}</td>
                        <td>
                            <button type="button" class="btn btn-xs btn-info" onclick="editCity(<?= htmlspecialchars(json_encode($city), ENT_QUOTES, 'UTF-8') ?>)">Editar</button>
                            <a href="{{ URL::Route('AdminChamaCitiesDelete', $city->id) }}" class="btn btn-xs btn-danger" onclick="return confirm('Remover esta cidade?')">Excluir</a>
                        </td>
                    </tr>
                    @empty
                    <tr><td colspan="6" class="text-center">Nenhuma cidade cadastrada.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
</div>

<script>
function editCity(c) {
    document.getElementById('city_id').value = c.id;
    document.getElementById('city_name').value = c.name;
    document.getElementById('city_state').value = c.state || '';
    document.getElementById('city_country').value = c.country || 'Brasil';
    document.getElementById('city_lat').value = c.latitude || '';
    document.getElementById('city_lng').value = c.longitude || '';
    document.getElementById('city_active').checked = c.is_active == 1;
}
function clearCityForm() {
    document.getElementById('city_id').value = '';
    document.getElementById('city_name').value = '';
    document.getElementById('city_state').value = '';
    document.getElementById('city_country').value = 'Brasil';
    document.getElementById('city_lat').value = '';
    document.getElementById('city_lng').value = '';
    document.getElementById('city_active').checked = true;
}
</script>
@stop
