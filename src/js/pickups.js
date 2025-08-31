import { playSound } from './audio.js';
import { versioned } from './assets.js';

const SHEET_COLS = 6;
const SHEET_ROWS = 5;
const FRAME_W = 170;
const FRAME_H = 205;

export function ensurePickups(gameState) {
  if (!gameState.pickups) gameState.pickups = [];
}

export function spawnHealthPickup(gameState, x, y, { heal = 25 } = {}) {
  ensurePickups(gameState);
  const sprite = new Image();
  sprite.src = versioned('src/img/sprite-heart.png');
  gameState.pickups.push({
    type: 'health',
    x, y,
    size: 10,
    heal,
    color: '#2ecc71',
    sprite,
    frame: 0,
    frameTimer: 0,
    frameInterval: 8,
    frameWidth: FRAME_W,
    frameHeight: FRAME_H,
    row: 0
  });
}

export function updatePickups(gameState) {
  ensurePickups(gameState);
  const p = gameState.player;
  if (!p) return;
  // Animate
  for (let i = 0; i < gameState.pickups.length; i++) {
    const it = gameState.pickups[i];
    if (it.type === 'health') {
      it.frameTimer++;
      if (it.frameTimer >= it.frameInterval) {
        it.frameTimer = 0;
        it.frame = (it.frame + 1) % SHEET_COLS;
      }
    }
  }
  for (let i = gameState.pickups.length - 1; i >= 0; i--) {
    const it = gameState.pickups[i];
    const dx = it.x - p.x;
    const dy = it.y - p.y;
    const dist2 = dx * dx + dy * dy;
    const r = (it.size || 0) + (p.size || 0);
    if (dist2 <= r * r) {
      if (it.type === 'health') {
        const before = p.hp;
        p.hp = Math.min(p.maxHp || 100, (p.hp || 0) + (it.heal || 0));
        if (p.hp > before) playSound('heal');
      }
      gameState.pickups.splice(i, 1);
    }
  }
}

export function drawPickups(gameState, ctx) {
  if (!gameState.pickups) return;
  for (const it of gameState.pickups) {
    if (it.type === 'health') {
      const hasSprite = it.sprite && it.sprite.complete && (it.sprite.naturalWidth || 0) > 0;
      const s = it.size || 10;
      // Preserve sprite aspect ratio 170x205
      const destH = s * 2;
      const destW = destH * (FRAME_W / FRAME_H);
      if (hasSprite) {
        const sx = (it.frame % SHEET_COLS) * (it.frameWidth || FRAME_W);
        const sy = (it.row % SHEET_ROWS) * (it.frameHeight || FRAME_H);
        ctx.drawImage(
          it.sprite,
          sx, sy, (it.frameWidth || FRAME_W), (it.frameHeight || FRAME_H),
          it.x - destW / 2,
          it.y - destH / 2,
          destW, destH
        );
      } else {
        // Fallback: draw a green plus
        ctx.save();
        ctx.translate(it.x, it.y);
        ctx.fillStyle = it.color || '#2ecc71';
        ctx.fillRect(-s / 3, -s, s * 2 / 3, s * 2);
        ctx.fillRect(-s, -s / 3, s * 2, s * 2 / 3);
        ctx.restore();
      }
    }
  }
}
