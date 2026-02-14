import React from 'react';

interface Props {
  score: number; // 0-100
}

function getZone(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 80) return { label: 'Excellent', color: '#00A699', bgColor: 'bg-emerald-50' };
  if (score >= 60) return { label: 'Good', color: '#FFB400', bgColor: 'bg-amber-50' };
  if (score >= 40) return { label: 'Fair', color: '#FC642D', bgColor: 'bg-orange-50' };
  return { label: 'Needs Work', color: '#FF385C', bgColor: 'bg-red-50' };
}

const HealthScoreRing: React.FC<Props> = ({ score }) => {
  const zone = getZone(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-airbnb-line shadow-card p-6 flex flex-col items-center">
      <h4 className="text-sm font-semibold text-airbnb-gray mb-4 self-start">Health Score</h4>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#F0F0F0" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={zone.color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-airbnb-black">{Math.round(score)}</span>
        </div>
      </div>
      <span className={`mt-3 text-xs font-bold px-3 py-1 rounded-full ${zone.bgColor}`} style={{ color: zone.color }}>
        {zone.label}
      </span>
    </div>
  );
};

export default HealthScoreRing;
