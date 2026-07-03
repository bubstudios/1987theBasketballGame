// personalityEngine.js — trash talk / agitator system, SEPARATE from special moves.
// Every player can have a personality. Not every player should have a signature move.
// Voice keys exist for EVERY player so the system never fails silently —
// players without audio clips show a text bubble + console.warn fallback.

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// --- 8-dimension personality ratings (0-99) ---
// trashTalk:       how often the player runs his mouth
// agitator:        how effectively he gets under opponents' skin
// intimidation:    physical presence that rattles opponents
// composure:       calm under pressure (HIGH = LESS likely to talk)
// retaliationRisk: chance of committing a retaliation foul
// refRespect:      how much refs cut him slack (LOW = more techs)
// technicalRisk:   baseline chance of drawing a technical
// crowdFuel:       how much he energizes the home crowd / bench
export const PERSONALITY_RATINGS = {
  // === Detroit Pistons (Bad Boys) ===
  'Bill Laimbeer':     { trashTalk: 96, agitator: 99, intimidation: 92, composure: 45, retaliationRisk: 80, refRespect: 25, technicalRisk: 82, crowdFuel: 90, role: 'agitator' },
  'Rick Mahorn':       { trashTalk: 82, agitator: 94, intimidation: 98, composure: 40, retaliationRisk: 85, refRespect: 30, technicalRisk: 78, crowdFuel: 75, role: 'enforcer' },
  'Isiah Thomas':      { trashTalk: 86, agitator: 78, intimidation: 72, composure: 70, retaliationRisk: 55, refRespect: 55, technicalRisk: 58, crowdFuel: 80, role: 'needle' },
  'Dennis Rodman':     { trashTalk: 74, agitator: 88, intimidation: 90, composure: 35, retaliationRisk: 78, refRespect: 28, technicalRisk: 72, crowdFuel: 85, role: 'chaos' },
  'Vinnie Johnson':    { trashTalk: 70, agitator: 52, intimidation: 48, composure: 65, retaliationRisk: 35, refRespect: 60, technicalRisk: 38, crowdFuel: 60, role: 'heatcheck' },
  'John Salley':       { trashTalk: 62, agitator: 66, intimidation: 78, composure: 55, retaliationRisk: 50, refRespect: 50, technicalRisk: 60, crowdFuel: 55, role: 'shotblocker_talk' },
  'Adrian Dantley':    { trashTalk: 52, agitator: 48, intimidation: 64, composure: 75, retaliationRisk: 35, refRespect: 65, technicalRisk: 42, crowdFuel: 45, role: 'quiet_assassin' },
  'Joe Dumars':        { trashTalk: 24, agitator: 18, intimidation: 50, composure: 92, retaliationRisk: 15, refRespect: 85, technicalRisk: 12, crowdFuel: 30, role: 'professional' },
  'Sidney Green':      { trashTalk: 36, agitator: 45, intimidation: 64, composure: 60, retaliationRisk: 40, refRespect: 55, technicalRisk: 35, crowdFuel: 35, role: 'physical_quiet' },
  'Tony Campbell':     { trashTalk: 30, agitator: 28, intimidation: 38, composure: 70, retaliationRisk: 25, refRespect: 60, technicalRisk: 22, crowdFuel: 25, role: 'minimal' },

  // === Los Angeles Lakers (Showtime) ===
  'Magic Johnson':     { trashTalk: 78, agitator: 52, intimidation: 60, composure: 80, retaliationRisk: 30, refRespect: 80, technicalRisk: 28, crowdFuel: 96, role: 'showman' },
  'James Worthy':      { trashTalk: 38, agitator: 30, intimidation: 68, composure: 82, retaliationRisk: 25, refRespect: 78, technicalRisk: 16, crowdFuel: 72, role: 'big_game' },
  'Byron Scott':       { trashTalk: 58, agitator: 42, intimidation: 48, composure: 72, retaliationRisk: 35, refRespect: 65, technicalRisk: 26, crowdFuel: 78, role: 'confident_shooter' },
  'Kareem Abdul-Jabbar': { trashTalk: 18, agitator: 16, intimidation: 75, composure: 92, retaliationRisk: 20, refRespect: 95, technicalRisk: 8, crowdFuel: 42, role: 'reserved_star' },
  'A.C. Green':        { trashTalk: 30, agitator: 36, intimidation: 62, composure: 80, retaliationRisk: 35, refRespect: 68, technicalRisk: 10, crowdFuel: 60, role: 'hustle' },
  'Michael Cooper':    { trashTalk: 64, agitator: 68, intimidation: 58, composure: 68, retaliationRisk: 50, refRespect: 60, technicalRisk: 32, crowdFuel: 70, role: 'defensive_chirp' },
  'Mychal Thompson':   { trashTalk: 46, agitator: 58, intimidation: 72, composure: 65, retaliationRisk: 45, refRespect: 55, technicalRisk: 34, crowdFuel: 50, role: 'island_big' },
  'Kurt Rambis':       { trashTalk: 44, agitator: 76, intimidation: 70, composure: 60, retaliationRisk: 65, refRespect: 50, technicalRisk: 42, crowdFuel: 68, role: 'crowd_fav' },
  'Billy Thompson':    { trashTalk: 32, agitator: 38, intimidation: 60, composure: 70, retaliationRisk: 35, refRespect: 60, technicalRisk: 20, crowdFuel: 62, role: 'rookie_burst' },
  'Wes Matthews':      { trashTalk: 50, agitator: 46, intimidation: 45, composure: 68, retaliationRisk: 35, refRespect: 60, technicalRisk: 28, crowdFuel: 54, role: 'backup_chatter' },

  // === Boston Celtics ===
  'Larry Bird':        { trashTalk: 94, agitator: 76, intimidation: 75, composure: 82, retaliationRisk: 40, refRespect: 85, technicalRisk: 34, crowdFuel: 82, role: 'legend_chirp' },
  'Kevin McHale':      { trashTalk: 58, agitator: 50, intimidation: 82, composure: 72, retaliationRisk: 45, refRespect: 65, technicalRisk: 22, crowdFuel: 60, role: 'post_confidence' },
  'Robert Parish':     { trashTalk: 22, agitator: 38, intimidation: 80, composure: 88, retaliationRisk: 30, refRespect: 85, technicalRisk: 12, crowdFuel: 38, role: 'quiet_authority' },
  'Dennis Johnson':    { trashTalk: 66, agitator: 70, intimidation: 65, composure: 78, retaliationRisk: 45, refRespect: 62, technicalRisk: 30, crowdFuel: 62, role: 'tough_guard' },
  'Danny Ainge':       { trashTalk: 72, agitator: 78, intimidation: 50, composure: 60, retaliationRisk: 55, refRespect: 50, technicalRisk: 44, crowdFuel: 74, role: 'irritant' },
  'Jerry Sichting':    { trashTalk: 28, agitator: 24, intimidation: 45, composure: 85, retaliationRisk: 25, refRespect: 72, technicalRisk: 10, crowdFuel: 42, role: 'steady_backup' },
  'Bill Walton':       { trashTalk: 36, agitator: 34, intimidation: 68, composure: 82, retaliationRisk: 30, refRespect: 75, technicalRisk: 12, crowdFuel: 46, role: 'cerebral' },
  'Fred Roberts':      { trashTalk: 24, agitator: 28, intimidation: 58, composure: 80, retaliationRisk: 30, refRespect: 65, technicalRisk: 12, crowdFuel: 36, role: 'reserve_quiet' },
  'Darren Daye':       { trashTalk: 36, agitator: 38, intimidation: 55, composure: 72, retaliationRisk: 35, refRespect: 60, technicalRisk: 20, crowdFuel: 48, role: 'bench_slash' },
  'Greg Kite':         { trashTalk: 30, agitator: 56, intimidation: 70, composure: 65, retaliationRisk: 55, refRespect: 50, technicalRisk: 36, crowdFuel: 30, role: 'foul_sponge' },

  // === Houston Rockets (Twin Towers) ===
  'Akeem Olajuwon':    { trashTalk: 70, agitator: 58, intimidation: 85, composure: 85, retaliationRisk: 35, refRespect: 88, technicalRisk: 34, crowdFuel: 86, role: 'quiet_dominant' },
  'Ralph Sampson':     { trashTalk: 34, agitator: 38, intimidation: 82, composure: 80, retaliationRisk: 30, refRespect: 75, technicalRisk: 18, crowdFuel: 58, role: 'quiet_mismatch' },
  'Rodney McCray':     { trashTalk: 32, agitator: 40, intimidation: 62, composure: 82, retaliationRisk: 30, refRespect: 70, technicalRisk: 12, crowdFuel: 52, role: 'glue' },
  'Robert Reid':       { trashTalk: 42, agitator: 38, intimidation: 60, composure: 75, retaliationRisk: 35, refRespect: 65, technicalRisk: 20, crowdFuel: 50, role: 'steady_vet' },
  'Dirk Minniefield':  { trashTalk: 48, agitator: 52, intimidation: 48, composure: 68, retaliationRisk: 40, refRespect: 58, technicalRisk: 32, crowdFuel: 58, role: 'guard_confidence' },
  'Allen Leavell':     { trashTalk: 28, agitator: 26, intimidation: 45, composure: 82, retaliationRisk: 25, refRespect: 70, technicalRisk: 10, crowdFuel: 42, role: 'stabilizer' },
  'Lewis Lloyd':       { trashTalk: 58, agitator: 48, intimidation: 55, composure: 65, retaliationRisk: 40, refRespect: 55, technicalRisk: 30, crowdFuel: 70, role: 'wing_attack' },
  'Mitchell Wiggins':  { trashTalk: 54, agitator: 64, intimidation: 60, composure: 62, retaliationRisk: 50, refRespect: 55, technicalRisk: 34, crowdFuel: 72, role: 'guard_crasher' },
  'Jim Petersen':      { trashTalk: 34, agitator: 52, intimidation: 68, composure: 70, retaliationRisk: 40, refRespect: 55, technicalRisk: 28, crowdFuel: 42, role: 'reserve_big' },
  'Buck Johnson':      { trashTalk: 34, agitator: 40, intimidation: 60, composure: 72, retaliationRisk: 35, refRespect: 60, technicalRisk: 22, crowdFuel: 56, role: 'rookie_athlete' },
};

// On-screen bubble phrases per player (one chosen per trash-talk event)
export const TRASH_TALK_BUBBLES = {
  // Pistons
  'Bill Laimbeer':       ['Still talking!', "Under his skin!", 'Laimbeer loves this!', "He's stirring it up!"],
  'Rick Mahorn':         ['No easy ones!', 'Mahorn sends a message!', 'That paint is crowded!'],
  'Isiah Thomas':        ['Zeke is smiling now!', "He's got something to say!", 'Isiah is feeling it!'],
  'Dennis Rodman':       ['Rodman is everywhere!', 'Pure chaos!', 'He kept it alive again!'],
  'Vinnie Johnson':      ['The Microwave is warming up!', 'Vinnie wants another one!', "He's heating up!"],
  'John Salley':         ['Not in here!', 'Swatted!', 'Got that one!'],
  'Adrian Dantley':      ['Too easy.', 'Fouled again?', 'Watch your feet.'],
  'Joe Dumars':          ['Just doing my job.', 'No extra needed.'],
  'Sidney Green':        ['Down low.', 'Make them work.'],
  'Tony Campbell':       ['Good minutes.'],
  // Lakers
  'Magic Johnson':       ['Showtime, baby!', 'Magic sees everything!', "He's smiling now!", 'That pass was special!', 'The Forum is alive!'],
  'James Worthy':        ['Big Game James!', 'Worthy beats him baseline!', 'Smooth finish!', 'He made that look easy!'],
  'Byron Scott':         ["Scott is running!", "He's filling the lane!", 'Byron is feeling it!', 'That jumper is clean!'],
  'Kareem Abdul-Jabbar': ['Automatic.', 'Too high to reach.', 'Good night.', 'Nothing but sky.', 'Still unstoppable.', 'Nothing rushed. Nothing wasted.'],
  'A.C. Green':          ['A.C. keeps it alive!', 'Pure hustle!', 'Green beats them downcourt!', "That's effort!"],
  'Michael Cooper':      ['Coop is locked in!', "He's all over him!", 'That defense travels!', 'Coop made that happen!'],
  'Mychal Thompson':     ['Mychal goes to work!', 'Strong move inside!', 'He held his ground!'],
  'Kurt Rambis':         ['Rambis gets dirty!', "He's on the floor again!", "That's why he's out there!", 'Goggles and elbows!'],
  'Billy Thompson':      ['The rookie can fly!', 'Thompson runs it down!', 'Fresh legs!'],
  'Wes Matthews':        ['Matthews pushes it!', 'He changes the pace!', 'Good minutes from Wes!'],
  // Celtics
  'Larry Bird':          ['Bird called that one.', 'Cold-blooded.', 'He knew before he caught it.', "Larry's talking now.", "That's Bird being Bird."],
  'Kevin McHale':        ['McHale has him dancing!', 'Up, under, and in!', 'The footwork is ridiculous!', "He's stuck on an island down there."],
  'Robert Parish':       ['The Chief is steady.', 'Parish cleans it up.', 'That turnaround is smooth.', 'Nothing flashy. Just effective.'],
  'Dennis Johnson':      ['DJ takes the assignment.', "That's tough guard play.", 'Johnson is right there.', 'Big possession from DJ.'],
  'Danny Ainge':         ['Ainge is chirping!', "That one got under their skin.", 'Danny lets it fly!', 'He loves that corner.'],
  'Jerry Sichting':      ['Sichting settles them down.', 'Good steady minutes.', 'That jumper was ready.'],
  'Bill Walton':         ['Walton sees the cut!', 'Beautiful high-post pass.', "That's veteran basketball.", 'The big man conducts it.'],
  'Fred Roberts':        ['Roberts gives them good minutes.', 'Nice finish from the reserve.'],
  'Darren Daye':         ['Daye attacks the gap!', 'Good burst from the bench.'],
  'Greg Kite':           ['Kite gives them a body.', 'Nothing easy in there.', 'That was a working-man possession.'],
  // Rockets
  'Akeem Olajuwon':      ["You're chasing a ghost.", 'Which way did I go?', 'The dream is a nightmare for you.', 'Dream Shake!', 'Akeem has him frozen!', 'He erased that one!', 'The big man is everywhere!'],
  'Ralph Sampson':       ['Sampson faces up!', "That's a 7-foot-4 problem.", 'He shoots over everybody.', 'The length changes everything.'],
  'Rodney McCray':       ['McCray does the smart thing.', "That's the connector.", 'He makes the right read.', 'Defense, pass, rebound — all of it.'],
  'Robert Reid':         ['Reid knows where to go.', 'Veteran move.', 'He got to his spot.', 'That was calm.'],
  'Dirk Minniefield':    ['Dirk pushes it!', 'He probes the defense.', 'Good pace from the point.'],
  'Allen Leavell':       ['Leavell settles things.', 'Safe hands at the point.', 'Good control from the veteran.'],
  'Lewis Lloyd':         ['Lloyd attacks!', "He's looking to score.", 'That was aggressive.', 'The wing gets loose!'],
  'Mitchell Wiggins':    ['Wiggins crashes from the guard spot!', 'He came out of nowhere!', "That's pure athleticism.", 'Great energy from Wiggins!'],
  'Jim Petersen':        ['Petersen does the work.', 'Strong reserve minutes.', 'He held his ground.'],
  'Buck Johnson':        ['Buck runs the floor!', 'Young legs!', 'Johnson gives them a spark.'],
};

// Every player has a voice key — even if no audio clips exist yet (text-only fallback).
const PLAYER_AUDIO_KEY = {
  // Pistons
  'Isiah Thomas': 'isiah', 'Adrian Dantley': 'dantley', 'Bill Laimbeer': 'laimbeer',
  'Rick Mahorn': 'mahorn', 'Vinnie Johnson': 'vinnie', 'Dennis Rodman': 'rodman',
  'John Salley': 'salley', 'Joe Dumars': 'dumars', 'Sidney Green': 'sidney_green',
  'Tony Campbell': 'tony_campbell',
  // Lakers
  'Magic Johnson': 'magic', 'Kareem Abdul-Jabbar': 'kareem', 'James Worthy': 'worthy',
  'Byron Scott': 'byron', 'A.C. Green': 'ac_green', 'Michael Cooper': 'cooper',
  'Mychal Thompson': 'mychal', 'Kurt Rambis': 'rambis', 'Billy Thompson': 'billy_thompson',
  'Wes Matthews': 'wes_matthews',
  // Celtics
  'Larry Bird': 'bird', 'Kevin McHale': 'mchale', 'Robert Parish': 'parish',
  'Dennis Johnson': 'dennis_johnson', 'Danny Ainge': 'ainge', 'Jerry Sichting': 'sichting',
  'Bill Walton': 'walton', 'Fred Roberts': 'fred_roberts', 'Darren Daye': 'daye',
  'Greg Kite': 'kite',
  // Rockets
  'Akeem Olajuwon': 'akeem', 'Ralph Sampson': 'sampson', 'Rodney McCray': 'mccray',
  'Robert Reid': 'robert_reid', 'Dirk Minniefield': 'minniefield', 'Allen Leavell': 'leavell',
  'Lewis Lloyd': 'lloyd', 'Mitchell Wiggins': 'wiggins', 'Jim Petersen': 'petersen',
  'Buck Johnson': 'buck_johnson',
};

// Enforcer / agitator check — gates intimidation talk after hard fouls so
// non-enforcers (Magic, Dumars) never chirp after committing a foul.
export function isEnforcer(player) {
  const r = PERSONALITY_RATINGS[player && player.name];
  if (!r) return false;
  return ['enforcer', 'agitator', 'chaos', 'foul_sponge', 'crowd_fav'].includes(r.role);
}

// Event-type base modifiers added to the rating-derived base chance
const EVENT_MOD = {
  big_shot: 0.05,
  poster_dunk: 0.12,
  blocked_shot: 0.12,
  steal_fastbreak: 0.06,
  enforcer_foul: 0.10,
  off_rebound_traffic: 0.06,
  charge_drawn: 0.08,
  signature_score: 0.08,
  microwave_activate: 0.07,
  pick_and_pop: 0.06,
};

// Trash talk only fires after a POSITIVE event for the talking player/team.
const POSITIVE_EVENTS = new Set([
  'big_shot', 'poster_dunk', 'blocked_shot', 'steal_fastbreak',
  'off_rebound_traffic', 'charge_drawn', 'signature_score',
  'microwave_activate', 'pick_and_pop', 'enforcer_foul',
]);
const NEGATIVE_EVENTS = new Set([
  'committed_foul', 'hard_foul', 'offensive_foul', 'turnover',
  'bad_pass', 'shot_clock_violation', 'missed_bad_shot', 'fouled_shooter',
]);

// Role → badge label for the bubble
const ROLE_LABEL = {
  agitator: 'AGITATOR', enforcer: 'ENFORCER', needle: 'ZEKE', chaos: 'CHAOS',
  heatcheck: 'MICROWAVE', shotblocker_talk: 'SHOT BLOCKER', quiet_assassin: 'QUIET',
  professional: 'COOL', reserved_star: 'CAPTAIN', showman: 'SHOWTIME',
  legend_chirp: 'LEGEND', quiet_dominant: 'DREAM', physical_quiet: 'TRASH TALK',
  minimal: 'TRASH TALK',
  big_game: 'BIG GAME', confident_shooter: 'SHOOTER', hustle: 'HUSTLE',
  defensive_chirp: 'COOP', island_big: 'INSIDE', crowd_fav: 'GOGGLES',
  rookie_burst: 'ROOKIE', backup_chatter: 'BENCH',
  post_confidence: 'McHALE', quiet_authority: 'CHIEF', tough_guard: 'DJ',
  irritant: 'PESKY', steady_backup: 'STEADY', cerebral: 'PROFESSOR',
  reserve_quiet: 'RESERVE', bench_slash: 'SLASHER', foul_sponge: 'SPONGE',
  quiet_mismatch: 'TWIN TOWER', glue: 'GLUE', steady_vet: 'VETERAN',
  guard_confidence: 'PUSH', stabilizer: 'SAFE HANDS', wing_attack: 'ATTACK',
  guard_crasher: 'CRASHER', reserve_big: 'WORK', rookie_athlete: 'ROOKIE',
};

function gameElapsed(state) {
  return state.quarter * 720 + (720 - state.gameClock);
}

// Main entry: decide whether a player talks after an event.
export function rollTrashTalk(state, player, eventType, context = {}) {
  if (!player) return null;
  // Never talk after a negative event for the talking player
  if (NEGATIVE_EVENTS.has(eventType)) return null;
  // Never let the fouler celebrate his own foul
  if (context.foulerId && context.foulerId === player.id) return null;
  // Never talk when the player's team just lost the ball
  if (context.negativeForTeam && context.team === player.team) return null;
  const ratings = PERSONALITY_RATINGS[player.name];
  if (!ratings) return null;
  if (state.pendingTrashTalk) return null; // don't stack

  // Cooldown — ~10 sim-seconds game-wide between trash-talk events
  const now = gameElapsed(state);
  if (state.lastTrashTalkElapsed != null && now - state.lastTrashTalkElapsed < 10) return null;

  // Base chance from TrashTalk rating (0-99 → 0.0-0.35)
  let chance = (ratings.trashTalk / 99) * 0.35;

  // Event-type modifier
  chance += EVENT_MOD[eventType] || 0;

  // Game intensity — clutch time (Q4, <5 min, within 8 pts)
  const diff = Math.abs(state.score[state.teamKeys.team1] - state.score[state.teamKeys.team2]);
  const isClutch = state.quarter >= 4 && state.gameClock < 300 && diff <= 8;
  if (isClutch) chance += 0.06;

  // Score pressure (close game, any time)
  if (diff <= 5) chance += 0.03;

  // Rivalry — Bad Boys vs the classic powers
  const opp = Object.values(state.teamKeys).find(k => k !== player.team);
  if (player.team === 'pistons' && (opp === 'lakers' || opp === 'celtics')) chance += 0.04;

  // Composure penalty — calm players talk less
  chance -= ((ratings.composure - 50) / 99) * 0.12;

  // Referee strictness — small flat reduction
  chance -= 0.03;

  chance = clamp(chance, 0, 0.70);
  if (Math.random() >= chance) return null;

  const bubbles = TRASH_TALK_BUBBLES[player.name];
  const bubble = bubbles ? bubbles[Math.floor(Math.random() * bubbles.length)] : '...';

  state.lastTrashTalkElapsed = now;

  const talk = {
    playerKey: PLAYER_AUDIO_KEY[player.name] || null,
    playerName: player.name,
    team: player.team,
    bubble,
    role: ratings.role,
    roleLabel: ROLE_LABEL[ratings.role] || 'TRASH TALK',
    eventType,
  };

  applyTrashTalkEffects(state, player, talk, ratings, opp);
  state.pendingTrashTalk = talk;
  return talk;
}

// Small gameplay effects — never cosmetic-only.
function applyTrashTalkEffects(state, player, talk, ratings, opp) {
  // Crowd / teammate energy boost
  state.momentum[player.team] = clamp(
    (state.momentum[player.team] || 0) + 0.4 + ratings.crowdFuel / 99, -6, 6
  );
  // Opponent composure drop
  state.momentum[opp] = clamp((state.momentum[opp] || 0) - 0.3, -6, 6);

  // Technical foul risk — the ref may T up a serial agitator
  if (Math.random() < (ratings.technicalRisk / 99) * 0.10) {
    state.score[opp] += 1; // technical FT assumed made (keeps game flow)
    state.momentum[player.team] = clamp((state.momentum[player.team] || 0) - 1, -6, 6);
    state.gameLog.unshift(`🟨 Technical foul on ${player.name}! ${opp} shoots 1 FT.`);
    if (state.gameLog.length > 15) state.gameLog.pop();
    talk.technical = true;
    return;
  }

  // Opponent star fires back (rare — turns the energy around)
  if (Math.random() < 0.12) {
    const oppStars = state.players.filter(p => p.team === opp && p.star && p.onCourt);
    if (oppStars.length > 0) {
      const fired = oppStars[Math.floor(Math.random() * oppStars.length)];
      state.momentum[opp] = clamp((state.momentum[opp] || 0) + 1.0, -6, 6);
      state.momentum[player.team] = clamp((state.momentum[player.team] || 0) - 0.4, -6, 6);
      state.gameLog.unshift(`🔥 ${fired.name} fires back!`);
      if (state.gameLog.length > 15) state.gameLog.pop();
    }
  }
}