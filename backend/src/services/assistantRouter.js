const classifyAssistantQuery = (message) => {
  const lowerMessage = String(message || "").trim().toLowerCase();

  if (!lowerMessage) {
    return "empty";
  }

  if (/^(hi|hello|hey|good morning|good evening|thanks|thank you)\b/.test(lowerMessage)) {
    return "casual";
  }

  if (
    /\b(today'?s date|what date|what day|current time|time now|time in india|timezone|who are you|calculate|percentage|percent)\b/.test(
      lowerMessage
    ) || /^\d+\s*[%+\-*/().\s]/.test(lowerMessage)
  ) {
    return "utility";
  }

  if (
    /\b(delete|remove|update|edit|change|add|create|log|record|spent|paid|bought|earned|received|salary|income|expense|transaction)\b/.test(
      lowerMessage
    )
  ) {
    return "transaction_action";
  }

  if (
    /\bbudget\b/.test(lowerMessage) &&
    /\b(add|set|create|update|increase|decrease|delete|remove)\b/.test(lowerMessage)
  ) {
    return "budget_action";
  }

  if (
    /\b(stock|price|quote|market|gainers|losers|bitcoin|btc|ethereum|eth|news|nifty|sensex|tesla|apple|nvidia|tsla|aapl|nvda|buy|bullish|bearish|crypto)\b/.test(
      lowerMessage
    )
  ) {
    return "market_query";
  }

  if (
    /\b(inflation|sip|mutual fund|mutual funds|save money|savings|investing|invest|budgeting tips|retirement|emergency fund|debt|compound interest)\b/.test(
      lowerMessage
    )
  ) {
    return "finance_advice";
  }

  if (
    /\b(balance|summary|summarize|spending|budget status|overview|recent transactions|how much did i spend)\b/.test(
      lowerMessage
    )
  ) {
    return "finance_summary";
  }

  return "general_conversation";
};

module.exports = { classifyAssistantQuery };
