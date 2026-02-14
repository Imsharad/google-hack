import React from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  balance?: number | null;
}

const DebitCard: React.FC<Props> = ({ balance }) => {
  return (
    <div className="relative w-full max-w-[420px] aspect-[1.6/1] rounded-2xl overflow-hidden select-none cursor-default group">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2d2b55] via-[#3b3775] to-[#1e1b4b] z-0" />

      {/* Subtle noise / glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/[0.04] z-[1]" />

      {/* Shimmer on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out z-[2]" />

      {/* Card content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6 md:p-7">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-white/[0.08] backdrop-blur-sm flex items-center justify-center border border-white/[0.06]">
            <Sparkles className="w-5 h-5 text-emerald-400" strokeWidth={2} />
          </div>
          <span className="text-[13px] font-semibold tracking-[0.2em] text-white/50 uppercase mt-1">
            Debit
          </span>
        </div>

        {/* Card number */}
        <div className="flex items-center gap-4 md:gap-5 font-mono">
          {[0, 1, 2].map((g) => (
            <div key={g} className="flex gap-[5px]">
              {[0, 1, 2, 3].map((d) => (
                <span
                  key={d}
                  className="w-[7px] h-[7px] rounded-full bg-white/30"
                />
              ))}
            </div>
          ))}
          <span className="text-[22px] md:text-[26px] font-medium tracking-[0.12em] text-white/90">
            4242
          </span>
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] tracking-[0.15em] text-white/30 uppercase mb-1">
              Card Holder
            </p>
            <p className="text-[15px] md:text-[17px] font-semibold tracking-wide text-white/90 uppercase">
              Sharad Jain
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] tracking-[0.15em] text-white/30 uppercase mb-1">
              Expires
            </p>
            <p className="text-[15px] md:text-[17px] font-semibold tracking-wide text-white/90">
              12/28
            </p>
          </div>
        </div>
      </div>

      {/* Soft inner glow on edges */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.08] z-20 pointer-events-none" />
    </div>
  );
};

export default DebitCard;
