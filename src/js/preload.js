import { versioned } from './assets.js';

const ASSETS = [
  // Characters
  'src/img/sprite-gnorp.png',
  'src/img/sprite-ignis.png',
  'src/img/sprite-fizzle.png',
  // Character select preview sheets
  'src/img/sprite-char-gnorp.png',
  'src/img/sprite-char-ignis.png',
  'src/img/sprite-char-fizzle.png',
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
  'src/img/sprite-fire.png'
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
    const img = new Image();
    img.onload = () => { tick(); resolve(); };
    img.onerror = () => { tick(); resolve(); };
    img.src = versioned(path);
  }));

  return Promise.all(promises).then(() => {});
}
