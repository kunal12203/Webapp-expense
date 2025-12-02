import React, { useState } from "react";
import { API_ENDPOINTS } from "../config/api";
import { X, Loader2, Download, FileText, Table } from "lucide-react";

const ExportModal = ({ isOpen, onClose }: any) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (type: "csv" | "excel") => {
    setLoading(type);
    const token = localStorage.getItem("token");
    const url = type === "csv" ? API_ENDPOINTS.exportCsv : API_ENDPOINTS.exportExcel;

    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = type === "csv" ? "expenses.csv" : "expenses.xlsx";
      link.click();
    } catch(e) { console.error(e); } 
    finally { setLoading(null); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="glass-card w-full max-w-sm p-6 relative animate-slide-up bg-white dark:bg-slate-900">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Download className="w-5 h-5 text-indigo-600" /> Export Data
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        <div className="grid gap-4">
          <button
            onClick={() => handleExport("csv")}
            disabled={!!loading}
            className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600">CSV Format</div>
                <div className="text-xs text-slate-500">Best for other apps</div>
              </div>
            </div>
            {loading === "csv" && <Loader2 className="animate-spin text-indigo-600" />}
          </button>

          <button
            onClick={() => handleExport("excel")}
            disabled={!!loading}
            className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">
                <Table className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600">Excel Format</div>
                <div className="text-xs text-slate-500">Best for analysis</div>
              </div>
            </div>
            {loading === "excel" && <Loader2 className="animate-spin text-indigo-600" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;