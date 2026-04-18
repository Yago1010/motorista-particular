<!DOCTYPE html>
<html lang="{{ App::getLocale() }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
    <meta name="author" content="Dashboard">
    <meta name="keyword" content="Dashboard, Bootstrap, Admin, Template, Theme, Responsive, Fluid, Retina">


    <title>{{Config::get('app.website_title')}}</title>

      <?php 
         $logo = app_brand_logo();
         $favicon = app_brand_favicon();
        ?>

    <link rel="icon" type="image/ico" href="<?php echo asset_url(); ?><?php echo $favicon;?>">

    <!-- Bootstrap core CSS -->
    <link href="<?php echo asset_url(); ?>/web/css/bootstrap.css" rel="stylesheet">
    <!--external css-->
    <link href="<?php echo asset_url(); ?>/web/font-awesome/css/font-awesome.css" rel="stylesheet" />
        
    <!-- Custom styles for this template -->
    <link href="<?php echo asset_url(); ?>/web/css/style.css" rel="stylesheet">
    <link href="<?php echo asset_url(); ?>/web/css/style-responsive.css" rel="stylesheet">
    <link href="<?php echo asset_url(); ?>/web/css/chama-brand.css" rel="stylesheet">
    <link href="<?php echo asset_url(); ?>/web/css/password-toggle.css" rel="stylesheet">

    <!-- HTML5 shim and Respond.js IE8 support of HTML5 elements and media queries -->
    <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js"></script>
      <script src="https://oss.maxcdn.com/libs/respond.js/1.4.2/respond.min.js"></script>
    <![endif]-->
  </head>

  <body class="chama-web">
    <div style="position:fixed; top:12px; right:12px; z-index:9999;">@include('partials.language-switcher')</div>

      <!-- **********************************************************************************************************************************************************
      MAIN CONTENT
      *********************************************************************************************************************************************************** -->

      <div id="login-page">
        <div class="container">
          <a href="/"><img class="imghome" src="<?php echo web_url(); ?><?php echo $logo;?>" alt=""></a>
              <form class="form-login" action="{{route('/user/verify')}}" method="post">
                <h2 class="form-login-heading">{{ trans('ui.sign_in_now') }}</h2>
                <div class="login-wrap">
                    <input type="text" name="email" class="form-control" placeholder="{{ trans('ui.email_address') }}" autofocus>
                    <br>
                    <div class="password-toggle-wrap">
                      <input type="password" name="password" id="user-login-password" class="form-control" placeholder="{{ trans('ui.password') }}" autocomplete="current-password">
                      <button type="button" class="password-toggle-btn" aria-label="{{ trans('ui.show_password') }}" data-label-show="{{ trans('ui.show_password') }}" data-label-hide="{{ trans('ui.hide_password') }}">
                        <i class="fa fa-eye"></i>
                      </button>
                    </div>
                    <label class="checkbox">
                        <span class="pull-right">
                            <a data-toggle="modal" href="login.html#myModal"> {{ trans('ui.forgot_password') }}</a>
        
                        </span>
                    </label>

                    @if(Session::has('error'))
                        <div class="alert alert-danger">
                            <b>{{ Session::get('error') }}</b> 
                        </div>
                    @endif
                    @if(Session::has('success'))
                        <div class="alert alert-success">
                            <b>{{ Session::get('success') }}</b> 
                        </div>
                    @endif


                    <button class="btn btn-theme btn-block" type="submit" id="user-signin"><i class="fa fa-lock"></i> {{ strtoupper(trans('ui.sign_in')) }}</button>
                    <hr>
                    <!--
                    <div class="login-social-link centered">
                    <p>or you can sign in via your social network</p>
                        <button class="btn btn-facebook" type="submit"><i class="fa fa-facebook"></i> Facebook</button>
                        <button class="btn btn-twitter" type="submit"><i class="fa fa-twitter"></i> Twitter</button>
                    </div>
                    -->
                    <div class="registration">
                        {{ trans('ui.dont_have_account') }}<br/>
                        <a class="" href="{{route('/user/signup')}}">
                            {{ trans('ui.create_account') }}
                        </a>
                    </div>
        
                </div>
              </form>
        
                  <!-- Modal -->
                  <div aria-hidden="true" aria-labelledby="myModalLabel" role="dialog" tabindex="-1" id="myModal" class="modal fade">
                      <div class="modal-dialog">
                          <div class="modal-content">
                              <div class="modal-header">
                                  <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                                  <h4 class="modal-title">{{ trans('ui.forgot_password') }}</h4>
                              </div>
                              <form method="POST" action="{{route('/user/forgot-password')}}">
                              <div class="modal-body">
                                  <p>{{ trans('ui.forgot_password_help') }}</p>
                                  <input type="text" name="email" placeholder="{{ trans('ui.email_address') }}" autocomplete="off"  class="form-control placeholder-no-fix">

        
                              </div>
                              <div class="modal-footer">
                                  <button data-dismiss="modal" class="btn btn-default" type="button">{{ trans('ui.cancel') }}</button>
                                  <button class="btn btn-theme" type="submit">{{ trans('ui.submit') }}</button>
                              </div>
                              </form>
                          </div>
                      </div>
                  </div>
                  <!-- modal -->
        
                  
        
        </div>
      </div>

    <!-- js placed at the end of the document so the pages load faster -->
    <script src="<?php echo asset_url(); ?>/web/js/jquery.js"></script>
    <script src="<?php echo asset_url(); ?>/web/js/bootstrap.min.js"></script>


    <!--BACKSTRETCH-->
    <!-- You can use an image of whatever size. This script will stretch to fit in any screen size.-->
    <script type="text/javascript" src="<?php echo asset_url(); ?>/web/js/jquery.backstretch.min.js"></script>
    <script>
        $.backstretch("<?php echo asset_url(); ?>/web/img/login-bg.jpg", {speed: 500});
    </script>

    
    <script src="<?php echo asset_url(); ?>/web/js/bootstrap-tour.js"></script>
    <script type="text/javascript">
      var tour = new Tour(
        {
          name: "userappLogin",
        });

        // Add your steps. Not too many, you don't really want to get your users sleepy
        tour.addSteps([
          {
            element: "#user-signin", 
            title: {!! json_encode(trans('ui.tour_user_login_title')) !!}, 
            content: {!! json_encode(trans('ui.tour_user_login_content')) !!},
             
          },
       ]);

     // Initialize the tour
     tour.init();

     // Start the tour
     tour.start();
  </script>
    <script src="<?php echo asset_url(); ?>/web/js/password-toggle.js" type="text/javascript"></script>

  </body>
</html>
