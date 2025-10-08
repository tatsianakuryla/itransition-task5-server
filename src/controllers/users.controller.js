const { Security } = require("../security/hash");
const { UNIQUE_VALUE_ERROR_CODE } = require("../shared/constants/constants");
const { prisma } = require('../db/db');
const { UsersTokenManager } = require('../security/jwt');
const { TokensController } = require('./tokens.controller');
const { Mailer } = require('../infra/mailer/mailer');

class UsersController {
    /**
     * Retrieves the authenticated user's profile information.
     * Requires valid JWT token in Authorization header.
     *
     */
    static getCurrentUser = async (request, response) => {
        try {
            const userId = Number(request.userId);
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, name: true, email: true, status: true, registrationTime: true }
            });
            if (!user) {
                return response.status(404).json({ error: 'User not found' });
            }
            response.json(user);
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }

    /**
     * Retrieves all users with optional sorting.
     * Accessible only to authenticated users.
     * Sorting is performed at database level for optimal performance.
     */
    static getUsers = async (request, response) => {
        try {
            const { sortBy = 'registrationTime', order = 'desc' } = request.query;
            // Whitelist of sortable fields to prevent SQL injection
            const allowedFields = ['name', 'email', 'status', 'registrationTime', 'lastLoginTime'];
            const sortField = allowedFields.includes(sortBy) ? sortBy : 'registrationTime';
            const sortOrder = order.toLowerCase() === 'asc' ? 'asc' : 'desc';
            const users = await prisma.user.findMany({
                select: { name: true, email: true, status: true, id: true, registrationTime: true, lastLoginTime: true },
                orderBy: { [sortField]: sortOrder }
            });
            response.json(users);
        } catch (error) {
            response.status(500).json({error: error.message});
        }
    }

    /**
     * Authenticates user and returns JWT tokens.
     * Blocked users are denied access.
     * Updates lastLoginTime on successful authentication.
     */
    static login = async (request, response) => {
        try {
            const { email, password } = request.body;
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) return response.status(401).json({ error: "Invalid email or password" });
            // Prevent blocked users from authenticating
            if (user.status === "BLOCKED") return response.status(403).json({ error: "The user is blocked" });
            const ok = await Security.verifyPassword(password, user.password);
            if (!ok) return response.status(401).json({ error: "Invalid email or password" });

            // Update last login timestamp
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginTime: new Date() }
            });
            
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

    /**
     * Registers a new user account.
     * Email uniqueness is enforced by database unique constraint.
     * User is registered immediately and can login before email verification.
     * Activation email is sent asynchronously without blocking the response.
     */
    static register = async (request, response) => {
        try {
            const { name, email, password } = request.body;
            const passwordHash = await Security.hashPassword(password);
            // Database unique index ensures email uniqueness
            const user = await prisma.user.create({
                data: { name, email, password: passwordHash },
                select: { id: true, name: true, email: true, status: true, registrationTime: true },
            });
            const activationToken = await TokensController.createActivationToken(user.id);
            // Send activation email asynchronously
            await Mailer.sendActivationEmail(user.email, user.name, activationToken);
            const { accessToken, refreshToken } = await UsersTokenManager.getTokens(user.id);
            response.status(201).json({ 
                user, 
                accessToken, 
                refreshToken,
                message: 'Registration successful. Please check your email to activate your account.'
            });
        } catch (error) {
            // Handle unique constraint violation for duplicate emails
            if (error.code === UNIQUE_VALUE_ERROR_CODE) {
                response.status(409).json({ error: 'User with such an email already exists' });
            } else {
                response.status(500).json({error: error.message});
            }
        }
    }

    /**
     * Permanently deletes multiple users from the database.
     * This is a hard delete, not a soft delete (no marking as deleted).
     * Associated tokens are automatically deleted via CASCADE constraint.
     */
    static deleteMany = async (request, response) => {
        try {
            const { ids } = request.body;
            // Permanent deletion from database
            const { count } = await prisma.user.deleteMany({ where: { id: { in: ids } } });
            response.json({ message: 'Successfully deleted', count });
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }

    /**
     * Deletes all users with UNVERIFIED status.
     * Useful for cleaning up accounts that never completed email verification.
     */
    static deleteManyUnverified = async (request, response) => {
        try {
            const { count } = await prisma.user.deleteMany({ where: { status: "UNVERIFIED" } });
            response.json({ message: 'Successfully deleted', count });
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }

    /**
     * Updates status for multiple users (ACTIVE or BLOCKED).
     * When blocking users, all their refresh tokens are revoked to force logout.
     * Status changes are conditional to prevent accidental toggles.
     */
    static updateStatusMany = async (request, response) => {
        try {
            const { ids, status } = request.body;
            const whereClause = { id: { in: ids } };
            // Conditional update to prevent unintended status changes
            if (status === 'ACTIVE') {
                whereClause.status = 'BLOCKED';
            } else if (status === 'BLOCKED') {
                whereClause.status = { not: 'BLOCKED' };
            }
            // Revoke all tokens to immediately terminate blocked users' sessions
            if (status === 'BLOCKED') {
                for (const id of ids) {
                    await TokensController.revokeAllUserRefreshTokens(id);
                }
            }
            const { count } = await prisma.user.updateMany({
                where: whereClause,
                data: { status },
            });
            response.json({ message: 'Successfully updated', count });
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }

    /**
     * Activates user account via email verification link.
     * Changes status from UNVERIFIED to ACTIVE.
     * Blocked users remain blocked even after activation.
     */
    static activateAccount = async (request, response) => {
        const frontendUrl = process.env.FRONTEND_ACTIVATION_URL || 'http://localhost:3000';
        try {
            const { token } = request.params;
            const result = await TokensController.verifyActivationToken(token);
            if (!result.valid) {
                return response.redirect(`${frontendUrl}/activation-failed?error=${encodeURIComponent(result.error)}`);
            }
            // Update user status to ACTIVE
            await prisma.user.update({
                where: { id: result.userId },
                data: { status: 'ACTIVE' }
            });
            await TokensController.markActivationTokenAsUsed(token);
            response.redirect(`${frontendUrl}/activation-success`);
        } catch (error) {
            response.redirect(`${frontendUrl}/activation-failed?error=${encodeURIComponent(error.message)}`);
        }
    }
}

module.exports = { UsersController };