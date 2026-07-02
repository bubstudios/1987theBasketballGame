import { COURT } from './gameData';

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

// Motion offense positions (relative to basket, right side)
const OFFENSE_SPOTS_RIGHT = [
  { x: 780, y: 130 }, // wing top
  { x: 780, y: 370 }, // wing bottom
  { x: 870, y: 80 },  // corner top
  { x: 870, y: 420 }, // corner bottom
  { x: 830, y: 250 }, // high post
];

const OFFENSE_SPOTS_LEFT = [
  { x: 160, y: 130 },
  { x: 160, y: 370 },
  { x: 70, y: 80 },
  { x: 70, y: 420 },
  { x: 110, y: 250 },
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

export function createGameState(lakersRoster, celticsRoster) {
  const players = [];

  // Lakers start on the right side (offense first)
  lakersRoster.forEach((p, i) => {
    const spot = OFFENSE_SPOTS_RIGHT[i];
    players.push({
      ...p,
      team: 'lakers',
      id: `lakers_${i}`,
      x: spot.x,
      y: spot.y,
      targetX: spot.x,
      targetY: spot.y,
      vx: 0,
      vy: 0,
      hasBall: i === 0, // PG starts with ball
      radius: PLAYER_BASE_RADIUS + (p.height - 75) * 0.3,
      maxSpeed: 1.5 + p.speed * 0.35,
      cutTimer: 0,
      isCutting: false,
      isSettingScreen: false,
      shotClock: 0,
      fouls: 0,
      fouledOut: false,
    });
  });

  // Celtics on left side (defense first)
  celticsRoster.forEach((p, i) => {
    const offSpot = OFFENSE_SPOTS_RIGHT[i]; // match up against laker
    players.push({
      ...p,
      team: 'celtics',
      id: `celtics_${i}`,
      x: offSpot.x + 30, // slightly off their man
      y: offSpot.y,
      targetX: offSpot.x + 30,
      targetY: offSpot.y,
      vx: 0,
      vy: 0,
      hasBall: false,
      radius: PLAYER_BASE_RADIUS + (p.height - 75) * 0.3,
      maxSpeed: 1.5 + p.speed * 0.35,
      cutTimer: 0,
      isCutting: false,
      isSettingScreen: false,
      shotClock: 0,
      fouls: 0,
      fouledOut: false,
    });
  });

  return {
    players,
    ball: {
      x: players[0].x,
      y: players[0].y,
      targetX: null,
      targetY: null,
      carrier: players[0].id,
      isLoose: false,
      inFlight: false,
      flightStart: null,
      flightDuration: 0,
      startX: 0,
      startY: 0,
      shotArcPeak: 0,
      isShot: false,
      shotResult: null,
    },
    score: { lakers: 0, celtics: 0 },
    gameClock: 720, // 12 min quarter in seconds
    shotClock: 24,
    quarter: 1,
    possession: 'lakers', // who has offense
    attackingRight: true, // lakers attack right basket
    lastUpdate: Date.now(),
    passTimer: 0,
    actionTimer: 0,
    shotAnimating: false,
    shotResultDisplay: null,
    shotResultTimer: 0,
    gameLog: [],
    isPaused: false,
    gameSpeed: 1,
    turnoverCooldown: 0,
    ftState: null,
  };
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
  
  const effectiveDt = dt * state.gameSpeed;

  // Handle free throw state — play stops while the shooter is at the line
  if (state.ftState) {
    updateFreeThrows(state, effectiveDt);
    updatePlayerMovement(state, effectiveDt);
    return state;
  }

  // Update clocks
  state.gameClock -= effectiveDt / 1000;
  state.shotClock -= effectiveDt / 1000;

  if (state.gameClock <= 0) {
    state.gameClock = 0;
    if (state.quarter < 4) {
      state.quarter++;
      state.gameClock = 720;
      state.shotClock = 24;
      // Swap possession each quarter
      state.possession = state.possession === 'lakers' ? 'celtics' : 'lakers';
      state.attackingRight = state.possession === 'lakers';
      resetPositions(state);
    } else {
      state.isPaused = true;
      return state;
    }
  }

  if (state.shotClock <= 0) {
    // Shot clock violation - turnover
    state.shotClock = 24;
    switchPossession(state);
    return state;
  }

  // Update shot result display
  if (state.shotResultTimer > 0) {
    state.shotResultTimer -= effectiveDt;
    if (state.shotResultTimer <= 0) {
      state.shotResultDisplay = null;
    }
  }

  // Handle ball in flight (pass or shot)
  if (state.ball.inFlight) {
    updateBallFlight(state, effectiveDt);
    updatePlayerMovement(state, effectiveDt);
    return state;
  }

  // Cooldowns
  state.passTimer -= effectiveDt;
  state.actionTimer -= effectiveDt;
  state.turnoverCooldown -= effectiveDt;

  const offensePlayers = state.players.filter(p => p.team === state.possession);
  const defensePlayers = state.players.filter(p => p.team !== state.possession);
  const ballCarrier = state.players.find(p => p.id === state.ball.carrier);

  // --- OFFENSE AI: Motion Offense ---
  updateMotionOffense(state, offensePlayers, ballCarrier, effectiveDt);

  // --- DEFENSE AI: Man-to-Man ---
  updateManToManDefense(state, defensePlayers, offensePlayers, effectiveDt);

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
    }
  }

  // Check for turnovers (defender close to ball handler)
  if (state.turnoverCooldown <= 0 && ballCarrier) {
    checkTurnover(state, ballCarrier, defensePlayers);
  }

  return state;
}

function updateBallFlight(state, dt) {
  const elapsed = Date.now() - state.ball.flightStart;
  const t = Math.min(elapsed / state.ball.flightDuration, 1);

  state.ball.x = lerp(state.ball.startX, state.ball.targetX, t);
  state.ball.y = lerp(state.ball.startY, state.ball.targetY, t);

  if (state.ball.isShot) {
    // Arc for shots
    state.ball.arcHeight = state.ball.shotArcPeak * Math.sin(t * Math.PI);
  }

  if (t >= 1) {
    state.ball.inFlight = false;

    if (state.ball.isShot) {
      resolveShot(state);
    } else {
      // Pass completed
      const receiver = state.players.find(p => {
        return dist(p, { x: state.ball.targetX, y: state.ball.targetY }) < 30;
      });
      if (receiver && receiver.team === state.possession) {
        state.ball.carrier = receiver.id;
        receiver.hasBall = true;
        state.ball.x = receiver.x;
        state.ball.y = receiver.y;
      } else {
        // Loose ball - nearest player grabs it
        let nearest = null;
        let nearDist = Infinity;
        state.players.forEach(p => {
          const d = dist(p, state.ball);
          if (d < nearDist) { nearDist = d; nearest = p; }
        });
        if (nearest) {
          state.ball.carrier = nearest.id;
          nearest.hasBall = true;
          if (nearest.team !== state.possession) {
            switchPossession(state);
          }
        }
      }
    }
    state.ball.isShot = false;
  }
}

function updateMotionOffense(state, offensePlayers, ballCarrier, dt) {
  const spots = getOffenseSpots(state.attackingRight);
  const cuts = getCutTargets(state.attackingRight);

  offensePlayers.forEach((player, i) => {
    if (player.id === state.ball.carrier) {
      // Ball handler holds position or drives
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
        // Relocate to a spot
        const spot = spots[Math.floor(Math.random() * spots.length)];
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

function updateManToManDefense(state, defensePlayers, offensePlayers, dt) {
  defensePlayers.forEach((defender, i) => {
    const matchup = offensePlayers[i]; // man-to-man assignment
    if (!matchup) return;

    const basket = getDefenseBasketPos(state.attackingRight);

    // Position between man and basket, closer to man
    const toBall = state.ball.carrier
      ? state.players.find(p => p.id === state.ball.carrier)
      : null;

    let defX, defY;

    if (matchup.id === state.ball.carrier) {
      // On-ball defense — get right up on them
      const angle = Math.atan2(basket.y - matchup.y, basket.x - matchup.x);
      defX = matchup.x + Math.cos(angle) * 22;
      defY = matchup.y + Math.sin(angle) * 22;
    } else {
      // Off-ball defense — stay between man and basket, sag toward ball
      const midX = lerp(matchup.x, basket.x, 0.25);
      const midY = lerp(matchup.y, basket.y, 0.25);

      // Help side sag toward ball
      if (toBall) {
        const sagAmount = 0.15 * (1 - defender.defense / 10);
        defX = lerp(midX, toBall.x, sagAmount);
        defY = lerp(midY, toBall.y, sagAmount);
      } else {
        defX = midX;
        defY = midY;
      }
    }

    defender.targetX = clamp(defX, 20, COURT.width - 20);
    defender.targetY = clamp(defY, 20, COURT.height - 20);
  });
}

function makeBallCarrierDecision(state, carrier, teammates, defenders) {
  const basket = getBasketPos(state.attackingRight);
  const distToBasket = dist(carrier, basket);
  const nearestDef = defenders.reduce((closest, d) => {
    const dd = dist(carrier, d);
    return dd < closest.dist ? { player: d, dist: dd } : closest;
  }, { player: null, dist: Infinity });

  const isOpen = nearestDef.dist > 40;
  const isClose = distToBasket < 150;
  const isVeryClose = distToBasket < 80;
  const threeZone = isThreePointer(carrier.x, carrier.y, state.attackingRight);

  // Decide: shoot, drive, or pass
  let shootChance = 0;
  let driveChance = 0;

  if (isVeryClose) {
    const freqFactor = Math.min(carrier.twoAttempts / 15, 1);
    shootChance = 0.18 + carrier.insideScoring * 0.04 + freqFactor * 0.1;
  } else if (isClose && isOpen) {
    const freqFactor = Math.min(carrier.twoAttempts / 15, 1);
    shootChance = 0.1 + carrier.shooting * 0.03 + freqFactor * 0.12;
  } else if (threeZone && isOpen) {
    // Use real 3-point attempt frequency and skill to drive tendency
    const freqFactor = Math.min(carrier.threeAttempts / 3, 1); // normalize ~3+ attempts to 1.0
    shootChance = 0.04 + carrier.threePoint * 0.025 + freqFactor * 0.12;
  }

  if (isOpen && !threeZone) {
    driveChance = 0.06 + (carrier.driveTendency || 5) * 0.04 + carrier.speed * 0.01;
  }

  const roll = Math.random();

  if (roll < shootChance && state.shotClock < 20) {
    // Foul detection: contested shots can draw fouls, weighted by FTA rate
    const foulChance = nearestDef.dist < 25 ? Math.min(0.08 + carrier.ftAttempts * 0.015, 0.28) : 0;
    const fouledBy = (foulChance > 0 && Math.random() < foulChance && !nearestDef.player.fouledOut) ? nearestDef.player : null;
    takeShot(state, carrier, isOpen, fouledBy, nearestDef);
    state.actionTimer = 1500;
  } else if (roll < shootChance + driveChance) {
    // Drive to basket
    carrier.targetX = lerp(carrier.x, basket.x, 0.5);
    carrier.targetY = lerp(carrier.y, basket.y, 0.5);
    state.actionTimer = randomInRange(400, 800);
  } else {
    // Pass to open teammate
    const passTarget = findBestPassTarget(carrier, teammates, defenders, basket);
    if (passTarget) {
      makePass(state, carrier, passTarget);
    }
    state.passTimer = randomInRange(600, 1200);
  }
}

function findBestPassTarget(carrier, teammates, defenders, basket) {
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

    // Score: prefer open players close to basket
    let score = openness * 2 - distBasket * 0.5 + passingSkill * 5;

    if (t.isCutting) score += 40; // cutters are high priority

    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  });

  return best;
}

function makePass(state, passer, receiver) {
  passer.hasBall = false;
  state.ball.carrier = null;
  state.ball.inFlight = true;
  state.ball.isShot = false;
  state.ball.startX = passer.x;
  state.ball.startY = passer.y;
  state.ball.targetX = receiver.x;
  state.ball.targetY = receiver.y;
  state.ball.flightStart = Date.now();
  const d = dist(passer, receiver);
  state.ball.flightDuration = (d / PASS_SPEED) * (16.67); // roughly scale to frames

  // Magic's special long passes get the magical trail effect
  state.ball.isMagicPass = passer.name === 'Magic Johnson' && d > 180;
  state.ball.isSkyhook = false;

  const passerData = passer;
  const logEntry = `${passerData.name} passes to ${receiver.name}`;
  state.gameLog.unshift(logEntry);
  if (state.gameLog.length > 15) state.gameLog.pop();
}

function takeShot(state, shooter, isOpen, fouledBy, nearestDef) {
  const basket = getBasketPos(state.attackingRight);
  shooter.hasBall = false;
  state.ball.carrier = null;
  state.ball.inFlight = true;
  state.ball.isShot = true;
  state.ball.startX = shooter.x;
  state.ball.startY = shooter.y;
  state.ball.targetX = basket.x;
  state.ball.targetY = basket.y;
  state.ball.flightStart = Date.now();
  state.ball.flightDuration = SHOT_ARC_DURATION;
  state.ball.shotArcPeak = 40 + dist(shooter, basket) * 0.15;

  // Skyhook animation for Kareem's inside shots
  state.ball.isSkyhook = shooter.name === 'Kareem Abdul-Jabbar' && dist(shooter, basket) < 80;
  state.ball.isMagicPass = false;
  if (state.ball.isSkyhook) state.ball.shotArcPeak += 25;

  // Calculate make probability
  const d = dist(shooter, basket);
  const threePtr = isThreePointer(shooter.x, shooter.y, state.attackingRight);
  let prob;

  if (d < 60) {
    // Close shots: blend real 2P% with inside scoring for layup context
    const realPct = shooter.twoPct || 0.45;
    const insideAdj = (shooter.insideScoring - 6) * 0.03;
    prob = realPct * 0.6 + insideAdj + (isOpen ? 0.08 : -0.05);
    prob = Math.max(0.05, Math.min(prob, 0.7));
  } else if (threePtr) {
    // Use real 3P% as the base, blend with skill rating for context (open vs. contested)
    const realPct = shooter.threePct || 0;
    const skillAdj = (shooter.threePoint - 5) * 0.02; // +/- relative to average skill
    prob = realPct * 0.75 + skillAdj + (isOpen ? 0.06 : -0.04);
    prob = Math.max(0.03, Math.min(prob, 0.55));
  } else {
    // Mid-range 2s: use real 2P% as base, blend with shooting skill
    const realPct = shooter.twoPct || 0.45;
    const skillAdj = (shooter.shooting - 6) * 0.02;
    prob = realPct * 0.55 + skillAdj + (isOpen ? 0.06 : -0.05);
    prob = Math.max(0.05, Math.min(prob, 0.6));
  }

  // Block detection: contested shots can be blocked, weighted by BLK% and distance
  let blockedBy = null;
  if (nearestDef && nearestDef.player && !fouledBy && nearestDef.dist < 30) {
    const distFactor = d < 60 ? 1.5 : 0.6;
    const blockChance = (nearestDef.player.blockRate || 0.01) * distFactor;
    if (Math.random() < blockChance) {
      blockedBy = nearestDef.player;
    }
  }

  state.ball.shotResult = {
    made: blockedBy ? false : Math.random() < prob,
    shooter: shooter,
    points: threePtr ? 3 : 2,
    type: d < 60 ? 'layup' : (threePtr ? 'three' : 'mid-range'),
    fouledBy: fouledBy || null,
    blockedBy: blockedBy || null,
  };

  state.shotAnimating = true;
}

function resolveShot(state) {
  const result = state.ball.shotResult;
  if (!result) return;

  state.shotAnimating = false;

  if (result.fouledBy) {
    resolveFouledShot(state, result);
    state.ball.shotResult = null;
    return;
  }

  if (result.blockedBy) {
    state.shotResultDisplay = `${result.blockedBy.name} blocks ${result.shooter.name}!`;
    state.gameLog.unshift(`🚫 ${result.blockedBy.name} BLOCKS ${result.shooter.name}!`);
    state.shotResultTimer = 1500;
    if (state.gameLog.length > 15) state.gameLog.pop();
    switchPossession(state);
    state.ball.shotResult = null;
    return;
  }

  if (result.made) {
    state.score[result.shooter.team] += result.points;
    const desc = result.type === 'three' ? 'three-pointer' : (result.type === 'layup' ? 'layup' : 'jumper');
    state.shotResultDisplay = `${result.shooter.name} hits the ${desc}! +${result.points}`;
    state.gameLog.unshift(`✓ ${result.shooter.name} ${desc} — ${result.points} pts`);
  } else {
    state.shotResultDisplay = `${result.shooter.name} misses!`;
    state.gameLog.unshift(`✗ ${result.shooter.name} misses`);
  }
  state.shotResultTimer = 1500;

  if (state.gameLog.length > 15) state.gameLog.pop();

  // Reset possession
  if (result.made) {
    switchPossession(state);
  } else {
    // Rebound — weighted by OReb%/DReb% and proximity to basket
    const basket = getBasketPos(state.attackingRight);
    let rebounder = null;
    let minD = Infinity;
    state.players.forEach(p => {
      const d = dist(p, basket);
      const rate = p.team === state.possession
        ? (p.offensiveRebRate || 0.05)
        : (p.defensiveRebRate || 0.15);
      const reboundChance = d - rate * 180 - p.rebounding * 4;
      if (reboundChance < minD) { minD = reboundChance; rebounder = p; }
    });
    if (rebounder) {
      const isOffensive = rebounder.team === state.possession;
      state.ball.carrier = rebounder.id;
      rebounder.hasBall = true;
      state.ball.x = rebounder.x;
      state.ball.y = rebounder.y;
      state.gameLog.unshift(`↑ ${rebounder.name} ${isOffensive ? 'offensive' : 'defensive'} rebound`);

      if (rebounder.team !== state.possession) {
        switchPossession(state);
      } else {
        state.shotClock = 24;
      }
    }
  }

  state.ball.shotResult = null;
}

function resolveFouledShot(state, result) {
  const shooter = result.shooter;
  const fouledBy = result.fouledBy;

  // Count the personal foul on the defender
  fouledBy.fouls = (fouledBy.fouls || 0) + 1;

  // Check for disqualification at 6 fouls
  let fouledOut = false;
  if (fouledBy.fouls >= 6) {
    fouledBy.fouledOut = true;
    fouledOut = true;
  }

  // If the shot was made (and-one), count the basket points now
  if (result.made) {
    state.score[shooter.team] += result.points;
  }

  // Free throw count: 1 for and-one, 2 for missed 2-pt, 3 for missed 3-pt
  const ftCount = result.made ? 1 : (result.points === 3 ? 3 : 2);

  // Move shooter to the free throw line for the FT sequence
  const basket = getBasketPos(state.attackingRight);
  const ftX = state.attackingRight ? basket.x - 120 : basket.x + 120;
  shooter.targetX = ftX;
  shooter.targetY = basket.y;
  state.ball.carrier = shooter.id;
  shooter.hasBall = true;

  // Set up free throw state — play stops while shooter goes to the line
  state.ftState = {
    shooter: shooter,
    fouledBy: fouledBy,
    ftCount: ftCount,
    ftsMade: 0,
    currentFT: 0,
    timer: 1200,
    team: shooter.team,
    madeShot: result.made,
    fouledOut: fouledOut,
  };

  const desc = result.type === 'three' ? 'three-pointer' : (result.type === 'layup' ? 'layup' : 'jumper');
  if (result.made) {
    state.shotResultDisplay = `${shooter.name} hits the ${desc} + foul! AND1!`;
    state.gameLog.unshift(`✓ ${shooter.name} ${desc} + foul on ${fouledBy.name} (${fouledBy.fouls})! +${result.points}`);
  } else {
    state.shotResultDisplay = `Foul on ${fouledBy.name} (${fouledBy.fouls})! ${shooter.name} to the line for ${ftCount}`;
    state.gameLog.unshift(`🦵 Foul on ${fouledBy.name} (${fouledBy.fouls}) — ${shooter.name} to the line for ${ftCount}`);
  }
  if (state.gameLog.length > 15) state.gameLog.pop();
}

function updateFreeThrows(state, dt) {
  const ft = state.ftState;
  ft.timer -= dt;

  if (ft.timer <= 0) {
    if (ft.currentFT < ft.ftCount) {
      // Shoot one free throw
      const made = Math.random() < ft.shooter.ftPct;
      if (made) {
        state.score[ft.team] += 1;
        ft.ftsMade++;
      }
      ft.currentFT++;

      state.shotResultDisplay = `${ft.shooter.name} ${made ? 'makes' : 'misses'} FT ${ft.currentFT}/${ft.ftCount} (${ft.ftsMade}/${ft.ftCount})`;
      state.gameLog.unshift(`${made ? '✓' : '✗'} ${ft.shooter.name} ${made ? 'makes' : 'misses'} FT ${ft.ftsMade}/${ft.ftCount}`);
      if (state.gameLog.length > 15) state.gameLog.pop();

      ft.timer = 1500;
    } else {
      // All free throws complete — resume play
      if (ft.fouledOut) {
        state.gameLog.unshift(`📤 ${ft.fouledBy.name} fouls out! (${ft.fouledBy.fouls} fouls)`);
        if (state.gameLog.length > 15) state.gameLog.pop();
      }
      state.ftState = null;
      state.shotResultTimer = 1200;
      switchPossession(state);
    }
  }
}

function switchPossession(state) {
  state.possession = state.possession === 'lakers' ? 'celtics' : 'lakers';
  state.attackingRight = state.possession === 'lakers';
  state.shotClock = 24;
  state.turnoverCooldown = 1000;
  resetPositions(state);
}

function resetPositions(state) {
  const offSpots = getOffenseSpots(state.attackingRight);
  const offPlayers = state.players.filter(p => p.team === state.possession);
  const defPlayers = state.players.filter(p => p.team !== state.possession);

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

  defPlayers.forEach(p => {
    p.hasBall = false;
    p.isCutting = false;
  });
}

function checkTurnover(state, carrier, defenders) {
  defenders.forEach(d => {
    const dd = dist(carrier, d);
    if (dd < 20) {
      const stealChance = (d.stealRate || 0.02) * 0.12 + (carrier.turnoverRate || 0.12) * 0.006;
      if (Math.random() < stealChance) {
        carrier.hasBall = false;
        d.hasBall = true;
        state.ball.carrier = d.id;
        state.gameLog.unshift(`🏀 ${d.name} steals from ${carrier.name}!`);
        state.turnoverCooldown = 2000;
        switchPossession(state);
      }
    }
  });
}

function updatePlayerMovement(state, dt) {
  const speedScale = dt / 16.67; // normalize to ~60fps
  
  state.players.forEach(player => {
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d > 2) {
      const speed = player.maxSpeed * speedScale;
      const moveX = (dx / d) * Math.min(speed, d);
      const moveY = (dy / d) * Math.min(speed, d);
      player.x += moveX;
      player.y += moveY;
    }

    // Clamp to court
    player.x = clamp(player.x, 15, COURT.width - 15);
    player.y = clamp(player.y, 15, COURT.height - 15);

    // Collision with other players
    state.players.forEach(other => {
      if (other.id === player.id) return;
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