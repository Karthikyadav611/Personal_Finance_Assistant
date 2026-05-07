const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { getJwtSecret } = require("../utils/jwt");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization token is missing or invalid",
      data: null,
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User associated with this token no longer exists",
        data: null,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Token has expired"
        : error.message === "JWT_SECRET is not defined in the environment"
          ? error.message
          : "Token verification failed";

    return res.status(401).json({
      success: false,
      message,
      data: null,
    });
  }
};

module.exports = { protect };
