import { useMemo, useState } from "react";

import { API_BASE_URL } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TopCategory = { category: string; amount: number };
type BudgetAlert = { category: string; allocated: number; spent: number; percentUsed: number };

type MonthlyReport = {
  _id: string;
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  topCategories?: TopCategory[];
  budgetAlerts?: BudgetAlert[];
  insights?: string;
  suggestions?: string[];
  forecast?: {
    predictedExpense?: number;
    predictedIncome?: number;
    predictedSavings?: number;
    confidence?: number;
    explanation?: string;
  };
  createdAt?: string;
};

const monthOptions = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const formatCurrency = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const ReportsPanel = () => {
  const token = localStorage.getItem("token");

  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<MonthlyReport | null>(null);

  const monthLabel = useMemo(() => {
    const entry = monthOptions.find((m) => m.value === month);
    return entry?.label || `Month ${month}`;
  }, [month]);

  const monthNumber = Number(month);
  const yearNumber = Number(year);

  const ensureAuthed = () => {
    if (!token) {
      setError("Please log in first to generate reports.");
      return false;
    }
    return true;
  };

  const validateMonthYear = () => {
    if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      setError("Please select a valid month.");
      return false;
    }
    if (!Number.isInteger(yearNumber) || yearNumber < 2000 || yearNumber > 2200) {
      setError("Please enter a valid year (e.g., 2026).");
      return false;
    }
    return true;
  };

  const fetchReport = async () => {
    if (!ensureAuthed()) return;
    if (!validateMonthYear()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/${monthNumber}/${yearNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to fetch report");
      setReport(json.data as MonthlyReport);
    } catch (err) {
      setReport(null);
      setError(err instanceof Error ? err.message : "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!ensureAuthed()) return;
    if (!validateMonthYear()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ month: monthNumber, year: yearNumber }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to generate report");
      setReport(json.data as MonthlyReport);
    } catch (err) {
      setReport(null);
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Monthly AI Report</CardTitle>
        <p className="text-sm text-slate-400">
          Generate a concise, numbers-first report with budget alerts, top categories, and forecast.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="text-sm text-red-300">{error}</div>}

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="w-full md:w-56">
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="bg-slate-900/40 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-36">
              <Input
                value={year}
                onChange={(e) => setYear(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                inputMode="numeric"
                placeholder="Year"
                className="bg-slate-900/40 border-slate-700 text-slate-100"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-100 hover:bg-slate-800"
              disabled={loading}
              onClick={fetchReport}
            >
              Fetch
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" disabled={loading} onClick={generateReport}>
              Generate
            </Button>
          </div>
        </div>

        {!report ? (
          <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4 text-sm text-slate-400">
            Pick a month/year and click Generate (or Fetch if you already generated one).
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-3">
              <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
                <div className="text-sm text-slate-400 mb-1">
                  {monthLabel} {yearNumber}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <div className="text-xs text-slate-400">Income</div>
                    <div className="text-lg font-semibold text-emerald-300">{formatCurrency(report.totalIncome)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Expense</div>
                    <div className="text-lg font-semibold text-rose-300">{formatCurrency(report.totalExpense)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Balance</div>
                    <div className="text-lg font-semibold text-slate-100">{formatCurrency(report.balance)}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
                <div className="text-sm font-semibold text-slate-100 mb-2">AI Summary</div>
                <div className="text-sm text-slate-300 whitespace-pre-line">
                  {report.insights || "No narrative was generated for this report yet."}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
                <div className="text-sm font-semibold text-slate-100 mb-2">Top Categories</div>
                {(report.topCategories || []).length === 0 ? (
                  <div className="text-sm text-slate-400">No category spending found.</div>
                ) : (
                  <div className="space-y-2">
                    {(report.topCategories || []).slice(0, 5).map((c) => (
                      <div key={c.category} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{c.category}</span>
                        <span className="text-slate-100">{formatCurrency(c.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
                <div className="text-sm font-semibold text-slate-100 mb-2">Budget Alerts</div>
                {(report.budgetAlerts || []).length === 0 ? (
                  <div className="text-sm text-slate-400">No alerts (or no budgets configured).</div>
                ) : (
                  <div className="space-y-2">
                    {(report.budgetAlerts || []).slice(0, 4).map((b) => (
                      <div key={b.category} className="text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">{b.category}</span>
                          <span className="text-amber-300">{b.percentUsed.toFixed(0)}%</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatCurrency(b.spent)} of {formatCurrency(b.allocated)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
                <div className="text-sm font-semibold text-slate-100 mb-2">Suggestions</div>
                {(report.suggestions || []).length === 0 ? (
                  <div className="text-sm text-slate-400">No suggestions yet.</div>
                ) : (
                  <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
                    {(report.suggestions || []).slice(0, 3).map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
                <div className="text-sm font-semibold text-slate-100 mb-2">Forecast</div>
                {!report.forecast ? (
                  <div className="text-sm text-slate-400">No forecast available.</div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Predicted expense</span>
                      <span className="text-slate-100">
                        {formatCurrency(Number(report.forecast.predictedExpense ?? 0))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Predicted income</span>
                      <span className="text-slate-100">
                        {formatCurrency(Number(report.forecast.predictedIncome ?? 0))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Predicted savings</span>
                      <span className="text-slate-100">
                        {formatCurrency(Number(report.forecast.predictedSavings ?? 0))}
                      </span>
                    </div>
                    {typeof report.forecast.confidence === "number" && (
                      <div className="text-xs text-slate-400">
                        Confidence: {(report.forecast.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                    {report.forecast.explanation && (
                      <div className="text-xs text-slate-400">{report.forecast.explanation}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
