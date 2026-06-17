# 🚀 Guia de Setup - Laravel Uber Clone Local

## 📋 Requisitos

- **PHP**: 7.0+ (Recomendado 7.4 ou 8.0+) ✅ _Você tem PHP 8.4.7_
- **Composer**: ✅ _Você tem Composer 2.8.10_
- **MySQL/MariaDB**: 5.7+ (deve estar rodando localmente na porta 3306)
- **Extensões PHP necessárias**:
  - php-mysql ou php-pdo_mysql
  - php-mbstring
  - php-openssl
  - php-tokenizer
  - php-json

---

## 📦 Passo 1: Verificar Instalações

```powershell
# Verificar PHP
php -v

# Verificar Composer
composer --version

# Verificar MySQL (se instalado)
mysql --version

# Verificar se MySQL/MariaDB está rodando
# Para Windows: Services > procure "MySQL" ou "MariaDB"
```

**Caso MySQL não esteja instalado:**

- Baixe MariaDB (mais leve): https://mariadb.org/download/
- Ou MySQL: https://dev.mysql.com/downloads/mysql/

---

## 🗄️ Passo 2: Configurar Banco de Dados

O projeto espera:

- **Host**: `127.0.0.1`
- **Porta**: `3306`
- **Database**: `uberx`
- **Username**: `root`
- **Password**: (vazio)

### Via PowerShell (Automático):

```powershell
cd "d:\DOWNLOADS\Uber Clone 2025 PAGO\Ubers\Ubers\Uber1"
.\setup-database.ps1
```

### Via MySQL CLI (Manual):

```bash
mysql -u root -p

# No prompt MySQL:
CREATE DATABASE IF NOT EXISTS uberx DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE uberx;
SOURCE uberx.sql;
```

---

## 📦 Passo 3: Instalar Dependências

```powershell
cd "d:\DOWNLOADS\Uber Clone 2025 PAGO\Ubers\Ubers\Uber1"

# Instalar via Composer
composer install --no-scripts

# Se tiver problemas com versões antigas, use:
composer install --no-scripts --ignore-platform-reqs
```

---

## 🌱 Passo 4: Seed do Banco (Opcional)

```powershell
# Seed Admin
php scripts/seed-admin.php

# Seed Demo Users
php scripts/seed-demo-users.php
```

---

## ▶️ Passo 5: Rodar o Servidor Local

### Opção A: Script Automático (Recomendado)

```powershell
cd "d:\DOWNLOADS\Uber Clone 2025 PAGO\Ubers\Ubers\Uber1"
.\run-local.ps1
```

- Abre em: **http://localhost:8888**

### Opção B: Manualmente com PHP Built-in Server

```powershell
cd "d:\DOWNLOADS\Uber Clone 2025 PAGO\Ubers\Ubers\Uber1"
php -S localhost:8888 router.php
```

### Opção C: Com Apache/Nginx

- Configure o virtual host para apontar para a pasta raiz do projeto
- Certifique-se que o arquivo `public/` ou raiz está acessível

---

## 🔧 Configuração de Variáveis de Ambiente

Se precisar customizar, defina antes de rodar:

```powershell
$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = "3306"
$env:DB_DATABASE = "uberx"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = ""
$env:APP_URL = "http://localhost:8888"
$env:APP_DEBUG = "true"

.\run-local.ps1
```

---

## 📁 Estrutura do Projeto

```
Uber1/
├── app/                  # Lógica da aplicação
│   ├── controllers/      # Controladores
│   ├── models/          # Modelos
│   ├── views/           # Views (Blade templates)
│   ├── config/          # Configurações
│   └── database/        # Migrations & Seeds
├── public/              # Arquivos públicos
├── vendor/              # Dependências (Composer)
├── composer.json        # Dependências
├── artisan             # CLI tool
├── router.php          # Roteador para servidor embutido
└── uberx.sql           # Dump do banco
```

---

## 🐛 Troubleshooting

### Erro: SQLSTATE[2002] - Conexão recusada

```
❌ MySQL não está rodando
✅ Solução: Inicie MySQL/MariaDB
```

### Erro: Could not find package 'laravel/framework'

```
❌ Repositório do Composer desatualizado ou offline
✅ Solução: composer update ou rodar novamente
```

### Erro: Class 'PDO' not found

```
❌ Extensão PDO não instalada
✅ Solução: Habilite php-pdo_mysql no php.ini
```

### Porta 8888 já em uso

```powershell
# Usar outra porta:
php -S localhost:9000 router.php
```

---

## 🌐 Acessar a Aplicação

Após rodar com sucesso:

- **URL**: http://localhost:8888
- **Admin Panel**: http://localhost:8888/admin (ou verifique routes)
- **PWA (Rider)**: http://localhost:8888/pwa-rider (se configurado)

---

## 📚 Próximos Passos

1. Verifique credenciais de acesso no banco (tabela `admin` ou `users`)
2. Configure arquivos de pagamento se necessário (Stripe, Braintree, PayPal)
3. Teste APIs e funcionalidades principais
4. Configure variáveis de ambiente conforme necessário

---

## 📞 Recursos

- Laravel 4.2 Docs: https://laravel.com/docs/4.2
- PHP Manual: https://www.php.net/manual/
- MySQL: https://dev.mysql.com/doc/
