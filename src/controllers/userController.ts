import { Context } from 'hono';
import { UserService } from '../services/userService';
import { UserRepository } from '../repositories/userRepository';
import { registerUserSchema, loginUserSchema, updateUserSchema, changePasswordSchema, idParamSchema } from '../validators/userValidator';
import { DatabaseClient } from '../lib/database';

export class UserController {
  private userService: UserService;

  constructor(db: DatabaseClient) {
    const userRepository = new UserRepository(db);
    this.userService = new UserService(userRepository);
  }

  /**
   * Registra um novo usuário
   */
  async register(c: Context) {
    try {
      const body = await c.req.json();
      const validatedData = registerUserSchema.parse(body);

      const result = await this.userService.register(validatedData, c.env);

      return c.json({
        success: true,
        data: {
          user: result.user,
          token: result.token
        },
        message: 'Usuário registrado com sucesso'
      }, 201);
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message || 'Erro interno do servidor'
      }, error.status || 500);
    }
  }

  /**
   * Realiza login do usuário
   */
  async login(c: Context) {
    try {
      const body = await c.req.json();
      const validatedData = loginUserSchema.parse(body);

      const result = await this.userService.login(validatedData, c.env);

      return c.json({
        success: true,
        data: {
          user: result.user,
          token: result.token
        },
        message: 'Login realizado com sucesso'
      });
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message || 'Erro interno do servidor'
      }, error.status || 500);
    }
  }

  /**
   * Obtém perfil do usuário autenticado
   */
  async getProfile(c: Context) {
    try {
      const userId = c.get('user')?.userId;

      if (!userId) {
        return c.json({ error: 'Usuário não autenticado' }, 401);
      }

      const user = await this.userService.getUserById(userId);

      return c.json({
        success: true,
        data: user
      });
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message || 'Erro interno do servidor'
      }, error.status || 500);
    }
  }

  /**
   * Busca usuário por ID (apenas admin)
   */
  async getById(c: Context) {
    try {
      const { id } = idParamSchema.parse({ id: c.req.param('id') });
      const user = await this.userService.getUserById(id);

      return c.json({
        success: true,
        data: user
      });
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message || 'Erro interno do servidor'
      }, error.status || 500);
    }
  }

  /**
   * Lista usuários com paginação (apenas admin)
   */
  async list(c: Context) {
    try {
      const query = c.req.query();
      const page = parseInt(query.page || '1');
      const limit = parseInt(query.limit || '10');
      const search = query.search;
      const ativo = query.ativo === 'true' ? true : query.ativo === 'false' ? false : undefined;

      const result = await this.userService.listUsers(page, limit);

      return c.json({
        success: true,
        data: result.usuarios,
        pagination: result.pagination
      });
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message || 'Erro interno do servidor'
      }, error.status || 500);
    }
  }

  /**
   * Atualiza dados do usuário
   */
  async update(c: Context) {
    try {
      const { id } = idParamSchema.parse({ id: c.req.param('id') });
      const body = await c.req.json();
      const validatedData = updateUserSchema.parse(body);
      const currentUserId = c.get('user')?.userId;
      const userRole = c.get('user')?.role;

      // Usuário só pode atualizar seus próprios dados, exceto admin
      if (userRole !== 'ADMIN' && currentUserId !== id) {
        return c.json({ error: 'Acesso negado' }, 403);
      }

      const user = await this.userService.updateUser(id, validatedData, c.env);

      return c.json({
        success: true,
        data: user,
        message: 'Usuário atualizado com sucesso'
      });
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message || 'Erro interno do servidor'
      }, error.status || 500);
    }
  }

  /**
   * Altera senha do usuário
   */
  async changePassword(c: Context) {
    try {
      const { id } = idParamSchema.parse({ id: c.req.param('id') });
      const body = await c.req.json();
      const validatedData = changePasswordSchema.parse(body);
      const currentUserId = c.get('user')?.userId;
      const userRole = c.get('user')?.role;

      // Usuário só pode alterar sua própria senha, exceto admin
      if (userRole !== 'ADMIN' && currentUserId !== id) {
        return c.json({ error: 'Acesso negado' }, 403);
      }

      await this.userService.changePassword(id, validatedData, c.env);

      return c.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message || 'Erro interno do servidor'
      }, error.status || 500);
    }
  }

  /**
   * Desativa usuário (apenas admin)
   */
  async deactivate(c: Context) {
    try {
      const { id } = idParamSchema.parse({ id: c.req.param('id') });
      const currentUserId = c.get('user')?.userId;

      // Não pode desativar a si mesmo
      if (currentUserId === id) {
        return c.json({ error: 'Não é possível desativar sua própria conta' }, 400);
      }

      await this.userService.deactivateUser(id);

      return c.json({
        success: true,
        message: 'Usuário desativado com sucesso'
      });
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message || 'Erro interno do servidor'
      }, error.status || 500);
    }
  }

  /**
   * Ativa usuário (apenas admin)
   */
  async activate(c: Context) {
    try {
      const { id } = idParamSchema.parse({ id: c.req.param('id') });

      const user = await this.userService.updateUser(id, { ativo: true }, c.env);

      return c.json({
        success: true,
        data: user,
        message: 'Usuário ativado com sucesso'
      });
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message || 'Erro interno do servidor'
      }, error.status || 500);
    }
  }
}