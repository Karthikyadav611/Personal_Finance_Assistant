const { buildCategorySpending } = require("../ai/financeContext");

const sumByType = (transactions) => {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
};

const topCategories = (transactions, { limit = 5, monthOnly = true, now = new Date() } = {}) => {
  const spending = buildCategorySpending(transactions, { monthOnly, now });
  return Array.from(spending.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
};

const detectBudgetAlerts = (budgetsWithSpent) => {
  // Expects items shaped like { category, limit/allocated, spent }
  return budgetsWithSpent
    .map((b) => {
      const allocated = Number(b.allocated ?? b.limit ?? 0);
      const spent = Number(b.spent ?? 0);
      const pct = allocated > 0 ? (spent / allocated) * 100 : 0;
      return { category: b.category, allocated, spent, percentUsed: pct };
    })
    .filter((b) => b.allocated > 0 && b.percentUsed >= 70)
    .sort((a, b) => b.percentUsed - a.percentUsed);
};

module.exports = {
  sumByType,
  topCategories,
  detectBudgetAlerts,
};

