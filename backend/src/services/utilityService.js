const getCurrentIndiaTime = () =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

const evaluateMathExpression = (message) => {
  const normalized = String(message)
    .toLowerCase()
    .replace(/what is|calculate|please|can you|find/gi, "")
    .replace(/(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/gi, "($1/100)*$2")
    .trim();

  if (!/^[0-9+\-*/().\s%]+$/.test(normalized)) {
    return null;
  }

  try {
    const safeExpression = normalized.replace(/%/g, "/100");
    const result = Function(`"use strict"; return (${safeExpression});`)();
    return Number.isFinite(result) ? result : null;
  } catch (_error) {
    return null;
  }
};

const answerUtilityQuery = (message) => {
  const lowerMessage = String(message || "").toLowerCase();

  if (/\b(today'?s date|what date|what day)\b/.test(lowerMessage)) {
    return `Today's date and time in India is ${getCurrentIndiaTime()}.`;
  }

  if (/\b(current time|time now|time in india|timezone)\b/.test(lowerMessage)) {
    return `The current time in India is ${getCurrentIndiaTime()}.`;
  }

  if (/\b(calculate|what is \d|\d+\s*%\s*of)\b/.test(lowerMessage)) {
    const result = evaluateMathExpression(message);
    if (result !== null) {
      return `The answer is ${result.toLocaleString("en-IN", { maximumFractionDigits: 2 })}.`;
    }
  }

  if (/\bwho are you\b/.test(lowerMessage)) {
    return "I'm your finance assistant. I can track your live budgets and transactions, explain finance concepts, and analyze current market data.";
  }

  return null;
};

module.exports = { answerUtilityQuery };
