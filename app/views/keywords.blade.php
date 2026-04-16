@extends('layout')
@section('content')
<div class="row">
    <div class="col-md-6 col-sm-12">
        <div class="box box-primary">
            <div class="box-header">
                <h3 class="box-title">Customize Application Backend Keywords</h3>
            </div><!-- /.box-header -->
            <!-- form start -->
            <form method="post" action="{{ URL::Route('AdminKeywordsSave') }}"  enctype="multipart/form-data">
                <div class="box-body">
                    <?php foreach ($keywords as $keyword) { if($keyword->id != 5){ if($keyword->id <=4){?>

                        <div class="form-group">
                            <label><?php echo $keyword->id; echo ". "; echo ucfirst($keyword->alias); ?></label>
                            <input class="form-control" type="text" name="{{$keyword->id}}" value="{{$keyword->keyword}}" />
                        </div>
                    <?php } }else{ ?>
                        <div class="form-group">
                            <label><?php echo $keyword->id; echo ". "; echo ucfirst($keyword->alias); ?></label>
                            <select name="{{$keyword->id}}" id="currencies" class="form-control">
                                <option value="AUD" <?php if($keyword->keyword=='AUD'){echo "selected";} ?>>Australia Dollar</option> 
                                <option value="CAD" <?php if($keyword->keyword=='CAD'){echo "selected";} ?>>Canada Dollar</option>
                                <option value="CHF" <?php if($keyword->keyword=='CHF'){echo "selected";} ?>>Switzerland Franc</option>
                                <option value="DKK" <?php if($keyword->keyword=='DKK'){echo "selected";} ?>>Denmark Krone</option>
                                <option value="EUR" <?php if($keyword->keyword=='EUR'){echo "selected";} ?>>Euro Member Countries</option>
                                <option value="GBP" <?php if($keyword->keyword=='GBP'){echo "selected";} ?>>United Kingdom Pound</option> 
                                <option value="HKD" <?php if($keyword->keyword=='HKD'){echo "selected";} ?>>Hong Kong Dollar</option>
                                <option value="JPY" <?php if($keyword->keyword=='JPY'){echo "selected";} ?>>Japan Yen</option>
                                <option value="MXN" <?php if($keyword->keyword=='MXN'){echo "selected";} ?>>Mexico Peso</option>
                                <option value="NZD" <?php if($keyword->keyword=='NZD'){echo "selected";} ?>>New Zealand Dollar</option>
                                <option value="PHP" <?php if($keyword->keyword=='PHP'){echo "selected";} ?>>Philippines Peso</option>
                                <option value="SEK" <?php if($keyword->keyword=='SEK'){echo "selected";} ?>>Sweden Krona</option>
                                <option value="SGD" <?php if($keyword->keyword=='SGD'){echo "selected";} ?>>Singapore Dollar</option>
                                <option value="SPL" <?php if($keyword->keyword=='SPL'){echo "selected";} ?>>Seborga Luigino</option>
                                <option value="THB" <?php if($keyword->keyword=='THB'){echo "selected";} ?>>Thailand Baht</option>
                                <option value="$" <?php if($keyword->keyword=='$'){echo "selected";} ?>>United States Dollar</option>
                                <option value="ZAR" <?php if($keyword->keyword=='ZAR'){echo "selected";} ?>>South Africa Rand</option>
        
                            </select>
                        </div>
                    <?php }} ?>
                    <div class="form-group">
                            <label>Total Trips Icon</label>

                           <select class="form-control" style="font-family: 'FontAwesome', Helvetica;" name="total_trip">
                             <?php foreach($icons as $key){ ?>
                            <option value="<?php echo $key->id; ?>" <?php $icon = Keywords::where('keyword','total_trip')->first(); if($icon->alias==$key->id){ echo "selected";} ?> ><?php echo "  ".$key->icon_code."  ".$key->icon_name; ?></option>
                            <?php } ?>
                           </select>
                        </div>
                        <div class="form-group">
                            <label>Completed Trips Icon</label>

                           <select class="form-control" style="font-family: 'FontAwesome', Helvetica;" name="completed_trip">
                             <?php foreach($icons as $key){ ?>
                            <option value="<?php echo $key->id; ?>" <?php $icon = Keywords::where('keyword','completed_trip')->first(); if($icon->alias==$key->id){ echo "selected";} ?> ><?php echo "  ".$key->icon_code."  ".$key->icon_name; ?></option>
                            <?php } ?>
                           </select>
                        </div>
                        <div class="form-group">
                            <label>Cancelled Trip Icon</label>

                           <select class="form-control" style="font-family: 'FontAwesome', Helvetica;" name="cancelled_trip">
                             <?php foreach($icons as $key){ ?>
                            <option value="<?php echo $key->id; ?>" <?php $icon = Keywords::where('keyword','cancelled_trip')->first(); if($icon->alias==$key->id){ echo "selected";} ?> ><?php echo "  ".$key->icon_code."  ".$key->icon_name; ?></option>
                            <?php } ?>
                           </select>
                        </div>
                        <div class="form-group">
                            <label>Total Payment Icon</label>

                           <select class="form-control" style="font-family: 'FontAwesome', Helvetica;" name="total_payment">
                             <?php foreach($icons as $key){ ?>
                            <option value="<?php echo $key->id; ?>" <?php $icon = Keywords::where('keyword','total_payment')->first(); if($icon->alias==$key->id){ echo "selected";} ?> ><?php echo "  ".$key->icon_code."  ".$key->icon_name; ?></option>
                            <?php } ?>
                           </select>
                        </div>
                        <div class="form-group">
                            <label>Credit Payment Icon</label>

                           <select class="form-control" style="font-family: 'FontAwesome', Helvetica;" name="credit_payment">
                             <?php foreach($icons as $key){ ?>
                            <option value="<?php echo $key->id; ?>" <?php $icon = Keywords::where('keyword','credit_payment')->first(); if($icon->alias==$key->id){ echo "selected";} ?> ><?php echo "  ".$key->icon_code."  ".$key->icon_name; ?></option>
                            <?php } ?>
                           </select>
                        </div>
                        <div class="form-group">
                            <label>Card Payment Icon</label>

                           <select class="form-control" style="font-family: 'FontAwesome', Helvetica;" name="card_payment">
                             <?php foreach($icons as $key){ ?>
                            <option value="<?php echo $key->id; ?>" <?php $icon = Keywords::where('keyword','card_payment')->first(); if($icon->alias==$key->id){ echo "selected";} ?> ><?php echo "  ".$key->icon_code."  ".$key->icon_name; ?></option>
                            <?php } ?>
                           </select>
                        </div>
                </div>

                 

                <div class="box-footer">
                    <button type="submit" class="btn btn-primary btn-flat btn-block">Update Changes</button>
                </div>
            </form>
        </div>

    </div>
</div>

   
    <div class="col-md-6 col-sm-12">
        <div class="box box-primary">
            <div class="box-header">
                <h3 class="box-title">Edit Application UI keywords</h3>
            </div>
            <form role="form" method="POST" action="{{ URL::Route('AdminUIKeywordsSave') }}"  enctype="multipart/form-data">
              <div class="form-group">
                <label >Provider</label>
                <input type="text" class="form-control" name="val_provider" placeholder="Host" value="{{$Uikeywords['keyProvider']}}">
              </div>
              <div class="form-group">
                <label >User</label>
                <input type="text" class="form-control" name="val_user" placeholder="Host" value="{{$Uikeywords['keyUser']}}">
              </div>
              <div class="form-group">
                <label >Taxi</label>
                <input type="text" class="form-control" name="val_taxi" placeholder="Host" value="{{$Uikeywords['keyTaxi']}}">
              </div>
              <div class="form-group">
                <label >Trip</label>
                <input type="text" class="form-control" name="val_trip" placeholder="Host" value="{{$Uikeywords['keyTrip']}}">
              </div>
              <div class="form-group">
                <label>Walk</label>
                <input type="text" class="form-control" name="val_walk" placeholder="Host" value="{{$Uikeywords['keyWalk']}}">
              </div>
                <div class="form-group">
                <label>Request</label>
                <input type="text" class="form-control" name="val_request" placeholder="Host" value="{{$Uikeywords['keyRequest']}}">
              </div>
                <div class="box-footer">
                    <button type="submit" class="btn btn-primary btn-flat btn-block">Update Changes</button>
                </div>
            </form>
        </div>
    </div>

<script type="text/javascript">
    function Checkfiles()
    {
        var fup = document.getElementById('logo');
        var fileName = fup.value;
        if(fileName !='')
        {
            var ext = fileName.substring(fileName.lastIndexOf('.') + 1);
            if(ext =="PNG" || ext=="png")
            {
                return true;
            }
            else
            {
                alert("Upload PNG Images only for Logo");
                return false;
            }
        }
        var fup = document.getElementById('icon');
        var fileName1 = fup.value;
        if(fileName1 !='')
        {
            var ext = fileName1.substring(fileName1.lastIndexOf('.') + 1);

            if(ext =="ICO" || ext=="ico")
            {
                return true;
            }
            else
            {
                alert("Upload Icon Images only for Favicon");
                return false;
            }
        }
    }
</script>
<?php if($success == 1) { ?>
    <script type="text/javascript">
        alert('Settings Updated Successfully');
    </script>
<?php } ?>
<?php if($success == 2) { ?>
    <script type="text/javascript">
        alert('Sorry Something went Wrong');
    </script>
<?php } ?>
<script>
   $(function () { $("[data-toggle='tooltip']").tooltip(); });
</script>
<script type="text/javascript">
    $("#currencies").change(function () {
        var currency_selected = $( "#currencies option:selected" ).val();
        console.log(currency_selected);
        $.ajax({  
            type: "POST",  
            url: "{{route('adminCurrency')}}",
            data: {'currency_selected': currency_selected},
            success:function(data){
                if(data.success==true){
                    console.log(data.rate);
                }else{
                    console.log(data.error_message);
                }
            }
        });
    });
</script>
@stop