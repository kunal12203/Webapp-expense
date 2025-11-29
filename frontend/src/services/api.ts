import { config } from "../config";

const API_URL = config.apiUrl;

// -----------------------------
// AUTH
// -----------------------------
export async function signup(username: string, email: string, password: string) {
  const res = await fetch(`${API_URL}/api/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  if (!res.ok) throw new Error("Signup failed");
  return res.json();
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) throw new Error("Login failed");
  return res.json();
}

// -----------------------------
// EXPENSE CRUD
// -----------------------------
export async function getExpenses(
  token: string,
  category?: string,
  type?: string
) {
  const url = new URL(`${API_URL}/api/expenses`);
  if (category) url.searchParams.append("category", category);
  if (type) url.searchParams.append("type", type);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch expenses");
  return res.json();
}

export async function createExpense(
  token: string,
  amount: number,
  category: string,
  description: string,
  date: string,
  type: string
) {
  const res = await fetch(`${API_URL}/api/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount, category, description, date, type }),
  });

  if (!res.ok) throw new Error("Failed to create expense");
  return res.json();
}

export async function updateExpense(
  token: string,
  id: number,
  amount: number,
  category: string,
  description: string,
  date: string,
  type: string
) {
  const res = await fetch(`${API_URL}/api/expenses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount, category, description, date, type }),
  });

  if (!res.ok) throw new Error("Failed to update expense");
  return res.json();
}

export async function deleteExpense(token: string, id: number) {
  const res = await fetch(`${API_URL}/api/expenses/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to delete expense");
  return res.json();
}

// -----------------------------
// URL GENERATION
// -----------------------------
export async function generatePaymentUrl(token: string) {
  const res = await fetch(`${API_URL}/api/generate-url`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to generate URL");
  return res.json();
}

// -----------------------------
// PENDING TRANSACTION
// -----------------------------
export async function getPendingTransaction(token: string) {
  const res = await fetch(`${API_URL}/api/pending-transaction/${token}`);

  if (!res.ok) throw new Error("Failed to load pending transaction");
  return res.json();
}

export async function confirmPendingTransaction(
  token: string,
  amount: number,
  category: string,
  description: string,
  date: string,
  type: string
) {
  const res = await fetch(`${API_URL}/api/confirm-pending/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, category, description, date, type }),
  });

  if (!res.ok) throw new Error("Failed to confirm transaction");
  return res.json();
}

export async function cancelPendingTransaction(token: string) {
  const res = await fetch(`${API_URL}/api/cancel-pending/${token}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to cancel transaction");
  return res.json();
}

// -----------------------------
// SMS PARSER
// -----------------------------
export async function parseSms(sms: string) {
  const res = await fetch(`${API_URL}/api/sms-parser/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sms_text: sms }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("SMS parsing error:", errorText);
    throw new Error("Failed to parse SMS");
  }
  
  return res.json();
}