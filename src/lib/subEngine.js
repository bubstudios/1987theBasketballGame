// Substitution logic extracted from gameEngine.js to reduce file size.
// Handles position-group matching, fatigue-based subs, starter returns, and foul-outs.

import { recomputeMatchups } from './defenseEngine';

// Position groups for natural substitution matching
const POSITION_GROUPS = {
  PG: 'guard', SG: 'guard',
  SF: 'wing',
  PF: 'big', C: 'big',
};

function findSubstitute(outgoing, bench) {
  const outGroup = POSITION_GROUPS[outgoing.position] || 'wing';
  // Prefer same position group; fall back to any available bench player
  const sameGroup = bench.filter(b => (POSITION_GROUPS[b.position] || 'wing') === outGroup);
  const pool = sameGroup.length > 0 ? sameGroup : bench;
  if (pool.length === 0) return null;
  // Most rested player in the pool
  let best = pool[0];
  pool.forEach(b => { if (b.fatigue < best.fatigue) best = b; });
  // Only sub in if the replacement is reasonably rested
  return best.fatigue < 50 ? best : null;
}

function generateSubCommentary(state, outgoing, incoming, reason) {
  const isClutch = state.quarter >= 4 && state.gameClock <= 120;
  const msgs = [];

  if (reason === 'fatigue') {
    // Tired player coming out for a breather
    if (outgoing.fatigue > 82) {
      msgs.push(`${outgoing.name} is gassed — ${incoming.name} steps in to spell him.`);
      msgs.push(`Running on empty: ${outgoing.name} hits the bench for ${incoming.name}.`);
      msgs.push(`${outgoing.name} needs a breather. ${incoming.name} enters the game.`);
    } else {
      msgs.push(`Coach rests ${outgoing.name}, bringing in ${incoming.name} for a spark.`);
      msgs.push(`${outgoing.name} catches a blow. ${incoming.name} checks in.`);
      msgs.push(`Quick breather for ${outgoing.name} — ${incoming.name} takes the floor.`);
    }
    if (outgoing.star) {
      msgs.push(`${outgoing.name} has logged heavy minutes — ${incoming.name} gives him a rest.`);
    }
    if (isClutch) {
      msgs.push(`Clutch timeout: ${outgoing.name} is drained, ${incoming.name} comes in to finish.`);
    }
  } else if (reason === 'return') {
    // Starter returning fresh
    msgs.push(`${incoming.name} is rested and back in — ${outgoing.name} takes a seat.`);
    msgs.push(`Fresh legs: ${incoming.name} returns to the floor for ${outgoing.name}.`);
    msgs.push(`Rest over for ${incoming.name}. ${outgoing.name} heads to the bench.`);
    if (isClutch) {
      msgs.push(`Clutch move: ${incoming.name} re-enters for ${outgoing.name} to close it out.`);
    }
    if (incoming.star) {
      msgs.push(`${incoming.name} is back and ready — coach wants his star on the floor.`);
    }
  }

  if (reason === 'foulout') {
    msgs.push(`${outgoing.name} has fouled out — ${incoming.name} checks in.`);
    msgs.push(`Six fouls on ${outgoing.name}. ${incoming.name} enters the game.`);
    if (isClutch) msgs.push(`${outgoing.name} disqualified — ${incoming.name} finishes the game.`);
  }

  return msgs[Math.floor(Math.random() * msgs.length)];
}

export function executeSubstitution(state, outgoing, incoming, reason = 'fatigue') {
  // Incoming player takes the outgoing's court spot and index
  incoming.onCourt = true;
  incoming.courtIndex = outgoing.courtIndex;
  incoming.x = outgoing.x;
  incoming.y = outgoing.y;
  incoming.targetX = outgoing.targetX;
  incoming.targetY = outgoing.targetY;
  incoming.isCutting = false;
  incoming.cutTimer = 0;

  outgoing.onCourt = false;
  outgoing.courtIndex = null;
  outgoing.isCutting = false;
  // Send the outgoing player to the bench area
  outgoing.targetX = outgoing.benchSpotX;
  outgoing.targetY = outgoing.benchSpotY;

  // Transfer ball if the outgoing player was the carrier
  if (state.ball.carrier === outgoing.id) {
    state.ball.carrier = incoming.id;
    incoming.hasBall = true;
    outgoing.hasBall = false;
    state.ball.x = incoming.x;
    state.ball.y = incoming.y;
  }

  state.gameLog.unshift(`🔄 ${incoming.name} checks in for ${outgoing.name}`);
  if (state.gameLog.length > 15) state.gameLog.pop();

  // Dedicated substitution log — preserves full history with game context
  const mins = Math.floor((720 - state.gameClock) / 60);
  const secs = Math.floor((720 - state.gameClock) % 60);
  const clockLabel = `Q${state.quarter} ${mins}:${String(secs).padStart(2, '0')}`;
  state.substitutionLog.unshift({
    clockLabel,
    quarter: state.quarter,
    gameClock: state.gameClock,
    incoming: incoming.name,
    outgoing: outgoing.name,
    team: incoming.team,
  });
  if (state.substitutionLog.length > 200) state.substitutionLog.pop();

  // Dynamic commentary — short contextual message explaining the coach's call
  const commentary = generateSubCommentary(state, outgoing, incoming, reason);
  state.substitutionCommentary.unshift({
    clockLabel,
    message: commentary,
    incoming: incoming.name,
    outgoing: outgoing.name,
    team: incoming.team,
    incomingStar: incoming.star || false,
    outgoingStar: outgoing.star || false,
    incomingFatigue: incoming.fatigue,
    outgoingFatigue: outgoing.fatigue,
    reason,
  });
  if (state.substitutionCommentary.length > 12) state.substitutionCommentary.pop();
  recomputeMatchups(state);
}

export function checkSubstitutions(state) {
  const teams = [state.teamKeys.team1, state.teamKeys.team2];

  teams.forEach(team => {
    const onCourt = state.players.filter(p => p.team === team && p.onCourt);
    const bench = state.players.filter(p => p.team === team && !p.onCourt && !p.fouledOut);
    if (bench.length === 0) return;

    // 1) Sub OUT tired players — stars tolerate more fatigue before subbing
    let mostTired = null;
    onCourt.forEach(p => {
      const threshold = p.star ? 85 : 72;
      if (p.fatigue >= threshold && (!mostTired || p.fatigue > mostTired.fatigue)) {
        mostTired = p;
      }
    });

    if (mostTired) {
      const sub = findSubstitute(mostTired, bench);
      if (sub) {
        executeSubstitution(state, mostTired, sub, 'fatigue');
        return; // one sub per team per check
      }
    }

    // 2) Sub STARTERS back IN once they've recovered on the bench
    const recoveredStarter = bench.find(p => p.isStarter && p.fatigue < 25);
    if (recoveredStarter) {
      const benchOnCourt = onCourt.filter(p => !p.isStarter);
      if (benchOnCourt.length > 0) {
        let target = benchOnCourt[0];
        benchOnCourt.forEach(p => { if (p.fatigue > target.fatigue) target = p; });
        if (target.fatigue > 40) {
          executeSubstitution(state, target, recoveredStarter, 'return');
        }
      }
    }
  });
}