// signatureMoves.js — signature-move decision trees and Microwave Mode tracking.
// Each signature move is a reactive decision tree (like Akeem's Dream Shake):
// it triggers on a fraction of a star's actions, improves shot quality via
// contest-level boosts, and modifies foul-drawing / block risk.

const CONTEST_ORDER = ['wide_open', 'open', 'light_contest', 'tight', 'smothered'];

export function improveContestLevel(level, steps) {
  const idx = CONTEST_ORDER.indexOf(level);
  if (idx < 0) return level;
  return CONTEST_ORDER[Math.max(0, idx - steps)];
}

// Akeem Olajuwon — "Dream Shake"
// Post-move decision tree: fakes, pivots, and spins that react to the defender.
// Triggers on ~18% of Akeem's post scoring actions (6-12 ft, half-court only).
// Improves shot quality by 1-2 contest levels, boosts foul-drawing, slightly
// raises block risk.
export function checkDreamShake(shooter, distToBasket, nearestDef, isFastBreak) {
  if (shooter.name !== 'Akeem Olajuwon') return null;
  if (isFastBreak) return null;
  // Low/mid post only (6-12 ft ≈ 55-125 px). Excludes dunks (d < 55).
  if (distToBasket < 55 || distToBasket > 125) return null;

  if (Math.random() > 0.18) return null;

  // Defender quality determines how badly he bites on the fakes
  const defPostRating = (nearestDef && nearestDef.player && nearestDef.player.postDef) || 50;
  let contestBoost;
  let defenderBit;
  if (defPostRating >= 85) {
    // Elite post defender stays balanced — only 1 level improvement
    contestBoost = 1;
    defenderBit = false;
  } else if (defPostRating < 65) {
    // Poor/aggressive defender bites hard — 2 levels, high foul chance
    contestBoost = 2;
    defenderBit = true;
  } else {
    contestBoost = Math.random() < 0.5 ? 1 : 2;
    defenderBit = contestBoost === 2;
  }

  const variants = ['baseline_spin', 'middle_hook', 'up_and_under', 'turnaround', 'step_through'];
  const variant = variants[Math.floor(Math.random() * variants.length)];

  return { contestBoost, variant, defenderBit };
}

// Isiah Thomas — "Zeke Split"
// Hesitation / crossover / split-the-defense move from the perimeter.
// Triggers on ~12-18% of Isiah's scoring/creation actions when he has the ball
// above the arc or on the wing (half-court, 90-260 px). Improves contest level
// (defender bites on the crossover), raises foul chance, and selects from
// signature split finish variations (scoop, finger roll, runner, pull-up).
export function checkZekeSplit(shooter, distToBasket, nearestDef, isFastBreak, shotClock) {
  if (shooter.name !== 'Isiah Thomas') return null;
  if (isFastBreak) return null;
  if (distToBasket < 90 || distToBasket > 260) return null;

  // More likely to deploy as the shot clock winds down
  const triggerChance = shotClock <= 14 ? 0.18 : 0.10;
  if (Math.random() > triggerChance) return null;

  const defPerim = (nearestDef && nearestDef.player && nearestDef.player.perimeterDef) || 50;
  let contestBoost;
  let defenderBit;
  if (defPerim >= 90) {
    contestBoost = 1;
    defenderBit = false;
  } else if (defPerim < 65) {
    contestBoost = 2;
    defenderBit = true;
  } else {
    contestBoost = Math.random() < 0.5 ? 1 : 2;
    defenderBit = contestBoost === 2;
  }

  const variants = ['scoop', 'runner', 'pull_up', 'finger_roll'];
  const variant = variants[Math.floor(Math.random() * variants.length)];

  return { contestBoost, variant, defenderBit };
}

// Adrian Dantley — "Pump-Fake Parade"
// Low-post / mid-post isolation with shoulder fakes and pump fakes.
// Triggers on ~22% of Dantley's post scoring actions (55-150 px, half-court).
// Major foul-drawing bonus (Dantley's DRAW-FOUL is elite), strong close-range
// scoring, low three-point tendency. Less effective against elite disciplined
// post defenders.
export function checkPumpFakeParade(shooter, distToBasket, nearestDef, isFastBreak) {
  if (shooter.name !== 'Adrian Dantley') return null;
  if (isFastBreak) return null;
  if (distToBasket < 55 || distToBasket > 150) return null;
  if (Math.random() > 0.22) return null;

  const defPost = (nearestDef && nearestDef.player && nearestDef.player.postDef) || 50;
  let contestBoost;
  let defenderBit;
  if (defPost >= 88) {
    // Disciplined defender stays down — only 1 level, low foul chance
    contestBoost = 1;
    defenderBit = false;
  } else if (defPost < 65) {
    // Aggressive defender bites hard — 2 levels, high foul chance
    contestBoost = 2;
    defenderBit = true;
  } else {
    contestBoost = Math.random() < 0.5 ? 1 : 2;
    defenderBit = contestBoost === 2;
  }

  const variants = ['short_jumper', 'step_through', 'up_and_under', 'baseline_turnaround'];
  const variant = variants[Math.floor(Math.random() * variants.length)];

  return { contestBoost, variant, defenderBit };
}

// Dominique Wilkins — "Human Highlight Film"
// Wing catch → first step → baseline explosion → dunk/layup/foul draw.
// Triggers on ~18% of Dominique's half-court scoring actions and ~35% in
// transition (runway!). Improves contest level (explosive first step creates
// separation), boosts dunk probability, raises foul-drawing chance, and
// produces a large momentum swing on makes. Slightly raises charge risk
// against set defense. Does NOT guarantee a make.
export function checkHumanHighlight(shooter, distToBasket, nearestDef, isFastBreak, shotClock) {
  if (shooter.name !== 'Dominique Wilkins') return null;
  // Triggers from the wing (90-280px) or near the rim on putbacks/breaks
  if (distToBasket > 280) return null;

  // Higher trigger chance in transition (runway!) and late clock
  let triggerChance;
  if (isFastBreak) triggerChance = 0.35;
  else if (shotClock <= 10) triggerChance = 0.22;
  else triggerChance = 0.16;

  if (Math.random() > triggerChance) return null;

  // Defender quality determines how badly he bites on the first step
  const defPerim = (nearestDef && nearestDef.player && nearestDef.player.perimeterDef) || 50;
  let contestBoost;
  let defenderBit;
  if (defPerim >= 88) {
    // Elite perimeter defender stays in front — only 1 level improvement
    contestBoost = 1;
    defenderBit = false;
  } else if (defPerim < 65) {
    // Poor/aggressive defender gets blown by — 2 levels, high foul chance
    contestBoost = 2;
    defenderBit = true;
  } else {
    contestBoost = Math.random() < 0.5 ? 1 : 2;
    defenderBit = contestBoost === 2;
  }

  // Branch selection based on context — transition runway vs half-court
  const variants = isFastBreak
    ? ['breakaway_dunk', 'windmill_dunk', 'power_drive', 'reverse_layup']
    : distToBasket < 85
      ? ['baseline_dunk', 'power_dunk', 'finger_roll', 'putback_dunk']
      : ['power_drive', 'baseline_drive', 'pullup_jumper', 'turnaround_jumper'];
  const variant = variants[Math.floor(Math.random() * variants.length)];

  return { contestBoost, variant, defenderBit, isHighlight: true };
}

// Mark Aguirre — "Power Wing Work"
// Mid-post bully scoring package: shoulder fakes, turnaround jumpers, power
// drives, and lean-in foul draws. Triggers on ~18% of Aguirre's wing/mid-post
// actions (55-220px, half-court). Improves contest level (defender bites on
// power moves), boosts foul-drawing significantly, slightly raises strip risk.
export function checkPowerWingWork(shooter, distToBasket, nearestDef, isFastBreak, shotClock) {
  if (shooter.name !== 'Mark Aguirre') return null;
  if (isFastBreak) return null;
  if (distToBasket < 55 || distToBasket > 220) return null;

  const triggerChance = shotClock <= 10 ? 0.25 : 0.16;
  if (Math.random() > triggerChance) return null;

  const defRating = (nearestDef && nearestDef.player && (nearestDef.player.postDef || nearestDef.player.perimeterDef)) || 50;
  let contestBoost;
  let defenderBit;
  if (defRating >= 85) {
    contestBoost = 1;
    defenderBit = false;
  } else if (defRating < 65) {
    contestBoost = 2;
    defenderBit = true;
  } else {
    contestBoost = Math.random() < 0.5 ? 1 : 2;
    defenderBit = contestBoost === 2;
  }

  const variants = ['mid_post_bully', 'shoulder_fake_jumper', 'turnaround', 'baseline_power', 'lean_in_foul'];
  const variant = variants[Math.floor(Math.random() * variants.length)];

  return { contestBoost, variant, defenderBit };
}

// Rolando Blackman — "Silky Pull-Up"
// Smooth midrange scoring: one-dribble pull-ups, elbow/baseline jumpers.
// Triggers on ~15% of Blackman's mid-range actions (120-220px, half-court).
// Improves shot quality (1-2 levels), very low turnover risk.
export function checkSilkyPullUp(shooter, distToBasket, nearestDef, isFastBreak) {
  if (shooter.name !== 'Rolando Blackman') return null;
  if (isFastBreak) return null;
  if (distToBasket < 120 || distToBasket > 220) return null;
  if (Math.random() > 0.15) return null;

  const defRating = (nearestDef && nearestDef.player && nearestDef.player.perimeterDef) || 50;
  let contestBoost;
  let defenderBit;
  if (defRating >= 90) {
    contestBoost = 1;
    defenderBit = false;
  } else {
    contestBoost = Math.random() < 0.6 ? 2 : 1;
    defenderBit = contestBoost === 2;
  }

  const variants = ['one_dribble_pullup', 'elbow_jumper', 'baseline_jumper', 'catch_and_shoot', 'foul_line_jumper'];
  const variant = variants[Math.floor(Math.random() * variants.length)];

  return { contestBoost, variant, defenderBit };
}

// Sam Perkins — "Lefty Face-Up"
// Face-up jumper and pick-and-pop from the lefty big. Triggers on ~15% of
// Perkins' elbow/short-corner actions (120-220px, half-court). Improves shot
// quality, pulls opposing bigs away from the rim.
export function checkLeftyFaceUp(shooter, distToBasket, nearestDef, isFastBreak) {
  if (shooter.name !== 'Sam Perkins') return null;
  if (isFastBreak) return null;
  if (distToBasket < 120 || distToBasket > 220) return null;
  if (Math.random() > 0.15) return null;

  const defRating = (nearestDef && nearestDef.player && (nearestDef.player.postDef || nearestDef.player.perimeterDef)) || 50;
  let contestBoost;
  let defenderBit;
  if (defRating >= 85) {
    contestBoost = 1;
    defenderBit = false;
  } else {
    contestBoost = Math.random() < 0.5 ? 1 : 2;
    defenderBit = contestBoost === 2;
  }

  const variants = ['lefty_jumper', 'pick_and_pop', 'one_dribble_drive', 'short_bank'];
  const variant = variants[Math.floor(Math.random() * variants.length)];

  return { contestBoost, variant, defenderBit };
}

// --- Vinnie Johnson — "Microwave Mode" ---
// Vinnie heats up after consecutive makes. While active, his shot-selection
// weight rises for a short stretch (~5 possessions). Missing cools him off.
// Returns the new active state.
export function updateMicrowaveMode(state, shooter, made) {
  if (!state.microwaveMode) state.microwaveMode = { fgStreak: 0, active: false, possessions: 0 };
  const mw = state.microwaveMode;

  if (shooter.name === 'Vinnie Johnson') {
    if (made) {
      mw.fgStreak = (mw.fgStreak || 0) + 1;
      if (mw.fgStreak >= 2 && !mw.active) {
        mw.active = true;
        mw.possessions = 5;
        state.gameLog.unshift('🔥 Vinnie Johnson is heating up — MICROWAVE MODE!');
        if (state.gameLog.length > 15) state.gameLog.pop();
      }
    } else if (mw.active) {
      mw.fgStreak = Math.max(0, (mw.fgStreak || 0) - 1);
      if (mw.fgStreak <= 0) {
        mw.active = false;
      }
    }
  }

  return mw.active;
}

// Decrement the microwave possession counter on each possession change.
export function tickMicrowaveMode(state) {
  if (!state.microwaveMode || !state.microwaveMode.active) return;
  state.microwaveMode.possessions = Math.max(0, (state.microwaveMode.possessions || 0) - 1);
  if (state.microwaveMode.possessions <= 0) {
    state.microwaveMode.active = false;
    state.microwaveMode.fgStreak = 0;
  }
}

// Scoring-weight multiplier for Microwave Mode (applied in starEngine).
// Vinnie gets +35% shot-selection weight while hot; everyone else is unaffected.
export function microwaveWeightBoost(state, player) {
  if (!state.microwaveMode || !state.microwaveMode.active) return 1.0;
  if (player.name !== 'Vinnie Johnson') return 1.0;
  return 1.35;
}