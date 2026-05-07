const validateEmail = (email) => /^\S+@\S+\.\S+$/.test(String(email || "").trim());

const validateObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const normalizeOrigin = (origin) => String(origin || "").trim().replace(/\/+$/, "");

const parseDateInput = (value) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeTransactionPayload = (body) => ({
  type: body.type,
  amount: Number(body.amount),
  category: String(body.category || "").trim(),
  date: body.date ? parseDateInput(body.date) : new Date(),
  description: String(body.description ?? body.note ?? "").trim(),
});

const validateTransactionPayload = (payload) => {
  const errors = [];

  if (!["income", "expense"].includes(payload.type)) {
    errors.push("type must be either income or expense");
  }

  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    errors.push("amount must be a number greater than 0");
  }

  if (!payload.category) {
    errors.push("category is required");
  }

  if (!(payload.date instanceof Date) || Number.isNaN(payload.date.getTime())) {
    errors.push("date must be a valid date");
  }

  return errors;
};

const normalizeBudgetPayload = (body) => ({
  category: String(body.category || "").trim(),
  limit: Number(body.limit ?? body.allocated),
});

const validateBudgetPayload = (payload) => {
  const errors = [];

  if (!payload.category) {
    errors.push("category is required");
  }

  if (!Number.isFinite(payload.limit) || payload.limit <= 0) {
    errors.push("limit must be a number greater than 0");
  }

  return errors;
};

module.exports = {
  validateEmail,
  validateObject,
  normalizeOrigin,
  parseDateInput,
  normalizeTransactionPayload,
  validateTransactionPayload,
  normalizeBudgetPayload,
  validateBudgetPayload,
};
