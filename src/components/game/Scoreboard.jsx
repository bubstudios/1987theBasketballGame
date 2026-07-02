import React from 'react';
import { TEAM_COLORS } from '@/lib/gameData';

function formatTime(seconds) {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.floor(Math.max(0, seconds) % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function Scoreboard({ gameState }) {
  if (!gameState) return null;

  return (
    <div className="flex items-center justify-between bg-neutral-900 text-white rounded-xl px-4 py-3 shadow-lg border border-neutral-700">
      {/* Lakers */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
             style={{ backgroundColor: TEAM_COLORS.lakers.primary, color: TEAM_COLORS.lakers.secondary }}>
          LAL
        </div>
        <div>
          <div className="text-xs text-neutral-400 uppercase tracking-wider">Lakers</div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: TEAM_COLORS.lakers.secondary }}>
            {gameState.score.lakers}
          </div>
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

      {/* Celtics */}
      <div className="flex items-center gap-3">
        <div>
          <div className="text-xs text-neutral-400 uppercase tracking-wider text-right">Celtics</div>
          <div className="text-2xl font-bold tabular-nums text-right" style={{ color: TEAM_COLORS.celtics.primary }}>
            {gameState.score.celtics}
          </div>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
             style={{ backgroundColor: TEAM_COLORS.celtics.primary, color: TEAM_COLORS.celtics.secondary }}>
          BOS
        </div>
      </div>
    </div>
  );
}