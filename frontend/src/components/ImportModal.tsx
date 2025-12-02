// src/components/ImportModal.tsx

import React, { useState } from "react";
import { API_ENDPOINTS } from "../config/api";
import { Loader2, X } from "lucide-react";

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

    const res = await fetch(API_ENDPOINTS.import, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    const data = await res.json();
    setResult(data);

    setLoading(false);
    if (onImportComplete) onImportComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">

        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Import Expenses</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <input
          type="file"
          accept=".csv, .xlsx, .xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={handleImport}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Import"}
        </button>

        {result && (
          <div className="text-sm bg-slate-50 p-3 rounded-lg">
            Imported: {result.imported} <br />
            Failed: {result.failed}
          </div>
        )}

      </div>
    </div>
  );
};

export default ImportModal;
