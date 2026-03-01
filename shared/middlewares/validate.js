const ApiError = require("@/shared/errors/ApiError");

/**
 * Zod validation middleware factory.
 *
 * Usage:
 *   const { z } = require("zod");
 *   const schema = z.object({ body: z.object({ email: z.string().email() }) });
 *   router.post("/", validate(schema), handler);
 *
 * The schema should validate an object with keys: body, query, params.
 * Only the keys present in the schema will be checked.
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return next(ApiError.badRequest("Validation failed", errors));
    }

    // Overwrite with parsed (and possibly coerced/stripped) values
    if (result.data.body !== undefined) req.body = result.data.body;
    if (result.data.query !== undefined) req.query = result.data.query;
    if (result.data.params !== undefined) req.params = result.data.params;

    return next();
  };
}

module.exports = validate;
