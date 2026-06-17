# 📊 Análise do Projeto - TaxiNox (Uber Clone)

## ✅ Verificação Realizada

### Ambiente

- ✅ **PHP**: 8.4.7 CLI (com Zend Engine 4.4.7) - **OK**
- ✅ **Composer**: 2.8.10 - **OK**
- ✅ **Framework**: Laravel 4.2 - Identificado
- ⚠️ **MySQL/MariaDB**: Necessário ter rodando localmente

### Projeto

- ✅ **Composer.json**: Presente com todas as dependências
- ✅ **Banco de Dados**: uberx.sql (dump incluído)
- ✅ **Scripts de Setup**: Presentes e configurados
- ✅ **PWA (Rider App)**: Incluído em `/pwa-rider` (TypeScript/Vite)

---

## 📦 Dependências Principais

```json
{
  "laravel/framework": "4.2.*",
  "aws/aws-sdk-php-laravel": "1.*",
  "stripe/stripe-php": "1.*",
  "twilio/sdk": "dev-master",
  "braintree/braintree_php": "2.34.0",
  "davibennun/laravel-push-notification": "dev-master",
  "paypal/rest-api-sdk-php": "*",
  "intervention/image": "~2.1"
}
```

### Ferramentas de Testes Incluídas

- Behat 3.0 (BDD)
- PHPUnit 4.6
- PHPSpec 2.1
- Mink (Selenium2, Goutte)

---

## 🎯 Funcionalidades da Aplicação

Baseado no readme e estrutura:

1. **COD (Cash on Delivery)**: Modo de pagamento em dinheiro
2. **Stripe & Braintree**: Integração de pagamentos
3. **PayPal Adaptive Payment**: Sistema de pagamentos
4. **Calculadora de Tarifa**: Cálculo automático de preços
5. **Promo Codes**: Sistema de cupons
6. **TimeZone**: Suporte a múltiplos fusos horários
7. **Admin Panel**: Painel administrativo (v1.1+)
8. **Push Notifications**: Notificações via GCM/iOS
9. **PWA Rider App**: Aplicação Progressive Web App para motoristas

---

## 🗂️ Estrutura de Diretórios

```
Uber1/
├── app/
│   ├── controllers/        # Controladores Laravel
│   ├── models/             # Modelos Eloquent
│   ├── views/              # Templates Blade
│   ├── config/             # Configurações
│   ├── commands/           # Comandos Artisan
│   ├── database/           # Migrations & Seeds
│   ├── filters.php         # Filtros HTTP
│   ├── routes.php          # Rotas da aplicação
│   ├── helper.php          # Funções auxiliares
│   ├── gcm/                # Google Cloud Messaging
│   └── ios_push/           # Push Notifications iOS
├── pwa-rider/              # Aplicação Rider (TypeScript/Vite)
│   ├── src/                # Código-fonte
│   ├── public/             # Arquivos estáticos
│   ├── package.json        # Dependências Node.js
│   ├── tsconfig.json       # Configuração TypeScript
│   └── vite.config.ts      # Configuração Vite
├── public/                 # Assets públicos
│   ├── css/                # Stylesheets
│   ├── js/                 # JavaScript
│   └── img/                # Imagens
├── bootstrap/              # Bootstrap da aplicação
├── vendor/                 # Dependências Composer
├── docker/                 # Configuração Docker
├── scripts/                # Scripts de setup
├── uberx.sql               # Dump do banco
├── artisan                 # CLI Tool
├── router.php              # Roteador para servidor embutido
└── composer.json           # Dependências PHP
```

---

## 🚀 Checklist de Setup Rápido

- [ ] **1. Verificar MySQL/MariaDB**
  - [ ] Instalado e rodando na porta 3306
  - [ ] Usuário `root` com acesso local

- [ ] **2. Instalar Dependências**

  ```powershell
  composer install --no-scripts
  ```

- [ ] **3. Configurar Banco**

  ```powershell
  .\setup-database.ps1
  ```

- [ ] **4. Seeds (Opcional)**

  ```powershell
  php scripts/seed-admin.php
  php scripts/seed-demo-users.php
  ```

- [ ] **5. Rodar Servidor**
  ```powershell
  .\run-local.ps1
  ```
  Acesse: **http://localhost:8888**

---

## 🔗 URLs da Aplicação

| Recurso     | URL                               | Tipo |
| ----------- | --------------------------------- | ---- |
| Principal   | `http://localhost:8888`           | Web  |
| Admin Panel | `http://localhost:8888/admin`     | Web  |
| API v1      | `http://localhost:8888/api/v1/*`  | REST |
| PWA Rider   | `http://localhost:8888/pwa-rider` | PWA  |
| Docs        | Veja `/docs` no projeto           | Docs |

---

## ⚙️ Variáveis de Ambiente

```powershell
# Definidas automaticamente pelo run-local.ps1
$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = "3306"
$env:DB_DATABASE = "uberx"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = ""
$env:APP_URL = "http://localhost:8888"
$env:APP_DEBUG = "true"
```

---

## 🔐 Dados de Acesso (Padrão)

Após seed:

- **Usuário Admin**: Consultado em `scripts/seed-admin.php`
- **Usuários Demo**: Consultados em `scripts/seed-demo-users.php`

---

## 📝 Notas Importantes

1. **Laravel 4.2 é antigo** (2014) - Alguns pacotes podem ter issues com PHP 8.4
   - Use `--ignore-platform-reqs` se necessário:

   ```
   composer install --no-scripts --ignore-platform-reqs
   ```

2. **Servidor Embutido**: Perfeito para desenvolvimento
   - Não use em produção
   - Máximo de 1-2 requisições simultâneas

3. **PWA Rider**: Aplicação separada em TypeScript/Vite
   - Precisa de Node.js para desenvolvimento
   - Build: `npm run build` em `/pwa-rider`

4. **Database Migrations**: Projeto antigo, cheque se usa ou direto SQL
   - Artisan commands: `php artisan migrate` (se disponível)

---

## 🐛 Possíveis Issues e Soluções

| Issue           | Causa                       | Solução                 |
| --------------- | --------------------------- | ----------------------- |
| SQLSTATE[2002]  | MySQL não rodando           | Inicie MySQL/MariaDB    |
| Class not found | Dependências não instaladas | `composer install`      |
| PDO error       | Extensão PDO não habilitada | Habilitar em php.ini    |
| Porta em uso    | Porta 8888 ocupada          | Use outra porta         |
| Permissões      | Pasta storage sem permissão | `chmod 777 app/storage` |

---

## 📚 Documentação Útil

- [Laravel 4.2 Docs](https://laravel.com/docs/4.2)
- [PHP 8.4 Manual](https://www.php.net/manual/)
- [MySQL Docs](https://dev.mysql.com/doc/)
- [Vite Docs](https://vitejs.dev/) (para PWA)
