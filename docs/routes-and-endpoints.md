# Inventario de Rotas e Viabilidade Vercel

## Resumo do Projeto

- Backend principal: Laravel 4.2 monolitico em `app`.
- Frontend PWA: React + Vite em `pwa-rider`.
- Banco local de referencia: MySQL 5.7 (`docker-compose.yml` + `uberx.sql`).

## Fontes Mapeadas

- Backend:
  - `app/routes.php`
  - `app/filters.php`
- Frontend:
  - `pwa-rider/src/main.tsx`
  - `pwa-rider/src/App.tsx`
  - `pwa-rider/src/components/PassengerLayout.tsx`
- Viabilidade de deploy:
  - `composer.json`
  - `pwa-rider/package.json`
  - `docker-compose.yml`
  - `app/config/session.php`
  - `app/config/cache.php`
  - `app/config/queue.php`

## Rotas Backend (Laravel)

### Observacoes gerais

- As rotas estao centralizadas em `app/routes.php`.
- Nao foram encontradas `Route::resource`/`Route::apiResource`; os endpoints sao explicitos.
- Prefixos mais usados: `/user`, `/provider`, `/admin`, `/application`, `/dog`, `/walk`, `/walker`.
- Existem rotas sem barra inicial (ex.: `panic`, `install`, `token_braintree`), validas no Laravel.

### Endpoints

| Metodo | Path | Handler | Area |
|---|---|---|---|
| GET | `/test` | `HelloController@test` | API |
| GET | `/language/{locale}` | `Closure` | Sistema |
| GET | `/payms` | `HelloController@payms` | API |
| POST | `/dog/addschedule` | `DogController@add_schedule` | API |
| POST | `/dog/cancelschedule` | `DogController@cancel_schedule` | API |
| GET | `/dog/getwalkers` | `DogController@get_walkers` | API |
| POST | `/dog/assignwalker` | `DogController@assign_walker` | API |
| GET | `/walk/walkinprogress` | `DogController@walkinprogress` | API |
| GET | `/walk/nonreviewedwalks` | `DogController@nonreviewedwalks` | API |
| GET | `/walks` | `DogController@get_walks` | API |
| POST | `/walk/walksummary` | `WalkerController@walk_summary` | API |
| POST | `/walk/photo` | `WalkerController@upload_photo` | API |
| POST | `/walk/video` | `WalkerController@upload_video` | API |
| GET | `/walker/walks` | `WalkerController@get_walks` | API |
| GET | `/walker/details` | `WalkerController@get_details` | API |
| POST | `/walker/cancelwalk` | `WalkerController@cancel_walk` | API |
| POST | `/walker/getwalk` | `WalkerController@walk_details` | API |
| POST | `/walker/getschedule` | `WalkerController@get_schedule` | API |
| POST | `/user/login` | `OwnerController@login` | API |
| POST | `/user/register` | `OwnerController@register` | API |
| POST | `/user/location` | `DogController@set_location` | API |
| ANY | `/user/details` | `OwnerController@details` | API |
| POST | `/user/addcardtoken` | `OwnerController@addcardtoken` | API |
| GET | `/user/braintreekey` | `OwnerController@get_braintree_token` | API |
| POST | `/user/deletecardtoken` | `OwnerController@deletecardtoken` | API |
| POST | `/user/update` | `OwnerController@update_profile` | API |
| POST | `/user/paydebt` | `OwnerController@pay_debt` | API |
| POST | `/user/selectcard` | `OwnerController@select_card` | API |
| GET | `/user` | `OwnerController@getProfile` | API |
| ANY | `/user/thing` | `DogController@create` | API |
| POST | `/user/updatething` | `DogController@update_thing` | API |
| POST | `/user/createrequest` | `DogController@create_request` | API |
| POST | `/user/createrequestlater` | `DogController@create_request_later` | API |
| POST | `/user/getproviders` | `DogController@get_providers` | API |
| POST | `/user/getprovidersall` | `DogController@get_providers_all` | API |
| POST | `/user/getnearbyproviders` | `DogController@get_nearby_providers` | API |
| POST | `/user/createrequestproviders` | `DogController@create_request_providers` | API |
| POST | `/user/cancellation` | `DogController@cancellation` | API |
| GET | `/user/getrequest` | `DogController@get_request` | API |
| POST | `/user/cancelrequest` | `DogController@cancel_request` | API |
| GET | `/server/schedulerequest` | `DogController@schedule_request` | API |
| GET | `/user/getrequestlocation` | `DogController@get_request_location` | API |
| POST | `/user/rating` | `DogController@set_walker_rating` | API |
| GET | `/user/requestinprogress` | `DogController@request_in_progress` | API |
| GET | `/user/requestpath` | `DogController@get_walk_location` | API |
| GET | `/provider/requestpath` | `WalkerController@get_walk_location` | API |
| POST | `/user/referral` | `OwnerController@set_referral_code` | API |
| GET | `/user/referral` | `OwnerController@get_referral_code` | API |
| POST | `/user/apply-referral` | `OwnerController@apply_referral_code` | API |
| GET | `/user/cards` | `OwnerController@get_cards` | API |
| GET | `/user/history` | `OwnerController@get_completed_requests` | API |
| POST | `/user/paybypaypal` | `OwnerController@paybypaypal` | API |
| POST | `/user/paybybitcoin` | `OwnerController@paybybitcoin` | API |
| POST | `/user/acceptbitcoin` | `OwnerController@acceptbitcoin` | API |
| GET | `/user/send_eta` | `OwnerController@send_eta` | API |
| GET | `/user/current_eta` | `DogController@eta` | API |
| GET | `/user/credits` | `OwnerController@get_credits` | API |
| GET | `/user/payment_options` | `OwnerController@payment_options_allowed` | API |
| GET | `/user/check_promo_code` | `DogController@check_promo_code` | API |
| GET | `/provider/check_banking` | `WalkerController@check_banking` | API |
| GET | `/provider/getrequests` | `WalkerController@get_requests` | API |
| GET | `/provider/getrequest` | `WalkerController@get_request` | API |
| POST | `/provider/respondrequest` | `WalkerController@respond_request` | API |
| POST | `/provider/location` | `WalkerController@walker_location` | API |
| POST | `/provider/requestwalkerstarted` | `WalkerController@request_walker_started` | API |
| POST | `/provider/requestwalkerarrived` | `WalkerController@request_walker_arrived` | API |
| POST | `/provider/requestwalkstarted` | `WalkerController@request_walk_started` | API |
| POST | `/request/location` | `WalkerController@walk_location` | API |
| POST | `/provider/requestwalkcompleted` | `WalkerController@request_walk_completed` | API |
| POST | `/provider/prepayment` | `WalkerController@pre_payment` | API |
| POST | `/provider/paymentselection` | `WalkerController@payment_selection` | API |
| POST | `/provider/rating` | `WalkerController@set_dog_rating` | API |
| POST | `/provider/login` | `WalkerController@login` | API |
| POST | `/provider/register` | `WalkerController@register` | API |
| POST | `/provider/update` | `WalkerController@update_profile` | API |
| POST | `/provider_services/update` | `WalkerController@provider_services_update` | API |
| GET | `/provider/services_details` | `WalkerController@services_details` | API |
| GET | `/provider/requestinprogress` | `WalkerController@request_in_progress` | API |
| GET | `/provider/checkstate` | `WalkerController@check_state` | API |
| POST | `/provider/togglestate` | `WalkerController@toggle_state` | API |
| GET | `/provider/history` | `WalkerController@get_completed_requests` | API |
| POST | `panic` | `WalkerController@panic` | API |
| GET | `/application/pages` | `ApplicationController@pages` | API |
| GET | `/application/types` | `ApplicationController@types` | API |
| GET | `/application/page/{id}` | `ApplicationController@get_page` | API |
| POST | `/application/forgot-password` | `ApplicationController@forgot_password` | API |
| GET | `/admin/report` | `AdminController@report` | Admin |
| GET | `/admin/payprovider/{id}` | `AdminController@pay_provider` | Admin |
| GET | `/admin/chargeuser/{id}` | `AdminController@charge_user` | Admin |
| GET | `/admin/addreq/{id}` | `AdminController@add_request` | Admin |
| POST | `/admin/transfer_amount` | `AdminController@transfer_amount` | Admin |
| GET | `/admin/map_view` | `AdminController@map_view` | Admin |
| GET | `/admin/providers` | `AdminController@walkers` | Admin |
| GET | `/admin/users` | `AdminController@owners` | Admin |
| GET | `/admin/requests` | `AdminController@walks` | Admin |
| GET | `/admin/reviews` | `AdminController@reviews` | Admin |
| GET | `/admin/reviews/delete/{id}` | `AdminController@delete_review` | Admin |
| GET | `/admin/search` | `AdminController@search` | Admin |
| GET | `/admin/login` | `AdminController@login` | Admin |
| POST | `/admin/verify` | `AdminController@verify` | Admin |
| GET | `/admin/logout` | `AdminController@logout` | Admin |
| GET | `/admin/admins` | `AdminController@admins` | Admin |
| GET | `/admin/add_admin` | `AdminController@add_admin` | Admin |
| GET | `/admin/user/referral/{id}` | `AdminController@referral_details` | Admin |
| POST | `/admin/admins/add` | `AdminController@add_admin_do` | Admin |
| GET | `/admin/admins/edit/{id}` | `AdminController@edit_admins` | Admin |
| POST | `/admin/admins/update` | `AdminController@update_admin` | Admin |
| GET | `/admin/admins/delete/{id}` | `AdminController@delete_admin` | Admin |
| GET | `/admin` | `AdminController@index` | Admin |
| GET | `/admin/add` | `AdminController@add` | Admin |
| GET | `/admin/savesetting` | `AdminController@skipSetting` | Admin |
| GET | `/admin/provider/edit/{id}` | `AdminController@edit_walker` | Admin |
| GET | `/admin/provider/edit/availability/{id}` | `AdminController@provider_availabilty` | Admin |
| GET | `/admin/provider/add` | `AdminController@add_walker` | Admin |
| GET | `/admin/promo_code/add` | `AdminController@add_promo_code` | Admin |
| GET | `/admin/promo_code/edit/{id}` | `AdminController@edit_promo_code` | Admin |
| GET | `/admin/promo_code/deactivate/{id}` | `AdminController@deactivate_promo_code` | Admin |
| GET | `/admin/promo_code/activate/{id}` | `AdminController@activate_promo_code` | Admin |
| POST | `/admin/provider/update` | `AdminController@update_walker` | Admin |
| POST | `/admin/promo_code/update` | `AdminController@update_promo_code` | Admin |
| GET | `/admin/provider/history/{id}` | `AdminController@walker_history` | Admin |
| GET | `/admin/provider/requests/{id}` | `AdminController@walker_upcoming_walks` | Admin |
| GET | `/admin/provider/decline/{id}` | `AdminController@decline_walker` | Admin |
| GET | `/admin/provider/delete/{id}` | `AdminController@delete_walker` | Admin |
| GET | `/admin/provider/approve/{id}` | `AdminController@approve_walker` | Admin |
| GET | `/admin/providers_xml` | `AdminController@walkers_xml` | Admin |
| GET | `/admin/user/delete/{id}` | `AdminController@delete_owner` | Admin |
| GET | `/admin/user/edit/{id}` | `AdminController@edit_owner` | Admin |
| POST | `/admin/user/update` | `AdminController@update_owner` | Admin |
| GET | `/admin/user/history/{id}` | `AdminController@owner_history` | Admin |
| GET | `/admin/user/requests/{id}` | `AdminController@owner_upcoming_walks` | Admin |
| GET | `/admin/request/decline/{id}` | `AdminController@decline_walk` | Admin |
| GET | `/admin/request/approve/{id}` | `AdminController@approve_walk` | Admin |
| GET | `/admin/request/map/{id}` | `AdminController@view_map` | Admin |
| GET | `/admin/request/change_provider/{id}` | `AdminController@change_walker` | Admin |
| GET | `/admin/request/alternative_providers_xml/{id}` | `AdminController@alternative_walkers_xml` | Admin |
| POST | `/admin/request/change_provider` | `AdminController@save_changed_walker` | Admin |
| POST | `/admin/request/pay_provider` | `AdminController@pay_walker` | Admin |
| GET | `/admin/settings` | `AdminController@get_settings` | Admin |
| GET | `/admin/settings/installation` | `AdminController@installation_settings` | Admin |
| POST | `/admin/install` | `AdminController@finish_install` | Admin |
| POST | `/admin/certi` | `AdminController@addcerti` | Admin |
| POST | `/admin/theme` | `AdminController@theme` | Admin |
| POST | `/admin/settings` | `AdminController@save_settings` | Admin |
| GET | `/admin/informations` | `AdminController@get_info_pages` | Admin |
| GET | `/admin/information/edit/{id}` | `AdminController@edit_info_page` | Admin |
| POST | `/admin/information/update` | `AdminController@update_info_page` | Admin |
| GET | `/admin/information/delete/{id}` | `AdminController@delete_info_page` | Admin |
| GET | `/admin/provider-types` | `AdminController@get_provider_types` | Admin |
| GET | `/admin/provider-type/edit/{id}` | `AdminController@edit_provider_type` | Admin |
| POST | `/admin/provider-type/update` | `AdminController@update_provider_type` | Admin |
| GET | `/admin/provider-type/delete/{id}` | `AdminController@delete_provider_type` | Admin |
| GET | `/admin/document-types` | `AdminController@get_document_types` | Admin |
| GET | `/admin/promo_code` | `AdminController@get_promo_codes` | Admin |
| GET | `/admin/edit_keywords` | `AdminController@edit_keywords` | Admin |
| POST | `/admin/save_keywords` | `AdminController@save_keywords` | Admin |
| POST | `/admin/save_keywords_ui` | `AdminController@save_keywords_UI` | Admin |
| GET | `/admin/document-type/edit/{id}` | `AdminController@edit_document_type` | Admin |
| POST | `/admin/document-type/update` | `AdminController@update_document_type` | Admin |
| GET | `/admin/document-type/delete/{id}` | `AdminController@delete_document_type` | Admin |
| POST | `/admin/adminCurrency` | `AdminController@adminCurrency` | Admin |
| GET | `/admin/details_payment` | `AdminController@payment_details` | Admin |
| GET | `/admin/provider/banking/{id}` | `AdminController@banking_provider` | Admin |
| POST | `/admin/provider/providerB_bankingSubmit` | `AdminController@providerB_bankingSubmit` | Admin |
| POST | `/admin/provider/providerS_bankingSubmit` | `AdminController@providerS_bankingSubmit` | Admin |
| POST | `admin/add-request` | `AdminController@create_manual_request` | Admin |
| GET | `/admin/sortur` | `AdminController@sortur` | Admin |
| GET | `/admin/sortpv` | `AdminController@sortpv` | Admin |
| GET | `/admin/sortpvtype` | `AdminController@sortpvtype` | Admin |
| GET | `/admin/sortreq` | `AdminController@sortreq` | Admin |
| GET | `/admin/sortpromo` | `AdminController@sortpromo` | Admin |
| GET | `/admin/provider/allow_availability` | `AdminController@allow_availability` | Admin |
| GET | `/admin/provider/disable_availability` | `AdminController@disable_availability` | Admin |
| GET | `/admin/provider/availability/{id}` | `AdminController@availability_provider` | Admin |
| POST | `/admin/provider/availabilitySubmit/{id}` | `AdminController@provideravailabilitySubmit` | Admin |
| GET | `/admin/provider/view_documents/{id}` | `AdminController@view_documents_provider` | Admin |
| GET | `/admin/provider/current` | `AdminController@current` | Admin |
| GET | `/` | `WebController@index` | Web |
| GET | `/user/signin` | `WebUserController@userLogin` | Web |
| GET | `/user/signup` | `WebUserController@userRegister` | Web |
| POST | `/user/save` | `WebUserController@userSave` | Web |
| POST | `/user/forgot-password` | `WebUserController@userForgotPassword` | Web |
| GET | `/user/logout` | `WebUserController@userLogout` | Web |
| POST | `/user/verify` | `WebUserController@userVerify` | Web |
| GET | `/user/trips` | `WebUserController@userTrips` | Web |
| GET | `/user/trip/status/{id}` | `WebUserController@userTripStatus` | Web |
| GET | `/user/trip/cancel/{id}` | `WebUserController@userTripCancel` | Web |
| GET | `/find` | `WebUserController@surroundingCars` | Web |
| GET | `user/paybypaypal/{id}` | `WebUserController@webpaybypaypal` | Web |
| GET | `user/paybypalweb/{id}` | `WebUserController@paybypalwebSubmit` | Web |
| GET | `userpaypalstatus` | `WebUserController@paypalstatus` | Web |
| GET | `userpaypalipn` | `WebUserController@userpaypalipn` | Web |
| GET | `/user/request-trip` | `WebUserController@userRequestTrip` | Web |
| GET | `/user/skipReview/{id}` | `WebUserController@userSkipReview` | Web |
| POST | `/user/eta` | `WebUserController@send_eta_web` | Web |
| GET | `/user/request-fare` | `WebUserController@request_fare` | Web |
| GET | `/user/requesteta` | `WebUserController@request_eta` | Web |
| POST | `/user/request-trip` | `WebUserController@saveUserRequestTrip` | Web |
| POST | `/user/post-review` | `WebUserController@saveUserReview` | Web |
| GET | `/user/profile` | `WebUserController@userProfile` | Web |
| GET | `/user/payments` | `WebUserController@userPayments` | Web |
| GET | `termsncondition` | `WebController@termsncondition` | Web |
| GET | `banking_provider_mobile/{id}` | `WebController@banking_provider_mobile` | Web |
| POST | `provider/provider_braintree_banking` | `WebController@providerB_bankingSubmit` | Web |
| POST | `provider/provider_stripe_banking` | `WebController@providerS_bankingSubmit` | Web |
| GET | `page/{title}` | `WebController@page` | Web |
| GET | `track/{id}` | `WebController@track_ride` | Web |
| GET | `get_track_loc/{id}` | `WebController@get_track_loc` | Web |
| POST | `/user/payments` | `WebUserController@saveUserPayment` | Web |
| GET | `/user/payment/delete/{id}` | `WebUserController@deleteUserPayment` | Web |
| POST | `/user/update_profile` | `WebUserController@updateUserProfile` | Web |
| POST | `/user/update_password` | `WebUserController@updateUserPassword` | Web |
| POST | `/user/update_code` | `WebUserController@updateUserCode` | Web |
| GET | `/user/trip/{id}` | `WebUserController@userTripDetail` | Web |
| GET | `/admin/searchpv` | `AdminController@searchpv` | Admin |
| GET | `/admin/searchur` | `AdminController@searchur` | Admin |
| GET | `/admin/searchreq` | `AdminController@searchreq` | Admin |
| GET | `/admin/searchrev` | `AdminController@searchrev` | Admin |
| GET | `/admin/searchinfo` | `AdminController@searchinfo` | Admin |
| GET | `/admin/searchpvtype` | `AdminController@searchpvtype` | Admin |
| GET | `/admin/searchdoc` | `AdminController@searchdoc` | Admin |
| GET | `/admin/searchpromo` | `AdminController@searchpromo` | Admin |
| GET | `/provider/signin` | `WebProviderController@providerLogin` | Web |
| GET | `/provider/activation/{act}` | `WebProviderController@providerActivation` | Web |
| GET | `/provider/signup` | `WebProviderController@providerRegister` | Web |
| POST | `/provider/save` | `WebProviderController@providerSave` | Web |
| GET | `/provider/availability` | `WebProviderController@provideravailability` | Web |
| POST | `/provider/availabilitysubmit` | `WebProviderController@provideravailabilitysubmit` | Web |
| POST | `/provider/forgot-password` | `WebProviderController@providerForgotPassword` | Web |
| GET | `/provider/logout` | `WebProviderController@providerLogout` | Web |
| POST | `/provider/verify` | `WebProviderController@providerVerify` | Web |
| GET | `/provider/trips` | `WebProviderController@providerTrips` | Web |
| GET | `/provider/trip/{id}` | `WebProviderController@providerTripDetail` | Web |
| GET | `/provider/trip/changestate/{id}` | `WebProviderController@providerTripChangeState` | Web |
| GET | `/provider/tripinprogress` | `WebProviderController@providerTripInProgress` | Web |
| GET | `/provider/skipReview` | `WebProviderController@providerSkipReview` | Web |
| GET | `/provider/profile` | `WebProviderController@providerProfile` | Web |
| POST | `/provider/update_profile` | `WebProviderController@updateProviderProfile` | Web |
| POST | `/provider/update_password` | `WebProviderController@updateProviderPassword` | Web |
| GET | `/provider/documents` | `WebProviderController@providerDocuments` | Web |
| POST | `/provider/update_documents` | `WebProviderController@providerUpdateDocuments` | Web |
| GET | `/provider/request` | `WebProviderController@providerRequestPing` | Web |
| POST | `user/request` | `WebProviderController@create_manual_request` | Web |
| GET | `/provider/request/decline/{id}` | `WebProviderController@decline_request` | Web |
| GET | `/provider/request/accept/{id}` | `WebProviderController@approve_request` | Web |
| POST | `provider/get-nearby` | `WebProviderController@get_nearby` | Web |
| ANY | `/provider/availability/toggle` | `WebProviderController@toggle_availability` | Web |
| ANY | `/provider/location/set` | `WebProviderController@set_location` | Web |
| ANY | `install` | `InstallerController@install` | Sistema |
| GET | `/install/complete` | `InstallerController@finish_install` | Sistema |
| POST | `user/fare` | `DogController@fare_calculator` | API |
| GET | `token_braintree` | `ApplicationController@token_braintree` | API |

## Rotas Frontend (`pwa-rider`)

### Definicao de rotas

- Router raiz via `BrowserRouter` em `pwa-rider/src/main.tsx`.
- Lista de rotas em `pwa-rider/src/App.tsx`.
- Guard de sessao em `pwa-rider/src/components/PassengerLayout.tsx` (`if (!session) return <Navigate to="/" replace />`).

### Rotas navegaveis

| Path | Componente | Arquivo | Protecao/Pre-condicao |
|---|---|---|---|
| `/` | `LoginPage` | `pwa-rider/src/pages/LoginPage.tsx` | Publica |
| `/home` | `HomeRidePage` | `pwa-rider/src/pages/HomeRidePage.tsx` | Requer sessao (`PassengerLayout`) |
| `/destino` | `DestinationSearchPage` | `pwa-rider/src/pages/DestinationSearchPage.tsx` | Requer sessao; sem estado valido redireciona para `/home` |
| `/confirmar` | `RideConfirmPage` | `pwa-rider/src/pages/RideConfirmPage.tsx` | Requer sessao; sem estado valido redireciona para `/home` |
| `/confirmar/pagamento` | `RidePaymentPickPage` | `pwa-rider/src/pages/RidePaymentPickPage.tsx` | Requer sessao; valida estado de fluxo |
| `/confirmar/cartao` | `RideAddCardPage` | `pwa-rider/src/pages/RideAddCardPage.tsx` | Requer sessao; valida estado de fluxo |
| `/entrega` | `EntregaPage` | `pwa-rider/src/pages/EntregaPage.tsx` | Requer sessao |
| `/entrega/busca-coleta` | `EntregaColetaSearchPage` | `pwa-rider/src/pages/EntregaColetaSearchPage.tsx` | Requer sessao; sem estado redireciona para `/entrega` |
| `/entrega/destinatario` | `EntregaRecipientPage` | `pwa-rider/src/pages/EntregaRecipientPage.tsx` | Requer sessao; sem estado redireciona para `/entrega` |
| `/entrega/detalhes` | `EntregaDetailsPage` | `pwa-rider/src/pages/EntregaDetailsPage.tsx` | Requer sessao; sem estado redireciona para `/entrega` |
| `/entrega/item` | `EntregaItemPage` | `pwa-rider/src/pages/EntregaItemPage.tsx` | Requer sessao; sem estado redireciona para `/entrega` |
| `/pagar` | `PagarPage` | `pwa-rider/src/pages/PagarPage.tsx` | Requer sessao |
| `/perfil` | `PerfilPage` | `pwa-rider/src/pages/MenuPages.tsx` | Requer sessao |
| `/atividade` | `AtividadePage` | `pwa-rider/src/pages/MenuPages.tsx` | Requer sessao |
| `/ajuda` | `AjudaPage` | `pwa-rider/src/pages/MenuPages.tsx` | Requer sessao |
| `/mensagens` | `MensagensPage` | `pwa-rider/src/pages/MenuPages.tsx` | Requer sessao |
| `/seguranca` | `SegurancaPage` | `pwa-rider/src/pages/MenuPages.tsx` | Requer sessao |
| `/metodos-pagamento` | `MetodosPagamentoPage` | `pwa-rider/src/pages/MenuPages.tsx` | Requer sessao |
| `/configuracoes` | `ConfiguracoesPage` | `pwa-rider/src/pages/MenuPages.tsx` | Requer sessao |
| `/convidar-amigos` | `ConvidarAmigosPage` | `pwa-rider/src/pages/MenuPages.tsx` | Requer sessao |
| `/escanear` | `EscanearPage` | `pwa-rider/src/pages/MenuPages.tsx` | Requer sessao |
| `/status/:requestId` | `TripStatusPage` | `pwa-rider/src/pages/TripStatusPage.tsx` | Requer sessao |
| `/request` | `Navigate -> /home` | `pwa-rider/src/App.tsx` | Redirecionamento |
| `*` | `Navigate -> /` | `pwa-rider/src/App.tsx` | Fallback |

## Viabilidade na Vercel (Gratis, so para teste)

### Resposta curta

Voce consegue hospedar **o frontend `pwa-rider` na Vercel gratis** para testar.  
O backend Laravel 4.2 deste repositorio **nao e um bom fit para Vercel free** sem adaptacao grande.

### O que funciona na Vercel sem mudancas grandes

- Projeto `pwa-rider` (Vite SPA):
  - `build`: `npm run build`
  - output: `dist`
- Consumir API externa via variavel `VITE_API_BASE_URL`.

### Bloqueadores do backend Laravel 4.2 na Vercel free

- Laravel antigo (`laravel/framework: 4.2.*`) em `composer.json`.
- Sessao em arquivo (`app/config/session.php`, driver `file`).
- Cache em arquivo (`app/config/cache.php`, driver `file`).
- Dependencia de escrita em disco (`storage`, uploads locais).
- Banco MySQL externo necessario (Vercel nao fornece MySQL nativo).
- Tarefas/rotinas de background e cron nao ficam naturais em serverless.
- App originalmente pensada para ambiente PHP stateful tradicional.

### Arquitetura recomendada para teste gratis

1. Subir **frontend** `pwa-rider` na Vercel.
2. Subir **backend Laravel** em host PHP tradicional (outro provedor).
3. Usar banco MySQL externo gratuito/baixo custo.
4. Configurar CORS para dominio da Vercel.

### Checklist de deploy rapido

#### Frontend (`pwa-rider`) na Vercel

- Root Directory: `pwa-rider`
- Build Command: `npm run build`
- Output Directory: `dist`
- Vars:
  - `VITE_API_BASE_URL=https://seu-backend`
  - `VITE_GOOGLE_MAPS_API_KEY=...` (se aplicavel)

#### Backend (fora da Vercel)

- Configurar:
  - `APP_URL`
  - `APP_KEY`
  - `APP_DEBUG=false` (em ambiente publico)
  - `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- Garantir permissao de escrita em `app/storage`.
- Ajustar CORS para chamadas do frontend hospedado.

