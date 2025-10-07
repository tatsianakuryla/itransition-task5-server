const { TokensController } = require('../controllers/tokens.controller');

class Jwt {
    static getTokens = async (userId) => {
        const accessToken = TokensController.signAccessToken(userId);
        const refreshToken = await TokensController.signRefreshToken(userId);
        return { accessToken, refreshToken };
    }
}

module.exports = { UsersTokenManager: Jwt }