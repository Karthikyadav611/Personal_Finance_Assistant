import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useFinanceData } from "@/hooks/use-finance-data";

const chartConfig = {
  income: {
    label: "Income Transactions",
    color: "hsl(var(--chart-3))",
  },
  expenses: {
    label: "Expense Transactions",
    color: "hsl(var(--chart-4))",
  },
};

const weekLabel = (dateValue: string) => {
  const date = new Date(dateValue);
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOffset = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
  const weekNumber = Math.floor((dayOffset + startOfYear.getDay()) / 7) + 1;
  return `Week ${weekNumber}`;
};

export const TransactionRateChart = () => {
  const { transactions, loading, error } = useFinanceData();
  const weeklyMap = new Map<string, { week: string; income: number; expenses: number }>();

  transactions.forEach((transaction) => {
    const week = weekLabel(transaction.date);
    const current = weeklyMap.get(week) || { week, income: 0, expenses: 0 };

    if (transaction.type === "income") {
      current.income += 1;
    } else {
      current.expenses += 1;
    }

    weeklyMap.set(week, current);
  });

  const transactionData = Array.from(weeklyMap.values()).slice(-6);

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Weekly Transaction Rate</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-4 text-sm text-red-300">{error}</p>}
        {loading && <p className="mb-4 text-sm text-slate-300">Loading chart...</p>}
        {!loading && transactionData.length === 0 && !error && (
          <p className="mb-4 text-sm text-slate-300">Add transactions to see the weekly trend.</p>
        )}
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={transactionData}>
              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                label={{
                  value: "Number of Transactions",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle", fill: "#94a3b8" },
                }}
              />
              <ChartTooltip content={<ChartTooltipContent />} formatter={(value, name) => [value, name]} />
              <Line
                type="monotone"
                dataKey="income"
                stroke="var(--color-income)"
                strokeWidth={3}
                dot={{ fill: "var(--color-income)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "var(--color-income)", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="var(--color-expenses)"
                strokeWidth={3}
                dot={{ fill: "var(--color-expenses)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "var(--color-expenses)", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
