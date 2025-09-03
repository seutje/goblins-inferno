import { versioned } from '../src/js/assets.js';
import { getImage, preloadAll, imageStore } from '../src/js/preload.js';

beforeAll(() => {
  globalThis.Image = class {
    constructor() {
      this.complete = true;
      this.naturalWidth = 32;
      this.naturalHeight = 32;
      this.onload = null;
      this.onerror = null;
    }
    set src(v) { this._src = v; }
    get src() { return this._src; }
  };
});

describe('Assets and Preload', () => {
  test('versioned returns unchanged without window', () => {
    delete global.window;
    expect(versioned('a/b.png')).toBe('a/b.png');
  });

  test('versioned appends ?v= when window present', () => {
    global.window = { APP_VERSION: 'abc123', location: { search: '' } };
    expect(versioned('a/b.png')).toBe('a/b.png?v=abc123');
    expect(versioned('a/b.png?foo=1')).toBe('a/b.png?foo=1&v=abc123');
  });

  test('getImage caches by path and sets version', () => {
    global.window = { APP_VERSION: 'v1', location: { search: '' } };
    const img1 = getImage('src/img/sprite-heart.png');
    const img2 = getImage('src/img/sprite-heart.png');
    expect(img1).toBe(img2);
    expect(img1.src.includes('?v=')).toBe(true);
  });

  test('preloadAll reports progress to 100%', async () => {
    const progress = [];
    await preloadAll((r) => progress.push(r));
    expect(progress.length).toBeGreaterThan(0);
    expect(progress[progress.length - 1]).toBeCloseTo(1);
    expect(imageStore.size).toBeGreaterThan(0);
  });
});

