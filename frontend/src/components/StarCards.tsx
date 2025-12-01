import React, { useEffect, useState } from "react";
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";

// --- Internal CountUp Component for Animation ---
const CountUp = ({ end, prefix = "" }: { end: number; prefix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500; // 1.5 seconds
    const increment = end / (duration / 16); // 60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
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
    bgClass,
    delay 
  }: { 
    title: string; 
    amount: number; 
    icon: any; 
    colorClass: string;
    bgClass: string;
    delay: string;
  }) => (
    <div 
      className="glass-panel p-6 relative group hover:scale-[1.02] transition-transform duration-500"
      style={{ animation: `slideUp 0.6s ease-out forwards ${delay}` }}
    >
      {/* Decorative Glow Background */}
      <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-0 group-hover:opacity-10 ${bgClass} blur-3xl transition-opacity duration-500`} />
      
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3.5 rounded-2xl ${bgClass} ${colorClass} bg-opacity-10 ring-1 ring-inset ring-black/5 dark:ring-white/10`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
          Last 30 days
        </div>
      </div>
      
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-2 tracking-wide uppercase">{title}</p>
        <h3 className={`text-3xl font-black tracking-tight ${colorClass}`}>
          <CountUp end={amount} prefix={title === "Total Balance" ? "₹" : "₹"} />
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
        bgClass="bg-indigo-500"
        delay="0s"
      />
      <Card 
        title="Total Income" 
        amount={income} 
        icon={TrendingUp} 
        colorClass="text-emerald-600 dark:text-emerald-400"
        bgClass="bg-emerald-500"
        delay="0.1s"
      />
      <Card 
        title="Total Spending" 
        amount={expenses} 
        icon={TrendingDown} 
        colorClass="text-rose-600 dark:text-rose-400"
        bgClass="bg-rose-500"
        delay="0.2s"
      />
    </div>
  );
};