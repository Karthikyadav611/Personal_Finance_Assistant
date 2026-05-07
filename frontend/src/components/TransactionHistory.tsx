import { useEffect, useState, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, ArrowUpCircle, ArrowDownCircle, Search, TrendingUp, TrendingDown, Wallet, X, Check } from "lucide-react";
import { notifyFinanceDataUpdated } from "@/utils/financeEvents";
import { API_BASE_URL } from "@/config/api";

interface Transaction {
  _id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  date: string;
}

interface TransactionHistoryProps {
  searchTerm?: string;
  setSearchTerm?: (value: string) => void;
}

/* ── Stat pill ── */
const StatPill = ({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  delay: number;
}) => (
  <div className="th-stat" style={{ animationDelay: `${delay}ms` }}>
    <div className="th-stat-icon" style={{ background: color }}>
      {icon}
    </div>
    <div>
      <div className="th-stat-value" style={{ color: color.includes("34,197") ? "#4ade80" : color.includes("239,68") ? "#f87171" : "#60a5fa" }}>
        {value}
      </div>
      <div className="th-stat-label">{label}</div>
    </div>
  </div>
);

/* ── Transaction row ── */
const TransactionRow = ({ tx, index }: { tx: Transaction; index: number }) => {
  const isIncome = tx.type === "income";
  return (
    <div
      className="th-tx-row"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      {/* Icon */}
      <div className={`th-tx-icon ${isIncome ? "th-tx-icon-income" : "th-tx-icon-expense"}`}>
        {isIncome
          ? <ArrowUpCircle size={16} />
          : <ArrowDownCircle size={16} />}
      </div>

      {/* Details */}
      <div className="th-tx-details">
        <div className="th-tx-note">{tx.note}</div>
        <div className="th-tx-meta">
          <span className="th-tx-category">{tx.category}</span>
          <span className="th-tx-dot">·</span>
          <span>{tx.date}</span>
        </div>
      </div>

      {/* Amount */}
      <div className={`th-tx-amount ${isIncome ? "th-tx-amount-income" : "th-tx-amount-expense"}`}>
        {isIncome ? "+" : "−"}₹{tx.amount.toFixed(2)}
      </div>
    </div>
  );
};

export const TransactionHistory = ({ searchTerm = "", setSearchTerm }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: "expense" as "income" | "expense",
    amount: 0,
    category: "",
    note: "",
  });
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  const API_BASE = API_BASE_URL;
  const token = localStorage.getItem("token");

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, token]);

  const addTransaction = async () => {
    if (newTransaction.amount > 0 && newTransaction.category && newTransaction.note) {
      try {
        const res = await fetch(`${API_BASE}/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(newTransaction),
        });
        if (!res.ok) throw new Error("Failed to add transaction");
        await fetchTransactions();
        notifyFinanceDataUpdated();
        setNewTransaction({ type: "expense", amount: 0, category: "", note: "" });
        closeForm();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openForm = () => { setIsAddingTransaction(true); setTimeout(() => setFormVisible(true), 10); };
  const closeForm = () => { setFormVisible(false); setTimeout(() => setIsAddingTransaction(false), 300); };

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const filtered = transactions.filter((t) => {
    const matchSearch =
      t.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterType === "all" || t.type === filterType;
    return matchSearch && matchFilter;
  });

  const totalIncome   = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netBalance    = totalIncome - totalExpenses;

  return (
    <>
      <style>{`
        /* ── Keyframes ── */
        @keyframes th-fade-up {
          from { opacity:0; transform: translateY(20px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes th-row-in {
          from { opacity:0; transform: translateX(-14px); }
          to   { opacity:1; transform: translateX(0); }
        }
        @keyframes th-form-open {
          from { opacity:0; transform: scaleY(0.85); max-height: 0; }
          to   { opacity:1; transform: scaleY(1);    max-height: 400px; }
        }
        @keyframes th-form-close {
          from { opacity:1; transform: scaleY(1);    max-height: 400px; }
          to   { opacity:0; transform: scaleY(0.85); max-height: 0; }
        }
        @keyframes th-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes th-shimmer {
          from { background-position: -200% center; }
          to   { background-position:  200% center; }
        }
        @keyframes th-pulse-border {
          0%,100% { border-color: rgba(99,179,237,0.12); }
          50%      { border-color: rgba(99,179,237,0.30); }
        }
        @keyframes th-stat-in {
          from { opacity:0; transform: translateY(10px) scale(0.95); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }

        /* ── Card ── */
        .th-card {
          background: rgba(10,18,38,0.75);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(99,179,237,0.13);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05);
          animation: th-pulse-border 5s ease infinite;
        }

        /* ── Header ── */
        .th-header {
          padding: 22px 24px 0;
          background: linear-gradient(160deg, rgba(17,27,60,0.9) 0%, rgba(10,22,50,0.7) 100%);
          border-bottom: 1px solid rgba(99,179,237,0.08);
        }
        .th-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .th-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .th-title-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #2563eb, #0ea5e9);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(37,99,235,0.4);
          flex-shrink: 0;
        }
        .th-title-text {
          font-size: 1.05rem;
          font-weight: 700;
          color: #f1f5f9;
          font-family: 'DM Serif Display', Georgia, serif;
          letter-spacing: -0.01em;
          background: linear-gradient(90deg, #e2e8f0 30%, #93c5fd 70%, #e2e8f0 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: th-shimmer 5s linear infinite;
        }
        .th-add-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          background: linear-gradient(135deg, #2563eb, #0ea5e9);
          border: none;
          border-radius: 12px;
          padding: 9px 16px;
          font-size: 0.78rem;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 14px rgba(37,99,235,0.35);
          letter-spacing: 0.02em;
          font-family: inherit;
        }
        .th-add-btn:hover  { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,99,235,0.5); }
        .th-add-btn:active { transform: scale(0.96); }

        /* ── Stats ── */
        .th-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding-bottom: 18px;
        }
        .th-stat {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(20,32,65,0.6);
          border: 1px solid rgba(99,179,237,0.1);
          border-radius: 14px;
          padding: 12px 14px;
          animation: th-stat-in 0.5s cubic-bezier(.22,1,.36,1) both;
          transition: background 0.25s, border-color 0.25s;
        }
        .th-stat:hover {
          background: rgba(30,48,95,0.7);
          border-color: rgba(99,179,237,0.22);
        }
        .th-stat-icon {
          width: 30px; height: 30px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          opacity: 0.85;
        }
        .th-stat-value {
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          line-height: 1;
        }
        .th-stat-label {
          font-size: 0.65rem;
          color: rgba(100,116,139,0.8);
          margin-top: 3px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* ── Body ── */
        .th-body { padding: 18px 24px 20px; }

        /* ── Add form ── */
        .th-form-wrap {
          transform-origin: top;
          overflow: hidden;
          margin-bottom: 14px;
        }
        .th-form-wrap.open  { animation: th-form-open  0.32s cubic-bezier(.22,1,.36,1) forwards; }
        .th-form-wrap.close { animation: th-form-close 0.28s ease forwards; }
        .th-form {
          background: rgba(20,32,65,0.7);
          border: 1px solid rgba(99,179,237,0.14);
          border-radius: 16px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .th-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .th-field {
          background: rgba(10,18,38,0.7);
          border: 1px solid rgba(99,179,237,0.14);
          border-radius: 10px;
          padding: 9px 13px;
          font-size: 0.8rem;
          color: #e2e8f0;
          outline: none;
          width: 100%;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .th-field::placeholder { color: rgba(100,116,139,0.6); }
        .th-field:focus {
          border-color: rgba(59,130,246,0.5);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .th-field::-webkit-inner-spin-button { -webkit-appearance: none; }
        .th-form-actions { display: flex; gap: 8px; }
        .th-btn-confirm {
          display: flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, #16a34a, #15803d);
          border: none; border-radius: 10px;
          padding: 8px 16px;
          font-size: 0.78rem; font-weight: 600;
          color: white; cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 12px rgba(22,163,74,0.35);
          font-family: inherit;
        }
        .th-btn-confirm:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(22,163,74,0.5); }
        .th-btn-cancel {
          display: flex; align-items: center; gap: 6px;
          background: rgba(30,41,80,0.6);
          border: 1px solid rgba(99,179,237,0.18);
          border-radius: 10px;
          padding: 8px 14px;
          font-size: 0.78rem; font-weight: 600;
          color: rgba(148,163,184,0.8); cursor: pointer;
          transition: background 0.2s, color 0.2s;
          font-family: inherit;
        }
        .th-btn-cancel:hover { background: rgba(51,65,100,0.7); color: #e2e8f0; }

        /* ── Search & filter ── */
        .th-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 14px;
        }
        .th-search-wrap {
          flex: 1;
          position: relative;
        }
        .th-search-icon {
          position: absolute;
          left: 12px; top: 50%;
          transform: translateY(-50%);
          color: rgba(100,116,139,0.6);
          pointer-events: none;
        }
        .th-search {
          width: 100%;
          background: rgba(20,32,65,0.7);
          border: 1px solid rgba(99,179,237,0.14);
          border-radius: 12px;
          padding: 9px 12px 9px 36px;
          font-size: 0.8rem;
          color: #e2e8f0;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .th-search::placeholder { color: rgba(100,116,139,0.6); }
        .th-search:focus {
          border-color: rgba(59,130,246,0.5);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }

        /* ── Transaction list ── */
        .th-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
          max-height: 360px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(99,179,237,0.18) transparent;
          padding-right: 2px;
        }
        .th-list::-webkit-scrollbar { width: 4px; }
        .th-list::-webkit-scrollbar-thumb { background: rgba(99,179,237,0.18); border-radius: 4px; }

        .th-tx-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: rgba(20,32,65,0.5);
          border: 1px solid rgba(99,179,237,0.08);
          border-radius: 14px;
          animation: th-row-in 0.4s cubic-bezier(.22,1,.36,1) both;
          transition: background 0.22s, border-color 0.22s, transform 0.22s;
          cursor: default;
        }
        .th-tx-row:hover {
          background: rgba(30,48,95,0.65);
          border-color: rgba(99,179,237,0.18);
          transform: translateX(3px);
        }
        .th-tx-icon {
          width: 34px; height: 34px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .th-tx-icon-income  { background: rgba(34,197,94,0.15);  color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
        .th-tx-icon-expense { background: rgba(239,68,68,0.15);  color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
        .th-tx-details { flex: 1; min-width: 0; }
        .th-tx-note {
          font-size: 0.82rem;
          font-weight: 600;
          color: #e2e8f0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .th-tx-meta {
          font-size: 0.68rem;
          color: rgba(100,116,139,0.75);
          margin-top: 2px;
          display: flex; gap: 5px; align-items: center;
        }
        .th-tx-category {
          background: rgba(99,179,237,0.1);
          border-radius: 4px;
          padding: 1px 6px;
          font-size: 0.63rem;
          color: rgba(147,197,253,0.75);
          letter-spacing: 0.04em;
        }
        .th-tx-dot { opacity: 0.35; }
        .th-tx-amount {
          font-size: 0.88rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          flex-shrink: 0;
        }
        .th-tx-amount-income  { color: #4ade80; }
        .th-tx-amount-expense { color: #f87171; }

        /* ── Loading ── */
        .th-loading {
          display: flex; align-items: center; justify-content: center;
          gap: 10px;
          padding: 28px;
          color: rgba(100,116,139,0.7);
          font-size: 0.8rem;
        }
        .th-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(99,179,237,0.2);
          border-top-color: #60a5fa;
          border-radius: 50%;
          animation: th-spin 0.7s linear infinite;
        }

        /* ── Empty state ── */
        .th-empty {
          text-align: center;
          padding: 32px;
          color: rgba(100,116,139,0.6);
          font-size: 0.8rem;
        }
      `}</style>

      <div className="th-card">
        {/* ── Header ── */}
        <div className="th-header">
          <div className="th-header-top">
            <div className="th-title">
              <div className="th-title-icon">
                <Wallet size={17} color="white" />
              </div>
              <span className="th-title-text">Transaction History</span>
            </div>
            <button className="th-add-btn" onClick={openForm}>
              <PlusCircle size={14} />
              Add Transaction
            </button>
          </div>

          {/* Stats */}
          <div className="th-stats">
            <StatPill
              icon={<TrendingUp size={14} color="white" />}
              label="Total Income"
              value={`₹${totalIncome.toFixed(2)}`}
              color="rgba(34,197,94,0.25)"
              delay={0}
            />
            <StatPill
              icon={<TrendingDown size={14} color="white" />}
              label="Total Expenses"
              value={`₹${totalExpenses.toFixed(2)}`}
              color="rgba(239,68,68,0.25)"
              delay={80}
            />
            <StatPill
              icon={<Wallet size={14} color="white" />}
              label="Net Balance"
              value={`₹${Math.abs(netBalance).toFixed(2)}`}
              color="rgba(59,130,246,0.25)"
              delay={160}
            />
          </div>
        </div>

        {/* ── Body ── */}
        <div className="th-body">
          {/* Add form */}
          {isAddingTransaction && (
            <div className={`th-form-wrap ${formVisible ? "open" : "close"}`}>
              <div className="th-form">
                <div className="th-form-row">
                  <Select
                    value={newTransaction.type}
                    onValueChange={(v: "income" | "expense") =>
                      setNewTransaction({ ...newTransaction, type: v })
                    }
                  >
                    <SelectTrigger className="th-field" style={{ height: "auto" }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <input
                    className="th-field"
                    type="number"
                    placeholder="Amount"
                    value={newTransaction.amount || ""}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <input
                  className="th-field"
                  placeholder="Category (e.g. Food, Travel)"
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                />
                <input
                  className="th-field"
                  placeholder="Note"
                  value={newTransaction.note}
                  onChange={(e) => setNewTransaction({ ...newTransaction, note: e.target.value })}
                />
                <div className="th-form-actions">
                  <button className="th-btn-confirm" onClick={addTransaction}>
                    <Check size={13} /> Add
                  </button>
                  <button className="th-btn-cancel" onClick={closeForm}>
                    <X size={13} /> Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="th-controls">
            <div className="th-search-wrap">
              <Search size={14} className="th-search-icon" />
              <input
                className="th-search"
                placeholder="Search transactions…"
                value={searchTerm}
                onChange={(e) => setSearchTerm?.(e.target.value)}
              />
            </div>
            <Select
              value={filterType}
              onValueChange={(v: "all" | "income" | "expense") => setFilterType(v)}
            >
              <SelectTrigger
                className="th-field"
                style={{ width: "110px", height: "auto", flexShrink: 0 }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* List */}
          {loading ? (
            <div className="th-loading">
              <div className="th-spinner" />
              Loading transactions…
            </div>
          ) : filtered.length === 0 ? (
            <div className="th-empty">No transactions found.</div>
          ) : (
            <div className="th-list">
              {filtered.map((tx, i) => (
                <TransactionRow key={tx._id} tx={tx} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
