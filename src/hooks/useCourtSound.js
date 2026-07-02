import { useRef, useState, useCallback, useEffect } from 'react';

// Synthesizes shoe-squeak-on-wood sounds using the Web Audio API.
// No external audio files needed — squeaks are generated procedurally.
export function useCourtSound() {
  const ctxRef = useRef(null);
  const mutedRef = useRef(false);
  const lastSqueakRef = useRef(0);
  const [muted, setMuted] = useState(false);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctxRef.current = new AC();
    }
    if (ctxRef.current && ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playSqueak = useCallback((intensity = 1) => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Global throttle so overlapping squeaks don't pile up
    if (now - lastSqueakRef.current < 0.35) return;
    lastSqueakRef.current = now;

    const dur = 0.05 + Math.random() * 0.07;

    // Master gain envelope
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(0.07 * Math.min(intensity, 1), now + 0.008);
    master.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    master.connect(ctx.destination);

    // Squeak core: sawtooth oscillator with downward pitch sweep
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    const startFreq = 1600 + Math.random() * 1800;
    const endFreq = startFreq * (0.55 + Math.random() * 0.35);
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 200), now + dur);

    // Bandpass filter to give it that rubber-on-wood friction character
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = (startFreq + endFreq) / 2;
    bp.Q.value = 6 + Math.random() * 4;

    osc.connect(bp);
    bp.connect(master);

    osc.start(now);
    osc.stop(now + dur + 0.02);
  }, [getCtx]);

  const toggleMute = useCallback(() => {
    setMuted(m => {
      const next = !m;
      mutedRef.current = next;
      if (!next) getCtx();
      return next;
    });
  }, [getCtx]);

  useEffect(() => {
    return () => {
      if (ctxRef.current) ctxRef.current.close();
    };
  }, []);

  return { playSqueak, muted, toggleMute };
}