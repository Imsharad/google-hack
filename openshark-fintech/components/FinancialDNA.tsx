import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
}

const COLORS = ['#FF385C', '#FFB400', '#00A699', '#FC642D', '#484848', '#767676', '#EBEBEB'];

const FinancialDNA: React.FC<Props> = ({ transactions }) => {
  const categoryTotals = new Map<string, number>();
  
  transactions.forEach(t => {
      if (t.amount < 0) {
          const cat = t.category;
          categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + Math.abs(t.amount));
      }
  });

  const data = Array.from(categoryTotals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const totalSpent = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="h-full bg-white rounded-2xl border border-airbnb-line shadow-card p-8 flex flex-col">
      <div className="mb-8 border-b border-airbnb-line pb-4">
        <h2 className="text-2xl font-bold text-airbnb-black flex items-center">
            Financial DNA
        </h2>
        <p className="text-airbnb-gray mt-1">Categorical breakdown of your spending habits.</p>
      </div>

      <div className="flex-1 min-h-[300px] flex flex-col md:flex-row items-center justify-center">
         <div className="w-full md:w-1/2 h-[350px] relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={4}
                        dataKey="value"
                        cornerRadius={4}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value: number) => `$${value.toFixed(2)}`}
                        contentStyle={{ 
                            backgroundColor: '#FFFFFF', 
                            borderColor: '#DDDDDD', 
                            color: '#222222', 
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            padding: '12px'
                         }}
                         itemStyle={{ color: '#222222', fontWeight: 600 }}
                    />
                </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-sm text-airbnb-gray">Total</p>
                <p className="text-xl font-bold text-airbnb-black">${totalSpent.toLocaleString()}</p>
            </div>
         </div>

         <div className="w-full md:w-1/2 space-y-4 pl-0 md:pl-12">
            {data.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between group p-2 hover:bg-airbnb-light rounded-lg transition-colors cursor-default">
                    <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-airbnb-black font-medium">{item.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-airbnb-black font-bold text-sm">${item.value.toFixed(0)}</span>
                        <span className="text-xs text-airbnb-gray">{((item.value / totalSpent) * 100).toFixed(1)}%</span>
                    </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default FinancialDNA;