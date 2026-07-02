import React from 'react';
import { TEAM_COLORS } from '@/lib/gameData';

function heightToString(inches) {
  return `${Math.floor(inches / 12)}'${inches % 12}"`;
}

function StatBar({ value, max = 10, color }) {
  return (
    <div className="w-full h-1.5 bg-neutral-700 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${(value / max) * 100}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function RosterPanel({ roster, teamKey }) {
  const colors = TEAM_COLORS[teamKey];

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-700 p-3">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold"
          style={{ backgroundColor: colors.primary, color: colors.secondary }}
        >
          {teamKey === 'lakers' ? 'LAL' : 'BOS'}
        </div>
        <span className="text-xs text-neutral-400 uppercase tracking-widest font-semibold">
          1986-87 {colors.name}
        </span>
      </div>
      <div className="space-y-2">
        {roster.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
              style={{ backgroundColor: colors.primary, color: colors.text }}
            >
              {p.number}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs text-white font-medium truncate">{p.name}</span>
                <span className="text-[10px] text-neutral-500">{p.position} · {heightToString(p.height)}</span>
              </div>
              <div className="grid grid-cols-4 gap-x-2 gap-y-0.5 mt-1">
                <div>
                  <div className="text-[8px] text-neutral-500">SPD</div>
                  <StatBar value={p.speed} color={colors.secondary === '#FFFFFF' ? colors.primary : colors.secondary} />
                </div>
                <div>
                  <div className="text-[8px] text-neutral-500">SHT</div>
                  <StatBar value={p.shooting} color={colors.secondary === '#FFFFFF' ? colors.primary : colors.secondary} />
                </div>
                <div>
                  <div className="text-[8px] text-neutral-500">DEF</div>
                  <StatBar value={p.defense} color={colors.secondary === '#FFFFFF' ? colors.primary : colors.secondary} />
                </div>
                <div>
                  <div className="text-[8px] text-neutral-500">3P%</div>
                  <StatBar value={p.threePct * 100 / 45} color={colors.secondary === '#FFFFFF' ? colors.primary : colors.secondary} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}