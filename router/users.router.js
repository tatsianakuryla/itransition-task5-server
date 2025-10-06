const { UsersApi } = require("../api/UsersApi");
const usersRouter = require('express').Router();
const { validate } = require('../middlewares/validate');
const {
    LoginSchema,
    RegisterSchema,
    DeleteManySchema,
    UpdateStatusManySchema,
} = require("../schemas/users.schemas");

usersRouter.get('/', UsersApi.getUsers);
usersRouter.post('/login', validate(LoginSchema), UsersApi.login);
usersRouter.post('/register', validate(RegisterSchema), UsersApi.register);
usersRouter.delete('/', validate(DeleteManySchema), UsersApi.deleteMany);
usersRouter.patch('/', validate(UpdateStatusManySchema), UsersApi.updateStatusMany);
usersRouter.delete('/unverified', UsersApi.deleteManyUnverified);

module.exports = { usersRouter };