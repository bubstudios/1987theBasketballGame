import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TEAMS, TEAM_COLORS } from '@/lib/gameData';
import { createGameState, updateGame, advanceToNextQuarter } from '@/lib/gameEngine';
import { Button } from '@/components/ui/button';
import { useCourtSound } from '@/hooks/useCourtSound';
import { TRASH_TALK_CLIPS } from '@/lib/trashTalkData';
import CourtCanvas from '@/components/game/CourtCanvas';
import TrashTalkBubble from '@/components/game/TrashTalkBubble';
import Scoreboard from '@/components/game/Scoreboard';
import GameControls from '@/components/game/GameControls';
import GameLog from '@/components/game/GameLog';
import RosterPanel from '@/components/game/RosterPanel';
import BoxScore from '@/components/game/BoxScore';
import MomentumChart from '@/components/game/MomentumChart';
import SubstitutionLog from '@/components/game/SubstitutionLog';
import SubstitutionCommentary from '@/components/game/SubstitutionCommentary';
import CoachControls from '@/components/game/CoachControls';
import PlayCallBar from '@/components/game/PlayCallBar';
import { callTimeout } from '@/lib/timeoutEngine';

export default function Home() {
  const [gameState, setGameState] = useState(null);
  const gameRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const prevVelRef = useRef({});
  const prevStoppedRef = useRef(false);
  const { playSqueak, playWhistle, playTrashTalk, muted, toggleMute } = useCourtSound();
  const [trashBubble, setTrashBubble] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const userTeamKey = urlParams.get('user') || 'lakers';
  const cpuTeamKey = urlParams.get('cpu') || 'celtics';
  const userTeam = TEAMS[userTeamKey];
  const cpuTeam = TEAMS[cpuTeamKey];
  const oppColors = cpuTeam.colors;
  const userAccent = userTeam.colors.secondary === '#FFFFFF' ? userTeam.colors.primary : userTeam.colors.secondary;

  const initGame = useCallback(() => {
    const state = createGameState(userTeamKey, [...userTeam.roster, ...userTeam.bench], cpuTeamKey, [...cpuTeam.roster, ...cpuTeam.bench]);
    gameRef.current = state;
    prevVelRef.current = {};
    setGameState({ ...state });
    lastTimeRef.current = null;
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Auto-clear the trash-talk bubble after it shows
  useEffect(() => {
    if (!trashBubble) return;
    const t = setTimeout(() => setTrashBubble(null), 2800);
    return () => clearTimeout(t);
  }, [trashBubble]);

  useEffect(() => {
    const loop = (timestamp) => {
      if (!gameRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }

      const dt = Math.min(timestamp - lastTimeRef.current, 50); // cap at 50ms
      lastTimeRef.current = timestamp;

      const updated = updateGame(gameRef.current, dt);
      gameRef.current = updated;

      // Detect sharp direction changes → shoe squeaks
      if (!updated.isPaused) {
        let bestSqueak = 0;
        for (const p of updated.players) {
          const prev = prevVelRef.current[p.id] || { vx: 0, vy: 0, speed: 0 };
          const vx = p.x - (prev.x ?? p.x);
          const vy = p.y - (prev.y ?? p.y);
          const speed = Math.sqrt(vx * vx + vy * vy);

          if (speed > 2 && prev.speed > 2) {
            const dot = (vx * prev.vx + vy * prev.vy) / (speed * prev.speed);
            if (dot < 0.2 && Math.random() < 0.3) {
              bestSqueak = Math.max(bestSqueak, Math.min(speed / 4, 1));
            }
          }
          prevVelRef.current[p.id] = { vx, vy, speed, x: p.x, y: p.y };
        }
        if (bestSqueak > 0) playSqueak(bestSqueak);
      }

      // Ref's whistle: fire on the rising edge of a play-stopping state
      // (foul → free throws, timeout, end-of-quarter break).
      const stopped = !!(updated.timeoutState || updated.ftState || updated.quarterBreak);
      if (stopped && !prevStoppedRef.current) playWhistle();
      prevStoppedRef.current = stopped;

      // Personality-driven trash talk: show a bubble + play audio if available
      if (updated.pendingTrashTalk) {
        const tt = updated.pendingTrashTalk;
        setTrashBubble({ ...tt, id: Date.now() });
        const clips = tt.playerKey && TRASH_TALK_CLIPS[tt.playerKey];
        if (clips && clips.length > 0) {
          const clip = clips[Math.floor(Math.random() * clips.length)];
          playTrashTalk(clip.url);
        }
        updated.gameLog.unshift(`💬 ${tt.playerName}: "${tt.bubble}"`);
        if (updated.gameLog.length > 15) updated.gameLog.pop();
        updated.pendingTrashTalk = null;
      }

      // Throttle React updates to ~30fps for performance
      setGameState(prev => {
        return { ...updated };
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handlePause = () => {
    if (gameRef.current) {
      gameRef.current.isPaused = !gameRef.current.isPaused;
      if (!gameRef.current.isPaused) {
        lastTimeRef.current = null;
      }
      setGameState({ ...gameRef.current });
    }
  };

  const handleSpeedChange = (speed) => {
    if (gameRef.current) {
      gameRef.current.gameSpeed = speed;
      setGameState({ ...gameRef.current });
    }
  };

  const handleCallTimeout = (team, type, purpose, playCallType) => {
    if (!gameRef.current) return;
    const ok = callTimeout(gameRef.current, team, type, purpose, playCallType);
    if (ok) setGameState({ ...gameRef.current });
  };

  const handleCallPlay = (playId, side) => {
    if (!gameRef.current) return;
    if (gameRef.current.timeoutState || gameRef.current.ftState || gameRef.current.shotAnimating) return;
    if (side === 'offense' && gameRef.current.possession !== userTeamKey) return;
    if (side === 'defense' && gameRef.current.possession === userTeamKey) return;
    gameRef.current.userPlayCall = { team: userTeamKey, type: playId, side };
    setGameState({ ...gameRef.current });
  };

  const handleContinue = () => {
    if (gameRef.current && gameRef.current.quarterBreak) {
      advanceToNextQuarter(gameRef.current);
      setGameState({ ...gameRef.current });
    }
  };

  const isGameOver = gameState && gameState.quarter >= 4 && gameState.gameClock <= 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="text-center pt-6 pb-4 px-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          <span style={{ color: userAccent }}>{userTeam.colors.name}</span>
          <span className="text-neutral-500 mx-2">vs</span>
          <span style={{ color: oppColors.primary }}>{oppColors.name}</span>
        </h1>
        <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest">1986-87 Season · NBA Sim</p>
        <div className="flex items-center justify-center gap-3 mt-2">
          {(userTeamKey === 'lakers' || cpuTeamKey === 'lakers') && (
            <Link to="/lakers-offense" className="text-xs text-amber-400 hover:text-amber-300 underline">
              Lakers Offense →
            </Link>
          )}
          {(userTeamKey === 'celtics' || cpuTeamKey === 'celtics') && (
            <Link to="/celtics-offense" className="text-xs text-green-500 hover:text-green-400 underline">
              Celtics Offense →
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-8">
        {/* Controls */}
        <div className="mb-4">
          <GameControls
            gameState={gameState}
            onPause={handlePause}
            onReset={initGame}
            onSpeedChange={handleSpeedChange}
            soundMuted={muted}
            onToggleSound={toggleMute}
          />
        </div>

        {/* Quarter Break — user continues to next quarter */}
        {gameState?.quarterBreak && !isGameOver && (
          <div className="mb-4 text-center py-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="text-lg font-bold text-amber-400">End of Quarter {gameState.quarter}</div>
            <div className="text-xs text-neutral-400 mt-1">Intermission — players catch their breath</div>
            <Button onClick={handleContinue} className="mt-3">
              Continue to Quarter {gameState.quarter + 1}
            </Button>
          </div>
        )}

        {/* Game Over */}
        {isGameOver && (
          <div className="text-center mb-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="text-lg font-bold text-amber-400">Final Score</div>
            <div className="text-sm text-neutral-300">
              {gameState.score[userTeamKey] > gameState.score[cpuTeamKey]
                ? `${userTeam.colors.name} Win!`
                : gameState.score[cpuTeamKey] > gameState.score[userTeamKey]
                ? `${oppColors.name} Win!`
                : 'Tied Game!'}
            </div>
          </div>
        )}

        {/* Zoomed court + compact control sidebar (score/time, play calls, timeouts) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <div className="relative">
              <CourtCanvas gameState={gameState} />
              {trashBubble && (
                <div className="absolute top-3 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
                  <TrashTalkBubble key={trashBubble.id} trashTalk={trashBubble} />
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[10px] text-neutral-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: userTeam.colors.primary, border: `1.5px solid ${userAccent}` }} />
                {userTeam.colors.name} (You)
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: oppColors.primary, border: `1.5px solid ${oppColors.secondary}` }} />
                {oppColors.name} (Defense)
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                Ball
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-3">
            <Scoreboard gameState={gameState} />
            <PlayCallBar gameState={gameState} userTeam={userTeamKey} onCallPlay={handleCallPlay} />
            <CoachControls gameState={gameState} userTeam={userTeamKey} opponent={cpuTeamKey} onCallTimeout={handleCallTimeout} />
          </div>
        </div>

        {/* Rosters */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <RosterPanel roster={userTeam.roster} bench={userTeam.bench} teamKey={userTeamKey} gameState={gameState} />
          <RosterPanel roster={cpuTeam.roster} bench={cpuTeam.bench} teamKey={cpuTeamKey} gameState={gameState} />
        </div>

        {/* Game Log */}
        <div className="mt-4 max-w-2xl mx-auto">
          <GameLog log={gameState?.gameLog} />
        </div>

        {/* Box Score */}
        <div className="mt-4 max-w-2xl mx-auto">
          <BoxScore gameState={gameState} />
        </div>

        {/* Substitution Log & Commentary */}
        <div className="mt-4 max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SubstitutionCommentary gameState={gameState} />
          <SubstitutionLog gameState={gameState} />
        </div>


      </div>

      {/* Sticky bottom momentum & pace tracker */}
      <div className="sticky bottom-0 z-20 max-w-6xl mx-auto px-4 pb-3 pt-2 bg-gradient-to-t from-neutral-950 via-neutral-950/95 to-transparent">
        <MomentumChart gameState={gameState} />
      </div>
    </div>
  );
}