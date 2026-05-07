import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const NewsPanel = () => {
  const newsItems = [
    {
      id: 1,
      title: "Fed Signals Potential Rate Cut in Q2",
      summary: "Federal Reserve hints at monetary policy shifts amid inflation concerns...",
      source: "Financial Times",
      time: "2 hours ago",
      category: "Markets",
      trending: true
    },
    {
      id: 2,
      title: "Tech Stocks Rally on AI Optimism",
      summary: "Major technology companies see gains as AI investments show promise...",
      source: "Bloomberg",
      time: "4 hours ago",
      category: "Technology",
      trending: false
    },
    {
      id: 3,
      title: "Oil Prices Surge on Supply Concerns",
      summary: "Crude oil futures jump 3% as geopolitical tensions affect supply chains...",
      source: "Reuters",
      time: "6 hours ago",
      category: "Commodities",
      trending: true
    },
    {
      id: 4,
      title: "Crypto Market Shows Recovery Signs",
      summary: "Bitcoin and major altcoins gain momentum after recent volatility...",
      source: "CoinDesk",
      time: "8 hours ago",
      category: "Crypto",
      trending: false
    }
  ];

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Newspaper className="h-5 w-5 mr-2" />
          Market News
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {newsItems.map((news) => (
          <div key={news.id} className="p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer group">
            <div className="flex items-start justify-between mb-2">
              <Badge 
                variant="secondary" 
                className={`text-xs ${news.trending ? 'bg-red-600/20 text-red-400 border-red-600/30' : 'bg-slate-600/50 text-slate-300'}`}
              >
                {news.category}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
            
            <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
              {news.title}
            </h3>
            
            <p className="text-slate-400 text-xs mb-3 line-clamp-2">
              {news.summary}
            </p>
            
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{news.source}</span>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {news.time}
              </div>
            </div>
          </div>
        ))}
        
        <Button variant="outline" className="w-full mt-4 border-slate-600 text-slate-300 hover:bg-slate-700">
          View All News
        </Button>
      </CardContent>
    </Card>
  );
};
