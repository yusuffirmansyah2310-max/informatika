// Modul editor: layar pengaturan (papan, ular/tangga, soal, aturan).
import { S, EMO, esc, cells } from './state.js';
import { validate, randomize } from './board.js';
import { sample, download, readFile, apply, saveLocal, qs } from './storage.js';
const $ = s => document.querySelector(s);
const opt = (l, v) => l.map(x => `<option ${x == v ? 'selected' : ''}>${x}</option>`).join('');
const ov = (l, v) => l.map(([a, b]) => `<option value="${a}" ${a == v ? 'selected' : ''}>${b}</option>`).join('');
export function initEditor(el, start) {
  let pend = null;
  const list = (t, a) => a.map((x, i) => `<div class="row"><span>${x[0]} → ${x[1]}</span><button data-del="${t}${i}" aria-label="Hapus">✕</button></div>`).join('');
  function draw(err = '') {
    const R = S.rules, N = cells(), p = pend || {};
    document.body.dataset.theme = S.theme;
    el.innerHTML = `<h1>🎲 Editor Ular Tangga</h1>
<div class="card"><h2>Umum</h2><div class="grid">
<label>Judul game<input data-k="title" maxlength="60" value="${esc(S.title)}"></label>
<label>Tema<select data-k="theme">${opt(['biru', 'hijau', 'ungu', 'oranye'], S.theme)}</select></label>
<label>Ukuran papan<select data-k="size">${[5, 6, 8, 10].map(z => `<option value="${z}" ${z == S.size ? 'selected' : ''}>${z}x${z}</option>`).join('')}</select></label>
<label>Jumlah pemain<select data-k="np">${opt([1, 2, 3, 4], S.players.length)}</select></label></div>
${S.players.map((q, i) => `<div class="row"><input data-p="${i}" aria-label="Nama pemain ${i + 1}" value="${esc(q.name)}"><select data-e="${i}" aria-label="Emoji pemain ${i + 1}">${opt(EMO, q.emoji)}</select></div>`).join('')}</div>
<div class="card"><h2>🐍 Ular dan 🪜 tangga (kotak 2–${N - 1})</h2><div class="cols">
<div><h3>Ular (kepala → ekor)</h3>${list('s', S.snakes)}<div class="row"><input id="sa" type="number" placeholder="Kepala" aria-label="Kepala ular"><input id="sb" type="number" placeholder="Ekor" aria-label="Ekor ular"><button data-add="s">Tambah</button></div></div>
<div><h3>Tangga (kaki → ujung)</h3>${list('l', S.ladders)}<div class="row"><input id="la" type="number" placeholder="Kaki" aria-label="Kaki tangga"><input id="lb" type="number" placeholder="Ujung" aria-label="Ujung tangga"><button data-add="l">Tambah</button></div></div></div>
<button data-act="rand">🔀 Acak ular dan tangga</button><button data-act="clr">Kosongkan</button><p class="err" role="alert">${esc(err)}</p></div>
<div class="card"><h2>❓ Bank soal (${S.questions.length})</h2><div class="qf">
<select id="qt" aria-label="Tipe soal"><option value="pg" ${p.t != 'bs' ? 'selected' : ''}>Pilihan ganda</option><option value="bs" ${p.t == 'bs' ? 'selected' : ''}>Benar/Salah (kunci A=Benar, B=Salah)</option></select>
<input id="qq" placeholder="Pertanyaan" aria-label="Pertanyaan" value="${esc(p.q)}">
${[0, 1, 2, 3].map(i => `<input class="qo" placeholder="Opsi ${'ABCD'[i]}" aria-label="Opsi ${'ABCD'[i]}" value="${esc(p.t == 'pg' ? p.o[i] : '')}">`).join('')}
<select id="qk" aria-label="Kunci jawaban">${ov([[0, 'A'], [1, 'B'], [2, 'C'], [3, 'D']].map(([a, b]) => [a, 'Kunci: ' + b]), p.k || 0)}</select>
<input id="qe" placeholder="Penjelasan (opsional)" aria-label="Penjelasan" value="${esc(p.e)}">
<button data-act="addq">${pend ? 'Simpan soal' : 'Tambah soal'}</button></div>
${S.questions.map((q, i) => `<div class="row"><span>${i + 1}. ${esc(q.q)}</span><button data-edq="${i}" aria-label="Ubah">✎</button><button data-del="q${i}" aria-label="Hapus">✕</button></div>`).join('')}
<button data-act="sample">📚 Muat contoh soal</button><button data-act="expq">⬇ Ekspor soal (JSON)</button><label class="btn">⬆ Impor soal (JSON)<input type="file" accept=".json" data-imp="q" hidden></label></div>
<div class="card"><h2>⚙ Aturan</h2><div class="grid">
<label>Soal muncul saat<select data-r="when">${ov([['every', 'Setiap mendarat'], ['marked', 'Kotak bertanda ?'], ['finish', 'Hanya saat finish']], R.when)}</select></label>
<label>Kotak ? (pisah koma, kosong = acak)<input data-r="marks" value="${S.marks.join(',')}"></label>
<label>Batas waktu (detik, 0 = tanpa batas)<input type="number" min="0" max="60" data-r="time" value="${R.time}"></label>
<label>Jika jawaban salah<select data-r="wrong">${ov([['stay', 'Tetap di tempat'], ['back', 'Mundur N kotak'], ['skip', 'Kehilangan giliran']], R.wrong)}</select></label>
<label>N kotak mundur<input type="number" min="0" max="10" data-r="n" value="${R.n}"></label>
<label>Bonus jawaban benar (+kotak)<input type="number" min="0" max="10" data-r="bonus" value="${R.bonus}"></label>
<label><input type="checkbox" data-r="exact" ${R.exact ? 'checked' : ''}> Finish harus tepat (mundur jika berlebih)</label></div></div>
<div class="card"><button data-act="savecfg">💾 Simpan konfigurasi (JSON)</button><label class="btn">📂 Muat konfigurasi<input type="file" accept=".json" data-imp="c" hidden></label><br><button class="start" data-act="start">▶ MULAI GAME</button></div>`;
  }
  el.onchange = e => {
    const t = e.target, d = t.dataset;
    if (d.k) {
      if (d.k === 'np') { const n = +t.value; while (S.players.length < n) S.players.push({ name: 'Pemain ' + (S.players.length + 1), emoji: EMO[S.players.length] }); S.players.length = n; }
      else if (d.k === 'size') { S.size = +t.value; S.marks = []; randomize(); }
      else S[d.k] = t.value.slice(0, 60);
    } else if (d.p) S.players[+d.p].name = t.value.slice(0, 20) || 'Pemain';
    else if (d.e) S.players[+d.e].emoji = t.value;
    else if (d.r) {
      const N = cells(), R = S.rules;
      if (d.r === 'marks') S.marks = [...new Set(t.value.split(',').map(Number).filter(n => n > 1 && n < N))];
      else if (d.r === 'exact') R.exact = t.checked;
      else if (d.r === 'when' || d.r === 'wrong') R[d.r] = t.value;
      else R[d.r] = Math.max(0, Math.min(60, +t.value || 0));
    } else if (d.imp) {
      readFile(t.files[0]).then(o => { if (d.imp === 'q') S.questions.push(...qs(Array.isArray(o) ? o : o.questions)); else apply(o); saveLocal(); draw(); }).catch(er => draw(er.message));
      return;
    } else return;
    saveLocal(); draw();
  };
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const d = b.dataset; let err = '';
    if (d.add) {
      const t = d.add, a = +$('#' + t + 'a').value, c = +$('#' + t + 'b').value;
      err = validate(t, a, c); if (!err) (t === 's' ? S.snakes : S.ladders).push([a, c]);
    } else if (d.del) ({ s: S.snakes, l: S.ladders, q: S.questions })[d.del[0]].splice(+d.del.slice(1), 1);
    else if (d.edq) pend = S.questions.splice(+d.edq, 1)[0];
    else if (d.act === 'rand') randomize();
    else if (d.act === 'clr') { S.snakes = []; S.ladders = []; }
    else if (d.act === 'sample') { sample().then(l => { S.questions = qs(l); saveLocal(); draw(); }); return; }
    else if (d.act === 'expq') return download('soal.json', JSON.stringify(S.questions, null, 1));
    else if (d.act === 'savecfg') return download('ular-tangga-config.json', JSON.stringify(S, null, 1));
    else if (d.act === 'start') {
      if (!S.questions.length && !confirm('Bank soal masih kosong. Mulai tanpa pertanyaan?')) return;
      return start();
    } else if (d.act === 'addq') {
      const bs = $('#qt').value === 'bs', q = $('#qq').value.trim(), o = [...document.querySelectorAll('.qo')].map(i => i.value.trim()), k = +$('#qk').value;
      if (!q) err = 'Pertanyaan belum diisi.';
      else if (!bs && o.some(x => !x)) err = 'Keempat opsi harus diisi.';
      else if (bs && k > 1) err = 'Soal Benar/Salah: kunci hanya A atau B.';
      else { S.questions.push({ t: bs ? 'bs' : 'pg', q, o: bs ? ['Benar', 'Salah'] : o, k, e: $('#qe').value.trim() }); pend = null; }
      if (err && pend === null) pend = { t: bs ? 'bs' : 'pg', q, o, k, e: $('#qe').value }; // pertahankan isian saat galat
    }
    saveLocal(); draw(err);
  };
  draw();
}
