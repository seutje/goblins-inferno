// Lightweight audio helper using WebAudio with oscillator-based synthesized cues

const audioState = {
  ctx: null,
  enabled: true,
  compressor: null,
  output: null, // final node before destination (e.g., compressor or masterGain)
};

export function initAudio() {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return;
  if (!audioState.ctx) {
    audioState.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const ctx = audioState.ctx;

  // Create a single shared dynamics compressor to tame peaks when many sounds overlap
  if (!audioState.compressor) {
    const comp = ctx.createDynamicsCompressor();
    try {
      // Gentle limiting profile
      comp.threshold.setValueAtTime(-20, ctx.currentTime); // dB
      comp.knee.setValueAtTime(18, ctx.currentTime);        // dB
      comp.ratio.setValueAtTime(12, ctx.currentTime);       // ratio
      comp.attack.setValueAtTime(0.003, ctx.currentTime);   // seconds
      comp.release.setValueAtTime(0.25, ctx.currentTime);   // seconds
    } catch (_) {
      // Older browsers may not support AudioParam.setValueAtTime on all props; ignore
    }
    comp.connect(ctx.destination);
    audioState.compressor = comp;
    audioState.output = comp;
  }
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
  // Route through compressor if available to avoid excessive loudness
  const out = audioState.output || ctx.destination;
  osc.connect(g).connect(out);
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
    case 'heal':
      beep({ freq: 600, duration: 0.05, type: 'sine', gain: 0.03 });
      beep({ freq: 800, duration: 0.04, type: 'sine', gain: 0.02 });
      break;
    case 'loan':
      beep({ freq: 400, duration: 0.05, type: 'triangle', gain: 0.03 });
      break;
    default:
      break;
  }
}
