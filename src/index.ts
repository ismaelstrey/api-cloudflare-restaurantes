import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { createPrismaClient } from './lib/database';
import { createPedidoRoutes } from './routes/pedidoRoutes';
import { createUserRoutes } from './routes/userRoutes';
import { createFileRoutes } from './routes/fileRoutes';
import { corsMiddleware, helmetMiddleware, bearerAuthMiddleware, requestLoggerMiddleware } from './middlewares/securityMiddleware';
import { setupSwagger } from './docs/swagger';

// Interface para as variáveis de ambiente do Cloudflare Workers
export interface Env {
	DB: D1Database;
	IMAGES: R2Bucket;
	JWT_SECRET: string;
	JWT_EXPIRES_IN: string;
	BCRYPT_ROUNDS: string;
	MAX_FILE_SIZE: string;
	ALLOWED_FILE_TYPES: string;
	RATE_LIMIT_MAX: string;
	RATE_LIMIT_WINDOW: string;
	CORS_ORIGIN: string;
	NODE_ENV: string;
}

// Cria a aplicação Hono
const app = new Hono<{ Bindings: Env }>();

// Middlewares globais
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', requestLoggerMiddleware());
app.use('*', corsMiddleware());
// app.use('*', helmetMiddleware());

// Middleware de autenticação apenas para rotas da API (excluindo documentação)
// app.use('/api/*', bearerAuthMiddleware());

// Configurar documentação Swagger
setupSwagger(app);

// Rota de health check
app.get('/', (c) => {
	return c.json({
		success: true,
		message: 'API de Viandas - Sistema de Pedidos',
		version: '1.0.0',
		timestamp: new Date().toISOString(),
		environment: c.env.NODE_ENV || 'development',
	});
});

// Rota de health check detalhada
app.get('/health', (c) => {
	return c.json({
		success: true,
		status: 'healthy',
		timestamp: new Date().toISOString(),
		services: {
			database: 'connected',
			storage: 'connected',
		},
		version: '1.0.0',
	});
});

// Configuração das rotas da API
// Create a middleware to handle database initialization and route delegation
app.all('/api/v1/pedidos/*', async (c) => {
try {
	// console.log("teste pedido",{c})
	const db = createPrismaClient(c.env);
	const pedidoRoutes = createPedidoRoutes(db);
	console.log(db)
	return pedidoRoutes.fetch(c.req.raw, c.env, c.executionCtx);
} catch (error) {
	console.log("teste pedido error", error)
}
});

app.all('/api/v1/users/*', async (c) => {
	const db = createPrismaClient(c.env);
	const userRoutes = createUserRoutes(db);
	return userRoutes.fetch(c.req.raw, c.env, c.executionCtx);
});

app.all('/api/v1/files/*', async (c) => {
	const db = createPrismaClient(c.env);
	const baseUrl = new URL(c.req.url).origin;
	const fileRoutes = createFileRoutes(db, c.env.IMAGES, baseUrl);
	return fileRoutes.fetch(c.req.raw, c.env, c.executionCtx);
});

// Middleware para rotas não encontradas
app.notFound((c) => {
	return c.json(
		{
			success: false,
			error: 'Rota não encontrada',
			message: 'A rota solicitada não existe nesta API',
			availableRoutes: [
				'GET /',
				'GET /health',
				'POST /api/v1/users/register',
				'POST /api/v1/users/login',
				'GET /api/v1/users/profile',
				'GET /api/v1/pedidos',
				'POST /api/v1/pedidos',
				'POST /api/v1/files/upload',
				'GET /api/v1/files/list',
				'GET /api/v1/files/download/:key',
				'GET /api/v1/files/view/:key',
				'GET /docs/doc',
				'GET /docs/ui',
			],
		},
		404,
	);
});

// Middleware para tratamento de erros
app.onError((err, c) => {
	console.error('Erro na aplicação:', err);

	return c.json(
		{
			success: false,
			error: 'Erro interno do servidor',
			message: c.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
			timestamp: new Date().toISOString(),
		},
		500,
	);
});

// Export para Cloudflare Workers
export default {
	fetch: app.fetch.bind(app),
};
