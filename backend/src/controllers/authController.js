const bcrypt = require("bcrypt");

const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { sendSuccess } = require("../utils/response");
const { generateToken } = require("../utils/jwt");
const { validateEmail } = require("../utils/validators");

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  if (!validateEmail(email)) {
    res.status(400);
    throw new Error("Please provide a valid email address");
  }

  if (String(password).length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters long");
  }

  const existingUser = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (existingUser) {
    res.status(409);
    throw new Error("User already exists with this email");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name: String(name).trim(),
    email: String(email).toLowerCase().trim(),
    password: hashedPassword,
  });

  const token = generateToken(user._id);
  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };

  sendSuccess(res, 201, "User registered successfully", { user: userData, token }, { token });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+password");

  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user._id);
  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };

  sendSuccess(res, 200, "Login successful", { user: userData, token }, { token });
});

module.exports = { register, login };
