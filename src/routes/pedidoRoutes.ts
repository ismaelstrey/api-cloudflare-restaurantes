import { Hono } from 'hono';
import { PedidoController } from '../controllers/pedidoController';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware';
import { zValidator } from '@hono/zod-validator';
import { createPedidoSchema, updatePedidoSchema, listPedidosSchema, idParamSchema } from '../validators/pedidoValidator';
import { DatabaseClient } from '../lib/database';

export function createPedidoRoutes(db: DatabaseClient) {
    const pedidoRoutes = new Hono();
    const pedidoController = new PedidoController(db);

    // Middleware de autenticação para todas as rotas
    pedidoRoutes.use('*', authMiddleware());

    /**
     * @route POST /pedidos
     * @desc Criar novo pedido
     * @access Private
     */
    pedidoRoutes.post(
        '/',
        zValidator('json', createPedidoSchema),
        async (c) => await pedidoController.create(c)
    );

    /**
     * @route GET /pedidos
     * @desc Listar pedidos com paginação e filtros
     * @access Private
     */
    pedidoRoutes.get(
        '/',
        zValidator('query', listPedidosSchema),
        async (c) => await pedidoController.list(c)
    );

    /**
     * @route GET /pedidos/stats
     * @desc Obter estatísticas dos pedidos
     * @access Private
     */
    pedidoRoutes.get(
        '/stats',
        async (c) => await pedidoController.getStats(c)
    );

    /**
     * @route GET /pedidos/:id
     * @desc Buscar pedido por ID
     * @access Private
     */
    pedidoRoutes.get(
        '/:id',
        zValidator('param', idParamSchema),
        async (c) => await pedidoController.getById(c)
    );

    /**
     * @route PUT /pedidos/:id
     * @desc Atualizar pedido
     * @access Private
     */
    pedidoRoutes.put(
        '/:id',
        zValidator('param', idParamSchema),
        zValidator('json', updatePedidoSchema),
        async (c) => await pedidoController.update(c)
    );

    /**
     * @route PATCH /pedidos/:id/status
     * @desc Atualizar status do pedido
     * @access Private (Admin ou proprietário)
     */
    pedidoRoutes.patch(
        '/:id/status',
        zValidator('param', idParamSchema),
        async (c) => await pedidoController.updateStatus(c)
    );

    /**
     * @route DELETE /pedidos/:id
     * @desc Remover pedido
     * @access Private (Admin ou proprietário)
     */
    pedidoRoutes.delete(
        '/:id',
        zValidator('param', idParamSchema),
        async (c) => await pedidoController.delete(c)
    );

    return pedidoRoutes;
}