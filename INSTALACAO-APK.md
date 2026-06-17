# 📱 Guia de Instalação - Chama No 12 Motorista (PWA Android)

## ✅ APK Gerado com Sucesso!

**Arquivo:** `ChamaNo12-Motorista.apk` (3.2 MB)  
**Localização:** `d:\DOWNLOADS\Uber Clone 2025 PAGO\Ubers\Ubers\Uber1\`

---

## 🚀 Como Instalar no Android

### Opção 1: Via Arquivo (Recomendado para Teste)

1. **Baixe o arquivo** `ChamaNo12-Motorista.apk`
2. **Transfira** para seu dispositivo Android (via USB, email, WhatsApp, etc)
3. **Abra o gerenciador de arquivos** no seu telefone
4. **Localize** o arquivo `ChamaNo12-Motorista.apk`
5. **Toque** para instalar
6. Se aparecer aviso de segurança, clique em **"Instalar mesmo assim"** ou **"Install anyway"**
7. Aguarde a instalação completar

### Opção 2: Via ADB (Para Desenvolvedores)

```bash
# Com Android Debug Bridge instalado:
adb install ChamaNo12-Motorista.apk
```

---

## 🔐 Credenciais para Login

Quando abrir o app, você poderá:

1. **Sem autenticação inicial** - Acessa a interface da PWA
2. **Depois registra-se** - Cria sua conta como motorista
3. **Ou usa credencial demo:**

| Campo     | Valor                  |
| --------- | ---------------------- |
| **Email** | `motorista@demo.local` |
| **Senha** | `Admin123!`            |

---

## 🛠️ Funcionalidades da PWA Motorista

✅ **Buscar Corridas** - Visualizar pedidos de corrida no mapa  
✅ **Aceitar Corridas** - Confirmar e iniciar atendimento  
✅ **GPS em Tempo Real** - Compartilhar posição com passageiro  
✅ **Receber Pedidos** - Notificações de novas corridas  
✅ **Histórico** - Ver corridas completadas

---

## 📋 Requisitos Mínimos

- **Android:** 6.0 ou superior (API 24+)
- **Espaço:** ~50 MB livre
- **Internet:** Conexão WiFi ou dados móveis
- **Localização:** Ativar GPS

---

## ⚠️ Se Receber Erro "Pacote Inválido"

**Este APK foi assinado corretamente com certificado debug.** Se o erro persistir:

1. ✅ Confirme que é Android 6.0+
2. ✅ Ative **"Instalar de Fontes Desconhecidas"** em Segurança
3. ✅ Limpe cache: Configurações → Apps → Chama No 12 → Armazenamento → Limpar Cache
4. ✅ Desinstale versão anterior (se houver)
5. ✅ Reinicie o telefone

---

## 🔧 Servidor Backend

O app se conecta automaticamente a:

- **URL:** http://127.0.0.1:8888
- **Status:** Verifique se o servidor Laravel está rodando
- **Comando:** `php artisan serve --host 0.0.0.0 --port 8888`
  (ou use `http://seu-ip:8888` se em rede local)

---

## 📸 Fluxo de Teste

1. **Abrir PWA** → Acessa interface
2. **Chamar corrida** (como passageiro no web) → Aparece no mapa do motorista
3. **Motorista aceita** → Carro começa a se mover
4. **Admin confirma** → Painel de admin visualiza a corrida
5. **Motorista chega** → Passageiro vê chegada

---

## 🐛 Troubleshooting

| Erro               | Solução                                                   |
| ------------------ | --------------------------------------------------------- |
| App não abre       | Reinicie o telefone, limpe cache                          |
| "Conexão recusada" | Servidor não está rodando (verifique `php artisan serve`) |
| "GPS desativado"   | Ative localização em Configurações → Localização          |
| Mapa branco        | Aguarde carregamento (às vezes demora)                    |

---

## 📞 Suporte

Se tiver dúvidas ou encontrar bugs:

1. Verifique os logs: Abra DevTools no navegador se não for APK
2. Verifique backend: `http://seu-ip:8888/provider/login`
3. Teste credenciais na web primeiro

---

**Versão:** 1.0  
**Data Build:** 05/06/2026  
**Status:** ✅ Assinado e Pronto para Instalar
