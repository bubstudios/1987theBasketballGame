import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LAKERS_ROSTER, CELTICS_ROSTER, CLIPPERS_ROSTER, LAKERS_BENCH, CELTICS_BENCH, CLIPPERS_BENCH, TEAM_COLORS } from '@/lib/gameData';
import { createGameState, updateGame } from '@/lib/gameEngine';
import { useCourtSound } from '@/hooks/useCourtSound';
import CourtCanvas from '@/components/game/CourtCanvas';
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
  const [opponent, setOpponent] = useState('celtics');
  const gameRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const prevVelRef = useRef({});
  const { playSqueak, muted, toggleMute } = useCourtSound();

  const opponentRoster = opponent === 'celtics' ? CELTICS_ROSTER : CLIPPERS_ROSTER;
  const oppColors = TEAM_COLORS[opponent];
  const oppBench = opponent === 'celtics' ? CELTICS_BENCH : CLIPPERS_BENCH;

  const initGame = useCallback(() => {
    const oppRoster = opponent === 'celtics' ? CELTICS_ROSTER : CLIPPERS_ROSTER;
    const oppBench = opponent === 'celtics' ? CELTICS_BENCH : CLIPPERS_BENCH;
    const state = createGameState([...LAKERS_ROSTER, ...LAKERS_BENCH], [...oppRoster, ...oppBench], opponent);
    gameRef.current = state;
    prevVelRef.current = {};
    setGameState({ ...state });
    lastTimeRef.current = null;
  }, [opponent]);

  useEffect(() => {
    initGame();
  }, [initGame]);

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
    if (side === 'offense' && gameRef.current.possession !== 'lakers') return;
    if (side === 'defense' && gameRef.current.possession === 'lakers') return;
    gameRef.current.userPlayCall = { team: 'lakers', type: playId, side };
    setGameState({ ...gameRef.current });
  };

  const isGameOver = gameState && gameState.quarter >= 4 && gameState.gameClock <= 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="text-center pt-6 pb-4 px-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          <span style={{ color: '#FDB927' }}>Lakers</span>
          <span className="text-neutral-500 mx-2">vs</span>
          <span style={{ color: oppColors.primary }}>{oppColors.name}</span>
        </h1>
        <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest">1986-87 Season · NBA Sim</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <button
            onClick={() => setOpponent('celtics')}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              opponent === 'celtics' ? 'bg-green-700 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Celtics
          </button>
          <button
            onClick={() => setOpponent('clippers')}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              opponent === 'clippers' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Clippers
          </button>
        </div>
        <div className="flex items-center justify-center gap-3 mt-2">
          <Link
            to="/lakers-offense"
            className="text-xs text-amber-400 hover:text-amber-300 underline"
          >
            Lakers Offense →
          </Link>
          <Link
            to="/celtics-offense"
            className="text-xs text-green-500 hover:text-green-400 underline"
          >
            Celtics Offense →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-8">
        {/* Scoreboard */}
        <div className="mb-4">
          <Scoreboard gameState={gameState} />
        </div>

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

        {/* Coach timeout controls */}
        <div className="mb-4">
          <CoachControls gameState={gameState} opponent={opponent} onCallTimeout={handleCallTimeout} />
        </div>

        {/* Game Over */}
        {isGameOver && (
          <div className="text-center mb-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="text-lg font-bold text-amber-400">Final Score</div>
            <div className="text-sm text-neutral-300">
              {gameState.score.lakers > gameState.score[opponent]
                ? 'Lakers Win!'
                : gameState.score[opponent] > gameState.score.lakers
                ? `${oppColors.name} Win!`
                : 'Tied Game!'}
            </div>
          </div>
        )}

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left roster */}
          <div className="hidden lg:block">
            <RosterPanel roster={LAKERS_ROSTER} bench={LAKERS_BENCH} teamKey="lakers" gameState={gameState} />
          </div>

          {/* Court */}
          <div className="lg:col-span-2">
            <div className="mb-3">
              <PlayCallBar gameState={gameState} onCallPlay={handleCallPlay} />
            </div>
            <CourtCanvas gameState={gameState} />
            <div className="mt-3 flex items-center justify-center gap-6 text-[10px] text-neutral-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#552583', border: '1.5px solid #FDB927' }} />
                Lakers (Offense)
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

          {/* Right roster */}
          <div className="hidden lg:block">
            <RosterPanel roster={opponentRoster} bench={oppBench} teamKey={opponent} gameState={gameState} />
          </div>
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

        {/* Mobile Rosters */}
        <div className="lg:hidden mt-4 grid grid-cols-2 gap-3">
          <RosterPanel roster={LAKERS_ROSTER} bench={LAKERS_BENCH} teamKey="lakers" gameState={gameState} />
          <RosterPanel roster={opponentRoster} bench={oppBench} teamKey={opponent} gameState={gameState} />
        </div>
      </div>

      {/* Sticky bottom momentum & pace tracker */}
      <div className="sticky bottom-0 z-20 max-w-6xl mx-auto px-4 pb-3 pt-2 bg-gradient-to-t from-neutral-950 via-neutral-950/95 to-transparent">
        <MomentumChart gameState={gameState} />
      </div>
    </div>
  );
}