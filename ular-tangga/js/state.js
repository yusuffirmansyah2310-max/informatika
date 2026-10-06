// Modul state: satu objek S berisi seluruh konfigurasi game.
export const S = {};
export const EMO = ['🐱','🐶','🦊','🐼','🚀','⭐','🎯','🤖'];
export const COL = ['#e63946','#2a9d8f','#f4a261','#6a4c93'];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';'); // cegah injeksi HTML
export const cells = () => S.size * S.size;
export function reset() {
  Object.assign(S, {
    title: 'Ular Tangga Informatika', theme: 'biru', size: 6,
    players: [0, 1].map(i => ({ name: 'Pemain ' + (i + 1), emoji: EMO[i] })),
    snakes: [[17, 7], [30, 12], [34, 22]], ladders: [[3, 14], [9, 20], [18, 29]],
    marks: [], questions: [],
    rules: { when: 'every', time: 0, wrong: 'stay', n: 2, bonus: 0, exact: true }
  });
}
reset();
