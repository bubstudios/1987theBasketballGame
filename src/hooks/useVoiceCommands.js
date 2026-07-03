import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useVoiceCommands — continuous browser speech recognition for in-game voice commands.
 * Pass a map of { word: callback }. Whenever a command word is heard, its callback
 * fires (with a 1.5s cooldown to prevent double-fires from interim results).
 *
 * Chrome (Android): fully supported, continuous, uses Google's servers for recognition.
 * Safari (iOS 14.5+): works but auto-stops after silence → auto-restarts via onend.
 * Firefox: not supported (graceful no-op).
 *
 * Returns { listening, error, toggle, supported, lastMatch }
 */
export function useVoiceCommands(commands) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const [lastMatch, setLastMatch] = useState(null);
  const recRef = useRef(null);
  const wantRef = useRef(false);
  const lastFireRef = useRef(0);
  const cmdRef = useRef(commands);

  useEffect(() => { cmdRef.current = commands; }, [commands]);

  const SR = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;
  const supported = !!SR;

  const start = useCallback(() => {
    if (!SR) { setError('unsupported'); return; }
    if (recRef.current) { try { recRef.current.abort(); } catch (e) { /* noop */ } }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      // Gather the latest transcript chunk (interim or final)
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      text = text.trim().toLowerCase();
      if (!text) return;

      // Match the first recognized command word in the transcript
      const words = text.split(/\s+/);
      const cmds = cmdRef.current;
      let matched = null;
      for (const w of words) {
        if (cmds[w]) { matched = w; break; }
      }
      if (!matched) return;

      // Cooldown — blocks rapid re-fires from evolving interim results
      const now = Date.now();
      if (now - lastFireRef.current < 1500) return;
      lastFireRef.current = now;

      setLastMatch(matched);
      if (cmds[matched]) cmds[matched]();
    };

    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setError('denied');
        wantRef.current = false;
        setListening(false);
      } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setError(e.error);
      }
    };

    // Safari stops recognition after a pause — auto-restart while the user wants it on
    rec.onend = () => {
      if (wantRef.current) {
        try { rec.start(); } catch (e) { /* already starting */ }
      } else {
        setListening(false);
      }
    };

    recRef.current = rec;
    wantRef.current = true;
    setError(null);
    try {
      rec.start();
      setListening(true);
    } catch (e) {
      setError('start_failed');
    }
  }, [SR]);

  const stop = useCallback(() => {
    wantRef.current = false;
    if (recRef.current) { try { recRef.current.stop(); } catch (e) { /* noop */ } }
    setListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (wantRef.current) stop();
    else start();
  }, [start, stop]);

  // Cleanup on unmount
  useEffect(() => () => {
    wantRef.current = false;
    if (recRef.current) { try { recRef.current.abort(); } catch (e) { /* noop */ } }
  }, []);

  return { listening, error, toggle, supported, lastMatch };
}