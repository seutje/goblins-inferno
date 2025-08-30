import Player from './player.js';
import { updateProjectiles, drawProjectiles } from './projectile.js';
import { updateSpawner } from './spawner.js';
import { initLevelSystem, updateLevelSystem, drawGems } from './level.js';
import { createDebtState, updateDebt, initDebtUI } from './debt.js';
import { applyCharacterToPlayer } from './characters.js';
import { updateHazards, drawHazards } from './hazard.js';

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
    onChooseUpgrade: null,
    // Debt & character
    debt: null,
    _refreshDebtHUD: null,
    character: null,
    trait: null,
    _buffs: [],
    hazards: []
};

function updatePlayer() {
    if (gameState.player) gameState.player.update();
}

function drawPlayer() {
    if (gameState.player) gameState.player.draw(ctx);
}

function updateEnemies() {
    if (!gameState.player) return;
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
                    let dmg = (p.damage || 0);
                    // Gnorp trait: extra damage when enemy is close to player
                    if (gameState.character === 'Gnorp' && gameState.player) {
                        const pdx = gameState.player.x - e.x;
                        const pdy = gameState.player.y - e.y;
                        const pd = Math.hypot(pdx, pdy);
                        if (pd < 80) dmg *= 1.25;
                    }
                    e.hp -= dmg;
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
        // expire temporary buffs
        if (gameState._buffs && gameState._buffs.length) {
            for (let i = gameState._buffs.length - 1; i >= 0; i--) {
                const b = gameState._buffs[i];
                b.remaining--;
                if (b.remaining <= 0) {
                    if (typeof b.undo === 'function') b.undo();
                    gameState._buffs.splice(i, 1);
                }
            }
        }
        updatePlayer();
        updateEnemies();
        updateProjectiles(gameState, canvas);
        updateHazards(gameState);
        checkCollisions();
        if (gameState.player) updateLevelSystem(gameState, canvas);
        if (gameState.debt) updateDebt(gameState.debt);
    }

    drawPlayer();
    drawEnemies();
    drawProjectiles(gameState, ctx);
    drawHazards(gameState, ctx);
    drawGems(gameState, ctx);
    requestAnimationFrame(gameLoop);
}

function init() {
    // Initialize debt & HUD
    gameState.debt = createDebtState({ initialDebt: 10000, autoRepayPerFrame: 0.1 });
    initDebtUI(gameState);
    // Character selection
    const charModal = document.getElementById('charModal');
    const btnGnorp = document.getElementById('pickGnorp');
    const btnIgnis = document.getElementById('pickIgnis');
    const btnFizzle = document.getElementById('pickFizzle');

    function startAs(characterKey) {
        gameState.player = new Player(canvas, gameState);
        initLevelSystem(gameState, canvas);
        applyCharacterToPlayer(gameState.player, gameState, characterKey);
        if (charModal) charModal.style.display = 'none';
        if (typeof gameState._refreshDebtHUD === 'function') gameState._refreshDebtHUD();
    }

    if (btnGnorp) btnGnorp.addEventListener('click', () => startAs('Gnorp'));
    if (btnIgnis) btnIgnis.addEventListener('click', () => startAs('Ignis'));
    if (btnFizzle) btnFizzle.addEventListener('click', () => startAs('Fizzle'));
    window.addEventListener('keydown', e => {
        gameState.keys[e.code] = true;
        if (!gameState.player) return;
        if (e.code === 'Digit1') gameState.player.weapon = 'inferno';
        if (e.code === 'Digit2') gameState.player.weapon = 'flame';
        if (e.code === 'Digit3') gameState.player.weapon = 'orb';
    });
    window.addEventListener('keyup', e => gameState.keys[e.code] = false);
    gameLoop();
}

init();
