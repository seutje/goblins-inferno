// Leveling, gems, and upgrades

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function initLevelSystem(gameState, canvas) {
  // Internal timers
  gameState._gemTimer = 120;

  // Initialize player stat multipliers if missing
  if (!gameState.player.stats) {
    gameState.player.stats = {
      speedMultiplier: 1,
      fireRateMultiplier: 1,
      damageMultiplier: 1,
      projSizeMultiplier: 1
    };
  }

  // Define upgrade pool
  gameState.upgradePool = [
    {
      id: 'spd_1', name: 'Fleet Feet', desc: '+15% move speed',
      apply: (gs) => { gs.player.stats.speedMultiplier *= 1.15; }
    },
    {
      id: 'firerate_1', name: 'Rapid Fire', desc: '+20% fire rate',
      apply: (gs) => { gs.player.stats.fireRateMultiplier *= 1.20; }
    },
    {
      id: 'dmg_1', name: 'Hotter Flames', desc: '+20% projectile damage',
      apply: (gs) => { gs.player.stats.damageMultiplier *= 1.20; }
    },
    {
      id: 'size_1', name: 'Bigger Blasts', desc: '+15% projectile size',
      apply: (gs) => { gs.player.stats.projSizeMultiplier *= 1.15; }
    },
    {
      id: 'firerate_2', name: 'Blazing Hands', desc: '+20% fire rate',
      apply: (gs) => { gs.player.stats.fireRateMultiplier *= 1.20; }
    },
    {
      id: 'dmg_2', name: 'White Heat', desc: '+20% projectile damage',
      apply: (gs) => { gs.player.stats.damageMultiplier *= 1.20; }
    }
  ];

  // Wire modal UI
  const modal = document.getElementById('upgradeModal');
  const slots = [0,1,2].map(i => ({
    container: document.getElementById(`choice${i}`),
    title: document.getElementById(`choice${i}-title`),
    desc: document.getElementById(`choice${i}-desc`)
  }));

  function openUpgrade(choices) {
    gameState.paused = true;
    gameState.upgradeChoices = choices;
    choices.forEach((u, i) => {
      const slot = slots[i];
      if (slot) {
        slot.title.textContent = u.name;
        slot.desc.textContent = u.desc;
      }
    });
    modal.style.display = 'flex';
  }

  function closeUpgrade() {
    modal.style.display = 'none';
    gameState.upgradeChoices = [];
    gameState.paused = false;
  }

  gameState.onChooseUpgrade = (idx) => {
    const u = gameState.upgradeChoices[idx];
    if (u && typeof u.apply === 'function') {
      u.apply(gameState);
    }
    closeUpgrade();
  };

  slots.forEach((slot, i) => {
    slot.container.addEventListener('click', () => gameState.onChooseUpgrade(i));
  });

  // Expose open function for internal use
  gameState._openUpgradeModal = openUpgrade;
}

export function updateLevelSystem(gameState, canvas) {
  // Spawn gems periodically for now (until enemy loot is wired)
  if (gameState._gemTimer-- <= 0) {
    const gem = {
      x: randInt(16, canvas.width - 16),
      y: randInt(16, canvas.height - 16),
      size: 5,
      value: 1,
      color: '#3ff'
    };
    gameState.gems.push(gem);
    // Scale frequency modestly with difficulty
    gameState._gemTimer = Math.max(90, 180 - Math.floor(gameState.difficulty));
  }

  // Check gem pickup
  const p = gameState.player;
  for (let i = gameState.gems.length - 1; i >= 0; i--) {
    const g = gameState.gems[i];
    const dx = g.x - p.x;
    const dy = g.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= (g.size + p.size)) {
      // Collect
      gameState.xp += g.value;
      gameState.totalGems += g.value;
      gameState.gems.splice(i, 1);
      // Level-up check
      while (gameState.xp >= gameState.nextLevelXp) {
        gameState.xp -= gameState.nextLevelXp;
        gameState.level += 1;
        gameState.nextLevelXp = Math.ceil(gameState.nextLevelXp * 1.5);
        // Offer upgrades
        const choices = sampleUpgrades(gameState.upgradePool, 3);
        if (choices.length > 0 && gameState._openUpgradeModal) {
          gameState._openUpgradeModal(choices);
        }
      }
    }
  }
}

export function drawGems(gameState, ctx) {
  gameState.gems.forEach(g => {
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function sampleUpgrades(pool, n) {
  const result = [];
  const used = new Set();
  let attempts = 0;
  while (result.length < n && attempts < 50) {
    attempts++;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!pick) break;
    if (used.has(pick.id)) continue;
    used.add(pick.id);
    result.push(pick);
  }
  return result;
}

