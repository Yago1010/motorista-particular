<?php

class HelloController extends \BaseController {


    /**
     * Display a listing of the resource.
     *
     *
     * @return Response
     */
    public function index() {
        echo distanceGeoPoints(22, 50.0000001, 22, 50.000001);
    }

}
