/* モーションレシピ — 画面 */
(function () {
  "use strict";
  const R = window.MotionRecipe;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------------------------------------------------------------- 小さな動く見本
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
  };
  function card(t, chosen) {
    return `<article class="z-card${chosen ? " chosen" : ""}"><div class="stage d-${t.id}">${DEMO[t.id] || ""}</div><div class="z-text"><p class="z-name">${esc(t.name)}</p><p class="z-en">${esc(t.en)}</p><p class="z-plain">${esc(t.plain)}</p></div></article>`;
  }

  // 見えている見本だけ動かす
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("paused", !e.isIntersecting)), { rootMargin: "80px" }) : null;
  const watch = (root) => io && root.querySelectorAll(".z-card").forEach((c) => { c.classList.add("paused"); io.observe(c); });

  // ---------------------------------------------------------------- 入力パーツ
  const state = { text: "", purpose: "auto", moods: [], seconds: "auto", aspect: "auto", sound: "auto", onscreen: "", adjust: { calm: 0, bold: 0, cute: 0, wild: 0 }, variant: 0 };

  function chips(el, items, key, single) {
    el.innerHTML = items.map(([v, label]) => `<button type="button" class="chip" data-v="${esc(v)}" aria-pressed="${(single ? state[key] === v : state[key].includes(v)) ? "true" : "false"}">${esc(label)}</button>`).join("");
    el.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      const v = b.dataset.v;
      if (single) state[key] = v;
      else state[key] = state[key].includes(v) ? state[key].filter((x) => x !== v) : [...state[key], v];
      el.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(single ? state[key] === c.dataset.v : state[key].includes(c.dataset.v))));
    });
  }
  chips($("f-purpose"), [["auto", "おまかせ"], ...Object.entries(R.PURPOSES).map(([k, p]) => [k, p.label])], "purpose", true);
  chips($("f-moods"), Object.entries(R.MOODS).map(([k, m]) => [k, m.label]), "moods", false);
  chips($("f-seconds"), [["auto", "おまかせ"], ["10", "10秒"], ["15", "15秒"], ["30", "30秒"]], "seconds", true);
  chips($("f-aspect"), [["auto", "おまかせ"], ["16:9", "横 16:9"], ["9:16", "縦 9:16"], ["1:1", "正方形"]], "aspect", true);
  chips($("f-sound"), [["auto", "おまかせ"], ["on", "あり"], ["off", "なし"]], "sound", true);

  $("ideas").innerHTML = R.IDEAS.slice(0, 6).map((s) => `<button type="button" class="chip">${esc(s)}</button>`).join("");
  $("ideas").addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    $("wish").value = b.textContent;
    make(true);
  });
  let ph = 0;
  setInterval(() => { if (!$("wish").value && document.activeElement !== $("wish")) { ph = (ph + 1) % R.IDEAS.length; $("wish").placeholder = "例：" + R.IDEAS[ph]; } }, 3200);

  // ---------------------------------------------------------------- レシピ
  function make(reset) {
    state.text = $("wish").value.trim();
    state.onscreen = $("onscreen").value.trim();
    if (reset) { state.adjust = { calm: 0, bold: 0, cute: 0, wild: 0 }; state.variant = 0; }
    const r = R.build(state);
    render(r);
    if (reset) {
      const sec = $("recipe");
      sec.hidden = false;
      sec.style.animation = "none"; void sec.offsetWidth; sec.style.animation = "";
      sec.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function render(r) {
    $("recipe").hidden = false;
    $("direction").textContent = r.direction;
    const tags = [r.moodLabel, r.purposeLabel, `${r.seconds}秒`, r.aspect === "16:9" ? "横長" : r.aspect === "9:16" ? "縦長" : "正方形", r.sound ? `音あり・${r.bpm}BPM` : "音なし"];
    if (r.onscreen) tags.push(`文字「${r.onscreen}」`);
    $("tags").innerHTML = tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("");
    $("palette").innerHTML = r.palette.map((c) => `<span style="background:${c}" title="${c}"></span>`).join("");
    $("tech-chips").innerHTML = r.techniques.map((t) => `<span class="tech-chip">${esc(t.name)}</span>`).join("");
    $("tech-cards").innerHTML = r.techniques.map((t) => card(t, false)).join("");
    watch($("tech-cards"));
    $("prompt").textContent = r.prompt;
    const a = state.adjust, notes = [];
    for (const k of ["calm", "bold", "cute", "wild"]) if (a[k] > 0) notes.push(`${R.ADJUST_LABELS[k]}×${a[k]}`);
    if (state.variant) notes.push(`別のレシピ ${state.variant}`);
    $("adjust-note").textContent = notes.length ? "調整：" + notes.join("・") : "";
    // 図鑑の中で、今回えらんだ演出に印
    const ids = new Set(r.techniques.map((t) => t.id));
    document.querySelectorAll("#zukan-grid .z-card").forEach((c) => c.classList.toggle("chosen", ids.has(c.dataset.id)));
  }

  $("go").addEventListener("click", () => {
    if (!$("wish").value.trim() && !$("onscreen").value.trim() && !state.moods.length && state.purpose === "auto") {
      $("wish").value = R.IDEAS[Math.floor(Math.random() * R.IDEAS.length)];
    }
    make(true);
  });
  $("omakase").addEventListener("click", () => {
    $("wish").value = "";
    state.purpose = "auto"; state.moods = []; state.seconds = "auto"; state.aspect = "auto"; state.sound = "auto";
    document.querySelectorAll(".more .chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.v === "auto")));
    make(true);
  });
  $("wish").addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) make(true); });

  document.querySelector(".adjust").addEventListener("click", (e) => {
    const b = e.target.closest("[data-adj]");
    if (!b) return;
    const k = b.dataset.adj, a = state.adjust;
    if (k === "variant") state.variant++;
    else {
      a[k]++;
      if (k === "calm") a.bold = 0;
      if (k === "bold") a.calm = 0;
    }
    make(false);
    const d = $("direction");
    d.animate([{ opacity: 0.2, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 380, easing: "cubic-bezier(.22,1,.36,1)" });
  });

  $("show-techs").addEventListener("click", () => {
    const c = $("tech-cards"), open = c.hidden;
    c.hidden = !open;
    $("show-techs").setAttribute("aria-expanded", String(open));
    $("show-techs").textContent = open ? "今回の演出をとじる ▴" : "今回の演出を見る ▾";
  });

  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toast.h);
    toast.h = setTimeout(() => t.classList.remove("on"), 2200);
  }
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
    }
  }
  $("copy").addEventListener("click", async () => {
    await copyText($("prompt").textContent);
    toast("コピーしました。Claude Code に貼ってね");
  });
  $("copy-basic").addEventListener("click", async () => {
    await copyText($("basic").textContent);
    toast("コピーしました。Claude Code に貼ってね");
  });
  document.addEventListener("click", async (e) => {
    const b = e.target.closest(".cmd");
    if (!b) return;
    await copyText(b.dataset.cmd);
    toast(b.dataset.cmd + " をコピーしました");
  });

  // ---------------------------------------------------------------- 図鑑
  const order = ["hero", "trans", "feel", "atmos", "sound"];
  $("zukan-grid").innerHTML = R.TECHNIQUES.slice().sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role)).map((t) => card(t, false).replace('<article class="z-card"', `<article class="z-card" data-id="${t.id}"`)).join("");
  watch($("zukan-grid"));

  // ---------------------------------------------------------------- 作品集
  (window.MOTION_GALLERY ? Promise.resolve(window.MOTION_GALLERY) : fetch("gallery/gallery.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : Promise.reject(r.status))))
    .then((list) => {
      const items = Array.isArray(list) ? list : list.items || [];
      if (!items.length) throw new Error("empty");
      $("gallery-grid").innerHTML = items.map((g, i) => `
        <button class="g-card" data-i="${i}">
          <div class="g-thumb" style="background-image:url('gallery/${esc(g.poster || g.id + ".jpg")}')"></div>
          <div class="g-text">
            <p class="g-title">${esc(g.title)}</p>
            <p class="g-desc">${esc(g.desc || g.hitokoto || "")}</p>
            <div class="g-tags">${(g.techniques || []).slice(0, 4).map((t) => `<span>${esc(t)}</span>`).join("")}</div>
          </div>
        </button>`).join("");
      $("gallery-grid").addEventListener("click", (e) => {
        const b = e.target.closest(".g-card");
        if (!b) return;
        const g = items[+b.dataset.i];
        const v = $("modal-video");
        v.src = "gallery/" + (g.video || g.id + ".mp4");
        v.poster = "gallery/" + (g.poster || g.id + ".jpg");
        $("modal-text").innerHTML = `<b>${esc(g.title)}</b>　${esc(g.desc || g.hitokoto || "")}`;
        $("modal").hidden = false;
        v.play().catch(() => {});
      });
    })
    .catch(() => { $("gallery-grid").innerHTML = `<p class="muted">作品集はただいま準備中です。</p>`; });
  const closeModal = () => { const v = $("modal-video"); v.pause(); v.removeAttribute("src"); v.load(); $("modal").hidden = true; };
  $("modal-close").addEventListener("click", closeModal);
  $("modal").addEventListener("click", (e) => { if (e.target === $("modal")) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("modal").hidden) closeModal(); });

  // ---------------------------------------------------------------- ?q= で開いたら、そのままレシピまで
  const q = new URLSearchParams(location.search).get("q");
  if (q) { $("wish").value = q; make(true); }
})();
