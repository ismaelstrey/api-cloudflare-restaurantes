import { Context } from 'hono';
import { PedidoService } from '../services/pedidoService';
import { PedidoRepository } from '../repositories/pedidoRepository';
import { createPedidoSchema, updatePedidoSchema, listPedidosSchema, idParamSchema } from '../validators/pedidoValidator';
import { DatabaseClient } from '../lib/database';

export class PedidoController {
	private pedidoService: PedidoService;

	constructor(db: DatabaseClient) {
		const pedidoRepository = new PedidoRepository(db);
		this.pedidoService = new PedidoService(pedidoRepository);
	}

	/**
	 * Cria um novo pedido
	 */
	async create(c: Context) {
		try {
			const body = await c.req.json();
			const validatedData = createPedidoSchema.parse(body);
			const userId = c.get('user')?.userId;

			if (!userId) {
				return c.json({ error: 'Usuário não autenticado' }, 401);
			}

			const pedido = await this.pedidoService.createPedido(validatedData);

			return c.json(
				{
					success: true,
					data: pedido,
					message: 'Pedido criado com sucesso',
				},
				201,
			);
		} catch (error: any) {
			return c.json(
				{
					success: false,
					error: error.message || 'Erro interno do servidor',
				},
				error.status || 500,
			);
		}
	}

	/**
	 * Busca um pedido por ID
	 */
	async getById(c: Context) {
		try {
			const { id } = idParamSchema.parse({ id: c.req.param('id') });
			const userId = c.get('user')?.userId;
			const userRole = c.get('user')?.role;

			const pedido = await this.pedidoService.getPedidoById(id);

			// Verifica se o usuário pode acessar este pedido
			if (userRole !== 'ADMIN' && pedido.id !== userId) {
				return c.json({ error: 'Acesso negado' }, 403);
			}

			return c.json({
				success: true,
				data: pedido,
			});
		} catch (error: any) {
			return c.json(
				{
					success: false,
					error: error.message || 'Erro interno do servidor',
				},
				error.status || 500,
			);
		}
	}

	/**
	 * Lista pedidos com paginação e filtros
	 */
	async list(c: Context) {
		console.log("teste list")
		try {
			const query = c.req.query();
			const validatedQuery = listPedidosSchema.parse(query);
			const userId = c.get('user')?.userId;
			const userRole = c.get('user')?.role;

			// Se não for admin, só pode ver seus próprios pedidos
			const filters =
				userRole === 'ADMIN'
					? validatedQuery
					: {
							...validatedQuery,
							usuarioId: userId,
						};

			const result = await this.pedidoService.listPedidos(filters);

			return c.json({
				success: true,
				data: result.pedidos,
				pagination: result.pagination,
			});
		} catch (error: any) {
			return c.json(
				{
					success: false,
					error: error.message || 'Erro interno do servidor',
				},
				error.status || 500,
			);
		}
	}

	/**
	 * Atualiza um pedido
	 */
	async update(c: Context) {
		try {
			const { id } = idParamSchema.parse({ id: c.req.param('id') });
			const body = await c.req.json();
			const validatedData = updatePedidoSchema.parse(body);
			const userId = c.get('user')?.userId;
			const userRole = c.get('user')?.role;

			const pedido = await this.pedidoService.updatePedido(id, validatedData);

			return c.json({
				success: true,
				data: pedido,
				message: 'Pedido atualizado com sucesso',
			});
		} catch (error: any) {
			return c.json(
				{
					success: false,
					error: error.message || 'Erro interno do servidor',
				},
				error.status || 500,
			);
		}
	}

	/**
	 * Remove um pedido
	 */
	async delete(c: Context) {
		try {
			const { id } = idParamSchema.parse({ id: c.req.param('id') });
			const userId = c.get('user')?.userId;
			const userRole = c.get('user')?.role;

			await this.pedidoService.deletePedido(id);

			return c.json({
				success: true,
				message: 'Pedido removido com sucesso',
			});
		} catch (error: any) {
			return c.json(
				{
					success: false,
					error: error.message || 'Erro interno do servidor',
				},
				error.status || 500,
			);
		}
	}

	/**
	 * Atualiza o status de um pedido
	 */
	async updateStatus(c: Context) {
		try {
			const { id } = idParamSchema.parse({ id: c.req.param('id') });
			const { status } = await c.req.json();
			const userId = c.get('user')?.userId;
			const userRole = c.get('user')?.role;

			if (!status) {
				return c.json({ error: 'Status é obrigatório' }, 400);
			}

			const pedido = await this.pedidoService.updateStatus(id, status);

			return c.json({
				success: true,
				data: pedido,
				message: 'Status do pedido atualizado com sucesso',
			});
		} catch (error: any) {
			return c.json(
				{
					success: false,
					error: error.message || 'Erro interno do servidor',
				},
				error.status || 500,
			);
		}
	}

	/**
	 * Obtém estatísticas dos pedidos
	 */
	async getStats(c: Context) {
		try {
			const userId = c.get('user')?.userId;
			const userRole = c.get('user')?.role;

			const stats = await this.pedidoService.getStatistics();

			return c.json({
				success: true,
				data: stats,
			});
		} catch (error: any) {
			return c.json(
				{
					success: false,
					error: error.message || 'Erro interno do servidor',
				},
				error.status || 500,
			);
		}
	}
}
