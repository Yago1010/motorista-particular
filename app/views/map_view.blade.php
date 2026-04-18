@extends('layout')

@section('content')

<div class="box box-success">
    </br>
    <div class="col-md-8">
        <input type="text" class="form-control" id="my-address" placeholder="Please enter your address">
    </div>

    <div class="col-md-4" id="flow2">
        <button id="getCords" class="btn btn-success" onClick="codeAddress();">Find Location</button>
    </div>
    </br>
    <div id="map" style="height:600px;width:100%;margin-top:30px;"></div>
        <input type="hidden" name="latitude" id="latitude">
        <input type="hidden" name="longitude" id="longitude">
    </div>
    <!-- map page js starts -->
    <script src="https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&libraries=places"></script>
    <script type="text/javascript">

        var popup_pin = "";
        var markersArray = [];
        var newmarkersArray = [];
        var customIcons = {
            restaura3t: {
                icon: 'http://labs.google.com/ridefinder/images/mm_20_blue.png',
                shadow: 'http://labs.google.com/ridefinder/images/mm_20_shadow.png'
            },
            bar: {
                icon: 'http://labs.google.com/ridefinder/images/mm_20_red.png',
                shadow: 'http://labs.google.com/ridefinder/images/mm_20_shadow.png'
            },
            client: {
                icon: '<?php echo asset_url(); ?>/image/client-70.png',
                shadow: 'http://labs.google.com/ridefinder/images/mm_20_shadow.png'
            },
            client_no_pay: {
                icon: '<?php echo asset_url(); ?>/image/client-red.png',
                shadow: 'http://labs.google.com/ridefinder/images/mm_20_shadow.png'
            },
            client_pay_done: {
                icon: '<?php echo asset_url(); ?>/image/client_pay_done.png',
                shadow: 'http://labs.google.com/ridefinder/images/mm_20_shadow.png'
            },
            driver: {
                icon: '<?php echo asset_url(); ?>/image/driver-70.png',
                shadow: 'http://labs.google.com/ridefinder/images/mm_20_shadow.png'
            }
        };

        function load(lat,lng) {
            var latitude='';
            var longitude='';
            if(lat!=''){latitude=lat;longitude=lng;}else{
                var mapOptions = {
                    zoom: 17
                  };
                  map = new google.maps.Map(document.getElementById('map'),
                      mapOptions);
                if(navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function(position) {
        
                        <?php
                        $admin = null;
                        if (Session::has('admin_id')) {
                            $admin = Admin::where('id', Session::get('admin_id'))->first();
                        }
                        $adminHasMapCoords = $admin && (float) $admin->latitude != 0 && (float) $admin->longitude != 0;
                        ?>
                        <?php if ($adminHasMapCoords) { ?>
                            var pos = new google.maps.LatLng("<?php echo e($admin->latitude); ?>",
                                                                       "<?php echo e($admin->longitude); ?>");
                                console.log("admin location");        
                        <?php } else { ?>
                                var pos = new google.maps.LatLng(position.coords.latitude,
                                                                       position.coords.longitude);
                                 console.log("geo locating");
                        <?php } ?>

                      var infowindow = new google.maps.InfoWindow({
                        map: map,
                        position: pos,
                        content: 'You are here'
                      });

                      map.setCenter(pos);
                    }, function() {
                      handleNoGeolocation(true);
                    });
                  } else {
                    // Browser doesn't support Geolocation
                    handleNoGeolocation(false);
                  }
            }
            var address = (document.getElementById('my-address'));
            var autocomplete = new google.maps.places.Autocomplete(address);
            autocomplete.setTypes(['geocode']);
            google.maps.event.addListener(autocomplete, 'place_changed', function() {
                var place = autocomplete.getPlace();
                if (!place.geometry) {
                    return;
                }
                var address = '';
                if (place.address_components) {
                    address = [
                        (place.address_components[0] && place.address_components[0].short_name || ''),
                        (place.address_components[1] && place.address_components[1].short_name || ''),
                        (place.address_components[2] && place.address_components[2].short_name || '')
                    ].join(' ');
                }
            });
            var map = new google.maps.Map(document.getElementById("map"),
            {
                center: new google.maps.LatLng(latitude, longitude),
                zoom: 17,
                mapTypeId: 'roadmap' });
            var infoWindow = new
            google.maps.InfoWindow; 
            (function() {
                var f = function() {
                var marker = new google.maps.Marker();
                downloadUrl("{{ URL::Route('AdminProviderXml') }}",
                function(data) {             
        var xml = data.responseXML;
        var markers = xml.documentElement.getElementsByTagName("marker");
        popup_pin = "";             
        for (var i = 0; i < markers.length; i++) { 
        var name = markers[i].getAttribute("name"); 
        var client_name = markers[i].getAttribute("client_name"); 
        var contact = markers[i].getAttribute("contact");
        var amount = markers[i].getAttribute("amount"); 
        var type = markers[i].getAttribute("type"); 
        var id = markers[i].getAttribute("id");
        var point = new google.maps.LatLng(
        parseFloat(markers[i].getAttribute("lat")),
        parseFloat(markers[i].getAttribute("lng"))); 
        var html = ""; 
        if(type == 'client_pay_done') {     
        html = "<b>" + client_name + "</b></p><p><span class ='icon-phone' style=''></span><span style='margin-left:5px;'><br>" + contact + "</span></p><b>"; 
        } else if (type == 'client') {
        html = "<b>" + client_name + "</b></p><p><span class ='icon-phone' style=''></span><span style='margin-left:5px;'><br>" + contact + "</span></p><b>"; 
        } else {     
        html = "<b>" + client_name + "</b></p><p><span class ='icon-phone' style=''></span><span style='margin-left:5px;'><br>" + contact + "</span></p><b>"; 
        } 

        var icon = customIcons[type] || {}; marker =
        new google.maps.Marker({     map: map,     position: point,
        icon: icon.icon,     shadow: icon.shadow });
        newmarkersArray.push(marker); bindInfoWindow(marker, map,
        infoWindow, html, type, name, popup_pin);             }
        clearOverlays(markersArray);             
        markersArray = newmarkersArray;            
        newmarkersArray = [];         
        });
        };     window.setInterval(f, 15000);     f();

        var legendDiv = document.createElement('DIV');
        var legend = new Legend(legendDiv, map);
        legendDiv.index = 1;
        map.controls[google.maps.ControlPosition.RIGHT_TOP].push(legendDiv);

        })();
        }


        function clearOverlays(arr) {
        for (var i = 0; i < arr.length; i++) {
        arr[i].setMap(null);
        }
        }

        function bindInfoWindow(marker, map, infoWindow, html, type, name, popup_pin) {
        if (name == popup_pin) {
        infoWindow.setContent(html);
        infoWindow.open(map, marker);
        popup_pin = "";
        }
        google.maps.event.addListener(marker, 'click', function() {

        if (type == 'client') {
        infoWindow.setContent(html);
        infoWindow.open(map, marker);
        } else if (type == 'client_pay_done') {
        infoWindow.setContent(html);
        infoWindow.open(map, marker);
        } else {
        infoWindow.setContent(html);
        infoWindow.open(map, marker);
        }   
        });
        }

        function downloadUrl(url, callback) {
        var request = window.ActiveXObject ?
        new ActiveXObject('Microsoft.XMLHTTP') :
        new XMLHttpRequest;
        request.onreadystatechange = function() {
        if (request.readyState == 4) {
        request.onreadystatechange = doNothing;
        callback(request, request.status);
        }
        };
        request.open('GET', url, true);
        request.send(null);
        }


        function initialize() {

        }

        function codeAddress() {
        geocoder = new google.maps.Geocoder();
        var address = document.getElementById("my-address").value;
        geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {

        var latitude = results[0].geometry.location.lat();
        var longitude = results[0].geometry.location.lng();
        // initialize_map(results[0].geometry.location.lat(),results[0].geometry.location.lng());
        load(latitude,longitude);
        //         var latlng = new google.maps.LatLng(latitude, longitude);
        // var map = new google.maps.Map(document.getElementById('map'), {
        //     center: latlng,
        //     zoom: 11,
        //     mapTypeId: google.maps.MapTypeId.ROADMAP
        // });
        // var marker = new google.maps.Marker({
        //     position: latlng,
        //     map: map,
        //     title: 'Set lat/lon values for this property',
        //     draggable: true
        // });
        } 

        else {
        //alert("Geocode was not successful for the following reason: " + status);
        }
        });
        }

        function doNothing() {
        }

        function Legend(controlDiv, map) {
        // Set CSS styles for the DIV containing the control
        // Setting padding to 5 px will offset the control
        // from the edge of the map
        controlDiv.style.padding = '5px';

        // Set CSS for the control border
        var controlUI = document.createElement('DIV');
        controlUI.style.backgroundColor = 'white';
        controlUI.style.borderStyle = 'solid';
        controlUI.style.borderWidth = '1px';
        controlUI.title = 'Legend';
        controlDiv.appendChild(controlUI);

        // Set CSS for the control text
        var controlText = document.createElement('DIV');
        controlText.style.fontFamily = 'Arial,sans-serif';
        controlText.style.fontSize = '12px';
        controlText.style.paddingLeft = '4px';
        controlText.style.paddingRight = '4px';

        // Add the text
        controlText.innerHTML = '<b>Legends</b><br />' +
        '<img src="<?php echo asset_url(); ?>/image/client-70.png" style="height:25px;"/> Available<br />' +
        '<img src="<?php echo asset_url(); ?>/image/client_pay_done.png" style="height:25px;"/> On a Walk<br />' +
        '<img src="<?php echo asset_url(); ?>/image/client-red.png" style="height:25px;"/> Inactive<br />'
        controlUI.appendChild(controlText);
        }
        google.maps.event.addDomListener(window, 'load', load('',''));

    </script>


@stop