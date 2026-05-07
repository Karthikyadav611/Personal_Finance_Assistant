const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");
const asyncHandler = require("../middleware/asyncHandler");
const { sendSuccess } = require("../utils/response");
const {
  validateObject,
  normalizeBudgetPayload,
  validateBudgetPayload,
} = require("../utils/validators");

const enrichBudgetsWithSpent = async (userId, budgets) => {
  const spentByCategory = await Transaction.aggregate([
    {
      $match: {
        userId,
        type: "expense",
      },
    },
    {
      $group: {
        _id: "$category",
        spent: { $sum: "$amount" },
      },
    },
  ]);

  const spentMap = new Map(spentByCategory.map((item) => [item._id, item.spent]));

  return budgets.map((budget) => ({
    ...budget.toObject(),
    spent: spentMap.get(budget.category) || 0,
    allocated: budget.limit,
  }));
};

const getBudgets = asyncHandler(async (req, res) => {
  const budgets = await Budget.find({ userId: req.user._id }).sort({ createdAt: -1 });
  const data = await enrichBudgetsWithSpent(req.user._id, budgets);

  sendSuccess(res, 200, "Budgets fetched successfully", data);
});

const getBudgetsLegacy = asyncHandler(async (req, res) => {
  const budgets = await Budget.find({ userId: req.user._id }).sort({ createdAt: -1 });
  const data = await enrichBudgetsWithSpent(req.user._id, budgets);
  res.status(200).json(data);
});

const createBudget = asyncHandler(async (req, res) => {
  if (!validateObject(req.body)) {
    res.status(400);
    throw new Error("Request body must be a valid JSON object");
  }

  const payload = normalizeBudgetPayload(req.body);
  const errors = validateBudgetPayload(payload);

  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join(", "));
  }

  const budget = await Budget.create({
    userId: req.user._id,
    ...payload,
  });

  sendSuccess(res, 201, "Budget created successfully", {
    ...budget.toObject(),
    spent: 0,
    allocated: budget.limit,
  });
});

const updateBudget = asyncHandler(async (req, res) => {
  if (!validateObject(req.body)) {
    res.status(400);
    throw new Error("Request body must be a valid JSON object");
  }

  const payload = normalizeBudgetPayload(req.body);
  const errors = validateBudgetPayload(payload);

  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join(", "));
  }

  const budget = await Budget.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    payload,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!budget) {
    res.status(404);
    throw new Error("Budget not found");
  }

  const [data] = await enrichBudgetsWithSpent(req.user._id, [budget]);
  sendSuccess(res, 200, "Budget updated successfully", data);
});

const deleteBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!budget) {
    res.status(404);
    throw new Error("Budget not found");
  }

  sendSuccess(res, 200, "Budget deleted successfully", budget);
});

module.exports = {
  getBudgets,
  getBudgetsLegacy,
  createBudget,
  updateBudget,
  deleteBudget,
};
