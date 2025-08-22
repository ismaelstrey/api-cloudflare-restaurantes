import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';

// Schemas de resposta
const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional()
});

const ErrorResponseSchema = z.object({
  success: z.boolean(),
  error: z.string(),
  message: z.string().optional(),
  timestamp: z.string().optional()
});

const PaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number()
});

// Schemas de entidades
const UserSchema = z.object({
  id: z.string(),
  nome: z.string(),
  email: z.string().email(),
  role: z.enum(['USER', 'ADMIN']),
  ativo: z.boolean(),
  criadoEm: z.string(),
  atualizadoEm: z.string()
});

const PedidoSchema = z.object({
  id: z.string(),
  cliente: z.string(),
  tamanho: z.enum(['PEQUENO', 'MEDIO', 'GRANDE']),
  complemento: z.string().optional(),
  preco: z.number(),
  status: z.enum(['PENDENTE', 'PREPARANDO', 'PRONTO', 'ENTREGUE', 'CANCELADO']),
  usuarioId: z.string(),
  criadoEm: z.string(),
  atualizadoEm: z.string()
});

const ArquivoSchema = z.object({
  id: z.string(),
  nomeOriginal: z.string(),
  nomeArquivo: z.string(),
  tamanho: z.number(),
  tipo: z.string(),
  url: z.string(),
  usuarioId: z.string(),
  criadoEm: z.string()
});

// Schemas de entrada
const RegisterUserInputSchema = z.object({
  nome: z.string().min(2).max(100),
  email: z.string().email(),
  senha: z.string().min(6)
});

const LoginUserInputSchema = z.object({
  email: z.string().email(),
  senha: z.string()
});

const CreatePedidoInputSchema = z.object({
  cliente: z.string().min(2).max(100),
  tamanho: z.enum(['PEQUENO', 'MEDIO', 'GRANDE']),
  complemento: z.string().max(500).optional(),
  preco: z.number().positive()
});

const UpdatePedidoInputSchema = z.object({
  cliente: z.string().min(2).max(100).optional(),
  tamanho: z.enum(['PEQUENO', 'MEDIO', 'GRANDE']).optional(),
  complemento: z.string().max(500).optional(),
  preco: z.number().positive().optional()
});

// Configuração do OpenAPI
export function createSwaggerDocs() {
  const app = new OpenAPIHono();

  // Configuração da documentação
  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'API de Viandas - Sistema de Pedidos',
      description: 'API profissional para gerenciamento de pedidos de viandas com autenticação JWT, upload de arquivos e sistema completo de CRUD.',
      contact: {
        name: 'Suporte API',
        email: 'suporte@viandas.com'
      }
    },
    servers: [
      {
        url: 'https://meu-backend.ismaelstrey.workers.dev',
        description: 'Servidor de Produção'
      },
      {
        url: 'http://localhost:8787',

        description: 'Servidor de Desenvolvimento'
      }
    ],
    tags: [
      {
        name: 'Autenticação',
        description: 'Endpoints para registro e login de usuários'
      },
      {
        name: 'Usuários',
        description: 'Gerenciamento de perfis de usuários'
      },
      {
        name: 'Pedidos',
        description: 'CRUD completo para pedidos de viandas'
      },
      {
        name: 'Arquivos',
        description: 'Upload, download e gerenciamento de arquivos'
      },
      {
        name: 'Sistema',
        description: 'Endpoints de sistema e health check'
      }
    ]
  });

  // Interface Swagger UI
  app.get('/ui', swaggerUI({ url: '/docs/doc' }));

  // Rotas de Sistema
  app.openapi(
    createRoute({
      method: 'get',
      path: '/',
      tags: ['Sistema'],
      summary: 'Health Check Principal',
      description: 'Verifica se a API está funcionando corretamente',
      responses: {
        200: {
          description: 'API funcionando corretamente',
          content: {
            'application/json': {
              schema: SuccessResponseSchema
            }
          }
        }
      }
    }),
    (c) => {
      return c.json({
        success: true,
        message: 'API de Viandas - Sistema de Pedidos',
        version: '1.0.0'
      });
    }
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/health',
      tags: ['Sistema'],
      summary: 'Health Check Detalhado',
      description: 'Verifica o status detalhado dos serviços da API',
      responses: {
        200: {
          description: 'Status detalhado dos serviços',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                status: z.string(),
                timestamp: z.string(),
                services: z.object({
                  database: z.string(),
                  storage: z.string()
                }),
                version: z.string()
              })
            }
          }
        }
      }
    }),
    (c) => {
      return c.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          storage: 'connected'
        },
        version: '1.0.0'
      });
    }
  );

  // Rotas de Autenticação
  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/v1/users/register',
      tags: ['Autenticação'],
      summary: 'Registrar Usuário',
      description: 'Cria uma nova conta de usuário no sistema',
      requestBody: {
        content: {
          'application/json': {
            schema: RegisterUserInputSchema,
          

          }
        }
      },
      responses: {
        201: {
          description: 'Usuário registrado com sucesso',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                data: z.object({
                  user: UserSchema,
                  token: z.string()
                }),
                message: z.string()
              })
            }
          }
        },
        400: {
          description: 'Dados inválidos',
          content: {
            'application/json': {
              schema: ErrorResponseSchema
            }
          }
        },
        409: {
          description: 'Email já cadastrado',
          content: {
            'application/json': {
              schema: ErrorResponseSchema
            }
          }
        }
      }
    }),
    (c) => c.json({ message: 'Implementado no controller' })
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/v1/users/login',
      tags: ['Autenticação'],
      summary: 'Login de Usuário',
      description: 'Autentica um usuário e retorna um token JWT',
      requestBody: {
        content: {
          'application/json': {
            schema: LoginUserInputSchema
          }
        }
      },
      responses: {
        200: {
          description: 'Login realizado com sucesso',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                data: z.object({
                  user: UserSchema,
                  token: z.string()
                }),
                message: z.string()
              })
            }
          }
        },
        401: {
          description: 'Credenciais inválidas',
          content: {
            'application/json': {
              schema: ErrorResponseSchema
            }
          }
        }
      }
    }),
    (c) => c.json({ message: 'Implementado no controller' })
  );

  // Rotas de Usuários
  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/v1/users/profile',
      tags: ['Usuários'],
      summary: 'Obter Perfil',
      description: 'Obtém o perfil do usuário autenticado',
      responses: {
        200: {
          description: 'Perfil do usuário',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                data: UserSchema
              })
            }
          }
        },
        401: {
          description: 'Token inválido ou expirado',
          content: {
            'application/json': {
              schema: ErrorResponseSchema
            }
          }
        }
      }
    }),
    (c) => c.json({ message: 'Implementado no controller' })

  );

  // Rotas de Pedidos
  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/v1/pedidos',
      tags: ['Pedidos'],
      summary: 'Criar Pedido',
      description: 'Cria um novo pedido de vianda',
      requestBody: {
        content: {
          'application/json': {
            schema: CreatePedidoInputSchema
          }
        }
      },
      responses: {
        201: {
          description: 'Pedido criado com sucesso',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                data: PedidoSchema,
                message: z.string()
              })
            }
          }
        },
        400: {
          description: 'Dados inválidos',
          content: {
            'application/json': {
              schema: ErrorResponseSchema
            }
          }
        },
        401: {
          description: 'Token inválido ou expirado',
          content: {
            'application/json': {
              schema: ErrorResponseSchema
            }
          }
        }
      }
    }),
    (c) => c.json({ message: 'Implementado no controller' })
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/v1/pedidos',
      tags: ['Pedidos'],
      summary: 'Listar Pedidos',
      description: 'Lista pedidos com paginação e filtros',
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Número da página',
          schema: { type: 'integer', default: 1 }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Itens por página',
          schema: { type: 'integer', default: 10 }
        },
        {
          name: 'status',
          in: 'query',
          description: 'Filtrar por status',
          schema: { type: 'string', enum: ['PENDENTE', 'PREPARANDO', 'PRONTO', 'ENTREGUE', 'CANCELADO'] }
        }
      ],
      responses: {
        200: {
          description: 'Lista de pedidos',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                data: z.array(PedidoSchema),
                pagination: PaginationSchema
              })
            }
          }
        },
        401: {
          description: 'Token inválido ou expirado',
          content: {
            'application/json': {
              schema: ErrorResponseSchema
            }
          }
        }
      }
    }),
    (c) => c.json({ message: 'Implementado no controller' })
  );

  // Rotas de Arquivos
  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/v1/files/upload',
      tags: ['Arquivos'],
      summary: 'Upload de Arquivo',
      description: 'Faz upload de um arquivo para o sistema',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              file: z.any().describe('Arquivo para upload')
            })
          }
        }
      },
      responses: {
        201: {
          description: 'Arquivo enviado com sucesso',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                data: ArquivoSchema,
                message: z.string()
              })
            }
          }
        },
        400: {
          description: 'Arquivo inválido ou muito grande',
          content: {
            'application/json': {
              schema: ErrorResponseSchema
            }
          }
        },
        401: {
          description: 'Token inválido ou expirado',
          content: {
            'application/json': {
              schema: ErrorResponseSchema
            }
          }
        }
      }
    }),
    (c) => c.json({ message: 'Implementado no controller' })
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/v1/files/list',
      tags: ['Arquivos'],
      summary: 'Listar Arquivos',
      description: 'Lista arquivos do usuário com paginação',
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Número da página',
          schema: { type: 'integer', default: 1 }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Itens por página',
          schema: { type: 'integer', default: 10 }
        }
      ],
      responses: {
        200: {
          description: 'Lista de arquivos',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
                data: z.array(ArquivoSchema),
                pagination: PaginationSchema
              })
            }
          }
        },
        401: {
          description: 'Token inválido ou expirado',
          content: {
            'application/json': {
              schema: ErrorResponseSchema
            }
          }
        }
      }
    }),
    (c) => c.json({ message: 'Implementado no controller' })
  );

  return app;
}

// Função para integrar com a aplicação principal
export function setupSwagger(app: any) {
  const swaggerApp = createSwaggerDocs();
  
  // Adicionar rotas do Swagger à aplicação principal
  app.route('/docs', swaggerApp);
  
  return app;
}