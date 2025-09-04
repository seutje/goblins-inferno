import Player from './player.js';
import { updateProjectiles, drawProjectiles } from './projectile.js';
import { updateSpawner } from './spawner.js';
import { initLevelSystem, updateLevelSystem, drawGems, spawnCoin } from './level.js';
import { createDebtState, updateDebt, initDebtUI } from './debt.js';
import { applyCharacterToPlayer } from './characters.js';
import { updateHazards, drawHazards } from './hazard.js';
import { initDecor, drawDecor } from './decor.js';
import { updateBoss, drawBossHUD } from './boss.js';
import { initAudio, playSound, setMuted } from './audio.js';
import { preloadAll } from './preload.js';
import { repay } from './debt.js';
import { initMeta, applyMetaAtRunStart } from './meta.js';
import { updatePickups, drawPickups, spawnHealthPickup } from './pickups.js';
import { getImage } from './preload.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    // Fill viewport independently of world size
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        // Re-clamp camera to fixed world bounds on viewport changes
        updateCamera();
    }
    // Update base scale for device and apply current zoom
    gameState.baseScale = computeRenderScale();
    // Ensure we don't zoom out beyond world bounds given the viewport size
    const W = gameState.world.width;
    const H = gameState.world.height;
    const neededS = Math.max(canvas.width / W, canvas.height / H);
    const minZoomNeeded = neededS / (gameState.baseScale || 1);
    const zMin = gameState.zoomMin || 0.6;
    const zMax = gameState.zoomMax || 2.0;
    if ((gameState.baseScale || 1) * (gameState.zoom || 1) < neededS) {
        gameState.zoom = Math.min(zMax, Math.max(zMin, minZoomNeeded));
    }
    gameState.renderScale = (gameState.baseScale || 1) * (gameState.zoom || 1);
}

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
        bossThresholds: [30, 80, 140],
        bossCooldownFrames: 60 * 30 // 30s cooldown after a boss dies
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
    hazards: [],
    // World and camera (fixed-size world, independent of viewport)
    world: { width: 3200, height: 2000 },
    camera: { x: canvas.width / 2, y: canvas.height / 2 },
    // Zoom controls
    zoom: 1,
    baseScale: 1,
    renderScale: 1,
    zoomMin: 0.6,
    zoomMax: 2.0
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

function updateCamera() {
    const p = gameState.player;
    if (!p) return;
    // Keep player centered, but clamp to world bounds so we don't show outside
    const s = gameState.renderScale || 1;
    const halfW = canvas.width / (2 * s);
    const halfH = canvas.height / (2 * s);
    const W = gameState.world.width;
    const H = gameState.world.height;
    const x = Math.max(halfW, Math.min(W - halfW, p.x));
    const y = Math.max(halfH, Math.min(H - halfH, p.y));
    gameState.camera.x = x;
    gameState.camera.y = y;
}

// Ground tile pattern (25% scale)
function ensureGroundPattern(gameState) {
    if (gameState._groundPattern) return;
    const img = getImage('src/img/tile-ground.png');
    if (!img || !img.complete || !(img.naturalWidth > 0)) return; // try next frame
    const tw = Math.max(1, Math.floor(img.naturalWidth * 0.25));
    const th = Math.max(1, Math.floor(img.naturalHeight * 0.25));
    const off = document.createElement('canvas');
    off.width = tw; off.height = th;
    const octx = off.getContext('2d');
    octx.imageSmoothingEnabled = true;
    octx.drawImage(img, 0, 0, tw, th);
    const pattern = ctx.createPattern(off, 'repeat');
    gameState._groundPattern = pattern;
}

// Collision helpers: ellipses aligned to axes
function entityEllipseRadii(e) {
    const base = (e.size != null) ? e.size : Math.max((e.frameWidth || 0), (e.frameHeight || 0)) / 2;
    // Characters are a bit taller than wide; bias ry > rx
    const rx = base * 0.60;
    const ry = base * 0.90;
    return { rx, ry };
}

function circleVsEllipse(cx, cy, r, ex, ey, rx, ry) {
    const dx = cx - ex;
    const dy = cy - ey;
    const erx = rx + r;
    const ery = ry + r;
    if (erx <= 0 || ery <= 0) return false;
    return (dx * dx) / (erx * erx) + (dy * dy) / (ery * ery) <= 1;
}

function ellipseVsEllipse(x1, y1, rx1, ry1, x2, y2, rx2, ry2) {
    // Approximate using axis-wise Minkowski sum (good for AABB-aligned ellipses)
    const dx = x1 - x2;
    const dy = y1 - y2;
    const rx = rx1 + rx2;
    const ry = ry1 + ry2;
    if (rx <= 0 || ry <= 0) return false;
    return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
}

function damagePlayer(amount) {
    if (!gameState.player) return;
    const p = gameState.player;
    if (p.invuln && p.invuln > 0) return;
    let dmg = amount || 0;
    // Absorb with shield first, if any
    if ((p.shield || 0) > 0 && dmg > 0) {
        const absorbed = Math.min(p.shield, dmg);
        p.shield -= absorbed;
        dmg -= absorbed;
        // Delay shield regen when it takes a hit
        p.shieldRegenCooldown = Math.max(p.shieldRegenCooldown || 0, 120);
    }
    if (dmg <= 0) return;
    p.hp = Math.max(0, p.hp - dmg);
    p.invuln = 60;
    p._flash = 10;
    // Show hurt animation when taking damage but not dying
    if (p.hp > 0) {
        if (gameState.character === 'Fizzle' || true) {
            p.state = 'hurt';
            p._stateLock = 18; // brief lock to display hurt frames
            p.frame = 0;
        }
    } else {
        // Dying: switch to death row and freeze on last frame visually
        p.state = 'death';
        p._dead = true;
        // Jump directly to the final frame so it stays frozen even if paused
        try {
            const cols = (typeof p._sheetCols === 'function') ? p._sheetCols() : (p.animations?.death?.frames || 1);
            const maxFrames = Math.max(1, Math.min((p.animations?.death?.frames || cols), cols));
            p.frame = Math.max(0, maxFrames - 1);
        } catch { p.frame = 0; }
        onPlayerDeath();
    }
}

function onPlayerDeath() {
    gameState.paused = true;
    gameState.gameOver = true;
    // End-of-run repayment: apply all gold to debt
    try { repay(gameState.debt, gameState.debt.gold || 0); } catch {}
    const modal = document.getElementById('gameOverModal');
    const statsEl = document.getElementById('gameOverStats');
    if (statsEl) {
        statsEl.textContent = `Level ${gameState.level} | Gems ${gameState.totalGems}`;
    }
    if (modal) modal.style.display = 'flex';
}

function restartRun() {
    // Clear dynamic state but preserve meta and debt
    gameState.paused = false;
    gameState.gameOver = false;
    gameState.player = null;
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.hazards = [];
    gameState.gems = [];
    gameState.pickups = [];
    gameState._buffs = [];
    gameState._injectBounces = undefined;
    gameState.spawnTimer = 0;
    gameState.difficulty = 0;
    gameState.xp = 0;
    gameState.level = 1;
    gameState.nextLevelXp = 5;
    gameState.totalGems = 0;
    gameState.character = null;
    gameState.trait = null;
    gameState.upgradeChoices = [];
    // Reset boss state
    gameState.boss = null;
    gameState._bossInit = false;
    gameState._bossIndex = 0;
    // Clear input
    gameState.keys = {};
    gameState.mouse = null;
    // Hide game over modal, show character selection
    const over = document.getElementById('gameOverModal');
    if (over) over.style.display = 'none';
    const charModal = document.getElementById('charModal');
    if (charModal) charModal.style.display = 'flex';
    if (typeof gameState._refreshDebtHUD === 'function') gameState._refreshDebtHUD();
}

function checkCollisions() {
    // Circle (projectile) vs enemy ellipse
    for (let pi = gameState.projectiles.length - 1; pi >= 0; pi--) {
        const p = gameState.projectiles[pi];
        for (let ei = gameState.enemies.length - 1; ei >= 0; ei--) {
            const e = gameState.enemies[ei];
            const { rx, ry } = entityEllipseRadii(e);
            const r = (p.size || 0);
            if (p.faction === 'player' && circleVsEllipse(p.x, p.y, r, e.x, e.y, rx, ry)) {
                // If this projectile already pierced this enemy, skip re-hitting
                if (p.hitSet && p.hitSet.has(e)) continue;
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
                // Mark this enemy as hit by this projectile to prevent repeat hits
                if (p.hitSet) p.hitSet.add(e);
                // Remove projectile on hit unless it has penetration left
                if (p.pierceLeft && p.pierceLeft > 0) {
                    p.pierceLeft--;
                } else {
                    gameState.projectiles.splice(pi, 1);
                }
                // Remove enemy if dead (non-boss auto removal; boss cleanup is in updateBoss)
                if (!e.isBoss && e.hp !== undefined && e.hp <= 0) {
                    playSound('enemy_die');
                    if (Math.random() < 0.10) {
                        spawnHealthPickup(gameState, e.x, e.y, { heal: 25 });
                    }
                    // Drop a coin at the enemy's death location
                    spawnCoin(gameState, e.x, e.y, { value: 1 });
                    gameState.enemies.splice(ei, 1);
                }
                break; // Proceed to next projectile
            }
        }
    }
}

function checkPlayerDamage() {
    const p = gameState.player;
    if (!p) return;
    // Radii for player ellipse
    const pr = entityEllipseRadii(p);
    // Enemy projectile vs player ellipse
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const proj = gameState.projectiles[i];
        if (proj.faction !== 'enemy') continue;
        if (circleVsEllipse(proj.x, proj.y, (proj.size || 0), p.x, p.y, pr.rx, pr.ry)) {
            damagePlayer(proj.damage || 1);
            gameState.projectiles.splice(i, 1);
        }
    }
    // Enemy ellipse vs player ellipse (contact)
    for (let i = 0; i < gameState.enemies.length; i++) {
        const e = gameState.enemies[i];
        if (e.isBoss) continue; // optional: bosses damage via their projectiles/attacks
        const er = entityEllipseRadii(e);
        if (ellipseVsEllipse(p.x, p.y, pr.rx, pr.ry, e.x, e.y, er.rx, er.ry)) {
            damagePlayer(e.contactDamage || 5);
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
        if (gameState._fizzleProcTimer && gameState._fizzleProcTimer > 0) {
            gameState._fizzleProcTimer--;
        }
        updatePlayer();
        updateBoss(gameState, canvas);
        updateEnemies();
        updateProjectiles(gameState, canvas);
        updateHazards(gameState);
        updatePickups(gameState);
        checkCollisions();
        checkPlayerDamage();
        if (gameState.player) updateLevelSystem(gameState, canvas);
        // Only update debt during an active run (when a player exists)
        if (gameState.debt && gameState.player) updateDebt(gameState.debt);
        updateCamera();
    }

    // Apply camera transform and scale for world-space rendering
    ctx.save();
    const s = gameState.renderScale || 1;
    ctx.scale(s, s);
    const camX = Math.round(gameState.camera.x - canvas.width / (2 * s));
    const camY = Math.round(gameState.camera.y - canvas.height / (2 * s));
    ctx.translate(-camX, -camY);
    // Draw ground pattern across world
    ensureGroundPattern(gameState);
    if (gameState._groundPattern) {
        ctx.save();
        ctx.fillStyle = gameState._groundPattern;
        ctx.fillRect(0, 0, gameState.world.width, gameState.world.height);
        ctx.restore();
    }
    // Background decor
    drawDecor(gameState, ctx);
    // Ground effects first so trails render behind characters
    drawHazards(gameState, ctx);
    drawGems(gameState, ctx);
    drawPickups(gameState, ctx);
    // Entities and projectiles above ground
    // Draw order: projectiles -> enemies -> player (projectiles render behind player)
    drawProjectiles(gameState, ctx);
    drawEnemies();
    drawPlayer();
    ctx.restore();
    // Boss HUD and other UI draw in screen space
    drawBossHUD(gameState, ctx, canvas);
    // HUD dynamic info
    const fpsEl = document.getElementById('hud-fps');
    if (fpsEl && gameState._fps) fpsEl.textContent = String(gameState._fps);
    if (typeof gameState._refreshDebtHUD === 'function' && !gameState.paused) gameState._refreshDebtHUD();
    if (typeof gameState._refreshStatsHUD === 'function') gameState._refreshStatsHUD();
    if (typeof gameState._refreshBuffsHUD === 'function') gameState._refreshBuffsHUD();
    requestAnimationFrame(gameLoop);
}

function init() {
    resizeCanvas();
    initAudio();
    initMeta(gameState);
    // Initialize debt & HUD
    gameState.debt = createDebtState({ initialDebt: 10000, autoRepayPerFrame: 0.1 });
    initDebtUI(gameState);
    // Use fixed world; center camera at start and compute initial scale
    gameState.baseScale = computeRenderScale();
    gameState.renderScale = (gameState.baseScale || 1) * (gameState.zoom || 1);
    gameState.camera = { x: gameState.world.width / 2, y: gameState.world.height / 2 };
    // Scatter decorative rocks around edges
    initDecor(gameState, canvas);
    // Character selection
    const startModal = document.getElementById('startModal');
    const btnStartGame = document.getElementById('btnStartGame');
    const charModal = document.getElementById('charModal');
    const btnGnorp = document.getElementById('pickGnorp');
    const btnIgnis = document.getElementById('pickIgnis');
    const btnFizzle = document.getElementById('pickFizzle');

    function startAs(characterKey) {
        gameState.player = new Player(canvas, gameState);
        initLevelSystem(gameState, canvas);
        applyCharacterToPlayer(gameState.player, gameState, characterKey);
        applyMetaAtRunStart(gameState);
        if (charModal) charModal.style.display = 'none';
        if (typeof gameState._refreshDebtHUD === 'function') gameState._refreshDebtHUD();
    }

    if (btnGnorp) btnGnorp.addEventListener('click', () => startAs('Gnorp'));
    if (btnIgnis) btnIgnis.addEventListener('click', () => startAs('Ignis'));
    if (btnFizzle) btnFizzle.addEventListener('click', () => startAs('Fizzle'));
    if (btnStartGame) btnStartGame.addEventListener('click', () => {
        if (startModal) startModal.style.display = 'none';
        if (charModal) charModal.style.display = 'flex';
    });
    // Mouse tracking for aim
    function updateMouse(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;
        // Convert to world coordinates using current camera and render scale
        const s = gameState.renderScale || 1;
        const camX = (gameState.camera?.x || canvas.width / 2) - canvas.width / (2 * s);
        const camY = (gameState.camera?.y || canvas.height / 2) - canvas.height / (2 * s);
        gameState.mouse = { x: camX + mx / s, y: camY + my / s };
    }
    window.addEventListener('mousemove', updateMouse);
    window.addEventListener('mousedown', updateMouse);
    // Mouse wheel zoom with cursor anchoring
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const sx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const sy = (e.clientY - rect.top) * (canvas.height / rect.height);
        const dir = e.deltaY < 0 ? 1 : -1; // up = zoom in
        const factor = dir > 0 ? 1.1 : 1 / 1.1;
        applyZoom(gameState.zoom * factor, sx, sy);
    }, { passive: false });
    window.addEventListener('resize', resizeCanvas);

    // Buff HUD: DOM rendering for active temporary buffs
    const buffsHUD = document.getElementById('buffsHUD');
    function refreshBuffsHUD() {
        if (!buffsHUD) return;
        const buffs = (gameState._buffs || []).filter(b => b && (b.label || b.icon));
        buffsHUD.innerHTML = '';
        for (const b of buffs) {
            const pill = document.createElement('div'); pill.className = 'buff-pill';
            const icon = document.createElement('span'); icon.className = 'buff-icon';
            if (b.color) icon.style.background = b.color;
            const label = document.createElement('span'); label.className = 'buff-label'; label.textContent = b.label || '';
            const time = document.createElement('span'); time.className = 'buff-time'; time.textContent = Math.ceil((b.remaining || 0) / 60) + 's';
            pill.appendChild(icon); pill.appendChild(label); pill.appendChild(time);
            buffsHUD.appendChild(pill);
        }
    }
    gameState._refreshBuffsHUD = refreshBuffsHUD;

    // Stats HUD: show key multipliers as percentages
    const elFire = document.getElementById('stats-fire');
    const elDmg = document.getElementById('stats-damage');
    const elSpd = document.getElementById('stats-speed');
    const elSize = document.getElementById('stats-size');
    function pct(x) { return Math.round((x || 1) * 100) + '%'; }
    function refreshStatsHUD() {
        if (!elFire || !elDmg || !elSpd || !elSize) return;
        const p = gameState.player;
        if (!p || !p.stats) {
            elFire.textContent = '100%';
            elDmg.textContent = '100%';
            elSpd.textContent = '100%';
            elSize.textContent = '100%';
            return;
        }
        elFire.textContent = pct(p.stats.fireRateMultiplier || 1);
        elDmg.textContent = pct(p.stats.damageMultiplier || 1);
        elSpd.textContent = pct(p.stats.speedMultiplier || 1);
        elSize.textContent = pct(p.stats.projSizeMultiplier || 1);
    }
    gameState._refreshStatsHUD = refreshStatsHUD;
    const btnMute = document.getElementById('btnMute');
    const btnZoomIn = document.getElementById('btnZoomIn');
    const btnZoomOut = document.getElementById('btnZoomOut');
    const btnMenu = document.getElementById('btnMenu');
    const hudMenu = document.getElementById('hudMenuPanel');
    const btnResume = document.getElementById('btnResume');
    if (btnMenu && hudMenu) {
        function openMenu() {
            hudMenu.classList.add('open');
            gameState._pausedBeforeMenu = !!gameState.paused;
            gameState.paused = true;
        }
        function closeMenu(opts) {
            const resume = !!(opts && opts.resume);
            hudMenu.classList.remove('open');
            // Restore pause state if no other modal is forcing pause
            const anyModalOpen = !!document.querySelector('.modal[style*="display: flex"]');
            if (resume) {
                gameState.paused = false;
            } else if (!anyModalOpen) {
                gameState.paused = !!gameState._pausedBeforeMenu;
            }
            gameState._pausedBeforeMenu = undefined;
        }
        // Expose menu controls for other modules (shop/loan close hooks)
        gameState._openHudMenu = openMenu;
        gameState._closeHudMenu = closeMenu;
        btnMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            if (hudMenu.classList.contains('open')) closeMenu(); else openMenu();
        });
        // Close menu when clicking outside it
        document.addEventListener('click', (e) => {
            const t = e.target;
            const anyModalOpen = !!document.querySelector('.modal[style*="display: flex"]');
            if (anyModalOpen) return; // keep menu open behind modals
            if (hudMenu.classList.contains('open') && !hudMenu.contains(t) && t !== btnMenu) closeMenu();
        });
        // Close when pressing Escape
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && hudMenu.classList.contains('open')) closeMenu(); });
        // Close when any button inside the menu is activated, letting target UI handle pausing
        hudMenu.addEventListener('click', (e) => {
            const btn = e.target?.closest && e.target.closest('.hud-btn');
            if (!btn) return;
            const id = btn.id || '';
            // Keep menu open for Shop, Loan Shark, and Zoom buttons
            if (id === 'btnMeta' || id === 'btnLoan' || id === 'btnZoomIn' || id === 'btnZoomOut') return;
            closeMenu();
        });
        if (btnResume) {
            btnResume.addEventListener('click', (e) => {
                e.stopPropagation();
                closeMenu({ resume: true });
            });
        }
    }
    let muted = false;
    if (btnMute) btnMute.addEventListener('click', () => {
        muted = !muted;
        setMuted(muted);
        btnMute.textContent = muted ? 'Unmute' : 'Mute';
    });
    // Fullscreen toggle (show only on touch devices)
    const btnFS = document.getElementById('btnFullscreen');
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    function fsActive() { return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement; }
    function reqFS(el) {
        const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
        if (fn) fn.call(el);
    }
    function exitFS() {
        const fn = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
        if (fn) fn.call(document);
    }
    function updateFSLabel() { if (btnFS) btnFS.textContent = fsActive() ? 'Exit Fullscreen' : 'Fullscreen'; }
    if (btnFS) {
        if (isTouch) btnFS.style.display = 'inline-block';
        btnFS.addEventListener('click', () => { fsActive() ? exitFS() : reqFS(document.documentElement); });
        document.addEventListener('fullscreenchange', updateFSLabel);
        document.addEventListener('webkitfullscreenchange', updateFSLabel);
        updateFSLabel();
    }
    // Touch zoom buttons
    if (btnZoomIn && btnZoomOut) {
        if (isTouch) { btnZoomIn.style.display = 'inline-block'; btnZoomOut.style.display = 'inline-block'; }
        const anchor = () => ({ x: canvas.width / 2, y: canvas.height / 2 });
        btnZoomIn.addEventListener('click', () => { const a = anchor(); applyZoom(gameState.zoom * 1.1, a.x, a.y); });
        btnZoomOut.addEventListener('click', () => { const a = anchor(); applyZoom(gameState.zoom / 1.1, a.x, a.y); });
    }
    const btnRestart = document.getElementById('btnRestart');
    if (btnRestart) btnRestart.addEventListener('click', restartRun);
    const btnReset = document.getElementById('btnReset');
    if (btnReset) btnReset.addEventListener('click', () => {
        const ok = window.confirm('Reset all progression (meta upgrades and saved debt/gold)? This cannot be undone.');
        if (!ok) return;
        try { localStorage.removeItem('goblins_meta_v1'); } catch {}
        // Reset debt/gold explicitly back to starting values (storage and in-memory)
        try {
            const resetPayload = JSON.stringify({ debt: 10000, gold: 0 });
            try { localStorage.removeItem('goblins-inferno:debt'); } catch {}
            localStorage.setItem('goblins-inferno:debt', resetPayload);
        } catch {}
        // Update in-memory state immediately in case reload is delayed
        if (gameState.debt) {
            gameState.debt.debt = 10000;
            gameState.debt.gold = 0;
            try { if (typeof gameState._refreshDebtHUD === 'function') gameState._refreshDebtHUD(); } catch {}
        }
        // Hard reload to ensure a clean state and UI
        const u = new URL(location.href);
        u.searchParams.set('v', String(Date.now()));
        location.href = u.toString();
    });
    const btnGameOverMeta = document.getElementById('btnGameOverMeta');
    if (btnGameOverMeta) btnGameOverMeta.addEventListener('click', () => {
        const over = document.getElementById('gameOverModal');
        if (over) over.style.display = 'none';
        try { if (typeof gameState._openMetaModal === 'function') gameState._openMetaModal(); } catch {}
    });

    // Victory modal wiring
    const winModal = document.getElementById('gameWinModal');
    const winStats = document.getElementById('gameWinStats');
    const btnWinRestart = document.getElementById('btnWinRestart');
    const btnWinContinue = document.getElementById('btnWinContinue');
    const btnWinMeta = document.getElementById('btnWinMeta');
    function openWinModal() {
        if (winStats) {
            const lvl = gameState.level;
            const gems = gameState.totalGems;
            winStats.textContent = `Level ${lvl} | Gems ${gems}`;
        }
        if (winModal) winModal.style.display = 'flex';
        gameState.paused = true;
    }
    if (btnWinRestart) btnWinRestart.addEventListener('click', () => {
        if (winModal) winModal.style.display = 'none';
        restartRun();
    });
    if (btnWinContinue) btnWinContinue.addEventListener('click', () => {
        if (winModal) winModal.style.display = 'none';
        gameState.paused = false;
    });
    if (btnWinMeta) btnWinMeta.addEventListener('click', () => {
        if (winModal) winModal.style.display = 'none';
        try { if (typeof gameState._openMetaModal === 'function') gameState._openMetaModal(); } catch {}
    });
    // Expose so bosses can trigger
    gameState._openWinModal = openWinModal;
    window.addEventListener('keydown', e => {
        gameState.keys[e.code] = true;
        if (!gameState.player) return;
        if (e.code === 'Digit1') gameState.player.weapon = 'inferno';
        if (e.code === 'Digit2') gameState.player.weapon = 'flame';
        if (e.code === 'Digit3') gameState.player.weapon = 'orb';
        if (e.code === 'KeyP') gameState.paused = !gameState.paused;
    });
    window.addEventListener('keyup', e => gameState.keys[e.code] = false);

    // Touch controls for mobile (multitouch virtual joysticks)
    setupTouchControls();
    gameLoop();
}

function boot() {
    const overlay = document.getElementById('loadingOverlay');
    const bar = document.getElementById('loadingProgress');
    function onProgress(ratio) {
        if (bar) bar.style.width = Math.max(0, Math.min(100, Math.floor(ratio * 100))) + '%';
    }
    preloadAll(onProgress).then(() => {
        if (overlay) overlay.style.display = 'none';
        init();
    });
}

boot();

function computeRenderScale() {
    // On touch/mobile devices, scale down the world so more is visible
    const touchCapable = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!touchCapable) return 1;
    const minDim = Math.min(window.innerWidth, window.innerHeight);
    // Heuristic scaling: more reduction for smaller screens
    if (minDim <= 420) return 0.65;
    if (minDim <= 520) return 0.75;
    if (minDim <= 760) return 0.85;
    return 0.95;
}

// Apply zoom keeping a given screen-space anchor stable (sx, sy in canvas pixels)
function applyZoom(newZoom, sx, sy) {
    // Dynamic min zoom so viewport never exceeds world bounds
    const W = gameState.world.width;
    const H = gameState.world.height;
    const base = gameState.baseScale || 1;
    const neededS = Math.max(canvas.width / W, canvas.height / H);
    const dynamicMinZ = neededS / base;
    const minZ = Math.max(gameState.zoomMin || 0.6, dynamicMinZ);
    const maxZ = gameState.zoomMax || 2.0;
    const prevS = gameState.renderScale || 1;
    const prevZ = gameState.zoom || 1;
    const clamped = Math.max(minZ, Math.min(maxZ, newZoom));
    if (Math.abs(clamped - prevZ) < 1e-4) return;
    // Compute world point under the anchor before zoom
    const prevCamX = (gameState.camera?.x || canvas.width / 2) - canvas.width / (2 * prevS);
    const prevCamY = (gameState.camera?.y || canvas.height / 2) - canvas.height / (2 * prevS);
    const worldX = prevCamX + (sx / prevS);
    const worldY = prevCamY + (sy / prevS);
    // Update zoom and effective render scale
    gameState.zoom = clamped;
    gameState.renderScale = (gameState.baseScale || 1) * (gameState.zoom || 1);
    const s = gameState.renderScale || 1;
    // Compute new camera such that anchor maps back to same screen pos
    let newCamX = worldX - (sx / s);
    let newCamY = worldY - (sy / s);
    // Convert cam back to camera center and clamp to world
    const halfW = canvas.width / (2 * s);
    const halfH = canvas.height / (2 * s);
    let cx = newCamX + halfW;
    let cy = newCamY + halfH;
    cx = Math.max(halfW, Math.min(W - halfW, cx));
    cy = Math.max(halfH, Math.min(H - halfH, cy));
    gameState.camera.x = cx;
    gameState.camera.y = cy;
}

function setupTouchControls() {
    const container = document.getElementById('touchControls');
    const moveStick = document.getElementById('moveStick');
    const aimStick = document.getElementById('aimStick');
    if (!container || !moveStick || !aimStick) return;
    const touchCapable = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!touchCapable) { container.style.display = 'none'; return; }
    container.style.display = 'block';
    let moveId = null; let aimId = null;
    const radius = 60; // px

    function centerOf(el) {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    function assignTouch(t) {
        const half = window.innerWidth / 2;
        if (t.clientX < half && moveId === null) { moveId = t.identifier; return 'move'; }
        if (t.clientX >= half && aimId === null) { aimId = t.identifier; return 'aim'; }
        return null;
    }
    function getTouchById(list, id) { for (let i = 0; i < list.length; i++) if (list[i].identifier === id) return list[i]; return null; }

    function updateStick(which, t) {
        const el = which === 'move' ? moveStick : aimStick;
        const knob = el.querySelector('.knob');
        const c = centerOf(el);
        const dx = t.clientX - c.x;
        const dy = t.clientY - c.y;
        const d = Math.hypot(dx, dy);
        const cl = Math.min(radius, d);
        const nx = d > 0 ? dx / d : 0;
        const ny = d > 0 ? dy / d : 0;
        knob.style.transform = `translate(${nx * cl}px, ${ny * cl}px)`;
        if (which === 'move') {
            gameState._touchMove = { dx: nx, dy: ny };
        } else {
            // Aim vector sets mouse in world space relative to player
            if (gameState.player) {
                const px = gameState.player.x, py = gameState.player.y;
                gameState.mouse = { x: px + nx * 200, y: py + ny * 200 };
            }
        }
    }
    function resetStick(which) {
        const el = which === 'move' ? moveStick : aimStick;
        const knob = el.querySelector('.knob');
        knob.style.transform = 'translate(0,0)';
        if (which === 'move') gameState._touchMove = { dx: 0, dy: 0 };
    }

    function onStart(e) {
        for (const t of Array.from(e.changedTouches)) assignTouch(t);
    }
    function onMove(e) {
        e.preventDefault(); // disable scroll/zoom gestures
        const mt = getTouchById(e.touches, moveId);
        if (mt) updateStick('move', mt);
        const at = getTouchById(e.touches, aimId);
        if (at) updateStick('aim', at);
    }
    function onEnd(e) {
        for (const t of Array.from(e.changedTouches)) {
            if (t.identifier === moveId) { moveId = null; resetStick('move'); }
            if (t.identifier === aimId) { aimId = null; resetStick('aim'); }
        }
    }

    container.addEventListener('touchstart', onStart, { passive: false });
    container.addEventListener('touchmove', onMove, { passive: false });
    container.addEventListener('touchend', onEnd, { passive: false });
    container.addEventListener('touchcancel', onEnd, { passive: false });
}
