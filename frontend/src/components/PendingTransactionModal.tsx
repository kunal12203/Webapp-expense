// src/components/PendingTransactionModal.tsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  API_ENDPOINTS,
  authGet,
  authPut,
  authPost,
} from "../config/api";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const PendingTransactionModal = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await authGet(API_ENDPOINTS.pendingGet(token!));
      setTx(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => load(), []);

  const approve = async () => {
    await authPost(API_ENDPOINTS.pendingApprove(token!), {});
    navigate("/");
  };

  const cancel = async () => {
    await authDelete(API_ENDPOINTS.pendingDelete(token!));
    navigate("/");
  };

  if (loading)
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (!tx)
    return <div className="p-6 text-center">Invalid or expired link</div>;

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">

      <h1 className="text-xl font-semibold">Confirm Transaction</h1>

      <div className="bg-white p-4 rounded-xl border space-y-2">
        <div className="font-semibold text-lg">₹{tx.amount ?? "—"}</div>

        <div className="text-sm text-slate-600">{tx.description}</div>
        <div className="text-xs text-slate-500">
          {tx.category} · {tx.type}
        </div>

        <div className="flex gap-3 mt-3">
          <button
            onClick={approve}
            className="flex-1 bg-emerald-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Confirm
          </button>

          <button
            onClick={cancel}
            className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingTransactionModal;
