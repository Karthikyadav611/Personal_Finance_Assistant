const asyncHandler = require("../middleware/asyncHandler");
const { sendSuccess } = require("../utils/response");
const { generateMonthlyReport, getMonthlyReport } = require("../services/finance/reportService");

// POST /api/reports/generate
// Body: { month?: number, year?: number }
const generateReport = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = Number(req.body?.month ?? now.getMonth() + 1);
  const year = Number(req.body?.year ?? now.getFullYear());

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    res.status(400);
    throw new Error("month must be an integer between 1 and 12");
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2200) {
    res.status(400);
    throw new Error("year must be a valid 4-digit year");
  }

  const report = await generateMonthlyReport({ userId: req.user._id, month, year });
  sendSuccess(res, 201, "Monthly report generated successfully", report);
});

// GET /api/reports/:month/:year
const getReport = asyncHandler(async (req, res) => {
  const month = Number(req.params.month);
  const year = Number(req.params.year);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    res.status(400);
    throw new Error("month must be an integer between 1 and 12");
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2200) {
    res.status(400);
    throw new Error("year must be a valid 4-digit year");
  }

  const report = await getMonthlyReport({ userId: req.user._id, month, year });
  if (!report) {
    res.status(404);
    throw new Error("Report not found");
  }

  sendSuccess(res, 200, "Monthly report fetched successfully", report);
});

module.exports = { generateReport, getReport };

