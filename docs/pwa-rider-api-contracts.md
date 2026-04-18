# PWA Rider API Contracts (Fase 1)

Base URL local: `http://localhost:8888`

## 1) Autenticação de passageiro

- **Endpoint**: `POST /user/login`
- **Controller**: `OwnerController@login`
- **Parâmetros (form-urlencoded)**:
  - `email` (required)
  - `password` (required)
  - `login_by=manual` (required)
  - `device_type=android|ios` (required)
  - `device_token` (required)
- **Resposta esperada**:
  - sucesso: `success=true`, `id`, `token`, `first_name`, `last_name`, `email`
  - erro: `success=false`, `error`, `error_code`

## 2) Criar corrida

- **Endpoint**: `POST /user/createrequest`
- **Controller**: `DogController@create_request`
- **Parâmetros (form-urlencoded)**:
  - `token` (required)
  - `id` (owner_id, required)
  - `latitude` (required)
  - `longitude` (required)
  - `d_latitude` (optional)
  - `d_longitude` (optional)
  - `type` (optional, service type)
  - `payment_mode` (optional)
  - `promo_code` (optional)
- **Resposta**:
  - sucesso: `success=true` e dados da request
  - erro: `success=false`, `error`, `error_code`

## 3) Buscar corrida em progresso

- **Endpoint**: `GET /user/requestinprogress`
- **Controller**: `DogController@request_in_progress`
- **Query params**:
  - `token`
  - `id`
- **Resposta**:
  - `success=true`
  - `request_id` (`-1` quando não há corrida ativa)

## 4) Ver detalhes/status da corrida

- **Endpoint**: `GET /user/getrequest`
- **Controller**: `DogController@get_request`
- **Query params**:
  - `token`
  - `id`
  - `request_id`
- **Resposta**:
  - `success=true`
  - campos de status (`is_cancelled`, `is_completed`, `is_started`, `is_walker_arrived`, `is_walker_started`, etc.)
  - dados do motorista quando confirmado

## 5) Cancelar corrida

- **Endpoint**: `POST /user/cancelrequest`
- **Controller**: `DogController@cancel_request`
- **Parâmetros (form-urlencoded)**:
  - `token`
  - `id`
  - `request_id`
- **Resposta**:
  - sucesso: `success=true`
  - erro: `success=false`, `error`, `error_code`

## Observações para frontend

- Os endpoints retornam HTTP `200` mesmo para erros de regra de negócio; validar sempre `success`.
- Enviar payload como `application/x-www-form-urlencoded`.
- Tratar `error_code` para mensagens de UI.
