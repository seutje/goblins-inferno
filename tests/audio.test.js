import { playSound, initAudio, setMuted } from '../src/audio.js';

test('audio functions exist and are callable in Node', () => {
  // In Node/Jest, initAudio should no-op and playSound should not throw
  expect(() => initAudio()).not.toThrow();
  expect(() => setMuted(true)).not.toThrow();
  expect(() => playSound('fire')).not.toThrow();
});

