// playEngine.js — Multi-option offensive play engine.
// Each quick-play button selects a FAMILY; each family has 4 variants chosen
// by team/personnel. A play runs as a phase machine (setup → initiate → read
// → finishing) with 2-4 reads the defense can influence. The execution of the
// chosen option (shot/drive/pass) is performed by gameEngine.executePlayOption,
// which owns takeShot/makePass; this module owns selection, positioning, and
// read evaluation only (no circular imports).

import { COURT } from './gameData';

function dist(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }
function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }
function rand(a, b) { return a + Math.random() * (b - a); }

function getBasketPos(attackingRight) {
  return attackingRight
    ? { x: COURT.width - COURT.rimX, y: COURT.basketY }
    : { x: COURT.rimX, y: COURT.basketY };
}

// --- Player classification (by name, 1986-87 rosters) ---
const POST_SCORERS = new Set([
  'Kareem Abdul-Jabbar', 'Kevin McHale', 'Robert Parish',
  'Akeem Olajuwon', 'Ralph Sampson', 'Adrian Dantley', 'Bill Laimbeer',
  'Mychal Thompson', 'Bill Walton', 'Jim Petersen', 'Sidney Green',
  'Rick Mahorn', 'John Salley', 'Kurt Rambis', 'Fred Roberts',
  'Kevin Willis', 'Tree Rollins', 'Antoine Carr', 'Jon Koncak', 'Cliff Levingston',
]);
const PERIMETER_CREATORS = new Set([
  'Magic Johnson', 'Isiah Thomas', 'Dennis Johnson', 'Danny Ainge',
  'Dirk Minniefield', 'Allen Leavell', 'Rodney McCray', 'Robert Reid',
  'Michael Cooper', 'Vinnie Johnson', 'Wes Matthews', 'Jerry Sichting',
  'Doc Rivers', 'Spud Webb', 'Dominique Wilkins',
]);
const THREE_SHOOTERS = new Set([
  'Larry Bird', 'Byron Scott', 'Danny Ainge', 'Michael Cooper',
  'Robert Reid', 'Bill Laimbeer', 'Joe Dumars', 'Vinnie Johnson',
]);
const SLASHERS = new Set([
  'James Worthy', 'Magic Johnson', 'Isiah Thomas', 'Rodney McCray',
  'Mitchell Wiggins', 'Lewis Lloyd', 'A.C. Green', 'Joe Dumars',
  'Dominique Wilkins', 'Spud Webb', 'Mike McGee', 'Cliff Levingston',
]);
const MID_POST_STARS = new Set([
  'Larry Bird', 'Adrian Dantley', 'James Worthy', 'Magic Johnson',
  'Akeem Olajuwon', 'Kevin McHale', 'Dominique Wilkins',
]);
const HIGH_PNR_GUARDS = new Set([
  'Isiah Thomas', 'Magic Johnson', 'Dennis Johnson', 'Vinnie Johnson',
  'Dirk Minniefield', 'Allen Leavell', 'Danny Ainge',
  'Doc Rivers', 'Spud Webb',
]);

// --- Role pickers (operate on on-court offensive players) ---
function pickHottest(court) {
  let best = court[0], bestS = -Infinity;
  for (const p of court) {
    const pts = (p.stats && p.stats.points) || 0;
    const s = pts * 10 + (p.shooting + p.insideScoring) * 0.5 + (p.driveTendency || 0);
    if (s > bestS) { bestS = s; best = p; }
  }
  return best;
}
function pickPostScorer(court) {
  const posts = court.filter(p => p.position === 'C' || p.position === 'PF' || POST_SCORERS.has(p.name));
  const pool = posts.length ? posts : court;
  return pool.slice().sort((a, b) => (b.insideScoring || 0) - (a.insideScoring || 0))[0];
}
function pickCreator(court) {
  const g = court.filter(p => p.position === 'PG' || PERIMETER_CREATORS.has(p.name));
  const pool = g.length ? g : court;
  return pool.slice().sort((a, b) => (b.passing || 0) - (a.passing || 0))[0];
}
function pickShooter(court) {
  const s = court.filter(p => p.threeAttempts > 0.4 && p.threePct > 0.30);
  if (s.length) return s.slice().sort((a, b) => b.threePct - a.threePct)[0];
  const t = court.filter(p => (p.threePoint || 0) >= 6);
  return (t[0] || court[0]);
}
function pickSlasher(court) {
  const s = court.filter(p => (p.driveTendency || 0) >= 6);
  const pool = s.length ? s : court;
  return pool.slice().sort((a, b) => (b.driveTendency || b.speed || 0) - (a.driveTendency || a.speed || 0))[0];
}
function pickBig(court, excludeId) {
  const b = court.filter(p => (p.position === 'C' || p.position === 'PF') && p.id !== excludeId);
  return b.slice().sort((a, b) => (b.rebounding || 0) - (a.rebounding || 0))[0] || null;
}
function pickWing(court, excludeId) {
  const w = court.filter(p => (p.position === 'SG' || p.position === 'SF') && p.id !== excludeId);
  return w[0] || court.find(p => p.id !== excludeId) || court[1];
}

// --- Spot catalog (attackingRight mirrored) ---
function S(R) {
  const m = (x) => R ? x : COURT.width - x;
  return {
    top:            { x: m(620), y: 250 },
    wingBall:       { x: m(690), y: 95 },
    wingOpp:        { x: m(690), y: 405 },
    cornerBall:     { x: m(885), y: 80 },
    cornerOpp:      { x: m(885), y: 420 },
    shortCorner:    { x: m(820), y: 150 },
    shortCornerOpp:  { x: m(820), y: 350 },
    lowPost:        { x: m(835), y: 250 },
    deepPost:       { x: m(862), y: 250 },
    midPost:        { x: m(800), y: 180 },
    midPostLow:     { x: m(800), y: 320 },
    highPost:       { x: m(760), y: 250 },
    elbow:          { x: m(790), y: 170 },
    elbowLow:        { x: m(790), y: 330 },
    dunker:          { x: m(870), y: 250 },
    trailer:         { x: m(500), y: 250 },
    screenTop:       { x: m(655), y: 250 },
    popSpot:         { x: m(700), y: 250 },
  };
}

// --- The 16 variants ---
const VARIANTS = [
  // ===== ISO HOTTEST =====
  {
    id: 'iso_wing_clearout', family: 'iso_hot', label: 'Wing Clear-Out',
    canRun: (_st, c) => c.some(p => (p.driveTendency || 0) >= 6),
    assign: (_st, c) => ({ primaryId: pickSlasher(c).id, passerId: pickCreator(c).id }),
    setup: (R) => { const s = S(R); return { primary: s.wingBall, passer: s.top, others: [s.wingOpp, s.cornerOpp, s.shortCorner] }; },
    initiate: (R) => { const s = S(R); return { primary: s.wingBall, passer: s.top, others: [s.wingOpp, s.cornerOpp, s.shortCorner] }; },
    options: ['drive', 'pullup', 'kick', 'pass_out'],
  },
  {
    id: 'iso_mid_post', family: 'iso_hot', label: 'Mid-Post Iso',
    canRun: (_st, c) => c.some(p => MID_POST_STARS.has(p.name)),
    assign: (_st, c) => {
      const primary = c.find(p => MID_POST_STARS.has(p.name)) || pickPostScorer(c);
      return { primaryId: primary.id, passerId: pickCreator(c).id };
    },
    setup: (R) => { const s = S(R); return { primary: s.midPost, passer: s.top, others: [s.wingBall, s.wingOpp, s.cornerOpp, s.shortCorner] }; },
    initiate: (R) => { const s = S(R); return { primary: s.midPost, passer: s.top, others: [s.wingBall, s.wingOpp, s.cornerOpp, s.shortCorner] }; },
    options: ['post_move', 'shoot', 'kick', 'pass_out'],
  },
  {
    id: 'iso_high_pnr', family: 'iso_hot', label: 'High Pick & Roll',
    canRun: (_st, c) => c.some(p => HIGH_PNR_GUARDS.has(p.name)) && c.some(p => p.position === 'C' || p.position === 'PF'),
    assign: (_st, c) => {
      const primary = c.find(p => HIGH_PNR_GUARDS.has(p.name)) || pickCreator(c);
      const big = pickBig(c, primary.id);
      return { primaryId: primary.id, screenerId: big ? big.id : null, passerId: primary.id };
    },
    setup: (R) => { const s = S(R); return { primary: s.top, screener: s.screenTop, others: [s.wingBall, s.wingOpp, s.shortCorner] }; },
    initiate: (R) => { const s = S(R); return { primary: s.top, screener: s.lowPost, others: [s.wingBall, s.wingOpp, s.cornerOpp] }; },
    options: ['drive', 'pullup', 'kick', 'shoot'],
  },
  {
    id: 'iso_hothand_quick', family: 'iso_hot', label: 'Hot Hand Quick Hit',
    canRun: () => true,
    assign: (_st, c) => ({ primaryId: pickHottest(c).id, passerId: pickCreator(c).id }),
    setup: (R) => { const s = S(R); return { primary: s.wingBall, passer: s.top, others: [s.wingOpp, s.cornerOpp, s.shortCorner] }; },
    initiate: (R) => { const s = S(R); return { primary: s.wingBall, passer: s.top, others: [s.wingOpp, s.cornerOpp, s.shortCorner] }; },
    options: ['shoot', 'drive', 'pass_out', 'kick'],
  },

  // ===== FEED POST =====
  {
    id: 'post_direct_entry', family: 'feed_post', label: 'Low-Post Entry',
    canRun: (_st, c) => c.some(p => p.position === 'C' || p.position === 'PF'),
    assign: (_st, c) => ({ primaryId: pickPostScorer(c).id, passerId: pickCreator(c).id }),
    setup: (R) => { const s = S(R); return { primary: s.lowPost, passer: s.top, others: [s.wingBall, s.wingOpp, s.cornerBall, s.shortCornerOpp] }; },
    initiate: (R) => { const s = S(R); return { primary: s.lowPost, passer: s.top, others: [s.wingBall, s.wingOpp, s.cornerBall, s.shortCornerOpp] }; },
    options: ['post_move', 'shoot', 'kick', 'pass_out'],
  },
  {
    id: 'post_high_low', family: 'feed_post', label: 'High-Low',
    canRun: (_st, c) => c.filter(p => p.position === 'C' || p.position === 'PF').length >= 2,
    assign: (_st, c) => {
      const low = pickPostScorer(c);
      const high = pickBig(c, low.id) || pickPostScorer(c);
      return { primaryId: low.id, secondaryId: high.id, passerId: pickCreator(c).id, entryTargetId: high.id };
    },
    setup: (R) => { const s = S(R); return { primary: s.lowPost, secondary: s.highPost, passer: s.top, others: [s.wingBall, s.wingOpp] }; },
    initiate: (R) => { const s = S(R); return { primary: s.deepPost, secondary: s.highPost, passer: s.top, others: [s.wingBall, s.wingOpp] }; },
    options: ['post_move', 'shoot', 'kick', 'pass_out'],
  },
  {
    id: 'post_cross_screen', family: 'feed_post', label: 'Cross-Screen Duck-In',
    canRun: (_st, c) => c.filter(p => p.position === 'C' || p.position === 'PF').length >= 2,
    assign: (_st, c) => {
      const primary = pickPostScorer(c);
      const screener = pickBig(c, primary.id);
      return { primaryId: primary.id, screenerId: screener ? screener.id : null, passerId: pickCreator(c).id };
    },
    setup: (R) => { const s = S(R); return { primary: s.lowPost, screener: s.midPostLow, passer: s.top, others: [s.wingBall, s.wingOpp] }; },
    initiate: (R) => { const s = S(R); return { primary: s.deepPost, screener: s.elbowLow, passer: s.top, others: [s.wingBall, s.wingOpp] }; },
    options: ['post_move', 'shoot', 'kick', 'pass_out'],
  },
  {
    id: 'post_repost', family: 'feed_post', label: 'Repost Action',
    canRun: (_st, c) => c.some(p => p.position === 'C' || p.position === 'PF'),
    assign: (_st, c) => ({ primaryId: pickPostScorer(c).id, passerId: pickCreator(c).id }),
    setup: (R) => { const s = S(R); return { primary: s.lowPost, passer: s.top, others: [s.wingBall, s.wingOpp, s.cornerBall, s.shortCornerOpp] }; },
    initiate: (R) => { const s = S(R); return { primary: s.deepPost, passer: s.top, others: [s.wingBall, s.wingOpp, s.cornerBall, s.shortCornerOpp] }; },
    options: ['post_move', 'pass_out', 'shoot', 'kick'],
  },

  // ===== SHOOT 3 =====
  {
    id: 'three_drive_kick', family: 'shoot_3', label: 'Drive & Kick',
    canRun: (_st, c) => c.some(p => (p.driveTendency || 0) >= 6) && c.some(p => p.threeAttempts > 0.4),
    assign: (_st, c) => ({ primaryId: pickSlasher(c).id, secondaryId: pickShooter(c).id, passerId: pickSlasher(c).id }),
    setup: (R) => { const s = S(R); return { primary: s.top, secondary: s.wingBall, others: [s.wingOpp, s.cornerOpp, s.shortCorner] }; },
    initiate: (R) => { const s = S(R); return { primary: s.highPost, secondary: s.wingBall, others: [s.wingOpp, s.cornerOpp, s.shortCorner] }; },
    options: ['drive', 'kick', 'shoot', 'pass_out'],
  },
  {
    id: 'three_floppy', family: 'shoot_3', label: 'Floppy (Off Screens)',
    canRun: (_st, c) => c.some(p => p.threeAttempts > 0.4) && c.some(p => p.position === 'C' || p.position === 'PF'),
    assign: (_st, c) => ({ primaryId: pickShooter(c).id, screenerId: pickBig(c).id, passerId: pickCreator(c).id }),
    setup: (R) => { const s = S(R); return { primary: s.cornerBall, screener: s.elbow, passer: s.top, others: [s.elbowLow, s.wingOpp] }; },
    initiate: (R) => { const s = S(R); return { primary: s.wingBall, screener: s.elbow, passer: s.top, others: [s.elbowLow, s.wingOpp] }; },
    options: ['shoot', 'drive', 'pass_out'],
  },
  {
    id: 'three_trailer_pop', family: 'shoot_3', label: 'Trailer Pop',
    canRun: (_st, c) => c.some(p => p.position === 'C' || p.position === 'PF'),
    assign: (_st, c) => {
      const pop = c.filter(p => (p.position === 'C' || p.position === 'PF') && (p.shooting || 0) >= 7);
      const primary = pop[0] || pickBig(c);
      return { primaryId: primary.id, passerId: pickCreator(c).id };
    },
    setup: (R) => { const s = S(R); return { primary: s.trailer, passer: s.top, others: [s.wingBall, s.wingOpp, s.shortCorner] }; },
    initiate: (R) => { const s = S(R); return { primary: s.popSpot, passer: s.top, others: [s.wingBall, s.wingOpp, s.shortCorner] }; },
    options: ['shoot', 'pass_out', 'drive'],
  },
  {
    id: 'three_pick_pop', family: 'shoot_3', label: 'Pick & Pop',
    canRun: (_st, c) => c.some(p => p.position === 'PG' || HIGH_PNR_GUARDS.has(p.name)) && c.some(p => p.position === 'C' || p.position === 'PF'),
    assign: (_st, c) => {
      const primary = pickCreator(c);
      const big = pickBig(c, primary.id);
      return { primaryId: primary.id, secondaryId: big ? big.id : null, screenerId: big ? big.id : null, passerId: primary.id };
    },
    setup: (R) => { const s = S(R); return { primary: s.top, secondary: s.screenTop, screener: s.screenTop, others: [s.wingBall, s.wingOpp, s.shortCorner] }; },
    initiate: (R) => { const s = S(R); return { primary: s.top, secondary: s.popSpot, screener: s.popSpot, others: [s.wingBall, s.wingOpp, s.cornerOpp] }; },
    options: ['shoot', 'drive', 'kick'],
  },

  // ===== ATTACK RIM =====
  {
    id: 'rim_high_pnr', family: 'attack_rim', label: 'P&R Attack',
    canRun: (_st, c) => c.some(p => HIGH_PNR_GUARDS.has(p.name) || p.position === 'PG') && c.some(p => p.position === 'C' || p.position === 'PF'),
    assign: (_st, c) => {
      const primary = c.find(p => HIGH_PNR_GUARDS.has(p.name)) || pickCreator(c);
      const big = pickBig(c, primary.id);
      return { primaryId: primary.id, secondaryId: big ? big.id : null, screenerId: big ? big.id : null, passerId: primary.id };
    },
    setup: (R) => { const s = S(R); return { primary: s.top, secondary: s.screenTop, screener: s.screenTop, others: [s.wingBall, s.wingOpp, s.cornerOpp] }; },
    initiate: (R) => { const s = S(R); return { primary: s.top, secondary: s.lowPost, screener: s.lowPost, others: [s.wingBall, s.wingOpp, s.cornerOpp] }; },
    options: ['drive', 'kick', 'shoot', 'pass_out'],
  },
  {
    id: 'rim_spread_drive', family: 'attack_rim', label: '1-4 Spread Drive',
    canRun: (_st, c) => c.some(p => (p.driveTendency || 0) >= 6),
    assign: (_st, c) => {
      const primary = pickSlasher(c);
      const passer = pickCreator(c);
      return { primaryId: primary.id, secondaryId: passer.id, passerId: passer.id };
    },
    setup: (R) => { const s = S(R); return { primary: s.top, passer: s.highPost, others: [s.wingBall, s.wingOpp, s.cornerBall, s.cornerOpp] }; },
    initiate: (R) => { const s = S(R); return { primary: s.top, passer: s.top, others: [s.wingBall, s.wingOpp, s.cornerBall, s.cornerOpp] }; },
    options: ['drive', 'kick', 'pass_out', 'shoot'],
  },
  {
    id: 'rim_baseline_cut', family: 'attack_rim', label: 'Baseline Cut',
    canRun: (_st, c) => c.some(p => SLASHERS.has(p.name)),
    assign: (_st, c) => {
      const primary = c.find(p => SLASHERS.has(p.name)) || pickSlasher(c);
      return { primaryId: primary.id, passerId: pickCreator(c).id };
    },
    setup: (R) => { const s = S(R); return { primary: s.cornerBall, passer: s.top, others: [s.wingBall, s.wingOpp, s.shortCorner, s.dunker] }; },
    initiate: (R) => { const s = S(R); return { primary: s.cornerOpp, passer: s.top, others: [s.wingBall, s.wingOpp, s.shortCorner, s.dunker] }; },
    options: ['drive', 'shoot', 'pass_out'],
  },
  {
    id: 'rim_transition_push', family: 'attack_rim', label: 'Transition Push',
    canRun: () => true,
    assign: (_st, c) => {
      const primary = pickSlasher(c);
      const wing = pickWing(c, primary.id);
      return { primaryId: primary.id, secondaryId: wing.id, passerId: primary.id };
    },
    setup: (R) => { const s = S(R); return { primary: s.top, secondary: s.wingBall, others: [s.wingOpp, s.shortCorner, s.trailer] }; },
    initiate: (R) => { const s = S(R); return { primary: s.highPost, secondary: s.wingBall, others: [s.wingOpp, s.shortCorner, s.trailer] }; },
    options: ['drive', 'shoot', 'kick', 'pass_out'],
  },
];

const VARIANT_BY_ID = {};
VARIANTS.forEach(v => { VARIANT_BY_ID[v.id] = v; });

// Team-specific priority order per family (first eligible wins, ~30% random for variety)
const TEAM_PREFS = {
  lakers: {
    iso_hot: ['iso_wing_clearout', 'iso_high_pnr', 'iso_mid_post', 'iso_hothand_quick'],
    feed_post: ['post_direct_entry', 'post_high_low', 'post_cross_screen', 'post_repost'],
    shoot_3: ['three_drive_kick', 'three_floppy', 'three_trailer_pop', 'three_pick_pop'],
    attack_rim: ['rim_high_pnr', 'rim_spread_drive', 'rim_baseline_cut', 'rim_transition_push'],
  },
  celtics: {
    iso_hot: ['iso_mid_post', 'iso_wing_clearout', 'iso_hothand_quick', 'iso_high_pnr'],
    feed_post: ['post_direct_entry', 'post_high_low', 'post_cross_screen', 'post_repost'],
    shoot_3: ['three_floppy', 'three_trailer_pop', 'three_drive_kick', 'three_pick_pop'],
    attack_rim: ['rim_spread_drive', 'rim_baseline_cut', 'rim_high_pnr', 'rim_transition_push'],
  },
  rockets: {
    iso_hot: ['iso_mid_post', 'iso_high_pnr', 'iso_wing_clearout', 'iso_hothand_quick'],
    feed_post: ['post_high_low', 'post_direct_entry', 'post_cross_screen', 'post_repost'],
    shoot_3: ['three_trailer_pop', 'three_drive_kick', 'three_floppy', 'three_pick_pop'],
    attack_rim: ['rim_high_pnr', 'rim_spread_drive', 'rim_transition_push', 'rim_baseline_cut'],
  },
  pistons: {
    iso_hot: ['iso_mid_post', 'iso_hothand_quick', 'iso_wing_clearout', 'iso_high_pnr'],
    feed_post: ['post_direct_entry', 'post_repost', 'post_cross_screen', 'post_high_low'],
    shoot_3: ['three_drive_kick', 'three_trailer_pop', 'three_floppy', 'three_pick_pop'],
    attack_rim: ['rim_high_pnr', 'rim_transition_push', 'rim_spread_drive', 'rim_baseline_cut'],
  },
  hawks: {
    iso_hot: ['iso_wing_clearout', 'iso_mid_post', 'iso_hothand_quick', 'iso_high_pnr'],
    feed_post: ['post_direct_entry', 'post_high_low', 'post_repost', 'post_cross_screen'],
    shoot_3: ['three_drive_kick', 'three_floppy', 'three_trailer_pop', 'three_pick_pop'],
    attack_rim: ['rim_baseline_cut', 'rim_spread_drive', 'rim_high_pnr', 'rim_transition_push'],
  },
};

function selectVariant(family, team, court) {
  const eligible = VARIANTS.filter(v => v.family === family && v.canRun(null, court));
  if (!eligible.length) return null;
  const pref = (TEAM_PREFS[team] && TEAM_PREFS[team][family]) || eligible.map(v => v.id);
  for (const id of pref) {
    const v = eligible.find(e => e.id === id);
    if (v) {
      if (eligible.length > 1 && Math.random() < 0.3) return eligible[Math.floor(Math.random() * eligible.length)];
      return v;
    }
  }
  return eligible[0];
}

// --- Lifecycle ---
export function maybeStartActivePlay(state) {
  if (state.activePlay) return;
  const uc = state.userPlayCall;
  if (!uc || uc.side !== 'offense') return;
  if (state.fastBreak && state.fastBreak.active) return;
  if (state.ball.inFlight || state.shotAnimating) return;
  if (state.timeoutState || state.ftState || state.quarterBreak) return;
  if (state.possession !== uc.team) return;
  const court = state.players.filter(p => p.team === state.possession && p.onCourt);
  if (!court.length) return;
  if (!state.players.find(p => p.id === state.ball.carrier)) return;
  const variant = selectVariant(uc.type, uc.team, court);
  if (!variant) { state.userPlayCall = null; return; }
  const roles = variant.assign(state, court);
  state.activePlay = {
    team: uc.team,
    buttonType: uc.type,
    variantId: variant.id,
    phase: 'setup',
    phaseTimer: 600,
    elapsed: 0,
    primaryId: roles.primaryId,
    secondaryId: roles.secondaryId || null,
    screenerId: roles.screenerId || null,
    passerId: roles.passerId || null,
    entryTargetId: roles.entryTargetId || roles.primaryId,
    chosenOption: null,
  };
  state.userPlayCall = null; // consumed — the active play drives the possession now
  state.gameLog.unshift(`📋 ${variant.label}`);
  if (state.gameLog.length > 15) state.gameLog.pop();
}

export function clearActivePlay(state) {
  if (state.activePlay) state.activePlay = null;
}

export function getActivePlayLabel(state) {
  const play = state.activePlay;
  if (!play) return null;
  const v = VARIANT_BY_ID[play.variantId];
  if (!v) return null;
  return { label: v.label, phase: play.phase, option: play.chosenOption };
}

// --- Phase machine + positioning + read evaluation ---
export function updateActivePlay(state, offense, defense, ballCarrier, dt) {
  const play = state.activePlay;
  if (!play) return;
  play.phaseTimer -= dt;
  play.elapsed += dt;

  if (play.elapsed > 6500) { clearActivePlay(state); return; }

  if (play.phaseTimer <= 0) {
    switch (play.phase) {
      case 'setup': play.phase = 'initiate'; play.phaseTimer = 1100; break;
      case 'initiate': play.phase = 'read'; play.phaseTimer = 300; break;
      case 'read':
        play.chosenOption = evaluateRead(state, play, defense);
        play.phase = 'finishing'; play.phaseTimer = 4000; break;
      case 'finishing':
        clearActivePlay(state); return;
    }
  }

  if (play.phase === 'setup' || play.phase === 'initiate' || play.phase === 'read') {
    positionForPlay(state, play, play.phase === 'setup' ? 'setup' : 'initiate');
  }
}

function evaluateRead(state, play, defense) {
  const variant = VARIANT_BY_ID[play.variantId];
  const primary = state.players.find(p => p.id === play.primaryId);
  if (!primary) return variant.options[0] || 'shoot';
  const basket = getBasketPos(state.attackingRight);
  let nearest = Infinity, second = Infinity;
  defense.forEach(d => {
    const dd = dist(primary, d);
    if (dd < nearest) { second = nearest; nearest = dd; }
    else if (dd < second) second = dd;
  });
  const doubled = second < 48;
  const open = nearest > 55;
  const dToBasket = dist(primary, basket);
  const opts = variant.options;
  const has = (o) => opts.includes(o);

  if (doubled && has('kick')) return 'kick';
  if (open) {
    if (dToBasket < 85 && has('drive')) return 'drive';
    if (has('shoot')) return 'shoot';
    if (has('pullup')) return 'pullup';
  }
  if (has('post_move') && dToBasket < 150) return 'post_move';
  if (has('drive') && dToBasket < 280) return 'drive';
  if (has('pullup')) return 'pullup';
  if (has('pass_out')) return 'pass_out';
  return opts[0];
}

function positionForPlay(state, play, phaseKey) {
  const variant = VARIANT_BY_ID[play.variantId];
  const spots = phaseKey === 'setup' ? variant.setup(state.attackingRight) : variant.initiate(state.attackingRight);
  const court = state.players.filter(p => p.team === state.possession && p.onCourt);
  let otherIdx = 0;
  court.forEach(p => {
    let s = null;
    if (p.id === play.primaryId) s = spots.primary;
    else if (p.id === play.secondaryId) s = spots.secondary;
    else if (p.id === play.screenerId) s = spots.screener;
    else if (p.id === play.passerId) s = spots.passer;
    else if (spots.others && spots.others.length) { s = spots.others[otherIdx % spots.others.length]; otherIdx++; }
    if (s) {
      p.targetX = s.x + rand(-12, 12);
      p.targetY = clamp(s.y + rand(-12, 12), 35, COURT.height - 35);
    }
  });
}