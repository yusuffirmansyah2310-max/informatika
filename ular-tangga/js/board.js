// Modul papan: posisi zigzag, validasi ular/tangga, gambar papan dan bidak.
import { S, cells, COL } from './state.js';
const rand = n => Math.floor(Math.random() * n);
export const pos = n => { const z = S.size, r = Math.floor((n - 1) / z), c = (n - 1) % z; return { x: r % 2 ? z - 1 - c : c, y: z - 1 - r }; };
const mid = n => { const { x, y } = pos(n); return [(x + .5) * 100 / S.size, (y + .5) * 100 / S.size]; };

// t: 's' (ular) atau 'l' (tangga). Mengembalikan pesan galat, atau '' jika valid.
export function validate(t, a, b) {
  const N = cells();
  if (!Number.isInteger(a) || !Number.isInteger(b)) return 'Isi dengan angka bulat.';
  if (a < 2 || b < 2 || a > N - 1 || b > N - 1) return `Kotak harus 2–${N - 1} (bukan kotak awal/akhir).`;
  if (t === 's' && a <= b) return 'Kepala ular harus lebih tinggi dari ekor.';
  if (t === 'l' && a >= b) return 'Kaki tangga harus lebih rendah dari ujung.';
  const u = [...S.snakes, ...S.ladders].flat();
  if (u.includes(a) || u.includes(b)) return 'Kotak sudah dipakai ular/tangga lain.';
  return '';
}
export function randomize() {
  const N = cells(), k = Math.max(2, Math.round(S.size * .6));
  S.snakes = []; S.ladders = [];
  for (const t of ['s', 'l'])
    for (let i = 0, tries = 0; i < k && tries < 500; tries++) {
      let a = 2 + rand(N - 2), b = 2 + rand(N - 2);
      if (t === 's' ? a < b : a > b) [a, b] = [b, a];
      if (!validate(t, a, b) && Math.abs(a - b) > S.size / 2) { (t === 's' ? S.snakes : S.ladders).push([a, b]); i++; }
    }
}
export function drawBoard(el) {
  const z = S.size; el.style.setProperty('--n', z);
  let h = '', s = '';
  for (let y = 0; y < z; y++) for (let x = 0; x < z; x++) {
    const r = z - 1 - y, n = r * z + (r % 2 ? z - x : x + 1);
    h += `<div class="cell${(x + y) % 2 ? ' alt' : ''}${S.marks.includes(n) ? ' q' : ''}">${n}</div>`;
  }
  for (const [a, b] of S.ladders) {
    const [x1, y1] = mid(a), [x2, y2] = mid(b);
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#8d5524" stroke-width="2.4" stroke-linecap="round"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f1c27d" stroke-width="1.2" stroke-dasharray="1.2 1.6"/>`;
  }
  for (const [a, b] of S.snakes) {
    const [x1, y1] = mid(a), [x2, y2] = mid(b), cx = (x1 + x2) / 2 + (y2 - y1) * .25, cy = (y1 + y2) / 2 - (x2 - x1) * .25;
    s += `<path d="M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}" fill="none" stroke="#15803d" stroke-width="2" stroke-linecap="round"/><circle cx="${x1}" cy="${y1}" r="1.8" fill="#dc2626"/>`;
  }
  el.innerHTML = h + `<svg viewBox="0 0 100 100" preserveAspectRatio="none">${s}</svg><div class="tk"></div>`;
}
// P: array posisi tiap pemain; slow: animasi pelan (untuk ular/tangga).
export function place(el, P, slow) {
  const b = el.querySelector('.tk'), k = S.players.length; b.classList.toggle('slow', !!slow);
  S.players.forEach((p, i) => {
    let t = b.children[i];
    if (!t) { t = document.createElement('span'); t.textContent = p.emoji; t.style.setProperty('--c', COL[i]); b.append(t); }
    const [x, y] = mid(P[i]);
    t.style.left = x + (i - (k - 1) / 2) * 100 / S.size * .25 + '%'; t.style.top = y + '%';
  });
}
