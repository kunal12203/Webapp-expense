// src/components/ExportModal.tsx

import React, { useState } from "react";
import { API_ENDPOINTS } from "../config/api";
import { X, Loader2 } from "lucide-react";

const ExportModal = ({ isOpen, onClose }: any) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async (type: "csv" | "excel") => {
    setLoading(true);

    const token = localStorage.getItem("token");

    const url =
      type === "csv"
        ? API_ENDPOINTS.exportCsv
        : API_ENDPOINTS.exportExcel;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download =
      type === "csv" ? "expenses.csv" : "expenses.xlsx";
    link.click();

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-4">

        <div className="flex justify-between">
          <h2 className="text-lg font-semibold">Export Expenses</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <button
          onClick={() => handleExport("csv")}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Export CSV"}
        </button>

        <button
          onClick={() => handleExport("excel")}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Export Excel"}
        </button>

      </div>
    </div>
  );
};

export default ExportModal;
