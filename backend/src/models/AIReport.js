const mongoose = require("mongoose");

const topCategorySchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const budgetAlertSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    allocated: { type: Number, required: true },
    spent: { type: Number, required: true },
    percentUsed: { type: Number, required: true },
  },
  { _id: false }
);

const aiReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2200,
    },
    totalIncome: { type: Number, default: 0 },
    totalExpense: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    topCategories: { type: [topCategorySchema], default: [] },
    budgetAlerts: { type: [budgetAlertSchema], default: [] },
    insights: { type: String, default: "" },
    suggestions: { type: [String], default: [] },
    forecast: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
  }
);

aiReportSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("AIReport", aiReportSchema);

