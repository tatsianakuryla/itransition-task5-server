const jwt = require("jsonwebtoken");
const { add } = require('date-fns');
const { randomUUID } = require('node:crypto');
const { prisma } = require('../db/db');

/**
 * IMPORTANT: Manages JWT tokens and email activation tokens
 * NOTE: Handles creation, verification, and revocation of tokens
 */
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

    /**
     * NOTE: Creates signed JWT access token for user
     */
    static signAccessToken(userId) {
        return jwt.sign({ sub: String(userId) }, this.#ACCESS_SECRET, { expiresIn: this.#ACCESS_EXPIRES_IN });
    }

    /**
     * NOTE: Verifies and decodes JWT access token
     */
    static verifyAccessToken(token) {
        return jwt.verify(token, this.#ACCESS_SECRET);
    }

    /**
     * NOTE: Parses time duration string into date-fns format
     */
    static parseValue(value) {
        const match = String(value).trim().match(/^(\d+)\s*([smhd])$/i);
        if (!match) return { days: 7 };
        const amount = Number(match[1]);
        const unitChar = match[2].toLowerCase();
        const unitKey = this.#UNIT_MAP[unitChar];
        return { [unitKey]: amount };
    }

    /**
     * IMPORTANT: Creates email activation token for user verification
     * NOTE: Token is stored in database with expiration time
     */
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

    /**
     * IMPORTANT: Verifies email activation token
     * NOTE: Checks if token exists, not used, and not expired
     */
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

    /**
     * NOTE: Marks activation token as used to prevent reuse
     */
    static async markActivationTokenAsUsed(token) {
        await prisma.activationToken.update({
            where: { token },
            data: { usedAt: new Date() }
        });
    }

    /**
     * NOTE: Deletes activation token from database
     */
    static async deleteActivationToken(token) {
        await prisma.activationToken.delete({
            where: { token }
        });
    }

    /**
     * NOTE: Cleanup job to remove expired or used activation tokens
     */
    static async deleteExpiredActivationTokens() {
        await prisma.activationToken.deleteMany({
            where: { OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }] }
        });
    }

    /**
     * IMPORTANT: Creates JWT refresh token and stores it in database
     * NOTE: Token contains unique JTI for revocation tracking
     */
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

    /**
     * NOTE: Verifies and decodes JWT refresh token
     */
    static verifyRefreshToken(token) {
        return jwt.verify(token, this.#REFRESH_SECRET);
    }

    /**
     * NOTE: Checks if refresh token is valid (exists, not revoked, not expired)
     */
    static async isRefreshTokenValid(jti) {
        const refreshToken = await prisma.refreshToken.findUnique({ 
            where: { jti } 
        });
        return !!refreshToken && !refreshToken.revoked && refreshToken.expiresAt > new Date();
    }

    /**
     * NOTE: Revokes single refresh token
     */
    static async revokeRefreshToken(jti) {
        await prisma.refreshToken.updateMany({ where: { jti }, data: { revoked: true } });
    }

    /**
     * IMPORTANT: Revokes all user's refresh tokens
     * NOTA BENE: Used when blocking users to force logout
     */
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