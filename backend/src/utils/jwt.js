const jwt = require("jsonwebtoken");

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in the environment");
  }

  return process.env.JWT_SECRET;
};

const generateToken = (userId) =>
  jwt.sign({ id: userId }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

module.exports = { generateToken, getJwtSecret };
