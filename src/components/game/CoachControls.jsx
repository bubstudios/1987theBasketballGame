import React, { useState } from 'react';
import { Shield, RefreshCw, ClipboardList, ChevronLeft } from 'lucide-react';
import { TIMEOUTS_PER_GAME, TIMEOUT_PURPOSES, PLAY_CALLS } from '@/lib/timeoutEngine';
import { TEAM_COLORS } from '@/lib/gameData';

const PURPOSE_ICONS = {
  slow_momentum: Shield,
  substitution: RefreshCw,
  call_play: ClipboardList,
};

function TimeoutPips({ remaining, color }) {
  return (
    <div className="flex items-end gap-0.5">
      {Array.from({ length: TIMEOUTS_PER_GAME }).map((_, i) => (
        <div
          key={i}
          className="w-1 rounded-sm transition-all"
          style={{
            height: 10,
            backgroundColor: i < remaining ? color : 'rgba(255,255,255,0.15)',
          }}
        />
      ))}
    </div>
  );
}

function accentColor(colors) {
  return colors.secondary === '#FFFFFF' ? colors.primary : colors.secondary;
}

export default function CoachControls({ gameState, userTeam, opponent, onCallTimeout }) {
  const [playMode, setPlayMode] = useState(false);

  if (!gameState) return null;
  const userTO = gameState.timeouts?.[userTeam] || { remaining: TIMEOUTS_PER_GAME };
  const oppTO = gameState.timeouts?.[opponent] || { remaining: TIMEOUTS_PER_GAME };
  const userColors = TEAM_COLORS[userTeam];
  const oppColors = TEAM_COLORS[opponent];
  const userAccent = accentColor(userColors);
  const oppAccent = accentColor(oppColors);

  const activeTimeout = gameState.timeoutState;
  const blocked = !!activeTimeout || gameState.shotAnimating || !!gameState.ftState || gameState.isPaused || (gameState.quarter >= 4 && gameState.gameClock <= 0);
  const canCall = userTO.remaining > 0 && !blocked;

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-700 p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-neutral-400 uppercase tracking-widest font-semibold">Coach's Timeout</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold" style={{ color: userAccent }}>{userColors.abbr}</span>
            <TimeoutPips remaining={userTO.remaining} color={userAccent} />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold" style={{ color: oppAccent }}>{oppColors.abbr}</span>
            <TimeoutPips remaining={oppTO.remaining} color={oppAccent} />
          </div>
        </div>
      </div>

      {activeTimeout ? (
        <div
          className="rounded-lg bg-neutral-800 px-3 py-2 border-l-2"
          style={{ borderLeftColor: activeTimeout.team === userTeam ? userAccent : oppAccent }}
        >
          <div className="text-[9px] font-mono text-neutral-500 mb-0.5">⏸ TIMEOUT IN PROGRESS</div>
          <p className="text-xs text-white leading-snug">{activeTimeout.message}</p>
        </div>
      ) : playMode ? (
        <div>
          <button
            onClick={() => setPlayMode(false)}
            className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white mb-2"
          >
            <ChevronLeft size={12} /> Back
          </button>
          <div className="grid grid-cols-3 gap-1.5">
            {PLAY_CALLS.map(play => (
              <button
                key={play.id}
                disabled={!canCall}
                onClick={() => { onCallTimeout(userTeam, 'full', 'call_play', play.id); setPlayMode(false); }}
                className="rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed p-1.5 text-left transition-colors border border-neutral-700"
              >
                <div className="text-[11px] font-bold text-white">{play.label}</div>
                <div className="text-[8px] text-neutral-500 leading-tight mt-0.5">{play.desc}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {TIMEOUT_PURPOSES.map(p => {
            const Icon = PURPOSE_ICONS[p.id];
            return (
              <button
                key={p.id}
                disabled={!canCall}
                onClick={() => {
                  if (p.id === 'call_play') { setPlayMode(true); return; }
                  onCallTimeout(userTeam, p.type, p.id);
                }}
                className="rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed p-1.5 text-left transition-colors border border-neutral-700"
              >
                <Icon size={12} className="text-amber-400 mb-0.5" />
                <div className="text-[11px] font-bold text-white leading-tight">{p.label}</div>
                <div className="text-[8px] text-neutral-500 leading-tight">{p.desc}</div>
              </button>
            );
          })}
        </div>
      )}

      {!canCall && !activeTimeout && !playMode && (
        <div className="text-[10px] text-neutral-600 italic mt-2 text-center">
          {userTO.remaining <= 0 ? 'No timeouts remaining.' : 'Timeouts unavailable during this play.'}
        </div>
      )}
    </div>
  );
}