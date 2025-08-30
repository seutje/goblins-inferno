const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gameState = window.gameState = {
    keys: {},
    player: null,
    projectiles: []
};

class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.speed = 3;
        this.size = 20;
        this.fireCooldown = 0;
    }

    update() {
        if (gameState.keys['KeyW']) this.y -= this.speed;
        if (gameState.keys['KeyS']) this.y += this.speed;
        if (gameState.keys['KeyA']) this.x -= this.speed;
        if (gameState.keys['KeyD']) this.x += this.speed;

        // Keep player within canvas bounds
        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y));

        if (this.fireCooldown <= 0) {
            fireProjectile(this.x, this.y - this.size);
            this.fireCooldown = 15;
        } else {
            this.fireCooldown--;
        }
    }

    draw() {
        ctx.fillStyle = 'lime';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 5;
        this.size = 5;
    }

    update() {
        this.y -= this.speed;
    }

    draw() {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function fireProjectile(x, y) {
    gameState.projectiles.push(new Projectile(x, y));
}

function updateProjectiles() {
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const p = gameState.projectiles[i];
        p.update();
        if (p.y < -p.size) {
            gameState.projectiles.splice(i, 1);
        }
    }
}

function drawProjectiles() {
    gameState.projectiles.forEach(p => p.draw());
}

function updatePlayer() {
    gameState.player.update();
}

function drawPlayer() {
    gameState.player.draw();
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function gameLoop() {
    clearCanvas();
    updatePlayer();
    updateProjectiles();
    drawPlayer();
    drawProjectiles();
    requestAnimationFrame(gameLoop);
}

function init() {
    gameState.player = new Player();
    window.addEventListener('keydown', e => gameState.keys[e.code] = true);
    window.addEventListener('keyup', e => gameState.keys[e.code] = false);
    gameLoop();
}

init();
