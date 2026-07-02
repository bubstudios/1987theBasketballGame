import React, { useState, useMemo } from 'react';
import { TEAM_COLORS } from '@/lib/gameData';

const STAT_COLS = [
  { key: 'points', label: 'PTS' },
  { key: 'rebounds', label: 'REB' },
  { key: 'assists', label: 'AST' },
  { key: 'steals', label: 'STL' },
  { key: 'blocks', label: 'BLK' },
  { key: 'turnovers', label: 'TO' },
];

function StatRow({ player }) {
  const s = player.stats || {};
  return (
    <tr className="border-b border-neutral-800 last:border-0 hover:bg-neutral-800/40">
      <td className="py-1.5 px-2 text-neutral-500 text-xs tabular-nums">{player.number}</td>
      <td className="py-1.5 px-2 text-white text-xs font-medium whitespace-nowrap">{player.name.split(' ').pop()}</td>
      <td className="py-1.5 px-2 text-neutral-500 text-[10px]">{player.position}</td>
      <td className="py-1.5 px-2 text-right text-xs tabular-nums text-neutral-200">{s.fgm || 0}-{s.fga || 0}</td>
      <td className="py-1.5 px-2 text-right text-xs tabular-nums text-neutral-200">{s.ftm || 0}-{s.fta || 0}</td>
      {STAT_COLS.map(col => (
        <td key={col.key} className="py-1.5 px-2 text-right text-xs tabular-nums text-neutral-200">
          {s[col.key] || 0}
        </td>
      ))}
      <td className="py-1.5 px-2 text-right text-xs tabular-nums text-amber-400">{player.fouls || 0}</td>
    </tr>
  );
}

function TeamTable({ players, colors }) {
  const totals = useMemo(() => {
    return players.reduce((acc, p) => {
      const s = p.stats || {};
      STAT_COLS.forEach(col => { acc[col.key] += s[col.key] || 0; });
      acc.fgm += s.fgm || 0;
      acc.fga += s.fga || 0;
      acc.ftm += s.ftm || 0;
      acc.fta += s.fta || 0;
      acc.fouls += p.fouls || 0;
      return acc;
    }, { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fgm: 0, fga: 0, ftm: 0, fta: 0, fouls: 0 });
  }, [players]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-neutral-500 border-b border-neutral-800">
            <th className="py-2 px-2 text-left font-medium">#</th>
            <th className="py-2 px-2 text-left font-medium">Player</th>
            <th className="py-2 px-2 text-left font-medium">Pos</th>
            <th className="py-2 px-2 text-right font-medium">FG</th>
            <th className="py-2 px-2 text-right font-medium">FT</th>
            {STAT_COLS.map(col => (
              <th key={col.label} className="py-2 px-2 text-right font-medium">{col.label}</th>
            ))}
            <th className="py-2 px-2 text-right font-medium">PF</th>
          </tr>
        </thead>
        <tbody>
          {players.map(p => <StatRow key={p.id} player={p} />)}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-neutral-700 bg-neutral-800/50">
            <td colSpan={3} className="py-2 px-2 text-xs font-bold text-white uppercase tracking-wider">Totals</td>
            <td className="py-2 px-2 text-right text-xs font-bold tabular-nums text-neutral-300">{totals.fgm}-{totals.fga}</td>
            <td className="py-2 px-2 text-right text-xs font-bold tabular-nums text-neutral-300">{totals.ftm}-{totals.fta}</td>
            {STAT_COLS.map(col => (
              <td key={col.key} className="py-2 px-2 text-right text-sm font-bold tabular-nums text-white">
                {totals[col.key]}
              </td>
            ))}
            <td className="py-2 px-2 text-right text-sm font-bold tabular-nums text-amber-400">{totals.fouls}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function BoxScore({ gameState }) {
  const [activeTab, setActiveTab] = useState('team1');
  if (!gameState) return null;

  const t1 = gameState.teamKeys.team1;
  const t2 = gameState.teamKeys.team2;
  const c1 = TEAM_COLORS[t1];
  const c2 = TEAM_COLORS[t2];

  const isActive = activeTab === 'team1';
  const activeKey = isActive ? t1 : t2;
  const activeColors = isActive ? c1 : c2;
  const activePlayers = gameState.players.filter(p => p.team === activeKey);

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-700 overflow-hidden">
      <div className="flex items-center px-3 pt-3 pb-0 gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mr-auto">Box Score</h3>
        <button
          onClick={() => setActiveTab('team1')}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
          style={isActive
            ? { backgroundColor: c1.primary, color: c1.secondary }
            : { color: '#737373' }
          }
        >
          {c1.name}
        </button>
        <button
          onClick={() => setActiveTab('team2')}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
          style={!isActive
            ? { backgroundColor: c2.primary, color: c2.secondary }
            : { color: '#737373' }
          }
        >
          {c2.name}
        </button>
      </div>
      <div className="p-2 pt-3">
        <TeamTable players={activePlayers} colors={activeColors} />
      </div>
    </div>
  );
}