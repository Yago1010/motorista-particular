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
        <h3 class="box-title">Add Promo Code</h3>
    </div><!-- /.box-header -->
    <!-- form start -->
    <form role="form" id="form" method="post" action="{{ URL::Route('AdminPromoUpdate') }}"  enctype="multipart/form-data">
        <input type="hidden" name="id" value="0>">
        <div class="box-body">
            <div class="form-group">
                <label>Promo Code Name</label>
                <input type="text" class="form-control" name="code_name" value="" placeholder="ProvenLogic" >
            </div>
            <div class="form-group">
                <label>Promo Code Value</label>
                <input class="form-control" type="text" name="code_value" value="" placeholder="20">
            </div>
            <div class="form-group">
                <label>Promo Code Type</label>
                <select name="code_type">
                    <option value="1">Percent</option>
                    <option value="2">Absolute</option>
                </select>
            </div>
             <div class="form-group">
                <label>Uses Allowed</label>
                <input class="form-control" type="text" name="code_uses" value="" placeholder="50">
            </div>
            <div class="form-group">
                <label>Expiry</label>
                <input class="form-control" type="date" name="code_expiry" value="" placeholder="10-04-2016">
            </div>
        </div><!-- /.box-body -->
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
@stop