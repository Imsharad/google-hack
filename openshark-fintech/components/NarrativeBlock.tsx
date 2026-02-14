import React from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  narrative: {
    headline: string;
    text: string;
    generated_at: string;
  };
}

const NarrativeBlock: React.FC<Props> = ({ narrative }) => {
  return (
    <div className="bg-white rounded-2xl border border-airbnb-line shadow-card p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-4 h-4 text-airbnb-red" />
        <h4 className="text-sm font-semibold text-airbnb-gray">AI Narrative</h4>
      </div>

      <p className="text-sm font-bold text-airbnb-black mb-2">{narrative.headline}</p>
      <p className="text-xs text-airbnb-dark leading-relaxed line-clamp-6">{narrative.text}</p>

      {narrative.generated_at && (
        <p className="text-[10px] text-airbnb-gray mt-4">
          Generated {new Date(narrative.generated_at).toLocaleString()}
        </p>
      )}
    </div>
  );
};

export default NarrativeBlock;
