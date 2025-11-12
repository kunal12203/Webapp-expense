import { config } from '../config';

const API_URL = config.apiUrl;

// Rest of your code stays the same...
interface TokenResponse {
  access_token: string;
  token_type: string;
}


export async function generatePaymentUrl(token: string) {
  const response = await fetch(`${API_URL}/generate-url`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!response.ok) throw new Error("Failed to generate URL");
  return response.json();
}

export async function getPendingTransaction(token: string) {
  const response = await fetch(`${API_URL}/pending-transaction/${token}`);
  if (!response.ok) throw new Error("Failed to fetch pending transaction");
  return response.json();
}

export async function confirmPendingTransaction(
  token: string,
  amount: number,
  category: string,
  description: string,
  date: string,
  type: string
) {
  const response = await fetch(`${API_URL}/confirm-pending/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Remove Authorization header
    body: JSON.stringify({ amount, category, description, date, type }),
  });
  
  if (!response.ok) throw new Error("Failed to confirm transaction");
  return response.json();
}

export async function cancelPendingTransaction(token: string) {
  const response = await fetch(`${API_URL}/cancel-pending/${token}`, {
    method: "DELETE",
  });
  
  if (!response.ok) throw new Error("Failed to cancel transaction");
  return response.json();
}

export async function signup(username: string, email: string, password: string): Promise<TokenResponse> {
  const response = await fetch(`${API_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Signup failed");
  }

  return response.json();
}

export async function login(username: string, password: string): Promise<TokenResponse> {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Login failed");
  }

  return response.json();
}

export async function getExpenses(token: string, category?: string, type?: string) {
  const url = new URL(`${API_URL}/expenses`);
  if (category) url.searchParams.append("category", category);
  if (type) url.searchParams.append("type", type);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Failed to fetch expenses");
  return response.json();
}

export async function createExpense(
  token: string,
  amount: number,
  category: string,
  description: string,
  date: string,
  type: string
) {
  const response = await fetch(`${API_URL}/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount, category, description, date, type }),
  });

  if (!response.ok) throw new Error("Failed to create expense");
  return response.json();
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
  const response = await fetch(`${API_URL}/expenses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount, category, description, date, type }),
  });

  if (!response.ok) throw new Error("Failed to update expense");
  return response.json();
}

export async function deleteExpense(token: string, id: number) {
  const response = await fetch(`${API_URL}/expenses/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Failed to delete expense");
  return response.json();
}
