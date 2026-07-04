// 1986-87 NBA timeout rules: each team gets 7 timeouts per regulation game,
// split between "full" timeouts (~100s) and "20-second" timeouts (~60s actual).
// Coaches use them to stop opposing runs, make substitutions, or draw up plays.

import { resetPositions } from './gameEngine';
import { checkSubstitutions } from './subEngine';
import { TEAM_COLORS } from './gameData';

export const TIMEOUTS_PER_GAME = 7;

export const TIMEOUT_TYPES = {
  full: { duration: 3400, label: 'Full Timeout' },
  quick: { duration: 2000, label: '20-Second' },
};

export const TIMEOUT_PURPOSES = [
  { id: 'slow_momentum', label: 'Stop the Bleeding', desc: 'Cool off the opposing run', type: 'full' },
  { id: 'substitution', label: 'Make a Sub', desc: 'Fresh legs & reset', type: 'quick' },
  { id: 'call_play', label: 'Draw Up a Play', desc: 'Set the next possession', type: 'full' },
];

export const PLAY_CALLS = [
  { id: 'isolation', label: 'Isolation', desc: 'Clear out for the star' },
  { id: 'post_up', label: 'Post-Up', desc: 'Feed the big man' },
  { id: 'three_point', label: '3-Point Set', desc: 'Hunt the long ball' },
];

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function teamName(state, team) {
  const c = TEAM_COLORS[team];
  return c ? c.name : team;
}

function buildTimeoutMessage(state, team, type, purpose, playCallType) {
  const name = teamName(state, team);
  const opp = team === state.teamKeys.team1 ? state.teamKeys.team2 : state.teamKeys.team1;
  const oppName = teamName(state, opp);

  const messages = [];
  if (purpose === 'slow_momentum') {
    messages.push(`${name} coach calls a full timeout — gotta stop the ${oppName} run!`);
    messages.push(`Timeout ${name}: regroup and cool off the ${oppName}.`);
    messages.push(`${name} stems the tide — coach wants to kill the ${oppName} momentum.`);
  } else if (purpose === 'substitution') {
    messages.push(`${name} timeout: coach sends in fresh legs.`);
    messages.push(`20-second timeout, ${name}: quick sub and a defensive set.`);
    messages.push(`${name} uses a timeout to rotate the bench in.`);
  } else if (purpose === 'call_play') {
    const pc = PLAY_CALLS.find(p => p.id === playCallType);
    const label = pc ? pc.label : 'set play';
    messages.push(`${name} huddle: coach draws up a ${label} for the next possession.`);
    messages.push(`Full timeout, ${name}: whiteboard time — they're running a ${label}.`);
    messages.push(`${name} calls time to set up a ${label}.`);
  }
  return messages[Math.floor(Math.random() * messages.length)];
}

export function callTimeout(state, team, type, purpose, playCallType = null) {
  if (!state.timeouts || !state.timeouts[team] || state.timeouts[team].remaining <= 0) return false;
  if (state.timeoutState) return false;
  if (state.shotAnimating || state.ftState) return false;

  state.timeouts[team].remaining--;
  state.timeouts[team].used++;

  const cfg = TIMEOUT_TYPES[type] || TIMEOUT_TYPES.full;

  state.timeoutState = {
    team,
    type,
    purpose,
    playCallType,
    timer: cfg.duration,
    duration: cfg.duration,
    message: buildTimeoutMessage(state, team, type, purpose, playCallType),
    applied: false,
  };

  // Freeze live action for the huddle
  state.actionTimer = 0;
  state.passTimer = 0;
  if (state.ball.inFlight && !state.ball.isShot) state.ball.inFlight = false;

  state.gameLog.unshift(`⏸️ ${state.timeoutState.message}`);
  if (state.gameLog.length > 15) state.gameLog.pop();

  return true;
}

export function updateTimeout(state, dt) {
  const t = state.timeoutState;
  if (!t) return;

  t.timer -= dt;

  // Apply the purpose effect partway through — the coach's instruction lands
  if (!t.applied && t.timer <= t.duration * 0.55) {
    applyTimeoutPurpose(state, t);
    t.applied = true;
  }

  if (t.timer <= 0) {
    const team = t.team;
    const wasFull = t.type === 'full';

    // Teams reset to a half-court set coming out of a full timeout
    if (wasFull) {
      state.shotClock = 24;
      resetPositions(state);
    }

    // Stamp the drawn-up play onto the next offensive possession
    if (t.playCallType) {
      state.playCall = { team, type: t.playCallType };
    }

    state.timeoutState = null;
    state.turnoverCooldown = 800;
    state.actionTimer = 600;
    state.passTimer = 300;
  }
}

function applyTimeoutPurpose(state, t) {
  const team = t.team;
  const opp = team === state.teamKeys.team1 ? state.teamKeys.team2 : state.teamKeys.team1;

  switch (t.purpose) {
    case 'slow_momentum': {
      // Cut the opponent's hot streak sharply; restore composure to the caller
      const oppMom = state.momentum[opp] || 0;
      if (oppMom > 0) state.momentum[opp] = clamp(oppMom * 0.3, 0, 6);
      state.momentum[team] = clamp((state.momentum[team] || 0) + 1, -6, 6);
      state.pace = clamp(state.pace - 2, 1, 9);
      state.players.forEach(p => {
        if (p.team === team && p.onCourt) p.fatigue = clamp(p.fatigue - 5, 0, 100);
      });
      break;
    }
    case 'substitution': {
      // Force an immediate substitution check
      checkSubstitutions(state);
      state.players.forEach(p => {
        if (p.team === team && p.onCourt) p.fatigue = clamp(p.fatigue - 4, 0, 100);
      });
      break;
    }
    case 'call_play': {
      // Tactical focus huddle — quick breather; play stamps on timeout end
      state.players.forEach(p => {
        if (p.team === team && p.onCourt) p.fatigue = clamp(p.fatigue - 3, 0, 100);
      });
      break;
    }
  }
}

// AI coach (opponent only — the user controls the Lakers' timeouts)
const autoTimeoutCooldown = {};

export function checkAutoTimeout(state) {
  if (state.timeoutState) return;
  if (state.shotAnimating || state.ftState) return;

  const team = state.teamKeys.team2;
  if (!state.timeouts || !state.timeouts[team] || state.timeouts[team].remaining <= 0) return;

  const opp = state.teamKeys.team1;
  const now = state.gameClock;
  const qKey = `${state.quarter}`;
  const last = autoTimeoutCooldown[qKey];
  // Prevent rapid re-fires within the same quarter
  if (last !== undefined && Math.abs(last - now) < 35) return;

  const oppMom = state.momentum[opp] || 0;
  const scoreDiff = (state.score[team] || 0) - (state.score[opp] || 0);
  const isClutch = state.quarter >= 4 && state.gameClock <= 180;
  const isLate = state.quarter >= 4 && state.gameClock <= 120;

  // 1) Stop the bleeding: Lakers on a big run
  if (oppMom >= 4 && scoreDiff <= -3) {
    if (Math.random() < 0.06) {
      callTimeout(state, team, 'full', 'slow_momentum');
      autoTimeoutCooldown[qKey] = now;
      return;
    }
  }

  // 2) Late-game stop-the-clock when trailing
  if (isLate && scoreDiff < -5 && state.timeouts[team].remaining > 1) {
    if (Math.random() < 0.04) {
      callTimeout(state, team, 'full', 'slow_momentum');
      autoTimeoutCooldown[qKey] = now;
      return;
    }
  }

  // 3) Star gassed — quick sub timeout (not in clutch minutes)
  if (!isClutch) {
    const starTired = state.players.find(p => p.team === team && p.onCourt && p.star && p.fatigue > 88);
    if (starTired && state.quarter >= 2) {
      if (Math.random() < 0.05) {
        callTimeout(state, team, 'quick', 'substitution');
        autoTimeoutCooldown[qKey] = now;
        return;
      }
    }
  }
}