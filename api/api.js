const { PrismaClient } = require('@prisma/client');
const { Hash } = require("../hash/hash");
const { UNIQUE_VALUE_ERROR_CODE } = require("../constants/constants");
const prisma = new PrismaClient();

class Api {
    static getUsers = async (request, response) => {
        try {
            const users = await prisma.user.findMany();
            response.json(users);
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }

    static login = async (request, response) => {
        try {
            const { email, password } = request.body;
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user || user.password !== Hash.get(password)) {
                return response.status(401).json({ error: 'Invalid email or password' });
            }
            response.json({ message: 'Login successful' });
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }

    static register = async (request, response) => {
        const { name, email, password } = request.body;
        const passwordHash = Hash.get(password);
        try {
            const register = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: passwordHash
                }
            });
            response.json(register);
        } catch (error) {
            if (error.code === UNIQUE_VALUE_ERROR_CODE) {
                response.status(409).json({ error: 'User with such an email already exists' });
            } else {
                response.status(500).json({error: error.message});
            }
        }
    }
}

exports.Api = Api;