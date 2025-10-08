const { TokensController } = require('../../controllers/tokens.controller');
const { prisma } = require('../../db/db');

/**
 * Authentication middleware for protected routes.
 * Validates JWT token and verifies user exists and is not blocked.
 * Used on all endpoints except login and registration.
 * Blocked or deleted users receive 403/401 error and are redirected to login by frontend.
 *
 */
const authenticate = async (request, response, next) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return response.status(401).json({ error: 'Access token required' });
    }
    const token = authHeader.substring(7);
    try {
        const { sub } = TokensController.verifyAccessToken(token);
        // Verify user still exists in database
        const user = await prisma.user.findUnique({ 
            where: { id: Number(sub) },
            select: { id: true, status: true }
        });
        if (!user) {
            return response.status(401).json({ error: 'User not found' });
        }
        // Deny access to blocked users
        if (user.status === 'BLOCKED') {
            return response.status(403).json({ error: 'User is blocked' });
        }
        request.userId = sub;
        next();
    } catch {
        return response.status(401).json({ error: 'Invalid access token' });
    }
};

module.exports = { authenticate };