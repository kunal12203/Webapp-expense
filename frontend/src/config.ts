const getApiUrl = (): string => {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://webapp-expense.onrender.com';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:8000';
};

export const config = {
  apiUrl: getApiUrl()
} as const;