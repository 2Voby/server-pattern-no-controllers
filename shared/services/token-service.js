const jwt = require("jsonwebtoken");

const tokenService = {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || "30d",
    });
    return { accessToken, refreshToken };
  },

  validateAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch {
      return null;
    }
  },

  validateRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return null;
    }
  },

  /**
   * Upsert: one token doc per user.
   * @param {import("mongoose").Model} TokenModel
   */
  async saveToken(userId, refreshToken, TokenModel) {
    return TokenModel.findOneAndUpdate(
      { user: userId },
      { refreshToken },
      { upsert: true, new: true }
    );
  },

  async findToken(refreshToken, TokenModel) {
    return TokenModel.findOne({ refreshToken });
  },

  async removeToken(refreshToken, TokenModel) {
    return TokenModel.findOneAndDelete({ refreshToken });
  },
};

module.exports = tokenService;
