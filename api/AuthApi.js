const { TokensApi } = require('./TokensApi');
const { UsersTokenManager } = require('./UsersTokenManager');

class AuthApi {
    static async logout(request, response) {
        const { refreshToken } = request.body || {};
        if (!refreshToken) return response.status(400).json({ error: 'Refresh token is required' });
        try {
            const { jti } = TokensApi.verifyRefreshToken(refreshToken);
            await TokensApi.revokeRefreshToken(jti);
        } catch {}
        return response.status(204).send();
    }

    static async refresh(request, response) {
        const { refreshToken } = request.body || {};
        if (!refreshToken) return response.status(400).json({ error: 'Refresh token is required' });
        try {
            const { sub, jti } = TokensApi.verifyRefreshToken(refreshToken);
            const ok = await TokensApi.isRefreshTokenValid(jti);
            if (!ok) return response.status(401).json({ error: 'Invalid or revoked refresh token' });
            await TokensApi.revokeRefreshToken(jti);
            const { accessToken, refreshToken: newRefreshToken } = await UsersTokenManager.getTokens(Number(sub));
            return response.json({ accessToken, refreshToken: newRefreshToken });
        } catch {
            return response.status(401).json({ error: 'Invalid refresh token' });
        }
    }
}

module.exports = { AuthApi };
