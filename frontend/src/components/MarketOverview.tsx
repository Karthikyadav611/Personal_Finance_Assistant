
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from "lucide-react";

interface MarketData {
  sp500: { price: number; change: number; changePercent: number };
  nasdaq: { price: number; change: number; changePercent: number };
  dow: { price: number; change: number; changePercent: number };
}

interface MarketOverviewProps {
  marketData: MarketData;
  chartData: { time: string; price: number }[];
}

export const MarketOverview = ({ marketData, chartData }: MarketOverviewProps) => {
  const renderMarketCard = (title: string, data: { price: number; change: number; changePercent: number }) => (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-slate-300 text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-white">{data.price.toFixed(2)}</div>
            <div className={`flex items-center text-sm ${data.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              {data.change.toFixed(2)} ({data.changePercent.toFixed(2)}%)
            </div>
          </div>
          <div className="w-16 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.slice(-8)}>
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke={data.change >= 0 ? "#10b981" : "#ef4444"} 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {renderMarketCard("S&P 500", marketData.sp500)}
      {renderMarketCard("NASDAQ", marketData.nasdaq)}
      {renderMarketCard("Dow Jones", marketData.dow)}
    </div>
  );
};
