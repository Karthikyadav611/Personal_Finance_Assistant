const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");
const { classifyAssistantQuery } = require("./assistantRouter");
const { answerUtilityQuery } = require("./utilityService");
const { appendConversationExchange, getRecentMessages } = require("./conversationService");
const { createGroqCompletion, hasGroqAccess } = require("./groqService");
const {
  hasMarketDataAccess,
  getMarketQuote,
  getCryptoQuote,
  getTopMovers,
  getMarketNews,
  resolveMarketSymbol,
} = require("./marketService");
const { buildAssistantSystemPrompt, buildMarketAnalysisPrompt } = require("./assistantPrompts");

const DEFAULT_EXPENSE_CATEGORY = "General";
const DEFAULT_INCOME_CATEGORY = "Income";

const loadUserFinanceData = async (userId) => {
  const [transactions, budgets] = await Promise.all([
    Transaction.find({ userId }).sort({ date: -1, createdAt: -1 }),
    Budget.find({ userId }).sort({ createdAt: -1 }),
  ]);

  return { transactions, budgets };
};

const extractAmount = (message) => {
  const match = String(message).match(/(?:rs\.?|inr|₹|\$)?\s*(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
};

const normalizeCategory = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const extractCategory = (message, fallback) => {
  const lowerMessage = String(message).toLowerCase();
  const match = lowerMessage.match(/(?:for|on|in)\s+([a-z &]+)/i);

  if (match?.[1]) {
    return normalizeCategory(
      match[1].replace(/\b(today|yesterday|tomorrow|this month|please)\b/gi, "")
    );
  }

  return fallback;
};

const parseTransactionDate = (message) => {
  const lowerMessage = String(message).toLowerCase();
  const date = new Date();

  if (lowerMessage.includes("yesterday")) {
    date.setDate(date.getDate() - 1);
  }

  return date;
};

const buildFinanceSnapshot = (transactions, budgets) => {
  const now = new Date();

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpense = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const monthlyExpense = transactions
    .filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return (
        transaction.type === "expense" &&
        transactionDate.getMonth() === now.getMonth() &&
        transactionDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.limit, 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    monthlyExpense,
    totalBudget,
    remainingBudget: totalBudget - monthlyExpense,
    budgetCount: budgets.length,
    transactionCount: transactions.length,
  };
};

const buildCategorySpending = (transactions) => {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const spendingMap = new Map();

  transactions
    .filter((transaction) => transaction.type === "expense" && new Date(transaction.date) >= monthStart)
    .forEach((transaction) => {
      spendingMap.set(
        transaction.category,
        (spendingMap.get(transaction.category) || 0) + transaction.amount
      );
    });

  return spendingMap;
};

const buildSuggestions = (category, marketAvailable) => {
  if (category === "transaction_action") {
    return ["Show my balance", "What did I spend this month?", "Set budget for food 5000"];
  }

  if (category === "budget_action") {
    return ["Show my budgets", "How much budget is left this month?", "Spent 300 on groceries"];
  }

  if (category === "market_query") {
    return marketAvailable
      ? ["Top gainers today", "Latest Nvidia news", "Show my balance"]
      : ["Show my balance", "How can I save money?", "What is SIP?"];
  }

  if (category === "finance_advice") {
    return ["How do I start investing?", "Explain SIP", "Show my balance"];
  }

  if (category === "utility") {
    return ["Show my recent transactions", "How can I save money?", "Top gainers today"];
  }

  return ["Show my balance", "Spent 450 on food", "What is inflation?"];
};

const deleteTransactionFromMessage = async ({ message, user, transactions }) => {
  const lowerMessage = String(message).toLowerCase();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

  const target =
    transactions.find((transaction) => {
      const matchesCategory = lowerMessage.includes(transaction.category.toLowerCase());
      const matchesYesterday =
        lowerMessage.includes("yesterday") && new Date(transaction.date).toDateString() === yesterday;

      return matchesCategory || matchesYesterday;
    }) || transactions[0];

  if (!target) {
    return {
      action: { performed: false, type: "transaction_delete_not_found" },
      reply: "I could not find a transaction to delete.",
    };
  }

  await Transaction.deleteOne({ _id: target._id, userId: user._id });

  return {
    action: {
      performed: true,
      type: "transaction_deleted",
      resourceId: target._id,
    },
    reply: `Deleted the ${target.type} transaction of Rs.${target.amount.toLocaleString("en-IN")} from ${target.category}.`,
  };
};

const updateTransactionFromMessage = async ({ message, user, budgets, transactions }) => {
  const amount = extractAmount(message);
  const lowerMessage = String(message).toLowerCase();
  const target =
    transactions.find((transaction) => lowerMessage.includes(transaction.category.toLowerCase())) ||
    transactions.find((transaction) => lowerMessage.includes(transaction.type)) ||
    transactions[0];

  if (!target) {
    return {
      action: { performed: false, type: "transaction_update_not_found" },
      reply: "I could not find a transaction to update.",
    };
  }

  const budgetCategory = budgets.find((budget) => lowerMessage.includes(budget.category.toLowerCase()))?.category;
  const nextCategory = extractCategory(message, budgetCategory || target.category);

  target.amount = amount || target.amount;
  target.category = nextCategory;
  if (/\b(income|salary|earned|received)\b/.test(lowerMessage)) {
    target.type = "income";
  }
  if (/\b(expense|spent|paid|bought)\b/.test(lowerMessage)) {
    target.type = "expense";
  }
  target.description = String(message).trim();
  target.date = parseTransactionDate(message);

  await target.save();

  return {
    action: {
      performed: true,
      type: "transaction_updated",
      resourceId: target._id,
    },
    reply: `Updated the transaction to Rs.${target.amount.toLocaleString("en-IN")} under ${target.category}.`,
  };
};

const createTransactionFromMessage = async ({ message, user, budgets, transactions }) => {
  const lowerMessage = String(message).toLowerCase();

  if (/\b(delete|remove)\b/.test(lowerMessage)) {
    return deleteTransactionFromMessage({ message, user, transactions });
  }

  if (/\b(update|edit|change)\b/.test(lowerMessage)) {
    return updateTransactionFromMessage({ message, user, budgets, transactions });
  }

  const amount = extractAmount(message);
  if (!amount) {
    return null;
  }

  const isIncome = /\b(income|earned|received|salary|credited)\b/.test(lowerMessage);
  const type = isIncome ? "income" : "expense";
  const budgetCategory = budgets.find((budget) => lowerMessage.includes(budget.category.toLowerCase()))?.category;
  const category = extractCategory(
    message,
    budgetCategory || (type === "income" ? DEFAULT_INCOME_CATEGORY : DEFAULT_EXPENSE_CATEGORY)
  );

  const transaction = await Transaction.create({
    userId: user._id,
    amount,
    type,
    category,
    date: parseTransactionDate(message),
    description: String(message).trim(),
  });

  return {
    action: {
      performed: true,
      type: "transaction_created",
      resourceId: transaction._id,
    },
    reply:
      type === "income"
        ? `Logged an income of Rs.${amount.toLocaleString("en-IN")} under ${category}.`
        : `Logged an expense of Rs.${amount.toLocaleString("en-IN")} under ${category}.`,
  };
};

const createOrUpdateBudgetFromMessage = async ({ message, user, budgets }) => {
  const amount = extractAmount(message);
  if (!amount) {
    return null;
  }

  const lowerMessage = String(message).toLowerCase();
  const matchedBudget = budgets.find((budget) => lowerMessage.includes(budget.category.toLowerCase()))?.category;
  const category = extractCategory(message, matchedBudget || DEFAULT_EXPENSE_CATEGORY);

  const budget = await Budget.findOneAndUpdate(
    { userId: user._id, category },
    { userId: user._id, category, limit: amount },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return {
    action: {
      performed: true,
      type: "budget_upserted",
      resourceId: budget._id,
    },
    reply: `Set the ${category} budget to Rs.${amount.toLocaleString("en-IN")}.`,
  };
};

const deleteBudgetFromMessage = async ({ message, user, budgets }) => {
  const lowerMessage = String(message).toLowerCase();
  const matchedBudget = budgets.find((budget) => lowerMessage.includes(budget.category.toLowerCase()));

  if (!matchedBudget) {
    return {
      action: { performed: false, type: "budget_delete_not_found" },
      reply: "I could not find the budget category to remove. Please mention the category name.",
    };
  }

  await Budget.deleteOne({ _id: matchedBudget._id, userId: user._id });

  return {
    action: {
      performed: true,
      type: "budget_deleted",
      resourceId: matchedBudget._id,
    },
    reply: `Removed the ${matchedBudget.category} budget.`,
  };
};

const buildFinanceReply = ({ message, transactions, budgets, snapshot }) => {
  const lowerMessage = String(message).toLowerCase();

  if (lowerMessage.includes("recent")) {
    const recentTransactions = transactions
      .slice(0, 5)
      .map(
        (transaction) =>
          `${transaction.type === "income" ? "Income" : "Expense"}: Rs.${transaction.amount.toLocaleString("en-IN")} in ${transaction.category}`
      )
      .join("; ");

    return recentTransactions
      ? `Here are your latest transactions: ${recentTransactions}.`
      : "You do not have any transactions yet.";
  }

  if (lowerMessage.includes("budget")) {
    const budgetLines = budgets
      .map((budget) => `${budget.category}: limit Rs.${budget.limit.toLocaleString("en-IN")}`)
      .join("; ");

    return budgetLines
      ? `You have ${budgets.length} budgets. ${budgetLines}. Remaining budget this month is Rs.${snapshot.remainingBudget.toLocaleString("en-IN")}.`
      : "You do not have any budgets yet.";
  }

  const categorySpending = buildCategorySpending(transactions);
  const matchedCategory = Array.from(categorySpending.keys()).find((category) =>
    lowerMessage.includes(category.toLowerCase())
  );

  if (matchedCategory) {
    return `You have spent Rs.${(categorySpending.get(matchedCategory) || 0).toLocaleString("en-IN")} on ${matchedCategory} this month.`;
  }

  return `Your current balance is Rs.${snapshot.balance.toLocaleString("en-IN")}. Total income is Rs.${snapshot.totalIncome.toLocaleString("en-IN")}, total expenses are Rs.${snapshot.totalExpense.toLocaleString("en-IN")}, and this month you have spent Rs.${snapshot.monthlyExpense.toLocaleString("en-IN")}.`;
};

const getMarketContext = async (message) => {
  const symbol = resolveMarketSymbol(message);
  const lowerMessage = String(message).toLowerCase();

  if (!hasMarketDataAccess()) {
    return {
      available: false,
      data: null,
      reason: "ALPHA_VANTAGE_API_KEY is not configured",
    };
  }

  if (/top gainers|top losers|market movers|most active/.test(lowerMessage)) {
    return {
      available: true,
      data: { movers: await getTopMovers() },
    };
  }

  if (/news|headline|sentiment/.test(lowerMessage)) {
    return {
      available: true,
      data: {
        symbol,
        news: await getMarketNews({ ticker: symbol, limit: 4 }),
      },
    };
  }

  if (symbol === "BTC" || symbol === "ETH") {
    return {
      available: true,
      data: {
        symbol,
        quote: await getCryptoQuote(symbol),
        news: await getMarketNews({ ticker: symbol, limit: 3 }),
      },
    };
  }

  if (symbol) {
    return {
      available: true,
      data: {
        symbol,
        quote: await getMarketQuote(symbol),
        news: await getMarketNews({ ticker: symbol, limit: 3 }),
      },
    };
  }

  return {
    available: hasMarketDataAccess(),
    data: {
      news: await getMarketNews({ limit: 3 }),
    },
  };
};

const answerWithGroq = async ({ category, userQuestion, financeSnapshot, recentMessages, marketContext }) => {
  if (!hasGroqAccess()) {
    return "The advanced conversational assistant is ready, but GROQ_API_KEY is not configured in the backend yet.";
  }

  const systemPrompt =
    category === "market_query" && marketContext
      ? buildMarketAnalysisPrompt({ userQuestion, marketContext, financeSnapshot })
      : buildAssistantSystemPrompt({
          financeSnapshot,
          marketAvailable: marketContext?.available ?? hasMarketDataAccess(),
        });

  const messages = [
    ...recentMessages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    { role: "user", content: userQuestion },
  ];

  return createGroqCompletion({
    systemPrompt,
    messages,
    temperature: category === "casual" ? 0.7 : 0.3,
    maxTokens: category === "market_query" ? 800 : 600,
  });
};

const handleAssistantMessage = async ({ message, user }) => {
  const text = String(message || "").trim().slice(0, 2500);
  const category = classifyAssistantQuery(text);

  if (!text) {
    return {
      reply: "Ask me anything about your finances, the market, or even the current date and time.",
      action: { performed: false, type: "empty_message" },
      suggestions: buildSuggestions("general_conversation", hasMarketDataAccess()),
      context: null,
    };
  }

  const [recentMessages, financeData] = await Promise.all([
    getRecentMessages(user._id),
    loadUserFinanceData(user._id),
  ]);

  const { transactions, budgets } = financeData;
  const financeSnapshot = buildFinanceSnapshot(transactions, budgets);

  if (category === "utility") {
    const utilityReply = answerUtilityQuery(text);
    if (utilityReply) {
      await appendConversationExchange(user._id, text, utilityReply, category);
      return {
        reply: utilityReply,
        action: { performed: false, type: "utility_response" },
        suggestions: buildSuggestions(category, hasMarketDataAccess()),
        context: { financeSnapshot },
      };
    }
  }

  if (category === "transaction_action") {
    const result = await createTransactionFromMessage({ message: text, user, budgets, transactions });
    if (result) {
      const refreshedData = await loadUserFinanceData(user._id);
      const refreshedSnapshot = buildFinanceSnapshot(refreshedData.transactions, refreshedData.budgets);
      await appendConversationExchange(user._id, text, result.reply, category);
      return {
        ...result,
        suggestions: buildSuggestions(category, hasMarketDataAccess()),
        context: { financeSnapshot: refreshedSnapshot },
      };
    }
  }

  if (category === "budget_action") {
    const lowerMessage = text.toLowerCase();
    const result = /\b(delete|remove)\b/.test(lowerMessage)
      ? await deleteBudgetFromMessage({ message: text, user, budgets })
      : await createOrUpdateBudgetFromMessage({ message: text, user, budgets });

    if (!result) {
      const reply = "Please tell me the budget category and amount, for example: set budget for travel 5000.";
      await appendConversationExchange(user._id, text, reply, category);
      return {
        reply,
        action: { performed: false, type: "budget_missing_details" },
        suggestions: buildSuggestions(category, hasMarketDataAccess()),
        context: { financeSnapshot },
      };
    }

    const refreshedData = await loadUserFinanceData(user._id);
    const refreshedSnapshot = buildFinanceSnapshot(refreshedData.transactions, refreshedData.budgets);
    await appendConversationExchange(user._id, text, result.reply, category);
    return {
      ...result,
      suggestions: buildSuggestions(category, hasMarketDataAccess()),
      context: { financeSnapshot: refreshedSnapshot },
    };
  }

  if (category === "finance_summary") {
    const reply = buildFinanceReply({ message: text, transactions, budgets, snapshot: financeSnapshot });
    await appendConversationExchange(user._id, text, reply, category);
    return {
      reply,
      action: { performed: false, type: "finance_summary" },
      suggestions: buildSuggestions(category, hasMarketDataAccess()),
      context: { financeSnapshot },
    };
  }

  if (category === "market_query") {
    const marketContext = await getMarketContext(text);
    const reply =
      !marketContext.available && !hasGroqAccess()
        ? "I can help with market analysis after you configure ALPHA_VANTAGE_API_KEY for live data and GROQ_API_KEY for conversational analysis."
        : await answerWithGroq({
            category,
            userQuestion: text,
            financeSnapshot,
            recentMessages,
            marketContext,
          });

    await appendConversationExchange(user._id, text, reply, category);
    return {
      reply,
      action: { performed: false, type: "market_response" },
      suggestions: buildSuggestions(category, marketContext.available),
      context: {
        financeSnapshot,
        market: marketContext,
      },
    };
  }

  if (category === "finance_advice" || category === "casual" || category === "general_conversation") {
    const reply = await answerWithGroq({
      category,
      userQuestion: text,
      financeSnapshot,
      recentMessages,
      marketContext: { available: hasMarketDataAccess() },
    });

    await appendConversationExchange(user._id, text, reply, category);
    return {
      reply,
      action: { performed: false, type: "groq_response" },
      suggestions: buildSuggestions(category, hasMarketDataAccess()),
      context: { financeSnapshot },
    };
  }

  const fallbackReply = hasGroqAccess()
    ? await answerWithGroq({
        category: "general_conversation",
        userQuestion: text,
        financeSnapshot,
        recentMessages,
        marketContext: { available: hasMarketDataAccess() },
      })
    : "I can help with your budgets, transactions, finance questions, date/time, and market updates once GROQ_API_KEY is configured.";

  await appendConversationExchange(user._id, text, fallbackReply, "general_conversation");
  return {
    reply: fallbackReply,
    action: { performed: false, type: "fallback_response" },
    suggestions: buildSuggestions("general_conversation", hasMarketDataAccess()),
    context: { financeSnapshot },
  };
};

module.exports = { handleAssistantMessage };
