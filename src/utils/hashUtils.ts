import bcrypt from 'bcryptjs';
import { Env } from '../lib/database';

/**
 * Gera um hash da senha usando bcrypt
 * @param password - Senha em texto plano
 * @param env - Variáveis de ambiente
 * @returns Hash da senha
 */
export async function hashPassword(password: string, env: Env): Promise<string> {
  const rounds = parseInt(env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, rounds);
}

/**
 * Compara uma senha em texto plano com seu hash
 * @param password - Senha em texto plano
 * @param hash - Hash da senha armazenado
 * @returns True se a senha corresponder ao hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Valida se uma senha atende aos critérios mínimos de segurança
 * @param password - Senha para validar
 * @returns True se a senha for válida
 */
export function validatePasswordStrength(password: string): boolean {
  // Mínimo 8 caracteres, pelo menos uma letra maiúscula, uma minúscula, um número
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}