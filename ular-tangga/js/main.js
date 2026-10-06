// Modul utama: alur permainan (dadu → jalan → soal → ular/tangga) dan layar hasil.
import { S, cells, esc, COL } from './state.js';
import { drawBoard, place } from './board.js';
import { roll, sleep, beep, toggleMute } from './dice.js';
import { pick, ask, opts } from './quiz.js';
import { initEditor } from './editor.js';
import { download, loadLocal } from './storage.js';
const $ = s => document.querySelector(s);
const show = id => document.querySelectorAll('main>section').forEach(s => (s.hidden = s.id !== id));
let G;
loadLocal();
initEditor($('#s-edit'), startGame);

function startGame() {
  const N = cells();
  if (S.rules.when === 'marked' && !S.marks.length) while (S.marks.length < S.size) { const n = 2 + Math.floor(Math.random() * (N - 2)); if (!S.marks.includes(n)) S.marks.push(n); }
  G = { P: S.players.map(() => 1), t: 0, used: [], skip: [], wr: [], busy: false, st: S.players.map(() => ({ ok: 0, no: 0, sn: 0, la: 0 })) };
  document.body.dataset.theme = S.theme;
  $('#s-play').innerHTML = `<header><h1>${esc(S.title)}</h1><div><button id="mute" aria-label="Suara">🔊</button><button id="pause">⏸ Jeda</button><button id="again0">↺ Ulangi</button><button id="back">✎ Editor</button></div></header>
<div class="play"><div id="board" class="board"></div><aside><div id="turn"></div><button id="dice" aria-label="Kocok dadu (tombol Spasi)">🎲</button><p id="msg" aria-live="polite">Klik dadu atau tekan Spasi.</p><ul id="score"></ul></aside></div>`;
  drawBoard($('#board')); place($('#board'), G.P, 0); board(); show('s-play');
  $('#dice').onclick = turn;
  $('#mute').onclick = e => (e.target.textContent = toggleMute() ? '🔇' : '🔊');
  $('#again0').onclick = startGame;
  $('#back').onclick = () => location.reload();
  $('#pause').onclick = () => { const m = $('#modal'); m.innerHTML = '<div class="box"><h2>⏸ Dijeda</h2><button class="go">Lanjut</button></div>'; m.hidden = false; m.querySelector('.go').focus(); m.querySelector('.go').onclick = () => (m.hidden = true); };
}
function board() {
  const p = S.players[G.t];
  $('#turn').innerHTML = `Giliran: <b>${p.emoji} ${esc(p.name)}</b>`;
  $('#score').innerHTML = S.players.map((q, i) => `<li class="${i === G.t ? 'on' : ''}" style="border-color:${COL[i]}">${q.emoji} ${esc(q.name)} — kotak ${G.P[i]} (✔${G.st[i].ok} ✘${G.st[i].no})</li>`).join('');
}
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !$('#s-play').hidden && $('#modal').hidden && !['INPUT', 'SELECT'].includes(e.target.tagName)) { e.preventDefault(); turn(); }
});
async function walk(p, to) { while (G.P[p] !== to) { G.P[p] += Math.sign(to - G.P[p]); place($('#board'), G.P, 0); beep(500, .04); await sleep(160); } }
async function jump(p, to) { G.P[p] = to; place($('#board'), G.P, 1); await sleep(800); }
const next = () => { G.t = (G.t + 1) % S.players.length; G.busy = false; board(); };

async function turn() {
  if (G.busy) return; G.busy = true;
  const p = G.t, N = cells(), me = S.players[p], R = S.rules, msg = t => ($('#msg').textContent = t);
  if (G.skip[p]) { G.skip[p] = 0; msg(`${me.name} kehilangan giliran.`); return next(); }
  if (G.P[p] < N) { // pemain di kotak finish (gagal soal final) tidak mengocok dadu lagi
    const d = await roll($('#dice')), raw = G.P[p] + d;
    const target = raw > N ? (R.exact ? N - (raw - N) : N) : raw;
    msg(`${me.name} mendapat ${d}.`);
    await walk(p, Math.min(raw, N)); await walk(p, target);
  }
  const at = G.P[p], fin = at === N;
  const need = S.questions.length && (R.when === 'every' || fin || (R.when === 'marked' && S.marks.includes(at)));
  let ok = true;
  if (need) {
    const q = pick(G.used);
    ok = await ask(q, me.name, fin ? '🏁 Soal final: jawab benar untuk menang!' : 'Soal untuk kotak ' + at);
    if (ok) G.st[p].ok++; else { G.st[p].no++; G.wr.push({ w: me.name, q: q.q, a: opts(q)[q.k], e: q.e }); }
  }
  if (ok) {
    if (fin) return win(p);
    const l = S.ladders.find(x => x[0] === at), s = S.snakes.find(x => x[0] === at);
    if (l) { G.st[p].la++; msg('🪜 Naik tangga!'); beep(880); await jump(p, l[1]); }
    else if (s) { G.st[p].sn++; msg('🐍 Digigit ular!'); beep(150, .4); await jump(p, s[1]); }
    if (need && R.bonus) { msg(`Bonus +${R.bonus} kotak!`); await walk(p, Math.min(N - 1, G.P[p] + R.bonus)); }
  } else {
    msg('Jawaban salah, ular/tangga tidak berlaku.');
    if (R.wrong === 'back') await jump(p, Math.max(1, at - R.n)); else if (R.wrong === 'skip') G.skip[p] = 1;
  }
  next();
}
function win(p) {
  G.busy = false; beep(880, .5);
  const rank = [...S.players.keys()].sort((a, b) => (b === p) - (a === p) || G.P[b] - G.P[a]);
  const acc = s => (s.ok + s.no ? Math.round(100 * s.ok / (s.ok + s.no)) + '%' : '-');
  $('#s-result').innerHTML = `<h1>🏆 ${esc(S.players[p].name)} menang!</h1>
<table><tr><th>#</th><th>Pemain</th><th>Kotak</th><th>Benar</th><th>Salah</th><th>Akurasi</th><th>Ular</th><th>Tangga</th></tr>
${rank.map((i, r) => { const s = G.st[i]; return `<tr><td>${r + 1}</td><td>${S.players[i].emoji} ${esc(S.players[i].name)}</td><td>${G.P[i]}</td><td>${s.ok}</td><td>${s.no}</td><td>${acc(s)}</td><td>${s.sn}</td><td>${s.la}</td></tr>`; }).join('')}</table>
<h2>Soal yang dijawab salah</h2>${G.wr.length ? '<ul>' + G.wr.map(w => `<li><b>${esc(w.q)}</b> (${esc(w.w)})<br>Kunci: ${esc(w.a)}. ${esc(w.e)}</li>`).join('') + '</ul>' : '<p>Tidak ada. 🎉</p>'}
<button id="r1">Main lagi</button><button id="r2">Ubah pengaturan</button><button id="r3">Unduh hasil (CSV)</button>`;
  show('s-result');
  $('#r1').onclick = startGame; $('#r2').onclick = () => location.reload();
  $('#r3').onclick = () => {
    const c = v => '"' + String(v).replace(/"/g, '""').replace(/^([=+\-@])/, "'$1") + '"';
    const rows = [['Peringkat', 'Pemain', 'Kotak', 'Benar', 'Salah', 'Akurasi', 'Ular', 'Tangga'], ...rank.map((i, r) => { const s = G.st[i]; return [r + 1, S.players[i].name, G.P[i], s.ok, s.no, acc(s), s.sn, s.la]; })];
    download('hasil-ular-tangga.csv', rows.map(r => r.map(c).join(',')).join('\n'), 'text/csv');
  };
}
