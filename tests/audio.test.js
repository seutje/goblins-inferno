import { playSound, initAudio, setMuted, loadMuted } from '../src/js/audio.js';

describe('audio helpers', () => {
  beforeEach(() => {
    const store = {};
    global.localStorage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = v; }
    };
  });

  test('audio functions exist and are callable in Node', () => {
    // In Node/Jest, initAudio should no-op and playSound should not throw
    expect(() => initAudio()).not.toThrow();
    expect(() => setMuted(true)).not.toThrow();
    expect(() => playSound('fire')).not.toThrow();
  });

  test('setMuted persists preference', () => {
    setMuted(true);
    expect(loadMuted()).toBe(true);
    setMuted(false);
    expect(loadMuted()).toBe(false);
  });
});
