# Deploy Hostinger — Chama / RideHub

Documentação para publicação após validação E2E local.

## Pré-requisitos

- PHP 8+ com extensões: `pdo_mysql`, `mbstring`, `openssl`, `json`, `curl`
- MySQL 5.7+ / MariaDB
- Node.js 18+ (build dos PWAs na máquina de deploy ou CI)
- Certificado SSL (HTTPS obrigatório para geolocalização e PWA)

## Checklist E2E local (antes do deploy)

1. Passageiro solicita corrida → valor confere com tarifas do admin (Settings → Tarifas/KM)
2. Motorista online (aprovado + `walker_services`) vê pedido em ≤ 5s
3. Aceite → modal no passageiro com motorista/valor
4. Conclusão → histórico e carteira atualizados

## Estrutura no servidor

| Item | Ação |
|------|------|
| Document root | Apontar para `public/` do Laravel |
| Código | Upload do projeto (sem `node_modules`, com `vendor/`) |
| PWAs | `npm run build` em `pwa-rider` e `pwa-motoristas`; servir via `router.php` em `/pwa-rider/` e `/pwa-motoristas/` |
| `.env` | Copiar de `.env.example` e configurar abaixo |

## Variáveis de ambiente

```env
APP_URL=https://seudominio.com
APP_DEBUG=false
DB_HOST=localhost
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...
CHAMA_RIDER_APP_URL=https://seudominio.com/pwa-rider
CHAMA_DRIVER_APP_URL=https://seudominio.com/pwa-motoristas
```

## Banco de dados

1. Criar base MySQL no painel Hostinger
2. Importar `uberx.sql` (schema base)
3. Executar scripts locais equivalentes: `setup-database.ps1` / seed de demo se necessário
4. Tabelas extras (`chama_ride_meta`, `wallet_transactions`, etc.) são criadas automaticamente no primeiro request via `chama_ensure_ride_wallet_tables()`

## Cron — rotação de motoristas / timeout

Agendar no painel Hostinger (a cada 1 minuto):

```bash
curl -s https://seudominio.com/server/schedulerequest > /dev/null
```

Localmente, `run-local.ps1` inicia um job em background que chama o mesmo endpoint a cada 30s.

## Build dos PWAs

```bash
cd pwa-rider && npm ci && npm run build
cd ../pwa-motoristas && npm ci && npm run build
```

Os artefatos ficam em `pwa-rider/dist` e `pwa-motoristas/dist`.

## Permissões

- `app/storage` e `bootstrap/cache` graváveis pelo PHP
- `public/uploads` se usar logos customizados

## SSL e PWA

- Forçar HTTPS no `.htaccess` ou painel Hostinger
- Web Push (opcional): configurar VAPID keys em produção no config `webpush`

## Pós-deploy

1. Login admin: `/admin/login`
2. Aprovar motoristas em **Motoristas**
3. Configurar tarifas em **Settings / Tarifas**
4. Testar portal: `/` → links passageiro e motorista
