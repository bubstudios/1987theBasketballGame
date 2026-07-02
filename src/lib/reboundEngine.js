import { COURT } from './gameData';

// Rebounding system — two-stage:
//   1. Decide whether the offense gets the rebound back (team-level).
//   2. Pick the individual rebounder on the winning team (weighted).
// All rates are the per-player offensiveRebRate / defensiveRebRate fields.

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

// Position influence around the basket — bigs matter more on the glass
const POSITION_WEIGHT = {
  PG: 0.70, SG: 0.80, SF: 1.00, PF: 1.20, C: 1.30,
};

// 1980s-era league offensive rebound baseline (higher than modern ~24%)
const LEAGUE_ORB_BASELINE = 0.29;
const MIN_ORB_CHANCE = 0.08;
const MAX_ORB_CHANCE = 0.55;

// Shot-type offensive rebound modifiers (close shots create more putbacks)
const SHOT_TYPE_ORB_MOD = {
  dunk: 0.04,
  layup: 0.03,
  'mid-range': 0.00,
  three: -0.02,
};

function fatigueMultiplier(fatigue) {
  if (fatigue < 20) return 1.00;
  if (fatigue < 40) return 0.97;
  if (fatigue < 60) return 0.92;
  if (fatigue < 80) return 0.85;
  return 0.75;
}

// --- Step 1: position-weighted lineup rebounding strength ---
function lineupStrength(players, rateField) {
  let weightedSum = 0;
  let weightSum = 0;
  players.forEach(p => {
    const w = POSITION_WEIGHT[p.position] || 1.0;
    weightedSum += (p[rateField] || 0) * w;
    weightSum += w;
  });
  return weightSum > 0 ? weightedSum / weightSum : 0;
}

// --- Step 2: does the shooting team get the rebound back? ---
export function determineOffensiveRebound(state, result, offensePlayers, defensePlayers, crashBoards) {
  let orbChance = LEAGUE_ORB_BASELINE;

  // Lineup strength — modest adjustment; each 0.05 of rate-diff ≈ 3% orb
  const offStrength = lineupStrength(offensePlayers, 'offensiveRebRate');
  const defStrength = lineupStrength(defensePlayers, 'defensiveRebRate');
  orbChance += (offStrength - defStrength) * 0.6;

  // Shot type
  orbChance += SHOT_TYPE_ORB_MOD[result.type] ?? 0;

  // Defensive "crash boards" play suppresses offensive rebounding
  if (crashBoards) orbChance -= 0.05;

  // A dominant individual offensive rebounder gives a small hustle boost
  const rimCrasher = offensePlayers.reduce((best, p) =>
    ((p.offensiveRebRate || 0) > (best?.offensiveRebRate || 0)) ? p : best, null);
  if (rimCrasher && (rimCrasher.offensiveRebRate || 0) > 0.08) orbChance += 0.02;

  orbChance = clamp(orbChance, MIN_ORB_CHANCE, MAX_ORB_CHANCE);
  return Math.random() < orbChance;
}

// --- Step 3: where the ball comes off the rim ---
export function computeReboundZone(shooter, basket, shotType) {
  if (shotType === 'layup' || shotType === 'dunk') {
    // Close shots rebound near the rim, deflecting to a random side
    const ang = Math.atan2(shooter.y - basket.y, shooter.x - basket.x) + randomInRange(-0.8, 0.8);
    const r = randomInRange(15, 55);
    return { x: basket.x + Math.cos(ang) * r, y: clamp(basket.y + Math.sin(ang) * r, 30, COURT.height - 30) };
  }
  if (shotType === 'three') {
    // Long rebounds come out toward the FT line / top of key area
    const towardBasket = lerp(shooter.x, basket.x, 0.45);
    const side = randomInRange(-90, 90);
    return { x: towardBasket, y: clamp(basket.y + side, 30, COURT.height - 30) };
  }
  // Mid-range: between the shooter and the basket
  const t = randomInRange(0.45, 0.7);
  return {
    x: lerp(shooter.x, basket.x, t),
    y: clamp(lerp(shooter.y, basket.y, t * 0.6), 30, COURT.height - 30),
  };
}

function proximityMultiplier(d) {
  if (d < 40) return 1.50;   // very close to the rebound zone
  if (d < 90) return 1.25;
  if (d < 160) return 1.00;
  if (d < 250) return 0.60;
  return 0.30;
}

// --- Step 4: weighted selection of the rebounder on the winning team ---
export function selectRebounder(state, result, zone, team, isOffensive, defensePlayers) {
  const eligible = state.players.filter(p => p.team === team && p.onCourt);
  if (eligible.length === 0) return null;
  const rateField = isOffensive ? 'offensiveRebRate' : 'defensiveRebRate';
  const shooter = result.shooter;

  const weights = eligible.map(p => {
    const rate = (p[rateField] || 0.05);
    const posMod = POSITION_WEIGHT[p.position] || 1.0;
    const prox = proximityMultiplier(dist(p, zone));
    let w = rate * posMod * prox;

    w *= fatigueMultiplier(p.fatigue || 0);

    // Shooter can grab his own miss — more likely on close shots, rare on jumpers
    if (isOffensive && p.id === shooter.id) {
      const close = result.type === 'layup' || result.type === 'dunk';
      w *= close ? 1.6 : 0.5;
    }

    // Box-out: a nearby defender can neutralize an offensive rebounder
    if (isOffensive && defensePlayers) {
      let nearest = null, nd = Infinity;
      defensePlayers.forEach(d2 => {
        const dd = dist(p, d2);
        if (dd < nd) { nd = dd; nearest = d2; }
      });
      if (nearest && nd < 35) {
        const boxoutWin = (nearest.defensiveRebRate || 0.12) - rate;
        if (boxoutWin > 0) w *= clamp(1 - boxoutWin * 4, 0.4, 1);          // defender wins
        else w *= clamp(1 + (-boxoutWin) * 3, 1, 1.5);                      // offensive player wins
      }
    }

    w *= (0.5 + Math.random()); // randomness — great rebounders don't get every board
    return w;
  });

  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return eligible[0];
  let roll = Math.random() * total;
  for (let i = 0; i < eligible.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return eligible[i];
  }
  return eligible[eligible.length - 1];
}

// --- After an offensive rebound: immediate putback or reset the offense ---
export function decidePutback(rebounder, basket, nearestDefDist, shotClock) {
  const d = dist(rebounder, basket);
  if (d > 85) return false; // too far out to put it back
  const close = d < 55;
  const open = nearestDefDist > 45;
  let chance = close ? 0.45 : 0.18;
  if (open) chance += 0.20;
  if (shotClock < 8) chance += 0.25; // late-clock urgency
  chance += ((rebounder.insideScoring || 5) - 6) * 0.03; // strong finishers go up readily
  return Math.random() < clamp(chance, 0.05, 0.85);
}