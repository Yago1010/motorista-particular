@extends('layout')

@section('content')

@if (Session::has('msg'))
<h4 class="alert alert-info">
{{{ Session::get('msg') }}}
{{{Session::put('msg',NULL)}}}
</h4>
@endif
<div class="box box-primary">
    <div class="box-header">
        <h3 class="box-title">Edit Promo Code</h3>
    </div><!-- /.box-header -->
    <!-- form start -->
    <form role="form" id="form" method="post" action="{{ URL::Route('AdminPromoUpdate') }}"  enctype="multipart/form-data">
        <input type="hidden" name="id" value="{{$promo_code->id}}">
        <div class="box-body">
            <div class="form-group">
                <label>Promo Code Name</label>
                <input type="text" class="form-control" name="code_name" value="{{$promo_code->coupon_code}}" placeholder="ProvenLogic" >
            </div>
            <div class="form-group">
                <label>Promo Code Value</label>
                <input class="form-control" type="text" name="code_value" value="{{$promo_code->value}}" placeholder="20">
            </div>
            <div class="form-group">
                <label>Promo Code Type</label>
                <select name="code_type">
                    <option value="1" <?php if($promo_code->type==1){echo "selected";} ?>>Percent</option>
                    <option value="2" <?php if($promo_code->type==2){echo "selected";} ?>>Absolute</option>
                </select>
            </div>
             <div class="form-group">
                <label>Uses Allowed</label>
                <input class="form-control" type="text" name="code_uses" value="{{$promo_code->uses}}" placeholder="50">
            </div>
            <div class="form-group">
                <label>Expiry</label>
                <br>
            <div class='input-group date' id='startDate'>
                    <input type='text' class="form-control" name="code_expiry" />
                    <span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span>
                    </span>
                </div>
            </div>
            </div>
        </div>
        <div class="box-footer">
            <button type="submit" class="btn btn-primary btn-flat btn-block">Update Changes</button>
        </div>
    </form>
</div>

<script type="text/javascript">
$("#form").validate({
  rules: {
    code_name: "required",
    code_value: "required",
    code_uses: "required",
    code_expiry: "required",
  }
});

</script>

<script type="text/javascript">

jQuery(function () {
    jQuery('#startDate').datetimepicker();
    jQuery("#startDate").on("dp.change",function (e) {
        jQuery('#endDate').data("DateTimePicker").setMinDate(e.date);
    });
    jQuery("#endDate").on("dp.change",function (e) {
        jQuery('#startDate').data("DateTimePicker").setMaxDate(e.date);
    });
});

</script>

<script type="text/javascript" src="{{asset('javascript/moment.js')}}"></script>
<script type="text/javascript" src="{{asset('javascript/bootstrap-datetimepicker.js')}}"></script>

@stop