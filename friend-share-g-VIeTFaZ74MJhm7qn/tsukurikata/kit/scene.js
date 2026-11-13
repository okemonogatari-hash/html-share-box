// 絵。すべて時間 t の関数 renderAt(t)。1コマずつ撮るので、乱数や時計に頼らない。
// 方眼の世界（Canvas2D）。立体の箱庭にしたい時は three を入れて同じ renderAt(t) の形で書く（START の §6）。
import { STORY as S } from './story.js';
const cv = document.getElementById('c'), g = cv.getContext('2d');
cv.width = S.w; cv.height = S.h;
const W = S.w, H = S.h, C = S.color;
const FONT = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic UI","Yu Gothic","Meiryo","Noto Sans JP",sans-serif';
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => cl((t - a) / (b - a));
const eOut = x => 1 - Math.pow(1 - x, 3);
const eBack = x => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const dots = Array.from({ length: 70 }, () => [rnd() * W, rnd() * H, rnd()]);
const path = Array.from({ length: 6 }, (_, i) => [260 + i * 280, 640 - Math.sin(i * 1.3) * 160 - i * 30]);

function txt(s, x, y, size, a = 1, color = C.text, weight = 800) {
  g.save(); g.globalAlpha = a; g.fillStyle = color; g.font = `${weight} ${size}px ${FONT}`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 18;
  g.fillText(s, x, y); g.restore();
}
function lines(arr, t, b, y0, size) {           // 1行ずつ下からふわっと
  arr.forEach((s, i) => { const k = eOut(seg(t, b.from + .15 + i * .45, b.from + .75 + i * .45)) * (1 - seg(t, b.to - .35, b.to));
    txt(s, W / 2, y0 + i * size * 1.35 + (1 - k) * 40, size, k); });
}
function bg(t) {
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  const z = 1 + t * .012, ox = (t * 18) % 80;           // ゆっくり寄りながら流れる方眼
  g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
  g.strokeStyle = C.grid; g.lineWidth = 1.2;
  for (let x = -80 + ox; x < W + 80; x += 80) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = -80 + ox * .5; y < H + 80; y += 80) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.restore();
  for (const [x, y, p] of dots) { const yy = (y - t * (20 + p * 40)) % H; g.fillStyle = `rgba(127,209,255,${.15 + p * .35})`;
    g.beginPath(); g.arc(x + Math.sin(t + p * 9) * 12, yy < 0 ? yy + H : yy, 2 + p * 3, 0, 7); g.fill(); }
}
const draw = {
  ask(t, b) { lines(b.text, t, b, H / 2 - 60, 92); },
  draw(t, b) {
    const k = eOut(seg(t, b.from, b.from + 2.2)); const n = (path.length - 1) * k;
    g.save(); g.strokeStyle = C.line; g.lineWidth = 10; g.lineCap = 'round'; g.shadowColor = C.line; g.shadowBlur = 24;
    g.beginPath(); g.moveTo(...path[0]);
    for (let i = 1; i <= Math.ceil(n); i++) { const f = Math.min(1, n - (i - 1)); const [ax, ay] = path[i - 1], [bx, by] = path[i]; g.lineTo(ax + (bx - ax) * f, ay + (by - ay) * f); }
    g.stroke(); g.restore();
    path.forEach(([x, y], i) => { const p = eBack(seg(t, b.from + .9 + i * .3, b.from + 1.3 + i * .3)); if (p <= 0) return;
      g.fillStyle = C.accent; g.beginPath(); g.arc(x, y, 18 * p, 0, 7); g.fill(); });
    lines(b.text, t, b, 230, 84);
  },
  count(t, b) {
    const k = eOut(seg(t, b.from + .2, b.to - .6)); const a = 1 - seg(t, b.to - .35, b.to);
    lines(b.text, t, b, 330, 70);
    txt(String(Math.round(b.n * k)), W / 2, H / 2 + 40, 260, a, C.line, 900);
    txt(b.unit, W / 2, H / 2 + 230, 72, a);
  },
  cards(t, b) {
    b.items.forEach((s, i) => { const p = eBack(seg(t, b.from + i * .6, b.from + .5 + i * .6)) * (1 - seg(t, b.to - .3, b.to));
      if (p <= 0) return; const x = W / 2 + (i - 1) * 560, y = H / 2 + Math.sin(t * 2 + i) * 8;
      g.save(); g.translate(x, y); g.scale(p, p); g.fillStyle = '#ffffff'; g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 30;
      g.beginPath(); g.roundRect(-240, -150, 480, 300, 28); g.fill(); g.restore();
      txt(s, x, y, 64 * p, p, C.bg); });
  },
  end(t, b) {
    const k = eOut(seg(t, b.from, b.from + .8)); g.save(); g.globalAlpha = k * .9; g.fillStyle = C.line;
    g.beginPath(); g.arc(W / 2, H / 2, 900 * k, 0, 7); g.fill(); g.restore();
    txt(b.text[0], W / 2, H / 2 - 40, 120, eOut(seg(t, b.from + .3, b.from + 1)), C.bg, 900);
    txt(b.text[1], W / 2, H / 2 + 100, 60, eOut(seg(t, b.from + .6, b.from + 1.3)), C.bg);
  }
};
window.renderAt = t => { bg(t); for (const b of S.beats) if (t >= b.from && t < b.to + (b.kind === 'end' ? 1 : 0)) draw[b.kind](t, b); };
window.STORY = S; renderAt(0); window.ready = true;
