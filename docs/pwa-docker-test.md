# Testar o PWA com dois servidores (Docker web + Vite)

Arquitetura em desenvolvimento:

| Servidor | Porta | O quê |
|----------|-------|--------|
| Docker `web` | **8080** | Laravel (Apache/PHP) — mesmo código que o clone “tipo Uber” |
| Docker `db` | **3307** | MySQL 5.7 |
| Vite (PWA) | **5173** | Interface React; faz **proxy** de `/user`, `/provider`, `/server` para o alvo em `VITE_PROXY_TARGET` |

## Checklist visual (fluxo passageiro)

1. **Docker** a correr: abre `http://localhost:8080` e confirma que a página principal ou login web responde (não “connection refused”).
2. **Vite** no `pwa-rider`: abre `http://localhost:5173` — fundo escuro Chama, logo no login.
3. **Rodapé dev** (só em `npm run dev`): deve mostrar `Dev — proxy Laravel: …` com o URL configurado em `VITE_PROXY_TARGET`.
4. **Login** no PWA com passageiro de seed (ex.: `passageiro@demo.local` / `Admin123!`) — após sucesso vês cabeçalho com nome e **Sair**.
5. **Pedir corrida**: “Usar a minha localização”, opcionalmente destino, **Confirmar pedido** — em caso de erro de API aparece mensagem clara (não só falha de rede genérica).
6. **Estado**: timeline em PT-BR; **Cancelar** mostra erro legível se o backend devolver `success: false`.

## Pré-requisitos

1. **Docker Desktop** a correr.
2. **Node.js** (`npm`).

## Atalho: dois terminais de uma vez (no teu PC)

Na raiz do projeto:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-web-and-pwa.ps1
```

Abre automaticamente **dois** PowerShells: um com `docker compose up --build` (web + db) e outro com `npm run dev` no `pwa-rider`.

## Terminal 1 — aplicação web no Docker

Na raiz do projeto (`Uber1`):

```powershell
powershell -ExecutionPolicy Bypass -File .\run-docker-stack.ps1
```

- Sobe **web** + **db** em segundo plano.
- Site/API: **http://localhost:8080**

Se quiseres ver logs do Apache no mesmo terminal (bloqueia até Ctrl+C):

```powershell
powershell -ExecutionPolicy Bypass -File .\run-docker-stack-foreground.ps1
```

Ou manualmente:

```powershell
docker compose up --build
```

## Terminal 2 — PWA (Vite)

```powershell
cd pwa-rider
npm install
npm run dev
```

Abre **http://localhost:5173**.

O ficheiro [pwa-rider/.env.development](pwa-rider/.env.development) define `VITE_PROXY_TARGET=http://localhost:8080` para o proxy bater no container `web`. Se usares só `run-local.ps1` na **8888**, altera para:

```text
VITE_PROXY_TARGET=http://localhost:8888
```

Reinicia o `npm run dev` depois de mudar o `.env.development`.

## Troubleshooting (proxy 8080 / 8888)

| Sintoma | O que verificar |
|---------|------------------|
| “Sem ligação ao servidor” ou `Failed to fetch` no PWA | Laravel a correr na mesma porta que `VITE_PROXY_TARGET` (8080 Docker vs 8888 PHP built-in). Confirma no browser `http://localhost:8080` ou `http://localhost:8888`. |
| HTTP 404 em `/user/login` | O Vite só faz proxy dos prefixos configurados em [pwa-rider/vite.config.ts](pwa-rider/vite.config.ts); não abras o PWA por `file://`. Usa sempre `http://localhost:5173`. |
| Login devolve JSON com `success: false` | Credenciais ou conta; o PWA mostra o campo `error` devolvido pela API. |
| Rodapé dev mostra URL errado | Edita `VITE_PROXY_TARGET` em `.env.development` e reinicia o Vite. |

## Credenciais / dados

- Opcional: com a BD a correr, na raiz: `php scripts/seed-demo-users.php` (ajusta `DB_HOST`/`DB_PORT` se necessário; com Docker costuma ser `127.0.0.1` e `3307`, user `uberx`, pass `uberx_local`).
- No PWA, login de passageiro (ex. seed): `passageiro@demo.local` / `Admin123!`.

## Teste rápido da API (sem browser)

Com o **web** no ar:

```powershell
$env:API_BASE = "http://localhost:8080"
powershell -ExecutionPolicy Bypass -File .\scripts\test-pwa-integration.ps1
```

## Build estático do PWA

Se o PWA for servido noutro host sem proxy, define a API completa antes do build:

```text
VITE_API_BASE_URL=http://localhost:8080
```

## Nota (Cursor / agente remoto)

O ambiente do assistente pode não ter acesso ao Docker Desktop da tua máquina. Nesse caso corre os comandos **no teu PowerShell local**.
