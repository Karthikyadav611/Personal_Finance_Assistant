const Transaction = require("../../../models/Transaction");
const { parseNaturalLanguageDate } = require("../../../utils/dateParser");

const DEFAULT_EXPENSE_CATEGORY = "General";
const DEFAULT_INCOME_CATEGORY = "Income";

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
  const match = lowerMessage.match(/(?:for|on|in|at)\s+([a-z &]+)/i);

  if (match?.[1]) {
    return normalizeCategory(
      match[1].replace(/\b(today|yesterday|tomorrow|this month|please)\b/gi, "")
    );
  }

  return fallback;
};

const findCandidateTransaction = ({ message, transactions }) => {
  const lowerMessage = String(message || "").toLowerCase();
  return (
    transactions.find((t) => lowerMessage.includes(String(t.category || "").toLowerCase())) ||
    transactions.find((t) => lowerMessage.includes(String(t.type || "").toLowerCase())) ||
    transactions[0] ||
    null
  );
};

const isDuplicateTransaction = async ({ userId, amount, type, category, date }) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const existing = await Transaction.findOne({
    userId,
    amount,
    type,
    category,
    date: { $gte: dayStart, $lte: dayEnd },
  }).select("_id");

  return Boolean(existing);
};

const addTransaction = async ({ message, user, budgets, now }) => {
  const lower = String(message || "").toLowerCase();
  const amount = extractAmount(message);
  if (!amount || !Number.isFinite(amount) || amount <= 0) {
    return {
      action: { performed: false, type: "transaction_missing_amount" },
      reply: "Please include an amount, for example: “Spent ₹250 on lunch yesterday”.",
      data: null,
    };
  }

  const isIncome = /\b(income|earned|received|salary|credited)\b/.test(lower);
  const type = isIncome ? "income" : "expense";

  const budgetCategory = budgets.find((b) => lower.includes(String(b.category).toLowerCase()))?.category;
  const category = extractCategory(
    message,
    budgetCategory || (type === "income" ? DEFAULT_INCOME_CATEGORY : DEFAULT_EXPENSE_CATEGORY)
  );

  const date = parseNaturalLanguageDate(message, now) || new Date(now);

  const duplicate = await isDuplicateTransaction({ userId: user._id, amount, type, category, date });
  if (duplicate) {
    return {
      action: { performed: false, type: "transaction_duplicate_detected" },
      reply: `This looks like a duplicate: ${type} of Rs.${amount.toLocaleString("en-IN")} under ${category} on ${date.toDateString()}. If you want, rephrase with “force add”.`,
      data: null,
    };
  }

  const transaction = await Transaction.create({
    userId: user._id,
    amount,
    type,
    category,
    date,
    description: String(message).trim(),
  });

  return {
    action: { performed: true, type: "transaction_created", resourceId: transaction._id },
    reply:
      type === "income"
        ? `Logged an income of Rs.${amount.toLocaleString("en-IN")} under ${category}.`
        : `Logged an expense of Rs.${amount.toLocaleString("en-IN")} under ${category}.`,
    data: { transaction },
  };
};

const updateTransaction = async ({ message, user, budgets, transactions, now }) => {
  const target = findCandidateTransaction({ message, transactions });
  if (!target) {
    return {
      action: { performed: false, type: "transaction_update_not_found" },
      reply: "I couldn’t find a matching transaction to update. Try mentioning the category or the amount.",
      data: null,
    };
  }

  const lower = String(message || "").toLowerCase();
  const amount = extractAmount(message);
  const budgetCategory = budgets.find((b) => lower.includes(String(b.category).toLowerCase()))?.category;
  const nextCategory = extractCategory(message, budgetCategory || target.category);

  if (amount && Number.isFinite(amount) && amount > 0) {
    target.amount = amount;
  }

  target.category = nextCategory;

  if (/\b(income|salary|earned|received|credited)\b/.test(lower)) {
    target.type = "income";
  }

  if (/\b(expense|spent|paid|bought)\b/.test(lower)) {
    target.type = "expense";
  }

  const date = parseNaturalLanguageDate(message, now);
  if (date) {
    target.date = date;
  }

  target.description = String(message).trim();
  await target.save();

  return {
    action: { performed: true, type: "transaction_updated", resourceId: target._id },
    reply: `Updated the transaction to Rs.${target.amount.toLocaleString("en-IN")} under ${target.category}.`,
    data: { transaction: target },
  };
};

const deleteTransaction = async ({ message, user, transactions, now }) => {
  const lower = String(message || "").toLowerCase();

  const wantsDeleteAll =
    /\b(delete|remove|clear|reset|wipe)\b/.test(lower) &&
    (/\b(all|everything|entire)\b/.test(lower) ||
      /\ball\s+my\s+transactions?\b/.test(lower) ||
      /\bdelete\s+transactions?\s+all\b/.test(lower) ||
      /\bclear\s+my\s+transactions?\b/.test(lower) ||
      /\bdelete\s+all\s+transactions?\b/.test(lower) ||
      /\bclear\s+all\s+transactions?\b/.test(lower) ||
      /\breset\s+all\s+transactions?\b/.test(lower));

  if (wantsDeleteAll) {
    const result = await Transaction.deleteMany({ userId: user._id });
    const deletedCount = Number(result?.deletedCount || 0);
    return {
      action: { performed: true, type: "transactions_deleted_all", deletedCount },
      reply:
        deletedCount > 0
          ? `Deleted ${deletedCount} transaction(s). Your transaction history is now empty.`
          : "You don't have any transactions to delete.",
      data: { deletedCount },
      suggestions: ["Show my balance", "Show my recent transactions", "Set budget for food 5000"],
    };
  }

  const isAmbiguousBulkDelete =
    /^\s*(delete|remove|clear|reset)\s+transactions?\s*$/i.test(String(message || "")) &&
    !/\b(all|everything|entire)\b/.test(lower);

  if (isAmbiguousBulkDelete) {
    const items = transactions.slice(0, 5).map((t, idx) => {
      const date = new Date(t.date);
      const when = Number.isNaN(date.getTime()) ? "" : ` (${date.toLocaleDateString("en-IN")})`;
      const label = t.type === "income" ? "Income" : "Expense";
      return `${idx + 1}. ${label}: Rs.${t.amount.toLocaleString("en-IN")} - ${t.category}${when}`;
    });

    if (items.length === 0) {
      return {
        action: { performed: false, type: "transaction_delete_not_found" },
        reply: "You don't have any transactions to delete.",
        data: null,
      };
    }

    return {
      action: { performed: false, type: "transaction_delete_needs_target" },
      reply:
        `Do you want to delete a specific transaction, or delete everything?\n\n` +
        `Recent transactions:\n${items.join("\n")}\n\n` +
        `Reply with "delete 1" (or 2/3/4/5), or say "delete all transactions".`,
      data: null,
      suggestions: ["delete 1", "delete 2", "delete all transactions", "Cancel"],
    };
  }

  // "delete 3" => delete the 3rd most recent transaction (matches the numbering in "Latest transactions").
  const indexMatch = lower.match(/\b(?:delete|remove)\s+(\d{1,3})\b/);
  if (indexMatch?.[1]) {
    const idx = Number(indexMatch[1]);
    if (!Number.isInteger(idx) || idx <= 0) {
      return {
        action: { performed: false, type: "transaction_delete_invalid_index" },
        reply: 'Please say something like "delete 1" or "delete 3".',
        data: null,
      };
    }

    const target = transactions[idx - 1];
    if (!target) {
      const max = Math.min(transactions.length, 8);
      return {
        action: { performed: false, type: "transaction_delete_index_out_of_range" },
        reply: `I couldn't find transaction #${idx}. Please choose a number between 1 and ${max}.`,
        data: null,
      };
    }

    await Transaction.deleteOne({ _id: target._id, userId: user._id });

    return {
      action: { performed: true, type: "transaction_deleted", resourceId: target._id },
      reply: `Deleted transaction #${idx}: ${target.type} of Rs.${target.amount.toLocaleString("en-IN")} from ${target.category}.`,
      data: { transaction: target },
    };
  }

  // If the user didn't specify which transaction, ask a safe follow-up instead of guessing.
  if (/^(delete|remove|delete transaction|remove transaction)$/.test(lower.trim())) {
    const items = transactions.slice(0, 5).map((t, idx) => {
      const date = new Date(t.date);
      const when = Number.isNaN(date.getTime()) ? "" : ` (${date.toLocaleDateString("en-IN")})`;
      const label = t.type === "income" ? "Income" : "Expense";
      return `${idx + 1}. ${label}: Rs.${t.amount.toLocaleString("en-IN")} - ${t.category}${when}`;
    });

    if (items.length === 0) {
      return {
        action: { performed: false, type: "transaction_delete_not_found" },
        reply: "You don't have any transactions to delete.",
        data: null,
      };
    }

    return {
      action: { performed: false, type: "transaction_delete_needs_target" },
      reply: `Which transaction should I delete?\n${items.join("\n")}\n\nReply with "delete 1" (or 2/3/4/5), or say "delete all transactions".`,
      data: null,
      suggestions: ["delete 1", "delete 2", "delete all transactions", "Show my balance"],
    };
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const target =
    transactions.find((t) => {
      const matchesCategory = lower.includes(String(t.category || "").toLowerCase());
      const matchesYesterday =
        lower.includes("yesterday") && new Date(t.date).toDateString() === yesterdayStr;
      return matchesCategory || matchesYesterday;
    }) || transactions[0];

  if (!target) {
    return {
      action: { performed: false, type: "transaction_delete_not_found" },
      reply: "I couldn’t find a transaction to delete.",
      data: null,
    };
  }

  await Transaction.deleteOne({ _id: target._id, userId: user._id });

  return {
    action: { performed: true, type: "transaction_deleted", resourceId: target._id },
    reply: `Deleted the ${target.type} transaction of Rs.${target.amount.toLocaleString("en-IN")} from ${target.category}.`,
    data: { transaction: target },
  };
};

const run = async ({ intent, message, user, budgets, transactions, now = new Date() }) => {
  const lower = String(message || "").toLowerCase();

  if (intent === "DELETE_TRANSACTION" || /\b(delete|remove)\b/.test(lower)) {
    return deleteTransaction({ message, user, transactions, now });
  }

  if (intent === "UPDATE_TRANSACTION" || /\b(update|edit|change)\b/.test(lower)) {
    return updateTransaction({ message, user, budgets, transactions, now });
  }

  // Allow an explicit "force add" to bypass duplicate detection.
  if (/\bforce add\b/.test(lower)) {
    return addTransaction({ message: message.replace(/\bforce add\b/gi, ""), user, budgets, now });
  }

  return addTransaction({ message, user, budgets, now });
};

module.exports = { run };
