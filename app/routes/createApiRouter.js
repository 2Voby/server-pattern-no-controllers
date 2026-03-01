const glob = require("glob");
const { Router } = require("express");

/**
 * Auto-loads all route files from this directory tree.
 * Each file must export an Express Router instance.
 */
module.exports = () => {
  const rootRouter = Router({ mergeParams: true });

  const files = glob.sync("**/*.js", {
    cwd: __dirname,
    ignore: ["**/*.test.js", "createApiRouter.js"],
  });

  files
    .map((filename) => require(`./${filename}`))
    .filter((mod) => mod?.stack !== undefined) // only Express routers
    .forEach((router) => rootRouter.use(router));

  return rootRouter;
};
