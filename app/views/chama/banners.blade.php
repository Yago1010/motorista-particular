@extends('layout')

@section('content')
@include('chama._flash')
<?php
    $rhToolbarLinks = array(
        array('url' => URL::Route('AdminReport'), 'label' => 'Dashboard', 'icon' => 'fa-th-large'),
        array('url' => URL::Route('AdminChamaBanners'), 'label' => 'Anúncios', 'icon' => 'fa-bullhorn', 'active' => true),
    );
?>
@include('partials.rh_toolbar')

<div class="chama-pricing-hint rh-hint-banner">
    Os anúncios ativos aparecem automaticamente nos apps <strong>Passageiro</strong> e <strong>Motorista</strong> via API <code>/api/app/banners</code>.
</div>

<div class="rh-admin-content row">
    <div class="col-md-5">
        <div class="box box-primary">
            <div class="box-header"><h3 class="box-title">Nova / Editar campanha</h3></div>
            <form method="post" action="{{ URL::Route('AdminChamaBannersSave') }}">
                <div class="box-body">
                    <input type="hidden" name="id" id="ban_id" value="">
                    <div class="form-group">
                        <label>Título *</label>
                        <input type="text" name="title" id="ban_title" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Subtítulo</label>
                        <input type="text" name="subtitle" id="ban_sub" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Descrição</label>
                        <textarea name="description" id="ban_desc" class="form-control" rows="2"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Texto do botão</label>
                        <input type="text" name="cta_label" id="ban_cta" class="form-control" value="Saiba mais">
                    </div>
                    <div class="form-group">
                        <label>Link (URL ao clicar)</label>
                        <input type="url" name="link_url" id="ban_link" class="form-control" placeholder="https://...">
                    </div>
                    <div class="form-group">
                        <label>Imagem (URL)</label>
                        <input type="url" name="image_url" id="ban_img" class="form-control">
                    </div>
                    <div class="row">
                        <div class="col-xs-6">
                            <div class="form-group">
                                <label>App alvo</label>
                                <select name="target_app" id="ban_app" class="form-control">
                                    <option value="both">Ambos</option>
                                    <option value="rider">Passageiro</option>
                                    <option value="driver">Motorista</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-xs-6">
                            <div class="form-group">
                                <label>Posição</label>
                                <select name="placement" id="ban_place" class="form-control">
                                    <option value="home">Tela inicial</option>
                                    <option value="wallet">Carteira</option>
                                    <option value="trip">Durante corrida</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Cidade (opcional)</label>
                        <select name="city_id" id="ban_city" class="form-control">
                            <option value="">Todas as cidades</option>
                            @foreach($cities as $city)
                            <option value="{{ $city->id }}">{{ $city->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="row">
                        <div class="col-xs-6">
                            <div class="form-group">
                                <label>Início</label>
                                <input type="datetime-local" name="starts_at" id="ban_start" class="form-control">
                            </div>
                        </div>
                        <div class="col-xs-6">
                            <div class="form-group">
                                <label>Fim</label>
                                <input type="datetime-local" name="ends_at" id="ban_end" class="form-control">
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Ordem</label>
                        <input type="number" name="sort_order" id="ban_sort" class="form-control" value="0">
                    </div>
                    <div class="checkbox">
                        <label><input type="checkbox" name="is_active" value="1" id="ban_active" checked> Campanha ativa</label>
                    </div>
                </div>
                <div class="box-footer">
                    <button type="submit" class="btn btn-success">Salvar anúncio</button>
                    <button type="button" class="btn btn-default" onclick="clearBanForm()">Limpar</button>
                </div>
            </form>
        </div>
    </div>
    <div class="col-md-7">
        <div class="box box-info tbl-box">
            <div class="box-header"><h3 class="box-title">Campanhas ({{ count($banners) }})</h3></div>
            <table class="table table-bordered table-striped">
                <thead>
                    <tr>
                        <th>Título</th>
                        <th>App</th>
                        <th>Posição</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($banners as $ban)
                    <tr>
                        <td>
                            <strong>{{ $ban->title }}</strong><br>
                            <small>{{ $ban->subtitle }}</small>
                        </td>
                        <td>{{ $ban->target_app }}</td>
                        <td>{{ $ban->placement }}</td>
                        <td>{!! $ban->is_active ? '<span class="label label-success">Ativo</span>' : '<span class="label label-default">Pausado</span>' !!}</td>
                        <td>
                            <button type="button" class="btn btn-xs btn-info" onclick="editBan(<?= htmlspecialchars(json_encode($ban), ENT_QUOTES, 'UTF-8') ?>)">Editar</button>
                            <a href="{{ URL::Route('AdminChamaBannersToggle', $ban->id) }}" class="btn btn-xs btn-warning">{{ $ban->is_active ? 'Pausar' : 'Ativar' }}</a>
                            <a href="{{ URL::Route('AdminChamaBannersDelete', $ban->id) }}" class="btn btn-xs btn-danger" onclick="return confirm('Excluir?')">Excluir</a>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>
</div>

<script>
function editBan(b) {
    document.getElementById('ban_id').value = b.id;
    document.getElementById('ban_title').value = b.title;
    document.getElementById('ban_sub').value = b.subtitle || '';
    document.getElementById('ban_desc').value = b.description || '';
    document.getElementById('ban_cta').value = b.cta_label || 'Saiba mais';
    document.getElementById('ban_link').value = b.link_url || '';
    document.getElementById('ban_img').value = b.image_url || '';
    document.getElementById('ban_app').value = b.target_app || 'both';
    document.getElementById('ban_place').value = b.placement || 'home';
    document.getElementById('ban_city').value = b.city_id || '';
    document.getElementById('ban_sort').value = b.sort_order || 0;
    document.getElementById('ban_active').checked = b.is_active == 1;
}
function clearBanForm() {
    document.getElementById('ban_id').value = '';
    ['ban_title','ban_sub','ban_desc','ban_link','ban_img'].forEach(function(id){ document.getElementById(id).value = ''; });
    document.getElementById('ban_cta').value = 'Saiba mais';
    document.getElementById('ban_app').value = 'both';
    document.getElementById('ban_place').value = 'home';
    document.getElementById('ban_city').value = '';
    document.getElementById('ban_sort').value = 0;
    document.getElementById('ban_active').checked = true;
}
</script>
@stop
