
const glob = require("glob");
const path = require("path");

let instance = null;

async function createDatabase({ logger, mongoose }) {
  const url = process.env.MONGODB_URL;
  const dbName = process.env.MONGODB_DB_NAME;

  if (process.env.NODE_ENV !== "production") {
    mongoose.set("debug", (coll, method, query, doc, options = {}) => {
      logger.debug(`[Mongoose] ${coll}.${method} ${JSON.stringify(query)} ${JSON.stringify(options)}`);
    });
  }

  await mongoose.connect(url, { dbName });
  logger.info(`[DB] MongoDB connected → ${url}/${dbName}`);

  const db = glob
    .sync("./schemas/**/*.js", {
      cwd: __dirname,
      ignore: "./schemas/**/*.test.js",
    })
    .map(filename => ({
      schema: require(path.join(__dirname, filename)),
      name: path.basename(filename, path.extname(filename)),
    }))
    .map(({ name, schema }) => mongoose.model(name, schema))
    .reduce((acc, model) => ({ ...acc, [model.modelName]: model }), {});

  db.mongoose = mongoose;
  instance = db;
  return db;
}

function getDatabase() {
  if (!instance) throw new Error("Database not initialized. Call createDatabase() first.");
  return instance;
}

module.exports = { createDatabase, getDatabase };