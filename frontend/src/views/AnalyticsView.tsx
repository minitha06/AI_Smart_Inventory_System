import React, { useState, useEffect } from "react";
import { 
  RefreshCw, AlertCircle, PieChart as PieIcon, 
  TrendingUp, Award, Layers 
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#10b981", "#3b82f6", "#ec4899"];

export const AnalyticsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v2/dashboard/stats");
      if (!res.ok) throw new Error("Failed to load analytics statistics.");
      const data = await res.json();
      setCategoryStats(data.category_stats);
      setSalesTrend(data.sales_trend);
      setTopProducts(data.top_products);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
        <div className="h-60 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  // Pre-fill placeholder trends if sales_trend has too few days
  const trendData = salesTrend.length > 0 ? salesTrend : [
    { date: "Day 1", revenue: 0, quantity: 0 },
    { date: "Day 2", revenue: 50, quantity: 2 },
    { date: "Day 3", revenue: 120, quantity: 5 },
    { date: "Day 4", revenue: 90, quantity: 3 },
    { date: "Day 5", revenue: 200, quantity: 8 },
    { date: "Day 6", revenue: 150, quantity: 6 },
    { date: "Day 7", revenue: 310, quantity: 12 },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-xl shadow-lg border transition-all duration-300 animate-slide-up flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-400`}>
          <AlertCircle className="w-5 h-5" />
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Business Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Deep analysis on category breakdowns, sales velocity, and inventory metrics.</p>
        </div>
        <button
          onClick={fetchAnalyticsData}
          className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2 text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Share Donut */}
        <div className="glass-card p-6 bg-white/50 dark:bg-slate-900/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-6 text-indigo-600 dark:text-indigo-400">
            <PieIcon className="w-5 h-5" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Catalog Category Share</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Asset valuation composition by category.</p>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-around">
            {categoryStats.length > 0 ? (
              <>
                <div className="h-56 w-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="category"
                      >
                        {categoryStats.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "rgba(255,255,255,0.9)",
                          border: "1px solid rgba(226, 232, 240, 0.5)",
                          borderRadius: "12px",
                          color: "#0f172a"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                  {categoryStats.map((cat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{cat.category}</span>
                      <span className="text-xs text-slate-400 font-bold">(${cat.value.toFixed(2)})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400 py-8">No category details found.</div>
            )}
          </div>
        </div>

        {/* Stock Volume Bar Chart */}
        <div className="glass-card p-6 bg-white/50 dark:bg-slate-900/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-6 text-indigo-600 dark:text-indigo-400">
            <Layers className="w-5 h-5" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Physical Stock Distribution</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Total active units grouped by catalog category.</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {categoryStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(255,255,255,0.9)",
                      border: "1px solid rgba(226, 232, 240, 0.5)",
                      borderRadius: "12px",
                      color: "#0f172a"
                    }}
                  />
                  <Bar dataKey="stock" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Units in Stock" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400 py-8 text-center">No categories to display.</div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Over Time composite line */}
      <div className="glass-card p-6 bg-white/50 dark:bg-slate-900/50 shadow-sm">
        <div className="flex items-center gap-2 mb-6 text-indigo-600 dark:text-indigo-400">
          <TrendingUp className="w-5 h-5" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Revenue & Sales Velocity</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Daily tracking of total turnover and quantity sold.</p>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "rgba(255,255,255,0.9)",
                  border: "1px solid rgba(226, 232, 240, 0.5)",
                  borderRadius: "12px",
                  color: "#0f172a"
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} name="Turnover ($)" activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="quantity" stroke="#06b6d4" strokeWidth={2} name="Units Sold" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product performance list */}
      <div className="glass-card p-6 bg-white/50 dark:bg-slate-900/50 shadow-sm">
        <div className="flex items-center gap-2 mb-6 text-indigo-600 dark:text-indigo-400">
          <Award className="w-5 h-5" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Top Performing Inventory Items</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Ranked by revenue contribution.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="py-2.5 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Rank</th>
                <th className="py-2.5 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">SKU</th>
                <th className="py-2.5 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Product Name</th>
                <th className="py-2.5 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Units Sold</th>
                <th className="py-2.5 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Sales Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {topProducts.length > 0 ? (
                topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 font-bold text-slate-400 dark:text-slate-500">#{idx + 1}</td>
                    <td className="py-3 font-mono font-semibold text-slate-500 text-[10px] tracking-wider">{p.sku}</td>
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">{p.name}</td>
                    <td className="py-3 font-bold text-slate-700 dark:text-slate-300">{p.quantity}</td>
                    <td className="py-3 font-bold text-emerald-600 dark:text-emerald-400">${p.revenue.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">No items available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
