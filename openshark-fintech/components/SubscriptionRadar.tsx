import React from 'react';
import { Repeat } from 'lucide-react';

interface Props {
  subscriptions: {
    subscriptions: { merchant: string; amount: number; interval_days: number; annual_cost: number }[];
  };
}

const SubscriptionRadar: React.FC<Props> = ({ subscriptions }) => {
  const subs = subscriptions?.subscriptions ?? [];
  const total = subs.reduce((acc, s) => acc + s.amount, 0);

  return (
    <div className="bg-white rounded-2xl border border-airbnb-line shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-airbnb-gray">Subscriptions</h4>
        <Repeat className="w-4 h-4 text-airbnb-gray" />
      </div>

      <p className="text-2xl font-extrabold text-airbnb-black mb-4">
        ${total.toFixed(2)}<span className="text-sm font-normal text-airbnb-gray">/mo</span>
      </p>

      {subs.length === 0 ? (
        <p className="text-sm text-airbnb-gray">No recurring charges detected.</p>
      ) : (
        <div className="space-y-3">
          {subs.slice(0, 5).map((sub, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-airbnb-black">{sub.merchant}</span>
              <span className="text-sm font-semibold text-airbnb-black">${sub.amount.toFixed(2)}</span>
            </div>
          ))}
          {subs.length > 5 && (
            <p className="text-xs text-airbnb-gray">+{subs.length - 5} more</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionRadar;
