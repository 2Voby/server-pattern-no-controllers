const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const pinoHttp = require("pino-http");
const errorHandler = require("@/shared/middlewares/errorHandler");
const createApiRouter = require("@/app/routes/createApiRouter");

module.exports = ({ database, logger }) => {
	const app = express();
	const appRoutes = createApiRouter();

	// ── Security ─────────────────────────────────────────────────────────────
	app.use(helmet());
	app.use(
		cors({
			origin: process.env.CORS_ORIGIN || "*",
			credentials: true,
		}),
	);

	// ── Parsing ───────────────────────────────────────────────────────────────
	app.use(express.json({ limit: "1mb" }));
	app.use(express.urlencoded({ extended: true }));
	app.use(cookieParser());

	// ── Request logging ───────────────────────────────────────────────────────
	// pino-http attaches req.log — a child logger with req/res context baked in.
	// Use req.log.info("msg") inside route handlers for correlated logs.
	app.use(
		pinoHttp({
			logger,
			// Log only on response finish, not on request start
			autoLogging: true,
			// Customize the logged message
			customSuccessMessage: (req, res) => `${res.statusCode} ${req.method} ${req.url}`,
			customErrorMessage: (req, res, err) => `${res.statusCode} ${req.method} ${req.url} — ${err.message}`,
			// Don't log healthcheck spam
			autoLogging: {
				ignore: (req) => req.url === "/health",
			},
		}),
	);

	// ── Inject shared dependencies into req ───────────────────────────────────

	app.use((req, _res, next) => {
		req.logger = logger;
		req.db = database;
		return next();
	});

	// ── Static ────────────────────────────────────────────────────────────────
	app.use(express.static("./public"));

	// ── API routes ────────────────────────────────────────────────────────────

	
	app.use("/api", appRoutes);

	// ── Health check ──────────────────────────────────────────────────────────
	app.get("/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));

	// ── 404 ───────────────────────────────────────────────────────────────────
	app.use((_req, res) => res.status(404).json({ error: { status: 404, message: "Not found" } }));

	// ── Central error handler (must be last) ──────────────────────────────────
	app.use(errorHandler);

	return app;
};
