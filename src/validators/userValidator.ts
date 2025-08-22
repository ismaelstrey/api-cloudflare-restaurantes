import { z } from 'zod';

/**
 * Schema de validação para registro de usuário
 */
export const registerUserSchema = z.object({
	nome: z
		.string({
			required_error: 'Nome é obrigatório',
		})
		.min(2, 'Nome deve ter pelo menos 2 caracteres')
		.max(100, 'Nome deve ter no máximo 100 caracteres'),

	email: z
		.string({
			required_error: 'Email é obrigatório',
		})
		.email('Email deve ter um formato válido')
		.max(255, 'Email deve ter no máximo 255 caracteres'),

	senha: z
		.string({
			required_error: 'Senha é obrigatória',
		})
		.min(8, 'Senha deve ter pelo menos 8 caracteres')
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'),

	role: z
		.enum(['user', 'admin'], {
			invalid_type_error: 'Role deve ser user ou admin',
		})
		.optional()
		.default('user'),
});

/**
 * Schema de validação para login
 */
export const loginUserSchema = z.object({
	email: z
		.string({
			required_error: 'Email é obrigatório',
		})
		.email('Email deve ter um formato válido'),

	senha: z
		.string({
			required_error: 'Senha é obrigatória',
		})
		.min(1, 'Senha é obrigatória'),
});

/**
 * Schema de validação para atualização de usuário
 */
export const updateUserSchema = z.object({
	nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),

	email: z.string().email('Email deve ter um formato válido').max(255, 'Email deve ter no máximo 255 caracteres').optional(),

	senha: z
		.string()
		.min(8, 'Senha deve ter pelo menos 8 caracteres')
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número')
		.optional(),

	role: z
		.enum(['user', 'admin'], {
			invalid_type_error: 'Role deve ser user ou admin',
		})
		.optional(),

	ativo: z.boolean().optional(),
});

/**
 * Schema de validação para alteração de senha
 */
export const changePasswordSchema = z
	.object({
		senhaAtual: z.string({
			required_error: 'Senha atual é obrigatória',
		}),

		novaSenha: z
			.string({
				required_error: 'Nova senha é obrigatória',
			})
			.min(8, 'Nova senha deve ter pelo menos 8 caracteres')
			.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'),

		confirmarSenha: z.string({
			required_error: 'Confirmação de senha é obrigatória',
		}),
	})
	.refine((data) => data.novaSenha === data.confirmarSenha, {
		message: 'Senhas não coincidem',
		path: ['confirmarSenha'],
	});

/**
 * Schema de validação para parâmetros de ID
 */
export const idParamSchema = z.object({
	id: z.string().regex(/^\d+$/, 'ID deve ser um número válido').transform(Number),
});

/**
 * Tipos TypeScript derivados dos schemas
 */
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
