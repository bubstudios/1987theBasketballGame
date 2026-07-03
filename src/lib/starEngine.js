// starEngine.js — 1986-87 player role system.
// Role-based involvement for the full Lakers roster + Bird (Celtics hub).
// Stars control/direct a large share of possessions WITHOUT forcing bad shots.
//
// Two layers of correction prevent shot-volume distortion (e.g. Kareem 6/9
// while Magic 0/9):
//   1. Soft opportunity correction — actual FGA vs expected (by minutes played)
//   2. Early-game protection — after 8+ team attempts, boost underused primary
//      options and suppress players hogging >45% of attempts.

import { microwaveWeightBoost } from './signatureMoves';

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
  // Boston: DJ/Ainge initiate, Bird is the hub, Bird & McHale co-star,
  // Parish is the third interior option. Ratings out of 99.
  'Larry Bird': {
    team: 'celtics', starRole: 'hub',
    initiation: 92, finishing: 99, offBall: 99, transition: 70,
    creation: 96, offReb: 72, clutchPriority: 99,
    fgaTarget: 20.2, mpgExpected: 40.6,
    shotWeight: 26,
  },
  'Kevin McHale': {
    team: 'celtics', starRole: 'post_star',
    initiation: 28, finishing: 98, offBall: 95, transition: 30,
    creation: 50, offReb: 92, clutchPriority: 92,
    fgaTarget: 17.0, mpgExpected: 39.7,
    shotWeight: 22,
  },
  'Robert Parish': {
    team: 'celtics',
    initiation: 15, finishing: 84, offBall: 88, transition: 75,
    creation: 35, offReb: 93,
    fgaTarget: 13.2, mpgExpected: 37.4,
    shotWeight: 18,
  },
  'Dennis Johnson': {
    team: 'celtics', starRole: 'organizer',
    initiation: 94, finishing: 74, offBall: 78, transition: 88,
    creation: 92, offReb: 35,
    fgaTarget: 12.1, mpgExpected: 37.1,
    shotWeight: 17,
  },
  'Danny Ainge': {
    team: 'celtics',
    initiation: 80, finishing: 80, offBall: 95, transition: 90,
    creation: 84, offReb: 38,
    fgaTarget: 11.9, mpgExpected: 35.2,
    shotWeight: 17,
  },
  'Jerry Sichting': {
    team: 'celtics',
    initiation: 84, finishing: 50, offBall: 89, transition: 80,
    creation: 80, offReb: 15,
    fgaTarget: 5.1, mpgExpected: 20.1,
  },
  'Bill Walton': {
    team: 'celtics',
    initiation: 68, finishing: 42, offBall: 78, transition: 45,
    creation: 90, offReb: 82,
    fgaTarget: 2.6, mpgExpected: 11.2,
  },
  'Fred Roberts': {
    team: 'celtics',
    initiation: 15, finishing: 56, offBall: 75, transition: 60,
    creation: 28, offReb: 72,
    fgaTarget: 3.7, mpgExpected: 14.8,
  },
  'Darren Daye': {
    team: 'celtics',
    initiation: 35, finishing: 62, offBall: 80, transition: 82,
    creation: 45, offReb: 62,
    fgaTarget: 3.3, mpgExpected: 11.9,
  },
  'Greg Kite': {
    team: 'celtics',
    initiation: 5, finishing: 22, offBall: 55, transition: 30,
    creation: 15, offReb: 80,
    fgaTarget: 1.5, mpgExpected: 10.1,
  },
  // --- Rockets ---
  // Houston: Akeem is the unquestioned primary scorer (Twin Towers interior
  // offense). McCray is the point-forward who connects the offense and defense
  // without high shot volume. Minniefield/Leavell organize; Reid is the veteran
  // secondary handler. Lloyd supplies bench scoring. Ratings out of 99.
  'Akeem Olajuwon': {
    team: 'rockets', starRole: 'post_star',
    initiation: 30, finishing: 99, offBall: 90, transition: 45,
    creation: 58, offReb: 99, clutchPriority: 96,
    fgaTarget: 18.0, mpgExpected: 36,
  },
  'Ralph Sampson': {
    team: 'rockets', starRole: 'post_star',
    initiation: 45, finishing: 91, offBall: 88, transition: 70,
    creation: 64, offReb: 87, clutchPriority: 90,
    fgaTarget: 13.5, mpgExpected: 31,
  },
  'Rodney McCray': {
    team: 'rockets', starRole: 'organizer',
    initiation: 92, finishing: 76, offBall: 90, transition: 92,
    creation: 94, offReb: 82, clutchPriority: 88,
    fgaTarget: 9.5, mpgExpected: 36,
  },
  'Robert Reid': {
    team: 'rockets',
    initiation: 84, finishing: 82, offBall: 88, transition: 84,
    creation: 84, offReb: 36,
    fgaTarget: 12.5, mpgExpected: 31,
  },
  'Dirk Minniefield': {
    team: 'rockets', starRole: 'organizer',
    initiation: 96, finishing: 58, offBall: 60, transition: 88,
    creation: 91, offReb: 22,
    fgaTarget: 7.0, mpgExpected: 24,
  },
  'Allen Leavell': {
    team: 'rockets',
    initiation: 93, finishing: 68, offBall: 70, transition: 82,
    creation: 89, offReb: 18,
    fgaTarget: 6.0, mpgExpected: 20,
  },
  'Lewis Lloyd': {
    team: 'rockets',
    initiation: 66, finishing: 90, offBall: 85, transition: 88,
    creation: 66, offReb: 28,
    fgaTarget: 7.5, mpgExpected: 16,
  },
  'Mitchell Wiggins': {
    team: 'rockets',
    initiation: 60, finishing: 83, offBall: 88, transition: 90,
    creation: 62, offReb: 92,
    fgaTarget: 7.0, mpgExpected: 16,
  },
  'Jim Petersen': {
    team: 'rockets',
    initiation: 24, finishing: 72, offBall: 75, transition: 50,
    creation: 36, offReb: 89,
    fgaTarget: 7.0, mpgExpected: 22,
  },
  'Buck Johnson': {
    team: 'rockets',
    initiation: 24, finishing: 58, offBall: 78, transition: 82,
    creation: 38, offReb: 78,
    fgaTarget: 3.0, mpgExpected: 8,
  },
  // --- Pistons ---
  // Detroit: Isiah is the offensive engine (quarterback), Dantley is the
  // half-court scoring machine (foul-drawing post iso), Laimbeer rebounds and
  // pops, Dumars stabilizes as secondary guard, Vinnie is instant bench offense.
  // Ratings out of 99.
  'Isiah Thomas': {
    team: 'pistons', starRole: 'quarterback',
    initiation: 99, finishing: 90, offBall: 82, transition: 96,
    creation: 99, offReb: 45, clutchPriority: 95,
    fgaTarget: 16.5, mpgExpected: 37,
  },
  'Adrian Dantley': {
    team: 'pistons', starRole: 'post_star',
    initiation: 58, finishing: 98, offBall: 72, transition: 40,
    creation: 72, offReb: 62, clutchPriority: 90,
    fgaTarget: 15.5, mpgExpected: 34,
    shotWeight: 26,
  },
  'Bill Laimbeer': {
    team: 'pistons',
    initiation: 38, finishing: 84, offBall: 84, transition: 30,
    creation: 54, offReb: 94,
    fgaTarget: 11.5, mpgExpected: 35,
    shotWeight: 18,
  },
  'Joe Dumars': {
    team: 'pistons', starRole: 'organizer',
    initiation: 82, finishing: 76, offBall: 86, transition: 84,
    creation: 86, offReb: 28,
    fgaTarget: 9.5, mpgExpected: 31,
    shotWeight: 16,
  },
  'Vinnie Johnson': {
    team: 'pistons',
    initiation: 74, finishing: 93, offBall: 78, transition: 84,
    creation: 78, offReb: 52,
    fgaTarget: 13.5, mpgExpected: 28,
    shotWeight: 22,
  },
  'Sidney Green': {
    team: 'pistons',
    initiation: 18, finishing: 58, offBall: 58, transition: 44,
    creation: 24, offReb: 88,
    fgaTarget: 7.0, mpgExpected: 22,
  },
  'Rick Mahorn': {
    team: 'pistons',
    initiation: 12, finishing: 52, offBall: 50, transition: 34,
    creation: 18, offReb: 86,
    fgaTarget: 5.5, mpgExpected: 20,
  },
  'Dennis Rodman': {
    team: 'pistons',
    initiation: 18, finishing: 54, offBall: 78, transition: 78,
    creation: 22, offReb: 96,
    fgaTarget: 5.0, mpgExpected: 15,
  },
  'John Salley': {
    team: 'pistons',
    initiation: 22, finishing: 62, offBall: 72, transition: 64,
    creation: 28, offReb: 82,
    fgaTarget: 5.0, mpgExpected: 18,
  },
  'Tony Campbell': {
    team: 'pistons',
    initiation: 35, finishing: 58, offBall: 58, transition: 76,
    creation: 42, offReb: 58,
    fgaTarget: 4.0, mpgExpected: 8,
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
// Lakers: Cooper and Matthews step up as initiators when Magic (and Cooper) sit.
// Celtics: Sichting becomes the primary organizer when Dennis Johnson rests,
// and Daye's off-ball/finishing rise when Bird sits.
function getAdjustedRole(state, player) {
  const role = getRole(player);
  if (!role) return null;
  const team = player.team;
  const adjusted = { ...role };

  if (team === 'lakers') {
    const magicOn = state.players.some(p => p.name === 'Magic Johnson' && p.team === team && p.onCourt);
    const cooperOn = state.players.some(p => p.name === 'Michael Cooper' && p.team === team && p.onCourt);
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
  }

  if (team === 'celtics') {
    const djOn = state.players.some(p => p.name === 'Dennis Johnson' && p.team === team && p.onCourt);
    const birdOn = state.players.some(p => p.name === 'Larry Bird' && p.team === team && p.onCourt);
    // Sichting steps up as initiator when DJ rests
    if (!djOn && player.name === 'Jerry Sichting') {
      adjusted.initiation = 94;
      adjusted.creation = 88;
    }
    // Daye gets more involved when Bird rests
    if (!birdOn && player.name === 'Darren Daye') {
      adjusted.offBall = 90;
      adjusted.finishing = 70;
    }
  }

  if (team === 'rockets') {
    const minniefieldOn = state.players.some(p => p.name === 'Dirk Minniefield' && p.team === team && p.onCourt);
    const leavellOn = state.players.some(p => p.name === 'Allen Leavell' && p.team === team && p.onCourt);
    const akeemOn = state.players.some(p => p.name === 'Akeem Olajuwon' && p.team === team && p.onCourt);
    const sampsonOn = state.players.some(p => p.name === 'Ralph Sampson' && p.team === team && p.onCourt);

    // Leavell becomes the primary organizer when Minniefield rests
    if (!minniefieldOn && player.name === 'Allen Leavell') {
      adjusted.initiation = 96;
      adjusted.creation = 92;
    }

    // Both point guards out — McCray and Reid take over initiation
    if (!minniefieldOn && !leavellOn) {
      if (player.name === 'Rodney McCray') {
        adjusted.initiation = 96;
        adjusted.creation = 95;
      }
      if (player.name === 'Robert Reid') {
        adjusted.initiation = 90;
        adjusted.creation = 88;
      }
    }

    // Both Twin Towers resting — Lloyd becomes a major second-unit finisher
    if (!akeemOn && !sampsonOn && player.name === 'Lewis Lloyd') {
      adjusted.finishing = 94;
      adjusted.initiation = 78;
    }
  }

  if (team === 'pistons') {
    const isiahOn = state.players.some(p => p.name === 'Isiah Thomas' && p.team === team && p.onCourt);
    const dumarsOn = state.players.some(p => p.name === 'Joe Dumars' && p.team === team && p.onCourt);
    // When Isiah rests, Vinnie and Dumars step up as initiators
    if (!isiahOn && player.name === 'Vinnie Johnson') {
      adjusted.initiation = 90;
      adjusted.creation = 88;
    }
    // Both Isiah and Dumars out — Vinnie becomes the primary initiator
    if (!isiahOn && !dumarsOn && player.name === 'Vinnie Johnson') {
      adjusted.initiation = 95;
      adjusted.creation = 90;
    }
    if (!isiahOn && !dumarsOn && player.name === 'Adrian Dantley') {
      adjusted.initiation = 72;
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

// --- Celtics offensive role system ---
// Boston runs a different structure than the Lakers: Dennis Johnson or Ainge
// initiate the possession, but Larry Bird is the hub who frequently receives
// the first meaningful touch and dictates what happens next. Bird and McHale
// are co-primary scorers; Parish is a substantial third interior option.
const CELTICS_CLUTCH_WEIGHTS = {
  'Larry Bird': 38,
  'Kevin McHale': 27,
  'Dennis Johnson': 13,
  'Danny Ainge': 12,
  'Robert Parish': 10,
};

// Shot-finisher bias: starting-five hierarchy + Bird-first-touch boost.
function celticsShotBias(state, player) {
  const role = getAdjustedRole(state, player);
  if (!role) return 1.0;
  let m = 1.0;
  if (role.shotWeight) m *= role.shotWeight / 20;
  // After 2+ Celtics possessions without a Bird touch, strongly bias the
  // next possession toward starting with a Bird touch.
  if (player.name === 'Larry Bird' && state.celticsOffense) {
    if ((state.celticsOffense.possessionsSinceBirdTouch || 0) >= 2) m *= 2.0;
  }
  return m;
}

// Clutch: final 5 minutes, game within 8 — Bird and McHale dominate.
function celticsClutchBoost(state, player) {
  if (!isClutch(state)) return 1.0;
  const w = CELTICS_CLUTCH_WEIGHTS[player.name];
  if (w != null) return w / 20;
  const birdOn = state.players.some(p => p.name === 'Larry Bird' && p.team === player.team && p.onCourt);
  const mchaleOn = state.players.some(p => p.name === 'Kevin McHale' && p.team === player.team && p.onCourt);
  if (birdOn || mchaleOn) return 0.5;
  return 0.9;
}

// --- Celtics touch & possession tracking ---
// Bird should receive the first meaningful touch ~40-50% of half-court
// possessions. If two consecutive possessions pass without a Bird touch,
// the next possession is strongly biased toward a Bird touch.
export function recordCelticsPass(state, receiver) {
  if (!state.celticsOffense || !receiver) return;
  if (receiver.team === 'celtics' && receiver.name === 'Larry Bird') {
    state.celticsOffense.birdTouchedThisPossession = true;
    state.celticsOffense.possessionsSinceBirdTouch = 0;
    state.celticsOffense.birdTouchesThisGame++;
  }
}

// Called at the top of switchPossession — finalizes the ending Celtics
// possession's Bird-touch state before the ball changes hands.
export function finalizeCelticsPossession(state) {
  if (!state.celticsOffense) return;
  if (state.possession !== 'celtics') return;
  if (!state.celticsOffense.birdTouchedThisPossession) {
    state.celticsOffense.possessionsSinceBirdTouch++;
  } else {
    state.celticsOffense.possessionsSinceBirdTouch = 0;
  }
  state.celticsOffense.birdTouchedThisPossession = false;
}

// --- Touch weight (pass-target selection) ---
// Celtics use a distinct hub-and-stars structure; Lakers keep the existing
// generic model. Both still respect openness — no forced bad shots.
export function getTouchWeight(state, player, openness) {
  const role = getAdjustedRole(state, player);
  if (!role) return 1.0;

  let w = (role.initiation + role.offBall) / 100; // ~0.5–1.8

  if (player.team === 'celtics') {
    w *= celticsShotBias(state, player);
    w *= celticsClutchBoost(state, player);
    w *= opportunityModifier(player);
    w *= earlyGameProtection(state, player);
  } else {
    w *= opportunityModifier(player);
    w *= earlyGameProtection(state, player);
    w *= clutchBoost(state, player);
  }

  if (openness != null && openness < 28) w *= 0.7;

  return Math.max(0.1, w);
}

// --- Scoring weight (ball-carrier shoot/drive decisions) ---
// Scales the carrier's shootChance and driveChance. Role players pass more;
// stars finish more. Both teams use the same finishing-rating hierarchy +
// shared opportunity/early-game corrections — no team-specific scoring boost.
// Celtics get a distinct touch-weight structure (Bird as hub) instead.
export function getScoringWeight(state, player) {
  const role = getAdjustedRole(state, player);
  if (!role) return 1.0;

  let w = 0.6 + (role.finishing / 99) * 0.8; // ~0.8–1.4

  if (player.team === 'celtics') {
    w *= celticsClutchBoost(state, player);
    w *= opportunityModifier(player);
    w *= earlyGameProtection(state, player);
  } else {
    w *= opportunityModifier(player);
    w *= earlyGameProtection(state, player);
    w *= clutchBoost(state, player);
  }

  w *= microwaveWeightBoost(state, player); // Vinnie Johnson — Microwave Mode
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