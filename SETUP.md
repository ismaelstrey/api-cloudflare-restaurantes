# Configuração do Ambiente de Desenvolvimento

## Arquivos de Configuração

### 1. Arquivo .env

O arquivo `.env` foi criado com as configurações padrão para desenvolvimento local. Este arquivo contém:

- **JWT_SECRET**: Chave secreta para assinatura de tokens JWT
- **JWT_EXPIRES_IN**: Tempo de expiração dos tokens (padrão: 7 dias)
- **BCRYPT_ROUNDS**: Número de rounds para hash de senhas (padrão: 12)
- **MAX_FILE_SIZE**: Tamanho máximo de arquivos em bytes (padrão: 5MB)
- **ALLOWED_FILE_TYPES**: Tipos de arquivo permitidos para upload
- **RATE_LIMIT_WINDOW_MS**: Janela de tempo para rate limiting (15 minutos)
- **RATE_LIMIT_MAX_REQUESTS**: Máximo de requests por janela (100)
- **CORS_ORIGIN**: Origem permitida para CORS (padrão: *)
- **NODE_ENV**: Ambiente de execução (development)

### 2. Arquivo .env.example

Template com todas as variáveis necessárias. Use este arquivo como referência para criar seu próprio `.env`.

## Configuração para Produção

### Cloudflare Workers

Em produção, as variáveis de ambiente são gerenciadas através do `wrangler.jsonc`:

```json
{
  "vars": {
    "JWT_SECRET": "sua_chave_secreta_muito_segura",
    "JWT_EXPIRES_IN": "7d",
    // ... outras variáveis
  }
}
```

### Secrets (Dados Sensíveis)

Para dados sensíveis em produção, use o comando `wrangler secret`:

```bash
# Definir JWT_SECRET como secret
wrangler secret put JWT_SECRET

# Listar secrets
wrangler secret list
```

## Recursos Cloudflare

### D1 Database
- **Binding**: `DB`
- **Database Name**: `viandas-db`
- **Database ID**: `63dffc5e-6c5c-471f-84b2-207868703e50`

### R2 Bucket
- **Binding**: `IMAGES`
- **Bucket Name**: `viandas-imagens`

## Comandos Úteis

```bash
# Desenvolvimento local
npm run dev

# Deploy para produção
npm run deploy

# Gerar tipos do Wrangler
npm run cf-typegen

# Gerenciar banco de dados
npm run db:generate
npm run db:push
npm run db:migrate
```

## Segurança

⚠️ **IMPORTANTE**: 
- Nunca commite o arquivo `.env` com dados de produção
- Use secrets do Wrangler para dados sensíveis em produção
- Altere o `JWT_SECRET` para um valor seguro em produção
- Configure `CORS_ORIGIN` adequadamente para produção