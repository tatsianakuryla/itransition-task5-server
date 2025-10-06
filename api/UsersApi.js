const { Hash } = require("../hash/Hash");
const { UNIQUE_VALUE_ERROR_CODE } = require("../constants/constants");
const { prisma } = require('../db');

class UsersApi {
    static getUsers = async (request, response) => {
        try {
            const users = await prisma.user.findMany({
                select: { name: true, email: true, status: true, id: true, registrationTime: true },
            });
            response.json(users);
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }

    static login = async (request, response) => {
        try {
            const { email, password } = request.body;
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return response.status(401).json({ error: "Invalid email or password" });
            }
            if (user.status === "BLOCKED") {
                return response.status(403).json({ error: "The user is blocked" });
            }
            if (user.password !== Hash.get(password)) {
                return response.status(401).json({ error: "Invalid email or password" });
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
            const created = await prisma.user.create({
                data: { name, email, password: passwordHash },
                select: { name: true, email: true, registrationTime: true },
            });
            response.status(201).json(created);
        } catch (error) {
            if (error.code === UNIQUE_VALUE_ERROR_CODE) {
                response.status(409).json({ error: 'User with such an email already exists' });
            } else {
                response.status(500).json({error: error.message});
            }
        }
    }

    static deleteMany = async (request, response) => {
        try {
            const { ids } = request.body;
            const { count } = await prisma.user.deleteMany({ where: { id: { in: ids } } });
            response.json({ message: 'Successfully deleted', count });
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }

    static deleteManyUnverified = async (request, response) => {
        try {
            const { count } = await prisma.user.deleteMany({ where: { status: "UNVERIFIED" } });
            response.json({ message: 'Successfully deleted', count });
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }

    static updateStatusMany = async (request, response) => {
        try {
            const { ids, status } = request.body;
            const { count } = await prisma.user.updateMany({
                where: { id: { in: ids } },
                data: { status },
            });
            response.json({ message: 'Successfully updated', count });
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }
}

module.exports = { UsersApi };