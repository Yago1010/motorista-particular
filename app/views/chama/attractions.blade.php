@extends('layout')

@section('content')
@include('chama._flash')

<p><a href="{{ URL::Route('AdminReport') }}" class="btn btn-default btn-sm"><i class="fa fa-arrow-left"></i> Dashboard</a></p>

<div class="row">
    <div class="col-md-5">
        <div class="box box-primary">
            <div class="box-header"><h3 class="box-title">Nova / Editar atração</h3></div>
            <form method="post" action="{{ URL::Route('AdminChamaAttractionsSave') }}">
                <div class="box-body">
                    <input type="hidden" name="id" id="attr_id" value="">
                    <div class="form-group">
                        <label>Cidade</label>
                        <select name="city_id" id="attr_city" class="form-control">
                            <option value="">— Todas / sem cidade —</option>
                            @foreach($cities as $city)
                            <option value="{{ $city->id }}">{{ $city->name }} ({{ $city->state }})</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Nome da atração *</label>
                        <input type="text" name="name" id="attr_name" class="form-control" required placeholder="Ex: Avenida Paulista">
                    </div>
                    <div class="form-group">
                        <label>Descrição</label>
                        <textarea name="description" id="attr_desc" class="form-control" rows="3"></textarea>
                    </div>
                    <div class="row">
                        <div class="col-xs-6">
                            <div class="form-group">
                                <label>Latitude</label>
                                <input type="text" name="latitude" id="attr_lat" class="form-control">
                            </div>
                        </div>
                        <div class="col-xs-6">
                            <div class="form-group">
                                <label>Longitude</label>
                                <input type="text" name="longitude" id="attr_lng" class="form-control">
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>URL da imagem</label>
                        <input type="url" name="image_url" id="attr_img" class="form-control" placeholder="https://...">
                    </div>
                    <div class="form-group">
                        <label>Ordem</label>
                        <input type="number" name="sort_order" id="attr_sort" class="form-control" value="0">
                    </div>
                    <div class="checkbox">
                        <label><input type="checkbox" name="is_active" value="1" id="attr_active" checked> Ativa no app</label>
                    </div>
                </div>
                <div class="box-footer">
                    <button type="submit" class="btn btn-success">Salvar atração</button>
                    <button type="button" class="btn btn-default" onclick="clearAttrForm()">Limpar</button>
                </div>
            </form>
        </div>
    </div>
    <div class="col-md-7">
        <div class="box box-info tbl-box">
            <div class="box-header"><h3 class="box-title">Atrações ({{ count($attractions) }})</h3></div>
            <table class="table table-bordered table-striped">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Cidade</th>
                        <th>Ordem</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($attractions as $attr)
                    <tr>
                        <td><strong>{{ $attr->name }}</strong><br><small><?= e(strlen($attr->description) > 60 ? substr($attr->description, 0, 60) . '...' : $attr->description) ?></small></td>
                        <td>{{ $attr->city ? $attr->city->name : '—' }}</td>
                        <td>{{ $attr->sort_order }}</td>
                        <td>{!! $attr->is_active ? '<span class="label label-success">Ativa</span>' : '<span class="label label-default">Inativa</span>' !!}</td>
                        <td>
                            <button type="button" class="btn btn-xs btn-info" onclick="editAttr(<?= htmlspecialchars(json_encode($attr), ENT_QUOTES, 'UTF-8') ?>)">Editar</button>
                            <a href="{{ URL::Route('AdminChamaAttractionsDelete', $attr->id) }}" class="btn btn-xs btn-danger" onclick="return confirm('Remover?')">Excluir</a>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>

<script>
function editAttr(a) {
    document.getElementById('attr_id').value = a.id;
    document.getElementById('attr_city').value = a.city_id || '';
    document.getElementById('attr_name').value = a.name;
    document.getElementById('attr_desc').value = a.description || '';
    document.getElementById('attr_lat').value = a.latitude || '';
    document.getElementById('attr_lng').value = a.longitude || '';
    document.getElementById('attr_img').value = a.image_url || '';
    document.getElementById('attr_sort').value = a.sort_order || 0;
    document.getElementById('attr_active').checked = a.is_active == 1;
}
function clearAttrForm() {
    ['attr_id','attr_name','attr_desc','attr_lat','attr_lng','attr_img'].forEach(function(id){ document.getElementById(id).value = ''; });
    document.getElementById('attr_city').value = '';
    document.getElementById('attr_sort').value = 0;
    document.getElementById('attr_active').checked = true;
}
</script>
@stop
