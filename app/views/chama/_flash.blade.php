@if(Session::has('msg'))
<div class="rh-alert rh-alert--success alert-dismissable">
    <button type="button" class="close" data-dismiss="alert">&times;</button>
    <i class="fa fa-check-circle"></i> {{ Session::get('msg') }}
</div>
@endif
