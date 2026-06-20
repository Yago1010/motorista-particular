<?php

class WebProviderController extends \BaseController {

	/**
	 * Display a listing of the resource.
	 *
	 *
	 * @return Response
	 */

	public function __construct()
    {
        if (Config::get('app.production'))
		{
		    echo "Something cool is going to be here soon.";
		    die();
		}

        $this->beforeFilter(function()
        {
            if (!Session::has('walker_id'))
			{
			    return Redirect::to(chama_portal_url('driver', 'login'));
			}
			else{
				$walker_id = Session::get('walker_id');
				$walker = Walker::find($walker_id);
				Session::put('is_approved', $walker->is_approved);
				Session::put('walker_name', $walker->first_name." ".$walker->last_name);
				Session::put('walker_pic', $walker->picture);	
			}

        } ,array('except' => array(
        							'providerLogin',
        							'providerVerify',
        							'providerForgotPassword',
        							'providerRegister',
        							'providerSave',
        							'providerActivation',
        							'surroundingCars',
        						)));

    }

    public function toggle_availability()
    {
    	$walker_id = Session::get('walker_id');
    	$walker = Walker::find($walker_id);
		$walker->is_active = ($walker->is_active + 1 ) % 2;
		$walker->save();

		if (Request::ajax() || Input::get('format') === 'json') {
			return Response::json(array(
				'success' => true,
				'is_active' => (int) $walker->is_active,
				'label' => $walker->is_active ? 'Online' : 'Offline',
			));
		}

		return Redirect::back();
    }


    public function set_location()
    {
    	$walker_id = Session::get('walker_id');
    	$walker = Walker::find($walker_id);
		$walker->latitude = Input::get('lat');
		$walker->longitude = Input::get('lng');
		$walker->save();
    }

    public function providerRequestPing()
    {
    	Session::forget('skipReviewProvider');
    	$walker_id = Session::get('walker_id');
    	$time = date("Y-m-d H:i:s");
		$query = "SELECT id,owner_id,TIMESTAMPDIFF(SECOND,request_start_time, '$time') as diff from request where is_cancelled = 0 and status = 0 and current_walker=$walker_id and TIMESTAMPDIFF(SECOND,request_start_time, '$time') <= 600 limit 1";
		$requests = DB::select(DB::raw($query));
		$request_data = array();
		foreach ($requests as $request) {
			$request_data['success'] = "true";
			$request_data['request_id'] = $request->id;
			$request_data['time_left_to_respond'] = 600 - $request->diff;

			$owner = Owner::find($request->owner_id);
						
						$request_data['owner'] = array();
						$request_data['owner']['name'] = $owner->first_name." ".$owner->last_name;
						$request_data['owner']['picture'] = $owner->picture;
						$request_data['owner']['phone'] = $owner->phone;
						$request_data['owner']['address'] = $owner->address;
						$request_data['owner']['latitude'] = $owner->latitude;
						$request_data['owner']['longitude'] = $owner->longitude;
						$request_data['owner']['rating'] = DB::table('review_dog')->where('owner_id', '=', $owner->id)->avg('rating') ?: 0;
						$request_data['owner']['num_rating'] = DB::table('review_dog')->where('owner_id', '=', $owner->id)->count();
						
						$request_data['dog'] = array();
						if($dog = Dog::find($owner->dog_id))
						{
						
						$request_data['dog']['name'] = $dog->name;
						$request_data['dog']['age'] = $dog->age;
						$request_data['dog']['breed'] = $dog->breed;
						$request_data['dog']['likes'] = $dog->likes;
						$request_data['dog']['picture'] = $dog->image_url;
						}

		}

		$response_code = 200;
		$response = Response::json($request_data, $response_code);
		return $response;

    }


	public function providerLogin()
	{
		return View::make('web.providerLogin');
	}

	public function providerActivation($act){
		$loginUrl = chama_portal_url('driver', 'login');
		if ($act) {
			$get_token = Walker::where('activation_code', '=', $act)->first();
			if ($get_token) {
				if ($get_token->email_activation == 1) {
					return Redirect::to($loginUrl . '?msg=already_activated');
				}
				$walker = Walker::find($get_token->id);
				$walker->email_activation = 1;
				$walker->save();
				return Redirect::to($loginUrl . '?msg=activated');
			}
			return Redirect::to($loginUrl . '?msg=activation_error');
		}
		return Redirect::to(chama_portal_url('driver', 'register'));
	}

	public function providerRegister()
	{
		$types = ProviderType::all();
		if($types==NULL)
		{	
			$var = Keywords::where('id', 1)->first();
			return Redirect::to('')->with('success', 'You do not have '.$var->keyword.' Type. Please Contact your Admin');
		}
		return View::make('web.providerSignup')->with('types',$types);
	}

	public function providerSave()
	{
		$first_name = Input::get('first_name');
		$last_name = Input::get('last_name');
		$email = Input::get('email');
		$phone = Input::get('phone');
		$password = Input::get('password');


		$type = Input::get('type');
		if(Input::has('type')==NULL)
		{	
			$var = Keywords::where('id', 1)->first();
			return Redirect::to('')->with('success', 'You do not have '.$var->keyword.' Type. Please Contact your Admin');
		}

$validator = Validator::make(
				array(
					'first_name' => $first_name,
					'last_name' => $last_name,
					'email' => $email,
					'type' => $type,
					'password' => $password
				),
				array(
					'password' => 'required',
					'email' => 'required',
					'last_name' => 'required',
					'first_name' => 'required',
					'type' => 'required'
				)
			);
		$validator1 = Validator::make(
			array(
				'email' => $email,
				),
			array(
				'email' => 'required|email'
				)
			);
		
		$validatorPhone = Validator::make(
			array(
				'phone' => $phone,
				),
			array(
				'phone' => 'phone'
				)
			);


			if ($validator->fails()) {
				$error_messages = $validator->messages();
				return Redirect::to('provider/signup')->with('error', 'Please Fill all the fields.');	
			}else if ($validator1->fails()) {
				return Redirect::to('provider/signup')->with('error', 'Please Enter email correctly.');					
			}else if ($validatorPhone->fails()) {
				return Redirect::to('user/signup')->with('error', 'Invalid Phone Number Format');					
			}
			else
			{
		if(Walker::where('email',$email)->count() == 0){
			$activation_code = uniqid();
			$walker = new Walker;
			$walker->first_name = $first_name;
			$walker->last_name = $last_name;
			$walker->email = $email;
			$walker->phone = $phone;
			$walker->activation_code = $activation_code;

			$walker->is_available = 1;

			if ($password != "") {
				$walker->password = Hash::make($password);
			}
		
			$walker->token = generate_token();
			$walker->token_expiry = generate_expiry();
			if(Input::has('timezone')){
				$walker->timezone = Input::get('timezone');
			}
			$walker->save();
					if(Input::has('type')!=NULL){
					$ke = Input::get('type');
					$proviserv = ProviderServices::where('provider_id',$walker->id)->first();
					if($proviserv != NULL){
						DB::delete("delete from walker_services where provider_id = '".$walker->id."';");
					}
					$base_price = Input::get('service_base_price');
					$service_price_distance = Input::get('service_price_distance');
					$service_price_time = Input::get('service_price_time');
					Log::info('type = '.print_r(Input::get('type'), true));
					$cnkey = count(Input::get('type'));
					Log::info('cnkey = '.print_r($cnkey, true));
					for ($i=1; $i<= $cnkey; $i++) { 
						$key = Input::get('type');
						$prserv = new ProviderServices;
						$prserv->provider_id = $walker->id;
						$prserv->type = $key;
						Log::info('key = '.print_r($key, true));
						if(Input::has('service_base_price')){
							$prserv->base_price = $base_price[$i-1];
						}else{
							$prserv->base_price = 0;
						}
						if(Input::has('service_price_distance')){
							$prserv->price_per_unit_distance = $service_price_distance[$i-1];
						}else{
							$prserv->price_per_unit_distance = 0;
						}
						if(Input::has('service_price_distance')){
							$prserv->price_per_unit_time = $service_price_time[$i-1];
						}else{
							$prserv->price_per_unit_distance = 0;
						}
						$prserv->save();
					}
				}

			$subject = "Welcome On Board";
			$email_data['name'] = $walker->first_name;
			$url = URL::to('/provider/activation').'/'.$activation_code;
			$email_data['url'] = $url;

			send_email($walker->id,'walker',$email_data,$subject, 'providerregister');
				
			return Redirect::to('provider/signin')->with('success', 'You have successfully registered. <br>Please Activate your Email to Login');
		
		}
		else{
			return Redirect::to('provider/signup')->with('error', 'This email ID is already registered.');
		}
}
	
}

	public function providerForgotPassword()
	{
		$email = Input::get('email');
		$walker = Walker::where('email',$email)->first();
		if($walker)
		{
			$new_password = time();
			$new_password .= rand();
			$new_password = sha1($new_password);
			$new_password = substr($new_password,0,8);
			$walker->password = Hash::make($new_password);
			$walker->save();

			// send email
			$subject = "Your New Password";
			$email_data = array();
			$email_data['password']  = $new_password;
			send_email($walker->id,'walker',$email_data,$subject,'forgotpassword');

			// echo $pattern;
			return Redirect::to('provider/signin')->with('success', 'password reseted successfully. Please check your inbox for new password.');

		}
		else{
			return Redirect::to('provider/signin')->with('error', 'This email ID is not registered with us');
		}
	}

	public function providerVerify()
	{
		$email = resolve_walker_login_email(Input::get('email'), Input::get('password'));
		$password = Input::get('password');
		$walker = Walker::where('email', '=', $email)->first();

		if($walker){
			if($walker->email_activation==1){
				if ($walker && Hash::check($password, $walker->password)) {
					Session::put('walker_id', $walker->id);
					Session::put('is_approved', $walker->is_approved);
					Session::put('walker_name', $walker->first_name." ".$walker->last_name);
					Session::put('walker_pic', $walker->picture);	
					return Redirect::to('provider/trips');
				}
				else{
					return Redirect::to('provider/signin')->with('error', 'Invalid email and password');
				}
			}else{
				return Redirect::to('provider/signin')->with('error','Please Activate your Email');
			}
		}else{
			return Redirect::to('provider/signin')->with('error','Invalid email');
		}
	}

	public function providerLogout()
	{
		Session::flush();
		return Redirect::to(chama_portal_url('home'));
	}

	public function providerTripChangeState()
	{
		$date = date("Y-m-d H:i:s");
		$time_limit = date("Y-m-d H:i:s",strtotime($date)-(3*60*60));
		$walker_id = Session::get('walker_id');
		$state = $request_id = Request::segment(4);
		$current_request = Requests::where('confirmed_walker',$walker_id)
								 ->where('is_cancelled',0)
								 ->where('is_dog_rated',0)
								 ->where('created_at','>',$time_limit)
								 ->orderBy('created_at','desc')
								 ->where(function($query)
						            {
						            	$query->where('status',0)->orWhere(function($query_inner)
						            	{
						                	$query_inner->where('status', 1)
						                      ->where('is_dog_rated', 0);
						                });
						            })
								 ->first();						 
		if($current_request && $state)
		{

		 	if($state == 2)
		 	{
		 		$current_request->is_walker_started = 1;

		 		$owner = Owner::find($current_request->owner_id);
		 		$walk_location = new WalkLocation;
				$walk_location->request_id = $current_request->id;
				$walk_location->latitude = $owner->latitude;
				$walk_location->longitude = $owner->longitude;
				$walk_location->distance = 0;
				$walk_location->save();

		 	}
		 	if($state == 3)
		 	{
		 		$current_request->is_walker_arrived = 1;
		 	}
		 	if($state == 4)
		 	{
		 		$current_request->is_started = 1;

		 	}

		 	if($state == 6)
		 	{	
		 		$current_request->is_dog_rated = 1;
		 		$current_request->save();
		 		$review_dog = new DogReview;
	    		$review_dog->walker_id = $current_request->confirmed_walker;
	    		$review_dog->comment = Input::get('review');
	    		$review_dog->rating = Input::get('rating');
	    		$review_dog->owner_id =$current_request->owner_id;
	    		$review_dog->request_id = $current_request->id;
	    		$review_dog->save();
	    		$message = "You has successfully rated the owner.";
				$type = "success";
				return Redirect::to('/provider/trips')->with('message',$message)->with('type',$type);
		 	}

		 	if($state == 5)
		 	{	
		 		$request_services=RequestServices::where('request_id', $current_request->id)->first();
		 		$address = urlencode(Input::get('address'));
		 		$end_address = json_decode(file_get_contents("https://maps.googleapis.com/maps/api/geocode/json?address=$address"),TRUE);

		 		$end_location = $end_address['results'][0]['geometry'];
		 		$latitude = $end_location['location']['lat'];
		 		$longitude = $end_location['location']['lng'];

		 		$request_id = $current_request->id;
		 		$walk_location_last = WalkLocation::where('request_id',$request_id)->orderBy('created_at','desc')->first();
									
				if($walk_location_last)
				{
					$distance_old = $walk_location_last->distance;
					$distance_new = distanceGeoPoints($walk_location_last->latitude,$walk_location_last->longitude,$latitude,$longitude);
					$distance = $distance_old + $distance_new;
					$settings = Settings::where('key','default_distance_unit')->first();
					$unit = $settings->value;
					$distance = $distance;
				}
				else{
					$distance = 0;
				}

				$walk_location = new WalkLocation;
				$walk_location->request_id = $request_id;
				$walk_location->latitude = $latitude;
				$walk_location->longitude = $longitude;
				$walk_location->distance = $distance;
				$walk_location->save();
				
				Walker::where('id','=',$walker_id)->update(array('is_available' => 1));

				// Calculate Rerquest Stats

				$time = 0;

				$time_query = "SELECT TIMESTAMPDIFF(SECOND,MIN(created_at),MAX(created_at)) as diff
				FROM walk_location where request_id = $current_request->id
				GROUP BY request_id limit 1 ";
				
				$time_data = DB::select(DB::raw($time_query));
				foreach ($time_data as $time_diff) {
					$time = $time_diff->diff;
				}
				$time = $time / 60; 

				$walker_data = Walker::find($current_request->confirmed_walker);
				$provider_type = ProviderServices::where('type',$walker_data->type)->where('provider_id',$walker_id)->first();
				if($provider_type==NULL)
				{
					$settings = Settings::where('key','price_per_unit_distance')->first();
					$price_per_unit_distance = $settings->value;
					$settings = Settings::where('key','price_per_unit_time')->first();
					$price_per_unit_time = $settings->value;
					$settings = Settings::where('key','base_price')->first();
					$base_price = $settings->value;
				}else{
					$provider_type = ProviderServices::where('type',$walker_data->type)->where('provider_id',$walker_id)->first();
					$base_price = $provider_type->base_price;
					$price_per_unit_distance = $provider_type->price_per_unit_distance;
					$price_per_unit_time = $provider_type->price_per_unit_time;
				}

				$settings = Settings::where('key','default_charging_method_for_users')->first();
				$pricing_type = $settings->value;
				$settings = Settings::where('key','default_distance_unit')->first();
				$unit = $settings->value;
				$distance = convert($distance,$unit);
				if($pricing_type == 1)
				{
					$distance_cost = $price_per_unit_distance*$distance;
					$time_cost = $price_per_unit_time*$time;
					$total = $base_price+$distance_cost+$time_cost;
				}
				else{
					$distance_cost = 0;
					$time_cost = 0;
					$total = $base_price;
				}
				
				$current_request->is_completed = 1;
				$current_request->distance = $distance;
				$current_request->time = $time;
				$request_services->base_price = $base_price;
				$request_services->distance_cost = $distance_cost;
				$request_services->time_cost = $time_cost;
				$request_services->total = $total;
				$current_request->total = $total;
				$request_services->save();
				// charge client

				// charge client

				
				$ledger = Ledger::where('owner_id',$current_request->owner_id)->first();
				
				if($ledger)
				{
					$balance = $ledger->amount_earned - $ledger->amount_spent;
					if($balance > 0)
					{
						if($total > $balance)
						{
							$ledger_temp = Ledger::find($ledger->id);
							$ledger_temp->amount_spent = $ledger_temp->amount_spent + $balance;
							$ledger_temp ->save();
							$total = $total - $balance;
						}
						else{
							$ledger_temp = Ledger::find($ledger->id);
							$ledger_temp->amount_spent = $ledger_temp->amount_spent + $total;
							$ledger_temp ->save();
							$total = 0;
						}

					}
				}

				$promo_discount = 0;
				if($pcode = PromoCodes::where('id',$current_request->promo_code)->where('type',1)->first()){
					$discount = ($pcode->value)/100;
					$promo_discount = $total*$discount;
					$total = $total-$promo_discount;
					if($total < 0){
						$total = 0;
					}
				}
				$current_request->total = $total;
				$current_request->save();
				
				$cod_sett = Settings::where('key','cod')->first();
				$allow_cod = $cod_sett->value;
				if($current_request->payment_mode==1 and $allow_cod==1){
					// Pay by Cash
					$current_request->is_paid = 1;
					Log::info('allow_cod');
				}elseif ($current_request->payment_mode==2) {
					// paypal
					Log::info('paypal payment');
				}else{
					Log::info('normal payment. Stored cards');
					// stored cards
					if($total == 0)
					{
						$current_request->is_paid = 1;
					}else{
						$payment_data = Payment::where('owner_id',$current_request->owner_id)->where('is_default',1)->first();
						if(!$payment_data)
							$payment_data=Payment::where('owner_id',$current_request->owner_id)->first();
						
						if( $payment_data )
						{
							$customer_id = $payment_data->customer_id;

								$setransfer = Settings::where('key','transfer')->first();
								$transfer_allow = $setransfer->value;
								if(Config::get('app.default_payment') == 'stripe')
								{
									//dd($customer_id);
									Stripe::setApiKey(Config::get('app.stripe_secret_key'));

									try{
									$charge = Stripe_Charge::create(array(
											  "amount"   => ceil($total * 100),
											  "currency" => "usd",
											  "customer" => $customer_id)
											);
									Log::info($charge);
								}catch (Stripe_InvalidRequestError $e) {
												// Invalid parameters were supplied to Stripe's API
									$ownr=Owner::find($current_request->owner_id);
									$ownr->debt=$total;
									$ownr->save();
									$message=array('error' => $e->getMessage());
									$type = "success";
									Log::info($message);
									return Redirect::to('/provider/tripinprogress')->with('message',$message)->with('type',$type);
								}
									$current_request->is_paid = 1;
									$settng=Settings::where('key','service_fee')->first();
									$settng_mode=Settings::where('key','payment_mode')->first();
									if($settng_mode->value==2 and $transfer_allow==1)
									{
										$transfer = Stripe_Transfer::create(array(
														  "amount" => ($total-($settng->value*$total/100))*100, // amount in cents
														  "currency" => "usd",
														  "recipient" => $walker_data->merchant_id)
														);
										$current_request->transfer_amount=($total-($settng->value*$total/100));
									}
								}else{
									try{
										Braintree_Configuration::environment(Config::get('app.braintree_environment'));
										Braintree_Configuration::merchantId(Config::get('app.braintree_merchant_id'));
										Braintree_Configuration::publicKey(Config::get('app.braintree_public_key'));
										Braintree_Configuration::privateKey(Config::get('app.braintree_private_key'));
										if($settng_mode->value==2 and $transfer_allow==1)
										{
											$sevisett = Settings::where('key','service_fee')->first();
											$service_fee = $sevisett->value*$total/100;
											$result = Braintree_Transaction::sale(array(
												'amount' => $total-$service_fee,
												'paymentMethodNonce' => $customer_id,
												'merchantAccountId' => $walker_data->merchant_id,
												'options' => array(
													'submitForSettlement' => true,
													'holdInEscrow' => true,
											    ),
											    'serviceFeeAmount' => $service_fee
											));
										}else{
											$result = Braintree_Transaction::sale(array(
											  'amount' => $total,
											  'paymentMethodNonce' => $customer_id
											));
										}
										
										if ($result->success) {
											$request->is_paid = 1;
										}
										else{
											$request->is_paid = 0;
										}

									}catch(Exception $e) {
										$message = "Something went wrong in the payment. Please try again.";
										$type = "success";
										return Redirect::to('/provider/tripinprogress')->with('message',$message)->with('type',$type);
								}
							}
							$current_request->card_payment = $total;
							$current_request->ledger_payment = $current_request->total - $total;
						}
					}
				}
				$current_request->save();
		 	}
		 	$current_request->save();
		}
		return Redirect::to('/provider/tripinprogress');
	}

	public function providerTripInProgress()
	{
		$date = date("Y-m-d H:i:s");
		$time_limit = date("Y-m-d H:i:s",strtotime($date)-(3*60*60));
		$walker_id = Session::get('walker_id');

		$current_request = Requests::where('confirmed_walker',$walker_id)
								 ->where('is_cancelled',0)
								 ->where('created_at','>',$time_limit)
								 ->orderBy('created_at','desc')
								 ->where(function($query)
						            {
						            	$query->where('status',0)->orWhere(function($query_inner)
						            	{
						                	$query_inner->where('status', 1);
						                });
						            })
								 ->first();

		if(!$current_request or Session::has('skipReviewProvider') or $current_request->is_dog_rated == 1)
		{	
			$var = Keywords::where('id', 4)->first();
			$message = "You don't have any ".$var->keyword."s currently in progress.";
			$type = "danger";
			$status = 6;
			return Redirect::to('/provider/trips')->with('message',$message)->with('type',$type)->with('status',$status);
		}
		else{
			$request_services=RequestServices::where('request_id', $current_request->id)->first();
			$owner = Owner::find($current_request->owner_id);
			$type = ProviderType::find($request_services->type);
			$status = 0;

			if($current_request->is_dog_rated){
				$status =6;
			}
			elseif ($current_request->is_completed) {
				$status = 5;
			}
			elseif ($current_request->is_started) {
				$status = 4;
			}
			elseif ($current_request->is_walker_arrived) {
				$status = 3;
			}
			elseif ($current_request->is_walker_started) {
				$status = 2;
			}
			elseif ($current_request->confirmed_walker) {
				$status = 1;
			}

			if($current_request->confirmed_walker)
			{
				$walker = Walker::find($current_request->confirmed_walker);
				$rating = DB::table('review_dog')->where('owner_id', '=', $current_request->owner_id)->avg('rating') ?: 0;
				$var = Keywords::where('id', 4)->first();

				return View::make('web.providerRequestTripStatus')
						->with('title',''.$var->keyword.' Status')
						->with('page',''.$var->keyword.'-status')
						->with('request',$current_request)
						->with('user',$owner)
						->with('walker',$walker)
						->with('type',$type)
						->with('status',$status)
						->with('rating',$rating);
			}
			
		}
			
			
	}

	public function providerSkipReview()
	{
		$request_id = Request::segment(3);
		Session::put('skipReviewProvider',1);
		return Redirect::to('/provider/tripinprogress');
	}

	public function approve_request()
	{
		$request_id = Request::segment(4);
		$walker_id = Session::get('walker_id');
		$request = Requests::find($request_id);
		if($request->current_walker == $walker_id){
			// request ended
			Requests::where('id','=',$request_id)->update(array('confirmed_walker' => $walker_id,'status' => 1,'request_start_time' => date('Y-m-d H:i:s')));

			// confirm walker
			RequestMeta::where('request_id','=',$request_id)->where('walker_id','=',$walker_id)->update(array('status' => 1));

			// Update Walker availability

			Walker::where('id','=',$walker_id)->update(array('is_available' => 0));

			// remove other schedule_meta
			RequestMeta::where('request_id','=',$request_id)->where('status','=',0)->delete();

			// Send Notification
			$walker = Walker::find($walker_id);
				$walker_data = array();
				$walker_data['first_name'] = $walker->first_name;
				$walker_data['last_name'] = $walker->last_name;
				$walker_data['phone'] = $walker->phone;
				$walker_data['bio'] = $walker->bio;
				$walker_data['picture'] = $walker->picture;
				$walker_data['latitude'] = $walker->latitude;
				$walker_data['longitude'] = $walker->longitude;
				$walker_data['rating'] = DB::table('review_walker')->where('walker_id', '=', $walker->id)->avg('rating') ?: 0;
				$walker_data['num_rating'] = DB::table('review_walker')->where('walker_id', '=', $walker->id)->count();

				$settings = Settings::where('key','default_distance_unit')->first();
				$unit = $settings->value;
				$bill = array();
				if($request->is_completed == 1)
				{
					
					$bill['distance'] = convert($request->distance,$unit);
					$bill['time'] = $request->time;
					$bill['base_price'] = $request->base_price;
					$bill['distance_cost'] = $request->distance_cost;
					$bill['time_cost'] = $request->time_cost;
					$bill['total'] = $request->total;
					$bill['is_paid'] = $request->is_paid;
				}

				$response_array = array(
					'success' => true,
					'request_id' => $request_id,
					'status' => $request->status,
					'confirmed_walker' => $request->confirmed_walker,
					'is_walker_started' => $request->is_walker_started,
					'is_walker_arrived' => $request->is_walker_arrived,
					'is_walk_started' => $request->is_started,	
					'is_completed' => $request->is_completed,
					'is_walker_rated' => $request->is_walker_rated,
					'walker' => $walker_data,
					'bill' => $bill,
				);
			$var = Keywords::where('id', 1)->first();
			$title = "".$var->keyword." Accepted";
			$message = $response_array;
			send_notifications($request->owner_id,"owner",$title,$message);

			// Send SMS 
			$owner = Owner::find($request->owner_id);
			$settings = Settings::where('key','sms_when_provider_accepts')->first();
			$pattern = $settings->value;
			$pattern = str_replace('%user%', $owner->first_name." ".$owner->last_name, $pattern);
			$pattern = str_replace('%driver%', $walker->first_name." ".$walker->last_name, $pattern);

			$pattern = str_replace('%driver_mobile%', $walker->phone, $pattern);
			sms_notification($request->owner_id,'owner',$pattern);

			// Send SMS 
			
			$settings = Settings::where('key','sms_request_completed')->first();
			$pattern = $settings->value;
			$pattern = str_replace('%user%', $owner->first_name." ".$owner->last_name, $pattern);
			$pattern = str_replace('%id%', $request->id, $pattern);
			$pattern = str_replace('%user_mobile%', $owner->phone, $pattern);
			sms_notification(1,'admin',$pattern);
		}

		return Redirect::to('/provider/tripinprogress');

	}

	public function decline_request()
	{
		$request_id = Request::segment(4);
		$walker_id = Session::get('walker_id');
		$request = Requests::find($request_id);
		if($request->current_walker == $walker_id){
			// Archiving Old Walker
			RequestMeta::where('request_id','=',$request_id)->where('walker_id','=',$walker_id)->update(array('status' => 3));
			$request_meta = RequestMeta::where('request_id','=',$request_id)->where('status','=',0)->orderBy('created_at')->first();
			
			// update request
			if(isset($request_meta->walker_id))
			{
				// assign new walker
				Requests::where('id','=',$request_id)->update(array('current_walker' => $request_meta->walker_id,'request_start_time' => date("Y-m-d H:i:s")));
			
				// Send Notification

				$walker = Walker::find($request_meta->walker_id);
				$owner_data = Owner::find($request->owner_id);
				$msg_array = array();
				$msg_array['request_id'] = $request->id;
				$msg_array['id'] = $request_meta->walker_id;
				if ($walker) {
					$msg_array['token'] = $walker->token;
				}
				$msg_array['client_profile'] = array();
				$msg_array['client_profile']['name'] = $owner_data->first_name." ".$owner_data->last_name;
				$msg_array['client_profile']['picture'] = $owner_data->picture;
				$msg_array['client_profile']['bio'] = $owner_data->bio;
				$msg_array['client_profile']['address'] = $owner_data->address;
				$msg_array['client_profile']['phone'] = $owner_data->phone;

				$title = "New Request";
				$message = $msg_array;
				send_notifications($request_meta->walker_id,"walker",$title,$message);
			}
			else{
				// request ended
				Requests::where('id','=',$request_id)->update(array('current_walker' => 0,'status' => 1));
			}
		}
		return Redirect::to('/provider/trips');
	}

	public function providerTrips()
	{
		$walker_id = Session::get('walker_id');
		$walker = Walker::find($walker_id);
		$start_date = Input::get('start_date');
		$end_date = Input::get('end_date');
		$submit = Input::get('submit');

		$start_time = $start_date ? date('Y-m-d H:i:s', strtotime($start_date)) : null;
		$end_time = $end_date ? date('Y-m-d 23:59:59', strtotime($end_date)) : null;

		$requestsQuery = Requests::where('request.confirmed_walker', $walker_id)
			->where('request.is_completed', 1)
			->leftJoin('owner', 'owner.id', '=', 'request.owner_id')
			->leftJoin('request_services', 'request_services.request_id', '=', 'request.id')
			->leftJoin('walker_type', 'walker_type.id', '=', 'request_services.type')
			->select(
				'request.id',
				'request.request_start_time',
				'request.total',
				'request.distance',
				'request.time',
				'request.is_cancelled',
				'request.is_completed',
				'request.is_started',
				'request.is_walker_arrived',
				'request.is_walker_started',
				'request.confirmed_walker',
				'request.status',
				'request.D_latitude',
				'request.D_longitude',
				'request.payment_mode',
				'owner.first_name',
				'owner.last_name',
				'owner.phone',
				'owner.address',
				'walker_type.name as type'
			)
			->orderBy('request.request_start_time', 'desc');

		if ($start_time && $end_time) {
			$requestsQuery->where('request.request_start_time', '>=', $start_time)
				->where('request.request_start_time', '<=', $end_time);
		}

		$requests = $requestsQuery->get();

		$statsQuery = Requests::where('confirmed_walker', $walker_id)->where('is_completed', 1);
		if ($start_time && $end_time) {
			$statsQuery->where('request_start_time', '>=', $start_time)
				->where('request_start_time', '<=', $end_time);
		}

		$total_rides = (clone $statsQuery)->count();
		$total_distance = (clone $statsQuery)->sum('distance');
		$total_earnings = (clone $statsQuery)->sum('total');

		$rides_today = Requests::where('confirmed_walker', $walker_id)
			->where('is_completed', 1)
			->where('request_start_time', '>=', date('Y-m-d') . ' 00:00:00')
			->count();

		$earnings_today = Requests::where('confirmed_walker', $walker_id)
			->where('is_completed', 1)
			->where('request_start_time', '>=', date('Y-m-d') . ' 00:00:00')
			->sum('total');

		$average_rating = DogReview::where('walker_id', $walker_id)->avg('rating');
		if ($start_time && $end_time) {
			$average_rating = DogReview::where('walker_id', $walker_id)
				->where('created_at', '>=', $start_time)
				->where('created_at', '<=', $end_time)
				->avg('rating');
		}

		$time = date('Y-m-d H:i:s');
		$pending_requests = DB::table('request')
			->leftJoin('owner', 'owner.id', '=', 'request.owner_id')
			->leftJoin('request_services', 'request_services.request_id', '=', 'request.id')
			->leftJoin('walker_type', 'walker_type.id', '=', 'request_services.type')
			->where('request.is_cancelled', 0)
			->where('request.status', 0)
			->where('request.current_walker', $walker_id)
			->whereRaw('TIMESTAMPDIFF(SECOND, request.request_start_time, ?) <= 600', array($time))
			->select(
				'request.id',
				'request.total',
				'request.distance',
				'request.request_start_time',
				'request.D_latitude',
				'request.D_longitude',
				'owner.first_name',
				'owner.last_name',
				'owner.phone',
				'owner.address',
				'owner.picture',
				'walker_type.name as type'
			)
			->orderBy('request.request_start_time', 'desc')
			->get();

		$active_request = Requests::where('confirmed_walker', $walker_id)
			->where('is_cancelled', 0)
			->where('is_completed', 0)
			->orderBy('request.created_at', 'desc')
			->first();

		$banners = array();
		if (class_exists('Schema') && Schema::hasTable('chama_banners')) {
			$now = date('Y-m-d H:i:s');
			$banners = DB::table('chama_banners')
				->where('is_active', 1)
				->where(function ($q) {
					$q->where('target_app', 'both')->orWhere('target_app', 'driver');
				})
				->where(function ($q) use ($now) {
					$q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
				})
				->where(function ($q) use ($now) {
					$q->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
				})
				->orderBy('sort_order')
				->limit(3)
				->get();
		}

		$currency = Keywords::where('id', 5)->first();
		$currencyLabel = $currency ? $currency->keyword : 'R$';

		if (!$submit || $submit === 'filter') {
			return View::make('web.providerTrips')
				->with('title', 'Painel do Motorista')
				->with('page', 'provider-trips')
				->with('walker', $walker)
				->with('requests', $requests)
				->with('pending_requests', $pending_requests)
				->with('active_request', $active_request)
				->with('banners', $banners)
				->with('total_rides', $total_rides)
				->with('rides_today', $rides_today)
				->with('earnings_today', $earnings_today)
				->with('currency', $currencyLabel)
				->with('total_distance', $total_distance)
				->with('total_earnings', $total_earnings)
				->with('average_rating', $average_rating ?: 0);
		}

		header('Content-Type: text/csv; charset=utf-8');
		header('Content-Disposition: attachment; filename=corridas-motorista.csv');

		$handle = fopen('php://output', 'w');
		fputcsv($handle, array('Data', 'Passageiro', 'Telefone', 'Categoria', 'Distância (km)', 'Tempo (min)', 'Ganho (R$)'));

		foreach ($requests as $request) {
			fputcsv($handle, array(
				date('d/m/Y H:i', strtotime($request->request_start_time)),
				$request->first_name . ' ' . $request->last_name,
				$request->phone,
				$request->type,
				chama_format_distance_km($request->distance),
				$request->time,
				$request->total,
			));
		}

		fputcsv($handle, array());
		fputcsv($handle, array('Total corridas', $total_rides));
		fputcsv($handle, array('Distância total', chama_format_distance_km($total_distance)));
		fputcsv($handle, array('Avaliação média', number_format((float) $average_rating, 2, ',', '.')));
		fputcsv($handle, array('Ganhos totais', $total_earnings));
		fclose($handle);
	}

	public function providerTripDetail()
	{
		$id = Request::segment(3);

		$walker_id = Session::get('walker_id');
		$request = Requests::find($id);
		$request_services=RequestServices::where('request_id',$request->id)->first();
		if($request->confirmed_walker == $walker_id)
		{
			$locations = WalkLocation::where('request_id',$id)
								->orderBy('id')
								->get();
			$start = WalkLocation::where('request_id',$id)
								->orderBy('id')
								->first();
			$end = WalkLocation::where('request_id',$id)
								->orderBy('id','desc')
								->first();

			$map = "https://maps-api-ssl.google.com/maps/api/staticmap?size=249x249&style=feature:landscape|visibility:off&style=feature:poi|visibility:off&style=feature:transit|visibility:off&style=feature:road.highway|element:geometry|lightness:39&style=feature:road.local|element:geometry|gamma:1.45&style=feature:road|element:labels|gamma:1.22&style=feature:administrative|visibility:off&style=feature:administrative.locality|visibility:on&style=feature:landscape.natural|visibility:on&scale=2&markers=shadow:false|scale:2|icon:http://d1a3f4spazzrp4.cloudfront.net/receipt-new/marker-start@2x.png|$start->latitude,$start->longitude&markers=shadow:false|scale:2|icon:http://d1a3f4spazzrp4.cloudfront.net/receipt-new/marker-finish@2x.png|$end->latitude,$end->longitude&path=color:0x2dbae4ff|weight:4";

			foreach ($locations as $location) {
			$map .= "|$location->latitude,$location->longitude";
			}

			$start_location = json_decode(file_get_contents("https://maps.googleapis.com/maps/api/geocode/json?latlng=$start->latitude,$start->longitude"),TRUE);
			$start_address = $start_location['results'][0]['formatted_address'];
			
			$end_location = json_decode(file_get_contents("https://maps.googleapis.com/maps/api/geocode/json?latlng=$end->latitude,$end->longitude"),TRUE);
			$end_address = $end_location['results'][0]['formatted_address'];
			
			$owner = Owner::find($request->owner_id);
			$owner_review = DogReview::where('request_id',$id)->first();
			if($owner_review)
			{
				$rating = round($owner_review->rating);
			}
			else{
				$rating = 0;
			}
			$var = Keywords::where('id', 4)->first();
			$currency = Keywords::where('id', 5)->first();

			return View::make('web.providerTripDetail')
					->with('title','My '.$var->keyword.'s')
					->with('request',$request)
					->with('request_services',$request_services)
					->with('start_address',$start_address)
					->with('end_address',$end_address)
					->with('currency', $currency->keyword)
					->with('start',$start)
					->with('end',$end)
					->with('map_url',$map)
					->with('owner',$owner)
					->with('rating',$rating);
		}
		else{
			echo "false";
		}
	}


	public function providerProfile()
	{
		$walker_id = Session::get('walker_id');
		$user = Walker::find($walker_id);
		$type = ProviderType::all();
		$ps = ProviderServices::where('provider_id',$walker_id)->get();
		return View::make('web.providerProfile')
					->with('title','My Profile')
					->with('user',$user)
					->with('type',$type)
					->with('ps',$ps);
	}

	public function updateProviderProfile(){

		foreach (Input::get('service') as $key) {
			$serv = ProviderType::where('id',$key)->first();
			$pserv[] = $serv->name;
		}
		$walker_id = Session::get('walker_id');
		$first_name = Input::get('first_name');
		$last_name = Input::get('last_name');
		$phone = Input::get('phone');
		$picture = Input::file('picture');
		$bio = Input::get('bio');
		$address = Input::get('address');
		$state = Input::get('state');
		$country = Input::get('country');
		$zipcode = Input::get('zipcode');
		$timezone = Input::get('timezone');
		$validator = Validator::make(
				array(
					'picture' => $picture
				),
				array(

					'picture' => 'mimes:jpeg,bmp,png'
				)
			);

		if ($validator->fails()) {
			$error_messages = $validator->messages();
			Log::info('picture type not valid. Error = '.print_r($error_messages, true));
			return Redirect::to('/provider/profile')->with('error', 'Invalid image format (Allowed formats jpeg,bmp and png)');
		} else {

			$walker = Walker::find($walker_id);

			if(Input::hasFile('picture')){
				if($walker->picture!=""){
					$path = $walker->picture;
					Log::info($path);
					$filename = basename($path);
					Log::info($filename);
					unlink(public_path()."/uploads/".$filename);
				}
				// upload image
				$file_name = time();
				$file_name .= rand();
				$file_name = sha1($file_name);

				$ext = Input::file('picture')->getClientOriginalExtension();
				Input::file('picture')->move(public_path() . "/uploads", $file_name . "." . $ext);
				$local_url = $file_name . "." . $ext;

				// Upload to S3
				if(Config::get('app.s3_bucket') != "")
				{
					$s3 = App::make('aws')->get('s3');
					$pic = $s3->putObject(array(
						'Bucket' => Config::get('app.s3_bucket'),
						'Key' => $file_name,
						'SourceFile' => public_path() . "/uploads/" . $local_url,
					));

					$s3->putObjectAcl(array(
						'Bucket' => Config::get('app.s3_bucket'),
						'Key' => $file_name,
						'ACL' => 'public-read'
					));

					$s3_url = $s3->getObjectUrl(Config::get('app.s3_bucket'), $file_name);
					
				}
				else{
						$s3_url = asset_url().'/uploads/'.$local_url;
				}

				
				$walker->picture = $s3_url;
			}

			$walker->first_name = $first_name;
			$walker->last_name = $last_name;
			
			$walker->phone = $phone;
			$walker->bio = $bio;
			$walker->address = $address;
			$walker->state = $state;
			$walker->country = $country;
			$walker->zipcode = $zipcode;
			$walker->timezone = $timezone;
			$walker->save();

			foreach (Input::get('service') as $ke) {
				$proviserv = ProviderServices::where('provider_id',$walker->id)->first();
				if($proviserv != NULL){
					DB::delete("delete from walker_services where provider_id = '".$walker->id."';");
				}
			}
			$base_price = Input::get('service_base_price');
			$service_price_distance = Input::get('service_price_distance');
			$service_price_time = Input::get('service_price_time');
			Log::info('service = '.print_r(Input::get('service'), true));

			$cnkey = Input::get('noOfTypes');
			
			Log::info('cnkey = '.print_r($cnkey, true));
			Log::info('service_base_price = '.print_r($base_price,true));
			Log::info('service_price_distance = '.print_r($service_price_distance,true));
			Log::info('service_price_time = '.print_r($service_price_time,true));
			$key = Input::get('service');

			for ($i=0; $i < $cnkey; $i++) { 
					if(isset($key[$i]))
					{
					$prserv = new ProviderServices;
					$prserv->provider_id = $walker->id;
					$prserv->type = $key[$i];
					Log::info('key = '.print_r($key, true));
					if(Input::has('service_base_price')){
						$prserv->base_price = $base_price[$i];

					}else{
						$prserv->base_price = 0;
					}
					if(Input::has('service_price_distance')){

						$prserv->price_per_unit_distance = $service_price_distance[$i];
					}else{
						$prserv->price_per_unit_distance = 0;
					}
					if(Input::has('service_price_time')){
						$prserv->price_per_unit_time = $service_price_time[$i];
					}else{
						$prserv->price_per_unit_time = 0;
					}
					$prserv->save();
					}
			 }

			return Redirect::to('/provider/profile')->with('message','Your profile has been updated successfully')->with('type','success');
		}
	}

	public function updateProviderPassword(){
		$current_password = Input::get('current_password');
		$new_password = Input::get('new_password');
		$confirm_password = Input::get('confirm_password');

		$walker_id = Session::get('walker_id');
		$walker = Walker::find($walker_id);


		if( $new_password === $confirm_password){
		
			if(Hash::check($current_password, $walker->password))
			{
				$password = Hash::make($new_password);
				$walker->password = $password;
				$walker->save();

				$message = "Your password is successfully updated";
				$type = "success";
			}
			else{
				$message = "Please enter your current password correctly";
				$type = "danger";
			}
		}else{
			$message = "Passwords do not match in New Password and Confirm Password fields";

			$type = "danger";
		}
		return Redirect::to('/provider/profile')->with('message',$message)->with('type',$type);
	

	}


	public function providerDocuments()
	{
		$walker_id = Session::get('walker_id');
		$documents = Document::all();

		$walker_document = WalkerDocument::where('walker_id',$walker_id)->get();

		$walker = Walker::find($walker_id);
		
		$status = 0;

		foreach ($documents as $document) {
			if(!$document)
			{
				$status = -1;
			}else{
				$status = 0;
			}
		}

		if($walker->is_approved)
		{
			$status = 1;
		}

		return View::make('web.providerDocuments')
					->with('title','My Documents')
					->with('documents',$documents)
					->with('walker_document',$walker_document)
					->with('status',$status);
	}

	public function providerUpdateDocuments()
	{
			$inputs = Input::all();
			$walker_id = Session::get('walker_id');


			foreach ($inputs as $key=>$input) {
				
				$walker_document = WalkerDocument::where('walker_id',$walker_id)->where('document_id',$key)->first();
				if(!$walker_document)
				{
					$walker_document =  new WalkerDocument;
				}
				$walker_document->walker_id = $walker_id;
				$walker_document->document_id = $key;

				if($input){
					$file_name = time();
					$file_name .= rand();
					$file_name = sha1($file_name);

					$ext = $input->getClientOriginalExtension();
					$input->move(public_path() . "/uploads", $file_name . "." . $ext);
					$local_url = $file_name . "." . $ext;

					// Upload to S3
					if(Config::get('app.s3_bucket') != "")
					{
						$s3 = App::make('aws')->get('s3');
						$pic = $s3->putObject(array(
							'Bucket' => Config::get('app.s3_bucket'),
							'Key' => $file_name,
							'SourceFile' => public_path() . "/uploads/" . $local_url,
						));

						$s3->putObjectAcl(array(
							'Bucket' => Config::get('app.s3_bucket'),
							'Key' => $file_name,
							'ACL' => 'public-read'
						));

						$s3_url = $s3->getObjectUrl(Config::get('app.s3_bucket'), $file_name);
						
					}else{
						$s3_url = asset_url().'/uploads/'.$local_url;
					}


					// send email
					
					$get = Walker::where('id','=', $walker_id)->first();
					$pattern = "Hi, ".$get->first_name.", ID ".$walker_id." Uploaded his/her Document and waiting for the admin Approval.";
					$subject = "Waiting for an Approval";
					email_notification('','admin',$pattern,$subject);
					
					$walker_document->url = $s3_url;
					$walker_document->save();

					if($walker_document->save())
					{
						echo 'asdasd';
					}
					
			}
		}

		$message = "Your documents are successfully updated.";
		$type = "success";
		return Redirect::to('/provider/documents')->with('message',$message)->with('type',$type);

	}


public function provideravailabilitySubmit()
	{

		$proavis = $_POST['proavis'];
		$proavie = $_POST['proavie'];
		$length = $_POST['length'];
		$provid = Session::get('walker_id');
		Log::info('Start end time Array Length = '.print_r($length,true));
		DB::delete("delete from provider_availability where provider_id = '".$provid."';");
		for($l=0;$l<$length;$l++){
			$pv = new ProviderAvail;
			$pv->provider_id = $provid;
			$pv->start = $proavis[$l];
			$pv->end = $proavie[$l];
			$pv->save();
		}
		Log::info('providers availability start = '.print_r($proavis,true));
		Log::info('providers availability end = '.print_r($proavie,true));
		return Response::json(array('success' => true));
	}	

	public function provideravailability()
	{


		if(Session::has('walker_id'))
        {
        	$pavail = ProviderAvail::where('provider_id',Session::get('walker_id'))->get();
        	$prvi = array();
        	foreach($pavail as $pv){
        		$prv = array();
        		$prv['title'] = 'available';
        		$prv['start'] = date('Y-m-d',strtotime($pv->start))."T".date('H:i:s',strtotime($pv->start));
        		$prv['end'] = date('Y-m-d',strtotime($pv->end))."T".date('H:i:s',strtotime($pv->end));;
        		array_push($prvi, $prv);
        	}
        	$pvjson = json_encode($prvi);
        	Log::info('Provider availability json = '.print_r($pvjson,true));
			return View::make('web.provideravailability')->with('pvjson',$pvjson)->with('title','Calendar')->with('page','yo');
		}
	}

	//create manual request

	public function create_manual_request(){
		$latitude = Input::get('latitude');
		$longitude = Input::get('longitude');
		$d_latitude = Input::get('d_latitude');
		$d_longitude = Input::get('d_longitude');
		$type = Input::get('type');
		$provider = Input::get('provider');
		$user_id = Session::get('user_id');

		$time = date("Y-m-d H:i:s");

		$provider_details = Walker::where('id','=',$provider)->first();

		$user = Owner::where('id','=',$user_id)->first();

		$request = new Requests;
		$request->owner_id = $user_id;
		$request->request_start_time = $time;
		$request->confirmed_walker = $provider;
		if($d_longitude!='' && $d_latitude!=''){
			$request->D_latitude = $d_latitude;
			$request->D_longitude = $d_longitude;
		}
		$request->current_walker = $provider;
		$request->status = 1;
		$request->save();
		$reqid = $request->id;

		$request_service = new RequestServices;
		$request_service->type= $type;
		$request_service->request_id=$request->id;
		$request_service->save();

		$owner = Owner::find($user_id);
		$owner->latitude = $latitude;
		$owner->longitude = $longitude;
		$owner->save();

		$walkerlocation = new WalkLocation;
		$walkerlocation->request_id = $request->id;
		$walkerlocation->distance = 0.00;
		$walkerlocation->latitude = $latitude;
		$walkerlocation->longitude = $longitude;
		$walkerlocation->save();


		if($request->save()){

			$current_request = Requests::where('id','=',$reqid)->first();

			return Redirect::to('/user/request-trip');
		}
	}

		// getting near by users

	public function get_nearby(){
		$latitude = Input::get('latitude');
		$longitude = Input::get('longitude');
		$typestring = Input::get('type');

		 $settings = Settings::where('key', 'default_search_radius')->first();
        $distance = $settings->value;
		if($typestring==""){
	        $query = "SELECT walker.id,walker.first_name,walker.last_name,walker.latitude,walker.longitude, 1.609344 * 3956 * acos( cos( radians('$latitude') ) * cos( radians(latitude) ) * cos( radians(longitude) - radians('$longitude') ) + sin( radians('$latitude') ) * sin( radians(latitude) ) ) as distance from walker where is_available = 1 and is_active = 1 and is_approved = 1 and (1.609344 * 3956 * acos( cos( radians('$latitude') ) * cos( radians(latitude) ) * cos( radians(longitude) - radians('$longitude') ) + sin( radians('$latitude') ) * sin( radians(latitude) ) ) ) <= $distance order by distance";
		}else{
	        $query = "SELECT walker.id,walker.first_name,walker.last_name,walker.latitude,walker.longitude, 1.609344 * 3956 * acos( cos( radians('$latitude') ) * cos( radians(walker.latitude) ) * cos( radians(walker.longitude) - radians('$longitude') ) + sin( radians('$latitude') ) * sin( radians(walker.latitude) ) ) as distance from walker JOIN walker_services where walker.is_available = 1 and walker.is_active = 1 and walker.is_approved = 1 and (1.609344 * 3956 * acos( cos( radians('$latitude') ) * cos( radians(walker.latitude) ) * cos( radians(walker.longitude) - radians('$longitude') ) + sin( radians('$latitude') ) * sin( radians(walker.latitude) ) ) ) <= $distance and walker.id = walker_services.provider_id and walker_services.type = $typestring order by distance";
	    }
        $walkers = DB::select(DB::raw($query));

		// return $walkers;

		  foreach ($walkers as $key) { 
                echo "<option value=".$key->id.">".$key->first_name." ".$key->last_name."</option>";
          }
	}


}
