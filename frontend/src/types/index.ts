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
  username: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}