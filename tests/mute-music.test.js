/** @jest-environment jsdom */
import { jest } from '@jest/globals';

test('unmuting plays music', async () => {
  const mockPlayMusic = jest.fn();
  const mockSetMuted = jest.fn();
  const mockInitAudio = jest.fn();
  const mockLoadMuted = jest.fn(() => true);
  const mockPlaySound = jest.fn();

  await jest.unstable_mockModule('../src/js/audio.js', () => ({
    __esModule: true,
    initAudio: mockInitAudio,
    playSound: mockPlaySound,
    setMuted: mockSetMuted,
    playMusic: mockPlayMusic,
    loadMuted: mockLoadMuted,
  }));

  await jest.unstable_mockModule('../src/js/preload.js', () => ({
    __esModule: true,
    preloadAll: () => Promise.resolve(),
    getImage: jest.fn(),
  }));

  await jest.unstable_mockModule('../src/js/player.js', () => ({ __esModule: true, default: jest.fn(() => ({ update: jest.fn(), draw: jest.fn() })) }));
  await jest.unstable_mockModule('../src/js/projectile.js', () => ({ __esModule: true, updateProjectiles: jest.fn(), drawProjectiles: jest.fn() }));
  await jest.unstable_mockModule('../src/js/spawner.js', () => ({ __esModule: true, updateSpawner: jest.fn() }));
  await jest.unstable_mockModule('../src/js/level.js', () => ({ __esModule: true, initLevelSystem: jest.fn(), updateLevelSystem: jest.fn(), drawGems: jest.fn(), spawnCoin: jest.fn() }));
  await jest.unstable_mockModule('../src/js/debt.js', () => ({ __esModule: true, createDebtState: jest.fn(() => ({})), updateDebt: jest.fn(), initDebtUI: jest.fn(), repay: jest.fn() }));
  await jest.unstable_mockModule('../src/js/characters.js', () => ({ __esModule: true, applyCharacterToPlayer: jest.fn() }));
  await jest.unstable_mockModule('../src/js/hazard.js', () => ({ __esModule: true, updateHazards: jest.fn(), drawHazards: jest.fn() }));
  await jest.unstable_mockModule('../src/js/decor.js', () => ({ __esModule: true, initDecor: jest.fn(), drawDecor: jest.fn() }));
  await jest.unstable_mockModule('../src/js/boss.js', () => ({ __esModule: true, updateBoss: jest.fn(), drawBossHUD: jest.fn() }));
  await jest.unstable_mockModule('../src/js/meta.js', () => ({ __esModule: true, initMeta: jest.fn(), applyMetaAtRunStart: jest.fn() }));
  await jest.unstable_mockModule('../src/js/pickups.js', () => ({ __esModule: true, updatePickups: jest.fn(), drawPickups: jest.fn(), spawnHealthPickup: jest.fn() }));

  document.body.innerHTML = '<canvas id="gameCanvas"></canvas><button id="btnMute"></button>';
  const canvas = document.getElementById('gameCanvas');
  canvas.getContext = () => ({
    clearRect: jest.fn(),
    save: jest.fn(),
    scale: jest.fn(),
    translate: jest.fn(),
    restore: jest.fn(),
    fillRect: jest.fn(),
    fillStyle: ''
  });
  window.requestAnimationFrame = jest.fn();

  await import('../src/js/main.js');
  await Promise.resolve();

  document.getElementById('btnMute').click();

  expect(mockSetMuted).toHaveBeenLastCalledWith(false);
  expect(mockPlayMusic).toHaveBeenCalled();
});

