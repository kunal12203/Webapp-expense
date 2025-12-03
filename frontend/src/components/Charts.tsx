import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../config/api";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { PieChart, Info } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

const Charts = ({ refreshSignal }: { refreshSignal?: number }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const loadStats = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_ENDPOINTS.categoryStats, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      
      if (!res.ok) throw new Error("Failed to load stats");
      
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setStats(data);
        const sum = data.reduce((acc: number, curr: any) => acc + curr.total_amount, 0);
        setTotal(sum);
      } else {
        setStats([]);
        setTotal(0);
      }
    } catch (e) {
      console.error(e);
      setStats([]);
      setTotal(0);
    }
  };

  useEffect(() => {
    loadStats();
  }, [refreshSignal]);
  
  const data = {
    labels: stats.map((s: any) => s.category),
    datasets: [
      {
        data: stats.map((s: any) => s.total_amount),
        backgroundColor: stats.map((s: any) => s.color),
        borderColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
        borderWidth: 4,
        hoverOffset: 20,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom' as const, 
        labels: { 
          padding: 30, 
          usePointStyle: true,
          font: { family: "'Inter', sans-serif", size: 12 },
          color: '#94a3b8' 
        } 
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        titleFont: { family: "'Inter', sans-serif", size: 13 },
        bodyFont: { family: "'Inter', sans-serif", size: 13 },
        cornerRadius: 12,
        displayColors: true,
      }
    },
    cutout: '70%',
    layout: { padding: 10 }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">Spending Breakdown</h2>
            <p className="text-xs text-slate-500">Distribution by category</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative min-h-[300px]">
        {stats.length > 0 ? (
          <>
            <Pie data={data} options={options} />
            {/* Center Text */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-8">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total</span>
              <div className="text-2xl font-black text-slate-800 dark:text-white">
                ₹{new Intl.NumberFormat("en-IN", { notation: "compact" }).format(total)}
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <Info className="w-12 h-12 mb-2 opacity-20" />
            <p className="text-sm">No expenses recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Charts;