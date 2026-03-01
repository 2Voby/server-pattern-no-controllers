require("module-alias/register");
require("dotenv").config();
const http = require("http");
const logger = require("@/server/createLogger.js")();
const { createDatabase } = require("@/shared/database/createDatabase.js");
const updateUserNightly = require("@/server-cron/handlers/updateUserNightly.js");

const CRON_PORT = Number(process.env.CRON_PORT) || 8081;

async function main() {
 const database = await createDatabase({ logger, mongoose: require("mongoose") });

  const tasks = [
    updateUserNightly(logger, database),
  ];

  logger.info(`[Cron] ${tasks.length} task(s) scheduled`);

  http
    .createServer((req, res) => {
      if (req.url === "/health" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          status: "ok",
          uptime: process.uptime(),
          tasks: tasks.map(t => ({ name: t.options?.name ?? "unnamed" })),
        }));
      } else {
        res.writeHead(404);
        res.end();
      }
    })
    .listen(CRON_PORT, () => logger.info(`[Cron] Healthcheck on port ${CRON_PORT}`));

  const shutdown = (signal) => {
    logger.info(`[Cron] ${signal}, stopping...`);
    tasks.forEach(t => t.stop());
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch(err => {
  logger.error({ err }, "[Cron] Fatal startup error");
  process.exit(1);
});