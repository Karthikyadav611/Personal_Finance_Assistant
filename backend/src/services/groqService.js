const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const hasGroqAccess = () => Boolean(process.env.GROQ_API_KEY);

const sanitizeMessage = (message) =>
  String(message || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, 2500);

const createGroqCompletion = async ({ systemPrompt, messages, temperature = 0.3, maxTokens = 700 }) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
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

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message || "Groq request failed");
  }

  return payload.choices?.[0]?.message?.content?.trim() || "";
};

module.exports = {
  hasGroqAccess,
  createGroqCompletion,
};
