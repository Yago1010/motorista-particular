<?php

class ChamaAttraction extends Eloquent
{
    protected $table = 'chama_attractions';

    public function city()
    {
        return $this->belongsTo('ChamaCity', 'city_id');
    }
}
