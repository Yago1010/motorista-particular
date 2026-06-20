<?php

class ChamaCity extends Eloquent
{
    protected $table = 'chama_cities';

    public function attractions()
    {
        return $this->hasMany('ChamaAttraction', 'city_id');
    }
}
