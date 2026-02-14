import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Dna, Bot, Settings, LogOut, CreditCard } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: ViewState.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: ViewState.DNA, label: 'Financial DNA', icon: Dna },
    { id: ViewState.LEDGER_AGENT, label: 'Ledger Agent', icon: Bot },
    { id: ViewState.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-20 lg:w-64 h-screen bg-white border-r border-airbnb-line flex flex-col justify-between fixed left-0 top-0 z-50">
      <div>
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-center lg:justify-start lg:px-8">
          <CreditCard className="text-airbnb-red w-8 h-8" />
          <span className="hidden lg:block ml-2 font-bold text-xl tracking-tight text-airbnb-red">
            openshark
          </span>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4 lg:px-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center justify-center lg:justify-start px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-airbnb-light font-semibold text-airbnb-black'
                    : 'text-airbnb-gray hover:bg-airbnb-hover hover:text-airbnb-black'
                }`}
              >
                <Icon 
                  className={`w-5 h-5 ${isActive ? 'text-airbnb-black' : 'text-airbnb-gray group-hover:text-airbnb-black'}`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="hidden lg:block ml-4 text-sm">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-airbnb-line">
        <button className="w-full flex items-center justify-center lg:justify-start px-4 py-3 rounded-lg text-airbnb-gray hover:bg-airbnb-hover hover:text-airbnb-black transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="hidden lg:block ml-4 text-sm font-medium">Log out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;