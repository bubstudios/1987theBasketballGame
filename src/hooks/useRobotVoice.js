import { useRef, useCallback, useEffect } from 'react';

// useAnnouncerVoice — speaks text via the browser's speechSynthesis API using
// a high-energy, high-pitched, fast delivery inspired by NBA Jam's Tim
// Kitzrow. Used for command feedback, trash talk, and game announcements.
// Respects a mute flag synced from the court sound toggle.
//
// No separate "unlock" step — we just call speak() directly. On desktop this
// works without a gesture; on mobile, the game's own button taps (pause, play
// calls, speed) serve as the user gesture that unlocks speech. We call
// speechSynthesis.resume() before each utterance (Chrome workaround for a
// bug where the queue stalls and produces no sound).

// NBA Jam-style catchphrases injected into key play descriptions before speaking.
function addFlair(text) {
  if (!text) return text;
  const t = text.toUpperCase();
  // Dunks and slams → BOOMSHAKALAKA
  if (/SLAM|DUNK|POSTER/.test(t)) {
    return `${text} BOOMSHAKALAKA!`;
  }
  // Three-pointers → "FROM DOWNTOWN!"
  if (/3 PTS|\+3|THREE|DOWNTOWN/.test(t)) {
    return `${text} FROM DOWNTOWN!`;
  }
  // Big shots / signatures → "SPECTACULAR!"
  if (/DREAM SHAKE|ZEKE SPLIT|PUMP-FAKE|AND1|AND 1|\+ FOUL/.test(t)) {
    return `${text} SPECTACULAR!`;
  }
  // Misses → "OFF THE RIM!"
  if (/MISSES/.test(t)) {
    return `${text} OFF THE RIM!`;
  }
  // Steals / fast breaks → "RAZZLE-DAZZLE!"
  if (/STEALS|FAST BREAK|LEADS THE FAST/.test(t)) {
    return `${text} RAZZLE-DAZZLE!`;
  }
  return text;
}

export function useRobotVoice() {
  const mutedRef = useRef(false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const voiceRef = useRef(null);

  // Pick the most energetic available voice once voices load
  useEffect(() => {
    if (!supported) return;
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      // Prefer high-energy English voices; fall back to default
      const en = voices.filter(v => /^en/i.test(v.lang));
      const preferred = en.find(v => /Google US|Samantha|Alex|Daniel/i.test(v.name))
        || en[0]
        || voices[0];
      voiceRef.current = preferred || null;
    };
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [supported]);

  const speak = useCallback((text) => {
    if (!supported || !text || mutedRef.current) return;
    try {
      window.speechSynthesis.resume(); // Chrome workaround: queue can stall
      const flavored = addFlair(text);
      const u = new SpeechSynthesisUtterance(flavored);
      u.pitch = 1.6;   // high, excitable pitch
      u.rate = 1.35;   // fast, energetic delivery
      u.volume = 1.0;  // max volume
      if (voiceRef.current) u.voice = voiceRef.current;
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