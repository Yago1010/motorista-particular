<?php

class ChamaBanner extends Eloquent
{
    protected $table = 'chama_banners';

    public function city()
    {
        return $this->belongsTo('ChamaCity', 'city_id');
    }
}
