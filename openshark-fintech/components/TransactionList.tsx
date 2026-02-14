import React from 'react';
import { Transaction } from '../types';
import { ShoppingBag, Coffee, Car, Zap, AlertTriangle, Repeat } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Shopping': return ShoppingBag;
    case 'Food & Dining': return Coffee;
    case 'Transportation': return Car;
    case 'Utilities': return Zap;
    default: return ShoppingBag;
  }
};

const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  return (
    <div className="bg-white rounded-2xl border border-airbnb-line shadow-card overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-airbnb-line flex justify-between items-center bg-white">
        <div>
            <h3 className="text-airbnb-black text-lg font-semibold">Recent Activity</h3>
            <p className="text-airbnb-gray text-xs mt-1">Updated just now</p>
        </div>
        <span className="text-xs font-semibold text-airbnb-black bg-airbnb-light border border-airbnb-line px-3 py-1 rounded-full">Live</span>
      </div>
      <div className="overflow-y-auto flex-1">
        {transactions.map((txn, index) => {
          const Icon = getCategoryIcon(txn.category);
          return (
            <div key={txn.id} className={`group flex items-center justify-between p-4 hover:bg-airbnb-hover transition-colors ${index !== transactions.length - 1 ? 'border-b border-airbnb-line' : ''}`}>
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${txn.isAnomaly ? 'bg-red-50 text-airbnb-red' : 'bg-airbnb-light text-airbnb-black'}`}>
                   {txn.isAnomaly ? <AlertTriangle size={20} strokeWidth={2.5} /> : <Icon size={20} strokeWidth={2} />}
                </div>
                <div>
                  <div className="flex items-center">
                    <p className="font-semibold text-airbnb-black text-sm">{txn.merchant}</p>
                    {txn.isSubscription && <Repeat size={12} className="ml-2 text-airbnb-gray" />}
                  </div>
                  <p className="text-xs text-airbnb-gray mt-0.5">{txn.date} • {txn.category}</p>
                </div>
              </div>
              <div className="text-right pl-4">
                <p className={`font-semibold text-sm ${txn.amount > 0 ? 'text-green-600' : 'text-airbnb-black'}`}>
                  {txn.amount > 0 ? '+' : ''}${Math.abs(txn.amount).toFixed(2)}
                </p>
                {txn.isAnomaly && <p className="text-[10px] text-airbnb-red font-bold mt-1">REVIEW</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransactionList;