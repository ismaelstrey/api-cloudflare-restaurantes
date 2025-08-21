# API de Viandas - Sistema de Pedidos

API profissional para gerenciamento de pedidos de viandas com autenticação JWT, upload de arquivos e sistema completo de CRUD.

## 🚀 Tecnologias Utilizadas

- **Framework**: Hono.js (otimizado para Cloudflare Workers)
- **Linguagem**: TypeScript
- **ORM**: Prisma com D1 Database
- **Autenticação**: JWT + bcrypt
- **Documentação**: Swagger/OpenAPI 3.0
- **Storage**: Cloudflare R2
- **Validação**: Zod
- **Gerenciador de Dependências**: pnpm

## 📁 Estrutura do Projeto

```
src/
├── controllers/          # Controladores da aplicação
│   ├── pedidoController.ts
│   ├── userController.ts
│   └── fileController.ts
├── routes/              # Definição das rotas
│   ├── pedidoRoutes.ts
│   ├── userRoutes.ts
│   └── fileRoutes.ts
├── services/            # Lógica de negócio
│   ├── pedidoService.ts
│   ├── userService.ts
│   └── fileService.ts
├── repositories/        # Camada de acesso aos dados
│   ├── pedidoRepository.ts
│   └── userRepository.ts
├── middlewares/         # Middlewares de segurança e validação
│   ├── securityMiddleware.ts
│   └── authMiddleware.ts
├── validators/          # Schemas de validação Zod
│   ├── pedidoValidator.ts
│   └── userValidator.ts
├── utils/              # Utilitários
│   ├── database.ts
│   ├── hashUtils.ts
│   └── jwtUtils.ts
├── docs/               # Documentação Swagger
│   └── swagger.ts
├── types/              # Definições de tipos TypeScript
│   └── index.ts
└── index.ts            # Arquivo principal da aplicação
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="seu-jwt-secret-super-seguro"
JWT_EXPIRES_IN="7d"

# Cloudflare (para produção)
CLOUDFLARE_ACCOUNT_ID="seu-account-id"
CLOUDFLARE_API_TOKEN="seu-api-token"

# R2 Storage
R2_BUCKET_NAME="viandas-storage"
R2_ACCESS_KEY_ID="seu-access-key"
R2_SECRET_ACCESS_KEY="seu-secret-key"
```

### Instalação

```bash
# Instalar dependências
pnpm install

# Configurar banco de dados
pnpm prisma generate
pnpm prisma db push

# Executar em desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Deploy para Cloudflare Workers
pnpm deploy
```

## 📚 Documentação da API

A documentação completa da API está disponível via Swagger UI:

- **Documentação JSON**: `/docs/doc`
- **Interface Swagger UI**: `/docs/ui`

### Endpoints Principais

#### Autenticação
- `POST /api/v1/users/register` - Registrar usuário
- `POST /api/v1/users/login` - Login de usuário

#### Usuários
- `GET /api/v1/users/profile` - Obter perfil do usuário
- `PUT /api/v1/users/profile` - Atualizar perfil
- `PUT /api/v1/users/password` - Alterar senha
- `GET /api/v1/users` - Listar usuários (Admin)

#### Pedidos
- `POST /api/v1/pedidos` - Criar pedido
- `GET /api/v1/pedidos` - Listar pedidos
- `GET /api/v1/pedidos/:id` - Obter pedido por ID
- `PUT /api/v1/pedidos/:id` - Atualizar pedido
- `DELETE /api/v1/pedidos/:id` - Excluir pedido
- `PATCH /api/v1/pedidos/:id/status` - Atualizar status
- `GET /api/v1/pedidos/stats` - Estatísticas

#### Arquivos
- `POST /api/v1/files/upload` - Upload de arquivo
- `POST /api/v1/files/upload/multiple` - Upload múltiplo
- `GET /api/v1/files/list` - Listar arquivos
- `GET /api/v1/files/download/:key` - Download de arquivo
- `GET /api/v1/files/view/:key` - Visualizar arquivo
- `DELETE /api/v1/files/:id` - Excluir arquivo

## 🔐 Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação. Após o login, inclua o token no header:

```
Authorization: Bearer <seu-jwt-token>
```

## 👥 Roles de Usuário

- **USER**: Usuário padrão com acesso aos próprios dados
- **ADMIN**: Administrador com acesso completo ao sistema

## 📊 Status de Pedidos

- **PENDENTE**: Pedido criado, aguardando preparo
- **PREPARANDO**: Pedido em preparo
- **PRONTO**: Pedido pronto para entrega
- **ENTREGUE**: Pedido entregue ao cliente
- **CANCELADO**: Pedido cancelado

## 🗂️ Tamanhos de Viandas

- **PEQUENO**: Vianda pequena
- **MEDIO**: Vianda média
- **GRANDE**: Vianda grande

## 🛡️ Segurança

A API implementa várias camadas de segurança:

- **CORS**: Configurado para permitir origens específicas
- **Helmet**: Headers de segurança HTTP
- **Rate Limiting**: Limitação de requisições por IP
- **Validação de Entrada**: Validação rigorosa com Zod
- **Autenticação JWT**: Tokens seguros com expiração
- **Hash de Senhas**: bcrypt para hash seguro de senhas
- **Validação de Arquivos**: Tipos e tamanhos permitidos

## 📁 Upload de Arquivos

### Configurações
- **Tamanho máximo**: 10MB por arquivo
- **Tipos permitidos**: Imagens (jpg, jpeg, png, gif, webp), PDFs, documentos
- **Storage**: Cloudflare R2
- **Múltiplos uploads**: Até 5 arquivos por vez

## 🚀 Deploy

### Cloudflare Workers

1. Configure as variáveis de ambiente no Cloudflare Dashboard
2. Execute o deploy:

```bash
pnpm deploy
```

### Configuração do D1 Database

```bash
# Criar database D1
wrangler d1 create viandas-db

# Executar migrações
wrangler d1 migrations apply viandas-db
```

## 🧪 Testes

```bash
# Executar testes
pnpm test

# Testes com coverage
pnpm test:coverage

# Testes em modo watch
pnpm test:watch
```

## 📈 Monitoramento

A API inclui endpoints de health check:

- `GET /` - Health check básico
- `GET /health` - Health check detalhado com status dos serviços

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato:
- Email: suporte@viandas.com
- GitHub Issues: [Criar Issue](https://github.com/seu-usuario/viandas-api/issues)

---

**Desenvolvido com ❤️ usando Hono.js e Cloudflare Workers**