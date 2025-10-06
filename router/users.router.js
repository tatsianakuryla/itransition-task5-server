const { UsersApi } = require("../api/UsersApi");
const usersRouter = require('express').Router();
const { validate } = require('../middlewares/validate');
const {
    LoginSchema,
    RegisterSchema,
    DeleteManySchema,
    UpdateStatusManySchema,
    RefreshSchema
} = require("../schemas/users.schemas");
const { AuthApi } = require('../api/AuthApi');
const { authenticate } = require('../middlewares/authenticate');

usersRouter.post('/login', validate(LoginSchema), UsersApi.login);
usersRouter.post('/register', validate(RegisterSchema), UsersApi.register);
usersRouter.post('/refresh', validate(RefreshSchema), AuthApi.refresh);
usersRouter.get('/', authenticate, UsersApi.getUsers);
usersRouter.delete('/', authenticate, validate(DeleteManySchema), UsersApi.deleteMany);
usersRouter.patch('/', authenticate, validate(UpdateStatusManySchema), UsersApi.updateStatusMany);
usersRouter.delete('/unverified', authenticate, UsersApi.deleteManyUnverified);
usersRouter.post('/logout', authenticate, validate(RefreshSchema), AuthApi.logout);

module.exports = { usersRouter };