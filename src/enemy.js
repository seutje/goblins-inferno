export default class Enemy {
    constructor(canvas, gameState) {
        this.canvas = canvas;
        this.gameState = gameState;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.speed = 1;
        this.frameWidth = 32;
        this.frameHeight = 32;
        this.size = this.frameWidth / 2;
        this.sprite = new Image();
        this.sprite.src = 'img/sprite-skeleton.png';
        this.animations = {
            idle: { row: 0, frames: 2 },
            walk: { row: 1, frames: 4 },
            attack: { row: 2, frames: 2 },
            death: { row: 3, frames: 2 }
        };
        this.state = 'walk';
        this.frame = 0;
        this.frameTimer = 0;
        this.frameInterval = 15;
    }

    update() {
        const player = this.gameState.player;
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
                this.state = 'walk';
            } else {
                this.state = 'idle';
            }
        }

        this.frameTimer++;
        if (this.frameTimer >= this.frameInterval) {
            this.frameTimer = 0;
            const animation = this.animations[this.state];
            this.frame = (this.frame + 1) % animation.frames;
        }
    }

    draw(ctx) {
        const animation = this.animations[this.state];
        if (this.sprite.complete) {
            ctx.drawImage(
                this.sprite,
                this.frame * this.frameWidth,
                animation.row * this.frameHeight,
                this.frameWidth,
                this.frameHeight,
                this.x - this.frameWidth / 2,
                this.y - this.frameHeight / 2,
                this.frameWidth,
                this.frameHeight
            );
        } else {
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
