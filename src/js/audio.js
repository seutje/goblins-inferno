// Lightweight audio helper using WebAudio with oscillator-based synthesized cues

const audioState = {
  ctx: null,
  enabled: true,
  compressor: null,
  output: null, // final node before destination (e.g., compressor or masterGain)
};

const MUTE_KEY = 'goblins-inferno:muted';

function canStore() {
  try { return typeof localStorage !== 'undefined'; } catch { return false; }
}

export function loadMuted() {
  if (!canStore()) return true;
  try {
    const val = localStorage.getItem(MUTE_KEY);
    return val === null ? true : val === '1';
  } catch {
    return true;
  }
}

function saveMuted(muted) {
  if (!canStore()) return;
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch {}
}

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
  if (typeof window !== 'undefined' && window.Tone && window.Tone.Destination) {
    window.Tone.Destination.mute = muted;
  }
  saveMuted(muted);
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

export async function playMusic() {
  if (typeof window === 'undefined' || !window.Tone || !window.Midi) return;
  if (!audioState.enabled) return;
  try {
    await window.Tone.start();
    const res = await fetch('src/midi/alkan.mid');
    if (!res.ok) return;
    const data = await res.arrayBuffer();
    const midi = new window.Midi(data);

    // stop any existing sequences before starting again
    window.Tone.Transport.stop();
    window.Tone.Transport.cancel(0);

    const gain = new window.Tone.Gain(0.03).toDestination(); // reduce volume by 90%
    // square wave for a chiptune vibe
    const synth = new window.Tone.PolySynth(window.Tone.Synth, {
      oscillator: { type: 'square' }
    }).connect(gain);

    const track = midi.tracks[0];
    const part = new window.Tone.Part((time, note) => {
      synth.triggerAttackRelease(note.name, note.duration, time);
    }, track.notes).start(0);
    part.loop = true;
    part.loopEnd = midi.duration;

    // simple percussion to match the melody
    const drum = new window.Tone.MembraneSynth().connect(gain);
    const beat = new window.Tone.Sequence((time) => {
      drum.triggerAttackRelease('C2', '8n', time);
    }, [0, 2], '2n').start(0);
    beat.loop = true;

    window.Tone.Transport.loop = true;
    window.Tone.Transport.loopEnd = midi.duration;
    window.Tone.Transport.start();
  } catch (err) {
    console.error('Failed to play music', err);
  }
}
