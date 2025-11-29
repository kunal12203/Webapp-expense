const getApiUrl = (): string => {
  // Check if running in production (Vercel)
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://your-backend.onrender.com/api';
  }
  // Development
  return import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
};

export const config = {
  apiUrl: "https://webapp-expense.onrender.com" 
};