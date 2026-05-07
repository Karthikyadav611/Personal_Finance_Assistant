
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockCard } from "@/components/StockCard";

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
}

interface TopStocksProps {
  topStocks: Stock[];
}

export const TopStocks = ({ topStocks }: TopStocksProps) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Top Stocks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topStocks.map((stock) => (
            <StockCard key={stock.symbol} stock={stock} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
