"use client";
import { useEffect, useState } from "react";

type LogEntry = {
  id: string | number;
  trash_type: string;
  timestamp: string;
  status: string;
};

type TrashStat = {
  trash_type: string;
  count: number;
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<TrashStat[]>([]);
  const [toast, setToast] = useState("");

  // --- AUTHENTICATION LOGIC ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("Cannot connect to backend server.");
    }
  };

  // --- DATA FETCHING LOGIC ---
  const fetchData = async () => {
    if (!isLoggedIn) return;

    try {
      const [logsRes, statsRes] = await Promise.all([
        fetch("http://localhost:5000/api/logs"),
        fetch("http://localhost:5000/api/stats")
      ]);

      const nextLogs = await logsRes.json();
      const nextStats = await statsRes.json();

      setLogs(nextLogs);
      setStats(nextStats);
    } catch (err) {
      console.log("Backend offline");
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    const runFetch = () => {
      void fetchData();
    };

    runFetch();
    const interval = setInterval(runFetch, 2000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // --- ACTIONS ---
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleSimulate = async () => {
    await fetch("http://localhost:5000/api/simulate", { method: "POST" });
    showToast("🪄 Simulated Trash Drop!");
  };

  const handleDispense = async () => {
    const res = await fetch("http://localhost:5000/api/dispense", { method: "POST" });
    const data = await res.json();
    showToast(`🍚 Dispensed via ${data.mode}!`);
  };

  // --- RENDER: LOGIN SCREEN ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white font-sans">
        <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-xl shadow-2xl w-96 border border-gray-700">
          <h1 className="text-3xl font-bold text-green-400 mb-2 text-center">Smart Bin</h1>
          <p className="text-gray-400 text-center mb-6 text-sm">Admin Dashboard Login</p>
          
          {error && <div className="bg-red-500/20 text-red-400 p-2 rounded mb-4 text-sm text-center border border-red-500/50">{error}</div>}
          
          <input 
            type="text" placeholder="Username (admin)" 
            className="w-full bg-gray-700 p-3 rounded mb-4 outline-none focus:ring-2 focus:ring-green-500"
            onChange={(e) => setUsername(e.target.value)} required 
          />
          <input 
            type="password" placeholder="Password (admin123)" 
            className="w-full bg-gray-700 p-3 rounded mb-6 outline-none focus:ring-2 focus:ring-green-500"
            onChange={(e) => setPassword(e.target.value)} required 
          />
          <button type="submit" className="w-full bg-green-600 hover:bg-green-500 transition py-3 rounded font-bold text-white">
            Log In
          </button>
        </form>
      </div>
    );
  }

  // --- RENDER: DASHBOARD ---
  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 p-8 relative">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-5 right-5 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-xl animate-fade-in-down z-50">
          {toast}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">System Dashboard</h1>
            <p className="text-gray-500 mt-1">Live monitoring & marketable analytics</p>
          </div>
          <button onClick={() => setIsLoggedIn(false)} className="text-sm font-semibold text-gray-500 hover:text-red-500 transition">
            Logout
          </button>
        </header>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button onClick={handleSimulate} className="bg-yellow-400 hover:bg-yellow-300 text-yellow-900 px-6 py-3 rounded-lg font-bold shadow-sm transition">
            🪄 Simulate Trash Drop
          </button>
          <button onClick={handleDispense} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold shadow-sm transition">
            🍚 Manual Dispense
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Table */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold">Recent Collections</h2>
            </div>
            <table className="w-full text-left">
              <thead className="bg-white text-gray-400 text-sm border-b">
                <tr>
                  <th className="p-4 font-semibold">Trash Type</th>
                  <th className="p-4 font-semibold">Time Logged</th>
                  <th className="p-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={3} className="p-8 text-center text-gray-400">No data yet. Click Simulate.</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                      <td className="p-4 font-bold text-gray-700">{log.trash_type}</td>
                      <td className="p-4 text-gray-500 text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Right Column: Chart (Marketable Dataset) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-1">Data Analytics</h2>
            <p className="text-sm text-gray-500 mb-6">Breakdown of collected waste</p>
            
            <div className="space-y-6">
              {stats.length === 0 ? (
                <p className="text-gray-400 text-center text-sm">Waiting for data...</p>
              ) : (
                stats.map((stat, index) => {
                  const total = stats.reduce((acc, curr) => acc + curr.count, 0);
                  const percentage = Math.round((stat.count / total) * 100);
                  const colors = ["bg-green-500", "bg-blue-500", "bg-yellow-400", "bg-purple-500"];
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm font-semibold mb-2">
                        <span>{stat.trash_type}</span>
                        <span>{stat.count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${colors[index % colors.length]}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}