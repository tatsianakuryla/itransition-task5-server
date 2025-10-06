const { TokensApi } = require('../api/TokensApi');

const authenticate = (request, response, next) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return response.status(401).json({ error: 'Access token required' });
    }
    const token = authHeader.substring(7);
    try {
        const { sub } = TokensApi.verifyAccessToken(token);
        request.userId = sub;
        next();
    } catch {
        return response.status(401).json({ error: 'Invalid access token' });
    }
};

module.exports = { authenticate };