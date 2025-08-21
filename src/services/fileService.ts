import { DatabaseClient } from '../lib/database';

export interface FileUploadOptions {
  maxSize: number;
  allowedTypes: string[];
  generateUniqueKey?: boolean;
}

export interface UploadedFile {
  id: string;
  nomeOriginal: string;
  nomeArquivo: string;
  tamanho: number;
  tipo: string;
  url: string;
  usuarioId: string;
  criadoEm: Date;
}

export class FileService {
  private db: DatabaseClient;
  private r2Bucket: R2Bucket;
  private baseUrl: string;

  constructor(db: DatabaseClient, r2Bucket: R2Bucket, baseUrl: string = '') {
    this.db = db;
    this.r2Bucket = r2Bucket;
    this.baseUrl = baseUrl;
  }

  /**
   * Valida se o arquivo atende aos critérios estabelecidos
   */
  private validateFile(file: File, options: FileUploadOptions): void {
    // Validar tamanho
    if (file.size > options.maxSize) {
      throw new Error(`Arquivo muito grande. Tamanho máximo: ${this.formatFileSize(options.maxSize)}`);
    }

    // Validar tipo
    if (!options.allowedTypes.includes(file.type)) {
      throw new Error(`Tipo de arquivo não permitido. Tipos aceitos: ${options.allowedTypes.join(', ')}`);
    }

    // Validar se o arquivo não está vazio
    if (file.size === 0) {
      throw new Error('Arquivo está vazio');
    }
  }

  /**
   * Gera uma chave única para o arquivo
   */
  private generateFileKey(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `uploads/${userId}/${timestamp}-${random}.${extension}`;
  }

  /**
   * Formata o tamanho do arquivo para exibição
   */
  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Faz upload de um arquivo para o R2
   */
  async uploadFile(
    file: File,
    userId: string,
    options: FileUploadOptions
  ): Promise<UploadedFile> {
    try {
      // Validar arquivo
      this.validateFile(file, options);

      // Gerar chave única
      const fileKey = options.generateUniqueKey !== false
        ? this.generateFileKey(file.name, userId)
        : `uploads/${userId}/${file.name}`;

      // Upload para R2
      await this.r2Bucket.put(fileKey, file.stream(), {
        httpMetadata: {
          contentType: file.type,
          contentDisposition: `attachment; filename="${file.name}"`
        },
        customMetadata: {
          originalName: file.name,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString()
        }
      });

      // Salvar informações no banco de dados
      const arquivo = await this.db.arquivo.create({
        data: {

          nome: fileKey,
          tamanho: file.size,
          tipo: file.type,
          url: `${this.baseUrl}/files/${fileKey}`,
        }
      });

      return {
        id: arquivo.id,
        nomeOriginal: arquivo.nomeOriginal,
        nomeArquivo: arquivo.nomeArquivo,
        tamanho: arquivo.tamanho,
        tipo: arquivo.tipo,
        url: arquivo.url,
        usuarioId: arquivo.usuarioId,
        criadoEm: arquivo.criadoEm
      };
    } catch (error: any) {
      throw new Error(`Erro no upload: ${error.message}`);
    }
  }

  /**
   * Faz upload de múltiplos arquivos
   */
  async uploadMultipleFiles(
    files: File[],
    userId: string,
    options: FileUploadOptions
  ): Promise<UploadedFile[]> {
    const uploadPromises = files.map(file =>
      this.uploadFile(file, userId, options)
    );

    try {
      return await Promise.all(uploadPromises);
    } catch (error: any) {
      throw new Error(`Erro no upload múltiplo: ${error.message}`);
    }
  }

  /**
   * Obtém um arquivo do R2
   */
  async getFile(fileKey: string): Promise<R2Object | null> {
    try {
      return await this.r2Bucket.get(fileKey);
    } catch (error: any) {
      throw new Error(`Erro ao buscar arquivo: ${error.message}`);
    }
  }

  /**
   * Remove um arquivo do R2 e do banco de dados
   */
  async deleteFile(fileId: string, userId: string, userRole: string = 'USER'): Promise<void> {
    try {
      // Buscar arquivo no banco
      const arquivo = await this.db.arquivo.findUnique({
        where: { id: fileId }
      });

      if (!arquivo) {
        throw new Error('Arquivo não encontrado');
      }

      // Verificar permissão
      if (userRole !== 'ADMIN' && arquivo.usuarioId !== userId) {
        throw new Error('Sem permissão para deletar este arquivo');
      }

      // Remover do R2
      await this.r2Bucket.delete(arquivo.nomeArquivo);

      // Remover do banco de dados
      await this.db.arquivo.delete({
        where: { id: fileId }
      });
    } catch (error: any) {
      throw new Error(`Erro ao deletar arquivo: ${error.message}`);
    }
  }

  /**
   * Lista arquivos do usuário
   */
  async listUserFiles(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    arquivos: UploadedFile[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [arquivos, total] = await Promise.all([
        this.db.arquivo.findMany({
          where: { usuarioId },
          orderBy: { criadoEm: 'desc' },
          skip,
          take: limit
        }),
        this.db.arquivo.count({
          where: { usuarioId }
        })
      ]);

      return {
        arquivos: arquivos.map(arquivo => ({
          id: arquivo.id,
          nomeOriginal: arquivo.nomeOriginal,
          nomeArquivo: arquivo.nomeArquivo,
          tamanho: arquivo.tamanho,
          tipo: arquivo.tipo,
          url: arquivo.url,
          usuarioId: arquivo.usuarioId,
          criadoEm: arquivo.criadoEm
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`Erro ao listar arquivos: ${error.message}`);
    }
  }

  /**
   * Obtém informações de um arquivo específico
   */
  async getFileInfo(fileId: string, userId: string, userRole: string = 'USER'): Promise<UploadedFile> {
    try {
      const arquivo = await this.db.arquivo.findUnique({
        where: { id: fileId }
      });

      if (!arquivo) {
        throw new Error('Arquivo não encontrado');
      }

      // Verificar permissão
      if (userRole !== 'ADMIN' && arquivo.usuarioId !== userId) {
        throw new Error('Sem permissão para acessar este arquivo');
      }

      return {
        id: arquivo.id,
        nomeOriginal: arquivo.nomeOriginal,
        nomeArquivo: arquivo.nomeArquivo,
        tamanho: arquivo.tamanho,
        tipo: arquivo.tipo,
        url: arquivo.url,
        usuarioId: arquivo.usuarioId,
        criadoEm: arquivo.criadoEm
      };
    } catch (error: any) {
      throw new Error(`Erro ao buscar informações do arquivo: ${error.message}`);
    }
  }

  /**
   * Obtém estatísticas de uso de arquivos
   */
  async getStorageStats(userId?: string): Promise<{
    totalFiles: number;
    totalSize: number;
    averageSize: number;
    typeDistribution: Record<string, number>;
  }> {
    try {
      const whereClause = userId ? { usuarioId: userId } : {};

      const arquivos = await this.db.arquivo.findMany({
        where: whereClause,
        select: {
          tamanho: true,
          tipo: true
        }
      });

      const totalFiles = arquivos.length;
      const totalSize = arquivos.reduce((sum, arquivo) => sum + arquivo.tamanho, 0);
      const averageSize = totalFiles > 0 ? totalSize / totalFiles : 0;

      const typeDistribution = arquivos.reduce((acc, arquivo) => {
        acc[arquivo.tipo] = (acc[arquivo.tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalFiles,
        totalSize,
        averageSize,
        typeDistribution
      };
    } catch (error: any) {
      throw new Error(`Erro ao obter estatísticas: ${error.message}`);
    }
  }
}