import { useRef, useCallback, useEffect } from 'react';

// useRobotVoice — speaks text via the browser's speechSynthesis API using a
// flat, low-pitched "robot" voice. Used for command feedback, trash talk, and
// game announcements. Respects a mute flag synced from the court sound toggle.
export function useRobotVoice() {
  const mutedRef = useRef(false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = useCallback((text) => {
    if (!supported || !text || mutedRef.current) return;
    try {
      // Cancel any pending speech so phrases never overlap
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.pitch = 0;    // lowest pitch → flat, robotic monotone
      u.rate = 0.85;  // slightly slow for a deliberate mechanical delivery
      u.volume = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) { /* noop */ }
  }, [supported]);

  const setMuted = useCallback((m) => { mutedRef.current = m; }, []);

  useEffect(() => () => {
    if (supported) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  }, [supported]);

  return { speak, setMuted };
}