const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    type: {
      type: String,
      enum: {
        values: ["income", "expense"],
        message: "Type must be either income or expense",
      },
      required: [true, "Type is required"],
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [80, "Category cannot exceed 80 characters"],
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.note = ret.description || "";
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);
