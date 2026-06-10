const { answerUtilityQuery } = require("../../utilityService");
const { hasMarketDataAccess } = require("../../marketService");

const buildSuggestions = () => [
  "What is today's date?",
  "Show my recent transactions",
  "How can I save money?",
  "Top gainers today",
];

const run = async ({ message, financeSnapshot }) => {
  const reply = answerUtilityQuery(message);
  return {
    intent: "UTILITY",
    agent: "UtilityAgent",
    reply: reply || "I can help with date/time, calculations, and general finance questions.",
    action: { performed: false, type: "utility_response" },
    suggestions: buildSuggestions(hasMarketDataAccess()),
    context: { financeSnapshot },
    data: null,
  };
};

module.exports = { run };

