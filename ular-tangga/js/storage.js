// Modul penyimpanan: localStorage (dengan fallback memori), ekspor/impor JSON.
import { S, EMO } from './state.js';
import { SAMPLE } from './sample.js'; // dibuat dari data/contoh-soal.json
const K = 'ulartangga_cfg'; let mem = null;
export function saveLocal() { mem = JSON.stringify(S); try { localStorage.setItem(K, mem); } catch {} }
export function loadLocal() {
  let s = mem; try { s = localStorage.getItem(K) || s; } catch {}
  if (s) try { apply(JSON.parse(s)); } catch {}
}
export async function sample() {
  try { const r = await fetch('./data/contoh-soal.json'); if (r.ok) return await r.json(); } catch {}
  return SAMPLE; // fallback jika fetch gagal
}
export function download(name, text, type = 'application/json') {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href);
}
export const readFile = f => new Promise((ok, no) => { if (!f) return no(Error('Tidak ada file.')); const r = new FileReader(); r.onload = () => { try { ok(JSON.parse(r.result)); } catch { no(Error('File bukan JSON yang valid.')); } }; r.readAsText(f); });
// Saring daftar soal: hanya format valid yang diterima.
export const qs = l => (Array.isArray(l) ? l : []).filter(q => q && typeof q.q === 'string' && Number.isInteger(q.k) && (q.t === 'bs' ? q.k < 2 : Array.isArray(q.o) && q.o.length === 4 && q.k < 4 && q.o.every(x => typeof x === 'string')))
  .map(q => ({ t: q.t === 'bs' ? 'bs' : 'pg', q: q.q.slice(0, 300), o: q.t === 'bs' ? ['Benar', 'Salah'] : q.o.map(x => x.slice(0, 120)), k: q.k, e: String(q.e || '').slice(0, 300) }));
export function apply(o) {
  if (!o || typeof o !== 'object') throw Error('Format konfigurasi tidak valid.');
  const pr = a => Array.isArray(a) && a.length === 2 && a.every(Number.isInteger);
  if (typeof o.title === 'string') S.title = o.title.slice(0, 60);
  if ([5, 6, 8, 10].includes(o.size)) S.size = o.size;
  if (['biru', 'hijau', 'ungu', 'oranye'].includes(o.theme)) S.theme = o.theme;
  const N = S.size * S.size, ok = a => a.every(v => v > 1 && v < N);
  if (Array.isArray(o.players) && o.players.length) S.players = o.players.slice(0, 4).map((p, i) => ({ name: String(p.name || 'Pemain').slice(0, 20), emoji: EMO.includes(p.emoji) ? p.emoji : EMO[i] }));
  if (Array.isArray(o.snakes)) S.snakes = o.snakes.filter(a => pr(a) && ok(a) && a[0] > a[1]);
  if (Array.isArray(o.ladders)) S.ladders = o.ladders.filter(a => pr(a) && ok(a) && a[0] < a[1]);
  if (Array.isArray(o.marks)) S.marks = o.marks.filter(n => Number.isInteger(n) && n > 1 && n < N);
  if (o.questions) S.questions = qs(o.questions);
  const r = o.rules || {}, R = S.rules, num = (v, m) => Math.max(0, Math.min(m, +v || 0));
  if (['every', 'marked', 'finish'].includes(r.when)) R.when = r.when;
  if (['stay', 'back', 'skip'].includes(r.wrong)) R.wrong = r.wrong;
  R.time = num(r.time, 60); R.n = num(r.n, 10); R.bonus = num(r.bonus, 10); R.exact = r.exact !== false;
}
