import { z } from "zod";

const Name = z.string().trim().min(1, 'Name is required');
const Email = z.string().trim().email('Wrong email format').transform(v => v.toLowerCase()).min(3, 'Email is required');
const Password = z.string().trim().min(1, 'Password is required');

const userSchema = z.object({
    name: Name,
    email: Email,
    password: Password,
});

const Id = z.coerce.number().int().positive();

const IdsSchema = z
    .array(Id)
    .nonempty("Need to pass at least one id")
    .refine(arr => new Set(arr).size === arr.length, "ID must be unique");

const StatusEnum = z.enum(["ACTIVE", "BLOCKED", "UNVERIFIED"]);

const LoginSchema = z.object({
    email: Email,
    password: Password,
});

const RegisterSchema = z.object({
    name: Name,
    email: Email,
    password: Password,
});

const DeleteManySchema = z.object({
    ids: IdsSchema,
});

const UpdateStatusManySchema = z.object({
    ids: IdsSchema,
    status: StatusEnum,
});

exports.userSchema = userSchema;
exports.Id = Id;
exports.IdsArray = IdsSchema;
exports.StatusEnum = StatusEnum;
exports.LoginSchema = LoginSchema;
exports.RegisterSchema = RegisterSchema;
exports.DeleteManySchema = DeleteManySchema;
exports.UpdateStatusManySchema = UpdateStatusManySchema;