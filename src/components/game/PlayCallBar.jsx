import React from 'react';
import { Flame, Mountain, Target, Zap, Megaphone, LayoutGrid, Hand, Users, UserCheck } from 'lucide-react';
import { getActivePlayLabel } from '@/lib/playEngine';

const OFFENSE_PLAYS = [
  { id: 'iso_hot', label: 'ISO Hottest', desc: 'Isolate the hottest hand', icon: Flame },
  { id: 'feed_post', label: 'Feed Post', desc: 'Pound it inside to the big', icon: Mountain },
  { id: 'shoot_3', label: 'Shoot 3', desc: 'Hunt the long ball', icon: Target },
  { id: 'attack_rim', label: 'Attack Rim', desc: 'Drive hard to the basket', icon: Zap },
];

const DEFENSE_PLAYS = [
  { id: 'crash_boards', label: 'Crash Boards', desc: 'Send everyone to the glass', icon: LayoutGrid },
  { id: 'aggressive_steal', label: 'Aggressive Steal', desc: 'Gamble for the ball — foul risk', icon: Hand },
  { id: 'double_post', label: 'Double Post', desc: 'Double the post big', icon: Users },
  { id: 'double_ball', label: 'Double Ball', desc: 'Double the ball-handler', icon: UserCheck },
];

export default function PlayCallBar({ gameState, userTeam, onCallPlay }) {
  if (!gameState) return null;

  const userPossession = gameState.possession === userTeam;
  const plays = userPossession ? OFFENSE_PLAYS : DEFENSE_PLAYS;
  const side = userPossession ? 'offense' : 'defense';

  const blocked = !!gameState.timeoutState
    || !!gameState.ftState
    || gameState.shotAnimating
    || gameState.isPaused
    || (gameState.quarter >= 4 && gameState.gameClock <= 0);

  // Offense runs the multi-option play engine (activePlay); defense is still a
  // one-shot override (userPlayCall) — defense gets the tradeoff rework next.
  const offPlay = userPossession ? gameState.activePlay : null;
  const defCall = !userPossession ? gameState.userPlayCall : null;
  const playLabel = getActivePlayLabel(gameState);

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-700 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Megaphone size={13} className="text-amber-400" />
          <span className="text-xs text-neutral-400 uppercase tracking-widest font-semibold">
            {userPossession ? 'Offensive Play Call' : 'Defensive Play Call'}
          </span>
        </div>
        <span className="text-[9px] text-neutral-500 max-w-[55%] text-right truncate">
          {playLabel
            ? `${playLabel.label}${playLabel.phase === 'finishing' && playLabel.option ? ` · ${playLabel.option.replace('_', ' ')}` : ` · ${playLabel.phase}`}`
            : defCall
            ? 'Active · single play'
            : userPossession ? 'Your ball' : 'On defense'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {plays.map(play => {
          const Icon = play.icon;
          const isActive = userPossession
            ? !!(offPlay && offPlay.buttonType === play.id)
            : !!(defCall && defCall.type === play.id && defCall.side === 'defense');
          const disabled = blocked || isActive;
          return (
            <button
              key={play.id}
              disabled={disabled}
              onClick={() => onCallPlay(play.id, side)}
              className={`rounded-lg p-1.5 text-left transition-colors border ${
                isActive
                  ? 'bg-amber-500/20 border-amber-400'
                  : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700'
              } ${disabled && !isActive ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Icon size={12} className={isActive ? 'text-amber-300' : 'text-amber-400/80'} />
              <div className="text-[11px] font-bold text-white leading-tight mt-0.5">{play.label}</div>
              <div className="text-[8px] text-neutral-500 leading-tight">{play.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}