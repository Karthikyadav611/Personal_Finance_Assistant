const { hasMarketDataAccess } = require("../../marketService");
const { hasLlmAccess, createChatCompletion } = require("../llmClient");
const { buildAssistantSystemPrompt } = require("../../assistantPrompts");
const { topCategories } = require("../../finance/analyticsService");
const { buildCategorySpending } = require("../financeContext");

const formatCurrency = (value) => `Rs.${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const buildSuggestions = (marketAvailable) =>
  marketAvailable
    ? ["Show my recent transactions", "Top 3 categories this month", "Top gainers today", "Predict next month spending"]
    : ["Show my recent transactions", "Top 3 categories this month", "Predict next month spending", "How can I save money?"];

const buildDeterministicReply = ({ message, transactions, budgets, financeSnapshot, now }) => {
  const lower = String(message || "").toLowerCase();

  const normalizeKey = (value) =>
    String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

  const sameMonthYear = (date) => {
    const d = new Date(date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const wantsBudgetStatus =
    lower.includes("budget") &&
    /\b(left|remaining|cross|crossed|exceed|exceeded|over|overspend|overspent|usage|used|spent|within|under|status|check|ok|okay)\b/.test(
      lower
    );

  if (wantsBudgetStatus) {
    if (!Array.isArray(budgets) || budgets.length === 0) {
      return "You don't have any budgets set yet. Try: \"Set shopping budget to 5000\".";
    }

    // First try: match an existing budget category mentioned in the message.
    const matchedBudget =
      budgets.find((b) => lower.includes(normalizeKey(b.category))) ||
      (() => {
        const phraseMatch = lower.match(/([a-z &]+)\s+budget\b/);
        if (!phraseMatch?.[1]) return null;
        const candidate = normalizeKey(phraseMatch[1]);
        if (!candidate) return null;
        return (
          budgets.find((b) => normalizeKey(b.category) === candidate) ||
          budgets.find((b) => normalizeKey(b.category).includes(candidate)) ||
          budgets.find((b) => candidate.includes(normalizeKey(b.category))) ||
          null
        );
      })();

    if (!matchedBudget) {
      const available = budgets
        .map((b) => b.category)
        .filter(Boolean)
        .slice(0, 8)
        .join(", ");
      return `I couldn't find that budget category. Available budgets: ${available || "n/a"}.`;
    }

    const budgetKey = normalizeKey(matchedBudget.category);

    const monthExpenseTx = transactions
      .filter((t) => t.type === "expense")
      .filter((t) => sameMonthYear(t.date));

    const exactMatches = monthExpenseTx.filter((t) => normalizeKey(t.category) === budgetKey);

    let matchedTransactions = exactMatches;
    let matchNote = "";

    // If we can't find any exact category matches, try a best-effort fuzzy match.
    // This helps when users have categories like "Online Shopping" but a budget named "Shopping".
    if (matchedTransactions.length === 0) {
      const fuzzyMatches = monthExpenseTx.filter((t) => {
        const key = normalizeKey(t.category);
        return key.includes(budgetKey) || budgetKey.includes(key);
      });

      if (fuzzyMatches.length > 0) {
        matchedTransactions = fuzzyMatches;
        const matchedCats = Array.from(new Set(fuzzyMatches.map((t) => t.category))).slice(0, 3).join(", ");
        matchNote = matchedCats ? `\n- Category match: used ${matchedCats} (fuzzy match)` : "";
      }
    }

    const spentThisMonth = matchedTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const limit = Number(matchedBudget.limit || 0);
    const remaining = limit - spentThisMonth;
    const percentUsed = limit > 0 ? (spentThisMonth / limit) * 100 : 0;

    const monthLabel = now.toLocaleString("en-IN", { month: "long", year: "numeric" });

    const header = `${matchedBudget.category} budget status (${monthLabel}):`;

    const lines = [
      `- Budget limit: ${formatCurrency(limit)}`,
      `- Spent this month: ${formatCurrency(spentThisMonth)}`,
      remaining >= 0
        ? `- Remaining: ${formatCurrency(remaining)}`
        : `- Over by: ${formatCurrency(Math.abs(remaining))}`,
      `- Usage: ${Number.isFinite(percentUsed) ? percentUsed.toFixed(0) : "0"}%`,
    ];

    const verdict =
      remaining >= 0
        ? "You are within budget."
        : "Yes, you have exceeded this budget.";

    return `${header}\n${lines.join("\n")}${matchNote}\n\n${verdict}`;
  }

  const monthExpenses = transactions
    .filter((t) => t.type === "expense")
    .filter((t) => sameMonthYear(t.date));

  const monthIncomes = transactions
    .filter((t) => t.type === "income")
    .filter((t) => sameMonthYear(t.date));

  const monthExpenseTotal = monthExpenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const monthIncomeTotal = monthIncomes.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const biggestExpense = monthExpenses.reduce(
    (best, t) => (!best || Number(t.amount || 0) > Number(best.amount || 0) ? t : best),
    null
  );

  const isCompareIncomeExpense =
    /\b(compare|comparison)\b/.test(lower) && /\b(income)\b/.test(lower) && /\b(expense|expenses)\b/.test(lower);

  if (isCompareIncomeExpense) {
    const ratio = monthIncomeTotal > 0 ? (monthExpenseTotal / monthIncomeTotal) * 100 : null;
    const monthLabel = now.toLocaleString("en-IN", { month: "long", year: "numeric" });

    const lines = [
      `Income vs Expenses (${monthLabel}):`,
      `- Income: ${formatCurrency(monthIncomeTotal)}`,
      `- Expenses: ${formatCurrency(monthExpenseTotal)}`,
      `- Net: ${formatCurrency(monthIncomeTotal - monthExpenseTotal)}`,
      ratio === null ? "- Expense ratio: n/a (no income logged this month)" : `- Expense ratio: ${ratio.toFixed(0)}%`,
    ];

    return lines.join("\n");
  }

  const isMonthlyExpenseAnalysis =
    (/\b(analy[sz]e|analysis|breakdown)\b/.test(lower) && /\b(expense|expenses|spending)\b/.test(lower)) ||
    /\b(expenses?\s+this\s+month|spending\s+this\s+month)\b/.test(lower);

  const isMostSpendingQuestion =
    /\b(where)\b/.test(lower) && /\b(spend|spent|spending)\b/.test(lower) && /\b(most|largest|biggest)\b/.test(lower);

  if (isMostSpendingQuestion) {
    const top = topCategories(transactions, { limit: 3, monthOnly: true, now });
    if (top.length === 0) return "I don't see any expenses for this month yet.";

    const monthLabel = now.toLocaleString("en-IN", { month: "long", year: "numeric" });
    const head = `You spent the most on ${top[0].category} (${formatCurrency(top[0].amount)}) in ${monthLabel}.`;
    const lines = top.map((c) => `- ${c.category}: ${formatCurrency(c.amount)}`);
    return `${head}\n\nTop categories this month:\n${lines.join("\n")}`;
  }

  const isUnusualSpending =
    /\b(unusual|abnormal|outlier|spike|suspicious)\b/.test(lower) && /\b(expense|expenses|spend|spent|spending)\b/.test(lower);

  if (isUnusualSpending) {
    const amounts = monthExpenses.map((t) => Number(t.amount || 0)).filter((x) => Number.isFinite(x) && x > 0);
    if (amounts.length < 6) {
      return biggestExpense
        ? `You only have ${amounts.length} expense transaction(s) this month, so anomaly detection is not very reliable yet. Biggest expense: ${formatCurrency(
            biggestExpense.amount
          )} - ${biggestExpense.category}.`
        : "You don't have enough expense transactions this month to detect unusual spending.";
    }

    const median = (values) => {
      const sorted = values.slice().sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    const med = median(amounts);
    const deviations = amounts.map((x) => Math.abs(x - med));
    const mad = median(deviations);

    const flagged = monthExpenses
      .map((t) => {
        const amount = Number(t.amount || 0);
        const score = mad > 0 ? (0.6745 * (amount - med)) / mad : 0;
        return { t, score };
      })
      .filter((x) => x.score > 3.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (flagged.length === 0) {
      return biggestExpense
        ? `I didn't find any strong outliers in your expenses this month. Biggest expense: ${formatCurrency(
            biggestExpense.amount
          )} - ${biggestExpense.category}.`
        : "I didn't find any strong outliers in your expenses this month.";
    }

    const lines = flagged.map(({ t }) => {
      const date = new Date(t.date);
      const when = Number.isNaN(date.getTime()) ? "" : ` (${date.toLocaleDateString("en-IN")})`;
      return `- ${formatCurrency(t.amount)} - ${t.category}${when}`;
    });

    return `Unusual expenses detected this month (flagged vs your typical expense of about ${formatCurrency(
      med
    )}):\n${lines.join("\n")}`;
  }

  if (isMonthlyExpenseAnalysis) {
    const monthLabel = now.toLocaleString("en-IN", { month: "long", year: "numeric" });
    const top = topCategories(transactions, { limit: 5, monthOnly: true, now });

    const topLines =
      top.length > 0
        ? top.map((c) => `- ${c.category}: ${formatCurrency(c.amount)}`).join("\n")
        : "- n/a (no expenses this month)";

    const avgExpense = monthExpenses.length > 0 ? monthExpenseTotal / monthExpenses.length : 0;

    const biggestLine = biggestExpense
      ? `- Biggest expense: ${formatCurrency(biggestExpense.amount)} - ${biggestExpense.category}`
      : "- Biggest expense: n/a";

    return [
      `Expense analysis (${monthLabel}):`,
      `- Total expenses: ${formatCurrency(monthExpenseTotal)} (${monthExpenses.length} expense transaction(s))`,
      `- Average expense: ${formatCurrency(avgExpense)}`,
      biggestLine,
      "",
      "Top categories this month:",
      topLines,
    ].join("\n");
  }

  const wantsCount = /\bhow many\b/.test(lower);
  const wantsList = /\b(show|list|recent|previous|history|last)\b/.test(lower) || lower.includes("transactions");

  if (wantsCount && /\btransactions?\b/.test(lower)) {
    return `You have ${transactions.length} transaction(s) saved.`;
  }

  if (wantsList && /\btransactions?\b/.test(lower)) {
    const items = transactions.slice(0, 8).map((t, idx) => {
      const date = new Date(t.date);
      const when = Number.isNaN(date.getTime()) ? "" : ` (${date.toLocaleDateString("en-IN")})`;
      const label = t.type === "income" ? "Income" : "Expense";
      return `${idx + 1}. ${label}: ${formatCurrency(t.amount)} - ${t.category}${when}`;
    });

    if (items.length === 0) return "You do not have any transactions yet.";

    return `Latest transactions:\n${items.join("\n")}`;
  }

  if (lower.includes("top") || lower.includes("highest") || lower.includes("most") || lower.includes("largest") || lower.includes("biggest")) {
    const top = topCategories(transactions, { limit: 3, monthOnly: true, now });
    if (top.length === 0) return "I don't see any expenses for this month yet.";

    const lines = top.map((c) => `- ${c.category}: ${formatCurrency(c.amount)}`);
    return `Top spending categories this month:\n${lines.join("\n")}`;
  }

  const spendingMap = buildCategorySpending(transactions, { monthOnly: true, now });
  const matchedCategory = Array.from(spendingMap.keys()).find((category) =>
    lower.includes(String(category).toLowerCase())
  );

  if (matchedCategory) {
    return `You have spent ${formatCurrency(spendingMap.get(matchedCategory) || 0)} on ${matchedCategory} this month.`;
  }

  return [
    "Overview:",
    `- Balance: ${formatCurrency(financeSnapshot.balance)}`,
    `- Total income: ${formatCurrency(financeSnapshot.totalIncome)}`,
    `- Total expenses: ${formatCurrency(financeSnapshot.totalExpense)}`,
    `- This month (expenses): ${formatCurrency(financeSnapshot.monthlyExpense)}`,
  ].join("\n");
};

const run = async ({ message, transactions, budgets, financeSnapshot, recentMessages, now = new Date() }) => {
  const deterministic = buildDeterministicReply({ message, transactions, budgets, financeSnapshot, now });

  // Optional: enrich with a short LLM-generated explanation/suggestion.
  if (!hasLlmAccess()) {
    return {
      intent: "SPENDING_INSIGHTS",
      agent: "InsightAgent",
      reply: deterministic,
      action: { performed: false, type: "insight_response" },
      suggestions: buildSuggestions(hasMarketDataAccess()),
      context: { financeSnapshot },
      data: null,
    };
  }

  const systemPrompt = buildAssistantSystemPrompt({
    financeSnapshot,
    marketAvailable: hasMarketDataAccess(),
  });

  let assistant = "";
  try {
    assistant = await createChatCompletion({
      systemPrompt: `${systemPrompt}

You are generating *only* extra suggestions for the user.
Rules:
- Do not repeat the analytics answer.
- Do not introduce new numbers.
- Return 2 short bullet points only.`,
      messages: [
        ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
        {
          role: "user",
          content: `User request: ${message}

Analytics answer:
${deterministic}

Return 2 bullet suggestions.`,
        },
      ],
      temperature: 0.2,
      maxTokens: 160,
    });
  } catch (_err) {
    assistant = "";
  }

  const extra = assistant ? `\n\nNext steps:\n${assistant.trim()}` : "";

  return {
    intent: "SPENDING_INSIGHTS",
    agent: "InsightAgent",
    reply: `${deterministic}${extra}`,
    action: { performed: false, type: "insight_response" },
    suggestions: buildSuggestions(hasMarketDataAccess()),
    context: { financeSnapshot },
    data: null,
  };
};

module.exports = { run };
