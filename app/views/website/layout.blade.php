<!DOCTYPE html>
<html lang="{{ App::getLocale() }}">
  <head>
    <meta charset="UTF-8">
    <title>{{$title}}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />

    <link rel="stylesheet" href="<?php echo asset_url(); ?>/website/css/bootstrap.min.css">

    <link rel="stylesheet" href="<?php echo asset_url(); ?>/website/css/font-awesome.min.css">

    <link rel="stylesheet" href="<?php echo asset_url(); ?>/website/css/animate.css">

    <link rel="stylesheet" href="<?php echo asset_url(); ?>/website/css/owl.carousel.css">
    <link rel="stylesheet" href="<?php echo asset_url(); ?>/website/css/owl.theme.css">
    <link rel="stylesheet" href="<?php echo asset_url(); ?>/website/css/styles.css">

    <link rel="stylesheet" href="<?php echo asset_url(); ?>/website/css/more.css">
    <link rel="stylesheet" href="<?php echo asset_url(); ?>/website/css/chama-brand.css">

    <script src="https://maps.googleapis.com/maps/api/js?v=3.exp&signed_in=true"></script>
    <script src="<?php echo asset_url(); ?>/website/js/modernizr.custom.32033.js"></script>

     <?php 
            $active = app_theme_active_color();
            $logo = app_brand_logo();
            $favicon = app_brand_favicon();
        ?>
    
    <!--[if IE]><script type="text/javascript" src="js/excanvas.compiled.js"></script><![endif]-->
    <!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->
    <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
    <!--[if lt IE 9]>
        <script src="https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js"></script>
        <script src="https://oss.maxcdn.com/libs/respond.js/1.4.2/respond.min.js"></script>
    <![endif]-->
  </head>
  <body class="chama-site">
     <div class="navbar navbar-default">
      <div class="container">
        <div class="navbar-header pull-left">    
          <a class="navbar-brand" href="/"><img src="<?php echo asset_url(); ?><?php echo $logo;?>" alt="" height="100%" width="auto"> {{$app_name}}</a>
        </div>
        <div class="navbar-header pull-right">
           <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
        </div>
        <div class="navbar-collapse collapse">
          <ul class="nav navbar-nav navbar-right">
            <li class="active"><a href="/">{{ trans('ui.home') }}</a></li>
            <li><a href="<?php echo chama_portal_url('rider'); ?>">App Passageiro</a></li>
            <li><a href="<?php echo chama_portal_url('driver'); ?>">App Motorista</a></li>
            <li><a href="<?php echo chama_portal_url('admin'); ?>">Admin</a></li>
            <li><a href="javascript:void(0)" style="padding-top:10px; padding-bottom:10px;">@include('partials.language-switcher')</a></li>
          </ul>
        </div>
      </div>
    </div>
    <div class="container">
      <div class="col-sm-12 trans-blk">
        @yield('content')
      </div>
    </div>
    <script src="<?php echo asset_url(); ?>/website/js/bootstrap.min.js"></script>
  </body>
</html>
