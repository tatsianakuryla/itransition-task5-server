const { PrismaClient } = require('@prisma/client');
const { Hash } = require("../hash/hash");
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
}

exports.Api = Api;