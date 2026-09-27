/* モーションレシピ — 技法の小さな動く見本（技法集と、レシピの「選ばれた演出」で使う）
 * CSS は style.css の .d-<id>。ここは中身の HTML だけ。 */
(function (root) {
  "use strict";
  const P = (n) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, d = 44 + (i % 3) * 10;
    return `<i class="p" style="--x:${Math.round(Math.cos(a) * d)}px;--y:${Math.round(Math.sin(a) * d * 0.7)}px;animation-delay:${(i % 4) * 0.08}s;background:${["#e4472f", "#ffc75f", "#1f3668", "#3bb58a"][i % 4]}"></i>`;
  }).join("");
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
  };
  root.MR_DEMOS = DEMO;
})(window);
