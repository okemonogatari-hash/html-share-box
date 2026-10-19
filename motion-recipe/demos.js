/* モーションレシピ — 技法の小さな動く見本（技法集と、レシピの「選ばれた演出」で使う）
 * CSS は style.css の .d-<id>。ここは中身の HTML だけ。 */
(function (root) {
  "use strict";
  const P = (n) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, d = 44 + (i % 3) * 10;
    return `<i class="p" style="--x:${Math.round(Math.cos(a) * d)}px;--y:${Math.round(Math.sin(a) * d * 0.7)}px;animation-delay:${(i % 4) * 0.08}s;background:${["#e4472f", "#ffc75f", "#1f3668", "#3bb58a"][i % 4]}"></i>`;
  }).join("");
  // 2026-10-19 世界に追いつく班の見本で使う部品
  const ASCII = (() => {
    const rows = [];
    for (let y = 0; y < 11; y++) {
      let r = "";
      for (let x = 0; x < 30; x++) {
        const d = Math.hypot((x - 14.5) / 2.1, (y - 5) / 1);
        r += d < 3.2 ? "@" : d < 4.2 ? "#" : d < 5 ? "+" : (x + y) % 3 ? "." : " ";
      }
      rows.push(r);
    }
    return rows.join("\n");
  })();
  const TILES = Array.from({ length: 49 }, (_, i) => {
    const x = i % 7, y = Math.floor(i / 7), on = Math.hypot(x - 3, y - 3) < 3.3;
    const a = (i * 137.5) * Math.PI / 180, r = 70 + (i % 5) * 14;
    return `<i style="--x:${(x - 3) * 11}px;--y:${(y - 3) * 11}px;--sx:${Math.round(Math.cos(a) * r)}px;--sy:${Math.round(Math.sin(a) * r * 0.6)}px;animation-delay:${((i * 7) % 10) * 0.04}s;background:${on ? ["#e4472f", "#ffc75f", "#1f3668"][i % 3] : "transparent"}"></i>`;
  }).join("");
  const DIGITS = `<span>${"0123456789".split("").join("<br>")}</span>`;
  const DEMO = {
    kinetic: `<div class="mid"><span>う</span><span>ご</span><span>く</span></div>`,
    semantic: `<div class="row r1">ゆっくり</div><div class="row r2">はやく</div>`,
    morph: `<div class="mid"></div>`,
    line: `<svg viewBox="0 0 220 112" preserveAspectRatio="xMidYMid meet"><path d="M20 70 C 50 10, 80 10, 100 56 S 150 104, 200 40" /></svg>`,
    brush: `<svg viewBox="0 0 220 112" preserveAspectRatio="xMidYMid meet"><path class="s1" d="M70 42 L150 38" /><path class="s2" d="M110 16 L110 100" /><path class="s3" d="M108 44 Q 92 78 66 94" /></svg>`,
    particles: P(12),
    pattern: `<div class="pat"></div>`,
    camera3d: `<div class="scene"><div class="gate"></div><div class="gate"></div><div class="gate"></div><div class="gate"></div></div>`,
    infographic: `<div class="bars"><i style="height:40%"></i><i style="height:65%"></i><i style="height:50%"></i><i style="height:92%"></i></div><div class="num"></div>`,
    ui: `<div class="phone"><i></i><i></i><b></b></div>`,
    collage: `<i class="pp"></i><i class="pp"></i><i class="pp"></i>`,
    liquid: `<div class="goo"><i></i><i></i></div>`,
    geometric: `<i class="sh"></i><i class="sh"></i><i class="sh"></i>`,
    matchcut: `<i class="fill"></i>`,
    maskreveal: `<div class="mid">新登場</div>`,
    colorwipe: `<i class="pn"></i><i class="pn"></i><i class="pn"></i>`,
    parallax: `<i class="ly l1"></i><i class="ly l2"></i><i class="ly l3"></i>`,
    slowzoom: `<i class="ph"></i>`,
    squash: `<i class="floor"></i><i class="ball"></i>`,
    spring: `<i class="box"></i>`,
    stagger: `<div class="bs"><i></i><i></i><i></i><i></i><i></i><i></i></div>`,
    anticipation: `<i class="ball"></i>`,
    hold: `<i class="dot"></i>`,
    breathing: `<i class="c"></i>`,
    lightsweep: `<div class="plate">GOLD</div>`,
    glitch: `<div class="mid" data-t="FUTURE">FUTURE</div>`,
    texture: `<i class="tx"></i><div class="mid">和紙</div>`,
    beatsync: `<div class="eq"><i></i><i></i><i></i><i></i><i></i></div>`,
    softsound: `<div class="eq"><i></i><i></i><i></i><i></i><i></i></div>`,
    // 2026-10-19 世界に追いつく班
    ascii: `<pre class="grid">${ASCII}</pre><i class="solid"></i><i class="band"></i>`,
    cursor: `<div class="win"><i class="ln l1"></i><i class="btn"></i><i class="ans a1"></i><i class="ans a2"></i><i class="ans a3"></i></div><i class="ptr"></i>`,
    counter: `<div class="flaps"><b class="f1">${DIGITS}</b><b class="f2">${DIGITS}</b><b class="f3">${DIGITS}</b></div>`,
    extrude3d: `<div class="mid"><span>3</span><span>D</span></div>`,
    assemble: `<div class="tiles">${TILES}</div>`,
    varfont: `<div class="mid" lang="en"><span>W</span><span>A</span><span>V</span><span>E</span></div>`,
    tornpaper: `<i class="under">B</i><i class="half h1"></i><i class="half h2"></i>`,
    velocitycut: `<div class="strip"><i class="pa">A</i><i class="pb">B</i></div>`,
    camerafocus: `<i class="bk k1"></i><i class="bk k2"></i><i class="far"></i><i class="near"></i>`,
    typematch: `<div class="mid"><span class="w1">つくる</span><span class="w2">とどける</span></div>`,
    boil: `<div class="mid">ここ！</div><svg viewBox="0 0 220 112" preserveAspectRatio="xMidYMid meet"><path d="M62 58 C 60 30, 160 24, 164 54 C 168 84, 70 92, 58 64 C 54 52, 80 34, 120 32" /></svg>`,
    liquidglass: `<i class="blob b1"></i><i class="blob b2"></i><i class="blob b3"></i><div class="glass"><b>98</b></div>`,
    shaderorb: `<i class="orb"></i><i class="sheen"></i>`,
    mvhud: `<i class="subj"></i><i class="fill"></i><i class="scan"></i><i class="cn c1"></i><i class="cn c2"></i><i class="cn c3"></i><i class="cn c4"></i><b class="tag">OBJ 0.98</b>`,
    beatscore: `<div class="bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><i class="head"></i><b class="lbl">120BPM・2小節</b>`,
  };
  root.MR_DEMOS = DEMO;
})(window);
