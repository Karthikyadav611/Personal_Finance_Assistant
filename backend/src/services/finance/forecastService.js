const { getMonthRange } = require("../ai/financeContext");

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const computeMonthlyTotals = (transactions) => {
  const byMonth = new Map();

  transactions.forEach((t) => {
    const date = new Date(t.date);
    if (Number.isNaN(date.getTime())) return;
    const key = monthKey(date);
    const current = byMonth.get(key) || { key, income: 0, expense: 0 };
    if (t.type === "income") current.income += t.amount;
    if (t.type === "expense") current.expense += t.amount;
    byMonth.set(key, current);
  });

  return Array.from(byMonth.values()).sort((a, b) => (a.key > b.key ? 1 : -1));
};

const movingAverage = (values) => {
  const nums = values.filter((v) => Number.isFinite(v));
  if (nums.length === 0) return 0;
  return nums.reduce((s, v) => s + v, 0) / nums.length;
};

const buildForecast = ({ transactions, now = new Date(), monthsBack = 4 }) => {
  const monthly = computeMonthlyTotals(transactions);
  const recent = monthly.slice(-monthsBack);

  const predictedExpense = movingAverage(recent.map((m) => m.expense));
  const predictedIncome = movingAverage(recent.map((m) => m.income));
  const predictedSavings = predictedIncome - predictedExpense;

  const sampleSize = recent.length;
  const confidence = sampleSize >= 4 ? 0.75 : sampleSize === 3 ? 0.65 : sampleSize === 2 ? 0.5 : 0.35;

  return {
    predictedExpense: Math.round(predictedExpense * 100) / 100,
    predictedIncome: Math.round(predictedIncome * 100) / 100,
    predictedSavings: Math.round(predictedSavings * 100) / 100,
    categoryForecast: [],
    confidence,
    explanation:
      sampleSize > 0
        ? `Forecast is based on the last ${sampleSize} month(s) of transaction history using a moving average.`
        : "Not enough history to forecast yet. Add a few weeks of transactions and try again.",
  };
};

const filterTransactionsForMonth = ({ transactions, month, year }) => {
  const { start, end } = getMonthRange({ month, year });
  return transactions.filter((t) => {
    const date = new Date(t.date);
    return !Number.isNaN(date.getTime()) && date >= start && date <= end;
  });
};

module.exports = {
  buildForecast,
  filterTransactionsForMonth,
};

