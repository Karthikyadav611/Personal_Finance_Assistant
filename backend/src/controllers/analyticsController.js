const asyncHandler = require("../middleware/asyncHandler");
const { sendSuccess } = require("../utils/response");
const Transaction = require("../models/Transaction");
const { buildForecast } = require("../services/finance/forecastService");

// GET /api/analytics/forecast
const getForecast = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ userId: req.user._id })
    .sort({ date: -1, createdAt: -1 })
    .limit(2500);

  const forecast = buildForecast({ transactions });

  sendSuccess(res, 200, "Forecast generated successfully", forecast);
});

module.exports = { getForecast };

