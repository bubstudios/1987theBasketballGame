import React from 'react';
import { Star } from 'lucide-react';
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

export default function RosterPanel({ roster, bench, teamKey, gameState }) {
  const colors = TEAM_COLORS[teamKey];
  const livePlayers = gameState?.players?.filter(p => p.team === teamKey) || [];
  const barColor = colors.secondary === '#FFFFFF' ? colors.primary : colors.secondary;

  const renderPlayer = (p, i) => {
    const live = livePlayers[i];
    const fouls = live?.fouls || 0;
    const fouledOut = live?.fouledOut;
    const fatigue = live?.fatigue || 0;
    const onCourt = live?.onCourt ?? false;
    const isStar = live?.star || false;
    const isClutch = gameState?.quarter >= 4 && gameState?.gameClock <= 120;
    const isPeak = onCourt && fatigue < 30;
    const showStarGlow = isStar && onCourt && (isPeak || isClutch);

    return (
      <div key={i} className={`flex items-center gap-2 ${!onCourt ? 'opacity-70' : ''}`}>
        <div className="relative shrink-0">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold ${fouledOut ? 'opacity-40' : ''}`}
            style={{ backgroundColor: colors.primary, color: colors.text }}
          >
            {p.number}
          </div>
          {onCourt && !fouledOut && (
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border border-neutral-900" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-white font-medium truncate">{p.name}</span>
            {isStar && <span className="text-[9px] text-amber-400 leading-none">★</span>}
            <span className="text-[10px] text-neutral-500">{p.position} · {heightToString(p.height)}</span>
            {fouls > 0 && (
              <span className={`text-[9px] font-bold ${fouledOut ? 'text-red-500' : 'text-amber-400'}`}>
                {fouledOut ? 'DQ' : `${fouls}F`}
              </span>
            )}
          </div>
          <div className="grid grid-cols-6 gap-x-1.5 gap-y-0.5 mt-1">
            <div>
              <div className="text-[8px] text-neutral-500">SPD</div>
              <StatBar value={p.speed} color={barColor} />
            </div>
            <div>
              <div className="text-[8px] text-neutral-500">SHT</div>
              <StatBar value={p.shooting} color={barColor} />
            </div>
            <div>
              <div className="text-[8px] text-neutral-500">DEF</div>
              <StatBar value={p.defense} color={barColor} />
            </div>
            <div>
              <div className="text-[8px] text-neutral-500">3P%</div>
              <StatBar value={p.threePct * 100 / 45} color={barColor} />
            </div>
            <div>
              <div className="text-[8px] text-neutral-500">OReb</div>
              <StatBar value={p.offensiveRebRate * 100} max={12} color={barColor} />
            </div>
            <div>
              <div className="text-[8px] text-neutral-500">DReb</div>
              <StatBar value={p.defensiveRebRate * 100} max={25} color={barColor} />
            </div>
          </div>
          {onCourt ? (
            fatigue > 5 && (
              <div className="mt-1 flex items-center gap-1">
                <span className="text-[7px] text-neutral-600 w-5">FAT</span>
                <div className="flex-1 h-1 bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${fatigue}%`,
                      backgroundColor: fatigue > 75 ? '#ef4444' : fatigue > 50 ? '#f59e0b' : '#22c55e',
                    }}
                  />
                </div>
                {showStarGlow && (
                  <Star
                    className="shrink-0 animate-pulse"
                    size={10}
                    fill="currentColor"
                    style={{
                      color: isClutch ? '#f97316' : '#fbbf24',
                      filter: `drop-shadow(0 0 3px ${isClutch ? '#f97316' : '#fbbf24'})`,
                    }}
                  />
                )}
              </div>
            )
          ) : (
            <div className="mt-1 flex items-center gap-1">
              <span className="text-[7px] text-neutral-600 w-5">STAM</span>
              <div className="flex-1 h-1 bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${100 - fatigue}%`,
                    backgroundColor: fatigue < 25 ? '#22c55e' : fatigue < 50 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-700 p-3">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold"
          style={{ backgroundColor: colors.primary, color: colors.secondary }}
        >
          {colors.abbr}
        </div>
        <span className="text-xs text-neutral-400 uppercase tracking-widest font-semibold">
          1986-87 {colors.name}
        </span>
      </div>
      <div className="space-y-2">
        {roster.map((p, i) => renderPlayer(p, i))}
        {bench && bench.length > 0 && (
          <>
            <div className="pt-1 pb-0.5">
              <span className="text-[9px] text-neutral-600 uppercase tracking-widest font-bold">Bench</span>
            </div>
            {bench.map((p, i) => renderPlayer(p, i + roster.length))}
          </>
        )}
      </div>
    </div>
  );
}