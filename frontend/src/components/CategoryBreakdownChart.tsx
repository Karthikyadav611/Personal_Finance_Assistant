import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useFinanceData } from "@/hooks/use-finance-data";

const CATEGORY_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

const chartConfig = {
  expenses: {
    label: "Expenses by Category",
  },
};

export const CategoryBreakdownChart = () => {
  const { transactions, loading, error } = useFinanceData();
  const categoryMap = new Map<string, number>();

  transactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      categoryMap.set(transaction.category, (categoryMap.get(transaction.category) || 0) + transaction.amount);
    });

  const categoryData = Array.from(categoryMap.entries()).map(([name, value], index) => ({
    name,
    value,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));

  const total = categoryData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Expenses by Category</CardTitle>
        <div className="text-slate-400 text-sm">Total: Rs.{total.toLocaleString("en-IN")}</div>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-4 text-sm text-red-300">{error}</p>}
        {loading && <p className="mb-4 text-sm text-slate-300">Loading chart...</p>}
        {!loading && categoryData.length === 0 && !error && (
          <p className="mb-4 text-sm text-slate-300">Add expense transactions to see category breakdown.</p>
        )}
        <ChartContainer config={chartConfig} className="h-[350px] flex justify-center items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="30%"
                cy="50%"
                outerRadius={120}
                innerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value, name) => [`Rs.${Number(value).toLocaleString("en-IN")}`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 space-y-2">
          {categoryData.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-slate-300">{item.name}</span>
              </div>
              <div className="text-white font-medium">
                Rs.{item.value.toLocaleString("en-IN")} ({total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0"}
                %)
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
