const { createChatCompletion, extractJsonObject, hasLlmAccess } = require("../ai/llmClient");

const STATEMENT_CATEGORIES = [
  "Food",
  "Groceries",
  "Transport",
  "Shopping",
  "Rent",
  "Utilities",
  "Entertainment",
  "Healthcare",
  "Education",
  "Investments",
  "Salary",
  "Refunds",
  "Cash",
  "Fees",
  "Travel",
  "Subscriptions",
  "Transfers",
];

const normalizeCategoryChoice = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";

  const aliases = {
    food: "Food",
    dining: "Food",
    restaurant: "Food",
    groceries: "Groceries",
    grocery: "Groceries",
    transport: "Transport",
    transportation: "Transport",
    commute: "Transport",
    shopping: "Shopping",
    rent: "Rent",
    utilities: "Utilities",
    utility: "Utilities",
    bills: "Utilities",
    bill: "Utilities",
    entertainment: "Entertainment",
    healthcare: "Healthcare",
    health: "Healthcare",
    medical: "Healthcare",
    education: "Education",
    investments: "Investments",
    investment: "Investments",
    salary: "Salary",
    income: "Salary",
    refunds: "Refunds",
    refund: "Refunds",
    cashback: "Refunds",
    cash: "Cash",
    fees: "Fees",
    fee: "Fees",
    charges: "Fees",
    travel: "Travel",
    subscriptions: "Subscriptions",
    subscription: "Subscriptions",
    transfer: "Transfers",
    transfers: "Transfers",
  };

  return aliases[raw] || "";
};

const chunk = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const shouldUseAiCategorization = () =>
  process.env.STATEMENT_AI_CATEGORIZATION !== "false" && hasLlmAccess();

const enhanceStatementCategories = async (transactions) => {
  const enhanced = Array.isArray(transactions) ? transactions.map((transaction) => ({ ...transaction })) : [];
  if (!shouldUseAiCategorization()) return enhanced;

  const candidates = enhanced
    .map((transaction, index) => ({ transaction, index }))
    .filter(({ transaction }) => {
      const category = String(transaction.category || "").trim().toLowerCase();
      return !category || category === "transfers";
    });

  if (candidates.length === 0) return enhanced;

  for (const batch of chunk(candidates.slice(0, 200), 35)) {
    const payload = batch.map(({ transaction, index }) => ({
      index,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      rawDescription: transaction.raw?.originalDescription || transaction.description,
    }));

    try {
      const reply = await createChatCompletion({
        temperature: 0.1,
        maxTokens: 1200,
        systemPrompt: [
          "You classify imported bank statement transactions for a personal finance app.",
          "Return only valid JSON. No markdown.",
          `Allowed categories: ${STATEMENT_CATEGORIES.join(", ")}.`,
          "Rules:",
          "- Use Transfers only for person-to-person transfers, self transfers, unclear UPI payments, and wallet/bank movements.",
          "- Paid/debit/card/withdrawal means expense unless the text clearly says refund/cashback.",
          "- Received/credit/deposit means income unless the text clearly says card payment reversal.",
          "- Provision/prov/bazaar/mart/grocery/fresh/kirana/milk are Groceries.",
          "- Hotel/kitchen/juice/cafe/coffee/restaurant/swiggy/zomato are Food.",
          "- BMTC/bus/metro/cab/uber/ola/fuel/petrol are Transport.",
          "- Amazon/Flipkart/Myntra/store/electronics/jewellery are Shopping.",
          "- Recharge/electricity/water/gas/internet/mobile bill are Utilities.",
          "- SIP/mutual fund/stocks/equity are Investments.",
          "- Salary/payroll are Salary; refund/cashback are Refunds.",
          "- Do not invent a category from a personal name alone.",
        ].join("\n"),
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              instructions:
                "For each item, return {index, category, confidence}. category must be one allowed category.",
              items: payload,
            }),
          },
        ],
      });

      const parsed = extractJsonObject(reply);
      const items = Array.isArray(parsed?.items) ? parsed.items : [];

      for (const item of items) {
        const index = Number(item?.index);
        const category = normalizeCategoryChoice(item?.category);
        const confidence = Number(item?.confidence ?? 0);

        if (!Number.isInteger(index) || !category || confidence < 0.55) continue;
        if (!enhanced[index]) continue;

        enhanced[index].category = category;
      }
    } catch (_error) {
      // Uploads must remain reliable even if the AI provider is unavailable.
    }
  }

  return enhanced;
};

module.exports = {
  STATEMENT_CATEGORIES,
  enhanceStatementCategories,
  normalizeCategoryChoice,
};
