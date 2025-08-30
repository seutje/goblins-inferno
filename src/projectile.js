export class Projectile {
    constructor(x, y, { damage = 1, speed = 5, size = 5, color = 'red', dx = 0, dy = -1 } = {}) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.speed = speed;
        this.size = size;
        this.color = color;
        this.dx = dx;
        this.dy = dy;
    }

    update() {
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

export function fireInfernoBlast(gameState, x, y) {
    const s = gameState.player?.stats || { damageMultiplier: 1, projSizeMultiplier: 1 };
    gameState.projectiles.push(new Projectile(
        x, y - 10,
        { damage: 1 * s.damageMultiplier, speed: 6, size: 5 * s.projSizeMultiplier, color: 'red' }
    ));
}

export function fireFlameStream(gameState, x, y) {
    const s = gameState.player?.stats || { damageMultiplier: 1, projSizeMultiplier: 1 };
    gameState.projectiles.push(new Projectile(
        x, y - 10,
        { damage: 0.5 * s.damageMultiplier, speed: 8, size: 3 * s.projSizeMultiplier, color: 'orange' }
    ));
}

export function fireVolatileOrb(gameState, x, y) {
    const s = gameState.player?.stats || { damageMultiplier: 1, projSizeMultiplier: 1 };
    gameState.projectiles.push(new Projectile(
        x, y - 10,
        { damage: 3 * s.damageMultiplier, speed: 2, size: 10 * s.projSizeMultiplier, color: 'purple' }
    ));
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
