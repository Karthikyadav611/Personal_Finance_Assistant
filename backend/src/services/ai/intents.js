const INTENTS = Object.freeze({
  EMPTY: "EMPTY",
  CHAT: "CHAT",
  UTILITY: "UTILITY",

  ADD_TRANSACTION: "ADD_TRANSACTION",
  UPDATE_TRANSACTION: "UPDATE_TRANSACTION",
  DELETE_TRANSACTION: "DELETE_TRANSACTION",

  UPSERT_BUDGET: "UPSERT_BUDGET",
  DELETE_BUDGET: "DELETE_BUDGET",

  FINANCE_SUMMARY: "FINANCE_SUMMARY",
  SPENDING_INSIGHTS: "SPENDING_INSIGHTS",

  FORECAST: "FORECAST",

  GENERATE_REPORT: "GENERATE_REPORT",
  GET_REPORT: "GET_REPORT",

  MARKET_QUERY: "MARKET_QUERY",

  DOCUMENT_HELP: "DOCUMENT_HELP",
});

const AGENTS = Object.freeze({
  ConversationAgent: "ConversationAgent",
  UtilityAgent: "UtilityAgent",
  TransactionAgent: "TransactionAgent",
  BudgetAgent: "BudgetAgent",
  InsightAgent: "InsightAgent",
  ForecastAgent: "ForecastAgent",
  ReportAgent: "ReportAgent",
  MarketAgent: "MarketAgent",
  DocumentAgent: "DocumentAgent",
});

module.exports = { INTENTS, AGENTS };

