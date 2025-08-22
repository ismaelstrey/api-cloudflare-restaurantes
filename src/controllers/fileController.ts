import { Context } from 'hono';
import { FileService, FileUploadOptions } from '../services/fileService';
import { DatabaseClient } from '../lib/database';

export class FileController {
	private fileService: FileService;

	constructor(db: DatabaseClient, r2Bucket: R2Bucket, baseUrl: string = '') {
		this.fileService = new FileService(db, r2Bucket, baseUrl);
	}

	/**
	 * Faz upload de um arquivo
	 */
	async uploadFile(c: Context) {
		try {
			const userId = c.get('user')?.userId;
			if (!userId) {
				return c.json({ error: 'Usuário não autenticado' }, 401);
			}

			const formData = await c.req.formData();
			const file = formData.get('file') as File;

			if (!file) {
				return c.json({ error: 'Nenhum arquivo enviado' }, 400);
			}

			// Configurações de upload baseadas nas variáveis de ambiente
			const maxSize = parseInt(c.env.MAX_FILE_SIZE || '10485760'); // 10MB padrão
			const allowedTypes = (c.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(',');

			const options: FileUploadOptions = {
				maxSize,
				allowedTypes,
				generateUniqueKey: true,
			};

			const uploadedFile = await this.fileService.uploadFile(file, userId.toString(), options);

			return c.json(
				{
					success: true,
					data: uploadedFile,
					message: 'Arquivo enviado com sucesso',
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
	 * Faz upload de múltiplos arquivos
	 */
	async uploadMultipleFiles(c: Context) {
		try {
			const userId = c.get('user')?.userId;
			if (!userId) {
				return c.json({ error: 'Usuário não autenticado' }, 401);
			}

			const formData = await c.req.formData();
			const files: File[] = [];

			// Coleta todos os arquivos do FormData
			for (const [key, value] of formData.entries()) {
				if (key === 'files' && value instanceof File) {
					files.push(value);
				}
			}

			if (files.length === 0) {
				return c.json({ error: 'Nenhum arquivo enviado' }, 400);
			}

			// Configurações de upload
			const maxSize = parseInt(c.env.MAX_FILE_SIZE || '10485760');
			const allowedTypes = (c.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(',');

			const options: FileUploadOptions = {
				maxSize,
				allowedTypes,
				generateUniqueKey: true,
			};

			const uploadedFiles = await this.fileService.uploadMultipleFiles(files, userId.toString(), options);

			return c.json(
				{
					success: true,
					data: uploadedFiles,
					message: `${uploadedFiles.length} arquivo(s) enviado(s) com sucesso`,
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
	 * Faz download de um arquivo
	 */
	async downloadFile(c: Context) {
		try {
			const fileKey = c.req.param('key');
			if (!fileKey) {
				return c.json({ error: 'Chave do arquivo não fornecida' }, 400);
			}

			// Decodificar a chave do arquivo (caso tenha sido encodada na URL)
			const decodedKey = decodeURIComponent(fileKey);

			const file = await this.fileService.getFile(decodedKey);

			if (!file) {
				return c.json({ error: 'Arquivo não encontrado' }, 404);
			}

			// Configurar headers para download
			const headers = new Headers();
			file.writeHttpMetadata(headers);
			headers.set('etag', file.httpEtag);

			// Se houver nome original nos metadados, usar para o download
			const originalName = file.customMetadata?.originalName;
			if (originalName) {
				headers.set('Content-Disposition', `attachment; filename="${originalName}"`);
			}

			return new Response(file.ssecKeyMd5, { headers });
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
	 * Visualiza um arquivo (sem forçar download)
	 */
	async viewFile(c: Context) {
		try {
			const fileKey = c.req.param('key');
			if (!fileKey) {
				return c.json({ error: 'Chave do arquivo não fornecida' }, 400);
			}

			const decodedKey = decodeURIComponent(fileKey);
			const file = await this.fileService.getFile(decodedKey);

			if (!file) {
				return c.json({ error: 'Arquivo não encontrado' }, 404);
			}

			const headers = new Headers();
			file.writeHttpMetadata(headers);
			headers.set('etag', file.httpEtag);

			// Para visualização, não forçar download
			headers.delete('Content-Disposition');

			return new Response(file.ssecKeyMd5, { headers });
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
	 * Lista arquivos do usuário
	 */
	async listFiles(c: Context) {
		try {
			const userId = c.get('user')?.userId;
			const userRole = c.get('user')?.role;

			if (!userId) {
				return c.json({ error: 'Usuário não autenticado' }, 401);
			}

			const query = c.req.query();
			const page = parseInt(query.page || '1');
			const limit = parseInt(query.limit || '10');

			// Admin pode ver arquivos de qualquer usuário
			const targetUserId = userRole === 'ADMIN' && query.userId ? query.userId : userId;

			const result = await this.fileService.listUserFiles(targetUserId.toString(), page, limit);

			return c.json({
				success: true,
				data: result.arquivos,
				pagination: {
					page: result.page,
					limit: result.limit,
					total: result.total,
					totalPages: result.totalPages,
				},
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
	 * Obtém informações de um arquivo específico
	 */
	async getFileInfo(c: Context) {
		try {
			const fileId = c.req.param('id');
			const userId = c.get('user')?.userId;
			const userRole = c.get('user')?.role;

			if (!userId) {
				return c.json({ error: 'Usuário não autenticado' }, 401);
			}

			if (!fileId) {
				return c.json({ error: 'ID do arquivo não fornecido' }, 400);
			}

			const fileInfo = await this.fileService.getFileInfo(fileId, userId.toString(), userRole);

			return c.json({
				success: true,
				data: fileInfo,
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
	 * Remove um arquivo
	 */
	async deleteFile(c: Context) {
		try {
			const fileId = c.req.param('id');
			const userId = c.get('user')?.userId;
			const userRole = c.get('user')?.role;

			if (!userId) {
				return c.json({ error: 'Usuário não autenticado' }, 401);
			}

			if (!fileId) {
				return c.json({ error: 'ID do arquivo não fornecido' }, 400);
			}

			await this.fileService.deleteFile(fileId, userId.toString(), userRole);

			return c.json({
				success: true,
				message: 'Arquivo removido com sucesso',
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
	 * Obtém estatísticas de uso de arquivos
	 */
	async getStorageStats(c: Context) {
		try {
			const userId = c.get('user')?.userId;
			const userRole = c.get('user')?.role;

			if (!userId) {
				return c.json({ error: 'Usuário não autenticado' }, 401);
			}

			// Admin pode ver estatísticas globais, usuário comum só as próprias
			const targetUserId = userRole === 'ADMIN' ? undefined : userId;

			const stats = await this.fileService.getStorageStats(targetUserId?.toString());

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
