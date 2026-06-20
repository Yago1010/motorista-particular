@extends('layout')

@section('content')
@include('chama._flash')

<div class="rh-stat-grid rh-stat-grid--compact">
    <div class="rh-stat-card">
        <div class="rh-stat-card-top">
            <div class="rh-stat-icon rh-stat-icon--purple"><i class="fa fa-user"></i></div>
        </div>
        <h2>{{ $stats['passengers'] }}</h2>
        <p>Passageiros cadastrados</p>
    </div>
    <div class="rh-stat-card">
        <div class="rh-stat-card-top">
            <div class="rh-stat-icon rh-stat-icon--green"><i class="fa fa-car"></i></div>
        </div>
        <h2>{{ $stats['drivers_approved'] }} <small>/ {{ $stats['drivers'] }}</small></h2>
        <p>Motoristas aprovados / total</p>
    </div>
    <div class="rh-stat-card">
        <div class="rh-stat-card-top">
            <div class="rh-stat-icon rh-stat-icon--orange"><i class="fa fa-clock-o"></i></div>
            @if($stats['drivers_pending'] > 0)
            <span class="rh-stat-badge rh-stat-badge--warn">Pendente</span>
            @endif
        </div>
        <h2>{{ $stats['drivers_pending'] }}</h2>
        <p>Motoristas aguardando aprovação</p>
    </div>
</div>

<div class="rh-module-grid rh-module-grid--users">
    <a href="{{ URL::Route('AdminUsers') }}" class="rh-user-hub-card">
        <div class="rh-user-hub-card-head">
            <div class="rh-stat-icon rh-stat-icon--purple"><i class="fa fa-users"></i></div>
            <span class="rh-user-hub-tag">Passageiros</span>
        </div>
        <h3>Gerenciar passageiros</h3>
        <p>Cadastros, perfis, histórico de corridas e dados de contato.</p>
        <span class="rh-user-hub-link">Abrir lista <i class="fa fa-arrow-right"></i></span>
    </a>
    <a href="{{ URL::Route('AdminProviders') }}" class="rh-user-hub-card">
        <div class="rh-user-hub-card-head">
            <div class="rh-stat-icon rh-stat-icon--green"><i class="fa fa-id-card"></i></div>
            <span class="rh-user-hub-tag">Motoristas</span>
        </div>
        <h3>Gerenciar motoristas</h3>
        <p>Aprovações, documentos, disponibilidade e performance.</p>
        <span class="rh-user-hub-link">Abrir lista <i class="fa fa-arrow-right"></i></span>
    </a>
    <a href="{{ URL::Route('AdminProviderAdd') }}" class="rh-user-hub-card rh-user-hub-card--action">
        <div class="rh-user-hub-card-head">
            <div class="rh-stat-icon rh-stat-icon--blue"><i class="fa fa-plus"></i></div>
        </div>
        <h3>Novo motorista</h3>
        <p>Cadastrar motorista manualmente pelo painel.</p>
        <span class="rh-user-hub-link">Cadastrar <i class="fa fa-arrow-right"></i></span>
    </a>
</div>

<div class="rh-panel">
    <div class="rh-panel-head">
        <h3><i class="fa fa-lightbulb-o"></i> Dicas rápidas</h3>
    </div>
    <div class="rh-panel-body rh-tips-list">
        <p><strong>Aprovar motoristas:</strong> em Motoristas, use os botões Aprovar / Recusar na linha do cadastro.</p>
        <p><strong>WhatsApp:</strong> nas corridas pendentes você pode contactar passageiro ou motorista direto.</p>
        <p><strong>Busca:</strong> use a barra no topo para encontrar nomes, e-mails ou placas.</p>
    </div>
</div>
@stop
