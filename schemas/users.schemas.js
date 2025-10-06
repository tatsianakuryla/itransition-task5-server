const zod = require('zod');

const Name = zod.string().trim().min(1, 'Name is required');
const Email = zod.string()
    .trim()
    .min(1, "Email is required")
    .email("Wrong email format")
    .transform((value) => (value).toLowerCase());
const Password = zod.string().trim().min(1, 'Password is required');

const Id = zod.coerce.number().int().positive().finite();

const Ids = zod
    .array(Id)
    .nonempty("Need to pass at least one id")
    .refine((arr) => new Set(arr).size === arr.length, "ID must be unique");

const StatusEnum = zod.enum(["ACTIVE", "BLOCKED", "UNVERIFIED"]);

const LoginSchema = zod.object({
    email: Email,
    password: Password,
});

const RegisterSchema = zod.object({
    name: Name,
    email: Email,
    password: Password,
});

const DeleteManySchema = zod.object({
    ids: Ids,
});

const UpdateStatusManySchema = zod.object({
    ids: Ids,
    status: StatusEnum,
});

module.exports = {
    LoginSchema,
    RegisterSchema,
    DeleteManySchema,
    UpdateStatusManySchema,
};