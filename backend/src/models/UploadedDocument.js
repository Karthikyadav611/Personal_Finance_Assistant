const mongoose = require("mongoose");

const extractedTransactionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    category: { type: String, default: "Transfers" },
    date: { type: Date, required: true },
    description: { type: String, default: "" },
    raw: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const uploadedDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    fileType: { type: String, required: true },
    size: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["extracted", "imported", "failed"],
      default: "extracted",
      index: true,
    },
    extractedTransactions: { type: [extractedTransactionSchema], default: [] },
    importedCount: { type: Number, default: 0 },
    errorMessage: { type: String, default: "" },
  },
  {
    timestamps: { createdAt: "uploadedAt", updatedAt: true },
  }
);

module.exports = mongoose.model("UploadedDocument", uploadedDocumentSchema);
