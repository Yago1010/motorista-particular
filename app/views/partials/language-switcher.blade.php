<?php $currentLocale = App::getLocale(); $isPt = ($currentLocale === 'pt'); ?>
<div style="display:inline-flex; align-items:center; gap:6px;">
	<span title="{{ trans('ui.language') }}"><i class="fa fa-globe"></i></span>
	<a href="{{ url('/language/pt') }}" class="btn btn-xs {{ $isPt ? 'btn-primary' : 'btn-default' }}" title="Português (Brasil)">
		<i class="fa fa-flag"></i> PT-BR
	</a>
	<a href="{{ url('/language/es') }}" class="btn btn-xs {{ $currentLocale == 'es' ? 'btn-primary' : 'btn-default' }}" title="ES">
		<i class="fa fa-flag"></i> ES
	</a>
	<a href="{{ url('/language/en') }}" class="btn btn-xs {{ $currentLocale == 'en' ? 'btn-primary' : 'btn-default' }}" title="EN">
		<i class="fa fa-flag"></i> EN
	</a>
</div>
