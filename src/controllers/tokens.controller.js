const jwt = require("jsonwebtoken");
const { add } = require('date-fns');
const { randomUUID } = require('node:crypto');
const { prisma } = require('../db/db');

class TokensController {
    static #UNIT_MAP = {
        s: 'seconds',
        m: 'minutes',
        h: 'hours',
        d: 'days',
    };
    static #ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRES_IN || '30m';
    static #REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d';
    static #ACTIVATION_EXPIRES_IN = process.env.ACTIVATION_EXPIRES_IN || '24h';
    static #ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
    static #REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

    static signAccessToken(userId) {
        return jwt.sign({ sub: String(userId) }, this.#ACCESS_SECRET, { expiresIn: this.#ACCESS_EXPIRES_IN });
    }

    static verifyAccessToken(token) {
        return jwt.verify(token, this.#ACCESS_SECRET);
    }

    static parseValue(value) {
        const match = String(value).trim().match(/^(\d+)\s*([smhd])$/i);
        if (!match) return { days: 7 };
        const amount = Number(match[1]);
        const unitChar = match[2].toLowerCase();
        const unitKey = this.#UNIT_MAP[unitChar];
        return { [unitKey]: amount };
    }

    static async createActivationToken(userId) {
        const token = randomUUID();
        const expiresAt = add(new Date(), this.parseValue(this.#ACTIVATION_EXPIRES_IN));
        await prisma.activationToken.create({ 
            data: { 
                token, 
                userId: Number(userId), 
                expiresAt 
            } 
        });
        return token;
    }

    static async verifyActivationToken(token) {
        const activationToken = await prisma.activationToken.findUnique({
            where: { token },
            include: { user: true }
        });
        if (!activationToken) {
            return { valid: false, error: 'Token not found' };
        }
        if (activationToken.usedAt) {
            return { valid: false, error: 'Token already used' };
        }
        if (new Date() > activationToken.expiresAt) {
            return { valid: false, error: 'Token expired' };
        }
        return { valid: true, userId: activationToken.userId, user: activationToken.user };
    }

    static async markActivationTokenAsUsed(token) {
        await prisma.activationToken.update({
            where: { token },
            data: { usedAt: new Date() }
        });
    }

    static async deleteActivationToken(token) {
        await prisma.activationToken.delete({
            where: { token }
        });
    }

    static async deleteExpiredActivationTokens() {
        await prisma.activationToken.deleteMany({
            where: { OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }] }
        });
    }

    static async signRefreshToken(userId) {
        const jti = randomUUID();
        const token = jwt.sign({ sub: String(userId), jti }, this.#REFRESH_SECRET, { expiresIn: this.#REFRESH_EXPIRES_IN });
        const expiresAt = add(new Date(), this.parseValue(this.#REFRESH_EXPIRES_IN));
        await prisma.refreshToken.create({ 
            data: { 
                jti, 
                userId: Number(userId), 
                expiresAt
            } 
        });
        return token;
    }

    static verifyRefreshToken(token) {
        return jwt.verify(token, this.#REFRESH_SECRET);
    }

    static async isRefreshTokenValid(jti) {
        const refreshToken = await prisma.refreshToken.findUnique({ 
            where: { jti } 
        });
        return !!refreshToken && !refreshToken.revoked && refreshToken.expiresAt > new Date();
    }

    static async revokeRefreshToken(jti) {
        await prisma.refreshToken.updateMany({ where: { jti }, data: { revoked: true } });
    }

    static async revokeAllUserRefreshTokens(userId) {
        await prisma.refreshToken.updateMany({
            where: { 
                userId: Number(userId)
            },
            data: { revoked: true }
        });
    }
}

module.exports = { TokensController };