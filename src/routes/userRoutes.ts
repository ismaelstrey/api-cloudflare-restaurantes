import { Hono } from 'hono';
import { UserController } from '../controllers/userController';
import { authMiddleware, roleMiddleware, optionalAuthMiddleware } from '../middlewares/authMiddleware';
import { zValidator } from '@hono/zod-validator';
import { registerUserSchema, loginUserSchema, updateUserSchema, changePasswordSchema, idParamSchema } from '../validators/userValidator';
import { DatabaseClient } from '../lib/database';

export function createUserRoutes(db: DatabaseClient) {
  const userRoutes = new Hono();
  const userController = new UserController(db);

  /**
   * @route POST /users/register
   * @desc Registrar novo usuário
   * @access Public
   */
  userRoutes.post(
    '/register',
    zValidator('json', registerUserSchema),
    async (c) => await userController.register(c)
  );

  /**
   * @route POST /users/login
   * @desc Login do usuário
   * @access Public
   */
  userRoutes.post(
    '/login',
    zValidator('json', loginUserSchema),
    async (c) => await userController.login(c)
  );

  /**
   * @route GET /users/profile
   * @desc Obter perfil do usuário autenticado
   * @access Private
   */
  userRoutes.get(
    '/profile',
    authMiddleware,
    async (c) => await userController.getProfile(c)
  );

  /**
   * @route PUT /users/profile
   * @desc Atualizar perfil do usuário autenticado
   * @access Private
   */
  userRoutes.put(
    '/profile',
    authMiddleware,
    zValidator('json', updateUserSchema),
    async (c) => {
      // Pega o ID do usuário autenticado
      const userId = c.get('user')?.id;
      if (!userId) {
        return c.json({ error: 'Usuário não autenticado' }, 401);
      }
      
      // Define o ID no parâmetro para reutilizar o método update
      c.req.param = () => userId;
      return await userController.update(c);
    }
  );

  /**
   * @route PATCH /users/profile/password
   * @desc Alterar senha do usuário autenticado
   * @access Private
   */
  userRoutes.patch(
    '/profile/password',
    authMiddleware,
    zValidator('json', changePasswordSchema),
    async (c) => {
      // Pega o ID do usuário autenticado
      const userId = c.get('user')?.id;
      if (!userId) {
        return c.json({ error: 'Usuário não autenticado' }, 401);
      }
      
      // Define o ID no parâmetro para reutilizar o método changePassword
      c.req.param = () => userId;
      return await userController.changePassword(c);
    }
  );

  // Rotas administrativas - requerem autenticação e role ADMIN
  userRoutes.use('/admin/*', authMiddleware, roleMiddleware(['ADMIN']));

  /**
   * @route GET /users/admin
   * @desc Listar usuários (apenas admin)
   * @access Private (Admin)
   */
  userRoutes.get(
    '/admin',
    async (c) => await userController.list(c)
  );

  /**
   * @route GET /users/admin/:id
   * @desc Buscar usuário por ID (apenas admin)
   * @access Private (Admin)
   */
  userRoutes.get(
    '/admin/:id',
    zValidator('param', idParamSchema),
    async (c) => await userController.getById(c)
  );

  /**
   * @route PUT /users/admin/:id
   * @desc Atualizar usuário (apenas admin)
   * @access Private (Admin)
   */
  userRoutes.put(
    '/admin/:id',
    zValidator('param', idParamSchema),
    zValidator('json', updateUserSchema),
    async (c) => await userController.update(c)
  );

  /**
   * @route PATCH /users/admin/:id/password
   * @desc Alterar senha de usuário (apenas admin)
   * @access Private (Admin)
   */
  userRoutes.patch(
    '/admin/:id/password',
    zValidator('param', idParamSchema),
    zValidator('json', changePasswordSchema),
    async (c) => await userController.changePassword(c)
  );

  /**
   * @route PATCH /users/admin/:id/deactivate
   * @desc Desativar usuário (apenas admin)
   * @access Private (Admin)
   */
  userRoutes.patch(
    '/admin/:id/deactivate',
    zValidator('param', idParamSchema),
    async (c) => await userController.deactivate(c)
  );

  /**
   * @route PATCH /users/admin/:id/activate
   * @desc Ativar usuário (apenas admin)
   * @access Private (Admin)
   */
  userRoutes.patch(
    '/admin/:id/activate',
    zValidator('param', idParamSchema),
    async (c) => await userController.activate(c)
  );

  return userRoutes;
}