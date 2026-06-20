<?php

class ApiPlacesController extends ApiBaseController
{
    private function haversineMeters($lat1, $lng1, $lat2, $lng2)
    {
        $earth = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) * sin($dLng / 2);
        return $earth * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    private function formatPlaceAddress($parts)
    {
        $chunks = array();
        foreach ($parts as $part) {
            $part = trim((string) $part);
            if ($part !== '' && !in_array($part, $chunks, true)) {
                $chunks[] = $part;
            }
        }
        return implode(', ', array_slice($chunks, 0, 4));
    }

    private function sortByDistance($places, $lat, $lng)
    {
        usort($places, function ($a, $b) use ($lat, $lng) {
            $da = isset($a['distance_m']) ? $a['distance_m'] : $this->haversineMeters($lat, $lng, $a['lat'], $a['lng']);
            $db = isset($b['distance_m']) ? $b['distance_m'] : $this->haversineMeters($lat, $lng, $b['lat'], $b['lng']);
            if ($da == $db) {
                return 0;
            }
            return ($da < $db) ? -1 : 1;
        });
        return $places;
    }

    private function fetchPhoton($query, $lat, $lng, $limit)
    {
        $url = 'https://photon.komoot.io/api/?' . http_build_query(array(
            'q' => $query,
            'lat' => $lat,
            'lon' => $lng,
            'limit' => max($limit, 10),
            'lang' => 'pt',
        ));

        $json = @file_get_contents($url, false, stream_context_create(array(
            'http' => array(
                'timeout' => 8,
                'header' => "User-Agent: ChamaNo12-PWA/1.0\r\n",
            ),
        )));

        if (!$json) {
            return array();
        }

        $data = json_decode($json, true);
        if (!isset($data['features']) || !is_array($data['features'])) {
            return array();
        }

        $places = array();
        foreach ($data['features'] as $feature) {
            if (!isset($feature['geometry']['coordinates'])) {
                continue;
            }
            $coords = $feature['geometry']['coordinates'];
            $props = isset($feature['properties']) ? $feature['properties'] : array();
            if (isset($props['country']) && stripos($props['country'], 'bra') === false) {
                continue;
            }

            $address = $this->formatPlaceAddress(array(
                isset($props['name']) ? $props['name'] : '',
                isset($props['street']) ? $props['street'] : '',
                isset($props['housenumber']) ? $props['housenumber'] : '',
                isset($props['city']) ? $props['city'] : (isset($props['county']) ? $props['county'] : ''),
                isset($props['state']) ? $props['state'] : '',
            ));

            if ($address === '') {
                continue;
            }

            $placeLat = (float) $coords[1];
            $placeLng = (float) $coords[0];
            $places[] = array(
                'lat' => $placeLat,
                'lng' => $placeLng,
                'address' => $address,
                'distance_m' => $this->haversineMeters($lat, $lng, $placeLat, $placeLng),
                'source' => 'photon',
            );
        }

        return $places;
    }

    private function fetchNominatim($query, $lat, $lng, $limit, $radiusKm)
    {
        $dLat = $radiusKm / 111.0;
        $dLng = $radiusKm / (111.0 * max(cos(deg2rad($lat)), 0.2));
        $minLng = $lng - $dLng;
        $maxLng = $lng + $dLng;
        $minLat = $lat - $dLat;
        $maxLat = $lat + $dLat;

        $url = 'https://nominatim.openstreetmap.org/search?' . http_build_query(array(
            'format' => 'json',
            'q' => $query,
            'addressdetails' => 1,
            'limit' => max($limit, 10),
            'accept-language' => 'pt-BR',
            'countrycodes' => 'br',
            'viewbox' => $minLng . ',' . $maxLat . ',' . $maxLng . ',' . $minLat,
            'bounded' => 1,
        ));

        $json = @file_get_contents($url, false, stream_context_create(array(
            'http' => array(
                'timeout' => 8,
                'header' => "User-Agent: ChamaNo12-PWA/1.0\r\n",
            ),
        )));

        if (!$json) {
            return array();
        }

        $results = json_decode($json, true);
        if (!is_array($results)) {
            return array();
        }

        $places = array();
        foreach ($results as $row) {
            $placeLat = (float) $row['lat'];
            $placeLng = (float) $row['lon'];
            $address = isset($row['display_name'])
                ? implode(', ', array_slice(explode(',', $row['display_name']), 0, 3))
                : $query;

            $places[] = array(
                'lat' => $placeLat,
                'lng' => $placeLng,
                'address' => trim($address),
                'distance_m' => $this->haversineMeters($lat, $lng, $placeLat, $placeLng),
                'source' => 'nominatim',
            );
        }

        return $places;
    }

    private function fetchNominatimGlobal($query, $limit)
    {
        $url = 'https://nominatim.openstreetmap.org/search?' . http_build_query(array(
            'format' => 'json',
            'q' => $query,
            'addressdetails' => 1,
            'limit' => max($limit, 10),
            'accept-language' => 'pt-BR',
            'countrycodes' => 'br',
        ));

        $json = @file_get_contents($url, false, stream_context_create(array(
            'http' => array(
                'timeout' => 8,
                'header' => "User-Agent: ChamaNo12-PWA/1.0\r\n",
            ),
        )));

        if (!$json) {
            return array();
        }

        $results = json_decode($json, true);
        if (!is_array($results)) {
            return array();
        }

        $places = array();
        foreach ($results as $row) {
            $places[] = array(
                'lat' => (float) $row['lat'],
                'lng' => (float) $row['lon'],
                'address' => trim(implode(', ', array_slice(explode(',', $row['display_name']), 0, 4))),
                'source' => 'nominatim-global',
            );
        }

        return $places;
    }

    private function dedupePlaces($places)
    {
        $seen = array();
        $unique = array();
        foreach ($places as $place) {
            $key = round($place['lat'], 4) . '|' . round($place['lng'], 4) . '|' . strtolower($place['address']);
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $unique[] = $place;
        }
        return $unique;
    }

    public function search()
    {
        $query = trim(Input::get('q', ''));
        $limit = (int) Input::get('limit', 8);
        $limit = max(1, min($limit, 15));
        $radiusKm = (float) Input::get('radius_km', 35);
        $wide = Input::get('wide') === '1' || Input::get('wide') === 'true';
        $radiusKm = $wide ? max(5, min($radiusKm, 500)) : max(5, min($radiusKm, 80));
        $maxDistanceM = (float) Input::get('max_distance_m', $wide ? 800000 : $radiusKm * 1000);
        $lat = Input::get('lat');
        $lng = Input::get('lng');

        if (strlen($query) < 2) {
            return Response::json(array('places' => array()));
        }

        $places = array();

        if ($lat !== null && $lat !== '' && $lng !== null && $lng !== '') {
            $lat = (float) $lat;
            $lng = (float) $lng;

            $places = $this->fetchPhoton($query, $lat, $lng, $limit);
            if (count($places) < 3) {
                if ($wide) {
                    $places = array_merge($places, $this->fetchNominatimGlobal($query, $limit));
                } else {
                    $places = array_merge($places, $this->fetchNominatim($query, $lat, $lng, $limit, $radiusKm));
                }
            }

            $places = $this->dedupePlaces($places);
            $places = $this->sortByDistance($places, $lat, $lng);

            if (!$wide) {
                $filtered = array();
                foreach ($places as $place) {
                    if ($place['distance_m'] <= $maxDistanceM) {
                        $filtered[] = $place;
                    }
                }
                if (count($filtered) >= 1) {
                    $places = $filtered;
                }
            }
        } else {
            $url = 'https://nominatim.openstreetmap.org/search?' . http_build_query(array(
                'format' => 'json',
                'q' => $query,
                'addressdetails' => 1,
                'limit' => $limit,
                'accept-language' => 'pt-BR',
                'countrycodes' => 'br',
            ));
            $json = @file_get_contents($url, false, stream_context_create(array(
                'http' => array(
                    'timeout' => 8,
                    'header' => "User-Agent: ChamaNo12-PWA/1.0\r\n",
                ),
            )));
            $results = $json ? json_decode($json, true) : array();
            if (is_array($results)) {
                foreach ($results as $row) {
                    $places[] = array(
                        'lat' => (float) $row['lat'],
                        'lng' => (float) $row['lon'],
                        'address' => trim(implode(', ', array_slice(explode(',', $row['display_name']), 0, 3))),
                    );
                }
            }
        }

        $places = array_slice($places, 0, $limit);
        foreach ($places as &$place) {
            if (isset($place['distance_m'])) {
                $place['distance_m'] = (int) round($place['distance_m']);
            }
        }
        unset($place);

        return Response::json(array('places' => $places));
    }

    public function reverse()
    {
        $lat = Input::get('lat');
        $lng = Input::get('lng');
        if ($lat === null || $lng === null) {
            return Response::json(array('address' => ''), 400);
        }

        $url = 'https://nominatim.openstreetmap.org/reverse?' . http_build_query(array(
            'format' => 'json',
            'lat' => (float) $lat,
            'lon' => (float) $lng,
            'addressdetails' => 1,
            'accept-language' => 'pt-BR',
        ));

        $json = @file_get_contents($url, false, stream_context_create(array(
            'http' => array(
                'timeout' => 8,
                'header' => "User-Agent: ChamaNo12-PWA/1.0\r\n",
            ),
        )));

        $address = '';
        if ($json) {
            $data = json_decode($json, true);
            if (isset($data['display_name'])) {
                $address = implode(', ', array_slice(explode(',', $data['display_name']), 0, 3));
            }
        }

        if ($address === '') {
            $address = round((float) $lat, 5) . ', ' . round((float) $lng, 5);
        }

        return Response::json(array('address' => $address));
    }
}
