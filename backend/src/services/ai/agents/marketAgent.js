const {
  hasMarketDataAccess,
  getMarketQuote,
  getCryptoQuote,
  getTopMovers,
  getMarketNews,
  resolveMarketSymbol,
} = require("../../marketService");
const { hasLlmAccess, createChatCompletion } = require("../llmClient");
const { buildAssistantSystemPrompt, buildMarketAnalysisPrompt } = require("../../assistantPrompts");

const buildSuggestions = (marketAvailable) =>
  marketAvailable
    ? ["Top gainers today", "Latest Nvidia news", "Show my balance", "Predict next month’s spending"]
    : ["Show my balance", "How can I save money?", "What is SIP?", "Explain inflation"];

const getMarketContext = async (message) => {
  const symbol = resolveMarketSymbol(message);
  const lowerMessage = String(message).toLowerCase();

  if (!hasMarketDataAccess()) {
    return {
      available: false,
      data: null,
      reason: "ALPHA_VANTAGE_API_KEY is not configured",
    };
  }

  if (/top gainers|top losers|market movers|most active/.test(lowerMessage)) {
    return {
      available: true,
      data: { movers: await getTopMovers() },
    };
  }

  if (/news|headline|sentiment/.test(lowerMessage)) {
    return {
      available: true,
      data: {
        symbol,
        news: await getMarketNews({ ticker: symbol, limit: 4 }),
      },
    };
  }

  if (symbol === "BTC" || symbol === "ETH") {
    return {
      available: true,
      data: {
        symbol,
        quote: await getCryptoQuote(symbol),
        news: await getMarketNews({ ticker: symbol, limit: 3 }),
      },
    };
  }

  if (symbol) {
    return {
      available: true,
      data: {
        symbol,
        quote: await getMarketQuote(symbol),
        news: await getMarketNews({ ticker: symbol, limit: 3 }),
      },
    };
  }

  return {
    available: hasMarketDataAccess(),
    data: {
      news: await getMarketNews({ limit: 3 }),
    },
  };
};

const buildDeterministicMarketReply = (marketContext) => {
  if (!marketContext?.available) {
    return marketContext?.reason
      ? `Live market data is not configured (${marketContext.reason}). I can still explain concepts or general investing basics.`
      : "Live market data is not available right now.";
  }

  const data = marketContext.data || {};
  if (data.quote?.price) {
    const change = Number(data.quote.change || 0);
    const changeLabel = change >= 0 ? `+${change}` : `${change}`;
    return `${data.symbol} price: $${Number(data.quote.price).toFixed(2)} (${changeLabel}, ${data.quote.changePercent || "0%"}).`;
  }

  if (data.movers) {
    const movers = data.movers;
    const topGainers = (movers.topGainers || []).map((x) => x.ticker).filter(Boolean).join(", ");
    const topLosers = (movers.topLosers || []).map((x) => x.ticker).filter(Boolean).join(", ");
    return `Market movers (US): top gainers: ${topGainers || "n/a"}. Top losers: ${topLosers || "n/a"}.`;
  }

  if (Array.isArray(data.news) && data.news.length > 0) {
    return `Latest market headlines: ${data.news.slice(0, 3).map((n) => n.title).join(" | ")}`;
  }

  return "I fetched live market context, but there wasn’t enough structured data to summarize cleanly.";
};

const run = async ({ message, financeSnapshot, recentMessages }) => {
  const marketContext = await getMarketContext(message);

  if (!hasLlmAccess()) {
    return {
      intent: "MARKET_QUERY",
      agent: "MarketAgent",
      reply: buildDeterministicMarketReply(marketContext),
      action: { performed: false, type: "market_response" },
      suggestions: buildSuggestions(marketContext.available),
      context: { financeSnapshot, market: marketContext },
      data: { market: marketContext },
    };
  }

  const systemPrompt = marketContext.available
    ? buildMarketAnalysisPrompt({ userQuestion: message, marketContext, financeSnapshot })
    : buildAssistantSystemPrompt({ financeSnapshot, marketAvailable: false });

  const reply = await createChatCompletion({
    systemPrompt,
    messages: [
      ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ],
    temperature: 0.3,
    maxTokens: 750,
  });

  return {
    intent: "MARKET_QUERY",
    agent: "MarketAgent",
    reply: reply || buildDeterministicMarketReply(marketContext),
    action: { performed: false, type: "market_response" },
    suggestions: buildSuggestions(marketContext.available),
    context: { financeSnapshot, market: marketContext },
    data: { market: marketContext },
  };
};

module.exports = { run };

