// Web Audio page-turn sound. Fully synthesised (no asset files), and the
// AudioContext is created lazily on the first user gesture, so it never trips
// the browser autoplay block. Muted by default; the sound store flips `muted`.

let ctx: AudioContext | null = null;
let muted = true;

export function setSoundMuted(m: boolean) {
  muted = m;
}
export function isSoundMuted() {
  return muted;
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/**
 * A short paper swish: a decaying noise burst pushed through a bandpass that
 * sweeps upward, so a page turn sounds like a leaf of paper, not a click.
 * Low gain on purpose; this sits under the motion, it does not announce itself.
 */
export function playFlip() {
  if (muted) return;
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const dur = 0.26;

  const frames = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const src = ac.createBufferSource();
  src.buffer = buf;

  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(820, now);
  bp.frequency.exponentialRampToValueAtTime(2600, now + dur * 0.6);
  bp.Q.value = 0.8;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  src.connect(bp).connect(gain).connect(ac.destination);
  src.start(now);
  src.stop(now + dur);
}

/**
 * One soft bell for the intro curtain: two sine partials (a fifth apart) with a quick
 * attack and a long exponential tail. Same lazy context and low gain as playFlip;
 * muted means silence.
 */
export function playChime() {
  if (muted) return;
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const dur = 1.6;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.1, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  gain.connect(ac.destination);

  for (const [freq, level] of [
    [660, 1],
    [990, 0.35],
  ] as const) {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ac.createGain();
    g.gain.value = level;
    osc.connect(g).connect(gain);
    osc.start(now);
    osc.stop(now + dur);
  }
}
