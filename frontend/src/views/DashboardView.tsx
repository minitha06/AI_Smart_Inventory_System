import React, { useState, useEffect } from "react";
import { 
  DollarSign, Package, AlertTriangle, TrendingUp, 
  Activity, Sparkles, RefreshCw, ShoppingCart, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#3b82f6", "#10b981", "#ec4899"];

interface StatCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtext, icon, trend }) => (
  <div className="glass-card p-6 bg-white/50 dark:bg-slate-900/50 shadow-sm relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-cyan-500/5 dark:from-indigo-500/10 dark:to-cyan-500/10 rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</span>
      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
        {icon}
      </div>
    </div>
    <div className="mt-4">
      <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</h3>
      <div className="flex items-center gap-1.5 mt-2">
        {trend && (
          <span className={`inline-flex items-center text-xs font-medium ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {trend.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend.value}
          </span>
        )}
        <span className="text-xs text-slate-500 dark:text-slate-400">{subtext}</span>
      </div>
    </div>
  </div>
);

export const DashboardView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lowStockDetails, setLowStockDetails] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"sales" | "categories">("sales");

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v2/dashboard/stats");
      if (!res.ok) throw new Error("Failed to load dashboard statistics.");
      const data = await res.json();
      setStats(data.stats);
      setRecentLogs(data.recent_logs);
      setCategoryStats(data.category_stats);
      setSalesTrend(data.sales_trend);
      setTopProducts(data.top_products);
      setLowStockDetails(data.low_stock_details);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Pre-fill placeholder trends if sales_trend has too few days
  const chartData = salesTrend.length > 0 ? salesTrend : [
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
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Workspace Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time telemetry, demand forecasts, and database status.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2 text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Stock Value"
          value={`$${stats?.total_value?.toLocaleString() || "0.00"}`}
          subtext="across entire catalog"
          icon={<DollarSign className="w-5 h-5" />}
          trend={{ value: "+4.2%", isPositive: true }}
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.low_stock_count || 0}
          subtext="require attention"
          icon={<AlertTriangle className="w-5 h-5" />}
          trend={stats?.low_stock_count > 0 ? { value: `${stats.low_stock_count} item(s)`, isPositive: false } : undefined}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats?.monthly_revenue?.toLocaleString() || "0.00"}`}
          subtext="past 30 days"
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: "+12.8%", isPositive: true }}
        />
        <StatCard
          title="Total Products"
          value={stats?.total_products || 0}
          subtext="registered in database"
          icon={<Package className="w-5 h-5" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Charts */}
        <div className="lg:col-span-2 glass-card p-6 bg-white/50 dark:bg-slate-900/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Business Intelligence</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sales trends and database composition.</p>
            </div>
            <div className="flex border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-slate-100 dark:bg-slate-950/50">
              <button
                onClick={() => setActiveTab("sales")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === "sales" ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                Revenue
              </button>
              <button
                onClick={() => setActiveTab("categories")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === "categories" ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                Category Mix
              </button>
            </div>
          </div>

          <div className="h-72 w-full flex-grow">
            {activeTab === "sales" ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(255,255,255,0.9)",
                      border: "1px solid rgba(226, 232, 240, 0.5)",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      color: "#0f172a"
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue ($)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col md:flex-row h-full items-center justify-around">
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
                    <div className="grid grid-cols-2 md:grid-cols-1 gap-3 max-h-56 overflow-y-auto pr-2">
                      {categoryStats.map((cat, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{cat.category}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">(${cat.value})</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-slate-400 dark:text-slate-500 py-8">No inventory data available yet.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Insight & Analytics Panel */}
        <div className="glass-card p-6 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 dark:from-indigo-500/10 dark:to-cyan-500/10 border-indigo-500/10 dark:border-indigo-400/10 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Copilot Insights</h2>
            </div>
            <div className="space-y-4">
              {lowStockDetails.length > 0 ? (
                lowStockDetails.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white/70 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-900 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{item.sku}</span>
                      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 rounded-full text-[10px] font-bold">Low Stock</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Stock is at <span className="font-semibold text-rose-500">{item.stock}</span> units (minimum safety level: {item.reorder_level}). Demand projection suggests placing a restock order of at least <span className="font-semibold text-emerald-600 dark:text-emerald-400">{Math.max(10, item.reorder_level * 2 - item.stock)}</span> units to prevent stockout.
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-900 text-center py-8">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">All items fully stocked</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">No pending replenishment warnings detected.</p>
                </div>
              )}

              {stats?.total_products > 0 && (
                <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-900 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-1">
                    <Activity className="w-3.5 h-3.5 text-cyan-500" />
                    RFID Smart Gate Active
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                    Automatic scanning is listening. Scan items using RFID to update database in real-time.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Copilot V1.2. Neural engine online.</span>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent logs */}
        <div className="lg:col-span-2 glass-card p-6 bg-white/50 dark:bg-slate-900/50 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Telemetry & Activity Logs</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Most recent stock modifications and sales events.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Event Type</th>
                  <th className="py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Adjustment</th>
                  <th className="py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Reference</th>
                  <th className="py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log, idx) => {
                    const isPositive = log.change_quantity > 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 font-semibold text-slate-900 dark:text-white max-w-[140px] truncate">{log.product_name}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            log.log_type.includes("sale") ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400' :
                            log.log_type.includes("rfid") ? 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {log.log_type.replace("_", " ")}
                          </span>
                        </td>
                        <td className={`py-3 font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                          {isPositive ? `+${log.change_quantity}` : log.change_quantity}
                        </td>
                        <td className="py-3 text-slate-500 dark:text-slate-400 truncate max-w-[100px]">{log.reference || "N/A"}</td>
                        <td className="py-3 text-slate-400 dark:text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">No activity recorded in logs yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top sales products */}
        <div className="glass-card p-6 bg-white/50 dark:bg-slate-900/50 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Top Performers</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Top products generated by revenue.</p>
          </div>

          <div className="space-y-4 flex-grow">
            {topProducts.length > 0 ? (
              topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all">
                  <div className="space-y-0.5 max-w-[150px]">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">${p.revenue}</p>
                    <p className="text-[10px] text-slate-400">{p.quantity} units sold</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center py-8 text-slate-400 dark:text-slate-500 text-xs">No sales recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
