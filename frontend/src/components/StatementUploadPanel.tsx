import { useMemo, useState } from "react";

import { API_BASE_URL } from "@/config/api";
import { notifyFinanceDataUpdated } from "@/utils/financeEvents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ExtractedTransaction = {
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  description: string;
  raw?: Record<string, unknown>;
};

const formatCurrency = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const StatementUploadPanel = () => {
  const token = localStorage.getItem("token");

  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedTransaction[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedCount = selected.size;
  const allSelected = extracted.length > 0 && selectedCount === extracted.length;

  const canImport = Boolean(token) && Boolean(documentId) && extracted.length > 0 && selectedCount > 0;

  const previewTotal = useMemo(() => extracted.reduce((s, t) => s + (t.amount || 0), 0), [extracted]);

  const toggleIndex = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const setSelectAll = (value: boolean) => {
    if (!value) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(extracted.map((_t, idx) => idx)));
  };

  const uploadAndExtract = async () => {
    setError("");
    setSuccess("");

    if (!token) {
      setError("Please log in first to upload statements.");
      return;
    }

    if (!file) {
      setError("Choose a CSV, XLSX, or PDF file first.");
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${API_BASE_URL}/api/uploads/statement`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to parse statement");

      const data = json?.data || {};
      const txs = Array.isArray(data.extractedTransactions) ? (data.extractedTransactions as ExtractedTransaction[]) : [];

      setDocumentId(String(data.documentId || ""));
      setExtracted(txs);
      setSelected(new Set(txs.map((_t, idx) => idx)));
      setSuccess(`Extracted ${txs.length} transaction(s). Review and import the ones you want.`);
    } catch (err) {
      setDocumentId(null);
      setExtracted([]);
      setSelected(new Set());
      setError(err instanceof Error ? err.message : "Failed to parse statement");
    } finally {
      setLoading(false);
    }
  };

  const importSelected = async () => {
    setError("");
    setSuccess("");

    if (!canImport || !documentId) return;

    setImporting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/uploads/import-confirmed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          documentId,
          selectedIndices: Array.from(selected.values()).sort((a, b) => a - b),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Import failed");

      const importedCount = Number(json?.data?.importedCount ?? 0);
      setSuccess(`Imported ${importedCount} transaction(s) successfully.`);
      notifyFinanceDataUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Upload Statement</CardTitle>
        <p className="text-sm text-slate-400">
          Upload a bank statement (CSV/XLSX/PDF). We extract transactions for preview, then you confirm import.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="text-sm text-red-300">{error}</div>}
        {success && <div className="text-sm text-emerald-300">{success}</div>}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900/40 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-100 hover:file:bg-slate-900/60"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-100 hover:bg-slate-800"
              disabled={loading}
              onClick={() => {
                setFile(null);
                setDocumentId(null);
                setExtracted([]);
                setSelected(new Set());
                setError("");
                setSuccess("");
              }}
            >
              Reset
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" disabled={loading} onClick={uploadAndExtract}>
              {loading ? "Parsing..." : "Upload & Preview"}
            </Button>
          </div>
        </div>

        {extracted.length === 0 ? (
          <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4 text-sm text-slate-400">
            No preview yet. Upload a statement to extract transactions.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-300">
                Preview total: <span className="text-slate-100 font-semibold">{formatCurrency(previewTotal)}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-slate-700 text-slate-100 hover:bg-slate-800"
                  onClick={() => setSelectAll(!allSelected)}
                >
                  {allSelected ? "Clear All" : "Select All"}
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={!canImport || importing}
                  onClick={importSelected}
                >
                  {importing ? "Importing..." : `Import (${selectedCount})`}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <div className="flex items-center justify-center">
                        <Checkbox checked={allSelected} onCheckedChange={(v) => setSelectAll(Boolean(v))} />
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-300">Date</TableHead>
                    <TableHead className="text-slate-300">Type</TableHead>
                    <TableHead className="text-slate-300">Category</TableHead>
                    <TableHead className="text-slate-300">Description</TableHead>
                    <TableHead className="text-right text-slate-300">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extracted.slice(0, 150).map((t, idx) => (
                    <TableRow key={idx} className="bg-slate-900/20">
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selected.has(idx)}
                            onCheckedChange={() => toggleIndex(idx)}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-200">
                        {(() => {
                          const d = new Date(t.date);
                          return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-IN");
                        })()}
                      </TableCell>
                      <TableCell className={t.type === "income" ? "text-emerald-300" : "text-rose-300"}>
                        {t.type}
                      </TableCell>
                      <TableCell className="text-slate-200">{t.category || "Transfers"}</TableCell>
                      <TableCell className="text-slate-300 max-w-[420px] truncate" title={t.description}>
                        {t.description || "Imported transaction"}
                      </TableCell>
                      <TableCell className="text-right text-slate-100 font-medium">
                        {formatCurrency(t.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {extracted.length > 150 && (
                <div className="p-3 text-xs text-slate-400 bg-slate-900/30 border-t border-slate-700">
                  Showing first 150 extracted rows for performance.
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
