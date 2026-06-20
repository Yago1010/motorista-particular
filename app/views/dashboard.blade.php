@extends('layout')

@section('content')
<?php
if(!isset($_COOKIE['skipInstallation'])) {
if(Session::has('notify'))
{
$message='';
$message1=$message2=$message3='';
if($install['mail_driver'] == '' && $install['email_address'] == '' && $install['email_name']=='') {
    $message1 = trans('admin.install_mail_missing');
}
if($install['twillo_account_sid'] == '' && $install['twillo_auth_token'] =='' && $install['twillo_number'] =='') {
$message2 = trans('admin.install_sms_missing');
    }
    if(($install['default_payment']=='' && $install['braintree_environment'] == ''  && $install['braintree_merchant_id'] == '' && $install['braintree_public_key'] == '' && $install['braintree_private_key']=='' && $install['braintree_cse']=='') && ( $install['stripe_publishable_key']=='')) {
$message3 = trans('admin.install_payment_missing');
    }
    if($message1!=''&& $message2 !=''&& $message3 !='')
    {
        $message = trans('admin.install_all_missing');
    }
    else if($message1!=''&& $message2 !='')
    {
        $message = trans('admin.install_sms_mail_missing');
    }
       else if($message1!=''&& $message3 !='')
    {
        $message = trans('admin.install_mail_payment_missing');
    }
       else if($message3!=''&& $message2 !='')
    {
        $message = trans('admin.install_sms_payment_missing');
    }
       else if($message1!='' && $message3 ==''&& $message2 =='')
    {
        $message=$message1;
    }
       else if($message2 !='' && $message1 ==''&& $message3 =='')
    {
        $message=$message2;
    }
       else if($message3!='' && $message1 ==''&& $message2 =='')
    {
        $message=$message3;
    }

    if($message!='')
    {

?>
<div id="myModal" class="modal fade">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                <h4 class="modal-title">{{ trans('admin.install_modal_title') }}</h4>
            </div>
            <div class="modal-body">
                <p><?php echo $message;?></p>
            </div>
            <div class="modal-footer">
                <a href="{{ URL::Route('AdminSettingDontShow') }}"><button type="button" class="btn btn-default" >{{ trans('admin.install_dont_show_again') }}</button></a>
                <button type="button" class="btn btn-default" data-dismiss="modal">{{ trans('admin.install_close') }}</button>
                <a href="{{ URL::Route('AdminSettingInstallation') }}"><button type="button" class="btn btn-primary">{{ trans('admin.install_change_now') }}</button></a>
            </div>
        </div>
    </div>
</div>
<?php } } }?>

<div class="rh-stat-grid">
    <div class="rh-stat-card">
        <div class="rh-stat-card-top">
            <div class="rh-stat-icon rh-stat-icon--blue"><i class="fa fa-heartbeat"></i></div>
            <span class="rh-stat-badge rh-stat-badge--live">Live</span>
        </div>
        <h2><?= isset($active_rides) ? $active_rides : 0 ?></h2>
        <p>Corridas ativas</p>
        <p style="margin-top:6px;font-size:0.8rem;"><?= isset($completed_today) ? $completed_today : 0 ?> concluídas hoje</p>
    </div>
    <div class="rh-stat-card">
        <div class="rh-stat-card-top">
            <div class="rh-stat-icon rh-stat-icon--orange"><i class="fa fa-clock-o"></i></div>
            <span class="rh-stat-badge rh-stat-badge--warn">Atenção</span>
        </div>
        <h2><?= isset($pending_approval) ? $pending_approval : 0 ?></h2>
        <p>Aguardando aprovação</p>
        <p style="margin-top:6px;font-size:0.8rem;"><?= isset($pending_drivers) ? $pending_drivers : 0 ?> motoristas pendentes</p>
    </div>
    <div class="rh-stat-card">
        <div class="rh-stat-card-top">
            <div class="rh-stat-icon rh-stat-icon--green"><i class="fa fa-line-chart"></i></div>
        </div>
        <h2><?= $currency_sel ?> <?= number_format((float)(isset($total_revenue) ? $total_revenue : 0), 2, ',', '.') ?></h2>
        <p>Receita total</p>
        <p style="margin-top:6px;font-size:0.8rem;"><?= isset($total_rides) ? $total_rides : 0 ?> corridas no total</p>
    </div>
    <div class="rh-stat-card">
        <div class="rh-stat-card-top">
            <div class="rh-stat-icon rh-stat-icon--purple"><i class="fa fa-users"></i></div>
        </div>
        <h2><?= isset($total_owners) ? $total_owners : 0 ?></h2>
        <p>Passageiros cadastrados</p>
        <p style="margin-top:6px;font-size:0.8rem;"><?= isset($approved_walkers) ? $approved_walkers : 0 ?> motoristas aprovados</p>
    </div>
</div>

<div class="rh-quick-row">
    <a href="{{ URL::Route('AdminRequests') }}"><i class="fa fa-check-circle"></i> Aprovar corridas</a>
    <a href="{{ URL::Route('AdminMapview') }}"><i class="fa fa-map-marker"></i> Mapa ao vivo</a>
    <a href="{{ URL::Route('AdminChamaUsers') }}"><i class="fa fa-users"></i> Usuários</a>
    <a href="{{ URL::Route('AdminPricing') }}"><i class="fa fa-calculator"></i> Tarifas / KM</a>
    <a href="{{ URL::Route('AdminPromoCodes') }}"><i class="fa fa-gift"></i> Cupons</a>
    <a href="{{ URL::Route('AdminChamaBanners') }}"><i class="fa fa-bullhorn"></i> Anúncios</a>
</div>

<p class="rh-section-label">Operação Chama</p>
<div class="rh-module-grid">
    <a href="{{ URL::Route('AdminChamaCities') }}" class="rh-module-card">
        <i class="fa fa-building"></i>
        <strong>Cidades</strong>
        <span><?= isset($chama_cities) ? $chama_cities : 0 ?> cadastradas</span>
    </a>
    <a href="{{ URL::Route('AdminChamaUsers') }}" class="rh-module-card">
        <i class="fa fa-users"></i>
        <strong>Usuários</strong>
        <span>Passageiros e motoristas</span>
    </a>
    <a href="{{ URL::Route('AdminChamaBanners') }}" class="rh-module-card">
        <i class="fa fa-bullhorn"></i>
        <strong>Anúncios</strong>
        <span><?= isset($chama_banners) ? $chama_banners : 0 ?> campanhas ativas</span>
    </a>
    <a href="{{ URL::Route('AdminPromoCodes') }}" class="rh-module-card">
        <i class="fa fa-gift"></i>
        <strong>Cupons</strong>
        <span><?= isset($chama_coupons) ? $chama_coupons : 0 ?> promoções</span>
    </a>
</div>

    <!-- filter start -->

                            <div class="box box-danger">
                                <div class="box-header">
                                    <h3 class="box-title">{{ trans('admin.filter') }}</h3>
                                </div>
                                <div class="box-body">
                                    <div class="row">

                                    <form role="form" method="get" action="{{ URL::Route('AdminReport') }}">
                                       
                                            <div class="col-md-6 col-sm-6 col-lg-6">
                                            <input type="text" class="form-control" style="overflow:hidden;" id="start-date" name="start_date" value="{{ Input::get('start_date') }}" placeholder="{{ trans('admin.dashboard_start_date') }}">
                                             <br>
                                            </div>
                                           
                                            <div class="col-md-6 col-sm-6 col-lg-6">
                                            <input type="text" class="form-control" style="overflow:hidden;" id="end-date" name="end_date" placeholder="{{ trans('admin.dashboard_end_date') }}"  value="{{ Input::get('end_date') }}">
                                            <br>
                                            </div>
                                            
                                            <div class="col-md-4 col-sm-4 col-lg-4">
                                           
                                            <select name="status"  class="form-control">
                                                <option value="0">{{ trans('admin.dashboard_status_label') }}</option>
                                                <option value="1" <?php echo Input::get('status') == 1?"selected":"" ?> >{{ trans('admin.dashboard_status_completed') }}</option>
                                                <option value="2" <?php echo Input::get('status') == 2?"selected":"" ?>>{{ trans('admin.dashboard_status_cancelled') }}</option>
                                            </select>
                                            <br>
                                            </div>
                                            
                                              <div class="col-md-4 col-sm-4 col-lg-4">
                                              
                                                <select name="walker_id" style="overflow:hidden;" class="form-control">
                                                    <option value="0">{{ trans('admin.dashboard_select_provider') }}</option>
                                                    <?php foreach ($walkers as $walker) { ?>
                                                    <option value="<?= $walker->id ?>" <?php echo Input::get('walker_id') == $walker->id?"selected":"" ?>><?= $walker->first_name; ?> <?= $walker->last_name ?></option>
                                                    <?php } ?>
                                                </select>
                                                 <br>
                                                </div>
                                               
                                                <div class="col-md-4 col-sm-4 col-lg-4">
                                                
                                                <select name="owner_id" style="overflow:hidden;" class="form-control">
                                                    <option value="0">{{ trans('admin.dashboard_select_user') }}</option>
                                                    <?php foreach ($owners as $owner) { ?>
                                                    <option value="<?= $owner->id ?>" <?php echo Input::get('owner_id') == $owner->id?"selected":"" ?>><?= $owner->first_name; ?> <?= $owner->last_name ?></option>
                                                    <?php } ?>
                                                </select>
                                                <br>
                                                </div>
                                                
                                        
                                    </div>
                                </div><!-- /.box-body -->
                                    <div class="box-footer">
                                        <button type="submit" name="submit" class="btn btn-primary" value="Filter_Data">{{ trans('admin.dashboard_filter_data') }}</button>
                                        <button type="submit" name="submit" class="btn btn-primary" value="Download_Report">{{ trans('admin.dashboard_download_report') }}</button>
                                    </div>

                                    </form>

                            </div>

        <!-- filter end-->

    


                         <div class="box box-info tbl-box">
                            <div align="left" id="paglink"><?php echo $walks->appends(array('type'=>Session::get('type'), 'valu'=>Session::get('valu')))->links(); ?></div>
                            <table class="table table-bordered">
                                        <tbody><tr>
                                            <th>{{ trans('admin.dashboard_th_request_id') }}</th>
                                            <th>{{ trans('admin.dashboard_th_user_name') }}</th>
                                            <th>{{ trans('admin.dashboard_th_provider') }}</th>
                                            <th>{{ trans('admin.dashboard_th_date') }}</th>
                                            <th>{{ trans('admin.dashboard_th_time') }}</th>
                                            <th>{{ trans('admin.dashboard_th_status') }}</th>
                                            <th>{{ trans('admin.dashboard_th_amount') }}</th>
                                            <th>{{ trans('admin.dashboard_th_payment_status') }}</th>
                                            <th>{{ trans('admin.dashboard_th_ledger_payment') }}</th>
                                            <th>{{ trans('admin.dashboard_th_card_payment') }}</th>
                                        </tr>
                                     

                                         <?php foreach ($walks as $walk) { ?>

                                    <tr>
                                        <td><?= $walk->id ?></td>
                                        
                                        <td><?php echo $walk->owner_first_name." ".$walk->owner_last_name; ?> </td>
                                        <td>
                                        <?php 
                                        if($walk->confirmed_walker)
                                        {
                                         echo $walk->walker_first_name." ".$walk->walker_last_name; 
                                        }
                                        else{
                                             echo e(trans('admin.dashboard_unassigned'));
                                        }
                                        ?>
                                        </td>
                                        <td><?php echo date("d M Y",strtotime($walk->date)); ?></td>
                                        <td><?php echo date("g:iA",strtotime($walk->date)); ?></td>

                                        <td>
                                            <?php 
                                            if($walk->is_cancelled == 1) {

                                                echo "<span class='badge bg-red'>".e(trans('admin.dashboard_badge_cancelled'))."</span>";
                                            }
                                            elseif ($walk->is_completed == 1) {
                                                echo "<span class='badge bg-green'>".e(trans('admin.dashboard_badge_completed'))."</span>";
                                            }
                                            elseif ($walk->is_started == 1) {
                                                echo "<span class='badge bg-yellow'>".e(trans('admin.dashboard_badge_started'))."</span>";
                                            }
                                            elseif ($walk->is_walker_arrived == 1) {
                                                echo "<span class='badge bg-yellow'>".e(trans('admin.dashboard_badge_driver_arrived'))."</span>";
                                            }
                                            elseif ($walk->is_walker_started == 1) {
                                                echo "<span class='badge bg-yellow'>".e(trans('admin.dashboard_badge_driver_started'))."</span>";
                                            }

                                            else{

                                            }
                                            ?>
                                        </td>
                                        <td>
                                        <?php echo $walk->total; ?>
                                        </td>
                                        <td>
                                            <?php 
                                            if ($walk->is_paid == 1) {

                                                echo "<span class='badge bg-green'>".e(trans('admin.dashboard_badge_completed'))."</span>";
                                            }
                                            elseif ($walk->is_paid == 0 && $walk->is_completed == 1) {
                                                echo "<span class='badge bg-red'>".e(trans('admin.dashboard_badge_pending'))."</span>";
                                            }
                                            else {
                                                echo "<span class='badge bg-yellow'>".e(trans('admin.dashboard_badge_request_not_completed'))."</span>";

                                            }
                                            
                                            ?>
                                        </td>
                                        <td>
                                          <?= $walk->ledger_payment; ?>
                                        </td>
                                        <td>
                                            <?= $walk->card_payment; ?>
                                        </td>
                                    </tr>
                                    <?php } ?>
                                
                            </tbody>
                        </table>
                <div align="left" id="paglink"><?php echo $walks->appends(array('type'=>Session::get('type'), 'valu'=>Session::get('valu')))->links(); ?></div>
            </div>
            <!--</form>-->
        </div>
    </div>
</div>

  <script>
  $(function() {
    $( "#start-date" ).datepicker({
      defaultDate: "+1w",
      changeMonth: true,
      numberOfMonths: 1,
      onClose: function( selectedDate ) {
        $( "#end-date" ).datepicker( "option", "minDate", selectedDate );
      }
    });
    $( "#end-date" ).datepicker({
      defaultDate: "+1w",
      changeMonth: true,
      numberOfMonths: 1,
      onClose: function( selectedDate ) {
        $( "#start-date" ).datepicker( "option", "maxDate", selectedDate );
      }
    });
  });
  </script>
  <script type="text/javascript">
$(document).ready(function(){
    <?php if(Session::has('notify') && !isset($_COOKIE['skipInstallation'])) { ?>
    $("#myModal").modal('show');
    <?php } ?>
});
</script>

@stop