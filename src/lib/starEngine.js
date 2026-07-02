// starEngine.js — 1986-87 player role system.
// Role-based involvement for the full Lakers roster + Bird (Celtics hub).
// Stars control/direct a large share of possessions WITHOUT forcing bad shots.
//
// Two layers of correction prevent shot-volume distortion (e.g. Kareem 6/9
// while Magic 0/9):
//   1. Soft opportunity correction — actual FGA vs expected (by minutes played)
//   2. Early-game protection — after 8+ team attempts, boost underused primary
//      options and suppress players hogging >45% of attempts.

// Per-player role profiles. Ratings are 0-99 — they translate to opportunity
// WEIGHTS, not direct percentages. fgaTarget / mpgExpected drive the soft
// opportunity correction.
const PLAYER_ROLES = {
  // --- Lakers ---
  'Magic Johnson': {
    team: 'lakers', starRole: 'quarterback',
    initiation: 99, finishing: 96, offBall: 82, transition: 99,
    creation: 99, offReb: 55, clutchPriority: 96,
    fgaTarget: 16.4, mpgExpected: 36.3,
  },
  'James Worthy': {
    team: 'lakers',
    initiation: 58, finishing: 92, offBall: 97, transition: 99,
    creation: 58, offReb: 70,
    fgaTarget: 14.7, mpgExpected: 34.4,
  },
  'Byron Scott': {
    team: 'lakers',
    initiation: 45, finishing: 86, offBall: 95, transition: 94,
    creation: 62, offReb: 30,
    fgaTarget: 13.8, mpgExpected: 33.3,
  },
  'Kareem Abdul-Jabbar': {
    team: 'lakers',
    initiation: 25, finishing: 84, offBall: 90, transition: 38,
    creation: 55, offReb: 62,
    fgaTarget: 12.7, mpgExpected: 31.3,
  },
  'A.C. Green': {
    team: 'lakers',
    initiation: 12, finishing: 47, offBall: 78, transition: 84,
    creation: 20, offReb: 94,
    fgaTarget: 7.4, mpgExpected: 28.4,
  },
  'Michael Cooper': {
    team: 'lakers',
    initiation: 80, finishing: 65, offBall: 88, transition: 88,
    creation: 86, offReb: 35,
    fgaTarget: 9.0, mpgExpected: 27.5,
  },
  'Mychal Thompson': {
    team: 'lakers',
    initiation: 22, finishing: 76, offBall: 78, transition: 52,
    creation: 38, offReb: 76,
    fgaTarget: 8.2, mpgExpected: 20.6,
  },
  'Kurt Rambis': {
    team: 'lakers',
    initiation: 8, finishing: 30, offBall: 65, transition: 66,
    creation: 18, offReb: 91,
    fgaTarget: 4.0, mpgExpected: 19.4,
  },
  'Billy Thompson': {
    team: 'lakers',
    initiation: 28, finishing: 58, offBall: 80, transition: 88,
    creation: 35, offReb: 76,
    fgaTarget: 4.4, mpgExpected: 12.9,
  },
  'Wes Matthews': {
    team: 'lakers',
    initiation: 90, finishing: 53, offBall: 48, transition: 84,
    creation: 88, offReb: 15,
    fgaTarget: 3.7, mpgExpected: 10.6,
  },
  // --- Celtics ---
  'Larry Bird': {
    team: 'celtics', starRole: 'hub',
    initiation: 88, finishing: 95, offBall: 99, transition: 55,
    creation: 94, offReb: 92, clutchPriority: 99,
    fgaTarget: 20.2, mpgExpected: 40.6,
  },
};

function getRole(player) {
  return PLAYER_ROLES[player.name] || null;
}

// --- Team FGA tracking ---
export function getTeamFGA(state, team) {
  return state.players
    .filter(p => p.team === team)
    .reduce((sum, p) => sum + ((p.stats && p.stats.fga) || 0), 0);
}

// --- Lineup-dependent role adjustment ---
// Cooper and Matthews step up as initiators when Magic (and Cooper) sit.
function getAdjustedRole(state, player) {
  const role = getRole(player);
  if (!role) return null;
  const team = player.team;
  const magicOn = state.players.some(p => p.name === 'Magic Johnson' && p.team === team && p.onCourt);
  const cooperOn = state.players.some(p => p.name === 'Michael Cooper' && p.team === team && p.onCourt);
  const adjusted = { ...role };
  if (!magicOn) {
    if (player.name === 'Michael Cooper') {
      adjusted.initiation = 94;
      adjusted.creation = 94;
    }
    if (!cooperOn && player.name === 'Wes Matthews') {
      adjusted.initiation = 97;
      adjusted.creation = 92;
    }
  }
  return adjusted;
}

// --- Soft opportunity correction ---
// Compares actual FGA to expected (by minutes played). Underused players get
// more chances; overused players get fewer. NEVER applied to shooting %.
export function opportunityModifier(player) {
  const role = getRole(player);
  if (!role) return 1.0;
  const mins = (player.minutesPlayed || 0) / 60;
  if (mins < 0.5) return 1.0; // not enough data yet
  const expectedFga = role.fgaTarget * (mins / role.mpgExpected);
  if (expectedFga < 0.5) return 1.0;
  const actualFga = (player.stats && player.stats.fga) || 0;
  const ratio = actualFga / expectedFga;
  if (ratio < 0.35) return 1.35; // severely underused → +35%
  if (ratio < 0.60) return 1.20; // underused → +20%
  if (ratio > 1.80) return 0.70; // severely overused → −30%
  if (ratio > 1.40) return 0.85; // overused → −15%
  return 1.0;
}

// --- Early-game protection ---
// After ~8 team attempts, correct distorted distributions:
//   • Primary option (finishing ≥ 90) with 0 FGA → strong boost
//   • One player with >45% of team attempts → suppress (unless hot)
// Putbacks bypass this (they call takeShot directly, not makeBallCarrierDecision).
function earlyGameProtection(state, player) {
  const teamFga = getTeamFGA(state, player.team);
  if (teamFga < 8) return 1.0;

  const role = getRole(player);
  const playerFga = (player.stats && player.stats.fga) || 0;
  let mult = 1.0;

  // Primary option starved of shots → strong boost
  if (role && role.finishing >= 90 && playerFga === 0) {
    mult *= 1.40;
  }

  // One player hogging >45% of team attempts → suppress (unless hot)
  if (playerFga / teamFga > 0.45) {
    const fgm = (player.stats && player.stats.fgm) || 0;
    const isHot = playerFga >= 3 && fgm / playerFga >= 0.75;
    if (!isHot) mult *= 0.65;
  }

  return mult;
}

// --- Clutch: final 5 minutes of Q4, game within 8 points ---
export function isClutch(state) {
  if (state.quarter < 4) return false;
  if (state.gameClock > 300) return false;
  const diff = Math.abs(
    state.score[state.teamKeys.team1] - state.score[state.teamKeys.team2]
  );
  return diff <= 8;
}

function clutchBoost(state, player) {
  const role = getRole(player);
  if (!role || !role.starRole || !isClutch(state)) return 1.0;
  return role.starRole === 'quarterback' ? 1.10 : 1.15;
}

// --- Touch weight (pass-target selection) ---
// Biases passes toward high-initiation / high-off-ball players. Reduced when
// the target is heavily guarded — no forced bad shots.
export function getTouchWeight(state, player, openness) {
  const role = getAdjustedRole(state, player);
  if (!role) return 1.0;

  let w = (role.initiation + role.offBall) / 100; // ~0.5–1.8
  w *= opportunityModifier(player);
  w *= earlyGameProtection(state, player);
  w *= clutchBoost(state, player);

  if (openness != null && openness < 28) w *= 0.7;

  return Math.max(0.1, w);
}

// --- Scoring weight (ball-carrier shoot/drive decisions) ---
// Scales the carrier's shootChance and driveChance. Role players pass more;
// stars finish more. Opportunity + early-game correction prevent distortion.
export function getScoringWeight(state, player) {
  const role = getAdjustedRole(state, player);
  if (!role) return 1.0;

  let w = 0.6 + (role.finishing / 99) * 0.8; // ~0.8–1.4
  w *= opportunityModifier(player);
  w *= earlyGameProtection(state, player);
  w *= clutchBoost(state, player);

  return Math.max(0.15, w);
}

// --- Transition controller ---
// The team's transition director (Magic) — outlets and fast-break decisions.
export function getTransitionController(state, team) {
  return (
    state.players.find(
      p => p.team === team && p.onCourt && PLAYER_ROLES[p.name] && PLAYER_ROLES[p.name].transition > 80
    ) || null
  );
}