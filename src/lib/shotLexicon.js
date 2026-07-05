// shotLexicon.js — Expanded 1986-87 shot system.
// 12 core shot families with descriptive variations for commentary and animation.
// The variation supplies personality (text + minor modifiers). The player rating,
// location, defensive contest, and situation still determine whether it goes in.

// --- Zone thresholds (aligned with gameEngine distance checks) ---
function getShotZone(distToBasket, isThree) {
  if (isThree) return 'three';
  if (distToBasket < 60) return 'rim';
  if (distToBasket < 120) return 'short_mid';
  return 'mid';
}

const TIER_WEIGHT = { primary: 4, secondary: 1.5, rare: 0.4 };

// --- Family probability modifiers (small additive adjustments) ---
const FAMILIES = {
  LAYUP: 0, DUNK: 0.04, PUTBACK: -0.03, HOOK: -0.01,
  POST_JUMPER: -0.01, SHORT_PUSH_SHOT: -0.01, CATCH_AND_SHOOT: 0.02,
  PULL_UP_JUMPER: -0.01, MOVING_JUMPER: -0.03, BANK_SHOT: 0,
  THREE_POINTER: 0, DESPERATION_SHOT: -0.20,
};

// --- Variation definitions ---
// mods: { probMod, blockChanceMod, reducesRearContest }
export const VARIATIONS = {
  // === LAYUPS ===
  DRIVING_LAYUP: { family: 'LAYUP', zones: ['rim','short_mid'], make: 'drives and lays it in', log: 'driving layup', miss: 'driving layup' },
  STANDING_LAYUP: { family: 'LAYUP', zones: ['rim'], make: 'lays it in through traffic', log: 'standing layup', miss: 'standing layup', mods: { blockChanceMod: 0.03 } },
  REVERSE_LAYUP: { family: 'LAYUP', zones: ['rim'], make: 'reverses it off the glass', log: 'reverse layup', miss: 'reverse layup', mods: { reducesRearContest: true } },
  SCOOP_LAYUP: { family: 'LAYUP', zones: ['rim'], make: 'scoops it up and in', log: 'scoop layup', miss: 'scoop layup', mods: { blockChanceMod: -0.02 } },
  FINGER_ROLL: { family: 'LAYUP', zones: ['rim'], make: 'rolls it off the fingertips', log: 'finger roll', miss: 'finger roll' },
  SPIN_LAYUP: { family: 'LAYUP', zones: ['rim'], make: 'spins and finishes', log: 'spin layup', miss: 'spin layup' },
  STEP_THROUGH_LAYUP: { family: 'LAYUP', zones: ['rim'], make: 'steps through and finishes', log: 'step-through layup', miss: 'step-through layup' },
  DROP_STEP_LAYUP: { family: 'LAYUP', zones: ['rim','short_mid'], make: 'drop-steps and lays it in', log: 'drop-step layup', miss: 'drop-step layup' },
  BASELINE_LAYUP: { family: 'LAYUP', zones: ['rim','short_mid'], make: 'glides baseline for the layup', log: 'baseline layup', miss: 'baseline layup' },
  FAST_BREAK_LAYUP: { family: 'LAYUP', zones: ['rim'], make: 'takes it coast-to-coast for the layup', log: 'fast-break layup', miss: 'fast-break layup' },
  CUTTING_LAYUP: { family: 'LAYUP', zones: ['rim'], make: 'cuts and catches for the layup', log: 'cutting layup', miss: 'cutting layup' },
  ALLEY_OOP_LAYUP: { family: 'LAYUP', zones: ['rim'], make: 'taps in the alley-oop', log: 'alley-oop layup', miss: 'alley-oop layup' },
  POWER_LAYUP: { family: 'LAYUP', zones: ['rim'], make: 'powers up and lays it in', log: 'power layup', miss: 'power layup' },

  // === DUNKS ===
  ONE_HAND_DUNK: { family: 'DUNK', zones: ['rim'], make: 'throws it down one-handed', log: 'one-hand dunk', miss: 'one-hand dunk' },
  TWO_HAND_DUNK: { family: 'DUNK', zones: ['rim'], make: 'throws it down with two hands', log: 'two-hand dunk', miss: 'two-hand dunk', mods: { blockChanceMod: -0.02 } },
  POWER_DUNK: { family: 'DUNK', zones: ['rim'], make: 'powers it down with authority', log: 'power dunk', miss: 'power dunk' },
  RUNNING_DUNK: { family: 'DUNK', zones: ['rim'], make: 'comes flying in for the slam', log: 'running dunk', miss: 'running dunk' },
  REVERSE_DUNK: { family: 'DUNK', zones: ['rim'], make: 'spins and reverse-dunks it', log: 'reverse dunk', miss: 'reverse dunk' },
  PUTBACK_DUNK: { family: 'PUTBACK', zones: ['rim'], make: 'cleans the glass with a putback slam', log: 'putback dunk', miss: 'putback dunk' },
  ALLEY_OOP_DUNK: { family: 'DUNK', zones: ['rim'], make: 'catches the alley-oop and throws it down', log: 'alley-oop dunk', miss: 'alley-oop dunk' },
  BASELINE_DUNK: { family: 'DUNK', zones: ['rim'], make: 'drives baseline and slams it', log: 'baseline dunk', miss: 'baseline dunk' },
  BREAKAWAY_DUNK: { family: 'DUNK', zones: ['rim'], make: 'goes unchallenged for the breakaway slam', log: 'breakaway dunk', miss: 'breakaway dunk' },
  TRAFFIC_DUNK: { family: 'DUNK', zones: ['rim'], make: 'throws it down through traffic', log: 'traffic dunk', miss: 'traffic dunk', mods: { probMod: -0.08, blockChanceMod: 0.04 } },
  STANDING_DUNK: { family: 'DUNK', zones: ['rim'], make: 'rises and stuffs it home', log: 'standing dunk', miss: 'standing dunk' },
  CUTTING_DUNK: { family: 'DUNK', zones: ['rim'], make: 'cuts and throws it down', log: 'cutting dunk', miss: 'cutting dunk' },

  // === PUTBACKS ===
  TIP_IN: { family: 'PUTBACK', zones: ['rim'], make: 'tips it back in', log: 'tip-in', miss: 'tip-in' },
  TAP_IN: { family: 'PUTBACK', zones: ['rim'], make: 'taps it home', log: 'tap-in', miss: 'tap-in' },
  PUTBACK_LAYUP: { family: 'PUTBACK', zones: ['rim'], make: 'grabs the board and lays it back in', log: 'putback layup', miss: 'putback layup' },
  FOLLOW_OWN_MISS: { family: 'PUTBACK', zones: ['rim'], make: 'follows his own miss and converts', log: 'follow-own-miss finish', miss: 'follow-up attempt' },
  OFFENSIVE_REBOUND_BANK: { family: 'PUTBACK', zones: ['rim','short_mid'], make: 'banks the putback in', log: 'offensive rebound bank', miss: 'putback bank' },
  OFFENSIVE_REBOUND_HOOK: { family: 'PUTBACK', zones: ['rim','short_mid'], make: 'hooks the putback in', log: 'offensive rebound hook', miss: 'putback hook' },

  // === HOOKS ===
  BABY_HOOK: { family: 'HOOK', zones: ['rim','short_mid'], make: 'flips in the baby hook', log: 'baby hook', miss: 'baby hook' },
  JUMP_HOOK: { family: 'HOOK', zones: ['rim','short_mid'], make: 'rises for the jump hook', log: 'jump hook', miss: 'jump hook', mods: { blockChanceMod: -0.03 } },
  RUNNING_HOOK: { family: 'HOOK', zones: ['rim','short_mid'], make: 'floats in the running hook', log: 'running hook', miss: 'running hook' },
  TURNAROUND_HOOK: { family: 'HOOK', zones: ['short_mid'], make: 'turns and hooks it in', log: 'turnaround hook', miss: 'turnaround hook' },
  SKYHOOK: { family: 'HOOK', zones: ['rim','short_mid'], make: 'unleashes the skyhook', log: 'SKYHOOK', miss: 'skyhook', mods: { blockChanceMod: -0.05 }, isKareemSignature: true },
  JUNIOR_SKYHOOK: { family: 'HOOK', zones: ['rim','short_mid'], make: 'floats the junior skyhook', log: 'junior skyhook', miss: 'junior skyhook', mods: { blockChanceMod: -0.04 }, isMagicSignature: true },
  SHORT_HOOK: { family: 'HOOK', zones: ['rim','short_mid'], make: 'hooks it in from short range', log: 'short hook', miss: 'short hook' },
  HOOK_OFF_GLASS: { family: 'HOOK', zones: ['short_mid'], make: 'banks the hook off the glass', log: 'hook off glass', miss: 'hook off glass' },

  // === POST JUMPERS ===
  TURNAROUND_JUMPER: { family: 'POST_JUMPER', zones: ['short_mid','mid'], make: 'turns and hits the turnaround', log: 'turnaround jumper', miss: 'turnaround jumper' },
  TURNAROUND_FADEAWAY: { family: 'POST_JUMPER', zones: ['short_mid','mid'], make: 'fades away and buries it', log: 'turnaround fadeaway', miss: 'turnaround fadeaway', mods: { blockChanceMod: -0.04, probMod: -0.03 } },
  BASELINE_FADEAWAY: { family: 'POST_JUMPER', zones: ['short_mid','mid'], make: 'fades along the baseline and connects', log: 'baseline fadeaway', miss: 'baseline fadeaway', mods: { blockChanceMod: -0.04, probMod: -0.03 } },
  MIDDLE_FADEAWAY: { family: 'POST_JUMPER', zones: ['short_mid','mid'], make: 'fades to the middle and drains it', log: 'middle fadeaway', miss: 'middle fadeaway', mods: { blockChanceMod: -0.04, probMod: -0.03 } },
  FACE_UP_JUMPER: { family: 'POST_JUMPER', zones: ['short_mid','mid'], make: 'faces up and drains the jumper', log: 'face-up jumper', miss: 'face-up jumper' },
  ONE_DRIBBLE_TURNAROUND: { family: 'POST_JUMPER', zones: ['short_mid','mid'], make: 'one dribble, turns, and fires', log: 'one-dribble turnaround', miss: 'one-dribble turnaround' },
  SPIN_JUMPER: { family: 'POST_JUMPER', zones: ['short_mid','mid'], make: 'spins and rises for the jumper', log: 'spin jumper', miss: 'spin jumper' },
  TURNAROUND_BANK: { family: 'POST_JUMPER', zones: ['short_mid','mid'], make: 'turns and banks it in', log: 'turnaround bank', miss: 'turnaround bank' },

  // === SHORT PUSH SHOTS ===
  PUSH_SHOT: { family: 'SHORT_PUSH_SHOT', zones: ['rim','short_mid'], make: 'pushes it in', log: 'push shot', miss: 'push shot' },
  SHOVEL_SHOT: { family: 'SHORT_PUSH_SHOT', zones: ['rim','short_mid'], make: 'shovels it in', log: 'shovel shot', miss: 'shovel shot' },
  SHORT_BANKER: { family: 'SHORT_PUSH_SHOT', zones: ['rim','short_mid'], make: 'banks in the short one', log: 'short banker', miss: 'short banker' },
  LANE_FLIP: { family: 'SHORT_PUSH_SHOT', zones: ['rim','short_mid'], make: 'flips it in over the defense', log: 'lane flip', miss: 'lane flip' },
  SOFT_TURNAROUND: { family: 'SHORT_PUSH_SHOT', zones: ['short_mid'], make: 'soft turnaround finds the rim', log: 'soft turnaround', miss: 'soft turnaround' },
  HALF_HOOK: { family: 'SHORT_PUSH_SHOT', zones: ['rim','short_mid'], make: 'flips in the half hook', log: 'half hook', miss: 'half hook' },

  // === CATCH AND SHOOT ===
  SPOT_UP_JUMPER: { family: 'CATCH_AND_SHOOT', zones: ['mid','short_mid'], make: 'catches and drains the jumper', log: 'spot-up jumper', miss: 'spot-up jumper' },
  BASELINE_JUMPER: { family: 'CATCH_AND_SHOOT', zones: ['mid'], make: 'knocks down the baseline jumper', log: 'baseline jumper', miss: 'baseline jumper' },
  ELBOW_JUMPER: { family: 'CATCH_AND_SHOOT', zones: ['mid'], make: 'hits it from the elbow', log: 'elbow jumper', miss: 'elbow jumper' },
  CORNER_JUMPER: { family: 'CATCH_AND_SHOOT', zones: ['mid'], make: 'drains the corner jumper', log: 'corner jumper', miss: 'corner jumper' },
  FT_LINE_JUMPER: { family: 'CATCH_AND_SHOOT', zones: ['mid'], make: 'pulls up from the free-throw line', log: 'free-throw-line jumper', miss: 'FT-line jumper' },
  TRAIL_JUMPER: { family: 'CATCH_AND_SHOOT', zones: ['mid'], make: 'trails and hits the jumper', log: 'trailer jumper', miss: 'trailer jumper' },
  PICK_AND_POP_JUMPER: { family: 'CATCH_AND_SHOOT', zones: ['mid'], make: 'pops and drains it', log: 'pick-and-pop jumper', miss: 'pick-and-pop jumper' },

  // === PULL-UP JUMPERS ===
  PULL_UP_JUMPER: { family: 'PULL_UP_JUMPER', zones: ['mid'], make: 'pulls up and drains the jumper', log: 'pull-up jumper', miss: 'pull-up jumper' },
  ONE_DRIBBLE_PULL_UP: { family: 'PULL_UP_JUMPER', zones: ['mid'], make: 'one dribble and pulls up for the jumper', log: 'pull-up jumper', miss: 'pull-up jumper' },
  TWO_DRIBBLE_PULL_UP: { family: 'PULL_UP_JUMPER', zones: ['mid'], make: 'creates space and pulls up', log: 'pull-up jumper', miss: 'pull-up jumper' },
  TRANSITION_PULL_UP: { family: 'PULL_UP_JUMPER', zones: ['mid'], make: 'pulls up in transition and buries it', log: 'transition pull-up', miss: 'transition pull-up' },
  PICK_AND_ROLL_PULL_UP: { family: 'PULL_UP_JUMPER', zones: ['mid'], make: 'comes off the screen and pulls up', log: 'pick-and-roll pull-up', miss: 'pick-and-roll pull-up' },
  ELBOW_PULL_UP: { family: 'PULL_UP_JUMPER', zones: ['mid'], make: 'pulls up at the elbow and connects', log: 'elbow pull-up', miss: 'elbow pull-up' },
  BASELINE_PULL_UP: { family: 'PULL_UP_JUMPER', zones: ['mid'], make: 'pulls up along the baseline', log: 'baseline pull-up', miss: 'baseline pull-up' },
  STOP_AND_POP: { family: 'PULL_UP_JUMPER', zones: ['mid','short_mid'], make: 'stops and pops for the jumper', log: 'stop-and-pop', miss: 'stop-and-pop' },

  // === MOVING JUMPERS ===
  FADEAWAY_JUMPER: { family: 'MOVING_JUMPER', zones: ['mid'], make: 'creates space and fades away for the jumper', log: 'fadeaway jumper', miss: 'fadeaway jumper', mods: { blockChanceMod: -0.04, probMod: -0.03 } },
  LEANING_JUMPER: { family: 'MOVING_JUMPER', zones: ['mid'], make: 'leans in and hits the jumper', log: 'leaning jumper', miss: 'leaning jumper' },
  RUNNING_JUMPER: { family: 'MOVING_JUMPER', zones: ['short_mid','mid'], make: 'hits the running jumper', log: 'running jumper', miss: 'running jumper' },
  OFF_BALANCE_JUMPER: { family: 'MOVING_JUMPER', zones: ['mid'], make: 'hits the off-balance jumper', log: 'off-balance jumper', miss: 'off-balance jumper', mods: { probMod: -0.05 } },
  BUZZER_BEATER_FLIP: { family: 'MOVING_JUMPER', zones: ['mid','three'], make: 'flips it up at the buzzer', log: 'buzzer-beater flip', miss: 'buzzer-beater flip' },

  // === THREE-POINTERS ===
  CORNER_THREE: { family: 'THREE_POINTER', zones: ['three'], make: 'drains the corner three', log: 'corner three', miss: 'corner three' },
  WING_THREE: { family: 'THREE_POINTER', zones: ['three'], make: 'hits the wing three', log: 'wing three', miss: 'wing three' },
  TOP_OF_KEY_THREE: { family: 'THREE_POINTER', zones: ['three'], make: 'buries it from the top of the key', log: 'top-of-key three', miss: 'top-of-key three' },
  TRAIL_THREE: { family: 'THREE_POINTER', zones: ['three'], make: 'trails and hits the three', log: 'trailer three', miss: 'trailer three' },
  SPOT_UP_THREE: { family: 'THREE_POINTER', zones: ['three'], make: 'catches and buries the three', log: 'spot-up three', miss: 'spot-up three' },
  TRANSITION_THREE: { family: 'THREE_POINTER', zones: ['three'], make: 'pulls up in transition for three', log: 'transition three', miss: 'transition three' },
  PULL_UP_THREE: { family: 'THREE_POINTER', zones: ['three'], make: 'pulls up from deep and drills it', log: 'pull-up three', miss: 'pull-up three' },
  DEEP_THREE: { family: 'THREE_POINTER', zones: ['three'], make: 'drills the deep three', log: 'deep three', miss: 'deep three' },

  // === DESPERATION SHOTS ===
  HALF_COURT_HEAVE: { family: 'DESPERATION_SHOT', zones: ['three'], make: 'launches from half court and IT FALLS!', log: 'half-court heave', miss: 'half-court heave' },
  BACKCOURT_HEAVE: { family: 'DESPERATION_SHOT', zones: ['three'], make: 'flings it from the backcourt', log: 'backcourt heave', miss: 'backcourt heave' },
  TURNAROUND_HEAVE: { family: 'DESPERATION_SHOT', zones: ['three'], make: 'turns and heaves it', log: 'turnaround heave', miss: 'turnaround heave' },
  FALLING_HEAVE: { family: 'DESPERATION_SHOT', zones: ['three'], make: 'falls away and flings it up', log: 'falling heave', miss: 'falling heave' },
  QUICK_FLIP: { family: 'DESPERATION_SHOT', zones: ['three','mid'], make: 'flips it up at the horn', log: 'quick flip', miss: 'quick flip' },
  DESPERATION_THREE: { family: 'DESPERATION_SHOT', zones: ['three'], make: 'chucks up a desperation three', log: 'desperation three', miss: 'desperation three' },
};

// --- Dream Shake branch → variation mapping ---
export const DREAM_SHAKE_VARIATIONS = {
  baseline_spin: ['BASELINE_LAYUP', 'REVERSE_LAYUP', 'BASELINE_DUNK'],
  middle_hook: ['JUMP_HOOK', 'BABY_HOOK'],
  up_and_under: ['STEP_THROUGH_LAYUP', 'SCOOP_LAYUP'],
  turnaround: ['TURNAROUND_FADEAWAY'],
  step_through: ['STEP_THROUGH_LAYUP'],
};

// --- Zeke Split branch → variation mapping (Isiah Thomas) ---
export const ZEKE_SPLIT_VARIATIONS = {
  scoop: ['SCOOP_LAYUP', 'FINGER_ROLL'],
  runner: ['RUNNING_JUMPER', 'STOP_AND_POP'],
  pull_up: ['PULL_UP_JUMPER', 'ONE_DRIBBLE_PULL_UP'],
  finger_roll: ['FINGER_ROLL', 'SCOOP_LAYUP'],
};

// --- Pump-Fake Parade branch → variation mapping (Adrian Dantley) ---
export const PUMP_FAKE_VARIATIONS = {
  short_jumper: ['SHORT_BANKER', 'FACE_UP_JUMPER'],
  step_through: ['STEP_THROUGH_LAYUP', 'POWER_LAYUP'],
  up_and_under: ['STEP_THROUGH_LAYUP', 'SCOOP_LAYUP'],
  baseline_turnaround: ['BASELINE_FADEAWAY', 'TURNAROUND_JUMPER'],
};

// --- Human Highlight Film branch → variation mapping (Dominique Wilkins) ---
// Dominique's signature: wing catch → first step → baseline explosion → dunk/layup/foul.
export const HUMAN_HIGHLIGHT_VARIATIONS = {
  breakaway_dunk: ['BREAKAWAY_DUNK', 'RUNNING_DUNK', 'ONE_HAND_DUNK'],
  windmill_dunk: ['POWER_DUNK', 'TWO_HAND_DUNK', 'ONE_HAND_DUNK'],
  power_drive: ['POWER_DUNK', 'POWER_LAYUP', 'BASELINE_LAYUP'],
  reverse_layup: ['REVERSE_LAYUP', 'REVERSE_DUNK'],
  baseline_dunk: ['BASELINE_DUNK', 'BASELINE_LAYUP'],
  power_dunk: ['POWER_DUNK', 'TWO_HAND_DUNK', 'ONE_HAND_DUNK'],
  finger_roll: ['FINGER_ROLL', 'SCOOP_LAYUP'],
  putback_dunk: ['PUTBACK_DUNK', 'TIP_IN'],
  baseline_drive: ['BASELINE_LAYUP', 'BASELINE_DUNK'],
  pullup_jumper: ['PULL_UP_JUMPER', 'ONE_DRIBBLE_PULL_UP'],
  turnaround_jumper: ['TURNAROUND_JUMPER', 'TURNAROUND_FADEAWAY'],
};

// --- Per-player shot packages (zone → [variationKey, tier]) ---
const PLAYER_PACKAGES = {
  // ===== LAKERS =====
  'Magic Johnson': {
    rim: [['DRIVING_LAYUP','primary'],['SCOOP_LAYUP','primary'],['FINGER_ROLL','primary'],['FAST_BREAK_LAYUP','primary'],['STEP_THROUGH_LAYUP','primary'],['REVERSE_LAYUP','secondary'],['POWER_LAYUP','secondary'],['ONE_HAND_DUNK','secondary'],['JUNIOR_SKYHOOK','rare']],
    short_mid: [['SHORT_BANKER','primary'],['TURNAROUND_JUMPER','secondary'],['RUNNING_HOOK','rare'],['JUNIOR_SKYHOOK','rare']],
    mid: [['ELBOW_PULL_UP','secondary'],['STOP_AND_POP','secondary'],['ONE_DRIBBLE_PULL_UP','secondary']],
    three: [['SPOT_UP_THREE','rare'],['TRANSITION_THREE','rare']],
  },
  'Byron Scott': {
    rim: [['DRIVING_LAYUP','primary'],['FAST_BREAK_LAYUP','primary'],['FINGER_ROLL','secondary'],['REVERSE_LAYUP','secondary']],
    short_mid: [['STOP_AND_POP','primary'],['RUNNING_JUMPER','secondary']],
    mid: [['SPOT_UP_JUMPER','primary'],['ELBOW_PULL_UP','primary'],['BASELINE_JUMPER','secondary'],['ONE_DRIBBLE_PULL_UP','secondary'],['STOP_AND_POP','secondary']],
    three: [['SPOT_UP_THREE','primary'],['CORNER_THREE','secondary'],['WING_THREE','secondary']],
  },
  'James Worthy': {
    rim: [['FAST_BREAK_LAYUP','primary'],['RUNNING_DUNK','primary'],['BASELINE_LAYUP','primary'],['FINGER_ROLL','primary'],['CUTTING_LAYUP','primary'],['REVERSE_LAYUP','secondary'],['POWER_DUNK','secondary'],['BASELINE_DUNK','secondary'],['PUTBACK_LAYUP','secondary']],
    short_mid: [['TURNAROUND_JUMPER','secondary'],['BASELINE_FADEAWAY','secondary'],['SHORT_BANKER','secondary']],
    mid: [['ONE_DRIBBLE_PULL_UP','secondary'],['TRAIL_JUMPER','rare']],
    three: [['SPOT_UP_THREE','rare']],
  },
  'A.C. Green': {
    rim: [['PUTBACK_LAYUP','primary'],['CUTTING_LAYUP','primary'],['DROP_STEP_LAYUP','primary'],['TIP_IN','secondary'],['PUTBACK_DUNK','secondary'],['RUNNING_DUNK','secondary']],
    short_mid: [['FACE_UP_JUMPER','primary'],['SHORT_BANKER','secondary'],['PICK_AND_POP_JUMPER','secondary']],
    mid: [['PICK_AND_POP_JUMPER','secondary'],['SPOT_UP_JUMPER','secondary']],
    three: [],
  },
  'Kareem Abdul-Jabbar': {
    rim: [['SKYHOOK','primary'],['DROP_STEP_LAYUP','secondary'],['STANDING_DUNK','secondary'],['PUTBACK_LAYUP','secondary'],['TURNAROUND_JUMPER','secondary']],
    short_mid: [['SKYHOOK','primary'],['TURNAROUND_JUMPER','secondary'],['TURNAROUND_BANK','secondary'],['SHORT_BANKER','secondary'],['JUMP_HOOK','secondary']],
    mid: [['FACE_UP_JUMPER','rare'],['TURNAROUND_JUMPER','rare']],
    three: [],
  },
  'Michael Cooper': {
    rim: [['CUTTING_LAYUP','primary'],['FAST_BREAK_LAYUP','primary'],['DRIVING_LAYUP','secondary']],
    short_mid: [['STOP_AND_POP','secondary'],['RUNNING_JUMPER','secondary']],
    mid: [['SPOT_UP_JUMPER','primary'],['BASELINE_JUMPER','secondary'],['CORNER_JUMPER','secondary'],['PULL_UP_JUMPER','secondary'],['TRAIL_JUMPER','secondary']],
    three: [['CORNER_THREE','primary'],['WING_THREE','primary'],['SPOT_UP_THREE','secondary']],
  },
  'Mychal Thompson': {
    rim: [['JUMP_HOOK','primary'],['PUTBACK_LAYUP','primary'],['DROP_STEP_LAYUP','secondary'],['STANDING_DUNK','secondary']],
    short_mid: [['TURNAROUND_JUMPER','primary'],['SHORT_BANKER','primary'],['BABY_HOOK','secondary'],['FACE_UP_JUMPER','secondary']],
    mid: [['PICK_AND_POP_JUMPER','secondary'],['FACE_UP_JUMPER','secondary']],
    three: [],
  },
  'Kurt Rambis': {
    rim: [['PUTBACK_LAYUP','primary'],['TIP_IN','primary'],['CUTTING_LAYUP','primary'],['STANDING_LAYUP','secondary'],['PUTBACK_DUNK','secondary']],
    short_mid: [['SHORT_BANKER','secondary'],['HALF_HOOK','rare']],
    mid: [['SPOT_UP_JUMPER','rare']],
    three: [],
  },
  'Billy Thompson': {
    rim: [['DRIVING_LAYUP','primary'],['RUNNING_DUNK','primary'],['CUTTING_LAYUP','primary'],['PUTBACK_LAYUP','secondary'],['REVERSE_LAYUP','secondary'],['BASELINE_DUNK','secondary']],
    short_mid: [['FACE_UP_JUMPER','secondary']],
    mid: [['SPOT_UP_JUMPER','secondary']],
    three: [],
  },
  'Wes Matthews': {
    rim: [['DRIVING_LAYUP','primary'],['FAST_BREAK_LAYUP','primary'],['SCOOP_LAYUP','secondary']],
    short_mid: [['RUNNING_JUMPER','primary'],['STOP_AND_POP','secondary']],
    mid: [['PULL_UP_JUMPER','primary'],['SPOT_UP_JUMPER','secondary']],
    three: [['SPOT_UP_THREE','rare']],
  },

  // ===== CELTICS =====
  'Dennis Johnson': {
    rim: [['DRIVING_LAYUP','primary'],['SCOOP_LAYUP','secondary'],['POWER_LAYUP','secondary']],
    short_mid: [['TURNAROUND_JUMPER','secondary'],['MIDDLE_FADEAWAY','secondary'],['RUNNING_HOOK','rare']],
    mid: [['ELBOW_PULL_UP','primary'],['ELBOW_JUMPER','primary'],['STOP_AND_POP','secondary'],['BASELINE_JUMPER','secondary'],['RUNNING_JUMPER','secondary']],
    three: [['SPOT_UP_THREE','rare']],
  },
  'Danny Ainge': {
    rim: [['DRIVING_LAYUP','primary'],['FAST_BREAK_LAYUP','secondary'],['REVERSE_LAYUP','secondary']],
    short_mid: [['STOP_AND_POP','secondary'],['RUNNING_JUMPER','secondary']],
    mid: [['SPOT_UP_JUMPER','primary'],['PULL_UP_JUMPER','primary'],['BASELINE_JUMPER','secondary'],['TRAIL_JUMPER','secondary']],
    three: [['SPOT_UP_THREE','primary'],['CORNER_THREE','primary'],['WING_THREE','secondary']],
  },
  'Larry Bird': {
    rim: [['STEP_THROUGH_LAYUP','primary'],['SCOOP_LAYUP','primary'],['CUTTING_LAYUP','secondary'],['FOLLOW_OWN_MISS','rare']],
    short_mid: [['TURNAROUND_FADEAWAY','primary'],['TURNAROUND_JUMPER','primary'],['BASELINE_FADEAWAY','secondary'],['SHORT_BANKER','secondary']],
    mid: [['SPOT_UP_JUMPER','primary'],['PULL_UP_JUMPER','primary'],['ELBOW_JUMPER','secondary'],['TRAIL_JUMPER','secondary'],['FADEAWAY_JUMPER','secondary']],
    three: [['SPOT_UP_THREE','primary'],['WING_THREE','primary'],['CORNER_THREE','secondary'],['DEEP_THREE','rare'],['PULL_UP_THREE','rare']],
  },
  'Kevin McHale': {
    rim: [['STEP_THROUGH_LAYUP','primary'],['DROP_STEP_LAYUP','primary'],['SHOVEL_SHOT','primary'],['POWER_LAYUP','secondary'],['STANDING_DUNK','secondary'],['PUTBACK_LAYUP','secondary']],
    short_mid: [['BABY_HOOK','primary'],['TURNAROUND_FADEAWAY','primary'],['BASELINE_FADEAWAY','secondary'],['JUMP_HOOK','secondary'],['SHORT_BANKER','secondary']],
    mid: [['TURNAROUND_JUMPER','secondary'],['BASELINE_FADEAWAY','secondary']],
    three: [],
  },
  'Robert Parish': {
    rim: [['STANDING_DUNK','primary'],['JUMP_HOOK','primary'],['PUTBACK_LAYUP','secondary'],['DROP_STEP_LAYUP','secondary'],['TIP_IN','secondary']],
    short_mid: [['TURNAROUND_JUMPER','primary'],['JUMP_HOOK','secondary'],['SHORT_BANKER','secondary']],
    mid: [['FACE_UP_JUMPER','primary'],['ELBOW_JUMPER','secondary'],['PICK_AND_POP_JUMPER','secondary']],
    three: [],
  },
  'Jerry Sichting': {
    rim: [['DRIVING_LAYUP','primary'],['SCOOP_LAYUP','secondary']],
    short_mid: [['STOP_AND_POP','secondary'],['RUNNING_JUMPER','secondary']],
    mid: [['SPOT_UP_JUMPER','primary'],['PULL_UP_JUMPER','primary'],['BASELINE_JUMPER','secondary']],
    three: [['SPOT_UP_THREE','secondary']],
  },
  'Bill Walton': {
    rim: [['SHORT_HOOK','primary'],['STANDING_LAYUP','primary'],['PUTBACK_LAYUP','secondary'],['TIP_IN','secondary']],
    short_mid: [['SHORT_BANKER','primary'],['TURNAROUND_JUMPER','secondary'],['HALF_HOOK','secondary']],
    mid: [['FACE_UP_JUMPER','secondary'],['PICK_AND_POP_JUMPER','secondary']],
    three: [],
  },
  'Fred Roberts': {
    rim: [['CUTTING_LAYUP','primary'],['PUTBACK_LAYUP','primary'],['BABY_HOOK','secondary']],
    short_mid: [['SHORT_BANKER','primary'],['BABY_HOOK','secondary']],
    mid: [['PICK_AND_POP_JUMPER','secondary'],['SPOT_UP_JUMPER','secondary']],
    three: [],
  },
  'Darren Daye': {
    rim: [['DRIVING_LAYUP','primary'],['FAST_BREAK_LAYUP','primary'],['CUTTING_LAYUP','secondary']],
    short_mid: [['BASELINE_FADEAWAY','secondary'],['SHORT_BANKER','secondary']],
    mid: [['PULL_UP_JUMPER','secondary'],['BASELINE_JUMPER','secondary']],
    three: [],
  },
  'Greg Kite': {
    rim: [['PUTBACK_LAYUP','primary'],['TIP_IN','primary'],['STANDING_LAYUP','secondary'],['STANDING_DUNK','secondary']],
    short_mid: [['BABY_HOOK','secondary'],['SHORT_BANKER','secondary']],
    mid: [],
    three: [],
  },

  // ===== ROCKETS =====
  'Dirk Minniefield': {
    rim: [['DRIVING_LAYUP','primary'],['FAST_BREAK_LAYUP','primary'],['SCOOP_LAYUP','secondary']],
    short_mid: [['RUNNING_JUMPER','primary'],['STOP_AND_POP','secondary']],
    mid: [['PULL_UP_JUMPER','primary'],['SPOT_UP_JUMPER','secondary']],
    three: [['SPOT_UP_THREE','rare']],
  },
  'Robert Reid': {
    rim: [['DRIVING_LAYUP','secondary']],
    short_mid: [['TURNAROUND_JUMPER','secondary'],['BASELINE_FADEAWAY','secondary']],
    mid: [['PULL_UP_JUMPER','primary'],['SPOT_UP_JUMPER','primary'],['BASELINE_JUMPER','primary'],['STOP_AND_POP','secondary']],
    three: [['SPOT_UP_THREE','primary'],['WING_THREE','secondary']],
  },
  'Rodney McCray': {
    rim: [['DRIVING_LAYUP','primary'],['CUTTING_LAYUP','primary'],['PUTBACK_LAYUP','primary'],['SCOOP_LAYUP','secondary'],['FAST_BREAK_LAYUP','secondary']],
    short_mid: [['TURNAROUND_JUMPER','secondary'],['SHORT_BANKER','secondary'],['FACE_UP_JUMPER','secondary']],
    mid: [['SPOT_UP_JUMPER','secondary']],
    three: [['SPOT_UP_THREE','rare']],
  },
  'Ralph Sampson': {
    rim: [['STANDING_DUNK','primary'],['CUTTING_DUNK','primary'],['TIP_IN','secondary'],['PUTBACK_DUNK','secondary'],['DROP_STEP_LAYUP','secondary']],
    short_mid: [['JUMP_HOOK','primary'],['TURNAROUND_JUMPER','primary'],['FACE_UP_JUMPER','secondary'],['BABY_HOOK','secondary']],
    mid: [['FACE_UP_JUMPER','primary'],['PICK_AND_POP_JUMPER','secondary'],['TURNAROUND_JUMPER','secondary']],
    three: [],
  },
  'Akeem Olajuwon': {
    rim: [['BASELINE_DUNK','primary'],['BASELINE_LAYUP','primary'],['POWER_DUNK','secondary'],['PUTBACK_DUNK','secondary'],['TIP_IN','secondary'],['REVERSE_LAYUP','rare']],
    short_mid: [['JUMP_HOOK','primary'],['TURNAROUND_FADEAWAY','primary'],['FACE_UP_JUMPER','secondary'],['SHORT_BANKER','secondary'],['DROP_STEP_LAYUP','secondary']],
    mid: [['FACE_UP_JUMPER','secondary'],['TURNAROUND_JUMPER','rare']],
    three: [],
  },
  'Allen Leavell': {
    rim: [['DRIVING_LAYUP','primary'],['FAST_BREAK_LAYUP','primary'],['SCOOP_LAYUP','secondary']],
    short_mid: [['RUNNING_JUMPER','primary'],['STOP_AND_POP','secondary']],
    mid: [['PULL_UP_JUMPER','primary'],['SPOT_UP_JUMPER','secondary']],
    three: [['SPOT_UP_THREE','rare']],
  },
  'Lewis Lloyd': {
    rim: [['DRIVING_LAYUP','primary'],['FAST_BREAK_LAYUP','primary'],['POWER_LAYUP','secondary'],['RUNNING_DUNK','secondary']],
    short_mid: [['STOP_AND_POP','primary'],['BASELINE_FADEAWAY','secondary']],
    mid: [['ONE_DRIBBLE_PULL_UP','primary'],['BASELINE_JUMPER','secondary'],['TURNAROUND_JUMPER','secondary']],
    three: [],
  },
  'Mitchell Wiggins': {
    rim: [['DRIVING_LAYUP','primary'],['SCOOP_LAYUP','primary'],['CUTTING_LAYUP','primary'],['FAST_BREAK_LAYUP','primary'],['FINGER_ROLL','secondary'],['PUTBACK_LAYUP','secondary'],['PUTBACK_DUNK','secondary'],['BASELINE_LAYUP','secondary']],
    short_mid: [['FACE_UP_JUMPER','secondary']],
    mid: [['SPOT_UP_JUMPER','secondary']],
    three: [],
  },
  'Jim Petersen': {
    rim: [['PUTBACK_LAYUP','primary'],['JUMP_HOOK','primary'],['STANDING_DUNK','secondary'],['TIP_IN','secondary']],
    short_mid: [['FACE_UP_JUMPER','primary'],['SHORT_BANKER','primary'],['JUMP_HOOK','secondary']],
    mid: [['PICK_AND_POP_JUMPER','secondary']],
    three: [],
  },
  'Buck Johnson': {
    rim: [['CUTTING_LAYUP','primary'],['FAST_BREAK_LAYUP','primary'],['RUNNING_DUNK','primary'],['PUTBACK_LAYUP','secondary'],['REVERSE_LAYUP','secondary'],['BASELINE_DUNK','secondary']],
    short_mid: [['FACE_UP_JUMPER','secondary']],
    mid: [['SPOT_UP_JUMPER','secondary']],
    three: [],
  },

  // ===== PISTONS =====
  'Isiah Thomas': {
    rim: [['SCOOP_LAYUP','primary'],['FINGER_ROLL','primary'],['DRIVING_LAYUP','primary'],['FAST_BREAK_LAYUP','primary'],['REVERSE_LAYUP','secondary'],['POWER_LAYUP','secondary']],
    short_mid: [['STOP_AND_POP','primary'],['RUNNING_JUMPER','primary'],['SHORT_BANKER','secondary']],
    mid: [['PULL_UP_JUMPER','primary'],['ONE_DRIBBLE_PULL_UP','primary'],['STOP_AND_POP','secondary'],['ELBOW_PULL_UP','secondary']],
    three: [['SPOT_UP_THREE','rare']],
  },
  'Joe Dumars': {
    rim: [['DRIVING_LAYUP','primary'],['CUTTING_LAYUP','secondary'],['SCOOP_LAYUP','secondary']],
    short_mid: [['STOP_AND_POP','secondary'],['RUNNING_JUMPER','secondary']],
    mid: [['SPOT_UP_JUMPER','primary'],['PULL_UP_JUMPER','primary'],['ELBOW_JUMPER','secondary'],['BASELINE_JUMPER','secondary']],
    three: [['CORNER_THREE','secondary'],['SPOT_UP_THREE','secondary']],
  },
  'Adrian Dantley': {
    rim: [['STEP_THROUGH_LAYUP','primary'],['POWER_LAYUP','primary'],['SCOOP_LAYUP','secondary']],
    short_mid: [['SHORT_BANKER','primary'],['TURNAROUND_JUMPER','primary'],['BASELINE_FADEAWAY','secondary'],['FACE_UP_JUMPER','secondary']],
    mid: [['TURNAROUND_JUMPER','secondary'],['BASELINE_FADEAWAY','secondary']],
    three: [],
  },
  'Bill Laimbeer': {
    rim: [['PUTBACK_LAYUP','primary'],['TIP_IN','secondary'],['STANDING_LAYUP','secondary']],
    short_mid: [['SHORT_BANKER','primary'],['TURNAROUND_JUMPER','secondary']],
    mid: [['PICK_AND_POP_JUMPER','primary'],['TRAIL_JUMPER','primary'],['BASELINE_JUMPER','secondary'],['SPOT_UP_JUMPER','secondary']],
    three: [['TOP_OF_KEY_THREE','rare']],
  },
  'Sidney Green': {
    rim: [['PUTBACK_LAYUP','primary'],['CUTTING_LAYUP','primary'],['DROP_STEP_LAYUP','primary'],['TIP_IN','secondary']],
    short_mid: [['SHORT_BANKER','secondary'],['FACE_UP_JUMPER','secondary']],
    mid: [['SPOT_UP_JUMPER','rare']],
    three: [],
  },
  'Vinnie Johnson': {
    rim: [['DRIVING_LAYUP','primary'],['SCOOP_LAYUP','secondary'],['FAST_BREAK_LAYUP','secondary']],
    short_mid: [['STOP_AND_POP','primary'],['SHORT_BANKER','secondary'],['RUNNING_JUMPER','secondary']],
    mid: [['PULL_UP_JUMPER','primary'],['ONE_DRIBBLE_PULL_UP','primary'],['TRANSITION_PULL_UP','secondary'],['SPOT_UP_JUMPER','secondary'],['BASELINE_JUMPER','secondary']],
    three: [['SPOT_UP_THREE','rare'],['TRANSITION_THREE','rare']],
  },
  'Rick Mahorn': {
    rim: [['PUTBACK_LAYUP','primary'],['POWER_LAYUP','primary'],['DROP_STEP_LAYUP','secondary'],['SHORT_HOOK','secondary']],
    short_mid: [['SHORT_BANKER','secondary'],['HALF_HOOK','secondary']],
    mid: [],
    three: [],
  },
  'Dennis Rodman': {
    rim: [['CUTTING_LAYUP','primary'],['PUTBACK_LAYUP','primary'],['TIP_IN','primary'],['FAST_BREAK_LAYUP','primary'],['RUNNING_DUNK','secondary'],['TAP_IN','secondary']],
    short_mid: [],
    mid: [],
    three: [],
  },
  'John Salley': {
    rim: [['STANDING_DUNK','primary'],['PUTBACK_LAYUP','primary'],['TIP_IN','secondary'],['CUTTING_DUNK','secondary'],['DROP_STEP_LAYUP','secondary']],
    short_mid: [['SHORT_HOOK','secondary'],['SHORT_BANKER','secondary']],
    mid: [],
    three: [],
  },
  'Tony Campbell': {
    rim: [['CUTTING_LAYUP','primary'],['FAST_BREAK_LAYUP','primary'],['DRIVING_LAYUP','secondary']],
    short_mid: [['FACE_UP_JUMPER','secondary'],['SHORT_BANKER','secondary']],
    mid: [['SPOT_UP_JUMPER','secondary'],['PULL_UP_JUMPER','secondary']],
    three: [],
  },

  // ===== HAWKS =====
  'Dominique Wilkins': {
    rim: [['BASELINE_DUNK','primary'],['POWER_DUNK','primary'],['RUNNING_DUNK','primary'],['BASELINE_LAYUP','primary'],['FINGER_ROLL','primary'],['REVERSE_LAYUP','secondary'],['POWER_LAYUP','secondary'],['PUTBACK_DUNK','secondary'],['BREAKAWAY_DUNK','secondary']],
    short_mid: [['TURNAROUND_JUMPER','primary'],['BASELINE_FADEAWAY','secondary'],['FACE_UP_JUMPER','secondary'],['PULL_UP_JUMPER','secondary']],
    mid: [['PULL_UP_JUMPER','secondary'],['ONE_DRIBBLE_PULL_UP','secondary'],['SPOT_UP_JUMPER','rare']],
    three: [['SPOT_UP_THREE','rare']],
  },
  'Doc Rivers': {
    rim: [['DRIVING_LAYUP','primary'],['SCOOP_LAYUP','secondary'],['FAST_BREAK_LAYUP','secondary'],['POWER_LAYUP','secondary']],
    short_mid: [['STOP_AND_POP','primary'],['RUNNING_JUMPER','secondary']],
    mid: [['PULL_UP_JUMPER','primary'],['ELBOW_JUMPER','secondary'],['STOP_AND_POP','secondary'],['BASELINE_JUMPER','secondary']],
    three: [['SPOT_UP_THREE','rare']],
  },
  'Kevin Willis': {
    rim: [['PUTBACK_LAYUP','primary'],['POWER_LAYUP','primary'],['DROP_STEP_LAYUP','primary'],['TIP_IN','secondary'],['STANDING_DUNK','secondary'],['JUMP_HOOK','secondary']],
    short_mid: [['FACE_UP_JUMPER','primary'],['SHORT_BANKER','primary'],['JUMP_HOOK','secondary'],['TURNAROUND_JUMPER','secondary']],
    mid: [['PICK_AND_POP_JUMPER','secondary'],['FACE_UP_JUMPER','secondary']],
    three: [],
  },
  'Randy Wittman': {
    rim: [['DRIVING_LAYUP','secondary'],['BASELINE_LAYUP','secondary']],
    short_mid: [['STOP_AND_POP','secondary'],['RUNNING_JUMPER','secondary']],
    mid: [['SPOT_UP_JUMPER','primary'],['BASELINE_JUMPER','primary'],['ELBOW_JUMPER','secondary'],['PULL_UP_JUMPER','secondary']],
    three: [['CORNER_THREE','secondary'],['SPOT_UP_THREE','secondary']],
  },
  'Tree Rollins': {
    rim: [['STANDING_DUNK','primary'],['PUTBACK_LAYUP','primary'],['TIP_IN','secondary'],['SHORT_HOOK','secondary'],['DROP_STEP_LAYUP','secondary']],
    short_mid: [['SHORT_HOOK','secondary'],['SHORT_BANKER','secondary']],
    mid: [],
    three: [],
  },
  'Spud Webb': {
    rim: [['SCOOP_LAYUP','primary'],['FAST_BREAK_LAYUP','primary'],['REVERSE_LAYUP','secondary'],['FINGER_ROLL','secondary']],
    short_mid: [['RUNNING_JUMPER','primary'],['STOP_AND_POP','secondary']],
    mid: [['PULL_UP_JUMPER','primary'],['SPOT_UP_JUMPER','secondary']],
    three: [['SPOT_UP_THREE','rare']],
  },
  'Mike McGee': {
    rim: [['DRIVING_LAYUP','primary'],['FAST_BREAK_LAYUP','primary'],['CUTTING_LAYUP','secondary'],['REVERSE_LAYUP','secondary']],
    short_mid: [['FACE_UP_JUMPER','secondary'],['STOP_AND_POP','secondary']],
    mid: [['SPOT_UP_JUMPER','primary'],['PULL_UP_JUMPER','secondary'],['BASELINE_JUMPER','secondary'],['CORNER_JUMPER','secondary']],
    three: [['CORNER_THREE','primary'],['WING_THREE','secondary']],
  },
  'Cliff Levingston': {
    rim: [['PUTBACK_LAYUP','primary'],['CUTTING_LAYUP','primary'],['TIP_IN','secondary'],['STANDING_LAYUP','secondary'],['RUNNING_DUNK','secondary']],
    short_mid: [['SHORT_BANKER','secondary'],['FACE_UP_JUMPER','secondary']],
    mid: [['SPOT_UP_JUMPER','rare']],
    three: [],
  },
  'Antoine Carr': {
    rim: [['POWER_LAYUP','primary'],['DROP_STEP_LAYUP','primary'],['SHORT_BANKER','secondary'],['TURNAROUND_JUMPER','secondary']],
    short_mid: [['SHORT_BANKER','primary'],['TURNAROUND_JUMPER','secondary'],['FACE_UP_JUMPER','secondary']],
    mid: [['FACE_UP_JUMPER','secondary'],['PICK_AND_POP_JUMPER','rare']],
    three: [],
  },
  'Jon Koncak': {
    rim: [['PUTBACK_LAYUP','primary'],['STANDING_LAYUP','primary'],['TIP_IN','secondary'],['SHORT_HOOK','secondary'],['STANDING_DUNK','secondary']],
    short_mid: [['SHORT_HOOK','secondary'],['SHORT_BANKER','secondary']],
    mid: [],
    three: [],
  },
};

const DEFAULT_PACKAGE = {
  rim: [['DRIVING_LAYUP','primary'],['STANDING_LAYUP','secondary'],['FINGER_ROLL','secondary'],['REVERSE_LAYUP','secondary'],['SCOOP_LAYUP','rare'],['TWO_HAND_DUNK','rare']],
  short_mid: [['TURNAROUND_JUMPER','primary'],['BABY_HOOK','secondary'],['SHORT_BANKER','secondary'],['FACE_UP_JUMPER','secondary']],
  mid: [['SPOT_UP_JUMPER','primary'],['ELBOW_JUMPER','secondary'],['ONE_DRIBBLE_PULL_UP','secondary']],
  three: [['SPOT_UP_THREE','primary'],['WING_THREE','secondary']],
};

function isFastBreakVariation(key) {
  return key.includes('FAST_BREAK') || key.includes('BREAKAWAY') ||
         key.includes('RUNNING') || key.includes('TRANSITION') || key.includes('CUTTING');
}

function pickWeighted(pool) {
  const weighted = pool.map(([key, tier]) => ({ key, weight: TIER_WEIGHT[tier] || 1 }));
  const total = weighted.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const w of weighted) { r -= w.weight; if (r <= 0) return w.key; }
  return weighted[0].key;
}

function pickWeightedRaw(pool) {
  const total = pool.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [key, w] of pool) { r -= w; if (r <= 0) return key; }
  return pool[0][0];
}

function resolveVariation(key) {
  const v = VARIATIONS[key] || VARIATIONS.SPOT_UP_JUMPER;
  const familyMod = FAMILIES[v.family] || 0;
  const varMod = (v.mods && v.mods.probMod) || 0;
  return {
    key,
    family: v.family,
    make: v.make,
    log: v.log,
    miss: v.miss,
    probMod: familyMod + varMod,
    blockChanceMod: (v.mods && v.mods.blockChanceMod) || 0,
    reducesRearContest: !!(v.mods && v.mods.reducesRearContest),
    isKareemSignature: !!v.isKareemSignature,
    isMagicSignature: !!v.isMagicSignature,
  };
}

// Main selection: picks a descriptive variation for the shot.
// dreamShakeVariant overrides normal selection with a Dream Shake branch.
export function selectShotVariation(shooter, ctx, sigVariant, sigFamily = 'dream') {
  const { distToBasket, isThree, isFastBreak, isPutback, shotClock, gameClock } = ctx;
  const zone = getShotZone(distToBasket, isThree);

  // 1. Putback — follows an offensive rebound, rim zone only
  if (isPutback) {
    const pool = [['PUTBACK_LAYUP',4],['TIP_IN',2],['TAP_IN',2],['OFFENSIVE_REBOUND_BANK',2],['FOLLOW_OWN_MISS',0.3]];
    if ((shooter.dunkTendency || 0) >= 4) pool.push(['PUTBACK_DUNK', 1.5]);
    return resolveVariation(pickWeightedRaw(pool));
  }

  // 2. Signature-move override — branches into specific shot variations
  if (sigVariant) {
    const variantMap = sigFamily === 'zeke' ? ZEKE_SPLIT_VARIATIONS
                     : sigFamily === 'pumpfake' ? PUMP_FAKE_VARIATIONS
                     : sigFamily === 'highlight' ? HUMAN_HIGHLIGHT_VARIATIONS
                     : DREAM_SHAKE_VARIATIONS;
    const fallback = sigFamily === 'zeke' ? 'PULL_UP_JUMPER'
                   : sigFamily === 'pumpfake' ? 'SHORT_BANKER'
                   : sigFamily === 'highlight' ? 'POWER_DUNK'
                   : 'TURNAROUND_JUMPER';
    const sigKeys = (variantMap[sigVariant] || [fallback])
      .filter(k => VARIATIONS[k].zones.includes(zone));
    const sigKey = sigKeys.length > 0
      ? sigKeys[Math.floor(Math.random() * sigKeys.length)]
      : fallback;
    return resolveVariation(sigKey);
  }

  // 3. Desperation — end of shot clock or game clock
  if (gameClock < 2.5 || shotClock < 1) {
    if (distToBasket > 340) return resolveVariation('HALF_COURT_HEAVE');
    if (isThree) return resolveVariation('DESPERATION_THREE');
    return resolveVariation('QUICK_FLIP');
  }

  // 4. Normal selection from the player's shot package
  const pkg = PLAYER_PACKAGES[shooter.name] || DEFAULT_PACKAGE;
  let pool = pkg[zone] || DEFAULT_PACKAGE[zone] || DEFAULT_PACKAGE.mid;
  if (pool.length === 0) pool = DEFAULT_PACKAGE[zone] || [['SPOT_UP_JUMPER','primary']];

  // Fast break context: prefer transition/running variations
  if (isFastBreak && Math.random() < 0.55) {
    const fbPool = pool.filter(e => isFastBreakVariation(e[0]));
    if (fbPool.length > 0) pool = fbPool;
  }

  return resolveVariation(pickWeighted(pool));
}