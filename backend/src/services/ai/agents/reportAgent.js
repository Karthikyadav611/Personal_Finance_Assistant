const { hasMarketDataAccess } = require("../../marketService");
const { generateMonthlyReport, getMonthlyReport } = require("../../finance/reportService");

const MONTHS = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sept: 9,
  sep: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const resolveMonthYear = (message, now = new Date()) => {
  const lower = String(message || "").toLowerCase();
  const yearMatch = lower.match(/\b(20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : now.getFullYear();

  const monthEntry = Object.entries(MONTHS).find(([name]) => lower.includes(name));
  const month = monthEntry ? monthEntry[1] : now.getMonth() + 1;

  return { month, year };
};

const buildSuggestions = (marketAvailable) =>
  marketAvailable
    ? ["Download my report", "Top gainers today", "Show my top categories", "Predict next month spending"]
    : ["Show my top categories", "Predict next month spending", "How can I save money?", "Explain SIP"];

const run = async ({ intent, message, user, financeSnapshot }) => {
  const { month, year } = resolveMonthYear(message);

  const report =
    intent === "GET_REPORT"
      ? await getMonthlyReport({ userId: user._id, month, year })
      : await generateMonthlyReport({ userId: user._id, month, year });

  if (!report) {
    return {
      intent: intent || "GET_REPORT",
      agent: "ReportAgent",
      reply: `I couldn’t find a saved report for ${month}/${year}. You can ask: “Generate my monthly report”.`,
      action: { performed: false, type: "report_not_found" },
      suggestions: buildSuggestions(hasMarketDataAccess()),
      context: { financeSnapshot },
      data: null,
    };
  }

  const reply = report.insights || `Report generated for ${month}/${year}.`;

  return {
    intent: intent || "GENERATE_REPORT",
    agent: "ReportAgent",
    reply,
    action: { performed: true, type: "report_generated", resourceId: report._id },
    suggestions: buildSuggestions(hasMarketDataAccess()),
    context: { financeSnapshot, report },
    data: { report },
  };
};

module.exports = { run };

