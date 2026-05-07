const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query";
const COMPANY_SYMBOLS = {
  tesla: "TSLA",
  tsla: "TSLA",
  apple: "AAPL",
  aapl: "AAPL",
  nvidia: "NVDA",
  nvda: "NVDA",
  microsoft: "MSFT",
  msft: "MSFT",
  amazon: "AMZN",
  amzn: "AMZN",
  google: "GOOGL",
  alphabet: "GOOGL",
  meta: "META",
  bitcoin: "BTC",
  btc: "BTC",
  ethereum: "ETH",
  eth: "ETH",
};

const getAlphaVantageConfig = () => ({
  apiKey: process.env.ALPHA_VANTAGE_API_KEY || "",
  entitlement: process.env.ALPHA_VANTAGE_ENTITLEMENT || "",
});

const hasMarketDataAccess = () => Boolean(getAlphaVantageConfig().apiKey);

const fetchAlphaVantage = async (params) => {
  const { apiKey, entitlement } = getAlphaVantageConfig();

  if (!apiKey) {
    return null;
  }

  const url = new URL(ALPHA_VANTAGE_BASE_URL);
  Object.entries({
    ...params,
    apikey: apiKey,
    ...(entitlement ? { entitlement } : {}),
  }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Market data request failed with status ${response.status}`);
  }

  return response.json();
};

const getMarketQuote = async (symbol) => {
  const payload = await fetchAlphaVantage({
    function: "GLOBAL_QUOTE",
    symbol,
  });

  if (!payload || !payload["Global Quote"]) {
    return null;
  }

  const quote = payload["Global Quote"];

  return {
    symbol,
    price: Number(quote["05. price"] || 0),
    change: Number(quote["09. change"] || 0),
    changePercent: quote["10. change percent"] || "0%",
    volume: Number(quote["06. volume"] || 0),
    latestTradingDay: quote["07. latest trading day"] || null,
  };
};

const getCryptoQuote = async (symbol) => {
  const payload = await fetchAlphaVantage({
    function: "CURRENCY_EXCHANGE_RATE",
    from_currency: symbol,
    to_currency: "USD",
  });

  if (!payload || !payload["Realtime Currency Exchange Rate"]) {
    return null;
  }

  const quote = payload["Realtime Currency Exchange Rate"];

  return {
    symbol,
    price: Number(quote["5. Exchange Rate"] || 0),
    latestTradingDay: quote["6. Last Refreshed"] || null,
    sourceCurrency: quote["2. From_Currency Name"] || symbol,
    targetCurrency: quote["4. To_Currency Name"] || "USD",
  };
};

const getTopMovers = async () => {
  const payload = await fetchAlphaVantage({
    function: "TOP_GAINERS_LOSERS",
  });

  if (!payload) {
    return null;
  }

  return {
    lastUpdated: payload.last_updated || null,
    topGainers: Array.isArray(payload.top_gainers) ? payload.top_gainers.slice(0, 3) : [],
    topLosers: Array.isArray(payload.top_losers) ? payload.top_losers.slice(0, 3) : [],
    mostActivelyTraded: Array.isArray(payload.most_actively_traded)
      ? payload.most_actively_traded.slice(0, 3)
      : [],
  };
};

const getMarketNews = async (options = {}) => {
  const payload = await fetchAlphaVantage({
    function: "NEWS_SENTIMENT",
    tickers: options.ticker || "",
    topics: options.topics || "financial_markets,finance",
    sort: "LATEST",
    limit: options.limit || 3,
  });

  if (!payload || !Array.isArray(payload.feed)) {
    return null;
  }

  return payload.feed.slice(0, options.limit || 3).map((item) => ({
    title: item.title,
    source: item.source,
    summary: item.summary,
    url: item.url,
    timePublished: item.time_published,
    sentimentLabel: item.overall_sentiment_label,
  }));
};

const resolveMarketSymbol = (message) => {
  const lowerMessage = String(message || "").toLowerCase();
  const companyMatch = Object.entries(COMPANY_SYMBOLS).find(([name]) => lowerMessage.includes(name));

  if (companyMatch) {
    return companyMatch[1];
  }

  const explicitMatch = String(message || "").match(/\b[A-Z]{1,5}\b/g) || [];
  return explicitMatch[0] || null;
};

module.exports = {
  hasMarketDataAccess,
  getMarketQuote,
  getCryptoQuote,
  getTopMovers,
  getMarketNews,
  resolveMarketSymbol,
};
