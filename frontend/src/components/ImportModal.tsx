import React, { useState } from "react";
import { API_ENDPOINTS } from "../config/api";
import { Loader2, X, UploadCloud, FileSpreadsheet, CheckCircle } from "lucide-react";

const ImportModal = ({ isOpen, onClose, onImportComplete }: any) => {
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(API_ENDPOINTS.import, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      setResult(data);
      if (onImportComplete) onImportComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="glass-card w-full max-w-md p-6 relative animate-slide-up bg-white dark:bg-slate-900">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <UploadCloud className="w-5 h-5 text-indigo-600" /> Import Expenses
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        {!result ? (
          <div className="space-y-6">
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileSpreadsheet className="w-10 h-10 text-slate-400 group-hover:text-indigo-500 mb-3 transition-colors" />
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center px-4">
                  {file ? <span className="font-semibold text-indigo-600">{file.name}</span> : <span>Click to upload <span className="font-semibold">CSV</span> or <span className="font-semibold">Excel</span></span>}
                </p>
              </div>
              <input type="file" className="hidden" accept=".csv, .xlsx, .xls" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>

            <button
              onClick={handleImport}
              disabled={loading || !file}
              className="w-full btn-gradient disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Start Import"}
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Import Complete!</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Successfully processed <span className="font-bold text-emerald-600">{result.imported}</span> transactions.
              {result.failed > 0 && <span className="block text-rose-500 text-sm mt-1">({result.failed} failed)</span>}
            </p>
            <button onClick={onClose} className="btn-ghost w-full">Done</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportModal;