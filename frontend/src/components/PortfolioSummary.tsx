import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown, IndianRupee } from "lucide-react";
import { useFinanceData } from "@/hooks/use-finance-data";

const formatCurrency = (value: number) => `Rs.${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const isSameMonth = (dateValue: string) => {
  const date = new Date(dateValue);
  const now = new Date();

  return (
    !Number.isNaN(date.getTime()) &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
};

export const PortfolioSummary = () => {
  const { transactions, loading, error } = useFinanceData();

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const monthlyIncome = transactions
    .filter((transaction) => transaction.type === "income" && isSameMonth(transaction.date))
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const monthlyExpenses = transactions
    .filter((transaction) => transaction.type === "expense" && isSameMonth(transaction.date))
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalBalance = totalIncome - totalExpenses;
  const monthlyChange = monthlyIncome - monthlyExpenses;
  const totalSavings = Math.max(totalBalance, 0);
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
  const monthlyChangePercent = monthlyIncome > 0 ? (monthlyChange / monthlyIncome) * 100 : 0;
  const isPositive = monthlyChange >= 0;

  return (
    <Card className="bg-gradient-to-r from-[#1e1b4b] to-[#312e81] border border-indigo-700 shadow-lg backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Wallet className="h-5 w-5 mr-2" />
          Financial Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-4 text-sm text-red-300">{error}</p>}
        {loading && <p className="mb-4 text-sm text-slate-300">Loading overview...</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center mb-2">
              <IndianRupee className="h-5 w-5 text-green-400 mr-2" />
              <span className="text-slate-300 text-sm">Current Balance</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{formatCurrency(totalBalance)}</div>
            <div className={`flex items-center text-sm ${isPositive ? "text-green-400" : "text-red-400"}`}>
              {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              {isPositive ? "+" : "-"}
              {formatCurrency(Math.abs(monthlyChange)).replace("Rs.", "")} this month ({isPositive ? "+" : ""}
              {monthlyChangePercent.toFixed(1)}%)
            </div>
          </div>

          <div>
            <div className="text-slate-300 text-sm mb-3">Breakdown</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge variant="secondary" className="bg-slate-700/50 text-white mr-2 text-xs">
                    TOTAL
                  </Badge>
                  <span className="text-slate-300 text-sm">Income</span>
                </div>
                <span className="text-green-300 text-sm font-medium">{formatCurrency(totalIncome)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge variant="secondary" className="bg-slate-700/50 text-white mr-2 text-xs">
                    TOTAL
                  </Badge>
                  <span className="text-slate-300 text-sm">Expenses</span>
                </div>
                <span className="text-red-300 text-sm font-medium">{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge variant="secondary" className="bg-slate-700/50 text-white mr-2 text-xs">
                    SAVE
                  </Badge>
                  <span className="text-slate-300 text-sm">Savings</span>
                </div>
                <span className="text-white text-sm font-medium">{formatCurrency(totalSavings)}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-600/50">
              <div className="flex justify-between text-sm">
                <span className="text-green-400">This Month In: {formatCurrency(monthlyIncome)}</span>
                <span className="text-red-400">This Month Out: {formatCurrency(monthlyExpenses)}</span>
              </div>
              <div className="mt-2 text-slate-300 text-sm">Savings Rate: {savingsRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
