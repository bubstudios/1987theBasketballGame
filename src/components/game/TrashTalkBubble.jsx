import React from 'react';
import { TEAMS } from '@/lib/gameData';

// Floating speech bubble shown over the court when a player trash-talks.
// Driven by the personality engine's pendingTrashTalk output.
export default function TrashTalkBubble({ trashTalk }) {
  if (!trashTalk) return null;
  const teamColors = (TEAMS[trashTalk.team] && TEAMS[trashTalk.team].colors)
    || { primary: '#C8102E', secondary: '#1D42BA' };
  const accent = teamColors.secondary === '#FFFFFF' ? teamColors.primary : teamColors.secondary;

  return (
    <div
      className="animate-in fade-in zoom-in-50 duration-300 max-w-md rounded-2xl px-5 py-3 shadow-2xl border-2"
      style={{ backgroundColor: teamColors.primary, borderColor: accent }}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ backgroundColor: accent, color: teamColors.primary }}
        >
          {trashTalk.roleLabel}
        </span>
        <span className="text-sm font-bold text-white truncate">{trashTalk.playerName}</span>
      </div>
      <p className="mt-1 text-base font-bold text-white italic leading-tight">"{trashTalk.bubble}"</p>
    </div>
  );
}