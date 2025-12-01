import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  confirmPendingTransaction,
  cancelPendingTransaction,
  parseSms,
  createPendingTransaction,
} from "../services/api";

import { X, Check, Trash2, Sparkles, Loader2 } from "lucide-react";

interface Props {
  token: string;
  onClose: () => void;
}

const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Other",
];

export const PendingTransactionModal: React.FC<Props> = ({
  token,
  onClose,
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<"expense" | "income">("expense");

  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [isAiParsed, setIsAiParsed] = useState(false);
  const [error, setError] = useState("");
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  useEffect(() => {
    const parseAndSave = async () => {
      // ✅ Check if we have structured query params (already parsed)
      const hasStructuredParams =
        searchParams.get("amount") && searchParams.get("note");

      if (hasStructuredParams) {
        // Already parsed - just use the params
        const parsedAmount = searchParams.get("amount") || "";
        const parsedNote = searchParams.get("note") || "";
        const parsedCategory = searchParams.get("category") || "Food";
        const parsedType =
          (searchParams.get("type") as "expense" | "income") || "expense";

        setAmount(parsedAmount);
        setDescription(parsedNote);
        setCategory(parsedCategory);
        setType(parsedType);
        setIsAiParsed(true);

        // ✅ AUTO-SAVE to pending transactions
        await autoSavePending({
          amount: parseFloat(parsedAmount),
          category: parsedCategory,
          description: parsedNote,
          date: date,
          type: parsedType,
        });

        return;
      }

      // ✅ Check if we have raw SMS text in URL
      const queryString = window.location.search;

      if (!queryString || queryString.length < 10) {
        console.log("No query params found");
        return;
      }

      // Extract raw SMS (everything after ?)
      const rawSms = decodeURIComponent(queryString.substring(1));


      // Check if it looks like an SMS
      if (
        rawSms.includes("debited") ||
        rawSms.includes("credited") ||
        rawSms.includes("A/C")
      ) {
        setParsing(true);

        try {
          const result = await parseSms(rawSms);


          // Update form fields
          const parsedAmount = result.amount?.toString() || "";
          const parsedMerchant = result.merchant || "";
          const parsedCategory = result.category || "Other";
          const parsedType = result.transaction_type === "credit" ? "income" : "expense";
          const parsedDate = result.date || date;

          setAmount(parsedAmount);
          setDescription(parsedMerchant);
          setCategory(parsedCategory);
          setType(parsedType);
          setDate(parsedDate);
          setIsAiParsed(true);

          // ✅ AUTO-SAVE to pending transactions
          await autoSavePending({
            amount: result.amount || 0,
            category: parsedCategory,
            description: parsedMerchant,
            date: parsedDate,
            type: parsedType,
          });
        } catch (err) {
          console.error("❌ SMS parsing failed:", err);
          setError("Failed to parse SMS. Please enter details manually.");
        } finally {
          setParsing(false);
        }
      }
    };

    parseAndSave();
  }, [searchParams]);

  // ✅ NEW: Auto-save to pending transactions
  const autoSavePending = async (data: {
    amount: number;
    category: string;
    description: string;
    date: string;
    type: string;
  }) => {
    try {

      const authToken = localStorage.getItem("token");
      if (!authToken) {
        console.log("No auth token - skipping auto-save");
        return;
      }

      const result = await createPendingTransaction(authToken, data);
      setPendingToken(result.token);

    } catch (err) {
      console.error("❌ Failed to auto-save:", err);
      // Don't show error to user - they can still enter manually
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }

    setLoading(true);
    setError("");

    try {

      // Use pendingToken if available, otherwise use token from URL
      const tokenToUse = pendingToken || token;

      await confirmPendingTransaction(
        tokenToUse,
        parseFloat(amount),
        category,
        description,
        date,
        type
      );

      alert("✅ Transaction confirmed and saved!");
      onClose();
      navigate("/dashboard"); // Refresh dashboard
    } catch (err) {
      console.error("❌ Error confirming transaction:", err);
      setError(
        err instanceof Error ? err.message : "Failed to confirm transaction"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this transaction?")) return;

    try {
      // Use pendingToken if available, otherwise use token from URL
      const tokenToUse = pendingToken || token;

      await cancelPendingTransaction(tokenToUse);
      onClose();
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Error canceling transaction:", err);
      setError("Failed to cancel");
    }
  };

  const handleClose = () => {
    // ✅ Just close - transaction stays in pending for later review
    console.log("Modal closed - transaction saved in pending");
    onClose();
    navigate("/dashboard");
  };

  // Show loading spinner while parsing
  if (parsing) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="glass-card max-w-md w-full p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
            <h3 className="text-xl font-bold">Parsing SMS with AI...</h3>
            <p className="text-gray-600 text-sm text-center">
              Claude AI is analyzing your transaction details
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-card max-w-md w-full p-6 animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold">Quick Expense</h3>
            {isAiParsed && (
              <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
                <Sparkles className="w-3 h-3" />
                AI
              </span>
            )}
          </div>

          <button onClick={handleClose} className="btn btn-ghost w-10 h-10 p-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isAiParsed && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              ✨ <strong>Auto-filled & saved!</strong> Review and confirm, or
              close to review later.
            </p>
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-4">
          {/* Type Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                type === "expense"
                  ? "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              💸 Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                type === "income"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              💰 Income
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              className="input w-full"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              className="input w-full"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <input
              type="text"
              className="input w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              className="input w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="btn btn-danger flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};