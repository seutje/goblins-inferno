import Player from './player.js';
import { updateProjectiles, drawProjectiles } from './projectile.js';
import { updateSpawner } from './spawner.js';
import { initLevelSystem, updateLevelSystem, drawGems } from './level.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gameState = window.gameState = {
    keys: {},
    player: null,
    enemies: [],
    projectiles: [],
    spawnTimer: 0,
    spawnInterval: 120,
    difficulty: 0,
    // Level & upgrade system
    xp: 0,
    level: 1,
    nextLevelXp: 5,
    gems: [],
    totalGems: 0,
    paused: false,
    upgradePool: [],
    upgradeChoices: [],
    onChooseUpgrade: null
};

function updatePlayer() {
    gameState.player.update();
}

function drawPlayer() {
    gameState.player.draw(ctx);
}

function updateEnemies() {
    updateSpawner(gameState, canvas);
    gameState.enemies.forEach(enemy => enemy.update());
}

function drawEnemies() {
    gameState.enemies.forEach(enemy => enemy.draw(ctx));
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function checkCollisions() {
    // Circle (projectile) vs axis-aligned rectangle (enemy sprite bounds)
    for (let pi = gameState.projectiles.length - 1; pi >= 0; pi--) {
        const p = gameState.projectiles[pi];
        for (let ei = gameState.enemies.length - 1; ei >= 0; ei--) {
            const e = gameState.enemies[ei];
            const halfW = (e.frameWidth || 0) / 2;
            const halfH = (e.frameHeight || 0) / 2;
            const left = e.x - halfW;
            const right = e.x + halfW;
            const top = e.y - halfH;
            const bottom = e.y + halfH;

            const nearestX = Math.max(left, Math.min(p.x, right));
            const nearestY = Math.max(top, Math.min(p.y, bottom));
            const dx = p.x - nearestX;
            const dy = p.y - nearestY;
            const r = (p.size || 0);

            if (dx * dx + dy * dy <= r * r) {
                // Hit registered
                if (typeof e.hp === 'number') {
                    e.hp -= (p.damage || 0);
                }
                // Remove projectile on hit
                gameState.projectiles.splice(pi, 1);
                // Remove enemy if dead
                if (e.hp !== undefined && e.hp <= 0) {
                    gameState.enemies.splice(ei, 1);
                }
                break; // Proceed to next projectile
            }
        }
    }
}

function gameLoop() {
    clearCanvas();

    if (!gameState.paused) {
        updatePlayer();
        updateEnemies();
        updateProjectiles(gameState, canvas);
        checkCollisions();
        updateLevelSystem(gameState, canvas);
    }

    drawPlayer();
    drawEnemies();
    drawProjectiles(gameState, ctx);
    drawGems(gameState, ctx);
    requestAnimationFrame(gameLoop);
}

function init() {
    gameState.player = new Player(canvas, gameState);
    initLevelSystem(gameState, canvas);
    window.addEventListener('keydown', e => {
        gameState.keys[e.code] = true;
        if (e.code === 'Digit1') gameState.player.weapon = 'inferno';
        if (e.code === 'Digit2') gameState.player.weapon = 'flame';
        if (e.code === 'Digit3') gameState.player.weapon = 'orb';
    });
    window.addEventListener('keyup', e => gameState.keys[e.code] = false);
    gameLoop();
}

init();
