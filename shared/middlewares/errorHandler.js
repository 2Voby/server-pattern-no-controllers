const ApiError = require("../errors/ApiError");

/**
 * Central error-handling middleware.
 * Must be registered LAST in Express (after all routes).
 *
 * Handles:
 *  - ApiError instances → structured JSON with correct HTTP status
 *  - Mongoose validation errors → 400 with field-level detail
 *  - Zod validation errors (re-thrown by validate middleware) → 422
 *  - JWT errors → 401
 *  - Everything else → 500 (detail hidden in production)
 */
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  const logger = req.logger;

  // ── ApiError (our own) ──────────────────────────────────────────────────
  if (err instanceof ApiError) {
    if (err.status >= 500) {
      logger?.error({ err }, `[${req.method}] ${req.path} → ${err.status}`);
    }
    return res.status(err.status).json(err.toJSON());
  }

  // ── Mongoose validation error ──────────────────────────────────────────
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      error: { status: 400, message: "Validation failed", errors },
    });
  }

  // ── Mongoose duplicate key ─────────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({
      error: { status: 409, message: `Duplicate value for '${field}'` },
    });
  }

  // ── JWT errors ─────────────────────────────────────────────────────────
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: { status: 401, message: "Invalid or expired token" },
    });
  }

  // ── Unknown errors ─────────────────────────────────────────────────────
  logger?.error({ err }, `[${req.method}] ${req.path} → 500`);
  return res.status(500).json({
    error: {
      status: 500,
      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
    },
  });
};
