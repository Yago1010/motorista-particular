<html lang="<?php echo App::getLocale() === 'pt' ? 'pt-BR' : e(App::getLocale()); ?>">
    <!-- START Head -->
    <head>
        <!-- START META SECTION -->
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title><?= e($title) ?> | <?= e(Config::get('app.website_title')) ?> <?= e(trans('admin.title_dashboard_suffix')) ?></title>
        <meta name="author" content="pampersdry.info">
        <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0">
<?php 
         $active = app_theme_active_color();
         $logo = app_brand_logo();
         $favicon = app_brand_favicon();
            ?>
        <link rel="icon" type="image/ico" href="<?php echo asset_url(); ?><?php echo $favicon;?>">
        <link rel="apple-touch-icon-precomposed" sizes="114x114" href="<?php echo asset_url(); ?>/image/touch/apple-touch-icon-114x114-precomposed.png">
        <link rel="apple-touch-icon-precomposed" sizes="72x72" href="<?php echo asset_url(); ?>/image/touch/apple-touch-icon-72x72-precomposed.png">
        <link rel="apple-touch-icon-precomposed" href="<?php echo asset_url(); ?>/image/touch/apple-touch-icon-57x57-precomposed.png">
        <link rel="shortcut icon" href="<?php echo asset_url(); ?>/image/touch/apple-touch-icon.png">
        <!--/ END META SECTION -->

        <!-- START STYLESHEETS -->
        <!-- Plugins stylesheet : optional -->

        <!--/ Plugins stylesheet -->

        <!-- Application stylesheet : mandatory -->
        <!--<link rel="stylesheet" href="<?php echo asset_url(); ?>library/bootstrap/css/bootstrap.min.css">
        <link rel="stylesheet" href="<?php echo asset_url(); ?>stylesheet/layout.min.css">
        <link rel="stylesheet" href="<?php echo asset_url(); ?>stylesheet/uielement.min.css">

        <link rel="stylesheet"href="<?php echo asset_url(); ?>plugins/datatables/css/jquery.datatables.min.css">
        -->
        <link href="<?php echo asset_url(); ?>/adminlogins/css/bootstrap.min.css" rel="stylesheet" type="text/css"/>
        <link href="<?php echo asset_url(); ?>/adminlogins/css/bootstrap-responsive.min.css" rel="stylesheet" type="text/css"/>
        <link href="<?php echo asset_url(); ?>/adminlogins/font-awesome/css/font-awesome.min.css" rel="stylesheet" type="text/css"/>
        <link href="<?php echo asset_url(); ?>/adminlogins/css/style-metro.css" rel="stylesheet" type="text/css"/>
        <link href="<?php echo asset_url(); ?>/adminlogins/css/style.css" rel="stylesheet" type="text/css"/>
        <link href="<?php echo asset_url(); ?>/adminlogins/css/style-responsive.css" rel="stylesheet" type="text/css"/>

        <!-- END GLOBAL MANDATORY STYLES -->
        <!-- BEGIN PAGE LEVEL STYLES -->
        <link href="<?php echo asset_url(); ?>/adminlogins/css/login-soft.css" rel="stylesheet" type="text/css"/>
        <link href="<?php echo asset_url(); ?>/adminlogins/css/chama-brand-login.css" rel="stylesheet" type="text/css"/>
        <link href="<?php echo asset_url(); ?>/web/css/password-toggle.css" rel="stylesheet" type="text/css"/>

        <!--/ END JAVASCRIPT SECTION -->
    </head>
    <!--/ END Head -->


<body class="login chama-admin-login">
    <div class="chama-admin-lang-switcher" style="position:absolute; top:12px; right:12px; z-index:10;">
        @include('partials.language-switcher')
    </div>
    <!-- BEGIN LOGO -->
    <div class="logo">
        <h2 style="color:#fff;">{{ trans('ui.admin_login_welcome', array('name' => Config::get('app.website_title'))) }}</h2>
        <img src="<?php echo asset_url(); ?><?php echo $logo;?>" alt="{{ Config::get('app.website_title') }}">
    </div>
    <!-- END LOGO -->
    <!-- BEGIN LOGIN -->
    <div class="content">
        <!-- BEGIN LOGIN FORM -->

        <form class="form-vertical login-form" action="{{ URL::Route('AdminVerify') }}" method="post">
            <h3 class="form-title">{{ trans('ui.admin_login_form_title') }}</h3>
       
            <div class="control-group">
                <!--ie8, ie9 does not support html5 placeholder, so we just show field title for that-->
                <label class="control-label visible-ie8 visible-ie9">{{ trans('ui.admin_login_username_label') }}</label>
                <div class="controls">
                    <div class="input-icon left">
                        <i class="icon-user"></i>
                        <input name="username" type="text" class="m-wrap placeholder-no-fix" autocomplete="username" placeholder="{{ trans('ui.admin_login_username_placeholder') }}" data-parsley-errors-container="#error-container" data-parsley-error-message="{{ trans('ui.admin_login_username_placeholder') }}" data-parsley-required>
                        
                    </div>
                </div>
            </div>
            <div class="control-group">
                <label class="control-label visible-ie8 visible-ie9">{{ trans('ui.admin_login_password_label') }}</label>
                <div class="controls">
                    <div class="input-icon left">
                        <i class="icon-lock"></i>
                        <div class="password-toggle-wrap">
                            <input name="password" id="admin-login-password" class="m-wrap placeholder-no-fix" autocomplete="current-password" type="password" placeholder="{{ trans('ui.admin_login_password_placeholder') }}" data-parsley-errors-container="#error-container" data-parsley-error-message="{{ trans('ui.admin_login_password_placeholder') }}" data-parsley-required>
                            <button type="button" class="password-toggle-btn" aria-label="{{ trans('ui.show_password') }}" data-label-show="{{ trans('ui.show_password') }}" data-label-hide="{{ trans('ui.hide_password') }}">
                                <i class="fa fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="form-actions">

            
                <button type="submit" class="btn blue pull-right">
                <?= $button ?>&nbsp;<i class="m-icon-swapright m-icon-white"></i>
                </button>            
            </div>

        </form>
        <!-- END LOGIN FORM -->        
        
    </div>
    <!-- END LOGIN -->


        <!-- START JAVASCRIPT SECTION (Load javascripts at bottom to reduce load time) -->
<!-- Library script : mandatory -->

<!--/ Library script -->


<!--/ App and page level scrip -->
<!--/ END JAVASCRIPT SECTION -->
<?php
if ($error) {
	$msg = ($error === 'db')
		? trans('ui.admin_login_error_db')
		: trans('ui.admin_login_error_invalid');
	?>
<script type="text/javascript">
    alert(<?php echo json_encode($msg); ?>);
</script>
<?php } ?>
<script src="<?php echo asset_url(); ?>/web/js/password-toggle.js" type="text/javascript"></script>
</body>
<!--/ END Body -->
</html>
