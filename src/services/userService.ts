import { UserRepository } from '../repositories/userRepository';
import { RegisterUserInput, LoginUserInput, UpdateUserInput, ChangePasswordInput } from '../validators/userValidator';
import { hashPassword, comparePassword } from '../utils/hashUtils';
import { generateToken, JwtPayload } from '../utils/jwtUtils';
import { Usuario } from '@prisma/client';
import { Env } from '../lib/database';

/**
 * Serviço para lógica de negócio de usuários e autenticação
 */
export class UserService {
	constructor(private userRepository: UserRepository) {}

	/**
	 * Registra um novo usuário
	 * @param data - Dados do usuário
	 * @param env - Variáveis de ambiente
	 * @returns Usuário criado (sem senha) e token JWT
	 */
	async register(data: RegisterUserInput, env: Env): Promise<{ user: Omit<Usuario, 'senha'>; token: string }> {
		// Verifica se o email já existe
		const existingUser = await this.userRepository.findByEmail(data.email);
		if (existingUser) {
			throw new Error('Email já está em uso');
		}

		// Hash da senha
		const hashedPassword = await hashPassword(data.senha, env);

		// Cria o usuário
		const user = await this.userRepository.create({
			...data,
			senha: hashedPassword,
		});

		// Gera token JWT
		const payload: JwtPayload = {
			userId: user.id,
			email: user.email,
			role: user.role,
		};
		const token = generateToken(payload, env);

		// Remove a senha do retorno
		const { senha, ...userWithoutPassword } = user;

		return { user: userWithoutPassword, token };
	}

	/**
	 * Autentica um usuário
	 * @param data - Dados de login
	 * @param env - Variáveis de ambiente
	 * @returns Usuário (sem senha) e token JWT
	 */
	async login(data: LoginUserInput, env: Env): Promise<{ user: Omit<Usuario, 'senha'>; token: string }> {
		// Busca o usuário pelo email
		const user = await this.userRepository.findByEmail(data.email);
		if (!user || !user.ativo) {
			throw new Error('Credenciais inválidas');
		}

		// Verifica a senha
		const isPasswordValid = await comparePassword(data.senha, user.senha);
		if (!isPasswordValid) {
			throw new Error('Credenciais inválidas');
		}

		// Gera token JWT
		const payload: JwtPayload = {
			userId: user.id,
			email: user.email,
			role: user.role,
		};
		const token = generateToken(payload, env);

		// Remove a senha do retorno
		const { senha, ...userWithoutPassword } = user;

		return { user: userWithoutPassword, token };
	}

	/**
	 * Busca um usuário por ID
	 * @param id - ID do usuário
	 * @returns Usuário encontrado (sem senha)
	 */
	async getUserById(id: number): Promise<Omit<Usuario, 'senha'>> {
		const user = await this.userRepository.findById(id);
		if (!user || !user.ativo) {
			throw new Error('Usuário não encontrado');
		}

		const { senha, ...userWithoutPassword } = user;
		return userWithoutPassword;
	}

	/**
	 * Lista usuários com paginação
	 * @param page - Página atual
	 * @param limit - Limite por página
	 * @returns Lista paginada de usuários
	 */
	async listUsers(page: number = 1, limit: number = 10) {
		const { usuarios, total } = await this.userRepository.findMany(page, limit);
		const totalPages = Math.ceil(total / limit);

		return {
			usuarios,
			pagination: {
				page,
				limit,
				total,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1,
			},
		};
	}

	/**
	 * Atualiza um usuário
	 * @param id - ID do usuário
	 * @param data - Dados para atualização
	 * @param env - Variáveis de ambiente
	 * @returns Usuário atualizado (sem senha)
	 */
	async updateUser(id: number, data: UpdateUserInput, env: Env): Promise<Omit<Usuario, 'senha'>> {
		// Verifica se o usuário existe
		await this.getUserById(id);

		// Se está atualizando email, verifica se já existe
		if (data.email) {
			const emailExists = await this.userRepository.emailExists(data.email, id);
			if (emailExists) {
				throw new Error('Email já está em uso');
			}
		}

		// Se está atualizando senha, faz o hash
		let updateData = { ...data };
		if (data.senha) {
			updateData.senha = await hashPassword(data.senha, env);
		}

		const updatedUser = await this.userRepository.update(id, updateData);
		if (!updatedUser) {
			throw new Error('Erro ao atualizar usuário');
		}

		const { senha, ...userWithoutPassword } = updatedUser;
		return userWithoutPassword;
	}

	/**
	 * Altera a senha de um usuário
	 * @param userId - ID do usuário
	 * @param data - Dados de alteração de senha
	 * @param env - Variáveis de ambiente
	 */
	async changePassword(userId: number, data: ChangePasswordInput, env: Env): Promise<void> {
		// Busca o usuário com senha
		const user = await this.userRepository.findById(userId);
		if (!user || !user.ativo) {
			throw new Error('Usuário não encontrado');
		}

		// Verifica a senha atual
		const isCurrentPasswordValid = await comparePassword(data.senhaAtual, user.senha);
		if (!isCurrentPasswordValid) {
			throw new Error('Senha atual incorreta');
		}

		// Hash da nova senha
		const hashedNewPassword = await hashPassword(data.novaSenha, env);

		// Atualiza a senha
		const updated = await this.userRepository.updatePassword(userId, hashedNewPassword);
		if (!updated) {
			throw new Error('Erro ao alterar senha');
		}
	}

	/**
	 * Desativa um usuário
	 * @param id - ID do usuário
	 */
	async deactivateUser(id: number): Promise<void> {
		// Verifica se o usuário existe
		await this.getUserById(id);

		const deactivated = await this.userRepository.deactivate(id);
		if (!deactivated) {
			throw new Error('Erro ao desativar usuário');
		}
	}
}
