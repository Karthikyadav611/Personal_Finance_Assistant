const express = require("express");

const { generateReport, getReport } = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/generate", protect, generateReport);
router.get("/:month/:year", protect, getReport);

module.exports = router;

