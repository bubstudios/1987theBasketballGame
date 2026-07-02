import React from 'react';
import { ArrowRight, ArrowLeft, Flame } from 'lucide-react';
import { TEAM_COLORS } from '@/lib/gameData';

export default function SubstitutionCommentary({ gameState }) {
  const log = gameState?.substitutionCommentary;
  if (!log || log.length === 0) {
    return (
      <div className="bg-neutral-900 rounded-xl border border-neutral-700 p-3">
        <div className="text-xs text-neutral-500 uppercase tracking-widest mb-2 font-semibold">Coach's Call</div>
        <div className="text-xs text-neutral-600 italic">Awaiting first substitution…</div>
      </div>
    );
  }

  const oppKey = gameState.teamKeys.team2;

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-700 p-3 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Coach's Call</div>
        <Flame size={14} className="text-amber-500" />
      </div>
      <div className="space-y-2">
        {log.slice(0, 3).map((entry, i) => {
          const colors = TEAM_COLORS[entry.team] || TEAM_COLORS[oppKey];
          const barColor = colors.secondary === '#FFFFFF' ? '#e5e5e5' : colors.secondary;
          const isLatest = i === 0;
          return (
            <div
              key={i}
              className={`rounded-lg px-3 py-2 transition-all ${
                isLatest ? 'bg-neutral-800 border-l-2' : 'bg-neutral-900 opacity-60'
              }`}
              style={isLatest ? { borderLeftColor: barColor } : {}}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono text-neutral-500">{entry.clockLabel}</span>
                <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: barColor }}>
                  {colors.abbr}
                </span>
              </div>
              <p className={`text-xs leading-snug ${isLatest ? 'text-white' : 'text-neutral-400'}`}>
                {entry.message}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 text-[10px]">
                <span className="flex items-center gap-0.5 text-green-400 font-medium">
                  <ArrowRight size={10} />
                  {entry.incoming}
                  {entry.incomingStar && <span className="text-amber-400">★</span>}
                </span>
                <span className="text-neutral-600">/</span>
                <span className="flex items-center gap-0.5 text-red-400 font-medium">
                  <ArrowLeft size={10} />
                  {entry.outgoing}
                  {entry.outgoingStar && <span className="text-amber-400">★</span>}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}