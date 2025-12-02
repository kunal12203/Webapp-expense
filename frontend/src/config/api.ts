// src/config/api.ts
// Central API configuration using environment variables

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Auth
  login: `${API_URL}/api/login`,
  signup: `${API_URL}/api/signup`,
  forgotPassword: `${API_URL}/api/forgot-password`,
  resetPassword: `${API_URL}/api/reset-password`,
  
  // Profile
  profile: `${API_URL}/api/profile`,
  completeOnboarding: `${API_URL}/api/profile/complete-onboarding`,
  
  // Categories
  categories: `${API_URL}/api/categories`,
  exampleCategories: `${API_URL}/api/categories/examples`,
  categoriesBatch: `${API_URL}/api/categories/batch`,
  categoryMigrate: `${API_URL}/api/categories/migrate`,
  categoryStats: `${API_URL}/api/categories/stats`,
  
  // Expenses
  expenses: `${API_URL}/api/expenses`,
  
  // Export/Import
  exportCSV: `${API_URL}/api/expenses/export/csv`,
  exportExcel: `${API_URL}/api/expenses/export/excel`,
  importFile: `${API_URL}/api/expenses/import`,
};

// Helper function to get category URL with ID
export const getCategoryUrl = (id: number) => `${API_URL}/api/categories/${id}`;

// Helper function to get expense URL with ID
export const getExpenseUrl = (id: number) => `${API_URL}/api/expenses/${id}`;

export default API_URL;