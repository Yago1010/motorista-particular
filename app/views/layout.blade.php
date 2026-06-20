<!DOCTYPE html>
<html lang="<?php echo App::getLocale() === 'pt' ? 'pt-BR' : e(App::getLocale()); ?>">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0">
        <title><?= e($title) ?> | <?= e(Config::get('app.website_title')) ?></title>

        <?php
            $active = app_theme_active_color();
            $logo = app_brand_logo();
            $favicon = app_brand_favicon();
            $siteTitle = Config::get('app.website_title', 'Chama no 12');
            $rhNav = chama_admin_nav_stats();
        ?>

        <link rel="icon" type="image/ico" href="<?php echo asset_url(); ?><?php echo $favicon;?>">
        <link href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css" rel="stylesheet" type="text/css" />
        <link href="//cdnjs.cloudflare.com/ajax/libs/font-awesome/4.2.0/css/font-awesome.min.css" rel="stylesheet" type="text/css" />
        <link href="<?php echo asset_url(); ?>/admins/css/AdminLTE.css" rel="stylesheet" type="text/css" />
        <link href="<?php echo asset_url(); ?>/admins/css/custom-admin.css" rel="stylesheet" type="text/css" />
        <link href="<?php echo asset_url(); ?>/admins/css/chama-admin.css" rel="stylesheet" type="text/css" />
        <link href="<?php echo asset_url(); ?>/web/css/password-toggle.css" rel="stylesheet" type="text/css" />

        <script src="//ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>
        <link rel="stylesheet" href="//code.jquery.com/ui/1.11.3/themes/smoothness/jquery-ui.css">
        <script src="//code.jquery.com/ui/1.11.3/jquery-ui.js"></script>
        <script src="<?php echo asset_url(); ?>/admins/js/validator/jquery.validate.min.js"></script>
        <style type="text/css">.error { color: #f87171; }</style>
    </head>

    <body class="skin-blue skin-chama rh-console">
        <header class="header"></header>

        <div class="wrapper row-offcanvas row-offcanvas-left">
            <aside class="left-side sidebar-offcanvas">
                <section class="sidebar rh-sidebar">
                    <div class="rh-sidebar-brand">
                        <img src="<?php echo asset_url(); ?><?php echo $logo; ?>" alt="<?php echo e($siteTitle); ?>">
                        <div class="rh-sidebar-brand-text">
                            <strong><?php echo e($siteTitle); ?></strong>
                            <small>Admin Console</small>
                        </div>
                    </div>

                    <p class="rh-menu-label">Menu principal</p>
                    <ul class="sidebar-menu">
                        <li id="dashboard">
                            <a href="{{ URL::Route('AdminReport') }}"><i class="fa fa-th-large"></i> <span>Dashboard</span></a>
                        </li>
                        <li id="chama-users">
                            <a href="{{ URL::Route('AdminChamaUsers') }}">
                                <i class="fa fa-users"></i>
                                <span>Usuários</span>
                                @if($rhNav['pending_drivers'] > 0)
                                <span class="rh-nav-badge">{{ $rhNav['pending_drivers'] }}</span>
                                @endif
                            </a>
                        </li>
                        <li id="walks">
                            <a href="{{ URL::Route('AdminRequests') }}">
                                <i class="fa fa-check-circle"></i>
                                <span>Aprovar Corridas</span>
                                @if($rhNav['pending_rides'] > 0)
                                <span class="rh-nav-badge">{{ $rhNav['pending_rides'] }}</span>
                                @endif
                            </a>
                        </li>
                        <li id="map-view">
                            <a href="{{ URL::Route('AdminMapview') }}"><i class="fa fa-map-marker"></i> <span>Corridas ao Vivo</span></a>
                        </li>
                        <li id="payments">
                            <a href="{{ URL::Route('AdminPayment') }}"><i class="fa fa-money"></i> <span>Financeiro</span></a>
                        </li>
                        <li id="promo_code">
                            <a href="{{ URL::Route('AdminPromoCodes') }}"><i class="fa fa-gift"></i> <span>Cupons &amp; Promoções</span></a>
                        </li>
                        <li id="settings">
                            <a href="{{ URL::Route('AdminSettings') }}"><i class="fa fa-cog"></i> <span>Configurações</span></a>
                        </li>

                        <li class="header">Operação Chama</li>
                        <li id="pricing"><a href="{{ URL::Route('AdminPricing') }}"><i class="fa fa-calculator"></i> <span>Tarifas / KM</span></a></li>
                        <li id="chama-cities"><a href="{{ URL::Route('AdminChamaCities') }}"><i class="fa fa-building"></i> <span>Cidades</span></a></li>
                        <li id="chama-banners"><a href="{{ URL::Route('AdminChamaBanners') }}"><i class="fa fa-bullhorn"></i> <span>Anúncios</span></a></li>
                        <li id="reviews"><a href="{{ URL::Route('AdminReviews') }}"><i class="fa fa-thumbs-up"></i> <span>Avaliações</span></a></li>
                    </ul>

                    <div class="rh-sidebar-status">
                        <strong><span class="rh-status-dot"></span> Sistema online</strong>
                        <small>API estável · Chama no 12</small>
                    </div>
                </section>
            </aside>

            <aside class="right-side">
                <div class="rh-topbar">
                    <button type="button" class="rh-topbar-btn rh-mobile-toggle" id="rh-sidebar-toggle" aria-label="Menu">
                        <i class="fa fa-bars"></i>
                    </button>
                    <form class="rh-topbar-search" method="get" action="{{ URL::Route('AdminSearch') }}">
                        <input type="hidden" name="type" value="user">
                        <i class="fa fa-search"></i>
                        <input type="search" name="q" placeholder="Buscar corridas, nomes, placas..." autocomplete="off">
                    </form>
                    <div class="rh-topbar-actions">
                        <a href="{{ URL::Route('AdminMapview') }}" class="rh-topbar-btn" title="Mapa ao vivo"><i class="fa fa-map"></i></a>
                        <a href="{{ URL::Route('AdminAdmins') }}" class="rh-topbar-avatar" title="Admin">A</a>
                        <a href="{{ URL::Route('AdminLogout') }}" class="rh-topbar-btn" title="Sair"><i class="fa fa-sign-out"></i></a>
                    </div>
                </div>

                <section class="content">
                    <div class="rh-page-head">
                        <h1><?= e($title) ?></h1>
                        <p>Painel administrativo — <?= e($siteTitle) ?></p>
                    </div>
                    @yield('content')
                </section>
            </aside>
        </div>

        <script src="//maxcdn.bootstrapcdn.com/bootstrap/3.3.1/js/bootstrap.min.js"></script>
        <script src="<?php echo asset_url(); ?>/admins/js/AdminLTE/app.js"></script>
        <script type="text/javascript">
            (function () {
                var page = <?php echo json_encode($page); ?>;
                var userPages = ['chama-users', 'owners', 'walkers'];
                if (userPages.indexOf(page) >= 0) {
                    $('#chama-users').addClass('active');
                } else {
                    $('#' + page).addClass('active');
                }
            })();
            $('#rh-sidebar-toggle').on('click', function () {
                $('body').toggleClass('sidebar-open');
            });
        </script>
        <script>
            $(function () {
                $("#start-date, #end-date").datepicker({
                    dateFormat: 'dd/mm/yy',
                    changeMonth: true,
                    changeYear: true
                });
            });
        </script>
        <script src="<?php echo asset_url(); ?>/web/js/password-toggle.js"></script>
    </body>
</html>
