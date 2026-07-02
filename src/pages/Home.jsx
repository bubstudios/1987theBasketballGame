import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LAKERS_ROSTER, CELTICS_ROSTER } from '@/lib/gameData';
import { createGameState, updateGame } from '@/lib/gameEngine';
import CourtCanvas from '@/components/game/CourtCanvas';
import Scoreboard from '@/components/game/Scoreboard';
import GameControls from '@/components/game/GameControls';
import GameLog from '@/components/game/GameLog';
import RosterPanel from '@/components/game/RosterPanel';

export default function Home() {
  const [gameState, setGameState] = useState(null);
  const gameRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);

  const initGame = useCallback(() => {
    const state = createGameState(LAKERS_ROSTER, CELTICS_ROSTER);
    gameRef.current = state;
    setGameState({ ...state });
    lastTimeRef.current = null;
  }, []);

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

  const isGameOver = gameState && gameState.quarter >= 4 && gameState.gameClock <= 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="text-center pt-6 pb-4 px-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          <span style={{ color: '#FDB927' }}>Lakers</span>
          <span className="text-neutral-500 mx-2">vs</span>
          <span style={{ color: '#007A33' }}>Celtics</span>
        </h1>
        <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest">1986-87 Season · NBA Sim</p>
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
          />
        </div>

        {/* Game Over */}
        {isGameOver && (
          <div className="text-center mb-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="text-lg font-bold text-amber-400">Final Score</div>
            <div className="text-sm text-neutral-300">
              {gameState.score.lakers > gameState.score.celtics
                ? 'Lakers Win!'
                : gameState.score.celtics > gameState.score.lakers
                ? 'Celtics Win!'
                : 'Tied Game!'}
            </div>
          </div>
        )}

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left roster */}
          <div className="hidden lg:block">
            <RosterPanel roster={LAKERS_ROSTER} teamKey="lakers" />
          </div>

          {/* Court */}
          <div className="lg:col-span-2">
            <CourtCanvas gameState={gameState} />
            <div className="mt-3 flex items-center justify-center gap-6 text-[10px] text-neutral-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#552583', border: '1.5px solid #FDB927' }} />
                Lakers (Offense)
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#007A33', border: '1.5px solid #FFFFFF' }} />
                Celtics (Defense)
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                Ball
              </div>
            </div>
          </div>

          {/* Right roster */}
          <div className="hidden lg:block">
            <RosterPanel roster={CELTICS_ROSTER} teamKey="celtics" />
          </div>
        </div>

        {/* Game Log */}
        <div className="mt-4 max-w-2xl mx-auto">
          <GameLog log={gameState?.gameLog} />
        </div>

        {/* Mobile Rosters */}
        <div className="lg:hidden mt-4 grid grid-cols-2 gap-3">
          <RosterPanel roster={LAKERS_ROSTER} teamKey="lakers" />
          <RosterPanel roster={CELTICS_ROSTER} teamKey="celtics" />
        </div>
      </div>
    </div>
  );
}