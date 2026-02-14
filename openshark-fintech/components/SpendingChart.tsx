import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction } from '../types';

interface SpendingChartProps {
  transactions: Transaction[];
  dailyTrend?: { date: string; amount: number }[];
}

const SpendingChart: React.FC<SpendingChartProps> = ({ transactions, dailyTrend }) => {
  let data: { date: string; amount: number }[];

  if (dailyTrend && dailyTrend.length > 0) {
    // Use backend daily_trend data directly
    data = dailyTrend.map(d => ({
      date: d.date.substring(5), // "2025-06-15" → "06-15"
      amount: d.amount,
    }));
  } else {
    // Fallback: compute from transactions (client-side)
    const dataMap = new Map<string, number>();
    const today = new Date();
    for (let i = 14; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dataMap.set(key, 0);
    }
    transactions.forEach(t => {
      if (t.amount < 0 && dataMap.has(t.date)) {
        dataMap.set(t.date, (dataMap.get(t.date) || 0) + Math.abs(t.amount));
      }
    });
    data = Array.from(dataMap.entries()).map(([date, amount]) => ({
      date: date.substring(5),
      amount,
    }));
  }

  return (
    <div className="w-full h-96 bg-white rounded-2xl p-6 border border-airbnb-line shadow-card">
      <div className="mb-6">
        <h3 className="text-airbnb-black text-lg font-semibold">Spending Velocity</h3>
        <p className="text-airbnb-gray text-sm">Your daily spend over the last 14 days</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF385C" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#FF385C" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#717171"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#717171"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#DDDDDD',
                color: '#222222',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                padding: '12px'
              }}
              itemStyle={{ color: '#FF385C', fontWeight: 600 }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spent']}
              cursor={{ stroke: '#DDDDDD' }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#FF385C"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorAmount)"
              activeDot={{ r: 6, strokeWidth: 0, fill: '#FF385C' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SpendingChart;
