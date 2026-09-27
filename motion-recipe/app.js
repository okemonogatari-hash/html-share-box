/* モーションレシピ — 画面 */
(function () {
  "use strict";
  const R = window.MotionRecipe;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------------------------------------------------------------- 入力パーツ
  const state = { text: "", purpose: "auto", moods: [], seconds: "auto", aspect: "auto", sound: "auto", onscreen: "", adjust: { calm: 0, bold: 0, cute: 0, wild: 0 }, variant: 0, last: "", reference: null };
  // 書きかけの言葉は、この端末のこのブラウザにだけ残す（読み直しで消えないように）
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 保存できなくても動く */ } },
  };
  const randomIdea = () => R.IDEAS[Math.floor(Math.random() * R.IDEAS.length)];

  function chips(el, items, key, single, max) {
    el.innerHTML = items.map(([v, label]) => `<button type="button" class="chip" data-v="${esc(v)}" aria-pressed="${(single ? state[key] === v : state[key].includes(v)) ? "true" : "false"}">${esc(label)}</button>`).join("");
    el.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      const v = b.dataset.v;
      if (single) state[key] = v;
      else if (state[key].includes(v)) state[key] = state[key].filter((x) => x !== v);
      else state[key] = [...state[key], v].slice(-(max || 99)); // 上限を超えたら古いほうを外す
      el.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(single ? state[key] === c.dataset.v : state[key].includes(c.dataset.v))));
    });
  }
  chips($("f-purpose"), [["auto", "おまかせ"], ...Object.entries(R.PURPOSES).filter(([, p]) => !p.hidden).map(([k, p]) => [k, p.label])], "purpose", true);
  chips($("f-moods"), R.MOOD_KEYS.map((k) => [k, R.MOODS[k].label]), "moods", false, 2);
  chips($("f-seconds"), [["auto", "おまかせ"], ["10", "10秒"], ["15", "15秒"], ["30", "30秒"]], "seconds", true);
  chips($("f-aspect"), [["auto", "おまかせ"], ["16:9", "横 16:9"], ["9:16", "縦 9:16"], ["1:1", "正方形"]], "aspect", true);
  chips($("f-sound"), [["auto", "おまかせ"], ["on", "あり"], ["off", "なし"]], "sound", true);

  $("ideas").innerHTML = R.IDEAS.slice(0, 6).map((s) => `<button type="button" class="chip">${esc(s)}</button>`).join("");
  $("ideas").addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    $("wish").value = b.textContent;
    store.set("mr-wish", b.textContent);
    make(true);
  });
  let ph = 0;
  setInterval(() => { if (!$("wish").value && document.activeElement !== $("wish")) { ph = (ph + 1) % R.IDEAS.length; $("wish").placeholder = "例：" + R.IDEAS[ph]; } }, 3200);

  // ---------------------------------------------------------------- レシピ
  let lastResult = null;
  function whatChanged(a, b) {
    const out = [];
    const added = b.techniques.filter((t) => !a.techniques.includes(t)).map((t) => t.name);
    const removed = a.techniques.filter((t) => !b.techniques.includes(t)).map((t) => t.name);
    if (added.length) out.push(`演出（${removed.length ? removed.join("・") + " → " : "＋"}${added.join("・")}）`);
    if (a.palette.join() !== b.palette.join()) out.push("色");
    if (b.sound && a.bpm !== b.bpm) out.push(`テンポ ${a.bpm}→${b.bpm}`);
    return out.length ? "変えたところ：" + out.join("・") : "変えたところ：なし";
  }
  function make(reset) {
    state.text = $("wish").value.trim();
    state.onscreen = $("onscreen").value.trim();
    if (reset) { state.adjust = { calm: 0, bold: 0, cute: 0, wild: 0 }; state.variant = 0; state.last = ""; }
    const r = R.build(state);
    const changes = !reset && lastResult ? whatChanged(lastResult, r) : "";
    lastResult = r;
    render(r, changes);
    if (reset) {
      const sec = $("recipe");
      sec.hidden = false;
      sec.style.animation = "none"; void sec.offsetWidth; sec.style.animation = "";
      sec.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function render(r, changes) {
    $("recipe").hidden = false;
    $("direction").textContent = r.direction;
    const tags = [r.moodLabel, r.purposeLabel];
    if (r.sceneLabel) tags.push(`${r.sceneLabel}の色`);
    tags.push(`${r.seconds}秒`, r.aspect === "16:9" ? "横長" : r.aspect === "9:16" ? "縦長" : "正方形", r.sound ? `音あり・${r.bpm}BPM` : "音なし");
    if (r.onscreen.length) tags.push(`文字「${r.onscreen.join("」「")}」`);
    if (r.reference) tags.unshift(`お手本：${r.reference.title}`);
    $("tags").innerHTML = tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("");
    $("palette").innerHTML = r.palette.map((c) => `<span style="background:${c}" title="${c}"></span>`).join("");
    $("tech-chips").innerHTML = r.techniques.map((t) => `<a class="tech-chip" href="techniques.html#t-${t.id}" target="_blank" rel="noopener">${esc(t.name)}</a>`).join("");
    $("prompt").textContent = r.prompt;
    const a = state.adjust, notes = [];
    for (const k of ["calm", "bold", "cute", "wild"]) if (a[k] > 0) notes.push(`${R.ADJUST_LABELS[k]}×${a[k]}`);
    if (state.variant) notes.push(`別のレシピ ${state.variant}`);
    $("adjust-note").innerHTML = [notes.length ? "調整：" + notes.join("・") : "", changes || ""].filter(Boolean).map(esc).join("<br />");
  }

  $("go").addEventListener("click", () => {
    const empty = !$("wish").value.trim() && !$("onscreen").value.trim() && !state.moods.length && state.purpose === "auto";
    if (empty) { $("wish").value = randomIdea(); store.set("mr-wish", $("wish").value); }
    make(true);
    if (empty) toast("例から1つ選んで作りました");
  });
  // おまかせ：書いた言葉は消さない。こだわり（用途・雰囲気・長さ・画面・音）だけを、おまかせに戻す
  $("omakase").addEventListener("click", () => {
    const had = $("wish").value.trim();
    state.purpose = "auto"; state.moods = []; state.seconds = "auto"; state.aspect = "auto"; state.sound = "auto";
    document.querySelectorAll(".more .chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.v === "auto")));
    if (!had) { $("wish").value = randomIdea(); store.set("mr-wish", $("wish").value); }
    make(true);
    toast(had ? "書いた言葉はそのまま、こだわりをおまかせにしました" : "例から1つ選んで作りました");
  });
  $("wish").addEventListener("input", () => store.set("mr-wish", $("wish").value));
  $("onscreen").addEventListener("input", () => store.set("mr-onscreen", $("onscreen").value));
  $("wish").addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) make(true); });

  document.querySelector(".adjust").addEventListener("click", (e) => {
    const b = e.target.closest("[data-adj]");
    if (!b) return;
    const k = b.dataset.adj, a = state.adjust;
    if (k === "variant") { state.variant++; state.last = ""; }
    else {
      a[k]++;
      if (k === "calm") a.bold = 0;
      if (k === "bold") a.calm = 0;
      state.last = k;
    }
    make(false);
    const d = $("direction");
    d.animate([{ opacity: 0.2, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 380, easing: "cubic-bezier(.22,1,.36,1)" });
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

  // 技法集（techniques.html）の「この言葉で作る」から来た時：その言葉を入力欄に足す
  function addWord(word) {
    const w = $("wish"), cur = w.value.trim();
    if (!cur.includes(word)) w.value = cur ? `${cur.replace(/[。、,.\s]+$/, "")}、${word}` : word;
    store.set("mr-wish", w.value);
    $("make").scrollIntoView({ behavior: "smooth", block: "start" });
    toast(`「${word}」を入れました`);
  }

  // ---------------------------------------------------------------- 作品集（おけもんが作った／世界のお手本）
  const fmtViews = (n) => (n >= 10000 ? `${Math.round(n / 1000) / 10}万` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}千` : String(n));
  const fmtSec = (s) => (s >= 60 ? `${Math.floor(s / 60)}分${s % 60 ? (s % 60) + "秒" : ""}` : `${s}秒`);
  let okItems = [], worldItems = [];
  const baseUrl = location.href.split("#")[0].split("?")[0].replace(/[^/]*$/, "");

  function setReference(ref) {
    state.reference = ref;
    $("ref-pill").hidden = !ref;
    if (ref) $("ref-title").textContent = ref.title;
  }
  $("ref-clear").addEventListener("click", () => { setReference(null); toast("お手本を外しました"); });

  function okCard(g, i) {
    const tags = (g.traits && g.traits.length ? g.traits : g.techniques || []).slice(0, 4);
    const prompt = g.prompt ? `<button type="button" class="btn link small" data-showprompt="${i}">使ったプロンプト</button>
        <div class="g-prompt" id="gp-${i}" hidden><pre>${esc(g.prompt.text)}</pre><p class="fine">${esc(g.prompt.note || "")}</p><button type="button" class="btn chip-btn" data-copyprompt="${i}">このプロンプトをコピー</button></div>` : "";
    return `<article class="g-card">
        <button type="button" class="g-thumb" data-play="${i}" aria-label="再生：${esc(g.title)}" style="background-image:url('gallery/${esc(g.poster || g.id + ".jpg")}')"></button>
        <div class="g-text">
          <p class="g-title">${esc(g.title)}</p>
          <p class="g-desc">${esc(g.hitokoto || g.desc || "")}</p>
          <div class="g-tags">${tags.map((x) => `<span>${esc(x)}</span>`).join("")}</div>
          <div class="g-actions"><button type="button" class="btn chip-btn ref-btn" data-ref="ok:${i}">これをお手本に作る</button>${prompt}</div>
        </div>
      </article>`;
  }
  function worldCard(w, i) {
    const meta = [w.views ? `${fmtViews(w.views)}表示` : "", w.seconds ? fmtSec(w.seconds) : ""].filter(Boolean).join("・");
    return `<article class="w-card">
        <div class="w-head"><span class="w-badge ${w.group === "ai" ? "ai" : "pro"}">${w.group === "ai" ? "AI・コード" : "プロ"}</span><span class="w-meta">${esc(meta)}</span></div>
        <p class="w-title">${esc(w.title)}</p>
        <p class="w-by">${esc(w.by)}${w.date ? `・${esc(w.date)}` : ""}</p>
        <p class="w-desc">${esc(w.hitokoto || "")}</p>
        <div class="g-tags">${(w.traits || []).map((x) => `<span>${esc(x)}</span>`).join("")}</div>
        <div class="g-actions"><a class="btn chip-btn" href="${esc(w.url)}" target="_blank" rel="noopener">投稿を見る ↗</a><button type="button" class="btn chip-btn ref-btn" data-ref="w:${i}">これをお手本に作る</button></div>
      </article>`;
  }

  (window.MOTION_GALLERY ? Promise.resolve(window.MOTION_GALLERY) : fetch("gallery/gallery.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : Promise.reject(r.status))))
    .then((list) => {
      okItems = Array.isArray(list) ? list : list.items || [];
      if (!okItems.length) throw new Error("empty");
      $("gallery-grid").innerHTML = okItems.map(okCard).join("");
    })
    .catch(() => { $("gallery-grid").innerHTML = `<p class="muted">作品集はただいま準備中です。</p>`; });

  const W = window.MOTION_WORLD;
  if (W && W.items) {
    worldItems = W.items;
    if (W.tip) $("world-tip").innerHTML = `💡 ${esc(W.tip.text)}（<a href="${esc(W.tip.url)}" target="_blank" rel="noopener">${esc(W.tip.by)}</a>）`;
    $("world-grid").innerHTML = (W.groups || [{ id: "ai" }, { id: "pro" }]).map((grp) => {
      const cards = worldItems.map((w, i) => (w.group === grp.id ? worldCard(w, i) : "")).join("");
      return cards ? `<p class="w-group">${esc(grp.label || "")}</p><div class="w-grid">${cards}</div>` : "";
    }).join("");
    if (W.more) $("world-more").innerHTML = `<a href="${esc(W.more.url)}" target="_blank" rel="noopener">${esc(W.more.label)} ↗</a>`;
  } else {
    $("world-grid").innerHTML = `<p class="muted">世界のお手本はただいま準備中です。</p>`;
  }

  $("gallery").addEventListener("click", async (e) => {
    const play = e.target.closest("[data-play]");
    if (play) {
      const g = okItems[+play.dataset.play];
      const v = $("modal-video");
      v.src = "gallery/" + (g.video || g.id + ".mp4");
      v.poster = "gallery/" + (g.poster || g.id + ".jpg");
      $("modal-text").innerHTML = `<b>${esc(g.title)}</b>　${esc(g.hitokoto || g.desc || "")}`;
      $("modal").hidden = false;
      v.play().catch(() => {});
      return;
    }
    const sp = e.target.closest("[data-showprompt]");
    if (sp) { const box = $("gp-" + sp.dataset.showprompt); box.hidden = !box.hidden; return; }
    const cp = e.target.closest("[data-copyprompt]");
    if (cp) { await copyText(okItems[+cp.dataset.copyprompt].prompt.text); toast("プロンプトをコピーしました。Claude Code に貼ってね"); return; }
    const rb = e.target.closest("[data-ref]");
    if (rb) {
      const [kind, idx] = rb.dataset.ref.split(":");
      const it = kind === "ok" ? okItems[+idx] : worldItems[+idx];
      setReference({
        title: it.title,
        by: kind === "ok" ? "おけもん" : it.by,
        url: kind === "ok" ? baseUrl + "gallery/" + (it.video || it.id + ".mp4") : it.url,
        traits: it.traits || [], technique_ids: it.technique_ids || [], moods: it.moods || [],
      });
      $("make").scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => $("wish").focus({ preventScroll: true }), 400);
      toast("お手本をセットしました。作りたいものを書いて「レシピを作る」");
    }
  });

  // タブ
  function selectTab(which) {
    const world = which === "world";
    $("tab-okemon").setAttribute("aria-selected", String(!world));
    $("tab-world").setAttribute("aria-selected", String(world));
    $("panel-okemon").hidden = world;
    $("panel-world").hidden = !world;
  }
  $("tab-okemon").addEventListener("click", () => selectTab("okemon"));
  $("tab-world").addEventListener("click", () => selectTab("world"));
  if (location.hash === "#world") { selectTab("world"); setTimeout(() => $("gallery").scrollIntoView({ block: "start" }), 300); }

  const closeModal = () => { const v = $("modal-video"); v.pause(); v.removeAttribute("src"); v.load(); $("modal").hidden = true; };
  $("modal-close").addEventListener("click", closeModal);
  $("modal").addEventListener("click", (e) => { if (e.target === $("modal")) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("modal").hidden) closeModal(); });

  // ---------------------------------------------------------------- ?q= で開いたら、そのままレシピまで
  const params = new URLSearchParams(location.search);
  const q = params.get("q"), add = params.get("add");
  if (q) { $("wish").value = q; make(true); }
  else {
    const w = store.get("mr-wish"), o = store.get("mr-onscreen");
    if (w) $("wish").value = w;
    if (o) $("onscreen").value = o;
    if (add) setTimeout(() => addWord(add), 300);
  }
})();
