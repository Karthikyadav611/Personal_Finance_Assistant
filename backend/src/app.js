const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const aiRoutes = require("./routes/aiRoutes");
const reportRoutes = require("./routes/reportRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { normalizeOrigin } = require("./utils/validators");

const app = express();

// This API serves user-specific, frequently-changing data (transactions/budgets).
// Disable ETags and explicit caching to avoid stale UI data in some deployments.
app.disable("etag");

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

app.use((_req, res, next) => {
  // Prevent browsers/CDNs from caching authenticated API responses.
  res.setHeader("Cache-Control", "no-store, max-age=0");
  // Some CDNs (including Vercel) may respect CDN-specific cache headers.
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Surrogate-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  // Make cache behavior explicit for auth'd APIs.
  res.setHeader("Vary", "Authorization");
  next();
});

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
app.use("/api/ai", aiRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/analytics", analyticsRoutes);

// Compatibility routes for the current frontend.
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/transactions", transactionRoutes.legacyRouter);
app.use("/budget", budgetRoutes.legacyRouter);
app.use("/chatbot", chatbotRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
