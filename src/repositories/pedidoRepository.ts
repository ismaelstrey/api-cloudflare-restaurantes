import { DatabaseClient } from '../lib/database';
import { CreatePedidoInput, UpdatePedidoInput, ListPedidosQuery } from '../validators/pedidoValidator';
import { Pedido } from '@prisma/client';

/**
 * Repositório para operações de pedidos no banco de dados
 */
export class PedidoRepository {
	constructor(private db: DatabaseClient) {}

	/**
	 * Cria um novo pedido
	 * @param data - Dados do pedido
	 * @returns Pedido criado
	 */
	async create(data: CreatePedidoInput): Promise<Pedido> {
		return await this.db.pedido.create({
			data: {
				cliente: data.cliente,
				tamanho: data.tamanho,
				complemento: data.complemento,
				preco: data.preco,
			},
		});
	}

	/**
	 * Busca um pedido por ID
	 * @param id - ID do pedido
	 * @returns Pedido encontrado ou null
	 */
	async findById(id: number): Promise<Pedido | null> {
		return await this.db.pedido.findUnique({
			where: { id },
		});
	}

	/**
	 * Lista pedidos com paginação e filtros
	 * @param query - Parâmetros de consulta
	 * @returns Lista de pedidos e total
	 */
	async findMany(query: ListPedidosQuery): Promise<{ pedidos: Pedido[]; total: number }> {
		const { page, limit, status, cliente } = query;
		const skip = (page - 1) * limit;

		const where: any = {};
		if (status) where.status = status;
		if (cliente) {
			where.cliente = {
				contains: cliente,
				mode: 'insensitive',
			};
		}

		const [pedidos, total] = await Promise.all([
			this.db.pedido.findMany({
				where,
				skip,
				take: limit,
				orderBy: { criadoEm: 'desc' },
			}),
			this.db.pedido.count({ where }),
		]);

		return { pedidos, total };
	}

	/**
	 * Atualiza um pedido
	 * @param id - ID do pedido
	 * @param data - Dados para atualização
	 * @returns Pedido atualizado ou null se não encontrado
	 */
	async update(id: number, data: UpdatePedidoInput): Promise<Pedido | null> {
		try {
			return await this.db.pedido.update({
				where: { id },
				data,
			});
		} catch (error) {
			return null;
		}
	}

	/**
	 * Remove um pedido
	 * @param id - ID do pedido
	 * @returns True se removido com sucesso
	 */
	async delete(id: number): Promise<boolean> {
		try {
			await this.db.pedido.delete({
				where: { id },
			});
			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Conta pedidos por status
	 * @returns Objeto com contagem por status
	 */
	async countByStatus(): Promise<Record<string, number>> {
		const result = await this.db.pedido.groupBy({
			by: ['status'],
			_count: {
				id: true,
			},
		});

		return result.reduce(
			(acc, item) => {
				acc[item.status] = item._count.id;
				return acc;
			},
			{} as Record<string, number>,
		);
	}
}
