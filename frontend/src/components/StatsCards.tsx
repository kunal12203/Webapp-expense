import React, { useEffect, useState } from "react";
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";

// --- Internal CountUp Component ---
const CountUp = ({ end, prefix = "" }: { end: number; prefix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const increment = end / (duration / 16); 

    const timer = setInterval(() => {
      start += increment;
      if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end]);

  return (
    <span>
      {prefix}
      {new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.floor(count))}
    </span>
  );
};

interface StatsCardsProps {
  balance: number;
  income: number;
  expenses: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ balance, income, expenses }) => {
  const Card = ({ 
    title, 
    amount, 
    icon: Icon, 
    colorClass, 
    bgGradient,
    iconBg,
    delay 
  }: any) => (
    <div 
      className="glass-card p-6 relative overflow-hidden group hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 cursor-default"
    >
      {/* Decorative Glow Background */}
      <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-0 group-hover:opacity-20 bg-gradient-to-br ${bgGradient} blur-2xl transition-opacity duration-500`} />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3.5 rounded-2xl ${iconBg} ${colorClass} bg-opacity-10 dark:bg-opacity-20 ring-1 ring-inset ring-black/5 dark:ring-white/10`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold bg-white/50 dark:bg-black/20 border border-white/20 backdrop-blur-sm ${colorClass}`}>
          Running Total
        </div>
      </div>
      
      <div className="relative z-10">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-1 tracking-wide uppercase">{title}</p>
        <h3 className={`text-3xl md:text-4xl font-black tracking-tight text-slate-800 dark:text-white`}>
          <CountUp end={amount} prefix="₹" />
        </h3>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card 
        title="Total Balance" 
        amount={balance} 
        icon={Wallet} 
        colorClass="text-indigo-600 dark:text-indigo-400"
        iconBg="bg-indigo-500"
        bgGradient="from-indigo-500 to-blue-500"
      />
      <Card 
        title="Income" 
        amount={income} 
        icon={TrendingUp} 
        colorClass="text-emerald-600 dark:text-emerald-400"
        iconBg="bg-emerald-500"
        bgGradient="from-emerald-500 to-teal-500"
      />
      <Card 
        title="Expenses" 
        amount={expenses} 
        icon={TrendingDown} 
        colorClass="text-rose-600 dark:text-rose-400"
        iconBg="bg-rose-500"
        bgGradient="from-rose-500 to-pink-500"
      />
    </div>
  );
};