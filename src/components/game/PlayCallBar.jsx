import React from 'react';
import { User, Mountain, Target, Zap, Megaphone } from 'lucide-react';

const PLAY_CALLS = [
  { id: 'iso_pg', label: 'ISO PG', desc: 'Isolate the point guard', icon: User },
  { id: 'feed_post', label: 'Feed Post', desc: 'Pound it inside to the big', icon: Mountain },
  { id: 'shoot_3', label: 'Shoot 3', desc: 'Hunt the long ball', icon: Target },
  { id: 'attack_rim', label: 'Attack Rim', desc: 'Drive hard to the basket', icon: Zap },
];

export default function PlayCallBar({ gameState, onCallPlay }) {
  if (!gameState) return null;

  const lakersPossession = gameState.possession === 'lakers';
  const blocked = !lakersPossession
    || !!gameState.timeoutState
    || !!gameState.ftState
    || gameState.shotAnimating
    || gameState.isPaused
    || (gameState.quarter >= 4 && gameState.gameClock <= 0);

  const active = gameState.userPlayCall;

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-700 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Megaphone size={13} className="text-amber-400" />
          <span className="text-xs text-neutral-400 uppercase tracking-widest font-semibold">Play Call</span>
        </div>
        <span className="text-[9px] text-neutral-500">
          {active ? 'Overriding CPU · single play' : lakersPossession ? 'Lakers ball' : '—'}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {PLAY_CALLS.map(play => {
          const Icon = play.icon;
          const isActive = active && active.type === play.id;
          const disabled = blocked || isActive;
          return (
            <button
              key={play.id}
              disabled={disabled}
              onClick={() => onCallPlay(play.id)}
              className={`rounded-lg p-2 text-left transition-colors border ${
                isActive
                  ? 'bg-amber-500/20 border-amber-400'
                  : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700'
              } ${disabled && !isActive ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Icon size={14} className={isActive ? 'text-amber-300' : 'text-amber-400/80'} />
              <div className="text-xs font-bold text-white leading-tight mt-1">{play.label}</div>
              <div className="text-[9px] text-neutral-500 leading-tight">{play.desc}</div>
            </button>
          );
        })}
      </div>

      {!lakersPossession && !active && (
        <div className="text-[10px] text-neutral-600 italic mt-2 text-center">
          Available on Lakers possession
        </div>
      )}
    </div>
  );
}