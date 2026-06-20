<?php

class ApiContentController extends ApiBaseController
{
    private function tablesReady()
    {
        return Schema::hasTable('chama_banners') && Schema::hasTable('chama_attractions');
    }

    public function banners()
    {
        if (!$this->tablesReady()) {
            return Response::json(array('banners' => array()));
        }

        $app = Input::get('app', 'rider');
        $placement = Input::get('placement', 'home');
        $cityId = Input::get('city_id');
        $now = date('Y-m-d H:i:s');

        $query = ChamaBanner::where('is_active', 1)
            ->where('placement', $placement)
            ->where(function ($q) use ($app) {
                $q->where('target_app', 'both')
                    ->orWhere('target_app', $app === 'driver' ? 'driver' : 'rider');
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
            });

        if ($cityId) {
            $query->where(function ($q) use ($cityId) {
                $q->whereNull('city_id')->orWhere('city_id', $cityId);
            });
        }

        $items = $query->orderBy('sort_order')->orderBy('id', 'desc')->get();

        $banners = array();
        foreach ($items as $b) {
            $banners[] = array(
                'id' => (int) $b->id,
                'title' => $b->title,
                'subtitle' => $b->subtitle,
                'description' => $b->description,
                'cta_label' => $b->cta_label,
                'image_url' => $b->image_url,
                'link_url' => $b->link_url,
                'placement' => $b->placement,
            );
        }

        return Response::json(array('banners' => $banners));
    }

    public function attractions()
    {
        if (!$this->tablesReady()) {
            return Response::json(array('attractions' => array()));
        }

        $cityId = Input::get('city_id');
        $query = ChamaAttraction::where('is_active', 1);
        if ($cityId) {
            $query->where('city_id', $cityId);
        }
        $items = $query->orderBy('sort_order')->orderBy('name')->limit(50)->get();

        $attractions = array();
        foreach ($items as $a) {
            $attractions[] = array(
                'id' => (int) $a->id,
                'city_id' => $a->city_id ? (int) $a->city_id : null,
                'name' => $a->name,
                'description' => $a->description,
                'latitude' => $a->latitude ? (float) $a->latitude : null,
                'longitude' => $a->longitude ? (float) $a->longitude : null,
                'image_url' => $a->image_url,
            );
        }

        return Response::json(array('attractions' => $attractions));
    }

    public function cities()
    {
        if (!Schema::hasTable('chama_cities')) {
            return Response::json(array('cities' => array()));
        }

        $items = ChamaCity::where('is_active', 1)->orderBy('name')->get();
        $cities = array();
        foreach ($items as $c) {
            $cities[] = array(
                'id' => (int) $c->id,
                'name' => $c->name,
                'state' => $c->state,
                'latitude' => $c->latitude ? (float) $c->latitude : null,
                'longitude' => $c->longitude ? (float) $c->longitude : null,
            );
        }

        return Response::json(array('cities' => $cities));
    }
}
