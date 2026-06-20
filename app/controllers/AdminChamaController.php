<?php

class AdminChamaController extends BaseController
{
    public function __construct()
    {
        $this->beforeFilter(function () {
            if (!Auth::check()) {
                return Redirect::to('/admin/login');
            }
        });
    }

    private function ensureTables()
    {
        chama_ensure_admin_tables(true);
    }

    private function stats()
    {
        return array(
            'passengers' => DB::table('owner')->count(),
            'drivers' => DB::table('walker')->count(),
            'drivers_approved' => DB::table('walker')->where('is_approved', 1)->count(),
            'rides_total' => DB::table('request')->count(),
            'rides_today' => DB::table('request')->where('created_at', '>=', date('Y-m-d') . ' 00:00:00')->count(),
            'rides_active' => DB::table('request')->where('is_completed', 0)->where('is_cancelled', 0)->count(),
            'coupons' => DB::table('promo_codes')->count(),
            'cities' => Schema::hasTable('chama_cities') ? DB::table('chama_cities')->count() : 0,
            'attractions' => Schema::hasTable('chama_attractions') ? DB::table('chama_attractions')->count() : 0,
            'banners' => Schema::hasTable('chama_banners') ? DB::table('chama_banners')->count() : 0,
        );
    }

    /** @deprecated Hub unificado no Dashboard — mantém rota por compatibilidade */
    public function hub()
    {
        return Redirect::route('AdminReport');
    }

    public function users()
    {
        $stats = $this->stats();
        $stats['drivers_pending'] = (int) DB::table('walker')->where('is_approved', 0)->count();

        return View::make('chama.users')
            ->with('title', 'Usuários')
            ->with('page', 'chama-users')
            ->with('stats', $stats);
    }

    /** @deprecated Substituído por Usuários — redireciona por compatibilidade */
    public function attractions()
    {
        return Redirect::route('AdminChamaUsers');
    }

    public function cities()
    {
        $this->ensureTables();
        $cities = ChamaCity::orderBy('name')->get();

        return View::make('chama.cities')
            ->with('title', 'Cidades')
            ->with('page', 'chama-cities')
            ->with('cities', $cities);
    }

    public function saveCity()
    {
        $this->ensureTables();
        $id = Input::get('id');
        $city = $id ? ChamaCity::find($id) : new ChamaCity();
        if (!$city) {
            return Redirect::route('AdminChamaCities');
        }

        $city->name = Input::get('name');
        $city->state = Input::get('state');
        $city->country = Input::get('country', 'Brasil');
        $city->latitude = Input::get('latitude') !== '' ? Input::get('latitude') : null;
        $city->longitude = Input::get('longitude') !== '' ? Input::get('longitude') : null;
        $city->is_active = Input::get('is_active') ? 1 : 0;
        $city->save();

        Session::flash('msg', 'Cidade salva com sucesso.');
        return Redirect::route('AdminChamaCities');
    }

    public function deleteCity($id)
    {
        $this->ensureTables();
        ChamaCity::where('id', $id)->delete();
        Session::flash('msg', 'Cidade removida.');
        return Redirect::route('AdminChamaCities');
    }

    public function saveAttraction()
    {
        return Redirect::route('AdminChamaUsers');
    }

    public function deleteAttraction($id)
    {
        return Redirect::route('AdminChamaUsers');
    }

    public function banners()
    {
        $this->ensureTables();
        $banners = ChamaBanner::with('city')->orderBy('sort_order')->orderBy('id', 'desc')->get();
        $cities = ChamaCity::where('is_active', 1)->orderBy('name')->get();

        return View::make('chama.banners')
            ->with('title', 'Anúncios e Propagandas')
            ->with('page', 'chama-banners')
            ->with('banners', $banners)
            ->with('cities', $cities);
    }

    public function saveBanner()
    {
        $this->ensureTables();
        $id = Input::get('id');
        $banner = $id ? ChamaBanner::find($id) : new ChamaBanner();
        if (!$banner) {
            return Redirect::route('AdminChamaBanners');
        }

        $banner->title = Input::get('title');
        $banner->subtitle = Input::get('subtitle');
        $banner->description = Input::get('description');
        $banner->cta_label = Input::get('cta_label', 'Saiba mais');
        $banner->image_url = Input::get('image_url');
        $banner->link_url = Input::get('link_url');
        $banner->target_app = Input::get('target_app', 'both');
        $banner->placement = Input::get('placement', 'home');
        $banner->city_id = Input::get('city_id') ?: null;
        $banner->sort_order = (int) Input::get('sort_order', 0);
        $banner->is_active = Input::get('is_active') ? 1 : 0;
        $banner->starts_at = Input::get('starts_at') ?: null;
        $banner->ends_at = Input::get('ends_at') ?: null;
        $banner->save();

        Session::flash('msg', 'Anúncio salvo. Aparecerá nos apps passageiro/motorista.');
        return Redirect::route('AdminChamaBanners');
    }

    public function deleteBanner($id)
    {
        $this->ensureTables();
        ChamaBanner::where('id', $id)->delete();
        Session::flash('msg', 'Anúncio removido.');
        return Redirect::route('AdminChamaBanners');
    }

    public function toggleBanner($id)
    {
        $this->ensureTables();
        $banner = ChamaBanner::find($id);
        if ($banner) {
            $banner->is_active = $banner->is_active ? 0 : 1;
            $banner->save();
        }
        return Redirect::route('AdminChamaBanners');
    }
}
