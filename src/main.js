import Player from './player.js';
import { updateProjectiles, drawProjectiles } from './projectile.js';
import { updateSpawner } from './spawner.js';
import { initLevelSystem, updateLevelSystem, drawGems } from './level.js';
import { createDebtState, updateDebt, initDebtUI } from './debt.js';
import { applyCharacterToPlayer } from './characters.js';
import { updateHazards, drawHazards } from './hazard.js';
import { updateBoss, drawBossHUD } from './boss.js';
import { initAudio, playSound, setMuted } from './audio.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gameState = window.gameState = {
    keys: {},
    mouse: null,
    player: null,
    enemies: [],
    projectiles: [],
    spawnTimer: 0,
    spawnInterval: 120,
    difficulty: 0,
    balance: {
        spawnIntervalBase: 120,
        spawnIntervalMin: 30,
        gemTimerBase: 180,
        gemTimerMin: 90,
        bossThresholds: [30, 80, 140]
    },
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

            if (dx * dx + dy * dy <= r * r && p.faction === 'player') {
                // Hit registered
                let dmg = (p.damage || 0);
                // Gnorp trait: extra damage when enemy is close to player
                if (gameState.character === 'Gnorp' && gameState.player) {
                    const pdx = gameState.player.x - e.x;
                    const pdy = gameState.player.y - e.y;
                    const pd = Math.hypot(pdx, pdy);
                    if (pd < 80) dmg *= 1.25;
                }
                // Optional specialized boss/enemy hit handling
                if (typeof e.takeHit === 'function') {
                    // Temporarily override projectile damage if needed
                    const originalDamage = p.damage;
                    p.damage = dmg;
                    e.takeHit(p, gameState);
                    p.damage = originalDamage;
                } else if (typeof e.hp === 'number') {
                    e.hp -= dmg;
                }
                // Remove projectile on hit
                gameState.projectiles.splice(pi, 1);
                // Remove enemy if dead (non-boss auto removal; boss cleanup is in updateBoss)
                if (!e.isBoss && e.hp !== undefined && e.hp <= 0) {
                    playSound('enemy_die');
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
        // FPS calc (smoothed)
        const now = performance.now();
        if (!gameState._lastTs) gameState._lastTs = now;
        const dt = now - gameState._lastTs;
        gameState._lastTs = now;
        const fps = 1000 / Math.max(1, dt);
        gameState._fps = Math.round((gameState._fps || fps) * 0.9 + fps * 0.1);
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
        updateBoss(gameState, canvas);
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
    drawBossHUD(gameState, ctx, canvas);
    // HUD dynamic info
    const fpsEl = document.getElementById('hud-fps');
    if (fpsEl && gameState._fps) fpsEl.textContent = String(gameState._fps);
    if (typeof gameState._refreshDebtHUD === 'function' && !gameState.paused) gameState._refreshDebtHUD();
    requestAnimationFrame(gameLoop);
}

function init() {
    initAudio();
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
    // Mouse tracking for aim
    function updateMouse(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;
        gameState.mouse = { x: mx, y: my };
    }
    window.addEventListener('mousemove', updateMouse);
    window.addEventListener('mousedown', updateMouse);
    const btnMute = document.getElementById('btnMute');
    let muted = false;
    if (btnMute) btnMute.addEventListener('click', () => {
        muted = !muted;
        setMuted(muted);
        btnMute.textContent = muted ? 'Unmute' : 'Mute';
    });
    window.addEventListener('keydown', e => {
        gameState.keys[e.code] = true;
        if (!gameState.player) return;
        if (e.code === 'Digit1') gameState.player.weapon = 'inferno';
        if (e.code === 'Digit2') gameState.player.weapon = 'flame';
        if (e.code === 'Digit3') gameState.player.weapon = 'orb';
        if (e.code === 'KeyP') gameState.paused = !gameState.paused;
    });
    window.addEventListener('keyup', e => gameState.keys[e.code] = false);
    gameLoop();
}

init();
