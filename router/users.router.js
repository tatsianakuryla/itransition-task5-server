const { Api } = require("../api/api");
const router = require('express').Router();
const validate = require('../middlewares/validate');
const IdsSchema = require("../schemas/user.schemas");
const LoginSchema = require('../schemas/user.schemas').LoginSchema;
const RegisterSchema = require('../schemas/user.schemas').RegisterSchema;

router.get('/', (request, response) => {
    response.json({
        status: 'success',
        time: new Intl.DateTimeFormat('en-US', {
            month: '2-digit',
            year: 'numeric',
            day: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour: '2-digit',
        }).format(new Date()),
    });
});

router.get('/users', Api.getUsers);
router.post('/users/login', validate(LoginSchema), Api.login);
router.post('/users/register', validate(RegisterSchema), Api.register);
router.delete('/users', validate(IdsSchema), Api.deleteMany);
router.patch('/users', validate(UpdateStatusManySchema), Api.updateStatusMany);
router.delete('/users/unverified', validate(IdsSchema), Api.deleteManyUnverified);