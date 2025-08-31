export class Projectile {
    constructor(x, y, { damage = 1, speed = 5, size = 5, color = 'red', dx = 0, dy = -1, sprite = null, frameWidth = 16, frameHeight = 16, faction = 'player' } = {}) {
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
        if (sprite) {
            this.sprite = new Image();
            this.sprite.src = sprite;
        }
    }

    update() {
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;
    }

    draw(ctx) {
        if (this.sprite && this.sprite.complete && (this.sprite.naturalWidth || 0) > 0) {
            ctx.drawImage(
                this.sprite,
                0, 0, this.frameWidth, this.frameHeight,
                this.x - this.frameWidth / 2,
                this.y - this.frameHeight / 2,
                this.frameWidth,
                this.frameHeight
            );
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

import { playSound } from './audio.js';

export function fireInfernoBlast(gameState, x, y) {
    const s = gameState.player?.stats || { damageMultiplier: 1, projSizeMultiplier: 1 };
    gameState.projectiles.push(new Projectile(
        x, y - 10,
        { damage: 1 * s.damageMultiplier, speed: 6, size: 5 * s.projSizeMultiplier, color: 'red', sprite: 'img/sprite-blast.png', frameWidth: 16, frameHeight: 16 }
    ));
    playSound('fire');
}

export function fireFlameStream(gameState, x, y) {
    const s = gameState.player?.stats || { damageMultiplier: 1, projSizeMultiplier: 1 };
    gameState.projectiles.push(new Projectile(
        x, y - 10,
        { damage: 0.5 * s.damageMultiplier, speed: 8, size: 3 * s.projSizeMultiplier, color: 'orange', sprite: 'img/sprite-flame.png', frameWidth: 12, frameHeight: 12 }
    ));
    playSound('fire');
}

export function fireVolatileOrb(gameState, x, y) {
    const s = gameState.player?.stats || { damageMultiplier: 1, projSizeMultiplier: 1 };
    gameState.projectiles.push(new Projectile(
        x, y - 10,
        { damage: 3 * s.damageMultiplier, speed: 2, size: 10 * s.projSizeMultiplier, color: 'purple', sprite: 'img/sprite-orb.png', frameWidth: 20, frameHeight: 20 }
    ));
    playSound('fire');
}

export function updateProjectiles(gameState, canvas) {
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const p = gameState.projectiles[i];
        p.update();
        if (p.y < -p.size || p.y > canvas.height + p.size || p.x < -p.size || p.x > canvas.width + p.size) {
            gameState.projectiles.splice(i, 1);
        }
    }
}

export function drawProjectiles(gameState, ctx) {
    gameState.projectiles.forEach(p => p.draw(ctx));
}
