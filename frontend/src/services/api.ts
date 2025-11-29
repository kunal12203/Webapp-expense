import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// -------------------------
// AUTH
// -------------------------
export const signup = async (username: string, email: string, password: string) => {
  const res = await api.post("/signup", { username, email, password });
  return res.data;
};

export const login = async (username: string, password: string) => {
  const res = await api.post("/token", { username, password });
  return res.data;
};

// -------------------------
// EXPENSE CRUD
// -------------------------
export const getExpenses = async (
  token: string,
  category?: string,
  type?: string
) => {
  const res = await api.get("/expenses", {
    headers: { Authorization: `Bearer ${token}` },
    params: { category, type },
  });
  return res.data;
};

export const createExpense = async (
  token: string,
  amount: number,
  category: string,
  description: string,
  date: string,
  type: string
) => {
  const res = await api.post(
    "/expenses",
    { amount, category, description, date, type },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const updateExpense = async (
  token: string,
  id: number,
  amount: number,
  category: string,
  description: string,
  date: string,
  type: string
) => {
  const res = await api.put(
    `/expenses/${id}`,
    { amount, category, description, date, type },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const deleteExpense = async (token: string, id: number) => {
  const res = await api.delete(`/expenses/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// -------------------------
// URL Generation
// -------------------------
export const generatePaymentUrl = async (token: string) => {
  const res = await api.post(
    "/generate-url",
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// -------------------------
// PENDING TRANSACTION
// -------------------------
export const getPendingTransaction = async (token: string) => {
  const res = await api.get("/pending-transaction", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const confirmPendingTransaction = async (
  token: string,
  amount: number,
  category: string,
  description: string,
  date: string,
  type: string
) => {
  const res = await api.post(
    "/confirm-transaction",
    { amount, category, description, date, type },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const cancelPendingTransaction = async (token: string) => {
  const res = await api.post(
    "/cancel-transaction",
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// -------------------------
// ✅ SMS PARSER (NEW)
// -------------------------
export const parseSms = async (sms: string) => {
  const res = await api.post("/parse-sms", { sms });
  return res.data;
};
