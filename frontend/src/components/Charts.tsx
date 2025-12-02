// src/components/Charts.tsx

import React, { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../config/api";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const Charts = () => {
  const [stats, setStats] = useState([]);

  const loadStats = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(API_ENDPOINTS.categoryStats, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setStats(await res.json());
  };

  useEffect(() => {
    loadStats();
  }, []);
  
  const data = {
    labels: stats.map((s: any) => s.category),
    datasets: [
      {
        data: stats.map((s: any) => s.total_amount),
        backgroundColor: stats.map((s: any) => s.color),
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="text-sm font-semibold mb-3">Spending Breakdown</h2>
      <Pie data={data} />
    </div>
  );
};

export default Charts;
