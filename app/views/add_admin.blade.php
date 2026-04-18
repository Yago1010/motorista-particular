
@extends('layout')

@section('content')

<div class="box box-success">
<br/>
<br/>
                    @if (Session::has('msg'))
                    <h4 class="alert alert-info">
                    {{{ Session::get('msg') }}}
                    {{{Session::put('msg',NULL)}}}
                    </h4>
                   @endif
                <br/>

                    <div class="box-body ">
            <form method="post" action="{{ URL::Route('AdminAdminsAdd') }}">
            <div class="form-group">
                          <label>Email</label><input class="form-control" type="text" name="username" placeholder="Add admin email">
                          </div>
                       <div class="form-group">
                          <label>Password</label>
                          <div class="password-toggle-wrap">
                            <input type="password" class="form-control" name="password" id="add-admin-password" placeholder="Add admin password" autocomplete="new-password">
                            <button type="button" class="password-toggle-btn" aria-label="{{ trans('ui.show_password') }}" data-label-show="{{ trans('ui.show_password') }}" data-label-hide="{{ trans('ui.hide_password') }}">
                              <i class="fa fa-eye"></i>
                            </button>
                          </div>
                        </div>
                        </div>
                        <div class="box-footer">
                                  
                                        <button type="submit" id="btnsearch" class="btn btn-flat btn-block btn-success">Add Admin</button>

                                        
                                </div>
                                </form>
                                </div>
                                </div>
                    

@stop