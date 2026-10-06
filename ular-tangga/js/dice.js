// Modul dadu & suara (Web Audio, tanpa file eksternal).
let ctx, mute = false;
export const toggleMute = () => (mute = !mute);
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export function beep(f = 440, d = .12) {
  if (mute) return;
  try { ctx ??= new AudioContext(); const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; g.gain.value = .08; o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + d); } catch {}
}
export async function roll(el) {
  const F = '⚀⚁⚂⚃⚄⚅'; let v;
  for (let i = 0; i < 8; i++) { v = 1 + Math.floor(Math.random() * 6); el.textContent = F[v - 1]; beep(300 + v * 40, .05); await sleep(80); }
  return v;
}
