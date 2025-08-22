import { z } from 'zod';

/**
 * Schema de validação para criação de pedido
 */
export const createPedidoSchema = z.object({
	cliente: z
		.string({
			required_error: 'Nome do cliente é obrigatório',
		})
		.min(2, 'Nome do cliente deve ter pelo menos 2 caracteres')
		.max(100, 'Nome do cliente deve ter no máximo 100 caracteres'),

	tamanho: z.enum(['P', 'M', 'G', 'GG'], {
		required_error: 'Tamanho é obrigatório',
		invalid_type_error: 'Tamanho deve ser P, M, G ou GG',
	}),

	complemento: z.string().max(200, 'Complemento deve ter no máximo 200 caracteres').optional(),

	preco: z
		.number({
			required_error: 'Preço é obrigatório',
			invalid_type_error: 'Preço deve ser um número',
		})
		.positive('Preço deve ser maior que zero')
		.max(999.99, 'Preço deve ser menor que R$ 999,99'),
});

/**
 * Schema de validação para atualização de pedido
 */
export const updatePedidoSchema = z.object({
	cliente: z
		.string()
		.min(2, 'Nome do cliente deve ter pelo menos 2 caracteres')
		.max(100, 'Nome do cliente deve ter no máximo 100 caracteres')
		.optional(),

	tamanho: z
		.enum(['P', 'M', 'G', 'GG'], {
			invalid_type_error: 'Tamanho deve ser P, M, G ou GG',
		})
		.optional(),

	complemento: z.string().max(200, 'Complemento deve ter no máximo 200 caracteres').optional(),

	preco: z
		.number({
			invalid_type_error: 'Preço deve ser um número',
		})
		.positive('Preço deve ser maior que zero')
		.max(999.99, 'Preço deve ser menor que R$ 999,99')
		.optional(),

	status: z
		.enum(['pendente', 'preparando', 'pronto', 'entregue', 'cancelado'], {
			invalid_type_error: 'Status inválido',
		})
		.optional(),
});

/**
 * Schema de validação para parâmetros de ID
 */
export const idParamSchema = z.object({
	id: z.string().regex(/^\d+$/, 'ID deve ser um número válido').transform(Number),
});

/**
 * Schema de validação para query parameters de listagem
 */
export const listPedidosQuerySchema = z.object({
	page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
	limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
	status: z.enum(['pendente', 'preparando', 'pronto', 'entregue', 'cancelado']).optional(),
	cliente: z.string().optional(),
});

/**
 * Schema de validação para listagem de pedidos (alias para compatibilidade)
 */
export const listPedidosSchema = listPedidosQuerySchema;

/**
 * Tipos TypeScript derivados dos schemas
 */
export type CreatePedidoInput = z.infer<typeof createPedidoSchema>;
export type UpdatePedidoInput = z.infer<typeof updatePedidoSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type ListPedidosQuery = z.infer<typeof listPedidosQuerySchema>;
export type ListPedidos = z.infer<typeof listPedidosSchema>;
