const express = require("express");

const {
  getTransactions,
  getTransactionsLegacy,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");
const { protect } = require("../middleware/authMiddleware");

const apiRouter = express.Router();
const legacyRouter = express.Router();

apiRouter.use(protect);
legacyRouter.use(protect);

apiRouter.get("/", getTransactions);
apiRouter.post("/", createTransaction);
apiRouter.put("/:id", updateTransaction);
apiRouter.delete("/:id", deleteTransaction);

legacyRouter.get("/", getTransactionsLegacy);
legacyRouter.post("/", createTransaction);
legacyRouter.put("/:id", updateTransaction);
legacyRouter.delete("/:id", deleteTransaction);

module.exports = { apiRouter, legacyRouter };
