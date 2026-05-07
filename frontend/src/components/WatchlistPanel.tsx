
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, TrendingDown, X } from "lucide-react";
import { useState } from "react";

export const WatchlistPanel = () => {
  const [watchlist, setWatchlist] = useState([
    { symbol: 'AAPL', price: 175.43, change: 2.34, changePercent: 1.35 },
    { symbol: 'TSLA', price: 208.91, change: -5.67, changePercent: -2.64 },
    { symbol: 'NVDA', price: 875.23, change: 12.45, changePercent: 1.44 },
    { symbol: 'AMD', price: 112.56, change: -1.23, changePercent: -1.08 }
  ]);

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(item => item.symbol !== symbol));
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Star className="h-5 w-5 mr-2 text-yellow-400" />
          My Watchlist
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {watchlist.map((item) => {
          const isPositive = item.change >= 0;
          return (
            <div key={item.symbol} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors group">
              <div className="flex-1">
                <div className="font-semibold text-white">{item.symbol}</div>
                <div className="text-slate-400 text-sm">${item.price.toFixed(2)}</div>
              </div>
              <div className="text-right mr-2">
                <div className={`flex items-center text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFromWatchlist(item.symbol)}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-red-600/20 hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
        
        {watchlist.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Your watchlist is empty</p>
            <p className="text-sm">Add stocks to track their performance</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
