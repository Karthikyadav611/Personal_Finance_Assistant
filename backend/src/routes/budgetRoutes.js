const express = require("express");

const {
  getBudgets,
  getBudgetsLegacy,
  createBudget,
  updateBudget,
  deleteBudget,
} = require("../controllers/budgetController");
const { protect } = require("../middleware/authMiddleware");

const apiRouter = express.Router();
const legacyRouter = express.Router();

apiRouter.use(protect);
legacyRouter.use(protect);

apiRouter.get("/", getBudgets);
apiRouter.post("/", createBudget);
apiRouter.put("/:id", updateBudget);
apiRouter.delete("/:id", deleteBudget);

legacyRouter.get("/", getBudgetsLegacy);
legacyRouter.post("/", createBudget);
legacyRouter.put("/:id", updateBudget);
legacyRouter.delete("/:id", deleteBudget);

module.exports = { apiRouter, legacyRouter };
