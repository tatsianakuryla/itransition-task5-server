const { PrismaClient } = require('@prisma/client');
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
}

exports.Api = Api;