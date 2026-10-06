// Modul soal: pilih soal tanpa pengulangan, tampilkan modal, kembalikan benar/salah.
import { S, esc } from './state.js';
import { beep } from './dice.js';
export function pick(used) {
  if (!S.questions.length) return null;
  let idx = S.questions.map((_, i) => i).filter(i => !used.includes(i));
  if (!idx.length) { used.length = 0; idx = S.questions.map((_, i) => i); }
  const k = idx[Math.floor(Math.random() * idx.length)]; used.push(k); return S.questions[k];
}
export const opts = q => (q.t === 'bs' ? ['Benar', 'Salah'] : q.o);
export function ask(q, who, title) {
  return new Promise(res => {
    const m = document.getElementById('modal'), o = opts(q); let left = S.rules.time, tm;
    m.innerHTML = `<div class="box"><h2>${esc(title)}</h2><p><b>${esc(who)}</b></p><p>${esc(q.q)}</p><div class="opts">${o.map((x, i) => `<button data-i="${i}">${'ABCD'[i]}. ${esc(x)}</button>`).join('')}</div><p id="tm"></p><div id="fb"></div></div>`;
    m.hidden = false; m.querySelector('button').focus();
    const done = i => {
      clearInterval(tm); const ok = i === q.k; beep(ok ? 660 : 200, .25);
      m.querySelectorAll('.opts button').forEach(b => { b.disabled = true; if (+b.dataset.i === q.k) b.classList.add('ok'); else if (+b.dataset.i === i) b.classList.add('bad'); });
      m.querySelector('#fb').innerHTML = `<p><b>${ok ? '✅ Benar!' : i < 0 ? '⏰ Waktu habis.' : '❌ Salah.'}</b> Kunci: ${'ABCD'[q.k]}. ${esc(o[q.k])}</p>${q.e ? `<p>${esc(q.e)}</p>` : ''}<button class="go">Lanjut</button>`;
      const g = m.querySelector('.go'); g.focus(); g.onclick = () => { m.hidden = true; res(ok); };
    };
    m.querySelector('.opts').onclick = e => { const b = e.target.closest('button'); if (b && !b.disabled) done(+b.dataset.i); };
    if (left > 0) { const t = m.querySelector('#tm'); t.textContent = `⏱ ${left} dtk`; tm = setInterval(() => { t.textContent = `⏱ ${--left} dtk`; if (left <= 0) done(-1); }, 1000); }
  });
}
