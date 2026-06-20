<div class="rh-toolbar">
    <a href="{{ URL::Route('AdminReport') }}" class="rh-toolbar-back"><i class="fa fa-arrow-left"></i> Dashboard</a>
    @if(isset($rhToolbarLinks) && is_array($rhToolbarLinks))
        @foreach($rhToolbarLinks as $link)
        <a href="{{ $link['url'] }}" class="rh-toolbar-link{{ !empty($link['active']) ? ' is-active' : '' }}">
            @if(!empty($link['icon']))<i class="fa {{ $link['icon'] }}"></i>@endif
            {{ $link['label'] }}
        </a>
        @endforeach
    @endif
</div>
