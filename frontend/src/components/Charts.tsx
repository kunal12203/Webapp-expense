import React from "react";
import { Expense } from "../types";
import { Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js";
import { PieChart, Activity } from "lucide-react";

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

interface ChartsProps {
  expenses: Expense[];
}

export const Charts: React.FC<ChartsProps> = ({ expenses }) => {
  // 1. Prepare Category Data
  const categoryData = expenses
    .filter((e) => e.type === "expense")
    .reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const doughnutData = {
    labels: sortedCategories.map(([k]) => k),
    datasets: [{
      data: sortedCategories.map(([, v]) => v),
      backgroundColor: ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#8b5cf6"],
      borderWidth: 0,
      hoverOffset: 15,
    }],
  };

  // 2. Prepare Trend Data
  const monthlyData = expenses.reduce((acc, exp) => {
    const date = new Date(exp.date);
    const key = `${date.getMonth() + 1}/${date.getDate()}`;
    if (!acc[key]) acc[key] = 0;
    if (exp.type === "expense") acc[key] += exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedDates = Object.keys(monthlyData).sort().slice(-7);

  const lineData = {
    labels: sortedDates,
    datasets: [{
      fill: true,
      data: sortedDates.map(d => monthlyData[d]),
      borderColor: "#6366f1",
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, "rgba(99, 102, 241, 0.3)");
        gradient.addColorStop(1, "rgba(99, 102, 241, 0)");
        return gradient;
      },
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: "#fff",
      pointBorderColor: "#6366f1",
      pointBorderWidth: 2,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { display: false, beginAtZero: true } }
  };

  if (expenses.length === 0) {
    return (
      <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="glass-panel p-6 flex flex-col items-center justify-center text-center opacity-70">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
               <Activity className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm text-slate-500 font-medium">Add data to see charts</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
      {/* Donut Chart */}
      <div className="glass-panel p-6 flex flex-col relative group">
        <div className="flex justify-between items-center mb-2">
           <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
             <PieChart size={16} /> Spending Mix
           </h3>
        </div>
        
        <div className="flex-1 flex items-center justify-center relative">
          <div className="w-48 h-48 relative z-10 transition-transform duration-500 group-hover:scale-105">
            <Doughnut data={doughnutData} options={{...options, cutout: '80%'}} />
          </div>
          {/* Center Stats */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{Object.keys(categoryData).length}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Categories</span>
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="glass-panel p-6 flex flex-col group">
        <div className="flex justify-between items-center mb-4">
           <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
             <Activity size={16} /> 7-Day Trend
           </h3>
           <span className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
             Live
           </span>
        </div>
        <div className="flex-1 w-full min-h-[150px] transition-transform duration-500 group-hover:scale-[1.02]">
          <Line data={lineData} options={options} />
        </div>
      </div>
    </div>
  );
};