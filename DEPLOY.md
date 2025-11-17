# 🚀 Guia de Deploy - Studio Milca Fotografia

## 📋 Fase 1: Deploy Gratuito no Render

Este guia vai te ajudar a colocar o projeto no ar **gratuitamente** usando o Render.

---

## ✅ Pré-requisitos

Antes de começar, você precisa ter:

1. ✅ Conta no GitHub
2. ✅ Repositório do projeto no GitHub
3. ✅ Conta no Render (criar em [render.com](https://render.com))
4. ✅ Credenciais necessárias:
   - Google Drive API Key (ou Client ID)
   - Mercado Pago Access Token
   - Manus OAuth Portal URL e App ID

---

## 📦 Passo 1: Instalar Dependências Localmente

Primeiro, vamos garantir que tudo funciona localmente:

```powershell
# Instalar dependências
pnpm install

# Verificar se o código compila
pnpm run check

# Testar build
pnpm run build
```

**Se houver erros de compilação, me avise antes de continuar!**

---

## 🔧 Passo 2: Preparar Variáveis de Ambiente

Crie um arquivo `.env.local` (não commitar!) com suas credenciais:

```bash
# Database (será fornecido pelo Render)
DATABASE_URL=postgresql://usuario:senha@host:5432/database

# Autenticação OAuth (Manus)
VITE_OAUTH_PORTAL_URL=https://seu-portal-oauth.com
VITE_APP_ID=seu-app-id
OWNER_OPEN_ID=seu-openid-admin

# Google Drive
GOOGLE_DRIVE_API_KEY=sua-api-key
GOOGLE_CLIENT_ID=seu-client-id

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=seu-access-token

# Ambiente
NODE_ENV=production
```

---

## 📤 Passo 3: Commit e Push para o GitHub

```powershell
# Adicionar todos os arquivos
git add .

# Commit das mudanças
git commit -m "Preparar projeto para deploy no Render (PostgreSQL)"

# Push para o GitHub
git push origin main
```

---

## 🎯 Passo 4: Configurar Render

### 4.1. Criar Conta no Render

1. Acesse [render.com](https://render.com)
2. Clique em **"Get Started for Free"**
3. Conecte sua conta do GitHub

### 4.2. Criar PostgreSQL Database

1. No Dashboard do Render, clique em **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `studio-milca-db`
   - **Database**: `studio_milca`
   - **User**: `studio_milca_user`
   - **Region**: `Oregon (US West)` (grátis)
   - **Plan**: **Free**
3. Clique em **"Create Database"**
4. ⚠️ **IMPORTANTE**: Copie a **Internal Database URL** (vamos usar em breve)

---

### 4.3. Criar Web Service (Backend)

1. Clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub
3. Configure:
   - **Name**: `studio-milca-backend`
   - **Region**: `Oregon (US West)`
   - **Branch**: `main`
   - **Root Directory**: (deixe vazio)
   - **Runtime**: `Node`
   - **Build Command**: 
     ```
     pnpm install && pnpm run build
     ```
   - **Start Command**: 
     ```
     pnpm start
     ```
   - **Plan**: **Free**

4. **Environment Variables** (clique em "Advanced" e adicione):

```
NODE_ENV=production
DATABASE_URL=[cole a Internal Database URL do passo 4.2]
GOOGLE_DRIVE_API_KEY=[sua key]
GOOGLE_CLIENT_ID=[seu client id]
MERCADO_PAGO_ACCESS_TOKEN=[seu token]
VITE_OAUTH_PORTAL_URL=[sua url oauth]
VITE_APP_ID=[seu app id]
OWNER_OPEN_ID=[seu openid admin]
```

5. Clique em **"Create Web Service"**

⏳ **Aguarde o deploy** (pode levar 5-10 minutos na primeira vez)

---

### 4.4. Criar Static Site (Frontend)

1. Clique em **"New +"** → **"Static Site"**
2. Conecte o mesmo repositório
3. Configure:
   - **Name**: `studio-milca-frontend`
   - **Branch**: `main`
   - **Build Command**: 
     ```
     cd client && pnpm install && pnpm run build
     ```
   - **Publish Directory**: 
     ```
     client/dist
     ```

4. **Environment Variables**:

```
VITE_API_URL=https://studio-milca-backend.onrender.com
VITE_OAUTH_PORTAL_URL=[sua url oauth]
VITE_APP_ID=[seu app id]
```

⚠️ **Substitua** `studio-milca-backend` pelo nome real do seu backend service!

5. Clique em **"Create Static Site"**

---

## 🗄️ Passo 5: Rodar Migrations do Banco

Após o backend estar rodando:

1. No Render, acesse seu **Web Service (Backend)**
2. Clique em **"Shell"** (no menu lateral)
3. Execute:

```bash
pnpm run db:push
```

Isso vai criar todas as tabelas no PostgreSQL.

---

## ✅ Passo 6: Testar a Aplicação

1. **Frontend URL**: `https://studio-milca-frontend.onrender.com`
2. **Backend URL**: `https://studio-milca-backend.onrender.com`

### Testes Essenciais:

- ✅ Landing page carrega
- ✅ Login OAuth funciona
- ✅ Admin consegue criar cliente
- ✅ Cliente consegue vincular conta
- ✅ Galeria de fotos funciona
- ✅ Carrinho funciona
- ✅ Pagamento PIX funciona

---

## ⚠️ Limitações do Plano Grátis

### Sleep após Inatividade
- Backend "dorme" após **15 minutos** sem requisições
- Primeiro acesso após sleep: **lento** (~30s)
- ✅ **Solução**: Usar um "pinger" gratuito como [UptimeRobot](https://uptimerobot.com)

### PostgreSQL Free
- **90 dias grátis**, depois **$7/mês**
- **1GB** de storage
- ✅ Suficiente para validação inicial

---

## 🔧 Troubleshooting

### ❌ Build falha no Render

**Erro comum**: `pnpm: command not found`

**Solução**: Adicionar no `package.json`:

```json
"engines": {
  "node": ">=18.0.0",
  "pnpm": ">=8.0.0"
}
```

### ❌ Database connection failed

Verifique:
1. `DATABASE_URL` está correta (Internal URL, não External)
2. Database foi criado no Render
3. Migrations foram rodadas (`pnpm run db:push`)

### ❌ Frontend não conecta no Backend

Verifique:
1. `VITE_API_URL` aponta para URL correta do backend
2. Backend está rodando (status "Live" no Render)
3. CORS está configurado (já está no código)

---

## 📊 Monitoramento

### Render Dashboard

- **Logs**: Clique no service → "Logs" para ver erros
- **Metrics**: Veja uso de CPU, memória e requisições
- **Events**: Histórico de deploys

### Verificar se está tudo OK:

```bash
# Backend health check
curl https://studio-milca-backend.onrender.com/api/health

# Frontend carregando
curl https://studio-milca-frontend.onrender.com
```

---

## 🚀 Próximos Passos

Após validar que tudo funciona:

1. ✅ Testar com clientes reais
2. ✅ Coletar feedback
3. ✅ Monitorar performance
4. ✅ Avaliar migração para **Fase 2** (Vercel + Railway + OneDrive)

---

## 💰 Estimativa de Custos

### Fase 1 (Render - Atual)
- **Primeiros 90 dias**: R$ 0,00
- **Após 90 dias**: ~R$ 35/mês (apenas PostgreSQL)

### Fase 2 (Produção Escalável)
- **Custo**: ~R$ 25-50/mês
- **Quando migrar**: 10+ clientes ativos

---

## 📞 Suporte

Se encontrar qualquer problema durante o deploy, **me avise** com:

1. Print do erro
2. Logs do Render
3. Passo onde travou

Estou aqui para ajudar! 🚀
