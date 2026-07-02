import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function GameLog({ log }) {
  if (!log || log.length === 0) return null;

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-700 p-3">
      <div className="text-xs text-neutral-500 uppercase tracking-widest mb-2 font-semibold">Play-by-Play</div>
      <ScrollArea className="h-44">
        <div className="space-y-1">
          {log.map((entry, i) => (
            <div
              key={i}
              className={`text-xs py-1 px-2 rounded transition-opacity ${
                i === 0 ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400'
              }`}
            >
              {entry}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}