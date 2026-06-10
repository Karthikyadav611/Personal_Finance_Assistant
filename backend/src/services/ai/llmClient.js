const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const getProvider = () => {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
};

const hasLlmAccess = () => Boolean(getProvider());

const sanitizeMessage = (message) =>
  String(message || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, 2500);

const createChatCompletion = async ({
  systemPrompt,
  messages,
  temperature = 0.3,
  maxTokens = 700,
  model,
}) => {
  const provider = getProvider();

  if (!provider) {
    throw new Error("No LLM provider configured. Set GROQ_API_KEY or OPENAI_API_KEY.");
  }

  const url = provider === "groq" ? GROQ_API_URL : OPENAI_API_URL;
  const apiKey = provider === "groq" ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;

  const selectedModel =
    model ||
    (provider === "groq"
      ? process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
      : process.env.OPENAI_MODEL || "gpt-4o-mini");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      temperature,
      max_completion_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((message) => ({
          role: message.role,
          content: sanitizeMessage(message.content),
        })),
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || `${provider} request failed with status ${response.status}`);
  }

  return payload?.choices?.[0]?.message?.content?.trim() || "";
};

const extractJsonObject = (text) => {
  const raw = String(text || "");
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const jsonLike = raw.slice(start, end + 1);
  try {
    return JSON.parse(jsonLike);
  } catch (_error) {
    return null;
  }
};

module.exports = {
  hasLlmAccess,
  createChatCompletion,
  extractJsonObject,
};

