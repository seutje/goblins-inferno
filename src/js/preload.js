import { versioned } from './assets.js';

// Shared image store so game code can reuse preloaded Image objects
export const imageStore = new Map();
export function getImage(path) {
  const key = path;
  let img = imageStore.get(key);
  if (!img) {
    img = new Image();
    img.src = versioned(path);
    imageStore.set(key, img);
  }
  return img;
}

const ASSETS = [
  // Characters
  'src/img/sprite-gnorp.png',
  'src/img/sprite-ignis.png',
  'src/img/sprite-fizzle.png',
  // Start screen
  'src/img/start.png',
  // Enemies
  'src/img/sprite-skeleton.png',
  'src/img/sprite-imp.png',
  'src/img/sprite-ogre.png',
  // Bosses
  'src/img/sprite-champion.png',
  'src/img/sprite-dragon.png',
  'src/img/sprite-collector.png',
  // Projectiles and pickups
  'src/img/sprite-projectile.png',
  'src/img/sprite-heart.png',
  'src/img/sprite-gem.png',
  'src/img/sprite-coin.png',
  // Hazard fire
  'src/img/sprite-fire.png',
  // Decor rocks (varying dimensions)
  'src/img/rock1.png',
  'src/img/rock2.png',
  'src/img/rock3.png',
  'src/img/rock4.png',
  'src/img/rock5.png',
  'src/img/rock6.png',
  'src/img/rock7.png',
  // Ground tile
  'src/img/tile-ground.png'
];

export function preloadAll(onProgress) {
  const total = ASSETS.length;
  if (!total) return Promise.resolve();
  let loaded = 0;

  function tick() {
    loaded++;
    try { if (typeof onProgress === 'function') onProgress(loaded / total); } catch {}
  }

  const promises = ASSETS.map(path => new Promise(resolve => {
    const img = getImage(path);
    if (img.complete && (img.naturalWidth || 0) > 0) { tick(); resolve(); return; }
    img.onload = () => { tick(); resolve(); };
    img.onerror = () => { tick(); resolve(); };
  }));

  return Promise.all(promises).then(() => {});
}
