// starEngine.js — 1986-87 star involvement for Magic Johnson & Larry Bird.
// Stars control/direct a large share of possessions without forcing bad shots.
// Two roles: "quarterback" (Magic — ball control, transition, drives) and
// "hub" (Bird — off-ball touches, scoring, playmaking from anywhere).

// Per-star profile: involvement ratings (0-99) + statistical targets.
// Ratings are NOT a direct % chance; they translate to opportunity weights.
const STAR_PROFILES = {
  'Magic Johnson': {
    role: 'quarterback',
    offensiveInitiation: 99,
    possessionEndingUsage: 88,   // ~26% usage
    scoringAggression: 88,
    transitionControl: 99,
    offBall: 70,
    clutchPriority: 96,
    fgaTarget: 16.5,
    ftaTarget: 7.9,
    mpgExpected: 36.3,
  },
  'Larry Bird': {
    role: 'hub',
    offensiveInitiation: 88,
    possessionEndingUsage: 95,   // ~27-29% usage
    scoringAggression: 96,
    transitionControl: 55,
    offBall: 99,
    clutchPriority: 99,
    fgaTarget: 20.2,
    ftaTarget: 6.1,
    mpgExpected: 40.6,
  },
};

export function isStar(player) {
  return !!STAR_PROFILES[player.name];
}

function getProfile(player) {
  return STAR_PROFILES[player.name] || null;
}

// Soft opportunity correction: compare actual FGA to expected (by minutes played).
// Returns a multiplier clamped 0.88–1.20 — a quiet star gets more chances,
// a star already heavily involved is gently suppressed. Never applied to make %.
export function opportunityModifier(player) {
  const prof = getProfile(player);
  if (!prof) return 1.0;
  const mins = (player.minutesPlayed || 0) / 60;
  if (mins < 1) return 1.0; // not enough data yet
  const expectedFga = prof.fgaTarget * (mins / prof.mpgExpected);
  const actualFga = (player.stats && player.stats.fga) || 0;
  if (actualFga < 1) return 1.20; // quiet → more chances
  const ratio = expectedFga / actualFga;
  return Math.max(0.88, Math.min(1.20, ratio));
}

// Clutch: final 5 minutes of Q4, game within 8 points
export function isClutch(state) {
  if (state.quarter < 4) return false;
  if (state.gameClock > 300) return false;
  const diff = Math.abs(
    state.score[state.teamKeys.team1] - state.score[state.teamKeys.team2]
  );
  return diff <= 8;
}

function clutchBoost(state, player) {
  const prof = getProfile(player);
  if (!prof || !isClutch(state)) return 1.0;
  // Magic: +10% involvement; Bird: +15% primary-option priority
  return prof.role === 'quarterback' ? 1.10 : 1.15;
}

// Weight for pass-target selection — biases touches toward stars.
// Reduced when the star is heavily guarded (no forced bad shots).
export function getStarTouchWeight(state, player, nearestDefDist) {
  const prof = getProfile(player);
  if (!prof) return 1.0;
  let w = 1.0 + (prof.offensiveInitiation - 50) / 100 * 0.5; // up to ~+0.25
  w *= opportunityModifier(player);
  w *= clutchBoost(state, player);
  if (nearestDefDist != null && nearestDefDist < 28) w *= 0.7;
  return w;
}

// Multiplier on a star carrier's own shoot decisions.
// Bird (hub) shoots more; Magic (quarterback) is more about creation/drives.
export function getStarShootMult(state, player) {
  const prof = getProfile(player);
  if (!prof) return 1.0;
  let m = prof.role === 'hub' ? 1.18 : 1.05;
  m *= opportunityModifier(player);
  m *= clutchBoost(state, player);
  return m;
}

// Multiplier on a star carrier's drive decisions.
// Magic (quarterback) attacks the rim and draws fouls aggressively.
export function getStarDriveMult(state, player) {
  const prof = getProfile(player);
  if (!prof) return 1.0;
  let m = prof.role === 'quarterback' ? 1.28 : 1.10;
  m *= opportunityModifier(player);
  m *= clutchBoost(state, player);
  return m;
}

// The team's transition controller (Magic) — directs fast-break outlets.
export function getTransitionController(state, team) {
  return (
    state.players.find(
      (p) => p.team === team && p.onCourt && STAR_PROFILES[p.name] && STAR_PROFILES[p.name].transitionControl > 80
    ) || null
  );
}