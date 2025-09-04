const LS_KEY = 'goblins_meta_v1';

function defaultMeta() {
  return {
    upgrades: {
      multishot: 0,
      bounce: 0,
      magnet: 0,
      pierce: 0
    }
  };
}

export function loadMeta() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultMeta();
    const data = JSON.parse(raw);
    return { ...defaultMeta(), ...data, upgrades: { ...defaultMeta().upgrades, ...(data.upgrades||{}) } };
  } catch {
    return defaultMeta();
  }
}

export function saveMeta(meta) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(meta)); } catch {}
}

export function initMeta(gameState) {
  const meta = loadMeta();
  gameState.meta = meta;
  // Base magnet radius boost: +20 per level
  const baseMagnet = 110;
  const bonus = 20 * (meta.upgrades.magnet || 0);
  gameState.magnetRadius = baseMagnet + bonus;
  // Wire UI
  wireMetaUI(gameState);
}

export function applyMetaAtRunStart(gameState) {
  const up = (gameState.meta?.upgrades) || {};
  gameState._metaMods = {
    multishot: up.multishot || 0,
    bounce: up.bounce || 0,
    pierce: up.pierce || 0
  };
}

function wireMetaUI(gameState) {
  const modal = document.getElementById('metaModal');
  const openBtn = document.getElementById('btnMeta');
  const closeBtn = document.getElementById('metaClose');
  const goldEl = document.getElementById('metaGold');
  const list = [
    { key: 'multishot', label: 'Multishot', desc: '+2 shots spread per level', costBase: 100 },
    { key: 'bounce', label: 'Bouncing Shots', desc: '+1 wall bounce per level', costBase: 120 },
    { key: 'magnet', label: 'Magnetic Range', desc: '+20px pickup radius per level', costBase: 80 },
    { key: 'pierce', label: 'Penetration', desc: '+1 enemy penetration per level', costBase: 120 }
  ];
  const rows = {};
  list.forEach(item => {
    rows[item.key] = {
      levelEl: document.getElementById(`meta-${item.key}-level`),
      buyBtn: document.getElementById(`meta-${item.key}-buy`),
      costEl: document.getElementById(`meta-${item.key}-cost`)
    };
  });

  function levelOf(key) { return gameState.meta?.upgrades?.[key] || 0; }
  function costOf(key, base) { const lvl = levelOf(key); return base * (lvl + 1); }

  function refresh() {
    const curGold = Math.max(0, Math.floor(gameState.debt?.gold || 0));
    if (goldEl) goldEl.textContent = String(curGold);
    list.forEach(item => {
      const lvl = levelOf(item.key);
      const cost = costOf(item.key, item.costBase);
      rows[item.key].levelEl.textContent = String(lvl);
      rows[item.key].costEl.textContent = String(cost);
      rows[item.key].buyBtn.disabled = curGold < cost || lvl >= 10;
    });
  }

  list.forEach(item => {
    rows[item.key].buyBtn.addEventListener('click', () => {
      const cost = costOf(item.key, item.costBase);
      const available = Math.max(0, Math.floor(gameState.debt?.gold || 0));
      if (available >= cost) {
        if (gameState.debt) gameState.debt.gold = Math.max(0, available - cost);
        gameState.meta.upgrades[item.key] = levelOf(item.key) + 1;
        // apply live effects where relevant
        if (item.key === 'magnet') {
          const baseMagnet = 110;
          const bonus = 20 * (gameState.meta.upgrades.magnet || 0);
          gameState.magnetRadius = baseMagnet + bonus;
        }
        // ensure runtime mods object exists
        if (!gameState._metaMods) gameState._metaMods = {};
        if (item.key === 'multishot') {
          gameState._metaMods.multishot = gameState.meta.upgrades.multishot || 0;
        }
        if (item.key === 'bounce') {
          gameState._metaMods.bounce = gameState.meta.upgrades.bounce || 0;
        }
        if (item.key === 'pierce') {
          gameState._metaMods.pierce = gameState.meta.upgrades.pierce || 0;
        }
        saveMeta(gameState.meta);
        try { if (typeof gameState._refreshDebtHUD === 'function') gameState._refreshDebtHUD(); } catch {}
        refresh();
      }
    });
  });

  function open() {
    if (modal) modal.style.display = 'flex';
    if (gameState) {
      gameState._pausedBeforeMeta = !!gameState.paused;
      gameState.paused = true;
    }
    refresh();
  }
  function close() {
    if (modal) modal.style.display = 'none';
    if (gameState) {
      // If the run is over, keep paused and restore the game-over modal.
      if (gameState.gameOver) {
        gameState.paused = true;
        const over = document.getElementById('gameOverModal');
        if (over) over.style.display = 'flex';
      }
      // After closing the shop, pause the game and open the HUD menu
      gameState.paused = true;
      try { if (typeof gameState._openHudMenu === 'function') gameState._openHudMenu(); } catch {}
      gameState._pausedBeforeMeta = undefined;
    }
  }
  if (openBtn) openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', (e) => {
    // Prevent the document-level click handler from closing the HUD menu
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    close();
  });
  // Expose to other UI (e.g., victory screen)
  if (gameState) gameState._openMetaModal = open;
}
