// Free-throw dead-ball set piece system.
// During free throws, all ten players move into NBA-style lane alignment:
//   - Shooter at the FT line
//   - Two defensive rebounders on the low blocks
//   - Two offensive rebounders in the middle lane slots
//   - One+ defensive rebounder in the high lane spot
//   - Everyone else outside the three-point line
// No passing, cutting, shot-clock logic, fast breaks, or normal AI runs during FTs.

import { COURT } from './gameData';

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// Lane line is 80px each side of basket center (keyWidth 160 / 2)
const LANE_DY = 65; // just inside the lane line

// Distance from basket along the x-axis for each lane tier
const LANE_DX = {
  LOW: 22,   // low block — closest to basket
  MID: 52,   // middle lane spot
  HIGH: 85,  // high lane spot (near FT line)
};

const POSITION_WEIGHT = {
  PG: 0.70, SG: 0.80, SF: 1.00, PF: 1.20, C: 1.30,
};

// Players who crash the glass harder than their position suggests
const AGGRESSIVE_CRASHERS = new Set(['Mitchell Wiggins', 'Dennis Rodman']);

function getBasketPos(attackingRight) {
  return attackingRight
    ? { x: COURT.width - COURT.rimX, y: COURT.basketY }
    : { x: COURT.rimX, y: COURT.basketY };
}

function getFTLineSpot(attackingRight) {
  const basket = getBasketPos(attackingRight);
  return { x: attackingRight ? basket.x - 120 : basket.x + 120, y: basket.y };
}

// Lane spot coordinates — NBA-style alignment along the key
function getLaneSpotCoordinates(spot, attackingRight) {
  const basket = getBasketPos(attackingRight);
  const dir = attackingRight ? -1 : 1; // away from basket toward FT line

  const dy = spot.endsWith('LEFT') ? -LANE_DY : LANE_DY;
  let dx;
  if (spot.startsWith('LOW')) dx = LANE_DX.LOW;
  else if (spot.startsWith('MID')) dx = LANE_DX.MID;
  else dx = LANE_DX.HIGH;

  return {
    x: basket.x + dir * dx,
    y: clamp(basket.y + dy, 40, COURT.height - 40),
  };
}

// Perimeter wait spots for non-rebounders (outside the arc / above FT line extended)
function getPerimeterFTWaitSpot(index, total, attackingRight) {
  const basket = getBasketPos(attackingRight);
  const dir = attackingRight ? -1 : 1;
  const baseX = basket.x + dir * 275; // beyond the 3pt arc (237)
  const t = total <= 1 ? 0.5 : index / (total - 1);
  const y = clamp(basket.y + (t - 0.5) * 260, 50, COURT.height - 50);
  return { x: baseX + dir * (index % 2 === 0 ? 12 : -12), y };
}

function getOffensiveReboundWeight(player) {
  let w = (player.offensiveRebRate || 0.05) * (POSITION_WEIGHT[player.position] || 1.0);
  if (AGGRESSIVE_CRASHERS.has(player.name)) w *= 1.35;
  return w;
}

function getDefensiveReboundWeight(player) {
  let w = (player.defensiveRebRate || 0.12) * (POSITION_WEIGHT[player.position] || 1.0);
  w *= 0.7 + ((player.dRebound || 50) / 99) * 0.6;
  if (AGGRESSIVE_CRASHERS.has(player.name)) w *= 1.25;
  return w;
}

// Weighted rebound selection for a missed final FT — lane position dominates.
export function getFTReboundWeight(player, shooter, isOffensive) {
  let weight = isOffensive ? getOffensiveReboundWeight(player) : getDefensiveReboundWeight(player);

  const spot = player.ftLaneSpot;
  if (spot) {
    if (spot.startsWith('LOW')) weight *= 1.45;
    else if (spot.startsWith('MID')) weight *= 1.20;
    else if (spot.startsWith('HIGH')) weight *= 1.05;
  } else if (player.currentAction === 'ft_perimeter_wait' || player.currentAction === 'ft_react') {
    weight *= 0.35;
  }

  // Shooter is slow to follow his own miss
  if (player.id === shooter.id) weight *= 0.25;

  // Defense has the lane advantage on FT misses
  if (!isOffensive) weight *= 1.25;

  return weight;
}

// Position all ten players into NBA free-throw lane alignment.
export function setupFreeThrowAlignment(state, shooter) {
  const attackingRight = state.attackingRight;
  const shootingTeam = shooter.team;
  const defenseTeam = shootingTeam === state.teamKeys.team1 ? state.teamKeys.team2 : state.teamKeys.team1;

  // Clear any previous FT assignments
  state.players.forEach(p => {
    p.ftLaneSpot = null;
    p.currentAction = null;
    p.hasBall = false;
  });

  // Shooter at the FT line with the ball
  const ftSpot = getFTLineSpot(attackingRight);
  shooter.targetX = ftSpot.x;
  shooter.targetY = ftSpot.y;
  shooter.hasBall = true;
  state.ball.carrier = shooter.id;
  shooter.currentAction = 'free_throw_shooter';

  // Sort defenders by defensive rebounding (best rebounders on low blocks)
  const defenders = state.players
    .filter(p => p.team === defenseTeam && p.onCourt)
    .sort((a, b) => getDefensiveReboundWeight(b) - getDefensiveReboundWeight(a));

  // Sort offense (excl. shooter) by offensive rebounding
  const offense = state.players
    .filter(p => p.team === shootingTeam && p.onCourt && p.id !== shooter.id)
    .sort((a, b) => getOffensiveReboundWeight(b) - getOffensiveReboundWeight(a));

  // NBA lane alignment: defense on low blocks + high, offense in middle slots
  const laneAssignments = [
    { spot: 'LOW_LEFT',  player: defenders[0] },
    { spot: 'LOW_RIGHT', player: defenders[1] },
    { spot: 'MID_LEFT',  player: offense[0] },
    { spot: 'MID_RIGHT', player: offense[1] },
    { spot: 'HIGH_LEFT', player: defenders[2] },
    { spot: 'HIGH_RIGHT', player: defenders[3] },
  ];

  const assignedIds = new Set([shooter.id]);
  laneAssignments.forEach(a => {
    if (!a.player || assignedIds.has(a.player.id)) return;
    const coords = getLaneSpotCoordinates(a.spot, attackingRight);
    a.player.targetX = coords.x;
    a.player.targetY = coords.y;
    a.player.ftLaneSpot = a.spot;
    a.player.currentAction = 'ft_lane_rebounder';
    assignedIds.add(a.player.id);
  });

  // Everyone else waits on the perimeter
  const others = state.players.filter(p => p.onCourt && !assignedIds.has(p.id));
  others.forEach((p, i) => {
    const spot = getPerimeterFTWaitSpot(i, others.length, attackingRight);
    p.targetX = spot.x;
    p.targetY = spot.y;
    p.ftLaneSpot = null;
    p.currentAction = 'ft_perimeter_wait';
  });
}

// On a missed final FT, release lane players to crash the glass.
// Lane rebounders get first crack; perimeter players react later.
export function releaseLanePlayersForRebound(state) {
  const basket = getBasketPos(state.attackingRight);
  state.players.forEach(p => {
    if (!p.onCourt) return;
    if (p.currentAction === 'ft_lane_rebounder') {
      p.targetX = basket.x + (Math.random() - 0.5) * 50;
      p.targetY = basket.y + (Math.random() - 0.5) * 50;
      p.currentAction = 'crash_ft_rebound';
    } else if (p.currentAction === 'ft_perimeter_wait') {
      p.targetX = basket.x + (Math.random() - 0.5) * 90;
      p.targetY = basket.y + (Math.random() - 0.5) * 90;
      p.currentAction = 'ft_react';
    } else if (p.currentAction === 'free_throw_shooter') {
      p.currentAction = 'ft_shooter_follow';
    }
  });
}