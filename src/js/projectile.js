import { getImage } from './preload.js';
const SHEET_COLS = 6;
const SHEET_ROWS = 5;
const FRAME_W = 170;
const FRAME_H = 205;

export class Projectile {
    constructor(x, y, { damage = 1, speed = 5, size = 5, color = 'red', dx = 0, dy = -1, sprite = null, frameWidth = FRAME_W, frameHeight = FRAME_H, faction = 'player', row = 0, sheetCols = 1, sheetRows = 1, frameInterval = 6, bouncesLeft = 0, pierceLeft = 0, isShockwave = false } = {}) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.speed = speed;
        this.size = size;
        this.color = color;
        this.dx = dx;
        this.dy = dy;
        this.faction = faction; // 'player' or 'enemy'
        this.sprite = null;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.sheetCols = sheetCols;
        this.sheetRows = sheetRows;
        this.row = row;
        this.frame = 0;
        this.frameTimer = 0;
        this.frameInterval = frameInterval;
        this.bouncesLeft = bouncesLeft;
        this.pierceLeft = pierceLeft;
        this.isShockwave = isShockwave;
        this.shockwaveTimer = 0;
        // Track which enemies have been hit to avoid re-hitting the same one when piercing
        this.hitSet = new WeakSet();
        if (sprite) {
            this.sprite = (typeof sprite === 'string') ? getImage(sprite) : sprite;
        }
    }

    update() {
        if (this.isShockwave) {
            this.shockwaveTimer++;
            this.size = this.shockwaveTimer * this.speed;
            return;
        }
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;
        if (this.sprite && this.sheetCols > 1) {
            this.frameTimer++;
            if (this.frameTimer >= this.frameInterval) {
                this.frameTimer = 0;
                this.frame = (this.frame + 1) % this.sheetCols;
            }
        }
    }

    draw(ctx) {
        if (this.isShockwave) {
            const lifetime = 60; // Shockwave lasts 1 second
            const fade = 1 - (this.shockwaveTimer / lifetime);
            ctx.fillStyle = `rgba(255, 165, 0, ${fade * 0.8})`;
            ctx.strokeStyle = `rgba(255, 100, 0, ${fade})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            return;
        }

        if (this.sprite && this.sprite.complete && (this.sprite.naturalWidth || 0) > 0) {
            const sx = (this.frame % this.sheetCols) * this.frameWidth;
            const sy = (this.row % this.sheetRows) * this.frameHeight;
            const destH = this.size * 2;
            const destW = destH * (FRAME_W / FRAME_H);
            ctx.drawImage(
                this.sprite,
                sx, sy, this.frameWidth, this.frameHeight,
                this.x - destW / 2,
                this.y - destH / 2,
                destW,
                destH
            );
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// no longer need versioned here; sprites are fetched via getImage

export function fireInfernoBlast(gameState, x, y, dir) {
    const s = gameState.player?.stats || { damageMultiplier: 1, projSizeMultiplier: 1 };
    const v = normDir(dir);
    gameState.projectiles.push(new Projectile(
        x, y,
        { damage: 2 * s.damageMultiplier, speed: 6, size: 5 * s.projSizeMultiplier, color: 'red', sprite: 'src/img/sprite-projectile.png', frameWidth: FRAME_W, frameHeight: FRAME_H, dx: v.dx, dy: v.dy, sheetCols: SHEET_COLS, sheetRows: SHEET_ROWS, row: 0, frameInterval: 6, bouncesLeft: (gameState._injectBounces||0), pierceLeft: (gameState._injectPierce||0) }
    ));
}

export function fireFlameStream(gameState, x, y, dir) {
    const s = gameState.player?.stats || { damageMultiplier: 1, projSizeMultiplier: 1 };
    const v = normDir(dir);
    gameState.projectiles.push(new Projectile(
        x, y,
        { damage: 1.0 * s.damageMultiplier, speed: 8, size: 3 * s.projSizeMultiplier, color: 'orange', sprite: 'src/img/sprite-projectile.png', frameWidth: FRAME_W, frameHeight: FRAME_H, dx: v.dx, dy: v.dy, sheetCols: SHEET_COLS, sheetRows: SHEET_ROWS, row: 1, frameInterval: 3, bouncesLeft: (gameState._injectBounces||0), pierceLeft: (gameState._injectPierce||0) }
    ));
}

export function fireVolatileOrb(gameState, x, y, dir) {
    const s = gameState.player?.stats || { damageMultiplier: 1, projSizeMultiplier: 1 };
    const v = normDir(dir);
    gameState.projectiles.push(new Projectile(
        x, y,
        { damage: 6 * s.damageMultiplier, speed: 2, size: 10 * s.projSizeMultiplier, color: 'purple', sprite: 'src/img/sprite-projectile.png', frameWidth: FRAME_W, frameHeight: FRAME_H, dx: v.dx, dy: v.dy, sheetCols: SHEET_COLS, sheetRows: SHEET_ROWS, row: 2, frameInterval: 8, bouncesLeft: (gameState._injectBounces||0), pierceLeft: (gameState._injectPierce||0) }
    ));
}

function normDir(dir) {
    // Ensure a valid normalized direction; default to upward
    let dx = 0, dy = -1;
    if (dir && typeof dir.dx === 'number' && typeof dir.dy === 'number') {
        dx = dir.dx; dy = dir.dy;
    }
    const mag = Math.hypot(dx, dy) || 1;
    return { dx: dx / mag, dy: dy / mag };
}

export function updateProjectiles(gameState, canvas) {
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const p = gameState.projectiles[i];
        p.update();

        if (p.isShockwave) {
            if (p.shockwaveTimer > 60) { // Lifetime of 1 second
                gameState.projectiles.splice(i, 1);
            }
            continue;
        }

        // Wall bounces against world bounds
        const W = (gameState.world?.width) || canvas.width;
        const H = (gameState.world?.height) || canvas.height;
        let bounced = false;
        if (p.x < p.size) { p.x = p.size; p.dx = Math.abs(p.dx); bounced = true; }
        else if (p.x > W - p.size) { p.x = W - p.size; p.dx = -Math.abs(p.dx); bounced = true; }
        if (p.y < p.size) { p.y = p.size; p.dy = Math.abs(p.dy); bounced = true; }
        else if (p.y > H - p.size) { p.y = H - p.size; p.dy = -Math.abs(p.dy); bounced = true; }
        if (bounced) {
            if (p.bouncesLeft > 0) p.bouncesLeft--; else gameState.projectiles.splice(i, 1);
            continue;
        }
        // Remove if far out (safety)
        if (p.y < -p.size*2 || p.y > H + p.size*2 || p.x < -p.size*2 || p.x > W + p.size*2) {
            gameState.projectiles.splice(i, 1);
        }
    }
}

export function drawProjectiles(gameState, ctx) {
    gameState.projectiles.forEach(p => p.draw(ctx));
}
