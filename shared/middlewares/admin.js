const ApiError = require("../exceptions/ApiError");

/** Must be used AFTER authMiddleware */
module.exports = function adminMiddleware(req, res, next) {
  if (req.user?.role !== "admin") {
    return next(ApiError.forbidden("Admin access required"));
  }
  return next();
};
