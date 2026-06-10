const { INTENTS, AGENTS } = require("./intents");

// Lightweight, deterministic routing. We keep it rule-based so the assistant
// stays reliable even when an LLM key is not configured.
const routeAiMessage = (message) => {
  const text = String(message || "").trim();
  const lower = text.toLowerCase();

  const hasAmount = /(?:₹|rs\.?|inr|\$)\s*\d+|\b\d+(?:\.\d+)?\b/i.test(text);
  const hasExplicitTicker = /\b[A-Z]{2,5}\b/.test(text);
  const hasKnownCompany =
    /\b(tesla|tsla|apple|aapl|nvidia|nvda|microsoft|msft|amazon|amzn|google|googl|alphabet|meta)\b/.test(lower);

  if (!text) {
    return { intent: INTENTS.EMPTY, agent: AGENTS.ConversationAgent, reason: "empty" };
  }

  if (/^(hi|hello|hey|good morning|good evening|thanks|thank you)\b/.test(lower)) {
    return { intent: INTENTS.CHAT, agent: AGENTS.ConversationAgent, reason: "greeting" };
  }

  if (
    /\b(today'?s date|what date|what day|current time|time now|time in india|timezone|who are you|calculate|percentage|percent)\b/.test(
      lower
    ) || /^\d+\s*[%+\-*/().\s]/.test(lower)
  ) {
    return { intent: INTENTS.UTILITY, agent: AGENTS.UtilityAgent, reason: "utility" };
  }

  if (/\b(upload|import|statement|bank statement|receipt|invoice|csv|xlsx|excel|pdf)\b/.test(lower)) {
    return { intent: INTENTS.DOCUMENT_HELP, agent: AGENTS.DocumentAgent, reason: "document" };
  }

  if (/\b(report|monthly report|finance report|generate report)\b/.test(lower)) {
    return { intent: INTENTS.GENERATE_REPORT, agent: AGENTS.ReportAgent, reason: "report" };
  }

  if (/\b(forecast|predict|prediction|next month|estimate spending|trend)\b/.test(lower)) {
    return { intent: INTENTS.FORECAST, agent: AGENTS.ForecastAgent, reason: "forecast" };
  }

  if (
    /\b(stock|stocks|share|shares|price|quote|market|gainers|losers|bitcoin|btc|ethereum|eth|news|headline|sentiment|nifty|sensex|bullish|bearish|crypto)\b/.test(
      lower
    ) ||
    hasKnownCompany ||
    hasExplicitTicker ||
    // "Should I buy TSLA?" style questions without amount.
    (/\b(buy|sell|hold)\b/.test(lower) && (hasKnownCompany || hasExplicitTicker) && !hasAmount)
  ) {
    return { intent: INTENTS.MARKET_QUERY, agent: AGENTS.MarketAgent, reason: "market" };
  }

  if (/\bbudgets?\b/.test(lower) && /\b(add|set|create|update|increase|decrease)\b/.test(lower)) {
    return { intent: INTENTS.UPSERT_BUDGET, agent: AGENTS.BudgetAgent, reason: "budget_upsert" };
  }

  if (/\bbudgets?\b/.test(lower) && /\b(delete|remove)\b/.test(lower)) {
    return { intent: INTENTS.DELETE_BUDGET, agent: AGENTS.BudgetAgent, reason: "budget_delete" };
  }

  // Budget usage/status questions (read-only): remaining, crossed, exceeded, etc.
  if (
    /\bbudgets?\b/.test(lower) &&
    /\b(left|remaining|cross|crossed|exceed|exceeded|over|overspend|overspent|usage|used|spent|within|under|status|check|ok|okay)\b/.test(
      lower
    )
  ) {
    return { intent: INTENTS.SPENDING_INSIGHTS, agent: AGENTS.InsightAgent, reason: "budget_status" };
  }

  // Analytics/insights queries (read-only): compare, analyze, "spent the most", unusual spending, etc.
  // Keep this check above transaction creation so questions like "Compare my income and expenses"
  // don't get mis-routed as "ADD_TRANSACTION" just because they include the words income/expense.
  if (
    /\b(compare|analysis|analy[sz]e|breakdown|summary|overview|most|largest|biggest|highest|top|unusual|abnormal|outlier|spike|where)\b/.test(
      lower
    ) &&
    /\b(income|expense|expenses|spend|spent|spending|transactions?)\b/.test(lower)
  ) {
    return { intent: INTENTS.SPENDING_INSIGHTS, agent: AGENTS.InsightAgent, reason: "insights_query" };
  }

  // Transaction actions (create/update/delete)
  // "delete 3" / "remove 2" (index-based follow-up after listing transactions)
  if (/^\s*(delete|remove)\s+\d{1,3}\s*$/i.test(lower)) {
    return { intent: INTENTS.DELETE_TRANSACTION, agent: AGENTS.TransactionAgent, reason: "tx_delete_index" };
  }

  if (
    /\b(delete|remove)\b/.test(lower) &&
    /\b(transactions?|expense|income|spent|paid|bought|earned|received)\b/.test(lower)
  ) {
    return { intent: INTENTS.DELETE_TRANSACTION, agent: AGENTS.TransactionAgent, reason: "tx_delete" };
  }

  if (/\b(update|edit|change)\b/.test(lower) && /\b(transactions?|expense|income|spent|paid|bought)\b/.test(lower)) {
    return { intent: INTENTS.UPDATE_TRANSACTION, agent: AGENTS.TransactionAgent, reason: "tx_update" };
  }

  if (
    // Common spending / earning verbs.
    // Require an amount OR an explicit write verb, to avoid mis-routing analytics questions
    // like "Compare my income and expenses" into transaction creation.
    ((hasAmount || /\b(add|create|log|record)\b/.test(lower)) &&
      /\b(add|create|log|record|spent|paid|bought|earned|received|salary|credited|income|expense|transaction)\b/.test(
        lower
      )) ||
    // Treat "buy/purchase" as a transaction only when an amount is present.
    ((/\b(buy|purchase)\b/.test(lower) && hasAmount && !hasKnownCompany && !hasExplicitTicker) ||
      // "buy groceries 200" may include a known company word accidentally; prefer amount-based tx add.
      (/\b(buy|purchase)\b/.test(lower) && hasAmount && !/\b(stock|stocks|share|shares|crypto)\b/.test(lower)))
  ) {
    return { intent: INTENTS.ADD_TRANSACTION, agent: AGENTS.TransactionAgent, reason: "tx_add" };
  }

  // Insighty queries that don't necessarily need a write.
  if (
    /\b(balance|summary|summarize|spending|overview|transactions|transaction history|history|previous transactions|recent transactions|last transactions|top categories|highest spending|how much did i spend)\b/.test(
      lower
    )
  ) {
    return { intent: INTENTS.SPENDING_INSIGHTS, agent: AGENTS.InsightAgent, reason: "insights" };
  }

  return { intent: INTENTS.CHAT, agent: AGENTS.ConversationAgent, reason: "default" };
};

module.exports = { routeAiMessage };
