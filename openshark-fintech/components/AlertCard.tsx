import React from 'react';
import { AlertTriangle, Info, AlertOctagon, Trophy } from 'lucide-react';
import { renderInline } from './MarkdownMessage';

interface Props {
  priority: string; // "critical" | "advisory" | "win"
  title: string;
  body: string;
}

const PRIORITY_STYLES: Record<string, { border: string; bg: string; icon: typeof AlertTriangle; iconColor: string }> = {
  critical: { border: 'border-red-200', bg: 'bg-red-50', icon: AlertOctagon, iconColor: 'text-red-500' },
  advisory: { border: 'border-amber-200', bg: 'bg-amber-50', icon: AlertTriangle, iconColor: 'text-amber-500' },
  win:      { border: 'border-emerald-200', bg: 'bg-emerald-50', icon: Trophy, iconColor: 'text-emerald-500' },
};

const DEFAULT_STYLE = { border: 'border-blue-200', bg: 'bg-blue-50', icon: Info, iconColor: 'text-blue-500' };

const AlertCard: React.FC<Props> = ({ priority, title, body }) => {
  const style = PRIORITY_STYLES[priority] || DEFAULT_STYLE;
  const Icon = style.icon;

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} p-4`}>
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.iconColor}`} />
        <div>
          <p className="text-sm font-semibold text-airbnb-black">{title}</p>
          <p className="text-xs text-airbnb-dark mt-1 leading-relaxed">{renderInline(body)}</p>
        </div>
      </div>
    </div>
  );
};

export default AlertCard;
