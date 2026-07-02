import React from 'react';
import { TEAM_COLORS } from '@/lib/gameData';

function formatTime(seconds) {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.floor(Math.max(0, seconds) % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function Scoreboard({ gameState }) {
  if (!gameState) return null;

  const teamFouls = (team) =>
    gameState.players.filter(p => p.team === team).reduce((sum, p) => sum + (p.fouls || 0), 0);

  const t1 = gameState.teamKeys.team1;
  const t2 = gameState.teamKeys.team2;
  const c1 = TEAM_COLORS[t1];
  const c2 = TEAM_COLORS[t2];

  return (
    <div className="flex items-center justify-between bg-neutral-900 text-white rounded-xl px-4 py-3 shadow-lg border border-neutral-700">
      {/* Team 1 (Lakers) */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
             style={{ backgroundColor: c1.primary, color: c1.secondary }}>
          {c1.abbr}
        </div>
        <div>
          <div className="text-xs text-neutral-400 uppercase tracking-wider">{c1.name}</div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: c1.secondary }}>
            {gameState.score[t1]}
          </div>
          <div className="text-[9px] text-neutral-500">Team Fouls: {teamFouls(t1)}</div>
        </div>
      </div>

      {/* Clock */}
      <div className="text-center">
        <div className="text-xs text-neutral-500 uppercase tracking-widest">Q{gameState.quarter}</div>
        <div className="text-3xl font-mono font-bold tabular-nums tracking-tight">
          {formatTime(gameState.gameClock)}
        </div>
        <div className="flex items-center justify-center gap-2 mt-0.5">
          <span className="text-[10px] text-neutral-500 uppercase">Shot</span>
          <span className={`text-sm font-mono font-bold tabular-nums ${gameState.shotClock <= 5 ? 'text-red-400' : 'text-neutral-300'}`}>
            {Math.max(0, Math.ceil(gameState.shotClock))}
          </span>
        </div>
      </div>

      {/* Team 2 (Opponent) */}
      <div className="flex items-center gap-3">
        <div>
          <div className="text-xs text-neutral-400 uppercase tracking-wider text-right">{c2.name}</div>
          <div className="text-2xl font-bold tabular-nums text-right" style={{ color: c2.primary }}>
            {gameState.score[t2]}
          </div>
          <div className="text-[9px] text-neutral-500 text-right">Team Fouls: {teamFouls(t2)}</div>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
             style={{ backgroundColor: c2.primary, color: c2.secondary }}>
          {c2.abbr}
        </div>
      </div>
    </div>
  );
}