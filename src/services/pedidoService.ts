import { PedidoRepository } from '../repositories/pedidoRepository';
import { CreatePedidoInput, UpdatePedidoInput, ListPedidosQuery } from '../validators/pedidoValidator';
import { Pedido } from '@prisma/client';

/**
 * Serviço para lógica de negócio de pedidos
 */
export class PedidoService {
	constructor(private pedidoRepository: PedidoRepository) {}

	/**
	 * Cria um novo pedido
	 * @param data - Dados do pedido
	 * @returns Pedido criado
	 */
	async createPedido(data: CreatePedidoInput): Promise<Pedido> {
		// Validações de negócio podem ser adicionadas aqui
		if (data.preco <= 0) {
			throw new Error('Preço deve ser maior que zero');
		}

		return await this.pedidoRepository.create(data);
	}

	/**
	 * Busca um pedido por ID
	 * @param id - ID do pedido
	 * @returns Pedido encontrado
	 * @throws Error se pedido não encontrado
	 */
	async getPedidoById(id: number): Promise<Pedido> {
		const pedido = await this.pedidoRepository.findById(id);
		if (!pedido) {
			throw new Error('Pedido não encontrado');
		}
		return pedido;
	}

	/**
	 * Lista pedidos com paginação e filtros
	 * @param query - Parâmetros de consulta
	 * @returns Lista paginada de pedidos
	 */
	async listPedidos(query: ListPedidosQuery) {
		const { pedidos, total } = await this.pedidoRepository.findMany(query);
		const totalPages = Math.ceil(total / query.limit);

		return {
			pedidos,
			pagination: {
				page: query.page,
				limit: query.limit,
				total,
				totalPages,
				hasNext: query.page < totalPages,
				hasPrev: query.page > 1,
			},
		};
	}

	/**
	 * Atualiza um pedido
	 * @param id - ID do pedido
	 * @param data - Dados para atualização
	 * @returns Pedido atualizado
	 * @throws Error se pedido não encontrado
	 */
	async updatePedido(id: number, data: UpdatePedidoInput): Promise<Pedido> {
		// Verifica se o pedido existe
		await this.getPedidoById(id);

		// Validações de negócio
		if (data.preco !== undefined && data.preco <= 0) {
			throw new Error('Preço deve ser maior que zero');
		}

		const updatedPedido = await this.pedidoRepository.update(id, data);
		if (!updatedPedido) {
			throw new Error('Erro ao atualizar pedido');
		}

		return updatedPedido;
	}

	/**
	 * Remove um pedido
	 * @param id - ID do pedido
	 * @throws Error se pedido não encontrado ou não pode ser removido
	 */
	async deletePedido(id: number): Promise<void> {
		// Verifica se o pedido existe
		const pedido = await this.getPedidoById(id);

		// Regra de negócio: não permite deletar pedidos já entregues
		if (pedido.status === 'entregue') {
			throw new Error('Não é possível deletar pedidos já entregues');
		}

		const deleted = await this.pedidoRepository.delete(id);
		if (!deleted) {
			throw new Error('Erro ao deletar pedido');
		}
	}

	/**
	 * Atualiza o status de um pedido
	 * @param id - ID do pedido
	 * @param status - Novo status
	 * @returns Pedido atualizado
	 */
	async updateStatus(id: number, status: string): Promise<Pedido> {
		const validStatuses = ['pendente', 'preparando', 'pronto', 'entregue', 'cancelado'];
		if (!validStatuses.includes(status)) {
			throw new Error('Status inválido');
		}

		return await this.updatePedido(id, { status });
	}

	/**
	 * Obtém estatísticas de pedidos
	 * @returns Estatísticas por status
	 */
	async getStatistics(): Promise<Record<string, number>> {
		return await this.pedidoRepository.countByStatus();
	}
}
