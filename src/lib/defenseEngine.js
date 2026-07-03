// defenseEngine.js — 1986-87 multi-dimensional defensive system.
// Replaces the single "defense" rating with 10 separate ratings per player,
// team defensive tendencies, matchup assignments, containment scoring,
// help-defense decisions, and enhanced steal/block/interception resolution.
//
// Defense alters: contest level (open vs contested), turnover probability,
// foul probability, block probability, and offensive-rebound probability.
// It does NOT simply subtract a rating from the shooter's percentage.

import { COURT } from './gameData';
import {
  TEAM_DEFENSE_MAP,
  TEAM_DEFENSE_TENDENCIES, DEFAULT_MATCHUPS, SCHEME_WEIGHTS,
} from './defenseData';

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function dist(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

const CONTEST_LEVELS = ['wide_open', 'open', 'light_contest', 'tight', 'smothered'];
const POSITION_GROUP = { PG: 'guard', SG: 'guard', SF: 'wing', PF: 'big', C: 'big' };

// Distance-based contest baseline (mirrors gameEngine's gradeContest)
function gradeContestByDistance(distUnits) {
  if (distUnits >= 55) return 'wide_open';
  if (distUnits >= 40) return 'open';
  if (distUnits >= 28) return 'light_contest';
  if (distUnits >= 18) return 'tight';
  return 'smothered';
}

// The basket the offense attacks
function getBasketFor(state, offenseTeam) {
  const attackingRight = offenseTeam === state.teamKeys.team1;
  return attackingRight
    ? { x: COURT.width - COURT.rimX, y: COURT.basketY }
    : { x: COURT.rimX, y: COURT.basketY };
}

function getTeamTendency(team, key) {
  const t = TEAM_DEFENSE_TENDENCIES[team] || TEAM_DEFENSE_TENDENCIES.lakers;
  return t[key] ?? 1.0;
}

// Merge defensive ratings into roster player objects at game init.
export function mergeDefenseRatings(players, teamKey) {
  const defMap = TEAM_DEFENSE_MAP[teamKey] || {};
  players.forEach(p => {
    const d = defMap[p.name];
    if (d) Object.assign(p, d);
  });
  return players;
}

// Recompute man-to-man matchups for the current defense team.
// Uses default name-based assignments first, then position-group fallback.
export function recomputeMatchups(state) {
  const offenseTeam = state.possession;
  const defenseTeam = offenseTeam === state.teamKeys.team1 ? state.teamKeys.team2 : state.teamKeys.team1;
  const offense = state.players.filter(p => p.team === offenseTeam && p.onCourt);
  const defense = state.players.filter(p => p.team === defenseTeam && p.onCourt);
  const matchups = {};
  const used = new Set();

  const defaultMap = DEFAULT_MATCHUPS[defenseTeam] || {};

  // 1. Default assignments (e.g. Cooper → Bird, DJ → Magic)
  offense.forEach(o => {
    const defName = defaultMap[o.name];
    if (defName) {
      const def = defense.find(d => d.name === defName);
      if (def && !used.has(def.id)) {
        matchups[o.id] = def.id;
        used.add(def.id);
      }
    }
  });

  // 2. Remaining by position group, first available
  offense.filter(o => !matchups[o.id]).forEach(o => {
    const group = POSITION_GROUP[o.position] || 'wing';
    let pool = defense.filter(d => !used.has(d.id) && (POSITION_GROUP[d.position] || 'wing') === group);
    if (pool.length === 0) pool = defense.filter(d => !used.has(d.id));
    if (pool.length > 0) {
      const def = pool[0];
      matchups[o.id] = def.id;
      used.add(def.id);
    }
  });

  state.defensiveMatchups = matchups;
}

// The defender assigned to an offensive player
export function getPrimaryDefender(state, offensePlayer) {
  if (!state.defensiveMatchups || !offensePlayer) return null;
  const defId = state.defensiveMatchups[offensePlayer.id];
  return defId ? state.players.find(p => p.id === defId) : null;
}

// Reverse map: which offensive player a defender is guarding
export function getMatchupFor(state, defender) {
  if (!state.defensiveMatchups || !defender) return null;
  for (const [offId, defId] of Object.entries(state.defensiveMatchups)) {
    if (defId === defender.id) return state.players.find(p => p.id === offId);
  }
  return null;
}

// --- Help defender selection ---
// Best help = high helpDef rating, positioned between carrier and basket.
export function getHelpDefender(state, carrier, primaryDef, defensePlayers, basket) {
  if (!primaryDef || defensePlayers.length === 0) return null;
  let best = null;
  let bestScore = -Infinity;
  defensePlayers.forEach(d => {
    if (d.id === primaryDef.id) return;
    const helpRating = (d.helpDef || 50) / 99;
    const dToBasket = dist(d, basket);
    const dToCarrier = dist(d, carrier);
    let score = helpRating * 60 + clamp(1 - dToBasket / 250, 0, 1) * 30;
    if (dToCarrier < 120) score += 15;
    if (score > bestScore) { bestScore = score; best = d; }
  });
  return best;
}

// --- Special defensive abilities (conditional bonuses) ---
function specialDefenseBonus(state, carrier, primaryDef, helpDef, distToBasket) {
  let bonus = 0;
  // Cooper LOCKDOWN: guarding a star carrier
  if (primaryDef && primaryDef.name === 'Michael Cooper' && carrier.star) bonus += 12;
  // DJ GUARD STOPPER: on the primary ball handler (PG)
  if (primaryDef && primaryDef.name === 'Dennis Johnson' && carrier.position === 'PG') bonus += 8;
  // McHale LONG-ARM CONTEST: interior or midrange
  const mchalePrimary = primaryDef && primaryDef.name === 'Kevin McHale' && distToBasket < 200;
  const mchaleHelp = helpDef && helpDef.name === 'Kevin McHale' && distToBasket < 130;
  if (mchalePrimary || mchaleHelp) bonus += 10;
  // Bird ANTICIPATION: as help defender
  if (helpDef && helpDef.name === 'Larry Bird') bonus += 8;
  // Parish rim protection
  if (helpDef && helpDef.name === 'Robert Parish' && distToBasket < 80) bonus += 8;
  return bonus;
}

// --- Containment score (0-100) ---
// Weighted: primary 55%, help 20%, scheme 15%, matchup 10%.
// Offense creation erodes it; special abilities add; random variation.
export function computeContainmentScore(state, carrier, primaryDef, helpDef, nearestDefDist, distToBasket, isFastBreak) {
  if (!primaryDef) return 15;

  const isInterior = distToBasket < 120;
  const onBallRating = isInterior ? (primaryDef.postDef || 50) : (primaryDef.perimeterDef || 50);

  // Screen navigation penalty: a screened defender trails with lag
  let screenAdj = 0;
  const screen = state.screenState;
  if (screen && screen.screenedDefenderId === primaryDef.id) {
    screenAdj = -((100 - (primaryDef.screenNav || 50)) * 0.25);
  }
  const primaryScore = onBallRating + screenAdj;

  // Help component
  let helpScore = 0;
  if (helpDef) {
    const helpRating = helpDef.helpDef || 50;
    const helpProx = clamp(1 - dist(helpDef, carrier) / 220, 0, 1);
    helpScore = helpRating * (0.5 + helpProx * 0.5);
  }

  // Scheme component
  const team = primaryDef.team;
  let schemeScore = 50 * getTeamTendency(team, 'helpAtRim') * (isInterior ? 1.1 : 0.85);
  if (!isFastBreak) schemeScore *= getTeamTendency(team, 'halfcourtDiscipline');

  // Matchup component: size differential + versatility
  const sizeDiff = (primaryDef.height || 78) - (carrier.height || 78);
  const matchupScore = 50 + sizeDiff * 1.5 + ((primaryDef.versatility || 50) - 50) * 0.3;

  let containment =
    primaryScore * SCHEME_WEIGHTS.primary +
    helpScore * SCHEME_WEIGHTS.help +
    schemeScore * SCHEME_WEIGHTS.scheme +
    matchupScore * SCHEME_WEIGHTS.matchup;

  // Offensive creation erodes containment
  const creation = (carrier.driveTendency || 5) * 3 + (carrier.shooting || 5) * 2;
  containment -= creation * 0.04;

  // Special abilities
  containment += specialDefenseBonus(state, carrier, primaryDef, helpDef, distToBasket);

  // Random variation
  containment += (Math.random() - 0.5) * 14;

  return clamp(containment, 0, 100);
}

// Shift the distance-based contest level using the containment score.
function adjustContestLevel(baseLevel, containment) {
  let idx = CONTEST_LEVELS.indexOf(baseLevel);
  if (idx < 0) idx = 2;
  if (containment >= 88) idx = Math.min(4, idx + 2);
  else if (containment >= 72) idx = Math.min(4, idx + 1);
  else if (containment < 40) idx = Math.max(0, idx - 1);
  return CONTEST_LEVELS[idx];
}

// Main entry: compute the final contest level for a shot/drive decision.
// Returns { level, helpDef, containment }.
export function evaluateContest(state, carrier, nearestDef, defensePlayers, distToBasket, isFastBreak) {
  const primaryDef = nearestDef && nearestDef.player ? nearestDef.player : null;
  const basket = getBasketFor(state, carrier.team);
  const helpDef = getHelpDefender(state, carrier, primaryDef, defensePlayers, basket);
  const baseLevel = gradeContestByDistance(nearestDef ? nearestDef.dist : 999);
  const containment = computeContainmentScore(state, carrier, primaryDef, helpDef, nearestDef ? nearestDef.dist : 999, distToBasket, isFastBreak);
  return { level: adjustContestLevel(baseLevel, containment), helpDef, containment };
}

// --- Enhanced block chance ---
// Interior shots are most blockable; threes rarely. Help defenders contribute.
export function computeBlockChance(distToBasket, isThree, primaryDef, helpDef, helpCommitted) {
  const isInterior = distToBasket < 70;
  const isMid = distToBasket >= 70 && distToBasket < 200;

  const primaryBlock = primaryDef ? (primaryDef.blockDef || 30) : 30;
  const helpBlock = (helpCommitted && helpDef) ? (helpDef.blockDef || 30) : 30;
  const blockRating = (primaryBlock * 0.65 + helpBlock * 0.35) / 99;

  let chance;
  if (isInterior) chance = blockRating * 0.075;
  else if (isMid) chance = blockRating * 0.022;
  else chance = blockRating * 0.004;

  return clamp(chance, 0, 0.12);
}

// Block doesn't always change possession.
// { outcome: 'defense_recover'|'offense_recover'|'out_of_bounds'|'scramble', player }
export function resolveBlockOutcome(state, blocker) {
  const roll = Math.random();
  if (roll < 0.40) return { outcome: 'defense_recover', player: blocker };
  if (roll < 0.62) return { outcome: 'offense_recover', player: null };
  if (roll < 0.82) return { outcome: 'out_of_bounds', player: null };
  return { outcome: 'scramble', player: null };
}

// --- Enhanced steal chance (on-ball, per check cycle) ---
export function computeStealChance(state, carrier, primaryDef, defensePlayers, play) {
  if (!primaryDef) return 0;
  const tend = TEAM_DEFENSE_TENDENCIES[primaryDef.team] || TEAM_DEFENSE_TENDENCIES.lakers;

  const carrierFatigueMult = 1 + (carrier.fatigue || 0) / 100 * 0.5;
  let base = (carrier.turnoverRate || 0.12) * 0.0035 * carrierFatigueMult;

  // On-ball steal ability of the primary defender
  base += ((primaryDef.stealDef || 50) / 99) * 0.0018;

  // Team steal attempt frequency
  base *= tend.stealAttemptFreq;

  // Passing-lane denial: help defenders' collective steal ability
  let laneSum = 0, laneCount = 0;
  defensePlayers.forEach(d => {
    if (d.id === primaryDef.id) return;
    laneSum += (d.stealDef || 50) / 99;
    laneCount++;
  });
  if (laneCount > 0) base += (laneSum / laneCount) * 0.001 * tend.passingLaneDenial;

  // Play call modifiers
  if (play === 'aggressive_steal') base *= 2.4;
  if (play === 'double_ball' || play === 'double_post') base *= 1.7;

  return base;
}

// --- Pass interception chance (during ball flight) ---
// Lakers' passing-lane aggression creates more live-ball turnovers.
export function computeInterceptionChance(state, passer, receiver, defensePlayers) {
  if (defensePlayers.length === 0) return 0;
  const tend = TEAM_DEFENSE_TENDENCIES[defensePlayers[0].team] || TEAM_DEFENSE_TENDENCIES.lakers;

  // Check defenders near the pass trajectory (midpoint)
  const midX = (passer.x + receiver.x) / 2;
  const midY = (passer.y + receiver.y) / 2;
  let bestLane = 0;
  defensePlayers.forEach(d => {
    const dm = dist(d, { x: midX, y: midY });
    if (dm < 50) {
      const rating = (d.stealDef || 50) / 99;
      const prox = clamp(1 - dm / 50, 0, 1);
      bestLane = Math.max(bestLane, rating * prox);
    }
  });
  if (bestLane === 0) return 0;

  // Bad passers throw more pickable passes
  const passSkill = (passer.passing || 5) / 10;
  return clamp(bestLane * 0.02 * tend.passingLaneDenial * (1.2 - passSkill * 0.4), 0, 0.08);
}

// --- Help commitment decision (with cost: helper's man becomes open) ---
// Called on drives to the rim. Returns the help defender if they commit.
export function decideHelpCommit(state, carrier, primaryDef, defensePlayers, distToBasket) {
  if (!primaryDef || distToBasket > 130) return null;
  const basket = getBasketFor(state, carrier.team);
  const helpDef = getHelpDefender(state, carrier, primaryDef, defensePlayers, basket);
  if (!helpDef) return null;

  const helpRating = (helpDef.helpDef || 50) / 99;
  const teamHelp = getTeamTendency(helpDef.team, 'helpAtRim');
  const urgency = clamp(1 - distToBasket / 130, 0.2, 1);
  const chance = (0.30 + helpRating * 0.35) * teamHelp * urgency;

  if (Math.random() < chance) {
    const openMan = getMatchupFor(state, helpDef);
    if (openMan) state.helpCommitment = { helperId: helpDef.id, openManId: openMan.id };
    return helpDef;
  }
  return null;
}