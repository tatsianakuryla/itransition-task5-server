const { TokensApi } = require('./TokensApi');

class UsersTokenManager {
    static getTokens = async (userId) => {
        const accessToken = TokensApi.signAccessToken(userId);
        const refreshToken = await TokensApi.signRefreshToken(userId);
        return { accessToken, refreshToken };
    }
}

module.exports = { UsersTokenManager }