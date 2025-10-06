const { Security } = require("../security/Security");
const { UNIQUE_VALUE_ERROR_CODE } = require("../constants/constants");
const { prisma } = require('../db');
const { UsersTokenManager } = require('./UsersTokenManager');

class UsersApi {
    static getUsers = async (request, response) => {
        try {
            const users = await prisma.user.findMany({
                select: { name: true, email: true, status: true, id: true, registrationTime: true },
            });
            response.json(users);
        } catch (error) {
            response.status(500).json({error: error.message});
        }
    }

    static login = async (request, response) => {
        try {
            const { email, password } = request.body;
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) return response.status(401).json({ error: "Invalid email or password" });
            if (user.status === "BLOCKED") return response.status(403).json({ error: "The user is blocked" });
            if (user.status === "UNVERIFIED") return response.status(403).json({ error: "Email not verified" });
            const ok = await Security.verifyPassword(password, user.password);
            if (!ok) return response.status(401).json({ error: "Invalid email or password" });
            const { accessToken, refreshToken } = await UsersTokenManager.getTokens(user.id);
            response.json({
                user: { id: user.id, name: user.name, email: user.email, status: user.status },
                accessToken,
                refreshToken,
            });
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }

    static register = async (request, response) => {
        try {
            const { name, email, password } = request.body;
            const passwordHash = await Security.hashPassword(password);
            const user = await prisma.user.create({
                data: { name, email, password: passwordHash },
                select: { id: true, name: true, email: true, status: true, registrationTime: true },
            });
            const { accessToken, refreshToken } = await UsersTokenManager.getTokens(user.id);
            response.status(201).json({ user, accessToken, refreshToken });
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