# Script de Deploy para Cloudflare Workers
# Execute este script após configurar authentication, D1, R2 e secrets

Write-Host "🚀 Iniciando deploy para Cloudflare Workers..." -ForegroundColor Green

# Verificar se está autenticado
Write-Host "📋 Verificando autenticação..." -ForegroundColor Yellow
npx wrangler whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro: Não autenticado. Execute 'npx wrangler login' primeiro." -ForegroundColor Red
    exit 1
}

# Build do projeto
Write-Host "🔨 Fazendo build do projeto..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build. Verifique os erros acima." -ForegroundColor Red
    exit 1
}

# Deploy
Write-Host "🌐 Fazendo deploy..." -ForegroundColor Yellow
npx wrangler deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no deploy. Verifique os erros acima." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "🔗 Sua API está disponível em: https://api-cloudflare-restaurantes.seu-usuario.workers.dev" -ForegroundColor Cyan
Write-Host "📚 Swagger UI: https://api-cloudflare-restaurantes.seu-usuario.workers.dev/docs/ui" -ForegroundColor Cyan