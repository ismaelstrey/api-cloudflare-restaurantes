# ✅ Checklist de Deploy - API Cloudflare Restaurantes

## Pré-requisitos Concluídos

### ✅ 1. Configurações do Projeto
- [x] `wrangler.jsonc` atualizado para produção
- [x] JWT_SECRET removido das vars (deve ser secret)
- [x] NODE_ENV configurado para "production"
- [x] Bindings D1 e R2 configurados

### ✅ 2. Migrações do Banco de Dados
- [x] `001_init.sql` - Tabela pedidos com índices
- [x] `002.sql` - Tabela imagens
- [x] `003_usuarios.sql` - Tabela usuários com índices
- [x] `004_arquivos.sql` - Tabela arquivos com índices

### ✅ 3. Arquivos de Configuração
- [x] `cors-config.json` - Configuração CORS para R2
- [x] `deploy.ps1` - Script automatizado de deploy
- [x] `CLOUDFLARE_SETUP.md` - Guia completo de setup

## Próximos Passos (Execute na Ordem)

### 🔐 1. Autenticação
```bash
npx wrangler login
```

### 🗄️ 2. Criar e Configurar D1 Database
```bash
# Criar database
npx wrangler d1 create restaurantes-db

# Aplicar migrações
npx wrangler d1 execute restaurantes-db --file=./migrations/001_init.sql --remote
npx wrangler d1 execute restaurantes-db --file=./migrations/002.sql --remote
npx wrangler d1 execute restaurantes-db --file=./migrations/003_usuarios.sql --remote
npx wrangler d1 execute restaurantes-db --file=./migrations/004_arquivos.sql --remote
```

### 🪣 3. Criar R2 Bucket
```bash
# Criar bucket
npx wrangler r2 bucket create restaurantes-images

# Configurar CORS (opcional)
npx wrangler r2 bucket cors put restaurantes-images --file=cors-config.json
```

### 🔑 4. Configurar Secrets
```bash
# JWT Secret (obrigatório)
npx wrangler secret put JWT_SECRET
```

### 🚀 5. Deploy
```bash
# Opção 1: Script automatizado
.\deploy.ps1

# Opção 2: Manual
npm run build
npx wrangler deploy
```

## URLs Finais
Após o deploy, sua API estará em:
- **Base**: `https://api-cloudflare-restaurantes.SEU-USUARIO.workers.dev`
- **Swagger**: `https://api-cloudflare-restaurantes.SEU-USUARIO.workers.dev/docs/ui`
- **Health**: `https://api-cloudflare-restaurantes.SEU-USUARIO.workers.dev/health`

## Rotas Disponíveis
- `GET /health` - Status da API
- `GET /docs/ui` - Swagger UI
- `POST /api/v1/users/register` - Registro de usuário
- `POST /api/v1/users/login` - Login
- `GET /api/v1/users/profile` - Perfil do usuário
- `GET /api/v1/pedidos` - Listar pedidos
- `POST /api/v1/pedidos` - Criar pedido
- `GET /api/v1/pedidos/:id` - Obter pedido
- `PUT /api/v1/pedidos/:id` - Atualizar pedido
- `DELETE /api/v1/pedidos/:id` - Deletar pedido
- `POST /api/v1/files/upload` - Upload de arquivo
- `GET /api/v1/files/:id` - Obter arquivo

---

**🎉 Projeto pronto para Cloudflare Workers!**