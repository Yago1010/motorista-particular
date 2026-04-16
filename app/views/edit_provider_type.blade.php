
@extends('layout')

@section('content')

 <div class="box box-primary">
                                <div class="box-header">
                                    <h3 class="box-title"><?= $title ?></h3>
                                </div><!-- /.box-header -->
                                <!-- form start -->
                               <form method="post" id="basic" action="{{ URL::Route('AdminProviderTypeUpdate') }}"  enctype="multipart/form-data">
                               <input type="hidden" name="id" value="<?= $id ?>">

                                    <div class="box-body">
                                        <div class="form-group">
                                            <label>Type Name</label>
                                            <input type="text" class="form-control" name="name" placeholder="Type Name" name="name" value="<?= $name ?>">
                                            
                                                                                   
                                        </div>

                                                                           

                                        <div class="form-group">
                                            <label>Icon File</label>

                                           
                                             <input type="file" name="icon" class="form-control" >

                                             <br>
                                             <?php if($icon != "") {?>
                                            <img src="<?= $icon; ?>" height="50" width="50">
                                            <?php } ?><br>
                                            
                                            <p class="help-block">Please Upload image in jpg, png format.</p>
                                        </div>

                                        <?php if(!$is_default == 1) { ?>
                                         <div class="form-group">
                                        
                                        <input class="form-control" type="checkbox" name="is_default" value="1">
                                        <label>Set as Default</label>

                                        </div>

                                        <?php }else{ ?>
                                          <input type="hidden" name="is_default" value="1">
                                        <?php } ?>
                                  

                                   
                                    </div><!-- /.box-body -->

                                    <div class="box-footer">

                                        <button type="submit" id="add" class="btn btn-primary btn-flat btn-block">Save</button>
                                    </div>
                                </form>
                            </div>



<?php
if($success == 1) { ?>
<script type="text/javascript">
    alert('Provider Type Updated Successfully');
    document.location.href="{{ URL::Route('AdminProviderTypes') }}";
</script>
<?php } ?>
<?php
if($success == 2) { ?>
<script type="text/javascript">
    alert('Sorry Something went Wrong');
</script>
<?php } ?>


<script type="text/javascript">
$("#basic").validate({
  rules: {
    name: "required",
  
  }
});

</script>


@stop