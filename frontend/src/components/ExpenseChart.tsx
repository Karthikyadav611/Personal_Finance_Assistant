import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useFinanceData } from "@/hooks/use-finance-data";

const chartConfig = {
  amount: {
    label: "Expenses",
    color: "hsl(var(--chart-1))",
  },
  budget: {
    label: "Budget",
    color: "hsl(var(--chart-2))",
  },
};

const monthLabel = (dateValue: string) =>
  new Date(dateValue).toLocaleString("en-IN", {
    month: "short",
  });

export const ExpenseChart = () => {
  const { transactions, budgets, loading, error } = useFinanceData();

  const budgetTotal = budgets.reduce((sum, budget) => sum + (budget.allocated ?? budget.limit ?? 0), 0);
  const expenseMap = new Map<string, number>();

  transactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      const label = monthLabel(transaction.date);
      expenseMap.set(label, (expenseMap.get(label) || 0) + transaction.amount);
    });

  const chartData = Array.from(expenseMap.entries())
    .map(([month, amount]) => ({
      month,
      amount,
      budget: budgetTotal,
    }))
    .slice(-6);

  return (
    <Card className="bg-gradient-to-r from-[#1e1b4b] to-[#312e81] border border-indigo-700 shadow-lg backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-white">Monthly Expenses vs Budget</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-4 text-sm text-red-300">{error}</p>}
        {loading && <p className="mb-4 text-sm text-slate-300">Loading chart...</p>}
        {!loading && chartData.length === 0 && !error && (
          <p className="mb-4 text-sm text-slate-300">Add expense transactions to see the chart.</p>
        )}
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickFormatter={(value) => `Rs.${(value / 1000).toFixed(1)}k`}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: number, name: string) => [`Rs.${value.toLocaleString("en-IN")}`, name]}
              />
              <Bar dataKey="budget" fill="var(--color-budget)" fillOpacity={0.4} radius={[4, 4, 0, 0]} />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
