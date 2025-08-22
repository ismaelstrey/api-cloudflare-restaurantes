import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { verifyToken, extractTokenFromHeader, JwtPayload } from '../utils/jwtUtils';
import { Env } from '../lib/database';

// Estende o contexto do Hono para incluir informações do usuário
declare module 'hono' {
	interface ContextVariableMap {
		user: JwtPayload;
	}
}

/**
 * Middleware de autenticação JWT
 * Verifica se o usuário está autenticado através do token JWT
 */
export function authMiddleware() {
	return async (c: Context<{ Bindings: Env }>, next: Next) => {
		const authHeader = c.req.header('Authorization');
		const token = extractTokenFromHeader(authHeader);

		if (!token) {
			throw new HTTPException(401, { message: 'Token de acesso requerido' });
		}

		const payload = verifyToken(token, c.env);
		if (!payload) {
			throw new HTTPException(401, { message: 'Token inválido ou expirado' });
		}

		// Adiciona as informações do usuário ao contexto
		c.set('user', payload);
		await next();
	};
}

/**
 * Middleware de autorização por role
 * Verifica se o usuário tem a role necessária para acessar o recurso
 */
export function roleMiddleware(requiredRoles: string[]) {
	return async (c: Context<{ Bindings: Env }>, next: Next) => {
		const user = c.get('user');

		if (!user) {
			throw new HTTPException(401, { message: 'Usuário não autenticado' });
		}

		if (!requiredRoles.includes(user.role)) {
			throw new HTTPException(403, { message: 'Acesso negado. Permissões insuficientes' });
		}

		await next();
	};
}

/**
 * Middleware opcional de autenticação
 * Adiciona informações do usuário ao contexto se o token for válido, mas não bloqueia o acesso
 */
export function optionalAuthMiddleware() {
	return async (c: Context<{ Bindings: Env }>, next: Next) => {
		const authHeader = c.req.header('Authorization');
		const token = extractTokenFromHeader(authHeader);

		if (token) {
			const payload = verifyToken(token, c.env);
			if (payload) {
				c.set('user', payload);
			}
		}

		await next();
	};
}
