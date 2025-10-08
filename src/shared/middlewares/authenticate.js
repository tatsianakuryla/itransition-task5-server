const { TokensController } = require('../../controllers/tokens.controller');
const { prisma } = require('../../db/db');

const authenticate = async (request, response, next) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return response.status(401).json({ error: 'Access token required' });
    }
    const token = authHeader.substring(7);
    try {
        const { sub } = TokensController.verifyAccessToken(token);
        const user = await prisma.user.findUnique({ 
            where: { id: Number(sub) },
            select: { id: true, status: true }
        });
        if (!user) {
            return response.status(401).json({ error: 'User not found' });
        }
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