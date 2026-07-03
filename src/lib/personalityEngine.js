// personalityEngine.js — trash talk / agitator system, SEPARATE from special moves.
// A player can have a signature move and not be a trash-talker (Dumars), or be
// a primary agitator without a scoring special move (Mahorn).
//
// Trash talk is personality-driven: each player has 8 ratings (0-99) that govern
// how often he talks, how much he intimidates, and his technical-foul risk.
// Triggers are event-based (big shot, block, steal, hard foul, offensive
// rebound, charge drawn, microwave activation, signature score) — NOT tied to
// whether the player used a special move.

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
  // --- Detroit Pistons (Bad Boys) ---
  'Bill Laimbeer':     { trashTalk: 96, agitator: 99, intimidation: 92, composure: 45, retaliationRisk: 80, refRespect: 25, technicalRisk: 82, crowdFuel: 90, role: 'agitator' },
  'Rick Mahorn':       { trashTalk: 82, agitator: 94, intimidation: 98, composure: 40, retaliationRisk: 85, refRespect: 30, technicalRisk: 78, crowdFuel: 75, role: 'enforcer' },
  'Isiah Thomas':      { trashTalk: 86, agitator: 78, intimidation: 72, composure: 70, retaliationRisk: 55, refRespect: 55, technicalRisk: 58, crowdFuel: 80, role: 'needle' },
  'Dennis Rodman':     { trashTalk: 74, agitator: 88, intimidation: 90, composure: 35, retaliationRisk: 78, refRespect: 28, technicalRisk: 72, crowdFuel: 85, role: 'chaos' },
  'Vinnie Johnson':   { trashTalk: 70, agitator: 52, intimidation: 48, composure: 65, retaliationRisk: 35, refRespect: 60, technicalRisk: 38, crowdFuel: 60, role: 'heatcheck' },
  'John Salley':       { trashTalk: 62, agitator: 66, intimidation: 78, composure: 55, retaliationRisk: 50, refRespect: 50, technicalRisk: 60, crowdFuel: 55, role: 'shotblocker_talk' },
  'Adrian Dantley':   { trashTalk: 52, agitator: 48, intimidation: 64, composure: 75, retaliationRisk: 35, refRespect: 65, technicalRisk: 42, crowdFuel: 45, role: 'quiet_assassin' },
  'Joe Dumars':       { trashTalk: 24, agitator: 18, intimidation: 50, composure: 92, retaliationRisk: 15, refRespect: 85, technicalRisk: 12, crowdFuel: 30, role: 'professional' },
  'Sidney Green':     { trashTalk: 36, agitator: 45, intimidation: 64, composure: 60, retaliationRisk: 40, refRespect: 55, technicalRisk: 35, crowdFuel: 35, role: 'physical_quiet' },
  'Tony Campbell':    { trashTalk: 30, agitator: 28, intimidation: 38, composure: 70, retaliationRisk: 25, refRespect: 60, technicalRisk: 22, crowdFuel: 25, role: 'minimal' },
  // --- Existing stars (ratings so the personality system covers them) ---
  'Kareem Abdul-Jabbar': { trashTalk: 40, agitator: 30, intimidation: 70, composure: 88, retaliationRisk: 25, refRespect: 90, technicalRisk: 15, crowdFuel: 40, role: 'reserved_star' },
  'Magic Johnson':     { trashTalk: 55, agitator: 50, intimidation: 60, composure: 80, retaliationRisk: 30, refRespect: 80, technicalRisk: 20, crowdFuel: 70, role: 'showman' },
  'Larry Bird':        { trashTalk: 78, agitator: 65, intimidation: 75, composure: 82, retaliationRisk: 35, refRespect: 85, technicalRisk: 25, crowdFuel: 75, role: 'legend_chirp' },
  'Akeem Olajuwon':    { trashTalk: 35, agitator: 30, intimidation: 80, composure: 85, retaliationRisk: 25, refRespect: 88, technicalRisk: 15, crowdFuel: 50, role: 'quiet_dominant' },
};

// On-screen bubble phrases per player (one chosen per trash-talk event)
export const TRASH_TALK_BUBBLES = {
  'Bill Laimbeer':       ['Still talking!', "Under his skin!", 'Laimbeer loves this!', "He's stirring it up!"],
  'Rick Mahorn':         ['No easy ones!', 'Mahorn sends a message!', 'That paint is crowded!'],
  'Isiah Thomas':        ['Zeke is smiling now!', "He's got something to say!", 'Isiah is feeling it!'],
  'Dennis Rodman':       ['Rodman is everywhere!', 'Pure chaos!', 'He kept it alive again!'],
  'Vinnie Johnson':      ['The Microwave is warming up!', 'Vinnie wants another one!', "He's heating up!"],
  'John Salley':         ['Not in here!', 'Swatted!', 'Got that one!'],
  'Adrian Dantley':      ['Too easy.', 'Fouled again?', 'Watch your feet.'],
  'Kareem Abdul-Jabbar': ['Automatic.', 'Too high to reach.', 'Good night.', 'Nothing but sky.'],
  'Magic Johnson':       ['Showtime, baby!', 'You were looking the wrong way.', 'Too easy for him.'],
  'Larry Bird':          ['That was worth three, but it felt like four.', "You're leaving me open? Big mistake.", 'Nothing but net.'],
  'Akeem Olajuwon':      ["You're chasing a ghost.", 'Which way did I go?', 'The dream is a nightmare for you.'],
};

// Audio clip key — only players with pre-generated TTS clips.
const PLAYER_AUDIO_KEY = {
  'Kareem Abdul-Jabbar': 'kareem',
  'Larry Bird': 'bird',
  'Magic Johnson': 'magic',
  'Akeem Olajuwon': 'akeem',
  'Isiah Thomas': 'isiah',
};

// Role → badge label for the bubble
const ROLE_LABEL = {
  agitator: 'AGITATOR', enforcer: 'ENFORCER', needle: 'ZEKE', chaos: 'CHAOS',
  heatcheck: 'MICROWAVE', shotblocker_talk: 'SHOT BLOCKER', quiet_assassin: 'QUIET',
  professional: 'COOL', reserved_star: 'CAPTAIN', showman: 'SHOWTIME',
  legend_chirp: 'LEGEND', quiet_dominant: 'DREAM', physical_quiet: 'TRASH TALK',
  minimal: 'TRASH TALK',
};

// Event-type base modifiers added to the rating-derived base chance
const EVENT_MOD = {
  big_shot: 0.05,
  poster_dunk: 0.12,
  blocked_shot: 0.12,
  steal_fastbreak: 0.06,
  hard_foul: 0.20,
  off_rebound_traffic: 0.06,
  charge_drawn: 0.08,
  signature_score: 0.08,
  microwave_activate: 0.07,
  pick_and_pop: 0.06,
};

function gameElapsed(state) {
  return state.quarter * 720 + (720 - state.gameClock);
}

// Main entry: decide whether a player talks after an event.
// Assigns a talk object to state.pendingTrashTalk and applies small effects.
// Returns the talk object, or null if he stays quiet.
export function rollTrashTalk(state, player, eventType) {
  if (!player) return null;
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