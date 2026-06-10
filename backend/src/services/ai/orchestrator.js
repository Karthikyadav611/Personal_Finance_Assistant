const { routeAiMessage } = require("./router");
const { INTENTS, AGENTS } = require("./intents");
const { loadUserFinanceData, buildFinanceSnapshot } = require("./financeContext");
const { getRecentMessages, appendConversationExchange } = require("../conversationService");
const { hasMarketDataAccess } = require("../marketService");

const transactionAgent = require("./agents/transactionAgent");
const budgetAgent = require("./agents/budgetAgent");
const insightAgent = require("./agents/insightAgent");
const forecastAgent = require("./agents/forecastAgent");
const marketAgent = require("./agents/marketAgent");
const reportAgent = require("./agents/reportAgent");
const documentAgent = require("./agents/documentAgent");
const utilityAgent = require("./agents/utilityAgent");
const conversationAgent = require("./agents/conversationAgent");

const buildDefaultSuggestions = () => [
  "What is today's date?",
  "Show my balance",
  "Spent 450 on food",
  "Set budget for travel 5000",
];

const shouldRefreshFinanceData = (action) => {
  if (!action || action.performed !== true) return false;
  const type = String(action.type || "").toLowerCase();

  // Only refresh on mutations that could change dashboard numbers.
  return (
    type.includes("transaction") ||
    type.includes("budget") ||
    type.includes("import") ||
    type.includes("statement")
  );
};

const coerceReplyToText = (value) => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch (_err) {
    return String(value);
  }
};

const handleAiChat = async ({ message, user }) => {
  const text = String(message || "").trim().slice(0, 2500);
  const now = new Date();

  let route = routeAiMessage(text);

  if (!text) {
    return {
      intent: route.intent,
      agent: route.agent,
      reply: "Ask me anything about your finances, budgets, transactions, reports, or the market.",
      action: { performed: false, type: "empty_message" },
      suggestions: buildDefaultSuggestions(),
      context: null,
      data: null,
    };
  }

  const [recentMessages, financeData] = await Promise.all([
    getRecentMessages(user._id),
    loadUserFinanceData(user._id),
  ]);

  const { transactions, budgets } = financeData;
  const financeSnapshot = buildFinanceSnapshot(transactions, budgets, now);

  // Context-aware follow-ups: if the user replies "delete" right after we showed a list
  // of transactions, route the message to the TransactionAgent instead of the LLM.
  const lastAssistant = [...recentMessages].reverse().find((m) => m.role === "assistant")?.content || "";

  if (
    route.agent === AGENTS.ConversationAgent &&
    /^\s*(delete|remove)\s*$/i.test(text) &&
    (/\blatest transactions:\b/i.test(lastAssistant) ||
      /\brecent transactions:\b/i.test(lastAssistant) ||
      /\bwhich transaction should i delete\?\b/i.test(lastAssistant))
  ) {
    route = { intent: INTENTS.DELETE_TRANSACTION, agent: AGENTS.TransactionAgent, reason: "tx_delete_followup" };
  }

  let result;

  try {
    switch (route.agent) {
      case "UtilityAgent":
        result = await utilityAgent.run({ message: text, financeSnapshot, now });
        break;
      case "TransactionAgent":
        result = await transactionAgent.run({
          intent: route.intent,
          message: text,
          user,
          budgets,
          transactions,
          financeSnapshot,
          recentMessages,
          now,
        });
        result = {
          intent: route.intent,
          agent: "TransactionAgent",
          ...result,
          suggestions: result.suggestions || [
            "Show my balance",
            "Show my recent transactions",
            "Set budget for food 5000",
          ],
          context: { financeSnapshot },
        };
        break;
      case "BudgetAgent":
        result = await budgetAgent.run({
          intent: route.intent,
          message: text,
          user,
          budgets,
          financeSnapshot,
          recentMessages,
          now,
        });
        result = {
          intent: route.intent,
          agent: "BudgetAgent",
          ...result,
          suggestions: result.suggestions || [
            "Show my budgets",
            "How much budget is left?",
            "Spent 300 on groceries",
          ],
          context: { financeSnapshot },
        };
        break;
      case "InsightAgent":
        result = await insightAgent.run({
          intent: route.intent,
          message: text,
          user,
          budgets,
          transactions,
          financeSnapshot,
          recentMessages,
          now,
        });
        break;
      case "ForecastAgent":
        result = await forecastAgent.run({
          intent: route.intent,
          message: text,
          user,
          budgets,
          transactions,
          financeSnapshot,
          recentMessages,
          now,
        });
        break;
      case "MarketAgent":
        result = await marketAgent.run({
          intent: route.intent,
          message: text,
          user,
          financeSnapshot,
          recentMessages,
          now,
        });
        break;
      case "ReportAgent":
        result = await reportAgent.run({
          intent: route.intent,
          message: text,
          user,
          financeSnapshot,
          now,
        });
        break;
      case "DocumentAgent":
        result = await documentAgent.run({ message: text, user, financeSnapshot, now });
        break;
      case "ConversationAgent":
      default:
        result = await conversationAgent.run({
          intent: route.intent,
          message: text,
          user,
          financeSnapshot,
          recentMessages,
          now,
        });
        break;
    }
  } catch (error) {
    result = {
      intent: route.intent,
      agent: route.agent,
      reply:
        "I ran into an issue while processing that. Please try again, or rephrase the request. (If this keeps happening, check that your AI and market API keys are configured correctly.)",
      action: { performed: false, type: "agent_error" },
      suggestions: buildDefaultSuggestions(),
      context: { financeSnapshot },
      data: null,
    };
  }

  // If an agent performed a mutation (create/update/delete/import), rebuild the snapshot
  // so subsequent replies and UI refresh logic always see consistent real-time numbers.
  let effectiveSnapshot = financeSnapshot;
  if (shouldRefreshFinanceData(result?.action)) {
    try {
      const refreshed = await loadUserFinanceData(user._id);
      effectiveSnapshot = buildFinanceSnapshot(refreshed.transactions, refreshed.budgets, now);
    } catch (_err) {
      effectiveSnapshot = financeSnapshot;
    }
  }

  if (result && typeof result === "object") {
    result.context = { ...(result.context || {}), financeSnapshot: effectiveSnapshot };
  }

  const reply = coerceReplyToText(result?.reply) || "I'm here to help with your finances.";
  const suggestions = Array.isArray(result?.suggestions) && result.suggestions.length > 0 ? result.suggestions : buildDefaultSuggestions();

  // Persist conversation context (lightweight memory).
  await appendConversationExchange(user._id, text, reply, route.intent);

  const context = result?.context ?? { financeSnapshot: effectiveSnapshot, marketAvailable: hasMarketDataAccess() };

  if (!context.financeSnapshot) {
    context.financeSnapshot = effectiveSnapshot;
  }
  if (context.marketAvailable === undefined) {
    context.marketAvailable = hasMarketDataAccess();
  }

  return {
    intent: result.intent || route.intent,
    agent: result.agent || route.agent,
    reply,
    action: result?.action || { performed: false, type: "no_action" },
    suggestions,
    context,
    data: result?.data ?? null,
  };
};

module.exports = { handleAiChat };
