import React from 'react';
import { LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer } from 'recharts';
import { TEAM_COLORS } from '@/lib/gameData';

function MomentumChartInner({ gameState }) {
  if (!gameState || !gameState.momentumHistory || gameState.momentumHistory.length < 2) return null;

  const oppKey = gameState.teamKeys.team2;
  const oppColors = TEAM_COLORS[oppKey];

  return (
    <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Momentum &amp; Pace</span>
        <div className="flex items-center gap-3 text-[10px] text-neutral-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: '#FDB927' }} />
            Lakers
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: oppColors.secondary }} />
            {oppColors.name}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 rounded-full bg-neutral-600" />
            Pace
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <LineChart data={gameState.momentumHistory} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <XAxis dataKey="clock" hide />
          <YAxis domain={[-6, 6]} hide />
          <ReferenceLine y={0} stroke="#444" strokeDasharray="2 4" />
          <Line type="monotone" dataKey="pace" stroke="#555" strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="team1" stroke="#FDB927" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="team2" stroke={oppColors.secondary} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const MomentumChart = React.memo(MomentumChartInner, (prev, next) => {
  return prev.gameState?.momentumHistory === next.gameState?.momentumHistory;
});

export default MomentumChart;