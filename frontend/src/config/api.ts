// src/config/api.ts

// Determine API Base URL
// Priority: Environment Variable > Production Default > Localhost
export const API_BASE = import.meta.env.VITE_API_URL || "https://webapp-expense.onrender.com";

export const API_ENDPOINTS = {
  // --- Authentication ---
  signup: `${API_BASE}/api/signup`,
  login: `${API_BASE}/api/login`,
  forgotPassword: `${API_BASE}/api/forgot-password`,
  resetPassword: `${API_BASE}/api/reset-password`,

  // --- Profile & Onboarding ---
  profile: `${API_BASE}/api/profile`,
  completeOnboarding: `${API_BASE}/api/profile/complete-onboarding`,

  // --- Categories ---
  categories: `${API_BASE}/api/categories`,
  categoryStats: `${API_BASE}/api/categories/stats`,
  categoryMigrate: `${API_BASE}/api/categories/migrate`,
  exampleCategories: `${API_BASE}/api/categories/examples`,
  createCategoryBatch: `${API_BASE}/api/categories/batch`,

  // --- Expenses ---
  expenses: `${API_BASE}/api/expenses`,

  // --- Data Management ---
  import: `${API_BASE}/api/import`,
  exportCsv: `${API_BASE}/api/export/csv`,
  exportExcel: `${API_BASE}/api/export/excel`,

  // --- Pending Transactions (Email/SMS) ---
  pendingList: `${API_BASE}/api/pending-transactions`,
  pendingGet: (token: string) => `${API_BASE}/api/pending-transaction/${token}`,
  pendingUpdate: (token: string) => `${API_BASE}/api/pending-transaction/${token}`,
  pendingApprove: (token: string) => `${API_BASE}/api/pending-transaction/${token}/approve`,
  pendingDelete: (token: string) => `${API_BASE}/api/pending-transaction/${token}`,
};

// --- Helper Functions for Authenticated Requests ---

export async function authGet(url: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Request failed");
  return res.json();
}

export async function authPost(url: string, body: any) {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Request failed");
  return res.json();
}

export async function authPut(url: string, body: any) {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Request failed");
  return res.json();
}

export async function authDelete(url: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Request failed");
  return res.json();
}

// --- Specific Service Functions ---

export async function getPendingTransactions() {
  return authGet(API_ENDPOINTS.pendingList);
}

export async function confirmPendingTransaction(
  token: string,
  amount: number,
  category: string,
  description: string,
  date: string,
  type: string
) {
  return authPost(API_ENDPOINTS.pendingApprove(token), {
    amount,
    category,
    description,
    date,
    type,
  });
}

export async function cancelPendingTransaction(token: string) {
  return authDelete(API_ENDPOINTS.pendingDelete(token));
}