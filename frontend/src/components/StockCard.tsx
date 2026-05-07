
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
}

interface StockCardProps {
  stock: Stock;
}

export const StockCard = ({ stock }: StockCardProps) => {
  const isPositive = stock.change >= 0;

  return (
    <Card className="bg-slate-700/30 border-slate-600 hover:bg-slate-700/50 transition-all duration-200 cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="font-semibold text-white text-lg">{stock.symbol}</div>
            <div className="text-slate-400 text-sm truncate max-w-32">{stock.name}</div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-white">
            ${stock.price.toFixed(2)}
          </div>
          <div className="text-right">
            <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {isPositive ? '+' : ''}{stock.change.toFixed(2)}
            </div>
            <div className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-slate-600">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs">Volume</span>
            <Badge variant="secondary" className="bg-slate-600/50 text-slate-300 text-xs">
              {stock.volume}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
