const { UsersController } = require("../controllers/users.controller");
const usersRouter = require('express').Router();
const { validate } = require('../shared/middlewares/validate');
const {
    LoginSchema,
    RegisterSchema,
    DeleteManySchema,
    UpdateStatusManySchema,
    RefreshSchema
} = require("../shared/schemas/users.schemas");
const { AuthController } = require('../controllers/auth.controller');
const { authenticate } = require('../shared/middlewares/authenticate');
const { authenticateToken } = require('../shared/middlewares/authenticateToken');

usersRouter.post('/login', validate(LoginSchema), UsersController.login);
usersRouter.post('/register', validate(RegisterSchema), UsersController.register);
usersRouter.post('/refresh', validate(RefreshSchema), AuthController.refresh);
usersRouter.get('/activate/:token', UsersController.activateAccount);
usersRouter.get('/me', authenticate, UsersController.getCurrentUser);
usersRouter.get('/', authenticate, UsersController.getUsers);
usersRouter.delete('/', authenticate, validate(DeleteManySchema), UsersController.deleteMany);
usersRouter.patch('/', authenticate, validate(UpdateStatusManySchema), UsersController.updateStatusMany);
usersRouter.delete('/unverified', authenticate, UsersController.deleteManyUnverified);
usersRouter.post('/logout', authenticateToken, validate(RefreshSchema), AuthController.logout);

module.exports = { usersRouter };