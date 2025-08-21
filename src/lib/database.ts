import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  JWT_SECRET: string;
  BCRYPT_ROUNDS: string;
  CORS_ORIGIN: string;
  RATE_LIMIT: string;
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