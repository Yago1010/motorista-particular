<!DOCTYPE html>
<!-- saved from url=(0050)http://getbootstrap.com/examples/jumbotron-narrow/ -->
<html lang="en"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="">
    <meta name="author" content="">
    <link rel="shortcut icon" href="{{ asset_url(); }}/installer/favicon.ico" type="image/x-icon">
    <link rel="icon" href="{{ asset_url(); }}/installer/favicon.ico" type="image/x-icon">
    <?php 
         $active='#000066';
         $logo = app_brand_logo();
         $favicon = app_brand_favicon();
    ?>

        <link rel="icon" type="image/ico" href="<?php echo asset_url(); ?><?php echo $favicon;?>">


    <title>Uber For X Installation</title>

    <!-- Bootstrap core CSS -->
    <link href="{{ asset_url(); }}/installer/css/bootstrap.min.css" rel="stylesheet">

    <!-- Custom styles for this template -->
    <link href="{{ asset_url(); }}/installer/css/jumbotron-narrow.css" rel="stylesheet">
    <link href="//cdnjs.cloudflare.com/ajax/libs/font-awesome/4.2.0/css/font-awesome.min.css" rel="stylesheet" type="text/css" />
    <link href="<?php echo asset_url(); ?>/web/css/password-toggle.css" rel="stylesheet" type="text/css" />

    <script src="{{ asset_url(); }}/installer/js/ie-emulation-modes-warning.js"></script>
    <script src="{{ asset_url(); }}/installer/js/ie10-viewport-bug-workaround.js"></script>
    <script src="https://code.jquery.com/jquery-2.1.1.min.js"></script>

  </head>

  <body>

    <div class="container">
      <div class="header">
        <h3 class="text-muted"><img src="<?php echo asset_url(); ?><?php echo $logo; ?>" width="75" height="75" alt="">&nbsp;&nbsp;Uber For X</h3>
      </div>

      @yield('content')

      <footer class="footer">
        <center><p>© Proven Logic 2014</p></center>
      </footer>

    </div> <!-- /container -->

    <script src="<?php echo asset_url(); ?>/web/js/password-toggle.js" type="text/javascript"></script>

</body></html>