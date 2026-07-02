import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Mic, Image as ImageIcon } from 'lucide-react';
import OffenseContent from '@/components/lakers/OffenseContent';

export default function LakersOffense() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex justify-center" style={{ backgroundColor: '#1a1a1c' }}>
      <div className="w-full max-w-md flex flex-col min-h-screen">
        {/* Top Nav */}
        <header
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: '#2d2d30' }}
        >
          <button className="p-1" style={{ color: '#ffffff' }} aria-label="Menu">
            <Menu className="w-5 h-5" />
          </button>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[8px] font-bold"
            style={{ backgroundColor: '#552583', color: '#FDB927' }}
          >
            LAL
          </div>
          <button
            onClick={() => navigate('/')}
            className="p-1"
            style={{ color: '#ffffff' }}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <OffenseContent />
        </main>

        {/* Bottom Ask Anything Bar */}
        <div
          className="sticky bottom-0 px-4 py-3 border-t shrink-0"
          style={{ backgroundColor: '#1a1a1c', borderColor: '#2d2d30' }}
        >
          <div
            className="flex items-center gap-3 rounded-full px-4 py-2.5"
            style={{ backgroundColor: '#2d2d30' }}
          >
            <span className="text-sm flex-1" style={{ color: '#a0a0a0' }}>
              Ask anything
            </span>
            <button style={{ color: '#a0a0a0' }} aria-label="Image search">
              <ImageIcon className="w-4 h-4" />
            </button>
            <button style={{ color: '#a0a0a0' }} aria-label="Voice search">
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}