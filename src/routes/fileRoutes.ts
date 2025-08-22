import { Hono } from 'hono';
import { FileController } from '../controllers/fileController';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware';
import { fileSizeMiddleware, contentTypeMiddleware } from '../middlewares/securityMiddleware';
import { DatabaseClient } from '../lib/database';

export function createFileRoutes(db: DatabaseClient, r2Bucket: R2Bucket, baseUrl: string = '') {
	const fileRoutes = new Hono();
	const fileController = new FileController(db, r2Bucket, baseUrl);

	// Middleware de autenticação para rotas protegidas
	fileRoutes.use('/upload/*', authMiddleware());
	fileRoutes.use('/list', authMiddleware());
	fileRoutes.use('/info/*', authMiddleware());
	fileRoutes.use('/delete/*', authMiddleware());
	fileRoutes.use('/stats', authMiddleware());

	/**
	 * @route POST /files/upload
	 * @desc Upload de um arquivo
	 * @access Private
	 */
	fileRoutes.post(
		'/upload',
		contentTypeMiddleware(['multipart/form-data']),
		fileSizeMiddleware,
		async (c) => await fileController.uploadFile(c),
	);

	/**
	 * @route POST /files/upload/multiple
	 * @desc Upload de múltiplos arquivos
	 * @access Private
	 */
	fileRoutes.post(
		'/upload/multiple',
		contentTypeMiddleware(['multipart/form-data']),
		fileSizeMiddleware,
		async (c) => await fileController.uploadMultipleFiles(c),
	);

	/**
	 * @route GET /files/download/:key
	 * @desc Download de um arquivo
	 * @access Public (com validação de chave)
	 */
	fileRoutes.get('/download/:key', async (c) => await fileController.downloadFile(c));

	/**
	 * @route GET /files/view/:key
	 * @desc Visualização de um arquivo (sem forçar download)
	 * @access Public (com validação de chave)
	 */
	fileRoutes.get('/view/:key', async (c) => await fileController.viewFile(c));

	/**
	 * @route GET /files/list
	 * @desc Lista arquivos do usuário
	 * @access Private
	 */
	fileRoutes.get('/list', async (c) => await fileController.listFiles(c));

	/**
	 * @route GET /files/info/:id
	 * @desc Obtém informações de um arquivo específico
	 * @access Private
	 */
	fileRoutes.get('/info/:id', async (c) => await fileController.getFileInfo(c));

	/**
	 * @route DELETE /files/delete/:id
	 * @desc Remove um arquivo
	 * @access Private
	 */
	fileRoutes.delete('/delete/:id', async (c) => await fileController.deleteFile(c));

	/**
	 * @route GET /files/stats
	 * @desc Obtém estatísticas de uso de arquivos
	 * @access Private
	 */
	fileRoutes.get('/stats', async (c) => await fileController.getStorageStats(c));

	// Rotas administrativas
	fileRoutes.use('/admin/*', roleMiddleware(['ADMIN']));

	/**
	 * @route GET /files/admin/list
	 * @desc Lista todos os arquivos (apenas admin)
	 * @access Private (Admin)
	 */
	fileRoutes.get('/admin/list', async (c) => {
		// Permite que admin veja arquivos de qualquer usuário
		return await fileController.listFiles(c);
	});

	/**
	 * @route GET /files/admin/stats
	 * @desc Obtém estatísticas globais de arquivos (apenas admin)
	 * @access Private (Admin)
	 */
	fileRoutes.get('/admin/stats', async (c) => {
		return await fileController.getStorageStats(c);
	});

	/**
	 * @route DELETE /files/admin/delete/:id
	 * @desc Remove qualquer arquivo (apenas admin)
	 * @access Private (Admin)
	 */
	fileRoutes.delete('/admin/delete/:id', async (c) => await fileController.deleteFile(c));

	return fileRoutes;
}
