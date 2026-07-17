import React, { useState, useEffect } from "react";
import { 
  Sparkles, RefreshCw, Calendar, ShoppingBag, 
  HelpCircle, Compass, CheckCircle2, AlertTriangle, Cpu, AlertCircle
} from "lucide-react";
import { 
  ResponsiveContainer, XAxis, YAxis, 
  CartesianGrid, Tooltip, AreaChart, Area 
} from "recharts";

interface Product {
  id: number;
  sku: string;
  name: string;
  stock: number;
}

interface ForecastHistory {
  forecast_date: string;
  forecast_quantity: number;
  confidence: number;
  created_at: string;
}

export const ForecastView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/v2/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleGenerateForecast = async (productId: string) => {
    if (!productId) return;
    setLoading(true);
    setForecastData(null);
    try {
      const res = await fetch(`/api/v2/forecast?product_id=${productId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate prediction model.");
      setForecastData(data);
      showToast("AI Forecast model generated successfully.");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Trigger forecast on dropdown change
  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedProductId(val);
    handleGenerateForecast(val);
  };

  // Compute confidence level indicators
  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.85) return { text: "High", color: "text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40", icon: <CheckCircle2 className="w-3.5 h-3.5" /> };
    if (confidence >= 0.5) return { text: "Moderate", color: "text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/40", icon: <Compass className="w-3.5 h-3.5" /> };
    return { text: "Low / Initializing", color: "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40", icon: <AlertTriangle className="w-3.5 h-3.5" /> };
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-xl shadow-lg border transition-all duration-300 animate-slide-up flex items-center gap-3 ${
          toast.type === "success" 
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400' 
            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-400'
        }`}>
          <AlertCircle className="w-5 h-5" />
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">AI Demand Forecasting</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Linear regression intelligence pipeline modeling weekly stocking profiles.</p>
      </div>

      {/* Product Select Card */}
      <div className="glass-card p-6 bg-white/50 dark:bg-slate-900/50 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-grow w-full">
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Select Target Product *</label>
          <select
            value={selectedProductId}
            onChange={handleProductChange}
            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
          >
            <option value="">-- Choose a product to generate forecast --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (SKU: {p.sku}) — Stock: {p.stock}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => handleGenerateForecast(selectedProductId)}
          disabled={loading || !selectedProductId}
          className="w-full sm:w-auto mt-6 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-sm text-xs font-semibold transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Compute Forecast Model
        </button>
      </div>

      {loading && (
        <div className="py-24 text-center">
          <span className="inline-block w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
          <p className="text-xs text-slate-400 mt-3 font-semibold">Running Sci-Kit Linear Regression Model...</p>
        </div>
      )}

      {/* Forecast Output panels */}
      {forecastData && !loading && (
        <div className="space-y-6 animate-fade-in">
          {/* Prediction Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 bg-blue-50/20 dark:bg-blue-950/10 border-blue-200/30 dark:border-blue-900/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Current Inventory</span>
                <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">{forecastData.product.stock} units</h3>
                <p className="text-[11px] text-slate-400 mt-1">Available inside SQLite database.</p>
              </div>
              <div className="p-3 bg-blue-500 text-white rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card p-6 bg-amber-50/20 dark:bg-amber-950/10 border-amber-200/30 dark:border-amber-900/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Tomorrow's Prediction</span>
                <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">~{forecastData.tomorrow_prediction} units</h3>
                <p className="text-[11px] text-slate-400 mt-1">Expected daily consumption velocity.</p>
              </div>
              <div className="p-3 bg-amber-500 text-white rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card p-6 bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200/30 dark:border-emerald-900/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Suggested Order Level</span>
                <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">+{forecastData.recommended_order} units</h3>
                <p className="text-[11px] text-slate-400 mt-1">Calculated safety stock recommendation.</p>
              </div>
              <div className="p-3 bg-emerald-500 text-white rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Chart & details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Forecast Chart */}
            <div className="lg:col-span-2 glass-card p-6 bg-white/50 dark:bg-slate-900/50 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">7-Day Demand Forecast Trend</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Projected stock requirements based on sales regression indices.</p>
                </div>
                <div className="flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Linear Regression (SKLearn)</span>
                </div>
              </div>

              <div className="h-64 w-full flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData.forecast_rows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis dataKey="forecast_date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "rgba(255,255,255,0.9)",
                        border: "1px solid rgba(226, 232, 240, 0.5)",
                        borderRadius: "12px",
                        color: "#0f172a"
                      }}
                    />
                    <Area type="monotone" dataKey="forecast_quantity" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorForecast)" name="Predicted Demand" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Model stats & confidence */}
            <div className="glass-card p-6 bg-white/50 dark:bg-slate-900/50 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Telemetry Audit</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Reliability criteria for regression calculations.</p>
              </div>

              <div className="space-y-4 my-6">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">R-Squared Confidence</span>
                    <span className="font-bold text-slate-900 dark:text-white">{(forecastData.forecast_rows[0]?.confidence * 100).toFixed(1)}%</span>
                  </div>
                  {/* Confidence Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        forecastData.forecast_rows[0]?.confidence >= 0.85 ? 'bg-emerald-500' :
                        forecastData.forecast_rows[0]?.confidence >= 0.5 ? 'bg-indigo-500' :
                        'bg-amber-500'
                      }`}
                      style={{ width: `${forecastData.forecast_rows[0]?.confidence * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Model Assessment</span>
                    {(() => {
                      const assessment = getConfidenceLevel(forecastData.forecast_rows[0]?.confidence || 0);
                      return (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${assessment.color}`}>
                          {assessment.icon} {assessment.text}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {forecastData.forecast_rows[0]?.confidence >= 0.85 
                      ? "High transactional volume allows the regression line to accurately chart future stocking parameters." 
                      : forecastData.forecast_rows[0]?.confidence >= 0.5 
                        ? "Moderate sales activity. Recommended safety margins should be maintained to safeguard against sudden spikes."
                        : "Sales records are minimal. Generating predictions with low historical index; restock quantities may default to recent average volumes."
                    }
                  </p>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" /> Powered by Aegis Engine
              </div>
            </div>
          </div>

          {/* Forecast Execution Logs */}
          <div className="glass-card p-6 bg-white/50 dark:bg-slate-900/50 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Forecast History Log</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Historical predictions recorded in SQLite for audits.</p>
            </div>
            <div className="mt-4 max-h-60 overflow-y-auto pr-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Run Timestamp</th>
                    <th className="py-2.5 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Forecasted Date</th>
                    <th className="py-2.5 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Predicted Quantity</th>
                    <th className="py-2.5 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Confidence Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {forecastData.forecast_history.length > 0 ? (
                    forecastData.forecast_history.map((log: ForecastHistory, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-2.5 text-slate-500 dark:text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="py-2.5 font-semibold text-slate-900 dark:text-white">{log.forecast_date}</td>
                        <td className="py-2.5 font-bold text-indigo-600 dark:text-indigo-400">{log.forecast_quantity} units</td>
                        <td className="py-2.5 font-mono font-semibold text-[10px] text-slate-400">{(log.confidence * 100).toFixed(0)}% R2</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-slate-500">No predictions previously stored.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!forecastData && !loading && (
        <div className="glass-card p-12 text-center bg-white/50 dark:bg-slate-900/50 border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
          <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">No Product Selected</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Choose an inventory item from the dropdown panel above and request computational predictions.
          </p>
        </div>
      )}
    </div>
  );
};
