require("module-alias/register");

require("dotenv").config();
const http = require("http");

const logger = require("@/server/createLogger")();
const { createDatabase } = require("@/shared/database/createDatabase");
const createExpressApp = require("@/app/createExpressApp");

const PORT = Number(process.env.PORT) || 8080;

async function main() {
	const database = await createDatabase({ logger, mongoose: require("mongoose") });
	const app = createExpressApp({ logger, database });

	const server = http.createServer(app);

	server.listen(PORT, () => {
		logger.info(`[API] Listening on port ${PORT}`);
	});


	server.on("error", (error) => {
		if (error.syscall !== "listen") throw error;
		switch (error.code) {
			case "EACCES":
				logger.error(`Port ${PORT} requires elevated privileges`);
				process.exit(1);
				break;
			case "EADDRINUSE":
				logger.error(`Port ${PORT} is already in use`);
				process.exit(1);
				break;
			default:
				throw error;
		}
	});

	// ── Graceful shutdown ────────────────────────────────────────────────────
	const shutdown = (signal) => {
		logger.info(`[API] Received ${signal}, shutting down…`);
		server.close(() => {
			logger.info("[API] HTTP server closed");
			process.exit(0);
		});
	};
	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
	console.error("Fatal startup error:", err);
	process.exit(1);
});
