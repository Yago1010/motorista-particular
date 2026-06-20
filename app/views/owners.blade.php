@extends('layout')

@section('content')
@include('chama._flash')
<?php
    $rhToolbarLinks = array(
        array('url' => URL::Route('AdminChamaUsers'), 'label' => 'Central Usuários', 'icon' => 'fa-users'),
        array('url' => URL::Route('AdminUsers'), 'label' => 'Passageiros', 'icon' => 'fa-user', 'active' => true),
        array('url' => URL::Route('AdminProviders'), 'label' => 'Motoristas', 'icon' => 'fa-car'),
    );
?>
@include('partials.rh_toolbar')
@if(Session::has('msg'))
<div class="rh-alert rh-alert--success"><i class="fa fa-check-circle"></i> <?php echo Session::get('msg'); Session::put('msg', NULL); ?></div>
@endif
<div class="rh-admin-content">
<div class="row rh-filter-row">
                <div class="col-md-6 col-sm-12">

                    <div class="box box-danger">

                         <form method="get" action="{{ URL::Route('/admin/sortur') }}">
                                <div class="box-header">
                                    <h3 class="box-title">{{ trans('admin.sort') }}</h3>
                                </div>
                                <div class="box-body row">

                                <div class="col-md-6 col-sm-12">


                                <select id="sortdrop" class="form-control" name="type">
                                    <option value="userid" <?php if(isset($_GET['type']) && $_GET['type']=='userid') {echo 'selected="selected"';}?> id="provid">{{ trans('admin.user_id') }}</option>
                                    <option value="username" <?php if(isset($_GET['type']) && $_GET['type']=='username') {echo 'selected="selected"';}?> id="pvname">{{ trans('admin.user_name') }}</option>
                                    <option value="useremail" <?php if(isset($_GET['type']) && $_GET['type']=='useremail') {echo 'selected="selected"';}?> id="pvemail">{{ trans('admin.user_email') }}</option>
                                </select>
                               
                                    <br>
                                </div>
                                <div class="col-md-6 col-sm-12">

                                 <select id="sortdroporder" class="form-control" name="valu">
                                    <option value="asc" <?php if(isset($_GET['valu']) && $_GET['valu']=='asc') {echo 'selected="selected"';}?> id="asc">{{ trans('admin.ascending') }}</option>
                                    <option value="desc" <?php if(isset($_GET['valu']) && $_GET['valu']=='desc') {echo 'selected="selected"';}?> id="desc">{{ trans('admin.descending') }}</option>
                                </select>

                                    <br>
                                </div>

                                </div>

                                <div class="box-footer">

                       
                                    <button type="submit" id="btnsort" class="btn btn-flat btn-block btn-success">{{ trans('admin.sort') }}</button>

                                        
                                </div>
                        </form>

                    </div>
                </div>


                <div class="col-md-6 col-sm-12">

                    <div class="box box-danger">

                        <form method="get" action="{{ URL::Route('/admin/searchur') }}">
                                <div class="box-header">
                                    <h3 class="box-title">{{ trans('admin.filter') }}</h3>
                                </div>
                                <div class="box-body row">

                                <div class="col-md-6 col-sm-12">

                                     <select class="form-control" id="searchdrop" name="type">
                                        <option value="userid" id="userid">{{ trans('admin.user_id') }}</option>
                                        <option value="username" id="username">{{ trans('admin.user_name') }}</option>
                                        <option value="useremail" id="useremail">{{ trans('admin.user_email') }}</option>
                                        <option value="useraddress" id="useraddress">{{ trans('admin.user_address') }}</option>
                                    </select>

                            
                                    <br>
                                </div>
                                <div class="col-md-6 col-sm-12">

                                
                                    <input class="form-control" type="text" name="valu" value="<?php if(Session::has('valu')){echo Session::get('valu');} ?>" id="insearch" placeholder="{{ trans('admin.keyword_placeholder') }}"/>
                                    <br>
                                </div>

                                </div>

                                <div class="box-footer">
                                  
                                        <button type="submit" id="btnsearch" class="btn btn-flat btn-block btn-success">{{ trans('admin.search') }}</button>

                                        
                                </div>
                        </form>

                    </div>
                </div>



                <div class="box box-info tbl-box rh-table-panel">
                <div align="left" id="paglink"><?php echo $owners->appends(array('type'=>Session::get('type'), 'valu'=>Session::get('valu')))->links(); ?></div>
                <table class="table table-bordered">
                                <tbody>
                                        <tr>
                                            <th>{{ trans('admin.table_id') }}</th>
                                            <th>{{ trans('admin.table_name') }}</th>
                                            <th>{{ trans('admin.table_email') }}</th>
                                            <th>{{ trans('admin.table_phone') }}</th>
                                            <th>{{ trans('admin.table_address') }}</th>
                                            <th>{{ trans('admin.table_state') }}</th>
                                            <th>{{ trans('admin.table_zipcode') }}</th>
                                            <th>{{ trans('admin.table_debt') }}</th>
                                            <th>{{ trans('admin.table_referred_by') }}</th>
                                            <th>{{ trans('admin.table_actions') }}</th>

                                        </tr>

                        <?php foreach ($owners as $owner) { ?>
                        <tr>
                            <td><?= $owner->id ?></td>
                            <td><?php echo $owner->first_name." ".$owner->last_name; ?> </td>
                            <td><?= $owner->email ?></td>
                            <td><?= $owner->phone ?></td>
                            <td><?= $owner->address ?></td>
                            <td><?= $owner->state ?></td>
                            <td><?= $owner->zipcode ?></td>
                            <td><?= $owner->debt ?></td>
                            <?php  $refer = Owner::where('id',$owner->referred_by)->first();
                            if($refer)
                            {
                                    $referred=$refer->first_name." ".$refer->last_name;
                            }
                            else 
                            {
                                $referred= trans('admin.referred_none');
                            }

                                ?>
                            <td><?php echo $referred; ?></td>
                            <td>
                            <div class="dropdown">
                              <button class="btn btn-flat btn-info dropdown-toggle" type="button" id="dropdownMenu1" data-toggle="dropdown">
                                {{ trans('admin.table_actions') }}
                                <span class="caret"></span>
                              </button>
                              <ul class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu1">
                                <li role="presentation"><a role="menuitem" tabindex="-1" id="edit" href="{{ URL::Route('AdminUserEdit', $owner->id) }}">{{ trans('admin.action_edit_user') }}</a></li>
                                <li role="presentation"><a role="menuitem" tabindex="-1" id="history" href="{{ URL::Route('AdminUserHistory',$owner->id) }}">{{ trans('admin.action_view_history') }}</a></li>
                                <li role="presentation"><a role="menuitem" tabindex="-1" id="coupon" href="{{ URL::Route('AdminUserReferral', $owner->id) }}">{{ trans('admin.action_coupon_details') }}</a></li>
                                <?php $check = Requests::where('owner_id','=',$owner->id)->where('is_cancelled','<>','1')->get()->count(); //print_r($check);
                               if($check==0) { ?>
                                <li role="presentation"><a role="menuitem" tabindex="-1" id="add_req" href="{{ URL::Route('AdminAddRequest', $owner->id) }}">{{ trans('admin.action_add_request') }}</a></li>
                                <?php } ?>
                                <li role="presentation"><a role="menuitem" tabindex="-1" id="add_req" href="{{ URL::Route('AdminDeleteUser', $owner->id) }}">{{ trans('admin.action_delete') }}</a></li>
                              </ul>
                            </div>
                            </td>
                        </tr>
                        <?php } ?>
                    </tbody>
                </table>

                <div align="left" id="paglink"><?php echo $owners->appends(array('type'=>Session::get('type'), 'valu'=>Session::get('valu')))->links(); ?></div>




                </div>
</div>

@stop
