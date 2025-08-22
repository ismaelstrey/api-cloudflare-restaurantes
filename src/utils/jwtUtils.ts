import jwt from 'jsonwebtoken';
import { Env } from '../lib/database';

export interface JwtPayload {
	userId: number;
	email: string;
	role: string;
}

/**
 * Gera um token JWT para o usuário
 * @param payload - Dados do usuário para incluir no token
 * @param env - Variáveis de ambiente
 * @returns Token JWT assinado
 */
export function generateToken(payload: JwtPayload, env: Env): string {
	return jwt.sign(payload, env.JWT_SECRET, {
		expiresIn: env.JWT_EXPIRES_IN || '7d',
	});
}

/**
 * Verifica e decodifica um token JWT
 * @param token - Token JWT para verificar
 * @param env - Variáveis de ambiente
 * @returns Payload decodificado ou null se inválido
 */
export function verifyToken(token: string, env: Env): JwtPayload | null {
	try {
		const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
		return decoded;
	} catch (error) {
		return null;
	}
}

/**
 * Extrai o token do cabeçalho Authorization
 * @param authHeader - Cabeçalho Authorization
 * @returns Token extraído ou null
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return null;
	}
	return authHeader.substring(7);
}
