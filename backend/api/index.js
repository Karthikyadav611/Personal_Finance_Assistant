const serverless = require("serverless-http");

const app = require("../src/app");
const connectDB = require("../src/config/db");

// Create the serverless proxy once; Vercel may reuse the same instance between invocations.
const proxy = serverless(app);

const handler = async (req, res) => {
  await connectDB();
  return proxy(req, res);
};

module.exports = handler;
