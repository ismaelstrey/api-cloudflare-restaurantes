import { DatabaseClient } from '../lib/database';
import { RegisterUserInput, UpdateUserInput } from '../validators/userValidator';
import { Usuario } from '@prisma/client';

/**
 * Repositório para operações de usuários no banco de dados
 */
export class UserRepository {
	constructor(private db: DatabaseClient) {}

	/**
	 * Cria um novo usuário
	 * @param data - Dados do usuário
	 * @returns Usuário criado
	 */
	async create(data: RegisterUserInput & { senha: string }): Promise<Usuario> {
		return await this.db.usuario.create({
			data: {
				nome: data.nome,
				email: data.email,
				senha: data.senha,
				role: data.role || 'user',
			},
		});
	}

	/**
	 * Busca um usuário por ID
	 * @param id - ID do usuário
	 * @returns Usuário encontrado ou null
	 */
	async findById(id: number): Promise<Usuario | null> {
		return await this.db.usuario.findUnique({
			where: { id },
		});
	}

	/**
	 * Busca um usuário por email
	 * @param email - Email do usuário
	 * @returns Usuário encontrado ou null
	 */
	async findByEmail(email: string): Promise<Usuario | null> {
		return await this.db.usuario.findUnique({
			where: { email },
		});
	}

	/**
	 * Lista todos os usuários ativos
	 * @param page - Página atual
	 * @param limit - Limite por página
	 * @returns Lista de usuários e total
	 */
	async findMany(page: number = 1, limit: number = 10): Promise<{ usuarios: Omit<Usuario, 'senha'>[]; total: number }> {
		const skip = (page - 1) * limit;

		const [usuarios, total] = await Promise.all([
			this.db.usuario.findMany({
				where: { ativo: true },
				skip,
				take: limit,
				orderBy: { criadoEm: 'desc' },
				select: {
					id: true,
					nome: true,
					email: true,
					role: true,
					ativo: true,
					criadoEm: true,
					atualizadoEm: true,
				},
			}),
			this.db.usuario.count({ where: { ativo: true } }),
		]);

		return { usuarios, total };
	}

	/**
	 * Atualiza um usuário
	 * @param id - ID do usuário
	 * @param data - Dados para atualização
	 * @returns Usuário atualizado ou null se não encontrado
	 */
	async update(id: number, data: UpdateUserInput): Promise<Usuario | null> {
		try {
			return await this.db.usuario.update({
				where: { id },
				data,
			});
		} catch (error) {
			return null;
		}
	}

	/**
	 * Atualiza a senha de um usuário
	 * @param id - ID do usuário
	 * @param hashedPassword - Nova senha hasheada
	 * @returns True se atualizado com sucesso
	 */
	async updatePassword(id: number, hashedPassword: string): Promise<boolean> {
		try {
			await this.db.usuario.update({
				where: { id },
				data: { senha: hashedPassword },
			});
			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Desativa um usuário (soft delete)
	 * @param id - ID do usuário
	 * @returns True se desativado com sucesso
	 */
	async deactivate(id: number): Promise<boolean> {
		try {
			await this.db.usuario.update({
				where: { id },
				data: { ativo: false },
			});
			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Verifica se um email já está em uso
	 * @param email - Email para verificar
	 * @param excludeId - ID do usuário a excluir da verificação
	 * @returns True se o email já existe
	 */
	async emailExists(email: string, excludeId?: number): Promise<boolean> {
		const where: any = { email };
		if (excludeId) {
			where.id = { not: excludeId };
		}

		const user = await this.db.usuario.findFirst({ where });
		return !!user;
	}
}
