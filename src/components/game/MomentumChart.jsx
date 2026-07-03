import React from 'react';
import { LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts';
import { TEAM_COLORS } from '@/lib/gameData';

function MomentumChartInner({ gameState }) {
  if (!gameState) return null;

  const t1Key = gameState.teamKeys.team1;
  const oppKey = gameState.teamKeys.team2;
  const t1Colors = TEAM_COLORS[t1Key];
  const oppColors = TEAM_COLORS[oppKey];
  const t1Mom = gameState.momentum?.[t1Key] ?? 0;
  const oppMom = gameState.momentum?.[oppKey] ?? 0;
  const pace = gameState.pace ?? 5;
  const t1Accent = t1Colors.secondary === '#FFFFFF' ? t1Colors.primary : t1Colors.secondary;

  // Always render — seed a flat baseline so the chart shows from tip-off
  const history = gameState.momentumHistory && gameState.momentumHistory.length >= 2
    ? gameState.momentumHistory
    : [{ clock: gameState.gameClock, quarter: gameState.quarter, team1: 0, team2: 0, pace: 0, fastBreak: false }];

  const data = history.map(h => ({
    ...h,
    label: `Q${h.quarter} ${Math.floor((720 - h.clock) / 60)}:${String(Math.floor((720 - h.clock) % 60)).padStart(2, '0')}`,
  }));

  return (
    <div className="bg-neutral-900/95 backdrop-blur-sm rounded-lg border border-neutral-700 px-3 py-2 shadow-xl">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Momentum</span>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: t1Accent }}>
            {t1Colors.abbr} {t1Mom >= 0 ? '+' : ''}{t1Mom.toFixed(1)}
          </span>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: oppColors.secondary === '#FFFFFF' ? '#e5e5e5' : oppColors.secondary }}>
            {oppColors.abbr} {oppMom >= 0 ? '+' : ''}{oppMom.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Pace</span>
          <span className="text-[10px] font-bold tabular-nums text-neutral-300">
            {pace > 5.5 ? '⚡' : ''} {pace.toFixed(1)}
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={70}>
        <LineChart data={data} margin={{ top: 2, right: 4, bottom: 0, left: 4 }}>
          <XAxis dataKey="label" hide />
          <YAxis domain={[-6, 6]} hide />
          <ReferenceLine y={0} stroke="#404040" strokeDasharray="2 4" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#171717',
              border: '1px solid #404040',
              borderRadius: '6px',
              fontSize: '10px',
              padding: '4px 8px',
            }}
            labelStyle={{ color: '#737373', fontSize: '9px' }}
            itemStyle={{ color: '#a3a3a3', fontSize: '10px' }}
          />
          <Line type="monotone" dataKey="pace" stroke="#525252" strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false} name="Pace" />
          <Line type="monotone" dataKey="team1" stroke={t1Accent} strokeWidth={2} dot={false} isAnimationActive={false} name={t1Colors.name} />
          <Line type="monotone" dataKey="team2" stroke={oppColors.secondary === '#FFFFFF' ? '#e5e5e5' : oppColors.secondary} strokeWidth={2} dot={false} isAnimationActive={false} name={oppColors.name} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const MomentumChart = React.memo(MomentumChartInner, (prev, next) => {
  return prev.gameState?.momentumHistory === next.gameState?.momentumHistory
    && prev.gameState?.pace === next.gameState?.pace
    && prev.gameState?.momentum === next.gameState?.momentum;
});

export default MomentumChart;