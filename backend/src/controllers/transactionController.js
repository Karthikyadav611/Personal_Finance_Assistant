const Transaction = require("../models/Transaction");
const asyncHandler = require("../middleware/asyncHandler");
const { sendSuccess } = require("../utils/response");
const {
  validateObject,
  parseDateInput,
  normalizeTransactionPayload,
  validateTransactionPayload,
} = require("../utils/validators");

const buildTransactionQuery = (userId, query) => {
  const filter = { userId };

  if (query.type && ["income", "expense"].includes(query.type)) {
    filter.type = query.type;
  }

  if (query.startDate || query.endDate) {
    filter.date = {};

    if (query.startDate) {
      const startDate = parseDateInput(query.startDate);
      if (!startDate) {
        throw new Error("startDate must be a valid date");
      }
      filter.date.$gte = startDate;
    }

    if (query.endDate) {
      const endDate = parseDateInput(query.endDate);
      if (!endDate) {
        throw new Error("endDate must be a valid date");
      }
      filter.date.$lte = endDate;
    }

    if (filter.date.$gte && filter.date.$lte && filter.date.$gte > filter.date.$lte) {
      throw new Error("startDate cannot be later than endDate");
    }
  }

  return filter;
};

const buildSummary = (transactions) => {
  const totalIncome = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalExpense = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
};

const getTransactions = asyncHandler(async (req, res) => {
  let filter;
  try {
    filter = buildTransactionQuery(req.user._id, req.query);
  } catch (error) {
    res.status(400);
    throw error;
  }

  const transactions = await Transaction.find(filter).sort({ date: -1, createdAt: -1 });

  sendSuccess(res, 200, "Transactions fetched successfully", {
    transactions,
    summary: buildSummary(transactions),
    filters: {
      type: req.query.type || null,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
    },
  });
});

const getTransactionsLegacy = asyncHandler(async (req, res) => {
  let filter;
  try {
    filter = buildTransactionQuery(req.user._id, req.query);
  } catch (error) {
    res.status(400);
    throw error;
  }

  const transactions = await Transaction.find(filter).sort({ date: -1, createdAt: -1 });
  res.status(200).json(transactions);
});

const createTransaction = asyncHandler(async (req, res) => {
  if (!validateObject(req.body)) {
    res.status(400);
    throw new Error("Request body must be a valid JSON object");
  }

  const payload = normalizeTransactionPayload(req.body);
  const errors = validateTransactionPayload(payload);

  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join(", "));
  }

  const transaction = await Transaction.create({
    userId: req.user._id,
    ...payload,
  });

  sendSuccess(res, 201, "Transaction created successfully", transaction);
});

const updateTransaction = asyncHandler(async (req, res) => {
  if (!validateObject(req.body)) {
    res.status(400);
    throw new Error("Request body must be a valid JSON object");
  }

  const payload = normalizeTransactionPayload(req.body);
  const errors = validateTransactionPayload(payload);

  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join(", "));
  }

  const transaction = await Transaction.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    payload,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!transaction) {
    res.status(404);
    throw new Error("Transaction not found");
  }

  sendSuccess(res, 200, "Transaction updated successfully", transaction);
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!transaction) {
    res.status(404);
    throw new Error("Transaction not found");
  }

  sendSuccess(res, 200, "Transaction deleted successfully", transaction);
});

module.exports = {
  getTransactions,
  getTransactionsLegacy,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
