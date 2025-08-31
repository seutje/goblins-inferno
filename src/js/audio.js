// Lightweight audio helper using WebAudio with oscillator-based synthesized cues

const audioState = {
  ctx: null,
  enabled: true,
};

export function initAudio() {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return;
  if (!audioState.ctx) audioState.ctx = new (window.AudioContext || window.webkitAudioContext)();
}

export function setMuted(muted) {
  audioState.enabled = !muted;
}

function beep({ freq = 440, duration = 0.08, type = 'sine', gain = 0.03 } = {}) {
  if (!audioState.enabled) return;
  const ctx = audioState.ctx;
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

export function playSound(kind) {
  // In Node/Jest, this will be a no-op (no window)
  switch (kind) {
    case 'fire':
      beep({ freq: 660, duration: 0.03, type: 'triangle', gain: 0.02 });
      break;
    case 'enemy_die':
      beep({ freq: 220, duration: 0.06, type: 'sawtooth', gain: 0.03 });
      break;
    case 'boss_spawn':
      beep({ freq: 320, duration: 0.12, type: 'square', gain: 0.04 });
      beep({ freq: 160, duration: 0.12, type: 'square', gain: 0.04 });
      break;
    case 'boss_down':
      beep({ freq: 480, duration: 0.08, type: 'sine', gain: 0.04 });
      beep({ freq: 360, duration: 0.1, type: 'sine', gain: 0.03 });
      break;
    case 'upgrade':
      beep({ freq: 520, duration: 0.05, type: 'triangle', gain: 0.03 });
      break;
    case 'loan':
      beep({ freq: 400, duration: 0.05, type: 'triangle', gain: 0.03 });
      break;
    default:
      break;
  }
}
