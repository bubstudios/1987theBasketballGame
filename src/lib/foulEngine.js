// foulEngine.js — foul decision helpers, team foul/penalty tracking,
// and rating-derived multipliers. Uses the multi-dimensional discipline
// rating and team foul-aggression tendency from the defensive system.

import { TEAM_DEFENSE_TENDENCIES } from './defenseData';

const PENALTY_THRESHOLD = 5; // 5th team foul of a quarter → penalty

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function dist(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

export function isInPenalty(state, team) {
  return (state.teamFouls[team] || 0) >= PENALTY_THRESHOLD;
}

export function applyTeamFoul(state, team) {
  state.teamFouls[team] = (state.teamFouls[team] || 0) + 1;
}

// Foul drawing: FTA/g + drive tendency (real-world signal for drawing contact)
export function foulDrawMult(player) {
  const fta = player.ftAttempts || 2;
  const drive = player.driveTendency || 5;
  return clamp(0.82 + fta * 0.05 + (drive - 5) * 0.012, 0.7, 1.4);
}

// Defender discipline: high discipline rating → fewer fouls.
// Team foul-aggression tendency scales the result (Lakers 103%, Celtics 94%).
export function defenderDisciplineMult(defender) {
  const discipline = (defender.discipline || 50) / 99; // 0-1
  const teamAggression = (TEAM_DEFENSE_TENDENCIES[defender.team] || {}).foulAggression || 1.0;
  return clamp((1.3 - discipline * 0.6) * teamAggression, 0.55, 1.45);
}

export function fatigueFoulMult(fatigue) {
  if (fatigue < 30) return 1.0;
  if (fatigue < 55) return 1.06;
  if (fatigue < 75) return 1.15;
  return 1.30;
}

// Who commits the foul on an interior/drive play:
// primary defender 65%, help 25%, rim protector 10%
export function pickFoulingDefender(defensePlayers, carrier, primary) {
  if (defensePlayers.length === 0) return null;
  const base = primary || defensePlayers[0];
  const roll = Math.random();
  if (roll < 0.65) return base;
  const rimProtector = defensePlayers.find(d => d.position === 'C')
    || defensePlayers[defensePlayers.length - 1];
  if (roll < 0.90) {
    let help = null, hd = Infinity;
    defensePlayers.forEach(d => {
      if (d.id === base.id) return;
      const dd = dist(d, carrier);
      if (dd < hd) { hd = dd; help = d; }
    });
    return help || rimProtector;
  }
  return rimProtector;
}

// Late-game intentional foul condition:
// Q4, under 45s, the defense (team without the ball) trailing by 2-8
export function intentionalFoulIntent(state, carrier) {
  if (state.quarter < 4 || state.gameClock > 45) return null;
  const defenseTeam = carrier.team === state.teamKeys.team1 ? state.teamKeys.team2 : state.teamKeys.team1;
  const deficit = state.score[carrier.team] - state.score[defenseTeam];
  if (deficit < 2 || deficit > 8) return null;
  return { defenseTeam, deficit };
}