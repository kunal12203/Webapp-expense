import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, User, LogOut, Wallet, 
  PieChart, CreditCard, Settings, Menu, X 
} from 'lucide-react';
import { useState } from 'react';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    if(window.confirm('Are you sure you want to sign out?')) {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const NavItem = ({ to, icon: Icon, label }: any) => {
    const isActive = location.pathname === to;
    return (
      <NavLink
        to={to}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
          isActive
            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30'
            : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'
        }`}
      >
        <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
        <span className="font-semibold tracking-wide">{label}</span>
        
        {/* Active Indicator Glow */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-shimmer" />
        )}
      </NavLink>
    );
  };

  return (
    <div className="flex min-h-screen relative overflow-hidden bg-slate-50 dark:bg-[#0b1120]">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-800 dark:text-white">ExpenseTracker</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 dark:text-slate-300">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-slate-50/50 dark:bg-[#0b1120]/50 backdrop-blur-xl border-r border-white/20 dark:border-slate-800
        transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full p-6">
          {/* Logo Area */}
          <div className="hidden md:flex items-center gap-3 mb-10 px-2">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-slate-800 dark:text-white leading-none">Expense</h1>
              <span className="text-xs font-semibold text-indigo-500 tracking-widest uppercase">Tracker</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 space-y-2 py-4 md:py-0">
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/analytics" icon={PieChart} label="Analytics" />
            <NavItem to="/profile" icon={User} label="Profile" />
          </nav>

          {/* User Card / Logout */}
          <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-5 py-4 rounded-2xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/10 transition-all group"
            >
              <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <span className="font-semibold">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full md:max-w-[calc(100vw-18rem)] min-h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8 pt-20 md:pt-8 animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </div>
  );
};

export default Layout;