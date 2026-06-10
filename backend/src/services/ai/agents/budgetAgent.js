const Budget = require("../../../models/Budget");

const DEFAULT_CATEGORY = "General";

const extractAmount = (message) => {
  const match = String(message || "").match(/(?:rs\.?|inr|₹|\$)?\s*(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
};

const normalizeCategory = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const extractCategory = (message, fallback) => {
  const lowerMessage = String(message || "").toLowerCase();
  const match = lowerMessage.match(/(?:for|on|in|category)\s+([a-z &]+)/i);

  if (match?.[1]) {
    return normalizeCategory(match[1].replace(/\b(budget|please|monthly)\b/gi, ""));
  }

  return fallback;
};

const deleteBudget = async ({ message, user, budgets }) => {
  const lower = String(message || "").toLowerCase();

  const wantsDeleteAll =
    /\b(delete|remove|clear|reset|wipe)\b/.test(lower) &&
    /\bbudgets?\b/.test(lower) &&
    /\b(all|everything|entire)\b/.test(lower);

  if (wantsDeleteAll) {
    const result = await Budget.deleteMany({ userId: user._id });
    const deletedCount = Number(result?.deletedCount || 0);
    return {
      action: { performed: true, type: "budgets_deleted_all", deletedCount },
      reply: deletedCount > 0 ? `Deleted ${deletedCount} budget(s).` : "You don't have any budgets to delete.",
      data: { deletedCount },
      suggestions: ["Show my budgets", "Set budget for food 5000", "Show my balance"],
    };
  }

  const isAmbiguousBulkDelete =
    /^\s*(delete|remove|clear|reset)\s+budgets?\s*$/i.test(String(message || "")) &&
    !/\b(all|everything|entire)\b/.test(lower);

  if (isAmbiguousBulkDelete) {
    const items = budgets
      .slice(0, 8)
      .map((b, idx) => `${idx + 1}. ${b.category}: Rs.${Number(b.limit || 0).toLocaleString("en-IN")}`);

    if (items.length === 0) {
      return {
        action: { performed: false, type: "budget_delete_not_found" },
        reply: "You don't have any budgets to delete.",
        data: null,
      };
    }

    return {
      action: { performed: false, type: "budget_delete_needs_target" },
      reply:
        `Which budget should I delete?\n${items.join("\n")}\n\nReply with a category name (e.g. "delete shopping budget"), or say "delete all budgets".`,
      data: null,
      suggestions: ["delete shopping budget", "delete food budget", "delete all budgets", "Cancel"],
    };
  }
  const matched = budgets.find((b) => lower.includes(String(b.category).toLowerCase()));

  if (!matched) {
    return {
      action: { performed: false, type: "budget_delete_not_found" },
      reply: "I couldn’t find the budget category to remove. Please mention the category name.",
      data: null,
    };
  }

  await Budget.deleteOne({ _id: matched._id, userId: user._id });

  return {
    action: { performed: true, type: "budget_deleted", resourceId: matched._id },
    reply: `Removed the ${matched.category} budget.`,
    data: { budget: matched },
  };
};

const upsertBudget = async ({ message, user, budgets }) => {
  const amount = extractAmount(message);
  if (!amount || !Number.isFinite(amount) || amount <= 0) {
    return {
      action: { performed: false, type: "budget_missing_amount" },
      reply: "Please provide a budget amount, for example: “Set food budget to ₹5000”.",
      data: null,
    };
  }

  const lower = String(message || "").toLowerCase();
  const matchedBudget = budgets.find((b) => lower.includes(String(b.category).toLowerCase()))?.category;
  const category = extractCategory(message, matchedBudget || DEFAULT_CATEGORY);

  const budget = await Budget.findOneAndUpdate(
    { userId: user._id, category },
    { userId: user._id, category, limit: amount },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return {
    action: { performed: true, type: "budget_upserted", resourceId: budget._id },
    reply: `Set the ${category} budget to Rs.${amount.toLocaleString("en-IN")}.`,
    data: { budget },
  };
};

const run = async ({ intent, message, user, budgets }) => {
  const lower = String(message || "").toLowerCase();

  if (intent === "DELETE_BUDGET" || /\b(delete|remove)\b/.test(lower)) {
    return deleteBudget({ message, user, budgets });
  }

  return upsertBudget({ message, user, budgets });
};

module.exports = { run };
