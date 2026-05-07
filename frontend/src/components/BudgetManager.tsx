import { useCallback, useEffect, useState } from "react";
import { PlusCircle, Trash2, Target, TrendingUp, AlertTriangle, Check, X } from "lucide-react";
import { notifyFinanceDataUpdated } from "@/utils/financeEvents";
import { API_BASE_URL } from "@/config/api";

interface Budget {
  _id: string;
  category: string;
  allocated: number;
  spent: number;
  color: string;
  accent: string;
}

interface BudgetApiItem {
  _id?: string;
  id?: string;
  category: string;
  allocated?: number;
  limit?: number;
  spent?: number;
}

const API_BASE = API_BASE_URL;

const PALETTE = [
  { bg: "rgba(59,130,246,0.15)",  bar: "linear-gradient(90deg,#3b82f6,#60a5fa)", dot: "#60a5fa" },
  { bg: "rgba(34,197,94,0.15)",   bar: "linear-gradient(90deg,#16a34a,#4ade80)", dot: "#4ade80" },
  { bg: "rgba(168,85,247,0.15)",  bar: "linear-gradient(90deg,#7c3aed,#c084fc)", dot: "#c084fc" },
  { bg: "rgba(249,115,22,0.15)",  bar: "linear-gradient(90deg,#ea580c,#fb923c)", dot: "#fb923c" },
  { bg: "rgba(236,72,153,0.15)",  bar: "linear-gradient(90deg,#db2777,#f472b6)", dot: "#f472b6" },
  { bg: "rgba(6,182,212,0.15)",   bar: "linear-gradient(90deg,#0891b2,#22d3ee)", dot: "#22d3ee" },
];

const getPalette = (category: string) => {
  const hash = Array.from(category).reduce((s, c) => s + c.charCodeAt(0), 0);
  return PALETTE[hash % PALETTE.length];
};

const mapBudget = (b: BudgetApiItem): Budget => {
  const p = getPalette(b.category);
  return {
    _id: b._id || b.id || "",
    category: b.category,
    allocated: b.allocated ?? b.limit ?? 0,
    spent: b.spent ?? 0,
    color: p.bg,
    accent: p.dot,
  };
};

/* ── Animated progress bar ── */
const ProgressBar = ({
  pct,
  gradient,
  danger,
}: {
  pct: number;
  gradient: string;
  danger: boolean;
}) => (
  <div className="bm-bar-track">
    <div
      className="bm-bar-fill"
      style={{
        width: `${pct}%`,
        background: danger ? "linear-gradient(90deg,#dc2626,#f87171)" : gradient,
        boxShadow: danger ? "0 0 10px rgba(220,38,38,0.4)" : "0 0 10px rgba(59,130,246,0.3)",
      }}
    />
  </div>
);

/* ── Budget card ── */
const BudgetCard = ({
  budget,
  index,
  onDelete,
}: {
  budget: Budget;
  index: number;
  onDelete: (id: string) => void;
}) => {
  const p = getPalette(budget.category);
  const pct = budget.allocated > 0 ? (budget.spent / budget.allocated) * 100 : 0;
  const capped = Math.min(pct, 100);
  const danger = pct >= 90;
  const warn   = pct >= 70 && pct < 90;
  const remaining = budget.allocated - budget.spent;

  return (
    <div className="bm-budget-card" style={{ animationDelay: `${index * 70}ms` }}>
      {/* Top row */}
      <div className="bm-card-top">
        <div className="bm-cat-left">
          <div className="bm-cat-dot" style={{ background: budget.accent, boxShadow: `0 0 8px ${budget.accent}55` }} />
          <div className="bm-cat-icon" style={{ background: budget.color, border: `1px solid ${budget.accent}30` }}>
            <Target size={13} style={{ color: budget.accent }} />
          </div>
          <span className="bm-cat-name">{budget.category}</span>
        </div>

        <div className="bm-card-right">
          <span
            className="bm-pct-badge"
            style={{
              background: danger ? "rgba(220,38,38,0.15)" : warn ? "rgba(234,179,8,0.15)" : "rgba(34,197,94,0.12)",
              color: danger ? "#f87171" : warn ? "#facc15" : "#4ade80",
              border: `1px solid ${danger ? "rgba(220,38,38,0.3)" : warn ? "rgba(234,179,8,0.3)" : "rgba(34,197,94,0.25)"}`,
            }}
          >
            {danger && <AlertTriangle size={9} style={{ marginRight: 3 }} />}
            {pct.toFixed(0)}%
          </span>
          <button className="bm-delete-btn" onClick={() => onDelete(budget._id)} aria-label="Delete budget">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Progress */}
      <ProgressBar pct={capped} gradient={p.bar} danger={danger} />

      {/* Foot */}
      <div className="bm-card-foot">
        <span className="bm-foot-spent">₹{budget.spent.toLocaleString("en-IN")} spent</span>
        <span className={`bm-foot-rem ${remaining < 0 ? "bm-foot-over" : ""}`}>
          {remaining < 0 ? `₹${Math.abs(remaining).toLocaleString("en-IN")} over` : `₹${remaining.toLocaleString("en-IN")} left`}
        </span>
        <span className="bm-foot-alloc">of ₹{budget.allocated.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
};

export const BudgetManager = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [newBudget, setNewBudget] = useState({ category: "", allocated: 0 });
  const [isAdding, setIsAdding] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const fetchBudgets = useCallback(async () => {
    if (!token) { setBudgets([]); setError("Please log in to view budgets."); return; }
    try {
      setLoading(true); setError("");
      const res = await fetch(`${API_BASE}/budget`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch budgets");
      setBudgets(Array.isArray(data) ? data.map(mapBudget) : []);
    } catch (err) {
      setBudgets([]); setError(err instanceof Error ? err.message : "Failed to fetch budgets");
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  const openForm  = () => { setIsAdding(true);  setTimeout(() => setFormVisible(true), 10); };
  const closeForm = () => { setFormVisible(false); setTimeout(() => { setIsAdding(false); setError(""); }, 300); };

  const addBudget = async () => {
    if (!token) { setError("Please log in to add budgets."); return; }
    if (!newBudget.category.trim() || newBudget.allocated <= 0) { setError("Category and amount are required."); return; }
    try {
      setError("");
      const res = await fetch(`${API_BASE}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category: newBudget.category.trim(), allocated: newBudget.allocated }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add budget");
      await fetchBudgets();
      notifyFinanceDataUpdated();
      setNewBudget({ category: "", allocated: 0 });
      closeForm();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to add budget"); }
  };

  const deleteBudget = async (id: string) => {
    if (!token) { setError("Please log in to delete budgets."); return; }
    try {
      setError("");
      const res = await fetch(`${API_BASE}/budget/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to delete budget");
      setBudgets(prev => prev.filter(b => b._id !== id));
      notifyFinanceDataUpdated();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to delete budget"); }
  };

  const totalAllocated = budgets.reduce((s, b) => s + b.allocated, 0);
  const totalSpent     = budgets.reduce((s, b) => s + b.spent, 0);
  const overallPct     = totalAllocated > 0 ? Math.min((totalSpent / totalAllocated) * 100, 100) : 0;

  return (
    <>
      <style>{`
        @keyframes bm-fade-up {
          from { opacity:0; transform: translateY(18px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes bm-card-in {
          from { opacity:0; transform: translateX(-12px) scale(0.97); }
          to   { opacity:1; transform: translateX(0) scale(1); }
        }
        @keyframes bm-bar-grow {
          from { width: 0%; }
        }
        @keyframes bm-form-open {
          from { opacity:0; transform: scaleY(0.8); max-height:0; }
          to   { opacity:1; transform: scaleY(1);   max-height:300px; }
        }
        @keyframes bm-form-close {
          from { opacity:1; transform: scaleY(1);   max-height:300px; }
          to   { opacity:0; transform: scaleY(0.8); max-height:0; }
        }
        @keyframes bm-shimmer {
          from { background-position: -200% center; }
          to   { background-position:  200% center; }
        }
        @keyframes bm-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes bm-pulse-border {
          0%,100% { border-color: rgba(99,179,237,0.12); }
          50%      { border-color: rgba(99,179,237,0.28); }
        }

        /* Card shell */
        .bm-card {
          background: rgba(10,18,38,0.78);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(99,179,237,0.13);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05);
          animation: bm-pulse-border 5s ease infinite;
        }

        /* Header */
        .bm-header {
          padding: 22px 24px 0;
          background: linear-gradient(160deg, rgba(17,27,60,0.9), rgba(10,22,50,0.7));
          border-bottom: 1px solid rgba(99,179,237,0.08);
        }
        .bm-header-top {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px;
        }
        .bm-title-wrap { display: flex; align-items: center; gap: 10px; }
        .bm-title-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(124,58,237,0.4);
        }
        .bm-title-text {
          font-size: 1.05rem; font-weight: 700;
          font-family: 'DM Serif Display', Georgia, serif;
          letter-spacing: -0.01em;
          background: linear-gradient(90deg, #e2e8f0 30%, #c4b5fd 65%, #e2e8f0 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: bm-shimmer 5s linear infinite;
        }
        .bm-add-btn {
          display: flex; align-items: center; gap: 7px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border: none; border-radius: 12px;
          padding: 9px 16px;
          font-size: 0.78rem; font-weight: 600; color: white;
          cursor: pointer; font-family: inherit; letter-spacing: 0.02em;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 14px rgba(124,58,237,0.35);
        }
        .bm-add-btn:hover  { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,58,237,0.5); }
        .bm-add-btn:active { transform: scale(0.96); }

        /* Overall progress strip */
        .bm-overview {
          display: flex; flex-direction: column; gap: 7px;
          padding-bottom: 16px;
        }
        .bm-overview-row {
          display: flex; justify-content: space-between; align-items: center;
        }
        .bm-overview-label { font-size: 0.68rem; color: rgba(148,163,184,0.65); letter-spacing: 0.06em; text-transform: uppercase; }
        .bm-overview-nums  { display: flex; gap: 18px; }
        .bm-overview-num   { font-size: 0.75rem; font-weight: 600; }
        .bm-overview-alloc { color: #c4b5fd; }
        .bm-overview-spent { color: #a5f3fc; }
        .bm-overview-track {
          height: 5px; background: rgba(255,255,255,0.06); border-radius: 99px; overflow: hidden;
        }
        .bm-overview-fill {
          height: 100%; border-radius: 99px;
          background: linear-gradient(90deg, #7c3aed, #a855f7, #c084fc);
          animation: bm-bar-grow 1s cubic-bezier(.22,1,.36,1) both;
          transition: width 0.6s cubic-bezier(.22,1,.36,1);
        }

        /* Body */
        .bm-body { padding: 18px 24px 22px; display: flex; flex-direction: column; gap: 0; }

        /* Form */
        .bm-form-wrap { transform-origin: top; overflow: hidden; margin-bottom: 14px; }
        .bm-form-wrap.open  { animation: bm-form-open  0.32s cubic-bezier(.22,1,.36,1) forwards; }
        .bm-form-wrap.close { animation: bm-form-close 0.28s ease forwards; }
        .bm-form {
          background: rgba(20,32,65,0.7);
          border: 1px solid rgba(124,58,237,0.2);
          border-radius: 16px; padding: 16px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .bm-field {
          background: rgba(10,18,38,0.7);
          border: 1px solid rgba(99,179,237,0.14);
          border-radius: 10px; padding: 9px 13px;
          font-size: 0.8rem; color: #e2e8f0;
          outline: none; width: 100%; font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .bm-field::placeholder { color: rgba(100,116,139,0.6); }
        .bm-field:focus { border-color: rgba(124,58,237,0.5); box-shadow: 0 0 0 3px rgba(124,58,237,0.12); }
        .bm-field::-webkit-inner-spin-button { -webkit-appearance: none; }
        .bm-form-actions { display: flex; gap: 8px; }
        .bm-btn-confirm {
          display: flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, #16a34a, #15803d);
          border: none; border-radius: 10px; padding: 8px 16px;
          font-size: 0.78rem; font-weight: 600; color: white;
          cursor: pointer; font-family: inherit;
          box-shadow: 0 4px 12px rgba(22,163,74,0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .bm-btn-confirm:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(22,163,74,0.45); }
        .bm-btn-cancel {
          display: flex; align-items: center; gap: 6px;
          background: rgba(30,41,80,0.6); border: 1px solid rgba(99,179,237,0.18);
          border-radius: 10px; padding: 8px 14px;
          font-size: 0.78rem; font-weight: 600; color: rgba(148,163,184,0.8);
          cursor: pointer; font-family: inherit; transition: background 0.2s, color 0.2s;
        }
        .bm-btn-cancel:hover { background: rgba(51,65,100,0.7); color: #e2e8f0; }

        /* Error */
        .bm-error {
          font-size: 0.75rem; color: #f87171;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px; padding: 8px 12px;
          margin-bottom: 12px;
        }

        /* Budget cards */
        .bm-list { display: flex; flex-direction: column; gap: 10px; max-height: 360px; overflow-y: auto;
          scrollbar-width: thin; scrollbar-color: rgba(124,58,237,0.2) transparent; padding-right: 2px;
        }
        .bm-list::-webkit-scrollbar { width: 4px; }
        .bm-list::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.2); border-radius: 4px; }

        .bm-budget-card {
          background: rgba(20,32,65,0.5);
          border: 1px solid rgba(99,179,237,0.09);
          border-radius: 16px; padding: 13px 15px;
          display: flex; flex-direction: column; gap: 9px;
          animation: bm-card-in 0.42s cubic-bezier(.22,1,.36,1) both;
          transition: background 0.22s, border-color 0.22s, transform 0.22s;
        }
        .bm-budget-card:hover {
          background: rgba(30,48,95,0.62);
          border-color: rgba(124,58,237,0.22);
          transform: translateX(3px);
        }

        .bm-card-top { display: flex; align-items: center; justify-content: space-between; }
        .bm-cat-left { display: flex; align-items: center; gap: 8px; }
        .bm-cat-dot  { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .bm-cat-icon {
          width: 26px; height: 26px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .bm-cat-name { font-size: 0.83rem; font-weight: 600; color: #e2e8f0; }

        .bm-card-right { display: flex; align-items: center; gap: 7px; }
        .bm-pct-badge {
          display: inline-flex; align-items: center;
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.04em;
          border-radius: 999px; padding: 3px 9px;
        }
        .bm-delete-btn {
          width: 26px; height: 26px; border-radius: 7px;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.18);
          color: #f87171; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, transform 0.2s;
        }
        .bm-delete-btn:hover { background: rgba(239,68,68,0.22); transform: scale(1.1); }

        /* Progress bar */
        .bm-bar-track {
          height: 6px; background: rgba(255,255,255,0.06);
          border-radius: 99px; overflow: hidden;
        }
        .bm-bar-fill {
          height: 100%; border-radius: 99px;
          animation: bm-bar-grow 0.9s cubic-bezier(.22,1,.36,1) both;
          transition: width 0.7s cubic-bezier(.22,1,.36,1);
        }

        .bm-card-foot { display: flex; align-items: center; gap: 6px; }
        .bm-foot-spent { font-size: 0.7rem; color: rgba(148,163,184,0.7); flex: 1; }
        .bm-foot-rem   { font-size: 0.7rem; font-weight: 600; color: #4ade80; }
        .bm-foot-over  { color: #f87171; }
        .bm-foot-alloc { font-size: 0.68rem; color: rgba(100,116,139,0.55); }

        /* Loading / empty */
        .bm-loading {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 28px; color: rgba(100,116,139,0.7); font-size: 0.8rem;
        }
        .bm-spinner {
          width: 17px; height: 17px;
          border: 2px solid rgba(124,58,237,0.2); border-top-color: #a855f7;
          border-radius: 50%; animation: bm-spin 0.7s linear infinite;
        }
        .bm-empty { text-align: center; padding: 28px; color: rgba(100,116,139,0.55); font-size: 0.8rem; }
      `}</style>

      <div className="bm-card">
        {/* Header */}
        <div className="bm-header">
          <div className="bm-header-top">
            <div className="bm-title-wrap">
              <div className="bm-title-icon">
                <TrendingUp size={17} color="white" />
              </div>
              <span className="bm-title-text">Budget Manager</span>
            </div>
            <button className="bm-add-btn" onClick={openForm}>
              <PlusCircle size={14} /> Add Budget
            </button>
          </div>

          {/* Overall strip */}
          <div className="bm-overview">
            <div className="bm-overview-row">
              <span className="bm-overview-label">Overall progress</span>
              <div className="bm-overview-nums">
                <span className="bm-overview-num bm-overview-spent">
                  ₹{totalSpent.toLocaleString("en-IN")} spent
                </span>
                <span className="bm-overview-num bm-overview-alloc">
                  ₹{totalAllocated.toLocaleString("en-IN")} allocated
                </span>
              </div>
            </div>
            <div className="bm-overview-track">
              <div className="bm-overview-fill" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="bm-body">
          {error && <div className="bm-error">{error}</div>}

          {/* Add form */}
          {isAdding && (
            <div className={`bm-form-wrap ${formVisible ? "open" : "close"}`}>
              <div className="bm-form">
                <input
                  className="bm-field"
                  placeholder="Budget category (e.g. Travel, Food)"
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                />
                <input
                  className="bm-field"
                  type="number"
                  placeholder="Allocated amount (₹)"
                  value={newBudget.allocated || ""}
                  onChange={(e) =>
                    setNewBudget({ ...newBudget, allocated: parseFloat(e.target.value) || 0 })
                  }
                />
                <div className="bm-form-actions">
                  <button className="bm-btn-confirm" onClick={addBudget}>
                    <Check size={13} /> Add
                  </button>
                  <button className="bm-btn-cancel" onClick={closeForm}>
                    <X size={13} /> Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="bm-loading"><div className="bm-spinner" /> Loading budgets…</div>
          ) : budgets.length === 0 && !error ? (
            <div className="bm-empty">No budgets yet. Add your first category budget.</div>
          ) : (
            <div className="bm-list">
              {budgets.map((b, i) => (
                <BudgetCard key={b._id} budget={b} index={i} onDelete={deleteBudget} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
