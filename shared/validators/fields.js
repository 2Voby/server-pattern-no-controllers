const { z } = require("zod");

exports.username = z
	.string()
	.min(3, "Username must be at least 3 characters")
	.max(32)
	.regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, underscores");

exports.password = z.string().min(8, "Password must be at least 8 characters").max(100);

exports.email = z.string().email("Invalid email");

exports.mongoId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");

exports.pagination = {
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
};
