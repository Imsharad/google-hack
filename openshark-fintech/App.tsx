import React, { useState, useEffect } from 'react';
import { ViewState, Transaction } from './types';
import Sidebar from './components/Sidebar';
import TransactionList from './components/TransactionList';
import SpendingChart from './components/SpendingChart';
import LedgerAgent from './components/LedgerAgent';
import FinancialDNA from './components/FinancialDNA';
import { generateMockTransactions } from './services/mockData';
import { analyzeTransactions } from './services/geminiService';
import { Bell, Search, UserCircle, RefreshCcw, ShieldCheck, TrendingUp, AlertOctagon, Bot, ChevronDown } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(!!process.env.API_KEY);

  useEffect(() => {
    // Initial Load
    const data = generateMockTransactions();
    setTransactions(data);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    // Simulate Plaid Sync
    await new Promise(resolve => setTimeout(resolve, 1500));
    const newData = generateMockTransactions();
    setTransactions(newData);
    
    // Auto-analyze if key exists
    if (process.env.API_KEY) {
        const analysis = await analyzeTransactions(newData);
        setAiSummary(analysis);
    }
    
    setIsSyncing(false);
  };

  // Quick Stats
  const totalBalance = transactions.reduce((acc, t) => acc + t.amount, 12450.00); // Starting balance offset
  const monthlySpend = transactions.filter(t => t.amount < 0 && new Date(t.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const anomalies = transactions.filter(t => t.isAnomaly);

  // Render Content based on View
  const renderContent = () => {
    switch (view) {
      case ViewState.LEDGER_AGENT:
        return (
             <div className="h-[calc(100vh-100px)] p-6 md:p-10 max-w-7xl mx-auto">
                <LedgerAgent transactions={transactions} />
             </div>
        );
      case ViewState.DNA:
        return (
            <div className="h-[calc(100vh-100px)] p-6 md:p-10 max-w-7xl mx-auto">
                <FinancialDNA transactions={transactions} />
            </div>
        );
      case ViewState.SETTINGS:
        return (
            <div className="p-10 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-airbnb-black mb-8">Account Settings</h2>
                <div className="bg-white rounded-2xl border border-airbnb-line p-8 shadow-card">
                    <h3 className="text-xl font-semibold mb-6">Integrations</h3>
                    <div className="flex items-center justify-between py-4 border-b border-airbnb-line">
                        <div>
                            <p className="font-medium text-airbnb-black">Plaid Connection</p>
                            <p className="text-sm text-airbnb-gray">Checking •••• 4592</p>
                        </div>
                        <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">Active</span>
                    </div>
                    
                    <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4">API Configuration</h3>
                        <p className="text-sm text-airbnb-gray mb-4">
                            API Key management is handled via environment variables.
                        </p>
                        <div className="flex items-center space-x-3 bg-airbnb-light p-4 rounded-lg">
                            <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm font-medium text-airbnb-black">{hasApiKey ? 'Gemini API Connected' : 'No API Key Detected'}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
      case ViewState.DASHBOARD:
      default:
        return (
          <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-24">
            
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                 <div>
                    <h2 className="text-3xl font-extrabold text-airbnb-black tracking-tight">Financial Overview</h2>
                    <p className="text-airbnb-gray mt-1">Welcome back, John. Here's what's happening with your money.</p>
                 </div>
                 
                 {/* AI Insight Teaser - Styled as a notification card */}
                 {aiSummary && (
                    <div className="mt-4 md:mt-0 flex items-center bg-white border border-airbnb-line shadow-card rounded-xl px-4 py-3 cursor-pointer hover:shadow-floating transition-shadow" onClick={() => setView(ViewState.LEDGER_AGENT)}>
                        <div className="w-8 h-8 rounded-full bg-airbnb-red flex items-center justify-center mr-3">
                            <Bot className="text-white w-4 h-4" />
                        </div>
                        <div className="max-w-xs">
                             <p className="text-xs font-bold text-airbnb-black uppercase">Ledger Analysis</p>
                             <p className="text-sm text-airbnb-gray truncate">New insights available for review.</p>
                        </div>
                    </div>
                 )}
            </div>

            {/* Top Stats Cards - Minimalist */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="bg-white border border-airbnb-line p-6 rounded-2xl shadow-card hover:shadow-floating transition-shadow duration-300">
                 <div className="flex justify-between items-start mb-4">
                     <div className="p-3 bg-airbnb-light rounded-xl">
                        <ShieldCheck size={24} className="text-airbnb-black" />
                     </div>
                     <span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold">
                        <TrendingUp size={12} className="mr-1" />
                        +4.2%
                     </span>
                 </div>
                 <p className="text-airbnb-gray text-sm font-medium">Total Balance</p>
                 <p className="text-3xl font-extrabold text-airbnb-black mt-1">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-airbnb-line p-6 rounded-2xl shadow-card hover:shadow-floating transition-shadow duration-300">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-airbnb-light rounded-xl">
                        <TrendingUp size={24} className="text-airbnb-black" />
                     </div>
                 </div>
                 <p className="text-airbnb-gray text-sm font-medium">30-Day Spending</p>
                 <p className="text-3xl font-extrabold text-airbnb-black mt-1">${monthlySpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                 <div className="w-full bg-airbnb-light h-1.5 mt-4 rounded-full overflow-hidden">
                    <div className="bg-airbnb-black h-full rounded-full" style={{ width: '65%' }}></div>
                 </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-airbnb-line p-6 rounded-2xl shadow-card hover:shadow-floating transition-shadow duration-300">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-airbnb-light rounded-xl">
                        <AlertOctagon size={24} className="text-airbnb-black" />
                     </div>
                     {anomalies.length > 0 && <span className="bg-airbnb-red text-white text-xs font-bold px-2 py-1 rounded">Action Needed</span>}
                 </div>
                 <p className="text-airbnb-gray text-sm font-medium">Anomalies Detected</p>
                 <div className="flex items-end mt-1">
                    <p className="text-3xl font-extrabold text-airbnb-black">{anomalies.length}</p>
                 </div>
                 {anomalies.length > 0 ? (
                     <p className="text-xs text-airbnb-red mt-4 font-medium">
                        {anomalies[0].merchant} (${Math.abs(anomalies[0].amount)}) flagged.
                     </p>
                 ) : (
                     <p className="text-xs text-green-600 mt-4 font-medium">Everything looks good.</p>
                 )}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <SpendingChart transactions={transactions} />
                </div>
                {/* Fixed height to ensure internal scrolling and prevent sticky header conflict */}
                <div className="h-[500px] lg:h-[600px]">
                    <TransactionList transactions={transactions} />
                </div>
            </div>
          </div>
        );
    }
  }

  return (
    <div className="bg-[#F7F7F7] min-h-screen text-airbnb-black font-sans selection:bg-airbnb-light selection:text-airbnb-black">
      <Sidebar currentView={view} setView={setView} />
      
      <main className="lg:ml-64 transition-all duration-300">
        {/* Modern White Navbar */}
        <header className="h-20 bg-white border-b border-airbnb-line sticky top-0 z-40 px-6 md:px-10 flex items-center justify-between">
           {/* Search Bar (Fake) */}
           <div className="hidden md:flex items-center bg-airbnb-light border border-airbnb-line rounded-full px-4 py-2.5 w-96 hover:shadow-sm transition-shadow">
                <Search size={18} className="text-airbnb-black mr-3" strokeWidth={3} />
                <input type="text" placeholder="Search transactions..." className="bg-transparent border-none focus:outline-none text-sm text-airbnb-black w-full placeholder-airbnb-gray" />
           </div>
           
           {/* Mobile Title */}
           <h1 className="md:hidden text-lg font-bold text-airbnb-black">OpenShark</h1>

           <div className="flex items-center space-x-2 md:space-x-4">
               <button 
                  onClick={handleSync}
                  className={`p-2.5 rounded-full hover:bg-airbnb-light transition-colors text-airbnb-black border border-transparent hover:border-airbnb-line ${isSyncing ? 'animate-spin' : ''}`}
                  title="Sync with Plaid"
                >
                   <RefreshCcw size={18} strokeWidth={2.5} />
               </button>
               <button className="p-2.5 rounded-full hover:bg-airbnb-light transition-colors text-airbnb-black relative border border-transparent hover:border-airbnb-line">
                   <Bell size={18} strokeWidth={2.5} />
                   {anomalies.length > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-airbnb-red rounded-full border border-white"></span>}
               </button>
               
               {/* Profile Pill */}
               <div className="flex items-center space-x-2 border border-airbnb-line rounded-full pl-3 pr-1 py-1 hover:shadow-md transition-shadow cursor-pointer bg-white ml-2">
                   <div className="w-4 h-4 text-airbnb-gray">
                        <ChevronDown size={16} />
                   </div>
                   <div className="w-8 h-8 bg-airbnb-black rounded-full flex items-center justify-center text-white text-xs font-bold">
                       JD
                   </div>
               </div>
           </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
};

export default App;