const buildSuggestions = () => [
  "Upload a CSV statement",
  "Import confirmed transactions",
  "Show my recent transactions",
  "Generate my monthly report",
];

const run = async ({ financeSnapshot }) => {
  return {
    intent: "DOCUMENT_HELP",
    agent: "DocumentAgent",
    reply:
      "You can upload a bank statement or receipt file (CSV, XLSX, or PDF) and I’ll extract transactions for preview before importing. Use the Upload section in the app, or call POST /api/uploads/statement (multipart form-data: file). Then confirm import via POST /api/uploads/import-confirmed.",
    action: { performed: false, type: "document_help" },
    suggestions: buildSuggestions(),
    context: { financeSnapshot },
    data: null,
  };
};

module.exports = { run };

