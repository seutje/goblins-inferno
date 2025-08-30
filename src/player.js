import { fireInfernoBlast, fireFlameStream, fireVolatileOrb } from './projectile.js';

export default class Player {
    constructor(canvas, gameState) {
        this.canvas = canvas;
        this.gameState = gameState;
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.speed = 3;
        this.size = 20;
        this.fireCooldown = 0;
        this.weapon = 'inferno';
    }

    update() {
        const keys = this.gameState.keys;
        if (keys['KeyW']) this.y -= this.speed;
        if (keys['KeyS']) this.y += this.speed;
        if (keys['KeyA']) this.x -= this.speed;
        if (keys['KeyD']) this.x += this.speed;

        this.x = Math.max(this.size, Math.min(this.canvas.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(this.canvas.height - this.size, this.y));

        if (this.fireCooldown <= 0) {
            if (this.weapon === 'inferno') {
                fireInfernoBlast(this.gameState, this.x, this.y - this.size);
                this.fireCooldown = 15;
            } else if (this.weapon === 'flame') {
                fireFlameStream(this.gameState, this.x, this.y - this.size);
                this.fireCooldown = 3;
            } else if (this.weapon === 'orb') {
                fireVolatileOrb(this.gameState, this.x, this.y - this.size);
                this.fireCooldown = 45;
            }
        } else {
            this.fireCooldown--;
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'lime';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}
