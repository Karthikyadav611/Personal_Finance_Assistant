const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [80, "Category cannot exceed 80 characters"],
    },
    limit: {
      type: Number,
      required: [true, "Budget limit is required"],
      min: [0.01, "Budget limit must be greater than 0"],
    },
  },
  {
    timestamps: true,
  }
);

budgetSchema.index({ userId: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);
