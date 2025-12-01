export interface Expense {
  id: number;
  user_id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'expense' | 'income';
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface PendingTransaction {
  id: number;
  token: string;
  amount: number | null;
  category: string | null;
  description: string | null;
  date: string | null;
  type: string | null;
  status: string;
}