const cron = require("node-cron");

module.exports = (logger, db) => cron.schedule("0 * * * *", async () => {
  try {
    logger.info(`[Cron] update-users — user successfully updated`);
  } catch (err) {
    logger.error({ err }, "[Cron] update-users failed");
  }
});
