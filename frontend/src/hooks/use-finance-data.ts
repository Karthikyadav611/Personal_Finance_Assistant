import { useCallback, useEffect, useState } from "react";
import { FINANCE_DATA_UPDATED_EVENT } from "@/utils/financeEvents";
import { API_BASE_URL } from "@/config/api";

export interface FinanceTransaction {
  _id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note?: string;
  date: string;
}

export interface FinanceBudget {
  _id: string;
  category: string;
  allocated: number;
  limit?: number;
  spent: number;
}

const API_BASE = API_BASE_URL;

export const useFinanceData = () => {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [budgets, setBudgets] = useState<FinanceBudget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const refresh = useCallback(async () => {
    if (!token) {
      setTransactions([]);
      setBudgets([]);
      setError("Please log in to view financial data.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [transactionsResponse, budgetsResponse] = await Promise.all([
        fetch(`${API_BASE}/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/budget`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [transactionsData, budgetsData] = await Promise.all([
        transactionsResponse.json(),
        budgetsResponse.json(),
      ]);

      if (!transactionsResponse.ok) {
        throw new Error(transactionsData.message || "Failed to fetch transactions");
      }

      if (!budgetsResponse.ok) {
        throw new Error(budgetsData.message || "Failed to fetch budgets");
      }

      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      setBudgets(Array.isArray(budgetsData) ? budgetsData : []);
    } catch (err) {
      setTransactions([]);
      setBudgets([]);
      setError(err instanceof Error ? err.message : "Failed to fetch financial data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handleRefresh = () => {
      refresh();
    };

    window.addEventListener(FINANCE_DATA_UPDATED_EVENT, handleRefresh);
    return () => {
      window.removeEventListener(FINANCE_DATA_UPDATED_EVENT, handleRefresh);
    };
  }, [refresh]);

  return { transactions, budgets, loading, error, refresh };
};
