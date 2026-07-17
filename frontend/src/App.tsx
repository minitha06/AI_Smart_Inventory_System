import { useState, useEffect } from "react";
import { 
  LayoutDashboard, Package, ShoppingBag, BrainCircuit, 
  BarChart3, Settings as SettingsIcon, LogOut, Menu, X, 
  ShieldCheck, Sun, Moon, ShieldAlert
} from "lucide-react";
import { LoginView } from "./views/LoginView";
import { DashboardView } from "./views/DashboardView";
import { InventoryView } from "./views/InventoryView";
import { SalesView } from "./views/SalesView";
import { ForecastView } from "./views/ForecastView";
import { AnalyticsView } from "./views/AnalyticsView";
import { SettingsView } from "./views/SettingsView";

export default function App() {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("aegis_dark_mode") === "true";
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [lowStockAlertCount, setLowStockAlertCount] = useState(0);

  // Sync dark mode class on document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("aegis_dark_mode", darkMode.toString());
  }, [darkMode]);

  // Session check
  const checkSession = async () => {
    try {
      const res = await fetch("/api/v2/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.logged_in) {
          setUser(data.username);
        } else {
          setUser(null);
        }
      }
    } catch (err) {
      console.error("Session check failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Check low stock count to display alerts indicator in header
  const checkLowStockCount = async () => {
    try {
      const res = await fetch("/api/v2/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setLowStockAlertCount(data.stats.low_stock_count || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (user) {
      checkLowStockCount();
    }
  }, [user, currentPath]);

  // History router listener
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, "", to);
    setCurrentPath(to);
  };

  const handleLoginSuccess = (username: string) => {
    setUser(username);
    navigate("/dashboard");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/v2/auth/logout", { method: "POST" });
      setUser(null);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // Redirect logic based on auth status
  useEffect(() => {
    if (!loading) {
      if (!user && currentPath !== "/login") {
        navigate("/login");
      } else if (user && (currentPath === "/login" || currentPath === "/")) {
        navigate("/dashboard");
      }
    }
  }, [user, currentPath, loading]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="flex flex-col items-center gap-3">
          <span className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">Initializing Aegis Flow</span>
        </div>
      </div>
    );
  }

  // Not logged in routing
  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Define sidebar navigation links
  const navItems = [
    { name: "Overview", path: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: "Inventory", path: "/inventory", icon: <Package className="w-4 h-4" /> },
    { name: "Sales Log", path: "/sales", icon: <ShoppingBag className="w-4 h-4" /> },
    { name: "AI Forecast", path: "/forecast", icon: <BrainCircuit className="w-4 h-4" /> },
    { name: "Analytics", path: "/analytics", icon: <BarChart3 className="w-4 h-4" /> },
    { name: "Settings", path: "/settings", icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  // Render current view
  const renderContent = () => {
    switch (currentPath) {
      case "/dashboard":
      case "/":
        return <DashboardView />;
      case "/inventory":
        return <InventoryView />;
      case "/sales":
        return <SalesView />;
      case "/forecast":
        return <ForecastView />;
      case "/analytics":
        return <AnalyticsView />;
      case "/settings":
        return <SettingsView darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />;
      default:
        return <DashboardView />;
    }
  };

  // Get active menu item name
  const currentItem = navItems.find(item => item.path === currentPath) || { name: "Overview" };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar Panel */}
      <aside className={`glass-panel border-r border-slate-200/50 dark:border-slate-800/50 fixed md:sticky top-0 left-0 h-screen transition-all duration-300 z-40 bg-white/90 dark:bg-slate-900/90 flex flex-col justify-between ${
        sidebarOpen ? 'w-64' : 'w-0 md:w-20 overflow-hidden'
      }`}>
        <div>
          {/* Logo Brand Header */}
          <div className="h-16 px-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white rounded-xl shadow-md shadow-indigo-500/10">
                <ShieldCheck className="w-5 h-5" />
              </div>
              {sidebarOpen && (
                <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight leading-none">Aegis Flow</span>
              )}
            </div>
            {/* Mobile close toggle */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item, index) => {
              const isActive = currentPath === item.path || (item.path === "/dashboard" && currentPath === "/");
              return (
                <button
                  key={index}
                  onClick={() => {
                    navigate(item.path);
                    if (window.innerWidth < 768) setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {item.icon}
                  {sidebarOpen && <span>{item.name}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User detail */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between gap-3">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center text-xs shadow">
                  {user.substring(0, 2).toUpperCase()}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{user}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Logged In</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all ml-auto"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-h-screen relative">
        {/* Header Bar */}
        <header className="h-16 px-6 border-b border-slate-200/40 dark:border-slate-800/40 bg-white/70 dark:bg-slate-950/40 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span>Aegis Workspace</span>
              <span>/</span>
              <span className="text-slate-700 dark:text-slate-200">{currentItem.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Low stock notifications bell */}
            {lowStockAlertCount > 0 && (
              <div 
                onClick={() => navigate("/inventory")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 rounded-xl cursor-pointer hover:bg-amber-100 transition-all"
                title="Low stock alerts detected"
              >
                <ShieldAlert className="w-3.5 h-3.5 animate-bounce" />
                <span className="text-[10px] font-bold">{lowStockAlertCount} Alarm(s)</span>
              </div>
            )}

            {/* Dark mode switcher */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="p-6 md:p-8 flex-grow max-w-7xl w-full mx-auto animate-fade-in">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
