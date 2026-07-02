import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TEAM_COLORS } from '@/lib/gameData';

export default function SubstitutionLog({ gameState }) {
  const log = gameState?.substitutionLog;
  if (!log || log.length === 0) return null;

  const oppKey = gameState.teamKeys.team2;

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-700 p-3">
      <div className="text-xs text-neutral-500 uppercase tracking-widest mb-2 font-semibold">Substitutions</div>
      <ScrollArea className="h-40">
        <div className="space-y-1">
          {log.map((entry, i) => {
            const colors = TEAM_COLORS[entry.team] || TEAM_COLORS[oppKey];
            const isLakers = entry.team === 'lakers';
            return (
              <div
                key={i}
                className={`flex items-center gap-2 text-xs py-1 px-2 rounded ${
                  i === 0 ? 'bg-neutral-800 text-white' : 'text-neutral-400'
                }`}
              >
                <span className="text-[10px] text-neutral-500 font-mono shrink-0 w-16">{entry.clockLabel}</span>
                <span className="font-medium shrink-0" style={{ color: colors.secondary === '#FFFFFF' ? '#e5e5e5' : colors.secondary }}>
                  {colors.abbr}
                </span>
                <span className="text-green-400 font-medium">{entry.incoming}</span>
                <span className="text-neutral-600">in for</span>
                <span className="text-red-400 font-medium">{entry.outgoing}</span>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}