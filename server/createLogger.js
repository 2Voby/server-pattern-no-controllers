const pino = require("pino");

/**
 * Creates a pino logger instance.
 *
 * Dev:  pretty-printed, colorized output via pino-pretty
 * Prod: structured JSON — pipe to whatever log aggregator you use
 *       (Datadog, Loki, CloudWatch, etc.)
 *
 * Usage:
 *   const logger = require("./createLogger")();
 *   logger.info("Server started");
 *   logger.error({ err }, "Something broke");
 */
module.exports = ({ silent } = {}) => {
  const isDev = process.env.NODE_ENV !== "production";

  return pino({
    level: silent ? "silent" : (process.env.LOG_LEVEL || (isDev ? "debug" : "info")),

    // In production emit clean JSON — don't use pino-pretty, it's slow
    ...(isDev && {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname",
          messageFormat: "{msg}",
        },
      },
    }),

    // Always include these base fields in every log line
    base: {
      env: process.env.NODE_ENV || "development",
    },

    // Redact sensitive fields from logs automatically
    redact: {
      paths: [
        "*.password",
        "*.token",
        "*.refreshToken",
        "*.accessToken",
        "req.headers.authorization",
      ],
      censor: "[REDACTED]",
    },
  });
};
