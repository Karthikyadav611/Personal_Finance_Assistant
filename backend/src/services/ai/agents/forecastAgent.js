const { hasMarketDataAccess } = require("../../marketService");
const { buildForecast } = require("../../finance/forecastService");

const buildSuggestions = (marketAvailable) =>
  marketAvailable
    ? ["Generate my monthly report", "Top 3 categories this month", "Top gainers today", "How can I save more?"]
    : ["Generate my monthly report", "Top 3 categories this month", "How can I save more?", "Explain SIP"];

const run = async ({ transactions, financeSnapshot }) => {
  const forecast = buildForecast({ transactions });

  const reply = `Next month estimate: expenses ${Number(forecast.predictedExpense).toLocaleString("en-IN")} Rs, income ${Number(
    forecast.predictedIncome
  ).toLocaleString("en-IN")} Rs, predicted savings ${Number(forecast.predictedSavings).toLocaleString(
    "en-IN"
  )} Rs. Confidence: ${(forecast.confidence * 100).toFixed(0)}%. ${forecast.explanation}`;

  return {
    intent: "FORECAST",
    agent: "ForecastAgent",
    reply,
    action: { performed: false, type: "forecast_response" },
    suggestions: buildSuggestions(hasMarketDataAccess()),
    context: { financeSnapshot, forecast },
    data: forecast,
  };
};

module.exports = { run };

