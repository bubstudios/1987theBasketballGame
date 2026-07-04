import { COURT, TEAM_FAST_BREAK, PLAYER_MPG, STAR_PLAYERS } from './gameData';
import { TIMEOUTS_PER_GAME, updateTimeout, checkAutoTimeout } from './timeoutEngine';
import { determineOffensiveRebound, computeReboundZone, selectRebounder, decidePutback } from './reboundEngine';
import { isInPenalty, applyTeamFoul, foulDrawMult, defenderDisciplineMult, fatigueFoulMult, pickFoulingDefender, intentionalFoulIntent } from './foulEngine';
import { getTouchWeight, getScoringWeight, getTransitionController, recordCelticsPass, finalizeCelticsPossession } from './starEngine';
import { mergeDefenseRatings, recomputeMatchups, getPrimaryDefender, getMatchupFor, evaluateContest, computeBlockChance, resolveBlockOutcome, computeStealChance, computeInterceptionChance, decideHelpCommit } from './defenseEngine';
import { TEAM_DEFENSE_TENDENCIES } from './defenseData';
import { selectShotVariation } from './shotLexicon';
import { DUNK_PHRASES } from './dunkPhrases';
import { checkDreamShake, checkZekeSplit, checkPumpFakeParade, improveContestLevel, updateMicrowaveMode, tickMicrowaveMode } from './signatureMoves';
import { rollTrashTalk, isEnforcer } from './personalityEngine';
import { checkSubstitutions, executeSubstitution } from './subEngine';
import { setupFreeThrowAlignment, releaseLanePlayersForRebound, getFTReboundWeight } from './freeThrowEngine';
import { maybeStartActivePlay, updateActivePlay, clearActivePlay } from './playEngine';

const BALL_RADIUS = 6;
const PLAYER_BASE_RADIUS = 14;
const POSSESSION_DURATION = 24000; // shot clock ms
const PASS_SPEED = 12;
const SHOT_ARC_DURATION = 800;

// Helper functions
function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

// --- Shot contest grading (NBA tracking-style distance bands) ---
// Contest levels are now computed by defenseEngine.evaluateContest, which
// blends distance with the multi-dimensional defensive ratings. CONTEST_MOD
// still maps each level to a make-probability adjustment.
const CONTEST_MOD = {
  three: { wide_open: 0.03, open: 0.00, light_contest: -0.02, tight: -0.05, smothered: -0.09 },
  mid:   { wide_open: 0.05, open: 0.02, light_contest: -0.02, tight: -0.06, smothered: -0.11 },
  rim:   { wide_open: 0.20, open: 0.12, light_contest: 0.02, tight: -0.06, smothered: -0.13 },
};

const DUNK_FLOOR = { wide_open: 0.92, open: 0.88, light_contest: 0.80, tight: 0.68, smothered: 0.55 };

// Assist eligibility — a made basket is only credited an assist when the pass
// directly created the score. Extended dribbling, isolation moves, and post
// moves (a long hold time after receiving the pass) erase the assist. Targets
// the ~60-72% assisted rate of 1980s basketball rather than near-100%.
function shouldAwardAssist(holdTime, shotType) {
  let base;
  if (shotType === 'three') base = 0.85;
  else if (shotType === 'dunk' || shotType === 'layup') base = 0.72;
  else base = 0.62; // mid-range
  if (holdTime > 5) base *= 0.15;
  else if (holdTime > 3) base *= 0.40;
  else if (holdTime > 1.8) base *= 0.65;
  return Math.random() < base;
}

// CPU patience: how willing the ball carrier is to launch given the contest
// level and the shot clock. Half-court only — fast breaks take the first good
// look. Wide-open shots are always takeable; contested looks are deferred until
// the clock forces the issue. Returns a multiplier on the base shoot chance.
function getPatienceFactor(contestLevel, shotClock) {
  if (contestLevel === 'wide_open') return 1.0;
  const early = shotClock > 14;
  const mid = shotClock > 8;
  const late = shotClock > 4;
  switch (contestLevel) {
    case 'open':
      return early ? 0.50 : (mid ? 0.78 : 1.0);
    case 'light_contest':
      return early ? 0.18 : (mid ? 0.48 : (late ? 0.85 : 1.15));
    case 'tight':
      return early ? 0.06 : (mid ? 0.22 : (late ? 0.62 : 1.25));
    default: // smothered
      return early ? 0.02 : (mid ? 0.07 : (late ? 0.38 : 1.35));
  }
}

// Motion offense positions (relative to basket, right side)
// Spots 0-2 are beyond the 3-point arc (dist > 220); spots 3-4 are inside.
// This spaces 3 perimeter shooters around the arc while bigs stay in the paint.
const OFFENSE_SPOTS_RIGHT = [
  { x: 620, y: 250 }, // PG: top of key 3-pointer (dist ~265)
  { x: 690, y: 95 },  // SG: right wing 3 (dist ~249)
  { x: 690, y: 405 }, // SF: left wing 3 (dist ~249)
  { x: 800, y: 140 }, // PF: short corner mid-range (dist ~139)
  { x: 835, y: 250 }, // C: low post (dist ~50)
];

const OFFENSE_SPOTS_LEFT = [
  { x: 320, y: 250 }, // PG: top of key 3-pointer (dist ~265)
  { x: 250, y: 95 },  // SG: right wing 3 (dist ~249)
  { x: 250, y: 405 }, // SF: left wing 3 (dist ~249)
  { x: 140, y: 140 }, // PF: short corner mid-range (dist ~139)
  { x: 105, y: 250 }, // C: low post (dist ~50)
];

// Cutting lanes for motion offense
const CUT_TARGETS_RIGHT = [
  { x: 860, y: 250 }, // basket cut
  { x: 820, y: 180 }, // elbow
  { x: 820, y: 320 }, // elbow low
  { x: 850, y: 150 }, // short corner top
  { x: 850, y: 350 }, // short corner bottom
];

const CUT_TARGETS_LEFT = [
  { x: 80, y: 250 },
  { x: 120, y: 180 },
  { x: 120, y: 320 },
  { x: 90, y: 150 },
  { x: 90, y: 350 },
];

// Fast break lane positions (index 0 = ball carrier drives to basket)
const FASTBREAK_LANES_RIGHT = [
  { x: 850, y: 250 },  // carrier → basket (overridden in updateFastBreak)
  { x: 820, y: 100 },  // right wing lane
  { x: 820, y: 400 },  // left wing lane
  { x: 860, y: 250 },  // rim runner
  { x: 500, y: 250 },  // trailer
];

const FASTBREAK_LANES_LEFT = [
  { x: 90, y: 250 },
  { x: 120, y: 100 },
  { x: 120, y: 400 },
  { x: 80, y: 250 },
  { x: 440, y: 250 },
];

export function createGameState(team1Key, team1Roster, team2Key, team2Roster) {
  const players = [];

  // Team 1 starts on the right side (offense first)
  team1Roster.forEach((p, i) => {
    const isStarter = i < 5;
    const spot = isStarter ? OFFENSE_SPOTS_RIGHT[i] : { x: 80 + i * 40, y: 475 };
    players.push({
      ...p,
      team: team1Key,
      id: `${team1Key}_${i}`,
      x: spot.x,
      y: spot.y,
      targetX: spot.x,
      targetY: spot.y,
      vx: 0,
      vy: 0,
      hasBall: isStarter && i === 0,
      onCourt: isStarter,
      courtIndex: isStarter ? i : null,
      isStarter: isStarter,
      fatigue: 0,
      mpg: PLAYER_MPG[p.name] || 20,
      star: STAR_PLAYERS.has(p.name),
      benchSpotX: 80 + i * 40,
      benchSpotY: 475,
      radius: PLAYER_BASE_RADIUS + (p.height - 75) * 0.3,
      maxSpeed: 1.5 + p.speed * 0.35,
      transitionSpeed: (1.5 + p.speed * 0.35) * (1.3 + p.speed * 0.04),
      cutTimer: 0,
      isCutting: false,
      isSettingScreen: false,
      shotClock: 0,
      fouls: 0,
      fouledOut: false,
      stats: { points: 0, rebounds: 0, offReb: 0, defReb: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fgm: 0, fga: 0, ftm: 0, fta: 0 },
    });
  });

  // Team 2 on left side (defense first)
  team2Roster.forEach((p, i) => {
    const isStarter = i < 5;
    const offSpot = OFFENSE_SPOTS_RIGHT[i];
    const spot = isStarter ? { x: offSpot.x + 30, y: offSpot.y } : { x: 860 - i * 40, y: 25 };
    players.push({
      ...p,
      team: team2Key,
      id: `${team2Key}_${i}`,
      x: spot.x,
      y: spot.y,
      targetX: spot.x,
      targetY: spot.y,
      vx: 0,
      vy: 0,
      hasBall: false,
      onCourt: isStarter,
      courtIndex: isStarter ? i : null,
      isStarter: isStarter,
      fatigue: 0,
      mpg: PLAYER_MPG[p.name] || 20,
      star: STAR_PLAYERS.has(p.name),
      benchSpotX: 860 - i * 40,
      benchSpotY: 25,
      radius: PLAYER_BASE_RADIUS + (p.height - 75) * 0.3,
      maxSpeed: 1.5 + p.speed * 0.35,
      transitionSpeed: (1.5 + p.speed * 0.35) * (1.3 + p.speed * 0.04),
      cutTimer: 0,
      isCutting: false,
      isSettingScreen: false,
      shotClock: 0,
      fouls: 0,
      fouledOut: false,
      stats: { points: 0, rebounds: 0, offReb: 0, defReb: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fgm: 0, fga: 0, ftm: 0, fta: 0 },
    });
  });

  mergeDefenseRatings(players.filter(p => p.team === team1Key), team1Key);
  mergeDefenseRatings(players.filter(p => p.team === team2Key), team2Key);

  const state = {
    players,
    ball: {
      x: players[0].x,
      y: players[0].y,
      targetX: null,
      targetY: null,
      carrier: players[0].id,
      lastPasserId: null,
      isLoose: false,
      inFlight: false,
      flightStart: null,
      flightDuration: 0,
      startX: 0,
      startY: 0,
      shotArcPeak: 0,
      isShot: false,
      isDunk: false,
      shotResult: null,
      passTargetId: null,
      passerId: null,
      flightElapsed: 0,
      carrierHoldTime: 0,
    },
    score: { [team1Key]: 0, [team2Key]: 0 },
    gameClock: 720, // 12 min quarter in seconds
    shotClock: 24,
    quarter: 1,
    possession: team1Key, // who has offense
    teamKeys: { team1: team1Key, team2: team2Key },
    attackingRight: true, // team 1 attacks right basket
    lastUpdate: Date.now(),
    passTimer: 0,
    actionTimer: 2500,
    shotAnimating: false,
    shotResultDisplay: null,
    shotResultTimer: 0,
    gameLog: [],
    isPaused: false,
    gameSpeed: 0.5,
    turnoverCooldown: 0,
    ftState: null,
    fastBreak: null,
    momentum: { [team1Key]: 0, [team2Key]: 0 },
    pace: 5,
    momentumHistory: [{ clock: 720, quarter: 1, team1: 0, team2: 0, pace: 0, fastBreak: false }],
    momentumSampleTimer: 0,
    subTimer: 3000,
    substitutionLog: [],
    substitutionCommentary: [],
    timeouts: {
      [team1Key]: { remaining: TIMEOUTS_PER_GAME, used: 0 },
      [team2Key]: { remaining: TIMEOUTS_PER_GAME, used: 0 },
    },
    timeoutState: null,
    teamFouls: { [team1Key]: 0, [team2Key]: 0 },
    quarterBreak: null,
    playCall: null,
    userPlayCall: null,
    screenState: null,
    screenCooldown: 0,
    stealCheckTimer: 0,
    possessionCount: { [team1Key]: 1, [team2Key]: 0 },
    possessionType: 'halfcourt',
    possessionTargetDuration: 18,
    celticsOffense: {
      possessionsSinceBirdTouch: 0,
      birdTouchedThisPossession: false,
      birdTouchesThisGame: 0,
    },
    defensiveMatchups: {},
    helpCommitment: null,
    pendingTurnover: null,
    pendingTrashTalk: null,
    microwaveMode: null,
  };
  recomputeMatchups(state);
  rollPossessionTurnover(state);
  return state;
}

function getOffenseSpots(attackingRight) {
  return attackingRight ? OFFENSE_SPOTS_RIGHT : OFFENSE_SPOTS_LEFT;
}

function getCutTargets(attackingRight) {
  return attackingRight ? CUT_TARGETS_RIGHT : CUT_TARGETS_LEFT;
}

function getBasketPos(attackingRight) {
  return attackingRight
    ? { x: COURT.width - COURT.rimX, y: COURT.basketY }
    : { x: COURT.rimX, y: COURT.basketY };
}

function getDefenseBasketPos(attackingRight) {
  return attackingRight
    ? { x: COURT.rimX, y: COURT.basketY }
    : { x: COURT.width - COURT.rimX, y: COURT.basketY };
}

function isThreePointer(x, y, attackingRight) {
  const basket = getBasketPos(attackingRight);
  const d = dist({ x, y }, basket);
  return d > 220;
}

export function updateGame(state, dt) {
  if (state.isPaused) return state;

  // Dead-ball stoppages clear any active offensive play
  if ((state.timeoutState || state.ftState || state.quarterBreak) && state.activePlay) {
    clearActivePlay(state);
  }
  
  // 0.5x is the baseline (regular) speed — simRate = 1.0 there.
  // Higher speeds (1, 2, 3) fast-forward both the simulation and the clocks.
  const simRate = state.gameSpeed / 0.5;
  const effectiveDt = dt * simRate;

  // Active timeout — clock frozen while teams huddle
  if (state.timeoutState) {
    updateTimeout(state, effectiveDt);
    updatePlayerMovement(state, effectiveDt);
    return state;
  }

  // Handle free throw state — dead-ball set piece: players hold FT formation
  if (state.ftState) {
    updateFreeThrows(state, effectiveDt);
    updatePlayerMovement(state, effectiveDt);
    // Keep ball with the shooter during FTs
    if (state.ball.carrier) {
      const carrier = state.players.find(p => p.id === state.ball.carrier);
      if (carrier) {
        state.ball.x = carrier.x;
        state.ball.y = carrier.y;
      }
    }
    return state;
  }

  // End-of-quarter intermission — play stops until the user continues
  if (state.quarterBreak) {
    // Players catch their breath during the break
    state.players.forEach(p => {
      p.fatigue = clamp(p.fatigue - 0.6 * (effectiveDt / 1000), 0, 100);
    });
    updatePlayerMovement(state, effectiveDt);
    return state;
  }

  // Clocks scale with the simulation rate — real-time at 0.5x (the baseline),
  // faster at 1x/2x/3x so you can fast-forward through the sim.
  state.gameClock -= effectiveDt / 1000;
  state.shotClock -= effectiveDt / 1000;

  if (state.gameClock <= 0) {
    state.gameClock = 0;
    state.shotClock = 0;
    // A shot in flight when the buzzer sounds is a buzzer-beater — let it
    // resolve, but NO other action (no rebounds, no new possessions, no
    // fast breaks, no AI decisions). The period ends as soon as the shot
    // resolves.
    if (state.ball.inFlight && state.ball.isShot) {
      updateBallFlight(state, effectiveDt);
      updatePlayerMovement(state, effectiveDt);
      return state;
    }
    // No shot in flight — the period is over. Kill any stray pass/loose ball.
    state.ball.inFlight = false;
    state.ball.isShot = false;
    validatePaceAtPeriodEnd(state);
    if (state.quarter < 4) {
      state.quarterBreak = { awaitingInput: true };
      return state;
    } else {
      state.isPaused = true;
      return state;
    }
  }

  if (state.shotClock <= 0 && !state.ball.inFlight) {
    // Shot clock violation — charge a turnover to the ball handler
    const offender = state.players.find(p => p.id === state.ball.carrier)
      || getOnCourtPlayers(state, state.possession)[0];
    if (offender) offender.stats.turnovers++;
    state.gameLog.unshift(`✗ Shot-clock violation on ${state.possession}`);
    state.shotClock = 24;
    switchPossession(state, null, 'shot_clock_violation');
    return state;
  }

  // Update shot result display
  if (state.shotResultTimer > 0) {
    state.shotResultTimer -= effectiveDt;
    if (state.shotResultTimer <= 0) {
      state.shotResultDisplay = null;
    }
  }

  // Pre-determined turnover: one roll per possession fires at its scheduled time.
  // Replaces the old per-frame steal checks + per-pass interception checks that
  // stacked up to end ~60-80% of possessions before a shot could occur.
  if (state.pendingTurnover && state.pendingTurnover.willOccur && !state.ball.inFlight && !state.shotAnimating && !state.ftState && !state.timeoutState && !state.quarterBreak) {
    const elapsed = 24 - state.shotClock;
    if (elapsed >= state.pendingTurnover.triggerElapsed) {
      executePendingTurnover(state);
      return state;
    }
  }

  // Momentum decay & pace normalization
  const momDecay = 0.05 * effectiveDt / 1000;
  state.momentum.lakers = clamp(state.momentum.lakers * (1 - momDecay), -6, 6);
  state.momentum[state.teamKeys.team2] = clamp(state.momentum[state.teamKeys.team2] * (1 - momDecay), -6, 6);
  state.pace = lerp(state.pace, 5, 0.3 * effectiveDt / 1000);

  // Sample momentum history periodically
  state.momentumSampleTimer -= effectiveDt;
  if (state.momentumSampleTimer <= 0) {
    state.momentumHistory = [...state.momentumHistory, {
      clock: state.gameClock,
      quarter: state.quarter,
      team1: state.momentum.lakers,
      team2: state.momentum[state.teamKeys.team2],
      pace: (state.pace - 5) * 0.5,
      fastBreak: !!(state.fastBreak && state.fastBreak.active),
    }];
    if (state.momentumHistory.length > 600) state.momentumHistory.shift();
    state.momentumSampleTimer = 5000;
  }

  // Fatigue & substitutions
  updateFatigue(state, effectiveDt);
  state.subTimer -= effectiveDt;
  if (state.subTimer <= 0 && !state.shotAnimating && !state.ball.inFlight && !state.ftState) {
    checkSubstitutions(state);
    checkAutoTimeout(state);
    state.subTimer = 3000;
    if (state.timeoutState) return state;
  }

  // Handle ball in flight (pass or shot)
  if (state.ball.inFlight) {
    updateBallFlight(state, effectiveDt);
    // Keep defense active during passes so defenders recover and anticipate closeouts
    if (!state.ball.isShot) {
      const passOffense = getOnCourtPlayers(state, state.possession);
      const passDefense = getOnCourtPlayers(state, state.possession === state.teamKeys.team1 ? state.teamKeys.team2 : state.teamKeys.team1);
      updateManToManDefense(state, passDefense, passOffense, effectiveDt);
    }
    updatePlayerMovement(state, effectiveDt);
    return state;
  }

  // Cooldowns
  state.passTimer -= effectiveDt;
  state.actionTimer -= effectiveDt;
  state.turnoverCooldown -= effectiveDt;

  const offensePlayers = getOnCourtPlayers(state, state.possession);
  const defensePlayers = getOnCourtPlayers(state, state.possession === state.teamKeys.team1 ? state.teamKeys.team2 : state.teamKeys.team1);
  const ballCarrier = state.players.find(p => p.id === state.ball.carrier);

  // Force rapid decisions on a buzzer-beater or a clear transition advantage
  // (numbers-up break) so the offense attacks instead of resetting to set up.
  if (ballCarrier && !state.ball.inFlight && !state.shotAnimating) {
    const b = getBasketPos(state.attackingRight);
    const dToBasket = dist(ballCarrier, b);
    let nearestD = Infinity;
    for (const d of defensePlayers) { const dd = dist(ballCarrier, d); if (dd < nearestD) nearestD = dd; }
    const buzzer = state.gameClock < 5;
    const advantage = (nearestD > 120 && dToBasket < 350) || (dToBasket < 160 && nearestD > 70);
    if (buzzer || advantage) {
      const cap = buzzer ? 250 : 500;
      state.actionTimer = Math.min(state.actionTimer, cap);
      state.passTimer = Math.min(state.passTimer, cap);
    }
  }

  // --- Fast break or half-court offense ---
  if (state.fastBreak && state.fastBreak.active) {
    updateFastBreak(state, offensePlayers, defensePlayers, effectiveDt);
  } else {
    maybeStartActivePlay(state);

    if (state.activePlay) {
      // --- ACTIVE PLAY: phase machine + play-specific positioning ---
      updateActivePlay(state, offensePlayers, defensePlayers, ballCarrier, effectiveDt);
    } else {
      // --- OFFENSE AI: Motion Offense ---
      updateMotionOffense(state, offensePlayers, ballCarrier, effectiveDt);

      // --- SCREENS: bigs set ball screens so the offense can create separation ---
      updateScreens(state, offensePlayers, defensePlayers, ballCarrier, effectiveDt);
    }

    // --- DEFENSE AI: Man-to-Man ---
    updateManToManDefense(state, defensePlayers, offensePlayers, effectiveDt);
  }

  // --- Decision making for ball carrier ---
  if (ballCarrier && state.actionTimer <= 0 && state.passTimer <= 0) {
    makeBallCarrierDecision(state, ballCarrier, offensePlayers, defensePlayers);
  }

  // Update movement
  updatePlayerMovement(state, effectiveDt);

  // Keep ball with carrier
  if (state.ball.carrier) {
    const carrier = state.players.find(p => p.id === state.ball.carrier);
    if (carrier) {
      state.ball.x = carrier.x;
      state.ball.y = carrier.y;
      state.ball.carrierHoldTime = (state.ball.carrierHoldTime || 0) + effectiveDt / 1000;
    }
  }

  return state;
}

function updateBallFlight(state, dt) {
  state.ball.flightElapsed = (state.ball.flightElapsed || 0) + dt;

  let intendedReceiver = null;

  if (!state.ball.isShot && state.ball.passTargetId) {
    intendedReceiver = state.players.find(
      player => player.id === state.ball.passTargetId && player.onCourt
    );

    // Follow the intended receiver's current position so the pass tracks them
    if (intendedReceiver) {
      state.ball.targetX = intendedReceiver.x;
      state.ball.targetY = intendedReceiver.y;
    }
  }

  const t = Math.min(state.ball.flightElapsed / state.ball.flightDuration, 1);

  state.ball.x = lerp(state.ball.startX, state.ball.targetX, t);
  state.ball.y = lerp(state.ball.startY, state.ball.targetY, t);

  if (state.ball.isShot) {
    // Arc for shots
    state.ball.arcHeight = state.ball.shotArcPeak * Math.sin(t * Math.PI);
  }

  if (t < 1) return;

  state.ball.inFlight = false;

  if (state.ball.isShot) {
    resolveShot(state);
    state.ball.isShot = false;
    state.ball.flightElapsed = 0;
    return;
  }

  // Normal pass completion — the intended receiver gets the ball.
  // Turnovers are decided by the one-roll-per-possession system, so an
  // ordinary completed pass never randomly changes possession.
  if (intendedReceiver && intendedReceiver.team === state.possession) {
    state.players.forEach(player => { player.hasBall = false; });
    intendedReceiver.hasBall = true;
    state.ball.carrier = intendedReceiver.id;
    state.ball.x = intendedReceiver.x;
    state.ball.y = intendedReceiver.y;
    state.ball.carrierHoldTime = 0;
  } else {
    // Error recovery: receiver left the court mid-pass (substitution/timeout).
    // Return the ball to the passer or first on-court offensive player —
    // never hand it to the defense, never switch possession.
    const passer = state.players.find(
      player => player.id === state.ball.passerId && player.onCourt && player.team === state.possession
    );
    const fallback = passer || getOnCourtPlayers(state, state.possession)[0];

    if (fallback) {
      state.players.forEach(player => { player.hasBall = false; });
      fallback.hasBall = true;
      state.ball.carrier = fallback.id;
      state.ball.x = fallback.x;
      state.ball.y = fallback.y;
      state.ball.carrierHoldTime = 0;
    }
  }

  state.ball.passTargetId = null;
  state.ball.passerId = null;
  state.ball.flightElapsed = 0;
  state.ball.isShot = false;
  state.ball.isNoLookPass = false;
}

function updateMotionOffense(state, offensePlayers, ballCarrier, dt) {
  const spots = getOffenseSpots(state.attackingRight);
  const cuts = getCutTargets(state.attackingRight);

  offensePlayers.forEach((player, i) => {
    if (player.id === state.ball.carrier) {
      // Ball handler holds position or drives
      return;
    }

    // A player actively setting a screen holds his position at the pick
    if (player.isSettingScreen && state.screenState) {
      return;
    }

    player.cutTimer -= dt;

    if (player.cutTimer <= 0 && !player.isCutting) {
      // Decide to cut or relocate
      const cutChance = 0.3 + player.speed * 0.03;
      if (Math.random() < cutChance) {
        // Make a cut
        player.isCutting = true;
        const cut = cuts[Math.floor(Math.random() * cuts.length)];
        player.targetX = cut.x + randomInRange(-20, 20);
        player.targetY = clamp(cut.y + randomInRange(-20, 20), 40, COURT.height - 40);
        player.cutTimer = randomInRange(800, 1500);
      } else {
        // Relocate to assigned spot — keeps perimeter shooters beyond the arc
        const spot = spots[i % spots.length];
        player.targetX = spot.x + randomInRange(-25, 25);
        player.targetY = clamp(spot.y + randomInRange(-25, 25), 40, COURT.height - 40);
        player.cutTimer = randomInRange(1500, 3000);
        player.isCutting = false;
      }
    }

    if (player.isCutting && dist(player, { x: player.targetX, y: player.targetY }) < 15) {
      // Finished cut, go back to a spot
      player.isCutting = false;
      const spot = spots[i % spots.length];
      player.targetX = spot.x + randomInRange(-20, 20);
      player.targetY = clamp(spot.y + randomInRange(-20, 20), 40, COURT.height - 40);
      player.cutTimer = randomInRange(1200, 2500);
    }
  });
}

function getActiveDefensePlay(state, defenseTeam) {
  if (state.userPlayCall && state.userPlayCall.side === 'defense' && state.userPlayCall.team === defenseTeam) {
    return state.userPlayCall.type;
  }
  return null;
}

function findDoubleTeamer(defensePlayers, offensePlayers, target) {
  if (!target) return null;
  const primaryIdx = offensePlayers.findIndex(o => o.id === target.id);
  let best = null;
  let bestD = Infinity;
  defensePlayers.forEach((d, i) => {
    if (i === primaryIdx) return; // skip the defender already on the target
    const dd = dist(d, target);
    if (dd < bestD) { bestD = dd; best = d; }
  });
  return best;
}

// Pick-and-screen engine: a big sets a ball screen for the carrier.
// The defender guarding the carrier gets "screened" — he trails his man
// with a lag instead of sticking cleanly, which opens up driving/shooting lanes.
function updateScreens(state, offensePlayers, defensePlayers, ballCarrier, dt) {
  // An active screen is in progress — hold the pick and let the carrier use it
  if (state.screenState) {
    const sc = state.screenState;
    sc.timer -= dt;

    const screener = state.players.find(p => p.id === sc.screenerId);
    const screenedDef = state.players.find(p => p.id === sc.screenedDefenderId);

    // Ball moved away from the screened carrier (pass/shot) — screen is stale
    if (!ballCarrier || state.ball.carrier !== sc.targetId) {
      if (screener) screener.isSettingScreen = false;
      state.screenState = null;
      return;
    }

    if (screener && screenedDef) {
      // Plant the screener between the carrier and his defender
      const midX = (ballCarrier.x + screenedDef.x) / 2;
      const midY = (ballCarrier.y + screenedDef.y) / 2;
      screener.targetX = midX;
      screener.targetY = midY;
      screener.isSettingScreen = true;

      // Carrier rubs off the screen and drives toward the basket
      const basket = getBasketPos(state.attackingRight);
      ballCarrier.targetX = lerp(ballCarrier.x, basket.x, 0.45);
      ballCarrier.targetY = lerp(ballCarrier.y, basket.y, 0.45);
    }

    if (sc.timer <= 0) {
      if (screener) screener.isSettingScreen = false;
      state.screenState = null;
    }
    return;
  }

  // Cooldown before the next screen can be set
  state.screenCooldown -= dt;
  if (state.screenCooldown > 0 || !ballCarrier) return;

  // ~25% chance to set a screen once the cooldown clears
  if (Math.random() > 0.25) {
    state.screenCooldown = 2000;
    return;
  }

  // A big (PF/C) sets the screen — never the ball carrier himself
  const screener = offensePlayers.find(p =>
    p.id !== ballCarrier.id && (p.position === 'C' || p.position === 'PF')
  );
  if (!screener) {
    state.screenCooldown = 3000;
    return;
  }

  // The defender guarding the ball carrier (index-matched) is the screened man
  const carrierIdx = offensePlayers.findIndex(p => p.id === ballCarrier.id);
  const screenedDef = defensePlayers[carrierIdx];
  if (!screenedDef) {
    state.screenCooldown = 3000;
    return;
  }

  state.screenState = {
    screenerId: screener.id,
    screenedDefenderId: screenedDef.id,
    targetId: ballCarrier.id,
    timer: 2000,
  };
  state.screenCooldown = 8000;
}

function updateManToManDefense(state, defensePlayers, offensePlayers, dt) {
  const ballCarrier = state.ball.carrier
    ? state.players.find(p => p.id === state.ball.carrier)
    : null;

  const defenseTeam = defensePlayers[0] ? defensePlayers[0].team : null;
  const play = getActiveDefensePlay(state, defenseTeam);

  // Anticipate pass receiver during ball flight for early closeout
  let passReceiver = null;
  if (state.ball.inFlight && !state.ball.isShot) {
    passReceiver = state.players.find(p =>
      p.team === state.possession &&
      dist(p, { x: state.ball.targetX, y: state.ball.targetY }) < 35
    );
  }

  // Double-team: pick the target and which defender cheats over to help
  let doubleTarget = null;
  let doubler = null;
  if (play === 'double_ball' && ballCarrier) {
    doubleTarget = ballCarrier;
    doubler = findDoubleTeamer(defensePlayers, offensePlayers, doubleTarget);
  } else if (play === 'double_post') {
    doubleTarget = offensePlayers.find(p => p.courtIndex === 4)
      || offensePlayers.find(p => p.position === 'C')
      || offensePlayers[offensePlayers.length - 1];
    if (doubleTarget) doubler = findDoubleTeamer(defensePlayers, offensePlayers, doubleTarget);
  }

  defensePlayers.forEach((defender, i) => {
    const matchup = getMatchupFor(state, defender) || offensePlayers[i];
    if (!matchup) return;

    // Defenders position between their man and the basket they're DEFENDING —
    // which is the same basket the offense attacks (getBasketPos), not the
    // opposite basket (getDefenseBasketPos).
    const basket = getBasketPos(state.attackingRight);

    // Recovery factor: combines speed and defensive awareness (0.2 - 1.0)
    // Uses the new perimeter/transition defensive ratings.
    const defRating = ((defender.perimeterDef || 50) / 99) * 9 + 1;
    const spdRating = defender.speed || 5;
    const defFatigue = 1 - (defender.fatigue || 0) / 100 * 0.2;
    const recoveryFactor = ((spdRating + defRating) / 20) * defFatigue;

    let defX, defY;

    // Active screen — a screened defender can't track his man cleanly
    const screen = state.screenState;
    const isScreened = screen && screen.screenedDefenderId === defender.id;

    if (doubler && defender.id === doubler.id && doubleTarget) {
      // This defender abandons his man to double the target
      const angle = Math.atan2(basket.y - doubleTarget.y, basket.x - doubleTarget.x);
      const doubleDist = 20;
      defX = doubleTarget.x + Math.cos(angle) * doubleDist;
      defY = doubleTarget.y + Math.sin(angle) * doubleDist;
    } else if (matchup.id === state.ball.carrier) {
      // On-ball defense — tight, stuck to the handler
      if (isScreened) {
        // Screened — trail the man with a lag, can't stick cleanly
        defX = lerp(defender.x, matchup.x, 0.4);
        defY = lerp(defender.y, matchup.y, 0.4);
      } else {
        let pressDist = 13 + (1 - recoveryFactor) * 6;
        if (play === 'aggressive_steal') pressDist = 10;
        if (doubleTarget && doubleTarget.id === matchup.id) pressDist = 10;
        const angle = Math.atan2(basket.y - matchup.y, basket.x - matchup.x);
        defX = matchup.x + Math.cos(angle) * pressDist;
        defY = matchup.y + Math.sin(angle) * pressDist;
      }
    } else if (passReceiver && matchup.id === passReceiver.id) {
      // Pass anticipation — sprint to close out on the receiver before the ball arrives
      // Recovery factor determines how tight the closeout is
      const closeoutDist = lerp(34, 16, recoveryFactor);
      const angle = Math.atan2(basket.y - matchup.y, basket.x - matchup.x);
      defX = matchup.x + Math.cos(angle) * closeoutDist;
      defY = matchup.y + Math.sin(angle) * closeoutDist;
    } else {
      // Off-ball defense — stick to your man, minimal sag
      const crashBoards = play === 'crash_boards';

      if (isScreened) {
        // Screened — trail the man with a lag
        defX = lerp(defender.x, matchup.x, 0.4);
        defY = lerp(defender.y, matchup.y, 0.4);
      } else {
        const sagToBasket = crashBoards ? 0.35 : 0.10;
        const midX = lerp(matchup.x, basket.x, sagToBasket);
        const midY = lerp(matchup.y, basket.y, sagToBasket);

        if (ballCarrier && !crashBoards) {
          const sagAmount = 0.06 * recoveryFactor;
          defX = lerp(midX, ballCarrier.x, sagAmount);
          defY = lerp(midY, ballCarrier.y, sagAmount);
        } else {
          defX = midX;
          defY = midY;
        }
      }
    }

    defender.targetX = clamp(defX, 20, COURT.width - 20);
    defender.targetY = clamp(defY, 20, COURT.height - 20);
  });
}

// Execute the active play's chosen option (shot/drive/pass) based on its phase.
// Lives in gameEngine because it needs takeShot/makePass/findBestPassTarget.
function executePlayOption(state, carrier, teammates, defenders, basket, nearestDef) {
  const play = state.activePlay;
  if (!play || play.team !== carrier.team) return false;
  if (state.gameClock < 8 || state.shotClock < 5) return false; // defer to buzzer/urgency

  const primary = state.players.find(p => p.id === play.primaryId);
  const secondary = play.secondaryId ? state.players.find(p => p.id === play.secondaryId) : null;

  if (play.phase === 'setup') { state.actionTimer = 250; return true; }

  if (play.phase === 'initiate' || play.phase === 'read') {
    const entryId = play.entryTargetId || play.primaryId;
    if (carrier.id !== entryId) {
      const entry = state.players.find(p => p.id === entryId);
      if (entry && dist(carrier, entry) < 420) { makePass(state, carrier, entry); state.passTimer = randomInRange(400, 700); state.actionTimer = 800; }
      else state.actionTimer = 300;
    } else {
      state.actionTimer = 300;
    }
    return true;
  }

  if (play.phase === 'finishing') {
    if (carrier.id !== play.primaryId) {
      if (primary && dist(carrier, primary) < 420) { makePass(state, carrier, primary); state.actionTimer = 600; }
      else state.actionTimer = 300;
      return true;
    }
    const opt = play.chosenOption || 'shoot';
    const dToBasket = dist(primary, basket);
    const open = (nearestDef && nearestDef.dist != null) ? nearestDef.dist > 55 : true;
    switch (opt) {
      case 'kick':
        if (secondary) { makePass(state, primary, secondary); state.actionTimer = 800; return true; }
        takeShot(state, primary, open, null, nearestDef); return true;
      case 'shoot':
      case 'pullup':
        takeShot(state, primary, open, null, nearestDef); return true;
      case 'drive':
      case 'post_move':
        if (dToBasket < 85) { takeShot(state, primary, open, null, nearestDef); return true; }
        primary.targetX = basket.x; primary.targetY = basket.y; state.actionTimer = 350; return true;
      default: {
        const target = findBestPassTarget(state, primary, teammates, defenders, basket);
        if (target) { makePass(state, primary, target); state.actionTimer = 800; return true; }
        takeShot(state, primary, open, null, nearestDef); return true;
      }
    }
  }
  return false;
}

function makeBallCarrierDecision(state, carrier, teammates, defenders) {
  const basket = getBasketPos(state.attackingRight);
  const distToBasket = dist(carrier, basket);
  const nearestDef = defenders.reduce((closest, d) => {
    const dd = dist(carrier, d);
    return dd < closest.dist ? { player: d, dist: dd } : closest;
  }, { player: null, dist: Infinity });

  const isFastBreak = state.fastBreak && state.fastBreak.active;
  const { level: contestLevel } = evaluateContest(state, carrier, nearestDef, defenders, distToBasket, isFastBreak);
  const isOpen = contestLevel === 'wide_open' || contestLevel === 'open';
  const isVeryClose = distToBasket < 80;
  const isShortMid = distToBasket >= 80 && distToBasket < 150;
  const isMidRange = distToBasket >= 150 && distToBasket < 220;
  const threeZone = isThreePointer(carrier.x, carrier.y, state.attackingRight);

  // A player at the rim takes the shot — gate/patience never suppress a layup.
  // A clear transition advantage (numbers up, no defender nearby) is attacked
  // immediately rather than backing out to set up the half-court offense.
  const rimBucket = isVeryClose;
  // A clear lane = no defender between carrier and basket, OR the carrier is
  // in the lane with enough space to attack. The lane-proximity condition
  // catches the case where a fast break ends in the paint without a shot —
  // the carrier should finish, not kick out and reset the half-court offense.
  const inLane = distToBasket < 160;
  const clearLane = (nearestDef.dist > 120 && distToBasket < 350) || (inLane && nearestDef.dist > 70);
  const attackNow = rimBucket || clearLane;
  const effectiveClock = Math.min(state.gameClock, state.shotClock);

  // Late-game: a trailing defense intentionally fouls to stop the clock
  if (!isFastBreak && checkIntentionalFoul(state, carrier, nearestDef.player)) {
    state.actionTimer = 1500;
    return;
  }

  // Active multi-option play takes over the carrier's decision (except in the
  // final seconds, where the buzzer/urgency logic further down takes over).
  if (state.activePlay && state.activePlay.team === carrier.team) {
    const handled = executePlayOption(state, carrier, teammates, defenders, basket, nearestDef);
    if (handled) return;
  }

  // Decide: shoot, drive, or pass
  let shootChance = 0;
  let driveChance = 0;

  if (isVeryClose) {
    // Close shots: layups, dunks, hooks
    const freqFactor = Math.min(carrier.twoAttempts / 15, 1);
    shootChance = 0.18 + carrier.insideScoring * 0.04 + freqFactor * 0.1;
    if (isFastBreak) {
      const fbTendency = TEAM_FAST_BREAK[carrier.team] || 5;
      shootChance += 0.08 + fbTendency * 0.015; // scaled by team pace tendency
    }
  } else if (isShortMid) {
    // Short mid-range (8-15 ft): pull-up jumpers and runners
    const freqFactor = Math.min(carrier.twoAttempts / 15, 1);
    shootChance = 0.12 + carrier.shooting * 0.03 + freqFactor * 0.1;
  } else if (isMidRange) {
    // Mid-range (15-22 ft): bread-and-butter of 1980s basketball
    const freqFactor = Math.min(carrier.twoAttempts / 15, 1);
    shootChance = 0.14 + carrier.shooting * 0.035 + freqFactor * 0.12;
  } else if (threeZone && carrier.threeAttempts > 0.5) {
    // 3-point attempt tendency driven by real 3PA frequency and shooting skill.
    // Non-shooters (≤0.5 3PA) almost never pull the trigger from deep.
    const freqFactor = Math.min(carrier.threeAttempts / 2, 1); // normalize ~2+ attempts to 1.0
    shootChance = 0.08 + carrier.threePoint * 0.03 + freqFactor * 0.18;
  }

  // Prevent full-court heaves in normal play — only the buzzer-beater
  // override (under 2.5s) permits shots from extreme distance.
  if (threeZone && distToBasket > 340 && state.gameClock > 3) {
    shootChance = 0;
  }

  if (isFastBreak) {
    // On a fast break the carrier drives toward the basket even from beyond
    // the arc — pulling up to reset the half-court offense wastes a transition
    // advantage. Only heavy contest stops the drive.
    if (contestLevel !== 'tight' && contestLevel !== 'smothered') {
      driveChance = 0.06 + (carrier.driveTendency || 5) * 0.04 + carrier.speed * 0.01;
    }
  } else if (!threeZone && contestLevel !== 'tight' && contestLevel !== 'smothered') {
    driveChance = 0.06 + (carrier.driveTendency || 5) * 0.04 + carrier.speed * 0.01;
  }

  // --- Role-based scoring weight: stars finish more, role players pass more.
  // Opportunity correction prevents any player from being over/under-used.
  const scoringWeight = getScoringWeight(state, carrier);
  shootChance *= scoringWeight;
  driveChance *= scoringWeight;

  // Transition advantage: attack a numbers-up break before the defense recovers.
  // Applies on fast breaks too — a wide-open lane should always be attacked.
  if (clearLane) {
    driveChance += 0.35;
    if (isVeryClose) shootChance += 0.25;
  }

  // --- Possession time gate: half-court offense consumes realistic time
  // (15-21s for normal sets) before looking to shoot. Willingness ramps from
  // ~10% at possession start to 100% at the target duration. Fast breaks and
  // late-clock urgency bypass this. Uses the shot clock as the elapsed proxy —
  // it resets to 24 on possession change, offensive rebound, and non-shooting
  // fouls, so the ramp correctly restarts for each new action.
  if (!isFastBreak && !attackNow && state.shotClock > 6 && state.gameClock > 8) {
    const minTime = state.possessionTargetDuration || 16;
    const elapsed = 24 - state.shotClock;
    if (elapsed < minTime) {
      const readiness = clamp(elapsed / minTime, 0, 1);
      const gate = 0.03 + readiness * 0.97; // 0.03 → 1.0 (strong early-shot suppression)
      shootChance *= gate;
      driveChance *= gate;
    }
  }

  // --- Shot-clock patience: in the half court the CPU defers contested looks
  // and hunts a better shot, only bailing out as the clock expires ---
  if (!isFastBreak && !attackNow) {
    shootChance *= getPatienceFactor(contestLevel, effectiveClock);
    if (effectiveClock < 6) {
      // Late-clock urgency ramps up so the offense always gets a shot off
      const urgency = (6 - effectiveClock) / 6;
      shootChance += 0.35 * urgency;
      driveChance += 0.25 * urgency;
    }
  }

  // Coach's drawn-up play — tactical nudge for this possession
  if (state.playCall && state.playCall.team === carrier.team) {
    const pc = state.playCall.type;
    if (pc === 'isolation') {
      driveChance += 0.10;
      if (isMidRange || isShortMid) shootChance += 0.10;
      if (isVeryClose) shootChance += 0.06;
    } else if (pc === 'post_up') {
      if (isVeryClose) shootChance += 0.14;
      else if (isShortMid) shootChance += 0.06;
      if (threeZone) shootChance *= 0.4;
    } else if (pc === 'three_point') {
      if (threeZone && carrier.threeAttempts > 0.3) shootChance += 0.15;
      if (isVeryClose) shootChance -= 0.04;
    }
  }

  // --- Possession-finishing deadline ---
  // The target time is a soft deadline, not just an early-shot suppressor.
  // Once elapsed reaches the target, the offense must attempt to finish
  // (shoot or drive) rather than throwing another pass.
  if (!isFastBreak) {
    const elapsed = 24 - state.shotClock;
    const targetTime = state.possessionTargetDuration || 14;

    if (elapsed >= targetTime) {
      const secondsOverTarget = elapsed - targetTime;
      const urgency = clamp(secondsOverTarget / 3, 0, 1);

      // At the target: ≥72% shot-or-drive. Three seconds late: ≥95%.
      const minimumFinishChance = 0.72 + urgency * 0.23;
      const currentFinishChance = shootChance + driveChance;

      if (currentFinishChance < minimumFinishChance) {
        const needed = minimumFinishChance - currentFinishChance;

        let shotShare;
        switch (contestLevel) {
          case 'wide_open':
            shotShare = 0.82;
            break;
          case 'open':
            shotShare = 0.72;
            break;
          case 'light_contest':
            shotShare = 0.60;
            break;
          case 'tight':
            shotShare = 0.42;
            break;
          default:
            // Smothered: prefer attacking or creating movement.
            shotShare = 0.25;
            break;
        }

        shootChance += needed * shotShare;
        driveChance += needed * (1 - shotShare);
      }
    }
  }

  // --- Buzzer-beater: never let the quarter end holding the ball ---
  if (state.gameClock < 8 && !isFastBreak) {
    const gameUrgency = clamp((8 - state.gameClock) / 8, 0, 1);
    shootChance += 0.40 * gameUrgency;
    driveChance += 0.30 * gameUrgency;
  }
  if (state.gameClock < 2.5) {
    // Heave it — with under 2.5s, no more passing
    shootChance = Math.max(shootChance, 0.92);
  }

  const roll = Math.random();

  if (roll < shootChance) {
    // Foul detection: contested shots can draw fouls, weighted by FTA rate
    const foulChance = nearestDef.dist < 25 ? Math.min(0.08 + carrier.ftAttempts * 0.015, 0.28) : 0;
    const fouledBy = (foulChance > 0 && Math.random() < foulChance && !nearestDef.player.fouledOut) ? nearestDef.player : null;
    takeShot(state, carrier, isOpen, fouledBy, nearestDef);
    state.actionTimer = 1500;
  } else if (roll < shootChance + driveChance) {
    // Drive to basket — fouls are resolved before the drive resolves
    const fouled = checkDriveFoul(state, carrier, nearestDef, defenders, isFastBreak);
    if (!fouled) {
      decideHelpCommit(state, carrier, nearestDef.player, defenders, distToBasket);
      carrier.targetX = lerp(carrier.x, basket.x, 0.5);
      carrier.targetY = lerp(carrier.y, basket.y, 0.5);
      state.actionTimer = randomInRange(400, 800);
    }
  } else {
    // Pass to open teammate
    const passTarget = findBestPassTarget(state, carrier, teammates, defenders, basket);
    if (passTarget) {
      makePass(state, carrier, passTarget);
    }
    const elapsed = 24 - state.shotClock;
    const targetTime = state.possessionTargetDuration || 14;

    if (elapsed >= targetTime) {
      state.passTimer = randomInRange(700, 1300);
    } else {
      state.passTimer = randomInRange(1300, 2200);
    }
  }
}

function findBestPassTarget(state, carrier, teammates, defenders, basket) {
  let best = null;
  let bestScore = -Infinity;

  teammates.forEach(t => {
    if (t.id === carrier.id) return;

    // Find nearest defender to this teammate
    let nearestDef = Infinity;
    defenders.forEach(d => {
      const dd = dist(t, d);
      if (dd < nearestDef) nearestDef = dd;
    });

    const openness = nearestDef;
    const distBasket = dist(t, basket);
    const passingSkill = carrier.passing;

    // Role-based touch weight: bias passes toward high-initiation players
    // (Magic controls, Bird receives, Worthy/Scott get touches).
    const starW = getTouchWeight(state, t, openness);

    // Score: openness * role weight dominates; mild proximity preference
    let score = openness * 2.5 * starW - distBasket * 0.15 + passingSkill * 5;

    // Help commitment opens up the helper's man for a kick-out
    if (state.helpCommitment && state.helpCommitment.openManId === t.id) score += 60;

    if (t.isCutting) score += 40; // cutters are high priority

    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  });

  return best;
}

function makePass(state, passer, receiver) {
  // Ensure only one player has the ball at a time
  state.players.forEach(player => { player.hasBall = false; });

  state.ball.carrier = null;
  state.ball.inFlight = true;
  state.ball.isShot = false;

  // Store the exact intended receiver by player ID — no coordinate guessing
  state.ball.passTargetId = receiver.id;
  state.ball.passerId = passer.id;

  state.ball.startX = passer.x;
  state.ball.startY = passer.y;
  state.ball.targetX = receiver.x;
  state.ball.targetY = receiver.y;

  // Simulation-time tracking (respects game speed); minimum 180ms flight
  state.ball.flightElapsed = 0;
  const d = dist(passer, receiver);
  state.ball.flightDuration = Math.max(180, (d / PASS_SPEED) * 16.67);

  // Magic's special long passes get the magical trail effect + no-look label
  state.ball.isMagicPass = passer.name === 'Magic Johnson' && d > 180;
  state.ball.isNoLookPass = state.ball.isMagicPass && Math.random() < 0.5;
  state.ball.isSkyhook = false;
  state.ball.isBirdThree = false;
  state.ball.isDunk = false;
  state.ball.isDreamShake = false;
  state.ball.isZekeSplit = false;
  state.ball.isPumpFake = false;
  state.ball.lastPasserId = passer.id;
  recordCelticsPass(state, receiver);

  state.gameLog.unshift(`${passer.name} passes to ${receiver.name}`);
  if (state.gameLog.length > 15) state.gameLog.pop();
}

// Signature-move decision trees (Dream Shake, Zeke Split, Pump-Fake Parade)
// and Microwave Mode tracking live in signatureMoves.js.

function takeShot(state, shooter, isOpen, fouledBy, nearestDef, options = {}) {
  // A drawn-up play is consumed once the shot goes up
  if (state.playCall) state.playCall = null;
  // Defensive play calls survive the shot so Crash Boards still affects the rebound
  if (state.userPlayCall && state.userPlayCall.side === 'offense') state.userPlayCall = null;
  // A shot ends any active offensive play
  clearActivePlay(state);
  const basket = getBasketPos(state.attackingRight);
  shooter.hasBall = false;
  state.ball.carrier = null;
  state.ball.inFlight = true;
  state.ball.isShot = true;
  state.ball.passTargetId = null;
  state.ball.passerId = null;
  state.ball.flightElapsed = 0;
  state.ball.startX = shooter.x;
  state.ball.startY = shooter.y;
  state.ball.targetX = basket.x;
  state.ball.targetY = basket.y;
  state.ball.flightStart = Date.now();
  state.ball.flightDuration = SHOT_ARC_DURATION;
  state.ball.shotArcPeak = 40 + dist(shooter, basket) * 0.15;
  // Mark shots launched near the buzzer as period-ending — they resolve but
  // do NOT trigger a rebound or new possession (fixes the heave → fast-break bug).
  state.ball.isPeriodEndingShot = state.gameClock < 3.0;

  state.ball.isMagicPass = false;
  state.ball.isDreamShake = false;
  state.ball.isZekeSplit = false;
  state.ball.isPumpFake = false;

  // Calculate make probability
  const d = dist(shooter, basket);
  const threePtr = isThreePointer(shooter.x, shooter.y, state.attackingRight);
  // Bird's signature deep three — triggers the downtown burst
  state.ball.isBirdThree = shooter.name === 'Larry Bird' && threePtr;
  const defenseTeam = state.possession === state.teamKeys.team1 ? state.teamKeys.team2 : state.teamKeys.team1;
  const shotDefensePlayers = getOnCourtPlayers(state, defenseTeam);
  const isFb = !!(state.fastBreak && state.fastBreak.active);
  let { level: contestLevel, helpDef: shotHelpDef } = evaluateContest(state, shooter, nearestDef, shotDefensePlayers, d, isFb);

  // --- Dream Shake: Akeem's signature post-move decision tree ---
  // Improves shot quality by 1-2 contest levels (defender bites on fakes/spins),
  // then boosts foul-drawing and slightly raises block risk below.
  const dreamShake = checkDreamShake(shooter, d, nearestDef, isFb);
  if (dreamShake) {
    contestLevel = improveContestLevel(contestLevel, dreamShake.contestBoost);
    state.ball.isDreamShake = true;
    state.ball.dreamShakeVariant = dreamShake.variant;
  }

  // --- Zeke Split: Isiah's signature perimeter split move ---
  const zekeSplit = checkZekeSplit(shooter, d, nearestDef, isFb, state.shotClock);
  if (zekeSplit) {
    contestLevel = improveContestLevel(contestLevel, zekeSplit.contestBoost);
    state.ball.isZekeSplit = true;
    state.ball.zekeSplitVariant = zekeSplit.variant;
  }

  // --- Pump-Fake Parade: Dantley's signature foul-drawing post package ---
  const pumpFake = checkPumpFakeParade(shooter, d, nearestDef, isFb);
  if (pumpFake) {
    contestLevel = improveContestLevel(contestLevel, pumpFake.contestBoost);
    state.ball.isPumpFake = true;
    state.ball.pumpFakeVariant = pumpFake.variant;
  }

  // --- Shot variation: pick a descriptive shot type from the player's package ---
  let sigVariant = null, sigFamily = 'dream';
  if (dreamShake) { sigVariant = dreamShake.variant; sigFamily = 'dream'; }
  else if (zekeSplit) { sigVariant = zekeSplit.variant; sigFamily = 'zeke'; }
  else if (pumpFake) { sigVariant = pumpFake.variant; sigFamily = 'pumpfake'; }
  const variation = selectShotVariation(shooter, {
    distToBasket: d, isThree: threePtr, isFastBreak: isFb,
    isPutback: !!(options && options.isPutback), shotClock: state.shotClock, gameClock: state.gameClock,
  }, sigVariant, sigFamily);

  // Signature move visual flags
  state.ball.isSkyhook = variation.isKareemSignature || variation.isMagicSignature;
  if (state.ball.isSkyhook) state.ball.shotArcPeak += 25;

  let prob;

  if (d < 60) {
    // Rim shots: contest matters most here — an uncontested layup/dunk is
    // nearly automatic, while a rim protector can drastically cut the odds.
    const realPct = shooter.twoPct || 0.45;
    const insideAdj = (shooter.insideScoring - 6) * 0.03;
    prob = realPct + insideAdj + CONTEST_MOD.rim[contestLevel];
    if (state.fastBreak && state.fastBreak.active) {
      // Scoring boost after a defensive stop, scaled by team pace tendency
      // Lakers (9): +0.186, Clippers (7): +0.158, Celtics (4): +0.116
      const fbTendency = TEAM_FAST_BREAK[shooter.team] || 5;
      prob += 0.06 + fbTendency * 0.014;
    }
    prob = clamp(prob, 0.05, 0.97);
  } else if (threePtr) {
    // 3-pointers: real 3P% blended with skill, then contest modifier
    const realPct = shooter.threePct || 0;
    const skillAdj = (shooter.threePoint - 5) * 0.02; // +/- relative to average skill
    prob = realPct + skillAdj + CONTEST_MOD.three[contestLevel];
    prob = clamp(prob, 0.03, 0.55);
    // Beyond-the-arc heaves degrade sharply with distance — a full-court
    // shot should have near-zero probability, not the same as a corner three.
    if (d > 260) {
      const excessDist = d - 237;
      const distPenalty = Math.min(excessDist / 250, 0.98);
      prob *= (1 - distPenalty);
    }
  } else {
    // Mid-range 2s: real 2P% blended with shooting skill, distance, and contest
    const realPct = shooter.twoPct || 0.45;
    const skillAdj = (shooter.shooting - 6) * 0.02;
    const distAdj = d < 120 ? 0.06 : (d > 180 ? -0.04 : 0);
    prob = realPct + skillAdj + distAdj + CONTEST_MOD.mid[contestLevel];
    prob = clamp(prob, 0.05, 0.6);
  }

  // Fatigue reduces shooting accuracy (up to ~18% drop when exhausted)
  const fatigueFactor = 1 - (shooter.fatigue || 0) / 100 * 0.18;
  prob *= fatigueFactor;
  prob += variation.probMod;

  // Block detection: enhanced — interior defenders + help-side blockers
  let blockedBy = null;
  const helpCommitted = !!(state.helpCommitment);
  if (!fouledBy) {
    let blockChance = computeBlockChance(d, threePtr, nearestDef && nearestDef.player, shotHelpDef, helpCommitted) + variation.blockChanceMod;
    // Dream Shake: extra pivots and ball exposure slightly raise strip risk
    if (dreamShake) blockChance += 0.04;
    if (Math.random() < blockChance) {
      blockedBy = (nearestDef && nearestDef.player) || shotHelpDef;
    }
  }

  // Dream Shake foul boost — defender bites on a fake and makes contact
  if (dreamShake && !fouledBy && !blockedBy && nearestDef && nearestDef.player && !nearestDef.player.fouledOut) {
    const dsFoulChance = dreamShake.defenderBit ? 0.28 : 0.14;
    if (Math.random() < dsFoulChance) {
      fouledBy = nearestDef.player;
    }
  }
  // Zeke Split foul boost — Isiah draws contact splitting the defense
  if (zekeSplit && !fouledBy && !blockedBy && nearestDef && nearestDef.player && !nearestDef.player.fouledOut) {
    const zsFoulChance = zekeSplit.defenderBit ? 0.22 : 0.12;
    if (Math.random() < zsFoulChance) {
      fouledBy = nearestDef.player;
    }
  }
  // Pump-Fake Parade foul boost — Dantley's signature foul-drawing package
  if (pumpFake && !fouledBy && !blockedBy && nearestDef && nearestDef.player && !nearestDef.player.fouledOut) {
    const pfFoulChance = pumpFake.defenderBit ? 0.38 : 0.22;
    if (Math.random() < pfFoulChance) {
      fouledBy = nearestDef.player;
    }
  }

  // Dunk detection: determined by the shot variation's family (DUNK zone only)
  const isDunk = variation.family === 'DUNK' && d < 65 && !threePtr && !blockedBy;
  state.ball.isDunk = isDunk;
  if (isDunk) {
    state.ball.flightDuration = 350;
    state.ball.shotArcPeak = 5;
    prob = Math.max(prob, DUNK_FLOOR[contestLevel]);
  }

  state.ball.shotResult = {
    made: blockedBy ? false : Math.random() < prob,
    shooter: shooter,
    points: threePtr ? 3 : 2,
    type: isDunk ? 'dunk' : (d < 60 ? 'layup' : (threePtr ? 'three' : 'mid-range')),
    fouledBy: fouledBy || null,
    blockedBy: blockedBy || null,
    holdTime: state.ball.carrierHoldTime || 0,
    shotVariation: variation,
  };
  state.ball.carrierHoldTime = 0;

  state.shotAnimating = true;
  state.fastBreak = null; // shot ends the fast break
  state.helpCommitment = null; // shot resolves any help commitment
  state.pendingTurnover = null; // shot voids the pre-determined turnover
}

// Increment a player's personal foul + the team foul; disqualify at 6
function commitPersonalFoul(state, player) {
  player.fouls = (player.fouls || 0) + 1;
  applyTeamFoul(state, player.team);
  let fouledOut = false;
  if (player.fouls >= 6) {
    player.fouledOut = true;
    fouledOut = true;
    if (player.onCourt) forceSubstitution(state, player);
  }
  return fouledOut;
}

// Force a substitution when a player fouls out (ignores fatigue gate)
function forceSubstitution(state, outgoing) {
  if (!outgoing.onCourt) return;
  const bench = state.players.filter(p => p.team === outgoing.team && !p.onCourt && !p.fouledOut);
  if (bench.length === 0) return;
  let sub = bench[0];
  bench.forEach(b => { if (b.fatigue < sub.fatigue) sub = b; });
  executeSubstitution(state, outgoing, sub, 'foulout');
  state.gameLog.unshift(`📤 ${outgoing.name} fouls out — ${sub.name} checks in.`);
  if (state.gameLog.length > 15) state.gameLog.pop();
}

// Send a shooter to the line for a standalone (non-shooting) foul.
// Positions all ten players into NBA free-throw lane alignment.
function setupFreeThrows(state, shooter, fouledBy, ftCount, fouledOut) {
  clearActivePlay(state);
  state.ftState = {
    shooter: shooter,
    fouledBy: fouledBy,
    ftCount: ftCount,
    ftsMade: 0,
    currentFT: 0,
    timer: 800,
    team: shooter.team,
    madeShot: false,
    fouledOut: fouledOut,
    phase: 'setup',
  };
  setupFreeThrowAlignment(state, shooter);
}

// Late-game intentional foul: a trailing defense fouls the carrier to stop the clock
function checkIntentionalFoul(state, carrier, nearestDefPlayer) {
  const intent = intentionalFoulIntent(state, carrier);
  if (!intent) return false;
  const fouler = nearestDefPlayer;
  if (!fouler || fouler.fouledOut) return false;
  const fouledOut = commitPersonalFoul(state, fouler);
  // Intentional late-game foul → two free throws for the ball carrier
  setupFreeThrows(state, carrier, fouler, 2, fouledOut);
  state.shotResultDisplay = `Intentional foul! ${carrier.name} to the line`;
  state.gameLog.unshift(`🎯 Intentional foul on ${fouler.name} (${fouler.fouls}) — ${carrier.name} shoots two!`);
  state.shotResultTimer = 1500;
  if (state.gameLog.length > 15) state.gameLog.pop();
  return true;
}

// Drive foul check — returns true if a defensive or offensive foul occurred
function checkDriveFoul(state, carrier, nearestDef, defenders, isFastBreak) {
  const nearest = nearestDef.player;
  if (!nearest || nearest.fouledOut) return false;
  if (nearestDef.dist > 28) return false;

  // Base drive foul chance (driving layup ~13-22%, lower on the break)
  let baseFoulChance = isFastBreak ? 0.10 : 0.17;
  if (nearestDef.dist < 18) baseFoulChance += 0.06; // heavy contact

  const foulChance = baseFoulChance
    * foulDrawMult(carrier)
    * defenderDisciplineMult(nearest)
    * fatigueFoulMult(nearest.fatigue || 0);

  if (Math.random() >= foulChance) return false;

  // ~15% of drive fouls are offensive (charges)
  if (Math.random() < 0.15) {
    carrier.hasBall = false;
    state.ball.carrier = null;
    const fouledOut = commitPersonalFoul(state, carrier);
    rollTrashTalk(state, nearest, 'charge_drawn');
    state.shotResultDisplay = `Charge on ${carrier.name}!`;
    state.gameLog.unshift(`🦵 Offensive foul on ${carrier.name} (${carrier.fouls})! Turnover.`);
    if (state.gameLog.length > 15) state.gameLog.pop();
    state.shotResultTimer = 1500;
    switchPossession(state, null, 'recorded_turnover');
    state.actionTimer = 1200;
    return true;
  }

  // Defensive foul — usually the primary defender, sometimes help/rim protector
  const fouler = pickFoulingDefender(defenders, carrier, nearest);
  if (!fouler || fouler.fouledOut) return false;
  const fouledOut = commitPersonalFoul(state, fouler);

  if (isInPenalty(state, fouler.team)) {
    // Penalty → two free throws
    setupFreeThrows(state, carrier, fouler, 2, fouledOut);
    state.shotResultDisplay = `Shooting foul! ${carrier.name} to the line`;
    state.gameLog.unshift(`🦵 Foul on ${fouler.name} (${fouler.fouls}) — ${carrier.name} shoots two!`);
    state.actionTimer = 1500;
  } else {
    // Non-penalty → offense inbounds and keeps possession
    state.shotClock = 24;
    state.turnoverCooldown = 1200;
    state.shotResultDisplay = `Foul on ${fouler.name}`;
    state.gameLog.unshift(`🦵 Foul on ${fouler.name} (${fouler.fouls}) — ${carrier.team} keeps the ball.`);
    state.actionTimer = 800;
  }
  state.shotResultTimer = 1500;
  if (state.gameLog.length > 15) state.gameLog.pop();
  return true;
}

// Rebound a missed final free throw — lane position dominates the weighted pick.
// Low-block defenders get the first crack; perimeter players react too late.
function resolveFreeThrowRebound(state, ft) {
  const shooter = ft.shooter;

  // Weighted selection across all on-court players
  const candidates = state.players.filter(p => p.onCourt).map(p => {
    const isOffensive = p.team === shooter.team;
    let weight = getFTReboundWeight(p, shooter, isOffensive);
    weight *= (0.5 + Math.random()); // randomness — great rebounders don't get every board
    return { player: p, weight, isOffensive };
  });

  const total = candidates.reduce((s, c) => s + c.weight, 0);
  let rebounder = null;
  if (total > 0) {
    let roll = Math.random() * total;
    for (const c of candidates) {
      roll -= c.weight;
      if (roll <= 0) { rebounder = c.player; break; }
    }
  }
  if (!rebounder) rebounder = candidates[0]?.player;

  if (!rebounder) {
    endFreeThrowState(state);
    switchPossession(state, null, 'dead_ball');
    return;
  }

  const isOffensive = rebounder.team === shooter.team;
  rebounder.stats.rebounds++;
  if (isOffensive) rebounder.stats.offReb++; else rebounder.stats.defReb++;
  state.momentum[rebounder.team] += isOffensive ? 1 : 0.5;
  state.ball.carrier = rebounder.id;
  rebounder.hasBall = true;
  state.ball.x = rebounder.x;
  state.ball.y = rebounder.y;
  state.ball.lastPasserId = null;
  state.ball.carrierHoldTime = 0;
  state.gameLog.unshift(`↑ ${rebounder.name} ${isOffensive ? 'offensive' : 'defensive'} rebound (FT miss)`);
  if (state.gameLog.length > 15) state.gameLog.pop();

  endFreeThrowState(state);

  if (isOffensive) {
    // Offensive rebound — fresh shot clock, resume offense
    state.shotClock = 24;
    state.actionTimer = 500;
    rollPossessionTurnover(state);
  } else {
    // Defensive rebound — transition to other team
    switchPossession(state, rebounder, 'defensive_rebound');
  }
}

// Trash talk is personality-driven — see personalityEngine.rollTrashTalk.
// Decoupled from special moves: a player can have a signature and not talk
// (Dumars), or be a primary agitator without a scoring special (Mahorn).

function resolveShot(state) {
  const result = state.ball.shotResult;
  if (!result) return;

  state.shotAnimating = false;
  let pendingPutback = null;

  if (result.fouledBy) {
    resolveFouledShot(state, result);
    state.ball.shotResult = null;
    return;
  }

  if (result.blockedBy) {
    result.shooter.stats.fga++;
    result.blockedBy.stats.blocks++;
    state.momentum[result.blockedBy.team] += 2;
    rollTrashTalk(state, result.blockedBy, 'blocked_shot');
    state.ball.lastPasserId = null; // a block voids the potential assist
    const blockOutcome = resolveBlockOutcome(state, result.blockedBy);
    if (blockOutcome.outcome === 'defense_recover') {
      state.ball.carrier = result.blockedBy.id;
      result.blockedBy.hasBall = true;
      state.ball.x = result.blockedBy.x;
      state.ball.y = result.blockedBy.y;
      state.shotResultDisplay = `${result.blockedBy.name} blocks ${result.shooter.name}!`;
      state.gameLog.unshift(`🚫 ${result.blockedBy.name} BLOCKS ${result.shooter.name}!`);
      switchPossession(state, result.blockedBy, 'block');
    } else if (blockOutcome.outcome === 'out_of_bounds') {
      state.shotResultDisplay = `${result.blockedBy.name} blocks it out of bounds!`;
      state.gameLog.unshift(`🚫 ${result.blockedBy.name} blocks ${result.shooter.name} — out of bounds! ${result.shooter.team} keeps it.`);
      inboundToTeam(state, result.shooter.team, 'block_out_of_bounds', true);
    } else {
      // Loose ball — nearest on-court player recovers (scramble or offense recover)
      let nearest = null, nd = Infinity;
      state.players.forEach(p => {
        if (!p.onCourt) return;
        const dd = dist(p, state.ball);
        if (dd < nd) { nd = dd; nearest = p; }
      });
      state.shotResultDisplay = `${result.blockedBy.name} blocks ${result.shooter.name}! Loose ball!`;
      state.gameLog.unshift(`🚫 ${result.blockedBy.name} BLOCKS ${result.shooter.name} — loose ball!`);
      if (nearest) {
        state.ball.carrier = nearest.id;
        nearest.hasBall = true;
        state.ball.x = nearest.x;
        state.ball.y = nearest.y;
        if (nearest.team !== state.possession) switchPossession(state, nearest, 'block');
      }
    }
    state.shotResultTimer = 1500;
    if (state.gameLog.length > 15) state.gameLog.pop();
    state.ball.shotResult = null;
    return;
  }

  if (result.made) {
    state.score[result.shooter.team] += result.points;
    state.momentum[result.shooter.team] += result.type === 'dunk' ? 2 : 1;
    result.shooter.stats.fgm++;
    result.shooter.stats.fga++;
    result.shooter.stats.points += result.points;
    const varData = result.shotVariation;
    const isSigScore = !!(varData && (varData.isKareemSignature || varData.isMagicSignature))
      || state.ball.isDreamShake || state.ball.isZekeSplit
      || (result.shooter.name === 'Larry Bird' && result.type === 'three');
    if (isSigScore) rollTrashTalk(state, result.shooter, 'signature_score');
    else if (result.type === 'dunk') rollTrashTalk(state, result.shooter, 'poster_dunk');
    else if (result.type === 'three') rollTrashTalk(state, result.shooter, 'big_shot');
    if (state.ball.lastPasserId) {
      const passer = state.players.find(p => p.id === state.ball.lastPasserId);
      if (passer && passer.team === result.shooter.team && passer.id !== result.shooter.id
          && shouldAwardAssist(result.holdTime || 0, result.type)) {
        passer.stats.assists++;
        rollTrashTalk(state, passer, 'signature_score');
      }
    }
    state.ball.lastPasserId = null;
    if (varData && varData.family === 'DUNK' && Math.random() < 0.35) {
      const phrase = DUNK_PHRASES[Math.floor(Math.random() * DUNK_PHRASES.length)];
      state.shotResultDisplay = `💥 ${result.shooter.name} ${phrase.display}`;
    } else if (state.ball.isZekeSplit) {
      state.shotResultDisplay = `⚡ ${result.shooter.name} ZEKE SPLIT!`;
    } else if (state.ball.isPumpFake) {
      state.shotResultDisplay = `🎭 ${result.shooter.name} PUMP-FAKE PARADE!`;
    } else if (state.ball.isDreamShake) {
      state.shotResultDisplay = `✨ ${result.shooter.name} DREAM SHAKE — ${varData ? varData.make : 'scores'}!`;
    } else {
      state.shotResultDisplay = `${result.shooter.name} ${varData ? varData.make : 'scores'}!`;
    }
    state.gameLog.unshift(`${varData && varData.family === 'DUNK' ? '💥' : '✓'} ${result.shooter.name} ${varData ? varData.log : 'scores'} — ${result.points} pts`);
  } else {
    result.shooter.stats.fga++;
    state.momentum[result.shooter.team] -= 0.5;
    const varData = result.shotVariation;
    state.shotResultDisplay = `${result.shooter.name} misses the ${varData ? varData.miss : 'shot'}`;
    state.gameLog.unshift(`✗ ${result.shooter.name} misses the ${varData ? varData.miss : 'shot'}`);
  }
  state.shotResultTimer = 1500;

  // Microwave Mode: track Vinnie's makes/misses for the heating-up trait
  const mwWasActive = !!(state.microwaveMode && state.microwaveMode.active);
  updateMicrowaveMode(state, result.shooter, result.made);
  if (!mwWasActive && state.microwaveMode && state.microwaveMode.active) {
    rollTrashTalk(state, result.shooter, 'microwave_activate');
  }

  if (state.gameLog.length > 15) state.gameLog.pop();

  // Reset possession — but if this was a buzzer-beater (shot launched near the
  // horn or the clock has hit 0), the quarter ends here: no rebound, no new
  // possession, no fast break. This closes the heave → fast-break loophole.
  if (state.ball.isPeriodEndingShot || state.gameClock <= 0) {
    state.ball.shotResult = null;
    state.ball.isPeriodEndingShot = false;
    validatePaceAtPeriodEnd(state);
    if (state.quarter < 4) {
      state.quarterBreak = { awaitingInput: true };
    } else {
      state.isPaused = true;
    }
    return;
  }
  if (result.made) {
    switchPossession(state, null, 'made_basket');
  } else {
    // --- Two-stage rebound: decide which team wins, then which player ---
    const basket = getBasketPos(state.attackingRight);
    const defenseTeam = state.possession === state.teamKeys.team1 ? state.teamKeys.team2 : state.teamKeys.team1;
    const crashBoards = getActiveDefensePlay(state, defenseTeam) === 'crash_boards';
    const offensePlayers = getOnCourtPlayers(state, state.possession);
    const defensePlayers = getOnCourtPlayers(state, defenseTeam);

    const zone = computeReboundZone(result.shooter, basket, result.type);
    const isOffensive = determineOffensiveRebound(state, result, offensePlayers, defensePlayers, crashBoards);
    const reboundTeam = isOffensive ? state.possession : defenseTeam;
    const rebounder = selectRebounder(state, result, zone, reboundTeam, isOffensive, defensePlayers);

    if (rebounder) {
      rebounder.stats.rebounds++;
      state.momentum[rebounder.team] += isOffensive ? 1 : 0.5;
      if (isOffensive) rebounder.stats.offReb++; else rebounder.stats.defReb++;
      state.ball.carrier = rebounder.id;
      rebounder.hasBall = true;
      state.ball.x = rebounder.x;
      state.ball.y = rebounder.y;
      state.ball.lastPasserId = null;
      state.ball.carrierHoldTime = 0;
      state.gameLog.unshift(`↑ ${rebounder.name} ${isOffensive ? 'offensive' : 'defensive'} rebound`);
      if (state.gameLog.length > 15) state.gameLog.pop();
      if (isOffensive) rollTrashTalk(state, rebounder, 'off_rebound_traffic');

      if (!isOffensive) {
        // Defensive rebound → transition (may trigger a fast break)
        switchPossession(state, rebounder, 'defensive_rebound');
      } else {
        // Offensive rebound → fresh shot clock, then consider an immediate putback
        state.shotClock = 24;
        let nearest = null, nd = Infinity;
        defensePlayers.forEach(def => {
          const dd = dist(rebounder, def);
          if (dd < nd) { nd = dd; nearest = def; }
        });
        if (decidePutback(rebounder, basket, nd, state.shotClock)) {
          pendingPutback = { rebounder, nearest, nd };
        } else {
          state.actionTimer = 500;
          rollPossessionTurnover(state);
        }
      }
    }
  }

  state.ball.shotResult = null;

  if (pendingPutback) {
    takeShot(state, pendingPutback.rebounder, pendingPutback.nd > 50, null, { player: pendingPutback.nearest, dist: pendingPutback.nd }, { isPutback: true });
    state.actionTimer = 1200;
  }
}

function resolveFouledShot(state, result) {
  const shooter = result.shooter;
  const fouledBy = result.fouledBy;

  // Count the personal foul on the defender (+ team foul, with DQ at 6)
  const fouledOut = commitPersonalFoul(state, fouledBy);
  // Hard foul → only enforcers/agitators intimidate (never celebratory talk
  // from a non-enforcer like Magic after committing a foul)
  if (isEnforcer(fouledBy)) rollTrashTalk(state, fouledBy, 'enforcer_foul');

  // If the shot was made (and-one), count the basket points now
  if (result.made) {
    state.score[shooter.team] += result.points;
    shooter.stats.fgm++;
    shooter.stats.fga++;
    shooter.stats.points += result.points;
    const varData = result.shotVariation;
    const isSigScore = !!(varData && (varData.isKareemSignature || varData.isMagicSignature))
      || state.ball.isDreamShake || state.ball.isZekeSplit
      || (shooter.name === 'Larry Bird' && result.type === 'three');
    if (isSigScore) rollTrashTalk(state, shooter, 'signature_score');
    else if (result.type === 'dunk') rollTrashTalk(state, shooter, 'poster_dunk');
    else if (result.type === 'three') rollTrashTalk(state, shooter, 'big_shot');
    if (state.ball.lastPasserId) {
      const passer = state.players.find(p => p.id === state.ball.lastPasserId);
      if (passer && passer.team === shooter.team && passer.id !== shooter.id
          && shouldAwardAssist(result.holdTime || 0, result.type)) {
        passer.stats.assists++;
        rollTrashTalk(state, passer, 'signature_score');
      }
    }
    state.ball.lastPasserId = null;
  }

  // Free throw count: 1 for and-one, 2 for missed 2-pt, 3 for missed 3-pt
  const ftCount = result.made ? 1 : (result.points === 3 ? 3 : 2);

  // Microwave Mode: track Vinnie's makes/misses (fouled shots count too)
  updateMicrowaveMode(state, shooter, result.made);

  // Set up free throw state — dead-ball set piece with full lane alignment
  state.ftState = {
    shooter: shooter,
    fouledBy: fouledBy,
    ftCount: ftCount,
    ftsMade: 0,
    currentFT: 0,
    timer: 800,
    team: shooter.team,
    madeShot: result.made,
    fouledOut: fouledOut,
    phase: 'setup',
  };
  setupFreeThrowAlignment(state, shooter);

  const varData = result.shotVariation;
  if (result.made) {
    state.shotResultDisplay = `${shooter.name} ${varData ? varData.make : 'scores'} + foul! AND1!`;
    state.gameLog.unshift(`✓ ${shooter.name} ${varData ? varData.log : 'basket'} + foul on ${fouledBy.name} (${fouledBy.fouls})!`);
  } else {
    state.shotResultDisplay = `Foul on ${fouledBy.name} (${fouledBy.fouls})! ${shooter.name} to the line for ${ftCount}`;
    state.gameLog.unshift(`🦵 Foul on ${fouledBy.name} (${fouledBy.fouls}) — ${shooter.name} to the line for ${ftCount}`);
  }
  if (state.gameLog.length > 15) state.gameLog.pop();
}

// Clear the FT dead-ball state and restore players to normal play
function endFreeThrowState(state) {
  state.players.forEach(p => {
    p.ftLaneSpot = null;
    p.currentAction = null;
  });
  state.ftState = null;
  state.shotResultTimer = 1200;
}

// Free-throw state machine: setup → shooting → between_shots → shooting → ...
// On the final FT: made → defense inbounds; missed → live rebound.
function updateFreeThrows(state, dt) {
  const ft = state.ftState;
  ft.timer -= dt;
  if (ft.timer > 0) return;

  // Setup phase — players settle into FT formation, then shooting begins
  if (ft.phase === 'setup') {
    ft.phase = 'shooting';
    ft.timer = 300;
    return;
  }

  // Live rebound phase — lane players crash, then rebound is resolved
  if (ft.phase === 'live_rebound') {
    resolveFreeThrowRebound(state, ft);
    return;
  }

  // Between shots — brief pause before the next FT, players hold formation
  if (ft.phase === 'between_shots') {
    ft.phase = 'shooting';
    ft.timer = 300;
    ft.shooter.hasBall = true;
    state.ball.carrier = ft.shooter.id;
    return;
  }

  // Shooting phase — resolve one free throw
  if (ft.phase === 'shooting') {
    const made = Math.random() < ft.shooter.ftPct;
    ft.shooter.stats.fta++;
    if (made) {
      state.score[ft.team] += 1;
      ft.shooter.stats.ftm++;
      ft.shooter.stats.points++;
      ft.ftsMade++;
    }
    ft.currentFT++;
    const isFinal = ft.currentFT >= ft.ftCount;

    state.shotResultDisplay = `${ft.shooter.name} ${made ? 'makes' : 'misses'} FT ${ft.currentFT}/${ft.ftCount}`;
    state.gameLog.unshift(`${made ? '✓' : '✗'} ${ft.shooter.name} ${made ? 'makes' : 'misses'} FT ${ft.ftsMade}/${ft.ftCount}`);
    if (state.gameLog.length > 15) state.gameLog.pop();

    if (!isFinal) {
      // Non-final FT — no live rebound, keep everyone in formation
      ft.phase = 'between_shots';
      ft.timer = 1200;
      ft.shooter.hasBall = true;
      state.ball.carrier = ft.shooter.id;
      return;
    }

    // Final FT
    if (made) {
      // Made → defense inbounds
      endFreeThrowState(state);
      switchPossession(state, null, 'made_free_throw');
      return;
    }

    // Missed final FT — ball is live, lane players crash
    ft.phase = 'live_rebound';
    ft.timer = 600;
    releaseLanePlayersForRebound(state);
    return;
  }
}

// --- Shared matchup pace governor ---
// Targets ~100 possessions per team over 48 minutes (1986-87 Lakers-Celtics).
// Pace is shared by both teams, so the deficit uses the game-wide average.
// Returns a POSITIVE value when the game is running too slowly.
const MATCHUP_PACE_TARGET = 100;

function getPaceDeficit(state) {
  const totalElapsed = (state.quarter - 1) * 720 + (720 - state.gameClock);
  const expectedPossessions = MATCHUP_PACE_TARGET * totalElapsed / 2880;
  const team1Possessions = state.possessionCount[state.teamKeys.team1] || 0;
  const team2Possessions = state.possessionCount[state.teamKeys.team2] || 0;
  const actualPossessions = (team1Possessions + team2Possessions) / 2;
  return expectedPossessions - actualPossessions;
}

// Validate possession count at period end — warns if pace is running too hot.
// At halftime, anything above ~58 possessions per team should trigger a warning.
function validatePaceAtPeriodEnd(state) {
  const expected = MATCHUP_PACE_TARGET * state.quarter / 4; // ~25/50/75/100
  const team1 = state.possessionCount[state.teamKeys.team1] || 0;
  const team2 = state.possessionCount[state.teamKeys.team2] || 0;
  const maxActual = Math.max(team1, team2);
  if (maxActual > expected + 8) {
    console.warn('PACE TOO HIGH AT PERIOD END', {
      quarter: state.quarter,
      expected,
      team1Possessions: team1,
      team2Possessions: team2,
      score1: state.score[state.teamKeys.team1],
      score2: state.score[state.teamKeys.team2],
    });
  }
}

// Determine possession type and target duration. Drives the time gate that
// prevents half-court offenses from shooting in the first few seconds.
// Distribution: ~20% fast break, ~32% early, ~56% normal half-court, ~12% deliberate.
function setupPossessionPacing(state, isFastBreak) {
  const deficit = getPaceDeficit(state);

  if (isFastBreak) {
    state.possessionType = 'fastbreak';
    state.possessionTargetDuration = randomInRange(4, 7);
    return;
  }

  const teamPace = TEAM_FAST_BREAK[state.possession] || 5;
  const transitionBias = (teamPace - 5) * 0.015;

  // Positive when behind pace.
  const paceUrgency = clamp(deficit / 8, -1, 1);

  const earlyProbability = clamp(
    0.32 + transitionBias + paceUrgency * 0.20,
    0.10,
    0.58
  );

  const deliberateProbability = clamp(
    0.12 - paceUrgency * 0.14,
    0.04,
    0.38
  );

  const roll = Math.random();
  let type;
  let target;

  if (roll < earlyProbability) {
    type = 'early';
    target = randomInRange(8, 12);
  } else if (roll < 1 - deliberateProbability) {
    type = 'halfcourt';
    target = randomInRange(13, 18);
  } else {
    type = 'deliberate';
    target = randomInRange(18, 23);
  }

  // Stronger correction: up to ±6 seconds. When ahead of pace (negative
  // deficit), this pushes targets longer to bleed off the surplus.
  const paceCorrection = clamp(deficit * 0.30, -6.0, 6.0);

  target -= paceCorrection;

  state.possessionType = type;
  state.possessionTargetDuration = clamp(target, 6, 24);
}

// --- Single per-possession turnover roll ---
// Replaces the old per-frame steal checks and per-pass interception checks
// that stacked up to end ~60-80% of possessions before a shot.
// One roll at possession start: ~16% chance the possession ends in a turnover.
function rollPossessionTurnover(state) {
  const carrier = state.players.find(p => p.id === state.ball.carrier);
  if (!carrier) { state.pendingTurnover = null; return; }
  const defenseTeam = state.possession === state.teamKeys.team1 ? state.teamKeys.team2 : state.teamKeys.team1;

  let chance = 0.16; // base: ~16 turnovers per 100 possessions

  // Ball-handler modifier (TOV% relative to league avg ~0.13)
  const tovRate = carrier.turnoverRate || 0.13;
  chance += (tovRate - 0.13) * 0.5;

  // Defense pressure modifier
  const tend = TEAM_DEFENSE_TENDENCIES[defenseTeam];
  if (tend) chance += (tend.stealAttemptFreq - 1.0) * 0.03;

  // Fatigue modifier
  const fat = carrier.fatigue || 0;
  if (fat > 75) chance += 0.02;
  else if (fat > 50) chance += 0.01;

  // Fast breaks have slightly fewer turnovers
  if (state.fastBreak && state.fastBreak.active) chance -= 0.03;

  chance = clamp(chance, 0.08, 0.27);

  if (Math.random() < chance) {
    const types = [
      { type: 'bad_pass',       isSteal: true,  weight: 30 },
      { type: 'stolen_pass',    isSteal: true,  weight: 22 },
      { type: 'stripped',       isSteal: true,  weight: 18 },
      { type: 'offensive_foul', isSteal: false, weight: 12 },
      { type: 'travel',         isSteal: false, weight: 8 },
      { type: 'other',          isSteal: false, weight: 4 },
    ];
    const totalW = types.reduce((s, t) => s + t.weight, 0);
    let r = Math.random() * totalW;
    let chosen = types[0];
    for (const t of types) { r -= t.weight; if (r <= 0) { chosen = t; break; } }

    // Fire before the typical shot decision (half-court gate is ~15-21s)
    const triggerElapsed = state.fastBreak && state.fastBreak.active
      ? randomInRange(3, 8)
      : randomInRange(4, 14);

    state.pendingTurnover = {
      willOccur: true,
      triggerElapsed: triggerElapsed,
      type: chosen.type,
      isSteal: chosen.isSteal,
    };
  } else {
    state.pendingTurnover = { willOccur: false };
  }
}

function executePendingTurnover(state) {
  const carrier = state.players.find(p => p.id === state.ball.carrier);
  if (!carrier) { state.pendingTurnover = null; return; }
  const defenseTeam = state.possession === state.teamKeys.team1 ? state.teamKeys.team2 : state.teamKeys.team1;
  const defPlayers = getOnCourtPlayers(state, defenseTeam);
  const type = state.pendingTurnover.type;
  const isSteal = state.pendingTurnover.isSteal;

  carrier.hasBall = false;
  state.ball.carrier = null;
  carrier.stats.turnovers++;

  if (isSteal) {
    let thief;
    if (type === 'stripped') {
      thief = getPrimaryDefender(state, carrier) || defPlayers[0];
    } else {
      thief = defPlayers.reduce((closest, d) =>
        dist(carrier, d) < dist(carrier, closest) ? d : closest, defPlayers[0]);
    }
    if (thief) {
      thief.stats.steals++;
      state.momentum[thief.team] += 2;
      state.momentum[carrier.team] -= 1;
      const verb = type === 'stripped' ? 'strips' : 'steals from';
      state.gameLog.unshift(`🏀 ${thief.name} ${verb} ${carrier.name}!`);
      rollTrashTalk(state, thief, 'steal_fastbreak');
      state.turnoverCooldown = 2000;
      switchPossession(state, thief, 'recorded_turnover');
    } else {
      state.gameLog.unshift(`✗ Turnover by ${carrier.name}`);
      state.turnoverCooldown = 2000;
      switchPossession(state, null, 'recorded_turnover');
    }
  } else {
    const desc = type === 'offensive_foul' ? 'Charge on' : (type === 'travel' ? 'Traveling on' : 'Turnover by');
    state.gameLog.unshift(`✗ ${desc} ${carrier.name}!`);
    state.turnoverCooldown = 2000;
    switchPossession(state, null, 'recorded_turnover');
  }

  if (state.gameLog.length > 15) state.gameLog.pop();
}

// Restart play with an inbound after a dead ball (block/deflection out of bounds).
// The retaining team inbounds to a guard — no one stands around ball-less until
// a shot-clock violation drifts the game into a stall.
function inboundToTeam(state, team, reason = 'out_of_bounds', resetShotClock = true) {
  clearActivePlay(state);
  state.ball.inFlight = false; state.ball.isShot = false;
  state.ball.shotResult = null; state.shotAnimating = false;
  state.players.forEach(p => { p.hasBall = false; });
  if (state.possession !== team) switchPossession(state, null, reason);
  state.possession = team;
  const onCourt = getOnCourtPlayers(state, team);
  const inbounder = onCourt.find(p => p.position === 'PG') || onCourt.find(p => p.passing >= 7) || onCourt[0];
  if (!inbounder) { console.error('No inbounder found for out-of-bounds restart', { team, reason }); return; }
  inbounder.hasBall = true; state.ball.carrier = inbounder.id;
  state.ball.x = state.attackingRight ? 90 : COURT.width - 90;
  state.ball.y = COURT.height / 2;
  inbounder.x = state.ball.x; inbounder.y = state.ball.y;
  inbounder.targetX = inbounder.x; inbounder.targetY = inbounder.y;
  state.ball.lastPasserId = null; state.ball.carrierHoldTime = 0;
  if (resetShotClock) state.shotClock = 24;
  state.actionTimer = 800; state.turnoverCooldown = 1200;
  state.gameLog.unshift(`↻ ${team} inbounds after ${reason.replaceAll('_', ' ')}`);
  if (state.gameLog.length > 15) state.gameLog.pop();
}

function switchPossession(state, fastBreakInitiator = null, reason = 'unknown') {
  clearActivePlay(state);
  if (reason === 'unknown') {
    console.error('Possession switched without a recorded reason');
  }
  if (reason === 'out_of_bounds' || reason === 'block_out_of_bounds' || reason === 'deflection_out_of_bounds') {
    console.error('Do not use switchPossession directly for out-of-bounds. Use inboundToTeam().');
  }
  state.lastPossessionEndReason = reason;
  finalizeCelticsPossession(state);
  state.possession = state.possession === state.teamKeys.team1 ? state.teamKeys.team2 : state.teamKeys.team1;
  state.attackingRight = state.possession === state.teamKeys.team1;
  state.shotClock = 24;
  state.turnoverCooldown = 1000;
  state.userPlayCall = null;
  state.screenState = null;
  state.ball.lastPasserId = null;
  state.ball.carrierHoldTime = 0;
  state.players.forEach(p => { p.isSettingScreen = false; });
  state.helpCommitment = null;
  recomputeMatchups(state);

  // Count the new possession. Offensive rebounds do NOT reach here — they
  // extend the same possession per the correct NBA possession definition.
  state.possessionCount[state.possession] = (state.possessionCount[state.possession] || 0) + 1;
  tickMicrowaveMode(state);

  // Fast break check: ~20% of possessions are transition (Lakers slightly more,
  // Celtics slightly less). Was far too high before (Lakers 90%, Celtics 40%).
  const tendency = TEAM_FAST_BREAK[state.possession] || 5;
  const initiator = fastBreakInitiator || state.players.find(p => p.id === state.ball.carrier);
  // Pace-aware: behind pace (positive deficit) → more transition; ahead → fewer
  const paceUrgency = clamp(getPaceDeficit(state) / 8, -1, 1);
  const fastBreakChance = state.gameClock <= 0 ? 0 : clamp(0.18 + (tendency - 5) * 0.012 + paceUrgency * 0.10, 0.05, 0.35);

  if (initiator && initiator.team === state.possession && Math.random() < fastBreakChance) {
    // Outlet to the transition controller (Magic) when he didn't get the board
    const controller = getTransitionController(state, state.possession);
    const handler = (controller && controller.id !== initiator.id) ? controller : initiator;
    state.fastBreak = { active: true, timer: 3500, initiator: handler.id };
    state.momentum[initiator.team] += 2;
    state.pace = 9;
    state.ball.carrier = handler.id;
    handler.hasBall = true;
    state.ball.x = handler.x;
    state.ball.y = handler.y;
    state.ball.inFlight = false;
    state.ball.isShot = false;
    state.actionTimer = 0;
    state.passTimer = 0;
    setupPossessionPacing(state, true);
    state.gameLog.unshift(`⚡ ${handler.name} leads the fast break!`);
    if (state.gameLog.length > 15) state.gameLog.pop();
  } else {
    resetPositions(state);
    // Bring the ball up + initial set: consumes 1.5-2.5s before the first decision
    state.actionTimer = randomInRange(1500, 2500);
    state.passTimer = 0;
    setupPossessionPacing(state, false);
  }
  rollPossessionTurnover(state);
}

// End of an intermission — advance to the next quarter (called when user hits Continue)
export function advanceToNextQuarter(state) {
  state.quarter++;
  state.gameClock = 720;
  state.shotClock = 24;
  // Alternate possession each quarter
  state.possession = state.possession === state.teamKeys.team1 ? state.teamKeys.team2 : state.teamKeys.team1;
  state.attackingRight = state.possession === state.teamKeys.team1;
  // Team fouls reset each quarter (penalty is per-quarter)
  state.teamFouls[state.teamKeys.team1] = 0;
  state.teamFouls[state.teamKeys.team2] = 0;
  state.quarterBreak = null;
  state.fastBreak = null;
  state.possessionCount[state.possession] = (state.possessionCount[state.possession] || 0) + 1;
  state.actionTimer = randomInRange(1500, 2500);
  state.passTimer = 0;
  setupPossessionPacing(state, false);
  recomputeMatchups(state);
  resetPositions(state);
  rollPossessionTurnover(state);
}

export function resetPositions(state) {
  const offSpots = getOffenseSpots(state.attackingRight);
  const offPlayers = getOnCourtPlayers(state, state.possession);
  const defPlayers = getOnCourtPlayers(state, state.possession === state.teamKeys.team1 ? state.teamKeys.team2 : state.teamKeys.team1);

  offPlayers.forEach((p, i) => {
    const spot = offSpots[i % offSpots.length];
    p.targetX = spot.x + randomInRange(-15, 15);
    p.targetY = clamp(spot.y + randomInRange(-15, 15), 40, COURT.height - 40);
    p.hasBall = i === 0;
    p.isCutting = false;
    p.cutTimer = randomInRange(1000, 2000);
  });

  // Give ball to PG
  state.ball.carrier = offPlayers[0].id;
  offPlayers[0].hasBall = true;
  state.ball.inFlight = false;
  state.ball.isShot = false;
  state.ball.carrierHoldTime = 0;

  defPlayers.forEach(p => {
    p.hasBall = false;
    p.isCutting = false;
  });
}

function updateFastBreak(state, offensePlayers, defensePlayers, dt) {
  const fb = state.fastBreak;
  fb.timer -= dt;

  const basket = getBasketPos(state.attackingRight);
  const lanes = state.attackingRight ? FASTBREAK_LANES_RIGHT : FASTBREAK_LANES_LEFT;

  // Offense: ball carrier drives to basket, others fill transition lanes
  offensePlayers.forEach((player, i) => {
    if (player.id === state.ball.carrier) {
      player.targetX = basket.x;
      player.targetY = basket.y;
    } else {
      const lane = lanes[i % lanes.length];
      player.targetX = lane.x;
      player.targetY = lane.y;
    }
    player.isCutting = true; // sprinting
  });

  // Defense: sprint back to protect the basket
  defensePlayers.forEach(defender => {
    const defX = state.attackingRight ? basket.x - 50 : basket.x + 50;
    defender.targetX = clamp(defX + randomInRange(-30, 30), 20, COURT.width - 20);
    defender.targetY = clamp(basket.y + randomInRange(-50, 50), 20, COURT.height - 20);
  });

  // Fast break ends when the timer expires — but not if the carrier still has a
  // live advantage (ahead of the defense and approaching the rim). Cutting off a
  // 2-on-0 just because a fixed timer ran out produces ugly kick-out resets.
  if (fb.timer <= 0) {
    const carrier = state.players.find(p => p.id === state.ball.carrier);
    if (carrier) {
      const carrierDist = dist(carrier, basket);
      const defenseRecovered = defensePlayers.some(d => dist(d, basket) < carrierDist + 15);
      if (carrierDist < 280 && !defenseRecovered && carrierDist > 90) {
        fb.timer = 1500; // extend — still a live numbers advantage
      } else {
        state.fastBreak = null;
      }
    } else {
      state.fastBreak = null;
    }
  }
}

function checkTurnover(state, carrier, defenders) {
  const defenseTeam = defenders[0] ? defenders[0].team : null;
  const play = getActiveDefensePlay(state, defenseTeam);

  // Primary on-ball defender from matchup assignments (fallback: nearest)
  const primaryDef = getPrimaryDefender(state, carrier) ||
    defenders.reduce((closest, d) => dist(carrier, d) < dist(carrier, closest) ? d : closest, defenders[0]);
  if (!primaryDef) return;

  const dd = dist(carrier, primaryDef);
  const stealRange = play === 'aggressive_steal' ? 28 : 22;
  if (dd > stealRange) return;

  const stealChance = computeStealChance(state, carrier, primaryDef, defenders, play);
  if (Math.random() < stealChance) {
    carrier.hasBall = false;
    primaryDef.hasBall = true;
    state.ball.carrier = primaryDef.id;
    carrier.stats.turnovers++;
    primaryDef.stats.steals++;
    state.momentum[primaryDef.team] += 2;
    state.momentum[carrier.team] -= 1;
    state.gameLog.unshift(`🏀 ${primaryDef.name} steals from ${carrier.name}!`);
    state.turnoverCooldown = 2000;
    switchPossession(state, primaryDef);
    return;
  }

  // Aggressive steal gamble that misses can draw a reach-in foul
  if (play === 'aggressive_steal' && dd < 22 && !primaryDef.fouledOut && Math.random() < 0.10) {
    const rfo = commitPersonalFoul(state, primaryDef);
    if (isInPenalty(state, primaryDef.team)) {
      setupFreeThrows(state, carrier, primaryDef, 2, rfo);
      state.gameLog.unshift(`🦵 Reach-in foul on ${primaryDef.name} (${primaryDef.fouls}) — ${carrier.name} to the line!`);
      state.actionTimer = 1500;
    } else {
      state.gameLog.unshift(`🦵 Reach-in foul on ${primaryDef.name} (${primaryDef.fouls})`);
      state.shotClock = 24;
      state.turnoverCooldown = 1500;
      state.actionTimer = 600;
    }
    if (state.gameLog.length > 15) state.gameLog.pop();
  }
}

function updatePlayerMovement(state, dt) {
  const speedScale = dt / 16.67; // normalize to ~60fps
  const MOVEMENT_SCALE = 0.9; // players move 10% slower at baseline
  const isFastBreak = state.fastBreak && state.fastBreak.active;

  state.players.forEach(player => {
    // Bench players drift slowly to their sideline seat and stay put
    if (!player.onCourt) {
      const bdx = player.targetX - player.x;
      const bdy = player.targetY - player.y;
      const bd = Math.sqrt(bdx * bdx + bdy * bdy);
      if (bd > 2) {
        const speed = player.maxSpeed * 0.4 * MOVEMENT_SCALE * speedScale;
        player.x += (bdx / bd) * Math.min(speed, bd);
        player.y += (bdy / bd) * Math.min(speed, bd);
      }
      player.x = clamp(player.x, 15, COURT.width - 15);
      player.y = clamp(player.y, 15, COURT.height - 15);
      return;
    }

    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d > 2) {
      // Transition speed: players sprint faster during fast breaks,
      // scaled by their speed rating (Worthy/Magic much quicker than Kareem)
      // Fatigue slows on-court players by up to 25% when exhausted
      const fatigueFactor = 1 - (player.fatigue || 0) / 100 * 0.25;
      const speed = (isFastBreak ? (player.transitionSpeed || player.maxSpeed * 1.5) : player.maxSpeed) * fatigueFactor * MOVEMENT_SCALE * speedScale;
      const moveX = (dx / d) * Math.min(speed, d);
      const moveY = (dy / d) * Math.min(speed, d);
      player.x += moveX;
      player.y += moveY;
    }

    // Clamp to court
    player.x = clamp(player.x, 15, COURT.width - 15);
    player.y = clamp(player.y, 15, COURT.height - 15);

    // Collision with other on-court players
    state.players.forEach(other => {
      if (other.id === player.id || !other.onCourt) return;
      const dd = dist(player, other);
      const minDist = player.radius + other.radius;
      if (dd < minDist && dd > 0) {
        const overlap = (minDist - dd) / 2;
        const nx = (player.x - other.x) / dd;
        const ny = (player.y - other.y) / dd;
        player.x += nx * overlap * 0.5;
        player.y += ny * overlap * 0.5;
      }
    });
  });
}

// --- Bench Management: Fatigue & Substitutions ---

// Returns on-court players for a team, sorted by courtIndex (spot 0 = PG, etc.)
function getOnCourtPlayers(state, team) {
  return state.players
    .filter(p => p.team === team && p.onCourt)
    .sort((a, b) => a.courtIndex - b.courtIndex);
}

function updateFatigue(state, dt) {
  const gameSeconds = dt / 1000;
  const isFastBreak = state.fastBreak && state.fastBreak.active;

  state.players.forEach(player => {
    if (player.onCourt) {
      // Stamina derived from minutes-per-game: high-MPG players tire slower
      const stamina = clamp(player.mpg / 36, 0.6, 2.0);
      const fatigueRate = 0.17 / stamina;
      // Ball carriers and fast-break participants exert more energy
      const isCarrier = player.id === state.ball.carrier;
      const exertionMult = (isCarrier ? 1.3 : 1.0) * (isFastBreak ? 1.4 : 1.0);
      player.fatigue = clamp(player.fatigue + fatigueRate * exertionMult * gameSeconds, 0, 100);
      // Track minutes played for the star opportunity-correction model
      player.minutesPlayed = (player.minutesPlayed || 0) + gameSeconds;
    } else {
      // Bench recovery (~3x faster than accumulation)
      player.fatigue = clamp(player.fatigue - 0.35 * gameSeconds, 0, 100);
    }
  });
}

// Substitution logic (POSITION_GROUPS, findSubstitute, generateSubCommentary,
// executeSubstitution, checkSubstitutions) extracted to ./subEngine.js