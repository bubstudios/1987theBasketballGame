import { useRef, useCallback, useEffect } from 'react';

// useRobotVoice — speaks text via the browser's speechSynthesis API using a
// flat, low-pitched "robot" voice. Used for command feedback, trash talk, and
// game announcements. Respects a mute flag synced from the court sound toggle.
//
// No separate "unlock" step — we just call speak() directly. On desktop this
// works without a gesture; on mobile, the game's own button taps (pause, play
// calls, speed) serve as the user gesture that unlocks speech. We call
// speechSynthesis.resume() before each utterance (Chrome workaround for a
// bug where the queue stalls and produces no sound).
export function useRobotVoice() {
  const mutedRef = useRef(false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = useCallback((text) => {
    if (!supported || !text || mutedRef.current) return;
    try {
      window.speechSynthesis.resume(); // Chrome workaround: queue can stall
      const u = new SpeechSynthesisUtterance(text);
      u.pitch = 0.1;   // very low pitch → robotic, but not 0 (some engines skip 0)
      u.rate = 0.85;   // slightly slow for a deliberate mechanical delivery
      u.volume = 1.0;  // max volume
      window.speechSynthesis.speak(u);
    } catch (e) { /* noop */ }
  }, [supported]);

  const setMuted = useCallback((m) => { mutedRef.current = m; }, []);

  // Keep the queue alive — Chrome pauses speechSynthesis after ~15s of inactivity
  useEffect(() => {
    if (!supported) return;
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.resume();
      }
    }, 10000);
    return () => clearInterval(keepAlive);
  }, [supported]);

  useEffect(() => () => {
    if (supported) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  }, [supported]);

  return { speak, setMuted, supported };
}