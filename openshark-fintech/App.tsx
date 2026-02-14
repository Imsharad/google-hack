import React, { useState, useEffect, useCallback } from 'react';
import { ViewState, Transaction, InsightsV2Response } from './types';
import Sidebar from './components/Sidebar';
import TransactionList from './components/TransactionList';
import SpendingChart from './components/SpendingChart';
import LedgerAgent from './components/LedgerAgent';
import FinancialDNA from './components/FinancialDNA';
import DataSourceSelector from './components/DataSourceSelector';
import HealthScoreRing from './components/HealthScoreRing';
import AlertCard from './components/AlertCard';
import SubscriptionRadar from './components/SubscriptionRadar';
import NarrativeBlock from './components/NarrativeBlock';
import { fetchTransactions, fetchBalance, fetchInsightsV2 } from './services/apiService';
import { Bell, Search, UserCircle, RefreshCcw, ShieldCheck, TrendingUp, AlertOctagon, Bot, ChevronDown, Loader2, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [insights, setInsights] = useState<InsightsV2Response | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const [txns, bal] = await Promise.all([
        fetchTransactions(),
        fetchBalance(),
      ]);
      setTransactions(txns);
      setBalance(bal.total_balance);
      setIsLoading(false);
      setIsSyncing(false);

      // Load insights independently (slow — calls LLM narrator)
      try {
        const ins = await fetchInsightsV2();
        setInsights(ins);
      } catch {
        // Insights may fail if no data yet; not critical
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend');
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Quick Stats — use backend balance if available, else compute from transactions
  const totalBalance = balance ?? transactions.reduce((acc, t) => acc + t.amount, 0);
  const monthlySpend = transactions
    .filter(t => t.amount < 0 && new Date(t.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const anomalyCount = insights?.alerts?.length ?? 0;

  const renderContent = () => {
    switch (view) {
      case ViewState.LEDGER_AGENT:
        return (
          <div className="h-[calc(100vh-100px)] p-6 md:p-10 max-w-7xl mx-auto">
            <LedgerAgent />
          </div>
        );
      case ViewState.DNA:
        return (
          <div className="h-[calc(100vh-100px)] p-6 md:p-10 max-w-7xl mx-auto">
            <FinancialDNA
              transactions={transactions}
              categoryBreakdown={insights?.category_breakdown}
            />
          </div>
        );
      case ViewState.SETTINGS:
        return (
          <div className="p-10 max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-airbnb-black">Settings</h2>
            <DataSourceSelector onDataLoaded={loadData} />

            {/* Connection Status */}
            <div className="bg-white rounded-2xl border border-airbnb-line p-8 shadow-card">
              <h3 className="text-xl font-semibold mb-6">Connection Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-airbnb-line">
                  <span className="text-airbnb-black font-medium">Backend API</span>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${error ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                    {error ? 'Disconnected' : 'Connected'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-airbnb-black font-medium">Transactions Loaded</span>
                  <span className="text-sm font-semibold text-airbnb-black bg-airbnb-light px-3 py-1 rounded-full">
                    {transactions.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      case ViewState.DASHBOARD:
      default:
        return (
          <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-24">

            {/* Error Banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
                <WifiOff className="text-red-500 w-5 h-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Backend Offline</p>
                  <p className="text-xs text-red-600">{error}. Go to Settings to seed data or check that the backend is running on port 8001.</p>
                </div>
              </div>
            )}

            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h2 className="text-3xl font-extrabold text-airbnb-black tracking-tight">Financial Overview</h2>
                <p className="text-airbnb-gray mt-1">Welcome back. Here's what's happening with your money.</p>
              </div>

              {insights?.narrative && (
                <div className="mt-4 md:mt-0 flex items-center bg-white border border-airbnb-line shadow-card rounded-xl px-4 py-3 cursor-pointer hover:shadow-floating transition-shadow" onClick={() => setView(ViewState.LEDGER_AGENT)}>
                  <div className="w-8 h-8 rounded-full bg-airbnb-red flex items-center justify-center mr-3">
                    <Bot className="text-white w-4 h-4" />
                  </div>
                  <div className="max-w-xs">
                    <p className="text-xs font-bold text-airbnb-black uppercase">Ledger Analysis</p>
                    <p className="text-sm text-airbnb-gray truncate">{insights.narrative.headline}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-airbnb-line p-6 rounded-2xl shadow-card hover:shadow-floating transition-shadow duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-airbnb-light rounded-xl">
                    <ShieldCheck size={24} className="text-airbnb-black" />
                  </div>
                  {insights && (
                    <span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold">
                      <TrendingUp size={12} className="mr-1" />
                      {insights.month_summary?.savings_rate?.toFixed(0) || 0}% saved
                    </span>
                  )}
                </div>
                <p className="text-airbnb-gray text-sm font-medium">Total Balance</p>
                <p className="text-3xl font-extrabold text-airbnb-black mt-1">
                  ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-white border border-airbnb-line p-6 rounded-2xl shadow-card hover:shadow-floating transition-shadow duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-airbnb-light rounded-xl">
                    <TrendingUp size={24} className="text-airbnb-black" />
                  </div>
                </div>
                <p className="text-airbnb-gray text-sm font-medium">30-Day Spending</p>
                <p className="text-3xl font-extrabold text-airbnb-black mt-1">
                  ${monthlySpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="w-full bg-airbnb-light h-1.5 mt-4 rounded-full overflow-hidden">
                  <div className="bg-airbnb-black h-full rounded-full" style={{ width: `${Math.min((monthlySpend / (totalBalance || 1)) * 100, 100)}%` }}></div>
                </div>
              </div>

              <div className="bg-white border border-airbnb-line p-6 rounded-2xl shadow-card hover:shadow-floating transition-shadow duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-airbnb-light rounded-xl">
                    <AlertOctagon size={24} className="text-airbnb-black" />
                  </div>
                  {anomalyCount > 0 && <span className="bg-airbnb-red text-white text-xs font-bold px-2 py-1 rounded">Action Needed</span>}
                </div>
                <p className="text-airbnb-gray text-sm font-medium">Alerts</p>
                <div className="flex items-end mt-1">
                  <p className="text-3xl font-extrabold text-airbnb-black">{anomalyCount}</p>
                </div>
                {anomalyCount > 0 ? (
                  <p className="text-xs text-airbnb-red mt-4 font-medium">
                    {insights!.alerts[0].title}
                  </p>
                ) : (
                  <p className="text-xs text-green-600 mt-4 font-medium">Everything looks good.</p>
                )}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <SpendingChart
                  transactions={transactions}
                  dailyTrend={insights?.daily_trend}
                />
              </div>
              <div className="h-[500px] lg:h-[600px]">
                <TransactionList transactions={transactions} />
              </div>
            </div>

            {/* Insights Row */}
            {insights && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <HealthScoreRing score={insights.health_score} />
                <div className="space-y-4">
                  {insights.alerts.slice(0, 2).map((alert, i) => (
                    <AlertCard key={i} severity={alert.severity} title={alert.title} body={alert.body} />
                  ))}
                </div>
                <SubscriptionRadar subscriptions={insights.subscriptions} />
                <NarrativeBlock narrative={insights.narrative} />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="bg-[#F7F7F7] min-h-screen text-airbnb-black font-sans selection:bg-airbnb-light selection:text-airbnb-black">
      <Sidebar currentView={view} setView={setView} />

      <main className="lg:ml-64 transition-all duration-300">
        {/* Navbar */}
        <header className="h-20 bg-white border-b border-airbnb-line sticky top-0 z-40 px-6 md:px-10 flex items-center justify-between">
          <div className="hidden md:flex items-center bg-airbnb-light border border-airbnb-line rounded-full px-4 py-2.5 w-96 hover:shadow-sm transition-shadow">
            <Search size={18} className="text-airbnb-black mr-3" strokeWidth={3} />
            <input type="text" placeholder="Search transactions..." className="bg-transparent border-none focus:outline-none text-sm text-airbnb-black w-full placeholder-airbnb-gray" />
          </div>

          <h1 className="md:hidden text-lg font-bold text-airbnb-black">OpenShark</h1>

          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              onClick={loadData}
              className={`p-2.5 rounded-full hover:bg-airbnb-light transition-colors text-airbnb-black border border-transparent hover:border-airbnb-line ${isSyncing ? 'animate-spin' : ''}`}
              title="Refresh data"
            >
              <RefreshCcw size={18} strokeWidth={2.5} />
            </button>
            <button className="p-2.5 rounded-full hover:bg-airbnb-light transition-colors text-airbnb-black relative border border-transparent hover:border-airbnb-line">
              <Bell size={18} strokeWidth={2.5} />
              {anomalyCount > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-airbnb-red rounded-full border border-white"></span>}
            </button>

            <div className="flex items-center space-x-2 border border-airbnb-line rounded-full pl-3 pr-1 py-1 hover:shadow-md transition-shadow cursor-pointer bg-white ml-2">
              <div className="w-4 h-4 text-airbnb-gray">
                <ChevronDown size={16} />
              </div>
              <div className="w-8 h-8 bg-airbnb-black rounded-full flex items-center justify-center text-white text-xs font-bold">
                OS
              </div>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-airbnb-gray mx-auto" />
              <p className="text-airbnb-gray text-sm">Loading financial data...</p>
            </div>
          </div>
        ) : (
          renderContent()
        )}
      </main>
    </div>
  );
};

export default App;
