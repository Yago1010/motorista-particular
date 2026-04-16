@extends('layout')

@section('content')


<div class="box box-success">


                   <div id="map" style="height:600px;width:100%;"></div>


</div>

          <div class="box box-info tbl-box">

                <table class="table table-bordered">
                                <tbody>
                                        <tr>
                                              <th>Walker Name</th>
                                                <th>Response</th>

                                        </tr>
                            <?php foreach ($request_meta as $meta) {  ?>
                            <tr>
                            <td><?= $meta->first_name ?> <?= $meta->last_name ?></td>
                            <td>
                                <?php 
                                if($meta->status == 0) {  
                                    echo "<span class='badge bg-yellow'>In Queue</span>";
                                }
                                elseif($meta->status == 1){
                                    echo "<span class='badge bg-green'>Accepted</span>";
                                }
                                elseif($meta->status == 3){
                                    echo "<span class='badge bg-red'>Rejected</span>";
                                }
                                else{
                                    echo "<span class='badge bg-red'>No Response</span>";
                                }


                                ?>

                            </td>
                            </tr>
                            <?php } ?>
                    </tbody>
                </table>

                 
                </div>

<script src="https://maps.googleapis.com/maps/api/js?v=3.exp" type="text/javascript"></script>
<script type="text/javascript">

            var map = null;
            var infowindow = new google.maps.InfoWindow();
            var bounds = new google.maps.LatLngBounds();
            var customIcons = {
                restaurant: {
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
                client_stop: {
                    icon: '<?php echo asset_url(); ?>/image/client-red.png',
                    shadow: 'http://labs.google.com/ridefinder/images/mm_20_shadow.png'
                },
                driver: {
                    icon: '<?php echo asset_url(); ?>/image/driver-70.png',
                    shadow: 'http://labs.google.com/ridefinder/images/mm_20_shadow.png'
                }
            };
           

            var markers1 = [
                { 
                    "lat": <?php echo $owner_latitude; ?>,
                    "lng": <?php echo $owner_longitude; ?>,  
                },
                <?php if($status != 'Provider Not Confirmed'){ ?>
                {
                    "lat": <?php echo $walker_latitude; ?>,
                    "lng": <?php echo $walker_longitude; ?>,
                }
                <?php } ?>
            ];

            function load() {
                var mapOptions = {
                    center: new google.maps.LatLng(
                            parseFloat(markers1[0].lat),
                            parseFloat(markers1[0].lng)),
                    zoom: 13,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                var path = new google.maps.MVCArray();
                var service = new google.maps.DirectionsService();

                var infoWindow = new google.maps.InfoWindow();
                map = new google.maps.Map(document.getElementById("map"), mapOptions);
                var poly = new google.maps.Polyline({
                    map: map,
                    strokeColor: '#F3443C'
                });
                var lat_lng = new Array();

                /* path.push(new google.maps.LatLng(parseFloat(markers1[0].lat),
                 parseFloat(markers1[0].lng)));
                 */
                var start_icon = customIcons['client'] || {};
                var stop_icon = customIcons['client_stop'] || {};
                var marker = new google.maps.Marker({
                    position: map.getCenter(),
                    map: map,
                    icon: start_icon.icon,
                    shadow: start_icon.shadow,
                    draggable: false
                });
                bounds.extend(marker.getPosition());
                google.maps.event.addListener(marker, "click", function() {
                    infowindow.setContent("<p><b>User </b><br/>Walk ID : <?php echo $walk_id; ?><br/>Name :  <?php echo $owner_name; ?><br/>Phone :  <?php echo $owner_phone; ?><br/>Status :  <span style='color:red'><?php echo $status; ?></span></p>");
                    infowindow.open(map, marker);
                });
                for (var i = 0; i < markers1.length; i++) {
                    if ((i + 1) < markers1.length) {
                        var src = new google.maps.LatLng(parseFloat(markers1[i].lat),
                                parseFloat(markers1[i].lng));
                        var smarker = new google.maps.Marker({position: src, draggable: false, icon: start_icon.icon, shadow: start_icon.shadow});
                        bounds.extend(smarker.getPosition());
                        google.maps.event.addListener(smarker, "click", function() {
                            infowindow.setContent("<p><b>User </b><br/>Walk ID : <?php echo $walk_id; ?><br/>Name :  <?php echo $owner_name; ?><br/>Phone :  <?php echo $owner_phone; ?><br/>Status :  <span style='color:red'><?php echo $status; ?></span></p>");
                            infowindow.open(map, smarker);
                        });
                        var des = new google.maps.LatLng(parseFloat(markers1[i + 1].lat),
                                parseFloat(markers1[i + 1].lng));
                        var dmarker = new google.maps.Marker({position: des, map: map, draggable: false, icon: stop_icon.icon, shadow: stop_icon.shadow});
                        bounds.extend(dmarker.getPosition());
                        google.maps.event.addListener(dmarker, "click", function() {
                            infowindow.setContent("<p><b>Provider </b><br/>Walk ID :  <?php echo $walk_id; ?><br/>Name :  <?php echo $walker_name; ?><br/>Phone :  <?php echo $walker_phone; ?><br/>Status :  <span style='color:red'><?php echo $status; ?></span></p>");
                            infowindow.open(map, dmarker);
                        });

                        //  poly.setPath(path);

                        <?php if ($is_started == 1) { ?>
                        service.route({
                            origin: src,
                            destination: des,
                            travelMode: google.maps.DirectionsTravelMode.DRIVING
                        }, function(result, status) {
                            if (status == google.maps.DirectionsStatus.OK) {
                                for (var i = 0, len = result.routes[0].overview_path.length; i < len; i++) {
                                    path.push(result.routes[0].overview_path[i]);
                                }
                                poly.setPath(path);
                                map.fitBounds(bounds);
                            }
                        });
                        <?php } ?>

                        
                    }
                }
                var legendDiv = document.createElement('DIV');
                var legend = new Legend(legendDiv, map);
                legendDiv.index = 1;
                map.controls[google.maps.ControlPosition.RIGHT_TOP].push(legendDiv);
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
                        '<img src="<?php echo asset_url(); ?>/image/client-70.png" style="height:25px;"/> User<br />' +
                        '<img src="<?php echo asset_url(); ?>/image/client-red.png" style="height:25px;"/> Provider<br />' +
                        '<small>*Data is fictional</small>';
                controlUI.appendChild(controlText);
            }
            google.maps.event.addDomListener(window, 'load', load);

            
        </script>

@stop