import { Context, Next } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { bearerAuth } from 'hono/bearer-auth';
import { Env } from '../lib/database';

/**
 * Middleware de CORS configurado
 */
export function corsMiddleware() {
  return cors({
    origin: (origin, c) => {
      const env = c.env as Env;
      const allowedOrigins = env.CORS_ORIGIN?.split(',') || ['*'];
      return allowedOrigins.includes('*') || allowedOrigins.includes(origin);
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
}

/**
 * Middleware de segurança com secure headers
 */
export function helmetMiddleware() {
  return secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
    crossOriginEmbedderPolicy: false,
  });
}

/**
 * Middleware de autenticação Bearer
 */
export function bearerAuthMiddleware() {
  return bearerAuth({
    verifyToken: async (token, c) => {
      const env = c.env as Env;
      const validToken = env.BEARER_TOKEN || 'default-token';
      return token === validToken;
    },
    realm: 'API Access',
    invalidTokenMessage: { error: 'Token de acesso inválido' },
    noAuthenticationHeaderMessage: { error: 'Token de acesso obrigatório' },
  });
}

/**
 * Middleware de validação de Content-Type para uploads
 */
export function validateContentType(allowedTypes: string[]) {
  return async (c: Context, next: Next) => {
    const contentType = c.req.header('content-type');
    
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      return c.json({ error: 'Tipo de conteúdo não permitido' }, 400);
    }
    
    await next();
  };
}

/**
 * Middleware de validação de tamanho de arquivo
 */
export function validateFileSize(maxSize: number) {
  return async (c: Context, next: Next) => {
    const contentLength = c.req.header('content-length');
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return c.json({ error: 'Arquivo muito grande' }, 413);
    }
    
    await next();
  };
}

/**
 * Middleware de log de requisições
 */
export function requestLoggerMiddleware() {
  return async (c: Context, next: Next) => {
    const start = Date.now();
    const method = c.req.method;
    const url = c.req.url;
    const userAgent = c.req.header('user-agent') || 'Unknown';
    
    console.log(`[${new Date().toISOString()}] ${method} ${url} - User-Agent: ${userAgent}`);
    
    await next();
    
    const end = Date.now();
    const duration = end - start;
    
    console.log(`[${new Date().toISOString()}] ${method} ${url} - ${c.res.status} - ${duration}ms`);
  };
}