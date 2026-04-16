<?php

// My common functions

function get_user_time($remote_tz, $origin_tz = null, $time){
        if ($origin_tz === null) {
            if (!is_string($origin_tz = date_default_timezone_get())) {
                return false; // A UTC timestamp was returned -- bail out!
            }
        }
        $origin_dtz = new DateTimeZone($origin_tz);
        $remote_dtz = new DateTimeZone($remote_tz);
        $origin_dt = new DateTime("now", $origin_dtz);
        $remote_dt = new DateTime("now", $remote_dtz);
        $offset = $origin_dtz->getOffset($origin_dt) - $remote_dtz->getOffset($remote_dt);
        
        $time_new = strtotime($time) + $offset;

        $new_time = date("Y-m-d H:i:s", $time_new);
        return $new_time;
}

function check_cache($key){

    $time = time();
    $cash = Cash::where('key', 'like', '%' . $key . '%')->where('expiry', '>', $time)->first();

    if(isset($cash)){
        return true;
    }else{
        return false;
    }
}

function update_cache($key, $rate){
    
    $cash = Cash::where('key', 'like', '%' . $key . '%')->first();
    
    if($cash != NULL){

    $cash->value = $rate;
    $time = time() + 86400;
    $cash->expiry = $time;
    $cash->save();    
    }else{
        $cash = new Cash;
        $cash->key = $key;
        $cash->value = $rate;
        $time = time() + 86400;
        $cash->expiry = $time;
        $cash->save();
    }
}

function currency_converted($total){
        
    $currency_selected = Keywords::find(5);
    $currency_sel = $currency_selected->keyword;
    if($currency_sel=='$'){
        $currency_sel = "USD";
    }else{
        $currency_sel = $currency_selected->keyword;
    }
    if($currency_sel!='USD'){
        $check = check_cache($currency_sel);
        
        if(!$check){
        $url = "http://currency-api.appspot.com/api/USD/".$currency_sel.".json?key=65d69f1a909b37e41272574dcd20c30fb2fbb06e";

        $result = file_get_contents($url);
        $result = json_decode($result);
        $rate = $result->rate;
        update_cache($currency_sel, $rate);
        $total=$total*$rate;
        }else{   
            $rate = Cash::where('key', 'like', '%' . $currency_sel . '%')->first();
            $total = $total*$rate->value;
        }
    }else{
        $total = $total;
    }
    return $total;
}


function clean($string)
{
    $string = str_replace(' ', '-', $string); // Replaces all spaces with hyphens.

    return preg_replace('/[^A-Za-z0-9\-]/', '', $string); // Removes special chars.
}

function generate_token()
{
    return clean(Hash::make(rand() . time() . rand()));
}

function generate_expiry()
{
    return time() + 3600000;
}

function convert($value, $type)
{
    if ($value > 0) {
        if ($type == 1) {
            // Miles
            return $value / 1609;
        } else {
            // KM
            return $value / 1000;
        }
    } else {
        return 0;
    }
}

function is_token_active($ts)
{
    if ($ts >= time()) {
        return true;
    } else {
        return false;
    }
}

function email_notification($id, $type, $message_body, $subject)
{

    $settings = Settings::where('key', 'email_notification')->first();
    $email_notification = $settings->value;
    if ($type == 'walker') {
        $user = Walker::find($id);
        $email = $user->email;
        // dd($email);
    } elseif ($type == 'admin') {
        $settings = Settings::where('key', 'admin_email_address')->first();
        $email = $settings->value;
         //dd($email);
    } else {
        $user = Owner::find($id);
        $email = $user->email;
      //  dd($email);

    }
    if ($email_notification == 1) {

        try {
              //  dd($email);
            Mail::send('emails.layout', array('mail_body' => $message_body), function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
            });

           // dd('yoyo');
          

        } catch (Exception $e) {
            Log::error($e->getMessage());

       }
    }else{
        if($subject == 'forgotpassword' or $subject == 'Your New Password'){
            Log::info('Forget password mail.');
            Mail::send('emails.layout', array('mail_body' => $message_body), function ($message) use ($email, $subject) {
                    $message->to($email)->subject($subject);
                });
        }
        Log::info('Mail turned off.');
    }
    
}

function send_email($id, $type, $email_data, $subject, $email_type)
{

    $settings = Settings::where('key', 'email_notification')->first();
    $email_notification = $settings->value;
    if ($type == 'walker') {
        $user = Walker::find($id);
        $email = $user->email;
        // dd($email);
    } elseif ($type == 'admin') {
        $settings = Settings::where('key', 'admin_email_address')->first();
        $email = $settings->value;
         //dd($email);
    } else {
        $user = Owner::find($id);
        $email = $user->email;
      //  dd($email);

    }
    if ($email_notification == 1) {

        try {
              //  dd($email);
            if($email_type == "invoice"){
            Mail::send('emails.invoice', array('email_data' => $email_data), function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
                });
            }else if($email_type == 'userregister'){
                Mail::send('emails.userregister', array('email_data' => $email_data), function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
                });
            }else if($email_type == 'providerregister'){
                Mail::send('emails.providerregister', array('email_data' => $email_data), function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
                });
            }
            else if($email_type == 'forgotpassword'){
                Mail::send('emails.forgotpassword', array('email_data' => $email_data), function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
                });
            }else{
                Mail::send('emails.layout', array('mail_body' => $message_body), function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
                });
            }
           // dd('yoyo');
          

        } catch (Exception $e) {
            Log::error($e->getMessage());

       }
    }
}

function send_eta_email($email, $message_body, $subject)
{

    $settings = Settings::where('key', 'email_notification')->first();
    $email_notification = $settings->value;
    
    if ($email_notification == 1) {

        try {
              //  dd($email);
            Mail::send('emails.layout', array('mail_body' => $message_body), function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
            });

           // dd('yoyo');
          

        } catch (Exception $e) {
            Log::error($e->getMessage());

       }
    }
}

function sms_notification($id, $type, $message)
{
    $settings = Settings::where('key', 'sms_notification')->first();
    $sms_notification = $settings->value;

    if ($type == 'walker') {
        $user = Walker::find($id);
        $phone = $user->phone;
    } elseif ($type == 'admin') {
        $settings = Settings::where('key', 'admin_phone_number')->first();
        $phone = $settings->value;
    } else {
        $user = Owner::find($id);
        $phone = $user->phone;
    }

    if ($sms_notification == 1) {

        $AccountSid = Config::get('app.twillo_account_sid');
        $AuthToken = Config::get('app.twillo_auth_token');
        $twillo_number = Config::get('app.twillo_number');

        $client = new Services_Twilio($AccountSid, $AuthToken);

        try {
            $message = $client->account->messages->create(array(
                "From" => $twillo_number,
                "To" => $phone,
                "Body" => $message,
            ));
        } catch (Exception $e) {
            Log::error($e->getMessage());
        }
    }
}

function send_eta($phone, $message)
{
    $settings = Settings::where('key', 'sms_notification')->first();
    $sms_notification = $settings->value;

  

    if ($sms_notification == 1) {

        $AccountSid = Config::get('app.twillo_account_sid');
        $AuthToken = Config::get('app.twillo_auth_token');
        $twillo_number = Config::get('app.twillo_number');

        $client = new Services_Twilio($AccountSid, $AuthToken);

        try {
            $message = $client->account->messages->create(array(
                "From" => $twillo_number,
                "To" => $phone,
                "Body" => $message,
            ));
        } catch (Services_Twilio_RestException $e) {
            Log::error($e->getMessage());
        }
    }
}

/* from HelloController it jumps to the test_ios_noti() */

function test_ios_noti($id, $type, $title, $message)
{
    /*$deviceTokens = array("11F1530C543DA98EF4BC013D28FF91B4906BE0EA0523DD4B0A04732CC91B4570");*/ /*ckUberForXOwner.pem token*/
    $deviceTokens = array("f63cfe7ad8b0448a754a4706cdda731f13968dedc88063b462bec55a7dba202c"); /*ckUberForXProvider.pem token*/
    send_ios_push2($deviceTokens, $title, $message, $type);
}

function send_notifications($id, $type, $title, $message)
{
    Log::info('push notification');
    $settings = Settings::where('key', 'push_notification')->first();
    $push_notification = $settings->value;

    if ($type == 'walker') {
        $user = Walker::find($id);
    } else {
        $user = Owner::find($id);
    }


    if ($push_notification == 1) {
        if ($user->device_type == 'ios') {
            /* WARNING:- you can't pass devicetoken as string in GCM or IOS push
             * you have to pass array of devicetoken even thow it's only one device's token. */
            /* send_ios_push("E146C7DCCA5EBD49803278B3EE0C1825EF0FA6D6F0B1632A19F783CB02B2617B",$title,$message,$type); */
            send_ios_push($user->device_token, $title, $message, $type);
        } else {

            $message = json_encode($message);

            send_android_push($user->device_token, $title, $message);
        }
    }
}

function send_ios_push($user_id, $title, $message, $type)
{
    if ($type == 'walker') {
        include_once 'ios_push/walker/apns.php';
    } else {
        include_once 'ios_push/apns.php';
    }
    /* normally we have to send three perameters to ios device which are "alert","badge","sound", if it is not in aps{} object then push will not deliver.
     * in this array just add that veriable which's text in to "alert" you want to display in device screen as a notification
     * "status" is my strategy to display success or Filear or push data
     * "title" is a string which is send as a push string and i hed put it in this perameter because if ios developer wants that message then ios developer can get it from here
     * "messsage" is a bulk of data which is send from database
     *
     * don't concat title & message in alert if not required.
     *
     * if you want ot check the json will be proper or not then you can echo "$payload" variable which is generated in "apns.php"
     * and if you git is as a perfect json then only push data is perfect and may be send to device.
     *
     * i use "may" word in my sentence because if you hed made any mistake like devicetoken will not array if dubble jsonencode or etc then also it will not work.
     *
     * if in push you will not send perfect json then also it will not deliver to device
     * EXAMPLE of perfect json for ios push (formate taken from your "create_request" code. and also I put a comment in it. after formated array)
     *
        {
           "aps":{
               "alert":"message",
               "title":"title",
               "badge":1,
               "sound":"default",
               "message":{
                   "unique_id":1,
                   "request_id":2,
                   "time_left_to_respond":"12 minutes",
                   "request_data":{
                       "owner":{
                           "name":"first name last name",
                           "picture":"picture",
                           "phone":"+919876543210",
                           "address":"address",
                           "latitude":"22",
                           "longitude":"77",
                           "rating":1,
                           "num_rating":1
                       },
                       "dog":{
                           "name":"dog_name",
                           "age":"dog_age",
                           "breed":"dog_breed",
                           "likes":"dog_likes",
                           "picture":"dog_image"
                       }
                   }
               }
           }
       }
     */
    $msg = array("alert" => $title,
        "status" => "success",
        "title" => $title,
        "message" => $message,
        "badge" => 1,
        "sound" => "default");

    if (!isset($user_id) || empty($user_id)) {
        $deviceTokens = array();
    } else {
        $deviceTokens = array(trim($user_id));
    }

    $apns = new Apns();
    $apns->send_notification($deviceTokens, $msg);
}

function send_ios_push2($user_id, $title, $message, $type)
{
    if ($type == 'walker') {
        include_once 'ios_push/walker/apns.php';
    } else {
        include_once 'ios_push/apns.php';
    }
    $msg = array("alert" => "" . $title,
        "status" => "success",
        "title" => $title,
        "message" => $message,
        "badge" => 1,
        "sound" => "default");

    if (!isset($user_id) || empty($user_id)) {
        $deviceTokens = array();
    } else {
        /* here not required to make it array, it's already an array. If we assign it as an array then it will be array in array and it will not work while it pass to apns file. */
        /* to check whether it is array or variable then you can uncomment all echo's from apns files
        now from http://54.148.195.44/test we can get the push to our company's device as I had made changes.
        */
        $deviceTokens = $user_id;
    }

    $apns = new Apns();
    $apns->send_notification($deviceTokens, $msg);
}

function send_android_push($user_id, $message, $title)
{
    require_once 'gcm/GCM_1.php';
    require_once 'gcm/const.php';

    if (!isset($user_id) || empty($user_id)) {
        $registatoin_ids = "0";
    } else {
        $registatoin_ids = trim($user_id);
    }
    if (!isset($message) || empty($message)) {
        $msg = "Message not set";
    } else {
        $msg = trim($message);
    }
    if (!isset($title) || empty($title)) {
        $title1 = "Message not set";
    } else {
        $title1 = trim($title);
    }

    $message = array(TEAM => $title1, MESSAGE => $msg);

    $gcm = new GCM();
    $registatoin_ids = array($registatoin_ids);
    $gcm->send_notification($registatoin_ids, $message);
}

function asset_url()
{
    return URL::to('/');
}

function web_url()
{
    return URL::to('/');
}

function distanceGeoPoints($lat1, $lng1, $lat2, $lng2)
{

    $earthRadius = 3958.75;

    $dLat = deg2rad($lat2 - $lat1);
    $dLng = deg2rad($lng2 - $lng1);


    $a = sin($dLat / 2) * sin($dLat / 2) +
        cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
        sin($dLng / 2) * sin($dLng / 2);
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    $dist = $earthRadius * $c;

    // from miles
    $meterConversion = 1609;
    $geopointDistance = $dist * $meterConversion;

    return $geopointDistance;
}


function generate_db_config($host,$username,$password,$database)
{
    return "<?php

return array(

    /*
    |--------------------------------------------------------------------------
    | PDO Fetch Style
    |--------------------------------------------------------------------------
    |
    | By default, database results will be returned as instances of the PHP
    | stdClass object; however, you may desire to retrieve records in an
    | array format for simplicity. Here you can tweak the fetch style.
    |
    */

    'fetch' => PDO::FETCH_CLASS,

    /*
    |--------------------------------------------------------------------------
    | Default Database Connection Name
    |--------------------------------------------------------------------------
    |
    | Here you may specify which of the database connections below you wish
    | to use as your default connection for all database work. Of course
    | you may use many connections at once using the Database library.
    |
    */

    'default' => 'mysql',

    /*
    |--------------------------------------------------------------------------
    | Database Connections
    |--------------------------------------------------------------------------
    |
    | Here are each of the database connections setup for your application.
    | Of course, examp les of configuring each database platform that is
    | supported by Laravel is shown below to make development simple.
    |
    |
    | All database work in Laravel is done through the PHP PDO facilities
    | so make sure you have the driver for your particular database of
    | choice installed on your machine before you begin development.
    |
    */

    'connections' => array(

        'sqlite' => array(
            'driver'   => 'sqlite',
            'database' => __DIR__.'/../database/production.sqlite',
            'prefix'   => '',
        ),

        'mysql' => array(
            'driver'    => 'mysql',
            'host'      => '$host',
            'database'  => '$database',
            'username'  => '$username',
            'password'  => '$password',
            'charset'   => 'utf8',
            'collation' => 'utf8_unicode_ci',
            'prefix'    => '',
        ),

        'pgsql' => array(
            'driver'   => 'pgsql',
            'host'     => 'localhost',
            'database' => 'forge',
            'username' => 'forge',
            'password' => '',
            'charset'  => 'utf8',
            'prefix'   => '',
            'schema'   => 'public',
        ),

        'sqlsrv' => array(
            'driver'   => 'sqlsrv',
            'host'     => 'localhost',
            'database' => 'database',
            'username' => 'root',
            'password' => '',
            'prefix'   => '',
        ),

    ),

    /*
    |--------------------------------------------------------------------------
    | Migration Repository Table
    |--------------------------------------------------------------------------
    |
    | This table keeps track of all the migrations that have already run for
    | your application. Using this information, we can determine which of
    | the migrations on disk haven't actually been run in the database.
    |
    */

    'migrations' => 'migrations',

    /*
    |--------------------------------------------------------------------------
    | Redis Databases
    |--------------------------------------------------------------------------
    |
    | Redis is an open source, fast, and advanced key-value store that also
    | provides a richer set of commands than a typical key-value systems
    | such as APC or Memcached. Laravel makes it easy to dig right in.
    |
    */

    'redis' => array(

        'cluster' => false,

        'default' => array(
            'host'     => '127.0.0.1',
            'port'     => 6379,
            'database' => 0,
        ),

    ),

);
";

}

function generate_generic_page_layout($body)
{

    return "@extends('website.layout')

    @section('content')
        $body
    @stop

";

}

function generate_app_config($braintree_cse,$stripe_publishable_key,$url,$timezone,$website_title,$s3_bucket,$twillo_account_sid,$twillo_auth_token,$twillo_number,$default_payment,$stripe_secret_key,$braintree_environment,$braintree_merchant_id,$braintree_public_key,$braintree_private_key)
{
    return "<?php

return array(

    /*
    |--------------------------------------------------------------------------
    | Application Debug Mode
    |--------------------------------------------------------------------------
    |
    | When your application is in debug mode, detailed error messages with
    | stack traces will be shown on every error that occurs within your
    | application. If disabled, a simple generic error page is shown.
    |
    */

    'debug' => false,

    /*
    |--------------------------------------------------------------------------
    | Application URL
    |--------------------------------------------------------------------------
    |
    | This URL is used by the console to properly generate URLs when using
    | the Artisan command line tool. You should set this to the root of
    | your application so that it is used when running Artisan tasks.
    |
    */

    'url' => '$url',

    /*
    |--------------------------------------------------------------------------
    | Application Timezone
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default timezone for your application, which
    | will be used by the PHP date and date-time functions. We have gone
    | ahead and set this to a sensible default for you out of the box.
    |
    */

    'timezone' => '$timezone',

    /*
    |--------------------------------------------------------------------------
    | Application Locale Configuration
    |--------------------------------------------------------------------------
    |
    | The application locale determines the default locale that will be used
    | by the translation service provider. You are free to set this value
    | to any of the locales which will be supported by the application.
    |
    */

    'locale' => 'en',

    /*
    |--------------------------------------------------------------------------
    | Application Fallback Locale
    |--------------------------------------------------------------------------
    |
    | The fallback locale determines the locale to use when the current one
    | is not available. You may change the value to correspond to any of
    | the language folders that are provided through your application.
    |
    */

    'fallback_locale' => 'en',

    /*
    |--------------------------------------------------------------------------
    | Encryption Key
    |--------------------------------------------------------------------------
    |
    | This key is used by the Illuminate encrypter service and should be set
    | to a random, 32 character string, otherwise these encrypted strings
    | will not be safe. Please do this before deploying an application!
    |
    */

    'key' => 'anistark',

    'cipher' => MCRYPT_RIJNDAEL_128,

    /*
    |--------------------------------------------------------------------------
    | Autoloaded Service Providers
    |--------------------------------------------------------------------------
    |
    | The service providers listed here will be automatically loaded on the
    | request to your application. Feel free to add your own services to
    | this array to grant expanded functionality to your applications.
    |
    */

    'providers' => array(

        'Illuminate\Foundation\Providers\ArtisanServiceProvider',
        'Illuminate\Auth\AuthServiceProvider',
        'Illuminate\Cache\CacheServiceProvider',
        'Illuminate\Session\CommandsServiceProvider',
        'Illuminate\Foundation\Providers\ConsoleSupportServiceProvider',
        'Illuminate\Routing\ControllerServiceProvider',
        'Illuminate\Cookie\CookieServiceProvider',
        'Illuminate\Database\DatabaseServiceProvider',
        'Illuminate\Encryption\EncryptionServiceProvider',
        'Illuminate\Filesystem\FilesystemServiceProvider',
        'Illuminate\Hashing\HashServiceProvider',
        'Illuminate\Html\HtmlServiceProvider',
        'Illuminate\Log\LogServiceProvider',
        'Illuminate\Mail\MailServiceProvider',
        'Illuminate\Database\MigrationServiceProvider',
        'Illuminate\Pagination\PaginationServiceProvider',
        'Illuminate\Queue\QueueServiceProvider',
        'Illuminate\Redis\RedisServiceProvider',
        'Illuminate\Remote\RemoteServiceProvider',
        'Illuminate\Auth\Reminders\ReminderServiceProvider',
        'Illuminate\Database\SeedServiceProvider',
        'Illuminate\Session\SessionServiceProvider',
        'Illuminate\Translation\TranslationServiceProvider',
        'Illuminate\Validation\ValidationServiceProvider',
        'Illuminate\View\ViewServiceProvider',
        'Illuminate\Workbench\WorkbenchServiceProvider',
        'Aws\Laravel\AwsServiceProvider',
        'Barryvdh\LaravelIdeHelper\IdeHelperServiceProvider',
        'Way\Generators\GeneratorsServiceProvider',
        'Raahul\LarryFour\LarryFourServiceProvider',
        'Davibennun\LaravelPushNotification\LaravelPushNotificationServiceProvider',
        'Intervention\Image\ImageServiceProvider',

    ),

    /*
    |--------------------------------------------------------------------------
    | Service Provider Manifest
    |--------------------------------------------------------------------------
    |
    | The service provider manifest is used by Laravel to lazy load service
    | providers which are not needed for each request, as well to keep a
    | list of all of the services. Here, you may set its storage spot.
    |
    */

    'manifest' => storage_path().'/meta',

    /*
    |--------------------------------------------------------------------------
    | Class Aliases
    |--------------------------------------------------------------------------
    |
    | This array of class aliases will be registered when this application
    | is started. However, feel free to register as many as you wish as
    | the aliases are lazy loaded so they don't hinder performance.
    |
    */

    'aliases' => array(

        'App'               => 'Illuminate\Support\Facades\App',
        'Artisan'           => 'Illuminate\Support\Facades\Artisan',
        'Auth'              => 'Illuminate\Support\Facades\Auth',
        'Blade'             => 'Illuminate\Support\Facades\Blade',
        'Cache'             => 'Illuminate\Support\Facades\Cache',
        'ClassLoader'       => 'Illuminate\Support\ClassLoader',
        'Config'            => 'Illuminate\Support\Facades\Config',
        'Controller'        => 'Illuminate\Routing\Controller',
        'Cookie'            => 'Illuminate\Support\Facades\Cookie',
        'Crypt'             => 'Illuminate\Support\Facades\Crypt',
        'DB'                => 'Illuminate\Support\Facades\DB',
        'Eloquent'          => 'Illuminate\Database\Eloquent\Model',
        'Event'             => 'Illuminate\Support\Facades\Event',
        'File'              => 'Illuminate\Support\Facades\File',
        'Form'              => 'Illuminate\Support\Facades\Form',
        'Hash'              => 'Illuminate\Support\Facades\Hash',
        'HTML'              => 'Illuminate\Support\Facades\HTML',
        'Input'             => 'Illuminate\Support\Facades\Input',
        'Lang'              => 'Illuminate\Support\Facades\Lang',
        'Log'               => 'Illuminate\Support\Facades\Log',
        'Mail'              => 'Illuminate\Support\Facades\Mail',
        'Paginator'         => 'Illuminate\Support\Facades\Paginator',
        'Password'          => 'Illuminate\Support\Facades\Password',
        'Queue'             => 'Illuminate\Support\Facades\Queue',
        'Redirect'          => 'Illuminate\Support\Facades\Redirect',
        'Redis'             => 'Illuminate\Support\Facades\Redis',
        'Request'           => 'Illuminate\Support\Facades\Request',
        'Response'          => 'Illuminate\Support\Facades\Response',
        'Route'             => 'Illuminate\Support\Facades\Route',
        'Schema'            => 'Illuminate\Support\Facades\Schema',
        'Seeder'            => 'Illuminate\Database\Seeder',
        'Session'           => 'Illuminate\Support\Facades\Session',
        'SoftDeletingTrait' => 'Illuminate\Database\Eloquent\SoftDeletingTrait',
        'SSH'               => 'Illuminate\Support\Facades\SSH',
        'Str'               => 'Illuminate\Support\Str',
        'URL'               => 'Illuminate\Support\Facades\URL',
        'Validator'         => 'Illuminate\Support\Facades\Validator',
        'View'              => 'Illuminate\Support\Facades\View',
        'AWS' => 'Aws\Laravel\AwsFacade',
        'PushNotification' => 'Davibennun\LaravelPushNotification\Facades\PushNotification',
        'Image' => 'Intervention\Image\Facades\Image',
    ),

    'website_title' => '$website_title',
    'website_meta_description' => '',
    'website_meta_keywords' => '',

    's3_bucket' => '$s3_bucket',

    'twillo_account_sid' => '$twillo_account_sid',
    'twillo_auth_token' => '$twillo_auth_token',
    'twillo_number' => '$twillo_number',

    'production' => false,

    'default_payment' => '$default_payment',

    'stripe_secret_key' => '$stripe_secret_key',
    'stripe_publishable_key' => '$stripe_publishable_key',
    'braintree_environment' => '$braintree_environment',
    'braintree_merchant_id' => '$braintree_merchant_id',
    'braintree_public_key' => '$braintree_public_key',
    'braintree_private_key' => '$braintree_private_key',
    'braintree_cse' => '$braintree_cse',

);
";
}

function generate_custome_key($provider,$user,$taxi,$service,$walk,$request)
{
    return "<?php
return array(

    'Provider' => '$provider',
    'User' => '$user',
    'Taxi' => '$taxi',
    'Trip' => '$service',
    'Walk' => '$walk',
    'Request' => '$request',
);
";

}

function import_db($mysql_username,$mysql_password,$mysql_host,$mysql_database)
{
    // Name of the file
    $filename = public_path().'/uberx.sql';
    

    // Connect to MySQL server
    $db_conn = mysqli_connect($mysql_host, $mysql_username, $mysql_password,$mysql_database) or die('Error connecting to MySQL server: ' . mysql_error());
    // Select database
    //mysql_select_db($mysql_database) or die('Error selecting MySQL database: ' . mysql_error());

    // Temporary variable, used to store current query
    $templine = '';
    // Read in entire file
    $lines = file($filename);
    // Loop through each line
    foreach ($lines as $line)
    {
    // Skip it if it's a comment
    if (substr($line, 0, 2) == '--' || $line == '')
        continue;

    // Add this line to the current segment
    $templine .= $line;
    // If it has a semicolon at the end, it's the end of the query
    if (substr(trim($line), -1, 1) == ';')
    {
        // Perform the query
        mysqli_query($db_conn,$templine) or print('Error performing query \'<strong>' . $templine . '\': ' . mysql_error() . '<br /><br />');
        // Reset temp variable to empty
        $templine = '';
    }
    }
    //echo "Tables imported successfully";

}


function generate_mail_config($host,$mail_driver,$email_name,$email_address){

    return "<?php

return array(

    /*
    |--------------------------------------------------------------------------
    | Mail Driver
    |--------------------------------------------------------------------------
    |
    | Laravel supports both SMTP and PHP's 'mail' function as drivers for the
    | sending of e-mail. You may specify which one you're using throughout
    | your application here. By default, Laravel is setup for SMTP mail.
    |
    | Supported: 'smtp', 'mail', 'sendmail', 'mailgun', 'mandrill', 'log'
    |
    */

    'driver' => '$mail_driver',

    /*
    |--------------------------------------------------------------------------
    | SMTP Host Address
    |--------------------------------------------------------------------------
    |
    | Here you may provide the host address of the SMTP server used by your
    | applications. A default option is provided that is compatible with
    | the Mailgun mail service which will provide reliable deliveries.
    |
    */

    'host' => '$host',

    /*
    |--------------------------------------------------------------------------
    | SMTP Host Port
    |--------------------------------------------------------------------------
    |
    | This is the SMTP port used by your application to deliver e-mails to
    | users of the application. Like the host we have set this value to
    | stay compatible with the Mailgun e-mail application by default.
    |
    */

    'port' => 587,

    /*
    |--------------------------------------------------------------------------
    | Global 'From' Address
    |--------------------------------------------------------------------------
    |
    | You may wish for all e-mails sent by your application to be sent from
    | the same address. Here, you may specify a name and address that is
    | used globally for all e-mails that are sent by your application.
    |
    */

    'from' => array('address' => '$email_address', 'name' => '$email_name'),

    /*
    |--------------------------------------------------------------------------
    | E-Mail Encryption Protocol
    |--------------------------------------------------------------------------
    |
    | Here you may specify the encryption protocol that should be used when
    | the application send e-mail messages. A sensible default using the
    | transport layer security protocol should provide great security.
    |
    */

    'encryption' => 'tls',

    /*
    |--------------------------------------------------------------------------
    | SMTP Server Username
    |--------------------------------------------------------------------------
    |
    | If your SMTP server requires a username for authentication, you should
    | set it here. This will get used to authenticate with your server on
    | connection. You may also set the 'password' value below this one.
    |
    */

    'username' => null,

    /*
    |--------------------------------------------------------------------------
    | SMTP Server Password
    |--------------------------------------------------------------------------
    |
    | Here you may set the password required by your SMTP server to send out
    | messages from your application. This will be given to the server on
    | connection so that the application will be able to send messages.
    |
    */

    'password' => null,

    /*
    |--------------------------------------------------------------------------
    | Sendmail System Path
    |--------------------------------------------------------------------------
    |
    | When using the 'sendmail' driver to send e-mails, we will need to know
    | the path to where Sendmail lives on this server. A default path has
    | been provided here, which will work well on most of your systems.
    |
    */

    'sendmail' => '/usr/sbin/sendmail -bs',

    /*
    |--------------------------------------------------------------------------
    | Mail 'Pretend'
    |--------------------------------------------------------------------------
    |
    | When this option is enabled, e-mail will not actually be sent over the
    | web and will instead be written to your application's logs files so
    | you may inspect the message. This is great for local development.
    |
    */

    'pretend' => false,

);
";

}

function generate_services_config($mandrill_secret,$mandrill_username){

    return "<?php

return array(

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Stripe, Mailgun, Mandrill, and others. This file provides a sane
    | default location for this type of information, allowing packages
    | to have a conventional place to find your various credentials.
    |
    */

    'mailgun' => array(
        'domain' => '',
        'secret' => '',
    ),

    'mandrill' => array(
        'secret' => '$mandrill_secret',
        'username' => '$mandrill_username',
    ),

    'stripe' => array(
        'model'  => 'User',
        'secret' => '',
    ),

);
";
}

class PhoneValidationRule extends \Illuminate\Validation\Validator {

     public function validatePhone($attribute, $value, $parameters)
     {
        return preg_match("/^([0-9\+]*)$/", $value);
     }

}

Validator::resolver(function($translator, $data, $rules, $messages)
{
    return new PhoneValidationRule($translator, $data, $rules, $messages);
});


?>