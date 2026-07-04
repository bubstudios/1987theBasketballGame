import { useRef, useCallback, useEffect, useState } from 'react';

// useRobotVoice — speaks text via the browser's speechSynthesis API using a
// flat, low-pitched "robot" voice. Used for command feedback, trash talk, and
// game announcements. Respects a mute flag synced from the court sound toggle.
//
// Mobile browsers require the FIRST speechSynthesis.speak() to happen inside a
// user gesture. We expose `enabled` (false until unlocked) so the UI can show a
// prompt, and `enable()` which speaks an audible confirmation on first tap.
export function useRobotVoice() {
  const mutedRef = useRef(false);
  const [enabled, setEnabled] = useState(false);
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

  // Unlock speech on first user gesture — speaks an audible confirmation
  const enable = useCallback(() => {
    if (!supported || enabled) return;
    setEnabled(true);
    try {
      const u = new SpeechSynthesisUtterance('Voice enabled.');
      u.pitch = 0;
      u.rate = 0.85;
      u.volume = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) { /* noop */ }
  }, [supported, enabled]);

  useEffect(() => {
    if (!supported || enabled) return;
    const handler = () => enable();
    window.addEventListener('pointerdown', handler, { once: true });
    window.addEventListener('keydown', handler, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
    };
  }, [supported, enabled, enable]);

  useEffect(() => () => {
    if (supported) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  }, [supported]);

  return { speak, setMuted, enabled, supported };
}