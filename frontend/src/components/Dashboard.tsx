import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Settings, User, LogOut, Menu, X, 
  TrendingUp, TrendingDown, Wallet, Filter 
} from 'lucide-react';
import ExpenseForm from './ExpenseForm';
import CategoryManager from './CategoryManager';

interface DashboardProps {
  onLogout: () => void;
  onOpenCategoryManager: () => void;
}

interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'expense' | 'income';
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onOpenCategoryManager }) => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');

  useEffect(() => {
    loadExpenses();

    // Listen for expense updates
    const handleExpensesUpdated = () => {
      loadExpenses();
    };

    window.addEventListener('expensesUpdated', handleExpensesUpdated);

    return () => {
      window.removeEventListener('expensesUpdated', handleExpensesUpdated);
    };
  }, []);

  const loadExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://your-backend.onrender.com/api/expenses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load expenses');
      
      const data = await response.json();
      setExpenses(data);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setShowExpenseForm(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://your-backend.onrender.com/api/expenses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete expense');
      
      loadExpenses();
    } catch (err) {
      console.error('Failed to delete expense:', err);
      alert('Failed to delete transaction');
    }
  };

  // Calculate totals
  const filteredExpenses = expenses.filter(exp => {
    if (filterType === 'all') return true;
    return exp.type === filterType;
  });

  const totalIncome = expenses
    .filter(exp => exp.type === 'income')
    .reduce((sum, exp) => sum + exp.amount, 0);

  const totalExpenses = expenses
    .filter(exp => exp.type === 'expense')
    .reduce((sum, exp) => sum + exp.amount, 0);

  const balance = totalIncome - totalExpenses;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Wallet className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ExpenseTracker
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={onOpenCategoryManager}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-all"
                title="Manage Categories"
              >
                <Settings className="w-4 h-4" />
                <span>Categories</span>
              </button>

              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-all"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </button>

              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    onOpenCategoryManager();
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-all"
                >
                  <Settings className="w-4 h-4" />
                  <span>Manage Categories</span>
                </button>

                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-all"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>

                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Balance */}
          <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-90">Total Balance</span>
              <Wallet className="w-5 h-5 opacity-90" />
            </div>
            <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
          </div>

          {/* Total Income */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Income</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalIncome)}
            </p>
          </div>

          {/* Total Expenses */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Expenses</span>
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Transactions
            </h2>
            
            <div className="flex items-center gap-3">
              {/* Filter */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    filterType === 'all'
                      ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('expense')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    filterType === 'expense'
                      ? 'bg-white dark:bg-slate-600 text-red-600 dark:text-red-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Expenses
                </button>
                <button
                  onClick={() => setFilterType('income')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    filterType === 'income'
                      ? 'bg-white dark:bg-slate-600 text-green-600 dark:text-green-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Income
                </button>
              </div>

              {/* Add Button */}
              <button
                onClick={handleAddExpense}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/30"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Transaction</span>
              </button>
            </div>
          </div>

          {/* Transactions */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">
                {filterType === 'all' 
                  ? 'No transactions yet. Add your first transaction!' 
                  : `No ${filterType} transactions found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:shadow-md transition-all group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        expense.type === 'income'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {expense.category}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(expense.date).toLocaleDateString()}
                      </span>
                    </div>
                    {expense.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {expense.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`text-xl font-bold ${
                      expense.type === 'income'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {expense.type === 'income' ? '+' : '-'} {formatCurrency(expense.amount)}
                    </span>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditExpense(expense)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Expense Form Modal */}
      <ExpenseForm
        isOpen={showExpenseForm}
        onClose={() => {
          setShowExpenseForm(false);
          setEditingExpense(null);
        }}
        onExpenseAdded={loadExpenses}
        editExpense={editingExpense}
      />
    </div>
  );
};

export default Dashboard;