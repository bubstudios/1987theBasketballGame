import React from 'react';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GameControls({ gameState, onPause, onReset, onSpeedChange }) {
  if (!gameState) return null;

  const speeds = [0.5, 1, 2, 3];

  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={onPause}
        className="bg-neutral-800 border-neutral-600 text-white hover:bg-neutral-700"
      >
        {gameState.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="bg-neutral-800 border-neutral-600 text-white hover:bg-neutral-700"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-1 ml-2">
        <Zap className="w-3 h-3 text-neutral-400" />
        {speeds.map(s => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
              gameState.gameSpeed === s
                ? 'bg-amber-500 text-black'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}