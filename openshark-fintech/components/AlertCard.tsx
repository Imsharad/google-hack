import React from 'react';
import { AlertTriangle, Info, AlertOctagon } from 'lucide-react';

interface Props {
  severity: string;
  title: string;
  body: string;
}

const SEVERITY_STYLES: Record<string, { border: string; bg: string; icon: typeof AlertTriangle; iconColor: string }> = {
  high: { border: 'border-red-200', bg: 'bg-red-50', icon: AlertOctagon, iconColor: 'text-red-500' },
  medium: { border: 'border-amber-200', bg: 'bg-amber-50', icon: AlertTriangle, iconColor: 'text-amber-500' },
  low: { border: 'border-blue-200', bg: 'bg-blue-50', icon: Info, iconColor: 'text-blue-500' },
};

const AlertCard: React.FC<Props> = ({ severity, title, body }) => {
  const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.low;
  const Icon = style.icon;

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} p-4`}>
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.iconColor}`} />
        <div>
          <p className="text-sm font-semibold text-airbnb-black">{title}</p>
          <p className="text-xs text-airbnb-dark mt-1 leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
};

export default AlertCard;
