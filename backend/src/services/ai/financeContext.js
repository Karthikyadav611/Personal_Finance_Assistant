const Budget = require("../../models/Budget");
const Transaction = require("../../models/Transaction");

const loadUserFinanceData = async (userId, { limitTransactions } = {}) => {
  const transactionQuery = Transaction.find({ userId }).sort({ date: -1, createdAt: -1 });
  if (Number.isFinite(limitTransactions) && limitTransactions > 0) {
    transactionQuery.limit(limitTransactions);
  }

  const [transactions, budgets] = await Promise.all([
    transactionQuery,
    Budget.find({ userId }).sort({ createdAt: -1 }),
  ]);

  return { transactions, budgets };
};

const buildFinanceSnapshot = (transactions, budgets, now = new Date()) => {
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

  const monthlyIncome = transactions
    .filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return (
        transaction.type === "income" &&
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
    monthlyIncome,
    monthlyExpense,
    totalBudget,
    remainingBudget: totalBudget - monthlyExpense,
    budgetCount: budgets.length,
    transactionCount: transactions.length,
  };
};

const buildCategorySpending = (transactions, { monthOnly = true, now = new Date() } = {}) => {
  const spendingMap = new Map();

  let monthStart = null;
  if (monthOnly) {
    monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
  }

  transactions
    .filter((transaction) => transaction.type === "expense")
    .filter((transaction) => (monthStart ? new Date(transaction.date) >= monthStart : true))
    .forEach((transaction) => {
      spendingMap.set(
        transaction.category,
        (spendingMap.get(transaction.category) || 0) + transaction.amount
      );
    });

  return spendingMap;
};

const getMonthRange = ({ month, year }) => {
  const start = new Date(year, month - 1, 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(year, month, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

module.exports = {
  loadUserFinanceData,
  buildFinanceSnapshot,
  buildCategorySpending,
  getMonthRange,
};

