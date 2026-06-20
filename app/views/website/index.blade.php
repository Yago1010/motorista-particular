<!doctype html>
<html lang="pt-BR">
<head>
    <?php
        $logo = app_brand_logo();
        $favicon = app_brand_favicon();
        $siteTitle = isset($siteTitle) ? $siteTitle : Config::get('app.website_title', 'Chama no 12');
        $portal = isset($portal) ? $portal : chama_portal_urls();
    ?>
    <meta charset="UTF-8">
    <title>{{ $siteTitle }}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Chama no 12 — peça corridas, dirija ou gerencie a plataforma.">
    <link rel="icon" type="image/ico" href="<?php echo asset_url(); ?><?php echo $favicon; ?>">
    <link rel="stylesheet" href="<?php echo asset_url(); ?>/website/css/font-awesome.min.css">
    <link rel="stylesheet" href="<?php echo asset_url(); ?>/website/css/chama-brand.css">
</head>
<body class="chama-portal-home">

<header class="chama-portal-header">
    <a href="{{ $portal['home'] }}" class="chama-portal-brand">
        <img src="<?php echo asset_url(); ?><?php echo $logo; ?>" alt="{{ $siteTitle }}">
        <span>{{ $siteTitle }}</span>
    </a>
    <nav class="chama-portal-nav">
        <a href="{{ $portal['admin'] }}">Admin</a>
    </nav>
</header>

<main class="chama-portal-main">
    <section class="chama-portal-hero">
        <p class="chama-portal-kicker">Mobilidade urbana</p>
        <h1>O teu táxi, <span>quando precisas</span></h1>
        <p class="chama-portal-lead">
            Passageiros e motoristas usam os apps modernos. A gestão da operação fica no painel administrativo.
        </p>
    </section>

    <section class="chama-portal-grid">
        <a href="{{ $portal['rider'] }}" class="chama-portal-card chama-portal-card--rider">
            <div class="chama-portal-card-icon"><i class="fa fa-user"></i></div>
            <h2>App Passageiro</h2>
            <p>Pedir corrida, acompanhar viagem, pagamentos e histórico.</p>
            <span class="chama-portal-card-cta">Abrir app <i class="fa fa-arrow-right"></i></span>
            <small class="chama-portal-dev-hint">{{ $portal['rider'] }}</small>
        </a>

        <a href="{{ $portal['driver'] }}" class="chama-portal-card chama-portal-card--driver">
            <div class="chama-portal-card-icon"><i class="fa fa-car"></i></div>
            <h2>App Motorista</h2>
            <p>Corridas, ganhos, documentos, disponibilidade e chat.</p>
            <span class="chama-portal-card-cta">Abrir app <i class="fa fa-arrow-right"></i></span>
            <small class="chama-portal-dev-hint">{{ $portal['driver'] }}</small>
        </a>

        <a href="{{ $portal['admin'] }}" class="chama-portal-card chama-portal-card--admin">
            <div class="chama-portal-card-icon"><i class="fa fa-shield"></i></div>
            <h2>Painel Admin</h2>
            <p>Corridas, usuários, tarifas, cupons, cidades e anúncios.</p>
            <span class="chama-portal-card-cta">Entrar no admin <i class="fa fa-arrow-right"></i></span>
        </a>
    </section>

    <section class="chama-portal-note">
        <p>
            <i class="fa fa-info-circle"></i>
            @if(!empty($portal['rider_built']) && !empty($portal['driver_built']))
            Os apps já estão no mesmo servidor (<code>:8888</code>). Clique nos cards acima ou acesse direto:
            <code>{{ $portal['rider'] }}</code> e <code>{{ $portal['driver'] }}</code>.
            @else
            Ainda não há build dos apps. Na raiz do projeto execute <code>npm run build</code> e recarregue esta página,
            ou use <code>npm run dev</code> e abra <code>http://localhost:3000</code> (passageiro) e <code>:3001</code> (motorista).
            @endif
        </p>
    </section>
</main>

<footer class="chama-portal-footer">
    <p>&copy; {{ date('Y') }} {{ $siteTitle }}</p>
    <p><a href="{{ route('termsncondition') }}">Termos e condições</a></p>
</footer>

</body>
</html>
