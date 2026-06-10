const AIReport = require("../../models/AIReport");
const Budget = require("../../models/Budget");
const Transaction = require("../../models/Transaction");
const { hasMarketDataAccess } = require("../marketService");
const { hasLlmAccess, createChatCompletion } = require("../ai/llmClient");
const { buildAssistantSystemPrompt } = require("../assistantPrompts");
const { getMonthRange } = require("../ai/financeContext");
const { sumByType, topCategories, detectBudgetAlerts } = require("./analyticsService");
const { buildForecast } = require("./forecastService");

const buildDeterministicReportNarrative = ({ month, year, totals, topCats, budgetAlerts, forecast }) => {
  const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
  const topLine = topCats.length > 0 ? `${topCats[0].category} (${topCats[0].amount.toLocaleString("en-IN")} Rs)` : "n/a";
  const budgetLine =
    budgetAlerts.length > 0
      ? `Budget watch: ${budgetAlerts
          .slice(0, 3)
          .map((b) => `${b.category} ${b.percentUsed.toFixed(0)}%`)
          .join(", ")}.`
      : "No budget alerts for this month.";

  return `Monthly report for ${monthLabel}: Income Rs.${totals.totalIncome.toLocaleString(
    "en-IN"
  )}, Expenses Rs.${totals.totalExpense.toLocaleString("en-IN")}, Balance Rs.${totals.balance.toLocaleString(
    "en-IN"
  )}. Top spending category: ${topLine}. ${budgetLine} Forecast: next month expenses about Rs.${Number(
    forecast.predictedExpense
  ).toLocaleString("en-IN")} (confidence ${(forecast.confidence * 100).toFixed(0)}%).`;
};

const generateMonthlyReport = async ({ userId, month, year }) => {
  const { start, end } = getMonthRange({ month, year });

  const [transactions, budgets] = await Promise.all([
    Transaction.find({ userId, date: { $gte: start, $lte: end } }).sort({ date: -1, createdAt: -1 }),
    Budget.find({ userId }).sort({ createdAt: -1 }),
  ]);

  const totals = sumByType(transactions);
  const topCats = topCategories(transactions, { limit: 5, monthOnly: false });

  const spentByCategory = new Map();
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => spentByCategory.set(t.category, (spentByCategory.get(t.category) || 0) + t.amount));

  const budgetsWithSpent = budgets.map((b) => ({
    category: b.category,
    limit: b.limit,
    allocated: b.limit,
    spent: spentByCategory.get(b.category) || 0,
  }));

  const budgetAlerts = detectBudgetAlerts(budgetsWithSpent);

  // Forecast uses all transaction history (not only this month).
  const fullHistory = await Transaction.find({ userId }).sort({ date: -1, createdAt: -1 }).limit(2500);
  const forecast = buildForecast({ transactions: fullHistory });

  const narrativeFallback = buildDeterministicReportNarrative({
    month,
    year,
    totals,
    topCats,
    budgetAlerts,
    forecast,
  });

  let insights = narrativeFallback;
  let suggestions = [];

  if (hasLlmAccess()) {
    const financeSnapshot = {
      totalIncome: totals.totalIncome,
      totalExpense: totals.totalExpense,
      balance: totals.balance,
      monthlyIncome: totals.totalIncome,
      monthlyExpense: totals.totalExpense,
      totalBudget: budgets.reduce((s, b) => s + b.limit, 0),
      remainingBudget: budgets.reduce((s, b) => s + b.limit, 0) - totals.totalExpense,
      budgetCount: budgets.length,
      transactionCount: transactions.length,
    };

    const systemPrompt = buildAssistantSystemPrompt({
      financeSnapshot,
      marketAvailable: hasMarketDataAccess(),
    });

    const llm = await createChatCompletion({
      systemPrompt: `${systemPrompt}

You are generating a monthly finance report. Be concise, numbers-first, and give actionable suggestions.
Return a short report paragraph plus a "Suggestions:" section with 3 bullet points.`,
      messages: [
        {
          role: "user",
          content: `Report context (JSON):
${JSON.stringify(
  {
    month,
    year,
    totals,
    topCategories: topCats,
    budgetAlerts,
    forecast,
  },
  null,
  2
)}

Write the monthly report.`,
        },
      ],
      temperature: 0.3,
      maxTokens: 700,
    });

    if (llm) {
      insights = llm;
      // Best-effort extraction of suggestions list from the model output.
      const lines = llm.split("\n").map((l) => l.trim());
      const suggestionLines = lines.filter((l) => /^[-*]\s+/.test(l)).map((l) => l.replace(/^[-*]\s+/, ""));
      suggestions = suggestionLines.slice(0, 3);
    }
  }

  const report = await AIReport.findOneAndUpdate(
    { userId, month, year },
    {
      userId,
      month,
      year,
      totalIncome: totals.totalIncome,
      totalExpense: totals.totalExpense,
      balance: totals.balance,
      topCategories: topCats,
      budgetAlerts,
      insights,
      suggestions,
      forecast,
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return report;
};

const getMonthlyReport = async ({ userId, month, year }) => {
  return AIReport.findOne({ userId, month, year });
};

module.exports = {
  generateMonthlyReport,
  getMonthlyReport,
};

