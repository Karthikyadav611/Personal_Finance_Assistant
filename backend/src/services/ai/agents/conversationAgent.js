const { hasMarketDataAccess } = require("../../marketService");
const { hasLlmAccess, createChatCompletion } = require("../llmClient");
const { buildAssistantSystemPrompt } = require("../../assistantPrompts");

const buildSuggestions = (marketAvailable) =>
  marketAvailable
    ? ["Show my balance", "How can I save money?", "Top gainers today", "Explain SIP"]
    : ["Show my balance", "How can I save money?", "Explain SIP", "What is inflation?"];

const deterministicFallback = ({ message, financeSnapshot }) => {
  const lower = String(message || "").toLowerCase();

  if (/\b(save money|savings|budgeting tips)\b/.test(lower)) {
    return `Based on your current snapshot (balance Rs.${financeSnapshot.balance.toLocaleString(
      "en-IN"
    )}), a good next step is to (1) track top categories weekly, (2) set category budgets for your largest expense areas, and (3) automate a fixed monthly saving amount right after income hits. If you tell me your monthly income and rent, I can suggest a simple plan.`;
  }

  return "I can help with finance questions, explain concepts (SIP, inflation, mutual funds), and also work with your live transactions and budgets.";
};

const run = async ({ message, financeSnapshot, recentMessages }) => {
  if (!hasLlmAccess()) {
    return {
      intent: "CHAT",
      agent: "ConversationAgent",
      reply: deterministicFallback({ message, financeSnapshot }),
      action: { performed: false, type: "conversation_response" },
      suggestions: buildSuggestions(hasMarketDataAccess()),
      context: { financeSnapshot },
      data: null,
    };
  }

  const systemPrompt = buildAssistantSystemPrompt({
    financeSnapshot,
    marketAvailable: hasMarketDataAccess(),
  });

  const reply = await createChatCompletion({
    systemPrompt,
    messages: [
      ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ],
    temperature: 0.5,
    maxTokens: 650,
  });

  return {
    intent: "CHAT",
    agent: "ConversationAgent",
    reply: reply || deterministicFallback({ message, financeSnapshot }),
    action: { performed: false, type: "conversation_response" },
    suggestions: buildSuggestions(hasMarketDataAccess()),
    context: { financeSnapshot },
    data: null,
  };
};

module.exports = { run };

