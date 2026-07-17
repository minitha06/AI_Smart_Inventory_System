import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, Search, Calendar, User, DollarSign, 
  ChevronRight, AlertCircle, RefreshCw
} from "lucide-react";

interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
}

interface Sale {
  id: number;
  product_id: number;
  sku: string;
  product_name: string;
  quantity: number;
  sale_price: number;
  customer_name: string;
  sale_date: string;
}

export const SalesView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [salePrice, setSalePrice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      // Fetch products for dropdown
      const prodRes = await fetch("/api/v2/products");
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }

      // Fetch sales transactions
      const salesRes = await fetch(`/api/v2/sales?search=${encodeURIComponent(search)}`);
      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setSales(salesData);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load sales data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSalesData();
    }, 300); // debounce search
    return () => clearTimeout(timer);
  }, [search]);

  // Update sale price automatically when product is selected
  useEffect(() => {
    if (selectedProductId) {
      const prod = products.find(p => p.id === parseInt(selectedProductId));
      if (prod) {
        // Default sale price is: quantity * unit_price
        const qty = parseInt(quantity) || 1;
        setSalePrice((prod.price * qty).toFixed(2));
      }
    } else {
      setSalePrice("");
    }
  }, [selectedProductId, quantity, products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      showToast("Please select a product.", "error");
      return;
    }

    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      showToast("Quantity must be greater than zero.", "error");
      return;
    }

    const prod = products.find(p => p.id === parseInt(selectedProductId));
    if (prod && prod.stock < qty) {
      showToast(`Insufficient stock. Only ${prod.stock} units available.`, "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v2/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: parseInt(selectedProductId),
          quantity: qty,
          sale_price: parseFloat(salePrice) || 0.0,
          customer_name: customerName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record transaction.");

      showToast("Sale recorded successfully.");
      // Reset form
      setSelectedProductId("");
      setQuantity("1");
      setCustomerName("");
      fetchSalesData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Sales & Orders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Record sales receipts and monitor daily revenue pipelines.</p>
        </div>
        <button
          onClick={fetchSalesData}
          className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2 text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Record Transaction Form */}
        <div className="glass-card p-6 bg-white/50 dark:bg-slate-900/50 shadow-sm flex flex-col justify-between h-fit">
          <div>
            <div className="flex items-center gap-2 mb-6 text-indigo-600 dark:text-indigo-400">
              <ShoppingBag className="w-5 h-5" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Record Transaction</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Select Product *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                >
                  <option value="">-- Choose a product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                      {p.name} (SKU: {p.sku}) — {p.stock > 0 ? `${p.stock} in stock` : 'OUT OF STOCK'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Total Price ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Customer / Organization Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl font-semibold text-xs transition-all shadow-md hover:shadow-indigo-500/10 hover:shadow-lg flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    Record Receipt <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Transaction History Logs */}
        <div className="lg:col-span-2 glass-card p-6 bg-white/50 dark:bg-slate-900/50 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Transaction Logs</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Physical ledger of sales records and invoice details.</p>
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs..."
                className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-grow max-h-[450px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                <span className="text-[10px] text-slate-400 font-semibold animate-pulse">Loading ledger...</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <th className="py-3 px-4 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="py-3 px-4 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">SKU</th>
                    <th className="py-3 px-4 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Product</th>
                    <th className="py-3 px-4 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Quantity</th>
                    <th className="py-3 px-4 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Transaction value</th>
                    <th className="py-3 px-4 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Customer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {sales.length > 0 ? (
                    sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(sale.sale_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 tracking-wide font-mono text-[10px]">{sale.sku}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">{sale.product_name}</td>
                        <td className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">{sale.quantity}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">${sale.sale_price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 truncate max-w-[120px]">{sale.customer_name || "Guest Checkout"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">No transaction logs match search parameters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
