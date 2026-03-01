class ApiError extends Error {
  /** @type {number} */ status;
  /** @type {object[]} */ errors;

  constructor(status, message, errors = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  // ── Static factory helpers ──────────────────────────────────────────────

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }

  static badRequest(message, errors = []) {
    return new ApiError(400, message, errors);
  }

  static notFound(message = "Not found") {
    return new ApiError(404, message);
  }

  static conflict(message = "Conflict") {
    return new ApiError(409, message);
  }

  static internal(message = "Internal server error") {
    return new ApiError(500, message);
  }

  /** Serialize for JSON response */
  toJSON() {
    return {
      error: {
        status: this.status,
        message: this.message,
        ...(this.errors.length ? { errors: this.errors } : {}),
      },
    };
  }
}

module.exports = ApiError;
