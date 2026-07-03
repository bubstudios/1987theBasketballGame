import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TEAMS } from '@/lib/gameData';
import { Button } from '@/components/ui/button';
import { Users, Cpu, ChevronRight } from 'lucide-react';

function accentColor(colors) {
  return colors.secondary === '#FFFFFF' ? colors.primary : colors.secondary;
}

export default function TeamSelect() {
  const [userTeam, setUserTeam] = useState(null);
  const [cpuTeam, setCpuTeam] = useState(null);
  const navigate = useNavigate();

  const teamKeys = Object.keys(TEAMS);

  const handleStart = () => {
    if (userTeam && cpuTeam && userTeam !== cpuTeam) {
      navigate(`/game?user=${userTeam}&cpu=${cpuTeam}`);
    }
  };

  const renderTeamCard = (key, selected, disabled, onSelect) => {
    const team = TEAMS[key];
    const accent = accentColor(team.colors);
    return (
      <button
        key={key}
        disabled={disabled}
        onClick={() => onSelect(key)}
        className={`rounded-xl p-4 border-2 transition-all ${
          selected ? 'bg-white/5' : 'bg-neutral-900 hover:bg-neutral-800'
        } ${disabled ? 'opacity-25 cursor-not-allowed' : ''}`}
        style={selected ? { borderColor: accent } : { borderColor: '#262626' }}
      >
        <div
          className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: team.colors.primary, color: team.colors.secondary }}
        >
          {team.colors.abbr}
        </div>
        <div className="text-sm font-bold text-center text-white">{team.colors.name}</div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      <div className="max-w-2xl mx-auto w-full px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold text-center mb-1">1986-87 NBA Sim</h1>
        <p className="text-xs text-neutral-500 text-center mb-8 uppercase tracking-widest">Choose Your Matchup</p>

        {/* Your Team */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400">Your Team (Coach)</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {teamKeys.map(key => renderTeamCard(key, userTeam === key, cpuTeam === key, setUserTeam))}
          </div>
        </div>

        {/* CPU Team */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={16} className="text-red-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-red-400">CPU Opponent</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {teamKeys.map(key => renderTeamCard(key, cpuTeam === key, userTeam === key, setCpuTeam))}
          </div>
        </div>

        {/* Start Game */}
        <div className="text-center">
          <Button
            size="lg"
            disabled={!userTeam || !cpuTeam || userTeam === cpuTeam}
            onClick={handleStart}
            className="px-8"
          >
            Tip Off <ChevronRight size={18} className="ml-1" />
          </Button>
          {userTeam && cpuTeam && userTeam !== cpuTeam && (
            <p className="text-sm text-neutral-400 mt-3">
              {TEAMS[userTeam].colors.name} vs {TEAMS[cpuTeam].colors.name}
            </p>
          )}
          {!userTeam && !cpuTeam && (
            <p className="text-xs text-neutral-600 mt-2">Select both teams to begin</p>
          )}
        </div>
      </div>
    </div>
  );
}