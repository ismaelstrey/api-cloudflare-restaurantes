# Configuração do Projeto no Cloudflare Workers

Este guia irá ajudá-lo a configurar seu projeto para funcionar completamente no Cloudflare Workers.

## 1. Autenticação no Cloudflare

### Opção A: Login via Browser (Recomendado)
```bash
npx wrangler login
```

Se o navegador não abrir automaticamente, copie a URL que aparece no terminal e cole no seu navegador.

### Opção B: Token de API
1. Acesse: https://dash.cloudflare.com/profile/api-tokens
2. Clique em "Create Token"
3. Use o template "Custom token" com as seguintes permissões:
   - Account: Cloudflare Workers:Edit
   - Zone: Zone:Read
   - Zone: Zone Settings:Edit
   - Account: D1:Edit
   - Account: R2:Edit

4. Configure o token:
```bash
export CLOUDFLARE_API_TOKEN="seu_token_aqui"
# ou no Windows:
set CLOUDFLARE_API_TOKEN=seu_token_aqui
```

## 2. Configurar D1 Database

### Criar o Database
```bash
npx wrangler d1 create restaurantes-db
```

### Aplicar Migrações
```bash
# Aplicar migrações na ordem correta
npx wrangler d1 execute viandas-db --file=./migrations/001_init.sql --remote
npx wrangler d1 execute viandas-db --file=./migrations/002.sql --remote
npx wrangler d1 execute viandas-db --file=./migrations/003_usuarios.sql --remote
npx wrangler d1 execute viandas-db --file=./migrations/004_arquivos.sql --remote

# Verificar se as tabelas foram criadas
npx wrangler d1 execute restaurantes-db --command=".tables" --remote
```

### Verificar Database
```bash
npx wrangler d1 list
npx wrangler d1 info viandas-db
```

## 3. Configurar R2 Bucket

### Criar o Bucket
```bash
# Criar bucket R2 para armazenamento de imagens
npx wrangler r2 bucket create viandas-imagens

# Verificar se o bucket foi criado
npx wrangler r2 bucket list

# Configurar CORS para o bucket (opcional, para acesso direto)
npx wrangler r2 bucket cors put viandas-imagens --file=cors-config.json
```

#### Arquivo cors-config.json (opcional)
Crie um arquivo `cors-config.json` na raiz do projeto se precisar de acesso direto às imagens:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## 4. Configurar Secrets de Produção

Os secrets são variáveis sensíveis que não devem estar no código. Configure-os usando:

### JWT Secret (OBRIGATÓRIO)
```bash
# JWT_SECRET - Chave secreta para tokens JWT (use uma string aleatória forte)
npx wrangler secret put JWT_SECRET
# Exemplo de valor: "sua_chave_jwt_super_secreta_aqui_com_pelo_menos_32_caracteres"
```

#### Gerando um JWT_SECRET seguro
Você pode gerar uma chave segura usando:

```bash
# No Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Ou online em: https://generate-secret.vercel.app/64
```

### Outros Secrets (Opcionais)
```bash
# Se você quiser usar secrets ao invés de vars
npx wrangler secret put BCRYPT_ROUNDS
npx wrangler secret put MAX_FILE_SIZE

# Se houver outros secrets necessários, adicione aqui
# npx wrangler secret put OUTRO_SECRET
```

#### Verificar secrets configurados
```bash
npx wrangler secret list
```

## 5. Atualizar wrangler.jsonc

Verifique se o `wrangler.jsonc` está configurado corretamente:

```json
{
  "name": "meu-backend",
  "main": "src/index.ts",
  "compatibility_date": "2025-08-21",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "viandas-db",
      "database_id": "SEU_DATABASE_ID_AQUI"
    }
  ],
  "r2_buckets": [
    {
      "binding": "IMAGES",
      "bucket_name": "viandas-imagens"
    }
  ],
  "vars": {
    "JWT_EXPIRES_IN": "7d",
    "BCRYPT_ROUNDS": "12",
    "MAX_FILE_SIZE": "5242880",
    "ALLOWED_FILE_TYPES": "image/jpeg,image/png,image/webp,image/gif",
    "RATE_LIMIT_WINDOW_MS": "900000",
    "RATE_LIMIT_MAX_REQUESTS": "100",
    "CORS_ORIGIN": "*",
    "NODE_ENV": "production"
  }
}
```

## 6. Deploy para Produção

#### Opção 1: Script Automatizado (Recomendado)
```bash
# Execute o script de deploy
.\deploy.ps1
```

#### Opção 2: Deploy Manual
```bash
# Build do projeto
npm run build

# Deploy para Cloudflare Workers
npx wrangler deploy

# Verificar status do deploy
npx wrangler deployments list
```

#### Após o Deploy
Sua API estará disponível em:
- **API Base**: `https://api-cloudflare-restaurantes.SEU-USUARIO.workers.dev`
- **Swagger UI**: `https://api-cloudflare-restaurantes.SEU-USUARIO.workers.dev/docs/ui`
- **Health Check**: `https://api-cloudflare-restaurantes.SEU-USUARIO.workers.dev/health`

### Deploy com Logs
```bash
npx wrangler deploy --verbose
```

## 7. Verificar Deploy

### Testar Health Check
```bash
curl https://meu-backend.SEU_SUBDOMINIO.workers.dev/
```

### Testar Swagger UI
```bash
# Abra no navegador:
https://meu-backend.SEU_SUBDOMINIO.workers.dev/docs/ui
```

### Ver Logs em Tempo Real
```bash
npx wrangler tail
```

## 8. Comandos Úteis

### Desenvolvimento
```bash
# Rodar localmente
npm run dev

# Gerar tipos
npm run cf-typegen

# Aplicar migrações locais
npm run db:push
```

### Produção
```bash
# Deploy
npm run deploy

# Ver logs
npx wrangler tail

# Executar comandos no D1
npx wrangler d1 execute viandas-db --command="SELECT * FROM users LIMIT 5"
```

## 9. Troubleshooting

### Erro de Autenticação
```bash
npx wrangler whoami
# Se não autenticado, faça login novamente
npx wrangler login
```

### Erro de Database
```bash
# Verificar se o database existe
npx wrangler d1 list

# Verificar migrações
npx wrangler d1 migrations list viandas-db
```

### Erro de R2
```bash
# Verificar buckets
npx wrangler r2 bucket list

# Testar upload
npx wrangler r2 object put viandas-imagens/test.txt --file=README.md
```

## 10. Segurança em Produção

1. **Altere o JWT_SECRET** para um valor seguro
2. **Configure CORS_ORIGIN** para seus domínios específicos
3. **Use HTTPS** sempre
4. **Monitore os logs** regularmente
5. **Configure rate limiting** adequadamente

## 11. Monitoramento

### Dashboard do Cloudflare
- Acesse: https://dash.cloudflare.com/
- Vá para Workers & Pages > Seu Worker
- Monitore métricas, logs e erros

### Alertas
Configure alertas no dashboard para:
- Erros 5xx
- Alto uso de CPU
- Muitas requisições

---

**Próximos Passos:**
1. Faça login no Cloudflare: `npx wrangler login`
2. Execute os comandos de configuração acima
3. Faça o deploy: `npm run deploy`
4. Teste sua API em produção

**Suporte:**
- Documentação: https://developers.cloudflare.com/workers/
- Discord: https://discord.cloudflare.com/