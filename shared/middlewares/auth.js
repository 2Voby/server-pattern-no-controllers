const ApiError = require("@/shared/errors/ApiError");
const tokenService = require("@/shared/services/token-service");

module.exports = function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return next(ApiError.unauthorized());
    }

    const token = authHeader.slice(7);
    const userData = tokenService.validateAccessToken(token);
    if (!userData) {
      return next(ApiError.unauthorized());
    }

    req.user = userData;
    return next();
  } catch {
    return next(ApiError.unauthorized());
  }
};
