import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

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
	BEARER_TOKEN: string;
}

/**
 * Cria uma instância do Prisma Client configurada para Cloudflare Workers
 * @param env - Variáveis de ambiente do Cloudflare Workers
 * @returns Instância configurada do Prisma Client
 */
export function createPrismaClient(env: Env): PrismaClient {
	const adapter = new PrismaD1(env.DB);
	return new PrismaClient({ adapter });
}



/**
 * Tipo para o cliente Prisma configurado
 */
export type DatabaseClient = ReturnType<typeof createPrismaClient>;
