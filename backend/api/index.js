/**
 * Vercel Node.js Functions provide Node `req`/`res` objects.
 *
 * We do NOT use `serverless-http` here because it targets Lambda-style
 * `event/context` payloads and can crash under Vercel's runtime.
 *
 * The Express app instance is itself a handler function `(req, res, next)`.
 */

const app = require("../src/app");
const connectDB = require("../src/config/db");

let connectionPromise = null;

module.exports = async (req, res) => {
  if (!connectionPromise) {
    connectionPromise = connectDB().catch((error) => {
      // If the first connect attempt fails, allow future invocations to retry.
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;
  return app(req, res);
};
