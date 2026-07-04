import { useRef, useCallback, useEffect } from 'react';

// useRobotVoice — speaks text via the browser's speechSynthesis API using a
// flat, low-pitched "robot" voice. Used for command feedback, trash talk, and
// game announcements. Respects a mute flag synced from the court sound toggle.
export function useRobotVoice() {
  const mutedRef = useRef(false);
  const unlockedRef = useRef(false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = useCallback((text) => {
    if (!supported || !text || mutedRef.current) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.pitch = 0;    // lowest pitch → flat, robotic monotone
      u.rate = 0.85;  // slightly slow for a deliberate mechanical delivery
      u.volume = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) { /* noop */ }
  }, [supported]);

  const setMuted = useCallback((m) => { mutedRef.current = m; }, []);

  // Mobile browsers (iOS Safari, Chrome Android) require the FIRST
  // speechSynthesis.speak() call to happen inside a user gesture. This
  // one-time listener fires a silent warm-up utterance on the first tap or
  // keypress, unlocking speech for all subsequent programmatic calls.
  useEffect(() => {
    if (!supported) return;
    const unlock = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      try {
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0;
        window.speechSynthesis.speak(u);
      } catch (e) { /* noop */ }
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [supported]);

  useEffect(() => () => {
    if (supported) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  }, [supported]);

  return { speak, setMuted };
}