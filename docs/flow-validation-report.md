# Validação do fluxo atual (passageiro -> motorista)

Data: 2026-04-18

## Resultado

- **Status**: bloqueado por infraestrutura local (sem MySQL e sem Docker daemon ativo).
- **Impacto**: não foi possível executar validação ponta a ponta real no browser.

## Evidências de bloqueio

- `scripts/check-db-connection.php`:
  - porta `3306` fechada
  - porta `3307` fechada
  - erro `SQLSTATE[HY000] [2002]` (conexão recusada)
- `run-local.ps1`:
  - falha ao subir aplicação por indisponibilidade da base
- `run-local-docker.ps1`:
  - Docker daemon indisponível (`dockerDesktopLinuxEngine` não encontrado)

## Validação estrutural (código)

Mesmo sem runtime, o fluxo está implementado no backend:

- Solicitação do passageiro:
  - `POST /user/createrequest` -> `DogController@create_request`
- Consulta de corrida em andamento:
  - `GET /user/requestinprogress` -> `DogController@request_in_progress`
- Status da corrida:
  - `GET /user/getrequest` -> `DogController@get_request`
- Cancelamento:
  - `POST /user/cancelrequest` -> `DogController@cancel_request`
- Motorista recebe/aceita:
  - `GET /provider/getrequests`, `POST /provider/respondrequest`, e progressão de estados em `WalkerController`

## Gaps e próximos passos

1. Levantar dependências locais:
   - iniciar MySQL local (3306) **ou** Docker daemon + DB em 3307.
2. Reexecutar teste manual E2E:
   - login passageiro -> pedir corrida -> motorista aceitar -> concluir -> cancelar cenário alternativo.
3. Adicionar automação E2E após ambiente estável (Playwright/Cypress).
