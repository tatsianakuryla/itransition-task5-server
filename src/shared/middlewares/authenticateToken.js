const { TokensController } = require('../../controllers/tokens.controller');

/**
 * Authentication middleware that only validates JWT token.
 * Does NOT check if user exists or is blocked in database.
 * Used for logout endpoint where database check is unnecessary.
 *
 */
const authenticateToken = (request, response, next) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return response.status(401).json({ error: 'Access token required' });
    }
    const token = authHeader.substring(7);
    try {
        const { sub } = TokensController.verifyAccessToken(token);
        request.userId = sub;
        next();
    } catch {
        return response.status(401).json({ error: 'Invalid access token' });
    }
};

module.exports = { authenticateToken };
