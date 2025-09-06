# Goblin's Inferno — Design Overview

This document captures the current, implemented design of Goblin's Inferno. It reflects the code in `src/js`, the runtime behavior wired in `index.html`, and the Jest tests under `tests/`.

## Goals and Current Scope

- Bullet-heaven survival with auto-firing, player-focused movement and dodging.
- Core risk/reward is the Debt System: loans increase power and future debt; gold collected during runs repays debt at death.
- Three playable goblins with distinct traits and weapon styles.
- Progressive difficulty, random upgrades on level-up, periodic bosses, and a lightweight meta-progression shop.

## Architecture

- ES modules under `src/js/` with one main render/update loop driven by `requestAnimationFrame()`.
- A single mutable `gameState` object holds all runtime state.
- Entities are ES6 classes: `Player`, `Enemy` subtypes, `Projectile`, and hazards.
- Systems are small modules with pure-ish update/draw functions: spawner, leveling, hazards, UI helpers, debt, meta, audio, asset preloading.

Key modules
- `main.js`: Boot, preload, init, input, camera/zoom, master update/draw order.
- `player.js`: Player class, input/movement, firing logic, shield/HP bars, character animation handling.
- `projectile.js`: Projectile class, player/enemy projectile factories, bouncing/piercing, shockwaves.
- `enemy.js`: Base `Enemy` plus `DebtSkeleton`, `LoanerImp`, `BailiffOgre` with distinct behaviors.
- `spawner.js`: Difficulty-scaled enemy spawn cadence and early ramp.
- `level.js`: Gems/coins, XP, level-up, rarity-weighted upgrades, and gold integration with debt.
- `debt.js`: Persistent debt+gold state, loans, auto-repay tick, HUD+loan modal wiring.
- `characters.js`: Applies character-specific stats, animations, and traits.
- `boss.js`: Boss lifecycle, three boss types, boss HUD and rewards.
- `hazard.js`: Lingering area hazards (e.g., Ignis fire trails, black holes) and updates.
- `pickups.js`: Health pickup spawn, magnetism, and collection.
- `meta.js`: Persistent meta upgrades (multishot/bounce/magnet/pierce), shop UI wiring.
- `preload.js` and `assets.js`: Versioned asset loading and shared image cache.
- `ui.js`: Canvas HUD bar styling primitives.
- `decor.js`: Non-interactive world decorations.

## Game State

`gameState` (created in `main.js`) contains:
- Input: `keys`, `mouse`, `_touchMove`.
- World/camera: `world { width: 3200, height: 2000 }`, `camera {x,y}`, `zoom`, `baseScale`, `renderScale`, `zoomMin/Max`.
- Player and entities: `player`, `enemies[]`, `projectiles[]`, `hazards[]`, `pickups[]`.
- Progression: `xp`, `level`, `nextLevelXp`, `gems[]`, `totalGems`, `totalGoldEarned`.
- Spawning: `spawnTimer`, `difficulty`, `balance` (spawn/boss timing), internal counters.
- Upgrades: `upgradePool`, `upgradeChoices`, `onChooseUpgrade`.
- Debt/meta: `debt` (persistent), `_refreshDebtHUD`, `meta`, `_metaMods`.
- Boss: `boss`, `_bossIndex`, `_bossCooldownFrames`.
- Misc: `_buffs` (temporary effects), `_fps` (smoothed frame rate), flags: `paused`, `gameOver`.

## Rendering and Loop

- Single loop in `main.js` via `requestAnimationFrame()`.
- Update order (when not paused): player → boss → enemies → projectiles → hazards → pickups → collisions → level system → debt tick → camera.
- Draw order (world space): ground tile → decor → hazards → gems → pickups → projectiles → enemies → player; then boss HUD and HUD text in screen space.
- Camera centers on player, clamped to a fixed-size world. Zooming clamps to ensure the viewport never exceeds world bounds; mouse-wheel zoom preserves cursor anchor.

Ground and decor
- Tiled ground (`src/img/tile-ground.png`) scaled and repeated over the world.
- Procedural decor: rocks scattered with spacing/edge rules; drawn small to sit under gameplay focus.

## Input and Controls

- Keyboard: WASD to move, `P` pause. Debug: `1/2/3` switch weapon archetype.
- Mouse: aim point for auto-firing; wheel zoom anchored at cursor.
- Touch: dual virtual sticks (move/aim) with analog input, only visible on touch devices.
- Fullscreen: attempts on Start for touch devices.

## Player and Weapons

- Player auto-fires based on current weapon and `fireCooldown`, aiming at mouse/aim stick.
- Base stats and per-character multipliers in `player.stats`: speed, fire rate, damage, projectile size.
- Shield system (Fizzle): regenerating shield that absorbs damage, with regen cooldown when hit.
- HP/shield bars are drawn above the player using `ui.drawBar`.

Weapons (implemented in `projectile.js`)
- Inferno Blast: slower, harder hits, modest size; animated projectile sprite.
- Flame Stream: fast, frequent, smaller; animated projectile sprite.
- Volatile Orb: slow, heavy; animated projectile sprite.
- Meta modifiers inject bounces (`_injectBounces`) and pierce (`_injectPierce`) at fire time.

Character traits (`characters.js`)
- Gnorp: extra close-range damage.
- Ignis: leaves periodic damaging fire patches while moving (scales mildly with fire rate).
- Fizzle: on gem pickup, a small chance to grant a timed buff (speed/damage/fire rate) and has a small regenerating shield; unique “proc” animation pose.

## Enemies and Spawning

- DebtSkeleton: baseline chaser.
- LoanerImp: faster, lateral wobble while advancing.
- BailiffOgre: slow approach, short-range charge attack on proximity.
- Spawner picks type by difficulty and randomness; early enemies spawn nearer center to ramp action quickly.
- Non-boss enemy death has a 10% chance to drop health; enemies also drop coins (see Leveling).

## Leveling, Gems, and Upgrades

- Gems/coins are animated sprites that attract to the player within a magnet radius (base + meta bonus); collection increments `xp`, `totalGems`, and also adds to `debt.gold` to fund shop/repayment.
- Level-up thresholds grow as `ceil(next * 1.5)`; on level-up, a modal presents three upgrades sampled from a pool, each with a rolled rarity multiplier.
- Upgrades multiplicatively scale player stat multipliers.

## Debt System and Loans

- Persistent state in `localStorage` under `goblins-inferno:debt` containing `{ debt, gold }`.
- On boot, `createDebtState({ initialDebt: 10000, autoRepayPerFrame: 0.1 })` loads/initializes debt and starts auto-repaying a small amount each frame during active runs.
- On player death, all gold auto-repays debt; run ends with Game Over modal.
- Loan Shark modal offers three loans:
  - Simple: +500 gold at 10% interest.
  - Gear: +1000 gold at 25% interest.
  - Cursed: +2000 gold at 50% interest (paired with a powerful-but-risky notion thematically).

HUD shows live debt, gold, level, XP, HP, and FPS.

## Meta Progression Shop

- Persistent `meta` in `localStorage` under `goblins_meta_v1` with upgrade levels.
- Upgrades and effects:
  - Multishot (+2 shots per level)
  - Bouncing Shots (+1 wall bounce per level)
  - Magnetic Range (+20 px pickup radius per level)
  - Penetration (+1 enemy pierce per level)
- Purchases consume current `debt.gold`. `_metaMods` are applied at run start and updated live on purchase.

## Bosses

- Spawn thresholds from `gameState.balance.bossThresholds` (default: [30, 80, 140] difficulty). After a boss dies, a cooldown prevents immediate respawn.
- On kill: +250 gold, burst of high-value gems around the death location. After final planned boss, Victory modal is offered.

Implemented bosses
- Creditor’s Champion: slow advance; “Debt Shield” reflects player shots as enemy projectiles with normalized damage/size (ignores player multipliers); “Fiery Club Slam” emits a damaging shockwave and spawns fire patches.
- Interest Dragon: patrols upper arena; “Fiery Rain” (downward fireballs and gold bombs), “Debt Spiral” (black hole hazard that pulls), “Loan Sreath” (absorb state healing from hits).
- Debt Collector: mid-range control; absorption windows that queue reflections; toggling phases late in health (see `boss.js`).

Boss HUD
- Large stylized health bar in screen space, name and HP text, plus an off-screen indicator drawn around the player pointing toward the boss.

## Collisions and Damage Model

- World uses ellipse vs circle/ellipse checks for entity overlaps, decoupled from sprite frame size to keep gameplay readable.
- Player damage pipeline: shield absorbs first (with regen cooldown), HP decremented, temporary invulnerability and brief hurt animation; death triggers run end and repayment.
- Projectiles have optional bounce and pierce; hit registration uses per-projectile `hitSet` to avoid re-hits on the same enemy when piercing.

## Assets, Preload, and Cache Busting

- `preloadAll()` loads a curated list of sprites into a shared `imageStore`; modules reuse preloaded `Image` objects via `getImage(path)`.
- `assets.versioned(path)` appends `?v=` using `window.APP_VERSION` or `index.html` URL `v` param; `index.html` injects both `style.css` and `main.js` with `?v=…`.
- Live reload: `tools/dev-watch.mjs` updates `live-reload.json`; the page polls it and hard-reloads on version changes.

## UI/UX

- Modals: Start, Character Select, Upgrade pick, Loan Shark, Meta Shop, Game Over, Victory.
- HUD menu provides Resume, Mute, Shop, Loan Shark, Restart run, Reset progression, and Zoom controls.
- Stats box shows current multipliers for fire rate, damage, run speed, and projectile size.

## Audio

- Lightweight WebAudio oscillator cues with a shared compressor to tame peaks; muted by default at init. Sounds: fire, enemy die, boss spawn/down, upgrade, heal, loan, etc.

## Tests (Jest)

Run with `npm test`. Tests focus on logic in Node (no DOM/canvas drawing assertions):
- Player: input-based movement, projectile firing cadence basics.
- Enemies: movement/behaviors, ogre charge condition.
- Spawner: cadence under timers and difficulty.
- Projectiles: bouncing, lifetime shockwave expiration.
- Hazards: player/enemy damage interaction.
- Leveling: coin clamping to world, XP progression, next-level scaling, and gold increment into debt.
- Debt: loans, auto-repay, manual repay bounds.
- Meta: magnet radius application and `_metaMods` mapping, UI wiring survivable in tests.
- Boss: spawn thresholds, absorption/reflect behavior, reflected shot normalization vs. player multipliers.

Note: Runtime FPS is tracked in-game (`gameState._fps`) and displayed in HUD; unit tests do not assert frame rate or CPU usage due to environment constraints.

## Serving and Development

- Install: `npm install`
- Serve: `npm start` (http-server on http://localhost:8000)
- Dev convenience: `npm run dev` (serve + live reload watch). Do not manually edit `live-reload.json`.
- Cache busting: append `?v=YOUR_VERSION` to `index.html` URL (or let live reload handle it).

## Known Gaps / Future Work

- Additional upgrade variety and synergies; weapon-specific upgrade trees.
- More enemy types and ranged attacks; projectile telegraphs.
- More loan types and run-duration gear effects for Gear/Cursed loans.
- Accessibility: rebindable keys, colorblind-friendly effects, sound sliders.
- Performance: sprite atlasing and batching; optional reduced effects mode.

