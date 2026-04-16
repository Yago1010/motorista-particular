@extends('layout')

@section('content')

 <p align="right"><a href="{{ URL::Route('AdminSettings') }}"><button class="btn btn-info btn-flat">Back to Settings </button></a></p>


               

                          <div class="box box-primary">
                           
                                <div class="box-header">
                                    <h3 class="box-title">SMS Configuration</h3>
                                </div><!-- /.box-header -->
                                <!-- form start -->
                               <form role="form" method="POST" action="{{ URL::Route('AdminInstallFinish') }}">

                                    <div class="box-body">
                                        <div class="form-group">
                                            <label>Twilio Account SID</label>

                                            <input type="text"  name="twillo_account_sid" class="form-control" placeholder="Twilio Account SID" value="{{$install['twillo_account_sid']?$install['twillo_account_sid']:''}}">
                                                                                                                             
                                        </div>
                                        <div class="form-group">
                                            <label>Twilio Auth Token</label>
                                          <input type="text" name="twillo_auth_token" class="form-control" placeholder="Twilio Auth Token" value="{{$install['twillo_auth_token']?$install['twillo_auth_token']:''}}">
                                                                                                                             
                                        </div>
                                        <div class="form-group">
                                            <label>Twilio Number</label>

                                            <input type="text" name="twillo_number" class="form-control" placeholder="Twilio Number" value="{{$install['twillo_number']?$install['twillo_number']:''}}">
                                                                                                                             
                                        </div>

                                                                           

                                                                      
                                    </div><!-- /.box-body -->

                                    <div class="box-footer">


                                        <button type="submit" name="sms" class="btn btn-primary btn-flat btn-block">Update Changes</button>
                                    </div>
                                </form>
                            </div>






                              <div class="box box-primary">
                                <div class="box-header">
                                    <h3 class="box-title">Email Configuration</h3>
                                </div><!-- /.box-header -->
                                <!-- form start -->
                               <form role="form" method="POST" action="{{ URL::Route('AdminInstallFinish') }}">

                                    <div class="box-body">
                                        <div class="form-group">
                                            <label>Mail Driver</label>
                                           <select name="mail_driver" id="mail_driver" class="form-control">
                                            <option value=''>---Select Mail Driver---</option>
                                              <option value="mail" <?php if($install['mail_driver']=='mail'){ echo 'selected';}else{echo'';} ?>>Mail</option>
                                              <option value="mandrill"  <?php if($install['mail_driver']=='mandrill'){ echo 'selected';}else{ echo'';} ?>>Mandrill</option>
                                            </select>


                                                                                                                             
                                        </div>
                                        <div class="form-group">
                                            <label>Email Address</label>
                                            <input type="text" class="form-control"  name="email_address" placeholder="Email Address" value="{{$install['email_address']?$install['email_address']:''}}">

                                                                                                                             
                                        </div>
                                        <div class="form-group">
                                            <label>Display Name</label>
                                            <input type="text" class="form-control"  name="email_name" placeholder="Display Name" value="{{$install['email_name']?$install['email_name']:''}}">
                                      
                                                                                                                             
                                        </div>
                                        <div class="form-group" id="mandrill1" style="display:<?php if($install['mail_driver']=='mandrill')echo 'block';else echo 'none';  ?>">
                                            <label>Mandrill Secret</label>
                                            <input type="text" class="form-control"  name="mandrill_secret" placeholder="Mandrill Secret" value="{{$install['mandrill_secret']?$install['mandrill_secret']:''}}">
                                                                                                                             
                                        </div>
                                        <div class="form-group" id="mandrill2" style="display:<?php if($install['mail_driver']=='mandrill')echo 'block';else echo 'none';  ?>">
                                            <label>Mandrill Host Name</label>
                                            <input type="text" class="form-control"  name="host_name" placeholder="Mandrill Host Name" value="{{$install['host']?$install['host']:''}}">
                                                                                                                             
                                        </div>
                                        <div class="form-group" id="mandrill3" style="display:<?php if($install['mail_driver']=='mandrill')echo 'block';else echo 'none';  ?>">
                                            <label>Mandrill Username</label>
                                            <input type="text" class="form-control"  name="user_name" placeholder="Mandrill Username" value="{{$install['mandrill_username']?$install['mandrill_username']:''}}">
                                                                                                                             
                                        </div>
                                                                           

                                                                      
                                    </div><!-- /.box-body -->

                                    <div class="box-footer">

                                        <button type="submit" name="mail" class="btn btn-primary btn-flat btn-block">Update Changes</button>
                                    </div>
                                </form>
                            </div>



                        <div class="box box-primary">
                                <div class="box-header">
                                    <h3 class="box-title">Payment Configuration</h3>
                                </div><!-- /.box-header -->
                                <!-- form start -->
                             <form role="form" method="POST" action="{{ URL::Route('AdminInstallFinish') }}">

                                    <div class="box-body">
                                        <div class="form-group">
                                            <label>Default Payment Gateway</label>
                                            <select name="default_payment" id="default_payment" class="form-control">
                                              <option value="stripe">Stripe</option>
                                              <option value="braintree">Brain Tree</option>
                                            </select>
                                                                                                                             
                                        </div>

                                         <div class="form-group stripe">
                                            <label>Stripe Secret Key</label>
                                            <input type="text" class="form-control"  name="stripe_secret_key" placeholder="Stripe Secret Key" value="{{$install['stripe_secret_key']?$install['stripe_secret_key']:''}}">
                                                                                                                             
                                        </div>

                                        <div class="form-group stripe">
                                            <label>Stripe Publishable Key</label>
                                            <input type="text" class="form-control"  name="stripe_publishable_key" placeholder="Stripe Publishable Key" value="{{$install['stripe_publishable_key']?$install['stripe_publishable_key']:''}}">
                                                                                                                             
                                        </div>


                                        <div class="form-group braintree" style="display:none" >
                                            <label>Brain Tree Environment</label>
                                            <input type="text" class="form-control"  name="braintree_environment" placeholder="Brain Tree Environment" value="{{$install['braintree_environment']?$install['braintree_environment']:''}}">
                                                                                                                             
                                        </div>

                                        <div class="form-group braintree" style="display:none" >
                                            <label>Brain Tree Merchant ID</label>
                                            <input type="text" class="form-control"  name="braintree_merchant_id" placeholder="Brain Tree Merchant ID" value="{{$install['braintree_merchant_id']?$install['braintree_merchant_id']:''}}">
                                                                                                                             
                                        </div>

                                        <div class="form-group braintree" style="display:none" >
                                            <label>Brain Tree Public Key</label>
                                            <input type="text" class="form-control"  name="braintree_private_key" placeholder="Brain Tree Private Key" value="{{$install['braintree_public_key']?$install['braintree_public_key']:''}}">
                                                                                                                             
                                        </div>

                                        <div class="form-group braintree" style="display:none" >
                                            <label>Brain Tree Private Key</label>
                                            <input type="text" class="form-control"  name="braintree_private_key" placeholder="Brain Tree Private Key" value="{{$install['braintree_private_key']?$install['braintree_private_key']:''}}">
                                                                                                                             
                                        </div>

                                        <div class="form-group braintree" style="display:none" >
                                            <label>Brain Tree Client Side Encryption Key</label>
                                            <input type="text" class="form-control"  name="braintree_cse" placeholder="Brain Tree Client Side Encryption Key" value="{{$install['braintree_cse']?$install['braintree_cse']:''}}">
                                                                                                                             
                                        </div>
                                                                           

                                                                      
                                    </div><!-- /.box-body -->

                                    <div class="box-footer">
                                        <button type="submit" name="payment" class="btn btn-primary btn-flat btn-block">Update Changes</button>
                                    </div>
                                </form>
                            </div>

                            <div class="box box-primary">
                           
                                <div class="box-header">
                                    <h3 class="box-title">Certificates</h3>
                                </div>
                                <form role="form" method="POST" action="{{ URL::Route('AdminAddCerti') }}" enctype="multipart/form-data">
                                    <div class="box-body">
                                        <h3>iOS</h3>
                                        <div class="form-group">
                                            <label>Certificate Type</label>
                                            <select class="form-control" name="cert_type_a">
                                                <option>Choose Certificate Type</option>
                                                <option value="0">Sandbox</option>
                                                <option value="1">Production</option>
                                            </select>
                                        </div>
                                        <?php $ceku = Certificates::where('client','apple')->where('user_type',0)->where('file_type','certificate')->first(); if($ceku!=NULL){ ?>
                                            <div class="form-group col-sm-4">
                                        <?php }else{ ?>
                                            <div class="form-group col-sm-6">
                                        <?php } ?>
                                            <label>User</label>
                                            <input type="file" class="form-control" name="user_certi_a">
                                        </div>
                                        <?php $ceku = Certificates::where('client','apple')->where('user_type',0)->where('file_type','certificate')->first(); if($ceku!=NULL){ ?>
                                            <div class="form-group col-sm-4">
                                        <?php }else{ ?>
                                            <div class="form-group col-sm-6">
                                        <?php } ?>
                                            <label>User Passphrase</label>
                                            <input type="text" class="form-control" name="user_pass_a" value="<?php $ceku = Certificates::where('client','apple')->where('user_type',0)->where('file_type','passphrase')->first(); if($ceku!=NULL){echo $ceku->name;} ?>">
                                        </div>
                                        <?php $ceku = Certificates::where('client','apple')->where('user_type',0)->where('file_type','certificate')->first(); if($ceku!=NULL){ ?>
                                            <br><br>
                                            <div class="form-group col-sm-4">
                                                <a href="{{$ceku->name}}"><span class="btn btn-default">View / Download User Certificate</span></a>
                                            </div>
                                        <?php } ?>
                                        <?php $ceku = Certificates::where('client','apple')->where('user_type',0)->where('file_type','certificate')->first(); if($ceku!=NULL){ ?>
                                            <div class="form-group col-sm-4">
                                        <?php }else{ ?>
                                            <div class="form-group col-sm-6">
                                        <?php } ?>
                                            <label>Provider</label>
                                            <input class="form-control" type="file" name="prov_certi_a" >
                                        </div>
                                        <?php $ceku = Certificates::where('client','apple')->where('user_type',0)->where('file_type','certificate')->first(); if($ceku!=NULL){ ?>
                                            <div class="form-group col-sm-4">
                                        <?php }else{ ?>
                                            <div class="form-group col-sm-6">
                                        <?php } ?>
                                            <label>Provider Passphrase</label>
                                            <input class="form-control" type="text" name="prov_pass_a" value="<?php $ceku = Certificates::where('client','apple')->where('user_type',1)->where('file_type','passphrase')->first(); if($ceku!=NULL){echo $ceku->name;} ?>">
                                        </div>
                                        <?php $cekp = Certificates::where('client','apple')->where('user_type',1)->where('file_type','certificate')->first(); if($cekp!=NULL){ ?>
                                            <br><br><br><br>
                                            <div class="form-group col-sm-4">
                                                <a href="{{$cekp->name}}"><span class="btn btn-default">View / Download Provider Certificate</span></a>
                                            </div>
                                        <?php } ?>
                                        <div class="form-group">
                                            <label>Choose Default</label>
                                            <select class="form-control" name="cert_default">
                                                <option value="0" <?php if($cert_def != 1){ echo "selected";} ?>>Sandbox</option>
                                                <option value="1" <?php if($cert_def == 1){ echo "selected";} ?>>Production</option>
                                            </select>
                                        </div>
                                    </div>
                                    <hr>
                                    <div class="box-body">
                                        <h3>GCM</h3>
                                        <div class="form-group">
                                            <label>Browser Key</label>
                                            <input type="text" class="form-control" name="gcm_key" placeholder="Enter your Browser GCM Key here." value="<?php $ce = Certificates::where('client','gcm')->first(); if($ce!=NULL){echo $ce->name;} ?>">
                                        </div>
                                    <div class="box-footer">
                                        <button type="submit" class="btn btn-primary btn-flat btn-block">Update Changes</button>
                                    </div>
                                </form>
                            </div>

<script type="text/javascript">
$(function() {
    $( "#default_storage" ).change(function() {
        val = $("#default_storage").val();
        if( val == 2){
          $("#s3").show();
        }
        else{
          $("#s3").hide();
        }
    });
});
</script>
<script type="text/javascript">
$(function() {
    $( "#mail_driver" ).change(function() {
        val = $("#mail_driver").val();
        if( val == 'mandrill'){
          $("#mandrill1").fadeIn(300);
          $("#mandrill2").fadeIn(300);
           $("#mandrill3").fadeIn(300);
        }
        else{
          $("#mandrill1").fadeOut(300);
           $("#mandrill2").fadeOut(300);
            $("#mandrill3").fadeOut(300);
        }
    });
});
</script>
<script type="text/javascript">
$(function() {
    $( "#default_payment" ).change(function() {
        val = $("#default_payment").val();
        if( val == 'stripe'){
          $(".braintree").hide();
          $(".stripe").show();
        }
        else{
          $(".stripe").hide();
          $(".braintree").show();
        }
    });
});
</script>
<?php
if($success == 1) { ?>
<script type="text/javascript">
    alert('Settings Updated Successfully');
</script>
<?php } ?>
<?php
if($success == 2) { ?>
<script type="text/javascript">
    alert('Sorry Something went Wrong');
</script>
<?php } ?>

<script>
   $(function () { $("[data-toggle='tooltip']").tooltip(); });
</script>
@stop