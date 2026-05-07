const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { normalizeOrigin } = require("./utils/validators");

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin(origin, callback) {
      const normalizedOrigin = normalizeOrigin(origin);

      if (
        !origin ||
        (!isProduction && allowedOrigins.length === 0) ||
        allowedOrigins.includes(normalizedOrigin)
      ) {
        return callback(null, true);
      }

      return callback(new Error("CORS policy blocked this request"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Finance Assistant backend is running",
    data: {
      status: "ok",
      environment: process.env.NODE_ENV || "development",
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/transactions", transactionRoutes.apiRouter);
app.use("/api/budget", budgetRoutes.apiRouter);
app.use("/api/chatbot", chatbotRoutes);

// Compatibility routes for the current frontend.
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/transactions", transactionRoutes.legacyRouter);
app.use("/budget", budgetRoutes.legacyRouter);
app.use("/chatbot", chatbotRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
