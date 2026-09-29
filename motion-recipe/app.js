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
    $("tech-chips").innerHTML = r.techniques.map((t) => `<a class="tech-chip" href="techniques.html#t-${t.id}" target="_blank" rel="opener">${esc(t.name)}<small>${esc(t.formal)}</small></a>`).join("");
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
    store.set("mr-ref", ref ? JSON.stringify(ref) : ""); // 技法集から戻っても、お手本が消えないように
    $("ref-pill").hidden = !ref;
    if (ref) $("ref-title").textContent = ref.title;
  }
  $("ref-clear").addEventListener("click", () => { setReference(null); toast("お手本を外しました"); });

  // 見本集のさがし方（2026-09-28 おけちゃん「見本集がごちゃついてきたから解説はトグルで開閉しよう」「検索機能やタグがほしいね」）
  // ジャンルは棚の gallery.json の genre、技法は technique_ids（正式名称で見せる）
  const GENRES = { cute: "かわいい", friendly: "親しみ", cool: "かっこいい", art: "アート", practical: "実用", business: "ビジネス" };
  const filt = { q: "", genre: "", tech: "" };
  const norm = (s) => String(s || "").normalize("NFKC").toLowerCase();
  const techName = (id) => (R.TECH[id] ? R.TECH[id].formal : "");
  function haystack(it) {
    const ids = it.technique_ids || [];
    return norm([it.title, it.hitokoto, it.desc, it.by, (it.traits || []).join(" "), (it.techniques || []).join(" "),
      ids.map(techName).join(" "), ids.map((id) => (R.TECH[id] ? R.TECH[id].name : "")).join(" "), GENRES[it.genre] || ""].join(" "));
  }
  function hits(it, useGenre) {
    if (filt.tech && !(it.technique_ids || []).includes(filt.tech)) return false;
    if (useGenre && filt.genre && it.genre !== filt.genre) return false;
    const words = norm(filt.q).split(/\s+/).filter(Boolean);
    if (!words.length) return true;
    const h = it.__h || (it.__h = haystack(it));
    return words.every((w) => h.includes(w));
  }
  const techChips = (it) => (it.technique_ids || []).filter((id) => R.TECH[id]).slice(0, 2) // 主役の2つだけ（残りは「技法で絞る」とお手本の注文書に）
    .map((id) => `<button type="button" class="t-chip${filt.tech === id ? " on" : ""}" data-tech="${esc(id)}" title="この技法の作品だけ見る">${esc(techName(id))}</button>`).join("");

  // サムネの小さなラベル（秒数・縦横）。世界のお手本の「・」区切りと同じ書き方（2026-09-29 Xの作品集から取り入れ案4）
  const ASPECT_LABEL = { "16:9": "横長", "9:16": "縦長", "1:1": "正方形" };
  const thumbMeta = (g) => [g.seconds ? fmtSec(g.seconds) : "", ASPECT_LABEL[g.aspect] || ""].filter(Boolean).join("・");
  // 1本ずつ開けるURL（…/#w-<id>）。X投稿に1作品ずつ貼れるように（同 取り入れ案3）
  const workUrl = (g) => `${baseUrl}#w-${g.id}`;
  // 作るのにかかった時間・直しの回数（同 取り入れ案2）。数字は作品フォルダの PROCESS.md から読めた作品だけ gallery.json の making に入っている
  // 直し＝評価役・外の目・本人から作品への指摘で作り直した回数（自分で見つけて直した分は数えない）
  function makingLine(g) {
    const m = g.making;
    if (!m || !(m.minutes > 0) || !(m.fixes >= 0)) return "";
    return `<p class="g-making" title="${esc(`出どころ：${m.src || "PROCESS.md"}。直し＝評価役・外の目・本人の指摘で作り直した回数`)}">作るのにかかった時間 約${esc(m.minutes)}分・直し${esc(m.fixes)}回</p>`;
  }
  function okCard(g, i) {
    const meta = thumbMeta(g);
    const tags = (g.traits && g.traits.length ? g.traits : g.techniques || []).slice(0, 4);
    const prompt = g.prompt ? `<button type="button" class="btn link small" data-showprompt="${i}">使ったプロンプト</button>
        <div class="g-prompt" id="gp-${i}" hidden><pre>${esc(g.prompt.text)}</pre><p class="fine">${esc(g.prompt.note || "")}</p><button type="button" class="btn chip-btn" data-copyprompt="${i}">このプロンプトをコピー</button></div>` : "";
    const genre = GENRES[g.genre] ? `<button type="button" class="genre-badge g-${esc(g.genre)}" data-genre="${esc(g.genre)}" title="このジャンルの作品だけ見る">${esc(GENRES[g.genre])}</button>` : "";
    return `<article class="g-card" id="w-${esc(g.id)}">
        <button type="button" class="g-thumb${g.aspect && g.aspect !== "16:9" ? " fit" : ""}" data-play="${i}" aria-label="再生：${esc(g.title)}${meta ? `（${esc(meta)}）` : ""}" style="background-image:url('gallery/${esc(g.poster || g.id + ".jpg")}')">${meta ? `<span class="g-meta" aria-hidden="true">${esc(meta)}</span>` : ""}</button>
        <div class="g-text">
          <p class="g-title">${esc(g.title)}</p>
          <div class="g-labels">${genre}${techChips(g)}</div>
          ${makingLine(g)}
          <details class="g-more"><summary>解説を読む</summary>
            <p class="g-desc">${esc(g.hitokoto || g.desc || "")}</p>
            <div class="g-tags">${tags.map((x) => `<span>${esc(x)}</span>`).join("")}</div>
          </details>
          <div class="g-actions"><button type="button" class="btn chip-btn ref-btn" data-ref="ok:${i}">これをお手本に作る</button>${g.ref_url ? `<button type="button" class="btn chip-btn cmp-btn" data-compare="${i}">お手本と並べて見る</button>` : ""}<button type="button" class="btn link small" data-copylink="${i}" title="${esc(workUrl(g))}">この作品のリンクをコピー</button>${prompt}</div>
        </div>
      </article>`;
  }
  function worldCard(w, i) {
    const meta = [w.views ? `${fmtViews(w.views)}表示` : "", w.seconds ? fmtSec(w.seconds) : ""].filter(Boolean).join("・");
    return `<article class="w-card" id="r-${esc(w.id)}">
        <div class="w-head"><span class="w-badge ${w.group === "ai" ? "ai" : "pro"}">${w.group === "ai" ? "AI・コード" : "プロ"}</span><span class="w-meta">${esc(meta)}</span></div>
        <p class="w-title">${esc(w.title)}</p>
        <p class="w-by">${esc(w.by)}${w.date ? `・${esc(w.date)}` : ""}</p>
        <div class="g-labels">${techChips(w)}</div>
        <details class="g-more"><summary>解説を読む</summary>
          <p class="w-desc">${esc(w.hitokoto || "")}</p>
          <div class="g-tags">${(w.traits || []).map((x) => `<span>${esc(x)}</span>`).join("")}</div>
        </details>
        <div class="g-actions"><a class="btn chip-btn" href="${esc(w.url)}" target="_blank" rel="noopener">投稿を見る ↗</a><button type="button" class="btn chip-btn ref-btn" data-ref="w:${i}">これをお手本に作る</button></div>
      </article>`;
  }

  const NONE = `<p class="muted">見つかりませんでした。ことばやタグを変えてみてね。</p>`;
  function renderOk() {
    if (!okItems.length) return;
    $("gallery-grid").innerHTML = okItems.map((g, i) => (hits(g, true) ? okCard(g, i) : "")).join("") || NONE;
  }
  function renderWorld() {
    if (!worldItems.length) return;
    const W2 = window.MOTION_WORLD;
    $("world-grid").innerHTML = (W2.groups || [{ id: "ai" }, { id: "pro" }]).map((grp) => {
      const cards = worldItems.map((w, i) => (w.group === grp.id && hits(w, false) ? worldCard(w, i) : "")).join("");
      return cards ? `<p class="w-group">${esc(grp.label || "")}</p><div class="w-grid">${cards}</div>` : "";
    }).join("") || NONE;
  }
  function renderCount() {
    const world = !$("panel-world").hidden;
    const list = world ? worldItems : okItems;
    const n = list.filter((it) => hits(it, !world)).length;
    const narrowed = filt.q.trim() || filt.tech || (!world && filt.genre);
    $("g-count").textContent = list.length ? (narrowed ? `${list.length}本中 ${n}本` : `${list.length}本`) : "";
    $("g-genres").hidden = world; // ジャンルは「おけもんが作った」の棚だけ
  }
  const renderAll = () => { renderOk(); renderWorld(); renderCount(); };
  function setupFilters() {
    const present = Object.keys(GENRES).filter((k) => okItems.some((g) => g.genre === k));
    $("g-genres").innerHTML = [["", "すべて"], ...present.map((k) => [k, GENRES[k]])]
      .map(([k, label]) => `<button type="button" class="chip g-genre-chip${k ? " g-" + k : ""}" data-genre="${k}" aria-pressed="${filt.genre === k}">${esc(label)}</button>`).join("");
    const count = {};
    [...okItems, ...worldItems].forEach((it) => (it.technique_ids || []).forEach((id) => { if (R.TECH[id]) count[id] = (count[id] || 0) + 1; }));
    $("g-tech").innerHTML = `<option value="">技法で絞る（すべて）</option>` + Object.entries(count).sort((a, b) => b[1] - a[1])
      .map(([id, n]) => `<option value="${esc(id)}">${esc(techName(id))}（${n}）</option>`).join("");
    $("g-tech").value = filt.tech;
  }
  function setGenre(k) {
    filt.genre = k;
    $("g-genres").querySelectorAll("[data-genre]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.genre === k)));
    renderAll();
  }
  function setTech(id) { filt.tech = filt.tech === id ? "" : id; $("g-tech").value = filt.tech; renderAll(); }
  $("g-search").addEventListener("input", () => { filt.q = $("g-search").value; renderAll(); });
  $("g-tech").addEventListener("change", () => { filt.tech = $("g-tech").value; renderAll(); });

  const W = window.MOTION_WORLD;
  if (W && W.items) {
    worldItems = W.items;
    if (W.tip) $("world-tip").innerHTML = `💡 ${esc(W.tip.text)}（<a href="${esc(W.tip.url)}" target="_blank" rel="noopener">${esc(W.tip.by)}</a>）`;
    renderWorld();
    if (W.more) $("world-more").innerHTML = `<a href="${esc(W.more.url)}" target="_blank" rel="noopener">${esc(W.more.label)} ↗</a>`;
  } else {
    $("world-grid").innerHTML = `<p class="muted">世界のお手本はただいま準備中です。</p>`;
  }

  (window.MOTION_GALLERY ? Promise.resolve(window.MOTION_GALLERY) : fetch("gallery/gallery.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : Promise.reject(r.status))))
    .then((list) => {
      okItems = Array.isArray(list) ? list : list.items || [];
      if (!okItems.length) throw new Error("empty");
      setupFilters();
      renderAll();
      openFromHash();
    })
    .catch(() => { $("gallery-grid").innerHTML = `<p class="muted">作品集はただいま準備中です。</p>`; });

  function openWork(i) {
    const g = okItems[i];
    const v = $("modal-video");
    v.muted = false;
    v.src = "gallery/" + (g.video || g.id + ".mp4");
    v.poster = "gallery/" + (g.poster || g.id + ".jpg");
    $("modal-text").innerHTML = `<b>${esc(g.title)}</b>　${esc(g.hitokoto || g.desc || "")}`;
    $("modal").hidden = false;
    // リンクから来た時は音つき自動再生が止められることがあるので、その時は消音で動かす（音はプレーヤーで戻せる）
    v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
  }
  function clearFilters() {
    filt.q = ""; filt.genre = ""; filt.tech = "";
    $("g-search").value = ""; $("g-tech").value = "";
    $("g-genres").querySelectorAll("[data-genre]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.genre === "")));
  }

  // お手本と並べて見る（2026-09-29 Xの作品集から取り入れ案1）。左にお手本の元の投稿（X の埋め込み）、右におけもん版。スマホでは上下
  // お手本の動画ファイルは他の人の作品なので棚に置かない。埋め込みが読めない時も、元の投稿へのリンクは見えたまま
  let cmpToken = 0, xLoader = null;
  function loadX() {
    if (window.twttr && window.twttr.widgets && window.twttr.widgets.createTweet) return Promise.resolve(window.twttr);
    if (!xLoader) {
      xLoader = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://platform.twitter.com/widgets.js"; s.async = true; s.charset = "utf-8";
        s.onload = () => (window.twttr && window.twttr.widgets ? resolve(window.twttr) : reject(new Error("no widgets")));
        s.onerror = () => { xLoader = null; reject(new Error("load")); };
        document.head.appendChild(s);
      });
    }
    return xLoader;
  }
  function openCompare(i) {
    const g = okItems[i];
    const wi = worldItems.findIndex((w) => w.id === g.ref_world_id);
    const w = worldItems[wi] || {};
    const tok = ++cmpToken;
    $("cmp-ref-cap").innerHTML = `<span>お手本</span>${esc(w.by || "元の投稿")}${w.title ? `「${esc(w.title)}」` : ""}`;
    $("cmp-ok-cap").innerHTML = `<span class="ok">おけもん版</span>${esc(g.title)}`;
    const box = $("cmp-embed");
    box.classList.remove("loaded");
    box.innerHTML = `<a class="cmp-fallback" href="${esc(g.ref_url)}" target="_blank" rel="noopener">X で元の投稿を見る ↗<small>${esc(g.ref_url)}</small></a><p class="cmp-status" id="cmp-status">X の投稿を読み込んでいます…</p>`;
    $("cmp-open").href = g.ref_url;
    $("cmp-world").hidden = wi < 0;
    $("cmp-world").dataset.wi = String(wi);
    const v = $("cmp-video");
    v.muted = true;
    v.src = "gallery/" + (g.video || g.id + ".mp4");
    v.poster = "gallery/" + (g.poster || g.id + ".jpg");
    $("cmp").hidden = false;
    $("cmp-close").focus({ preventScroll: true });
    v.play().catch(() => {});
    const fail = () => { const s = $("cmp-status"); if (tok === cmpToken && s) s.textContent = "埋め込みを読み込めませんでした。上のリンクから X で見られます"; };
    const id = (/\/status\/(\d+)/.exec(g.ref_url) || [])[1];
    if (!id) { fail(); return; }
    const timer = setTimeout(fail, 10000);
    loadX()
      .then((tw) => tw.widgets.createTweet(id, box, { dnt: true, conversation: "none", align: "center", lang: "ja" }))
      .then((el) => {
        clearTimeout(timer);
        if (tok !== cmpToken) { if (el) el.remove(); return; }
        if (el) box.classList.add("loaded"); else fail();
      })
      .catch(() => { clearTimeout(timer); fail(); });
  }
  function closeCompare() {
    cmpToken++;
    const v = $("cmp-video"); v.pause(); v.removeAttribute("src"); v.load();
    $("cmp-embed").innerHTML = ""; // 埋め込みの動画も止める
    $("cmp").hidden = true;
  }
  $("cmp-close").addEventListener("click", closeCompare);
  $("cmp").addEventListener("click", (e) => { if (e.target === $("cmp")) closeCompare(); });
  $("cmp-world").addEventListener("click", () => {
    const w = worldItems[+$("cmp-world").dataset.wi];
    closeCompare();
    if (!w) return;
    if (!hits(w, false)) clearFilters();
    selectTab("world");
    renderAll();
    const card = document.getElementById("r-" + w.id);
    if (card) { card.scrollIntoView({ block: "center" }); card.classList.add("flash"); setTimeout(() => card.classList.remove("flash"), 2400); }
  });

  // #w-<id> で開いた時：その作品までスクロールして再生。絞り込みで隠れていたら絞り込みを解く
  function openFromHash() {
    const m = /^#w-(.+)$/.exec(location.hash);
    if (!m || !okItems.length) return;
    const id = decodeURIComponent(m[1]);
    const i = okItems.findIndex((g) => g.id === id);
    if (i < 0) { toast("その作品は棚に見つかりませんでした"); return; }
    if (!hits(okItems[i], true)) clearFilters();
    selectTab("okemon");
    renderAll();
    const card = document.getElementById("w-" + id);
    if (card) card.scrollIntoView({ block: "center" });
    openWork(i);
  }
  window.addEventListener("hashchange", openFromHash);

  $("gallery").addEventListener("click", async (e) => {
    const tb = e.target.closest("[data-tech]");
    if (tb) { setTech(tb.dataset.tech); return; }
    const gb = e.target.closest("[data-genre]");
    if (gb) { setGenre(gb.dataset.genre); return; }
    const play = e.target.closest("[data-play]");
    if (play) { openWork(+play.dataset.play); return; }
    const cmp = e.target.closest("[data-compare]");
    if (cmp) { openCompare(+cmp.dataset.compare); return; }
    const cl = e.target.closest("[data-copylink]");
    if (cl) { await copyText(workUrl(okItems[+cl.dataset.copylink])); toast("この作品のリンクをコピーしました。Xにそのまま貼れます"); return; }
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
        sound: it.sound, aspect: it.aspect,
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
    renderCount();
  }
  $("tab-okemon").addEventListener("click", () => selectTab("okemon"));
  $("tab-world").addEventListener("click", () => selectTab("world"));
  if (location.hash === "#world") { selectTab("world"); setTimeout(() => $("gallery").scrollIntoView({ block: "start" }), 300); }

  const closeModal = () => { const v = $("modal-video"); v.pause(); v.removeAttribute("src"); v.load(); $("modal").hidden = true; };
  $("modal-close").addEventListener("click", closeModal);
  $("modal").addEventListener("click", (e) => { if (e.target === $("modal")) closeModal(); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!$("modal").hidden) closeModal();
    if (!$("cmp").hidden) closeCompare();
  });

  // ---------------------------------------------------------------- ?q= で開いたら、そのままレシピまで
  const params = new URLSearchParams(location.search);
  const q = params.get("q"), add = params.get("add");
  if (q) { $("wish").value = q; make(true); }
  else {
    const w = store.get("mr-wish"), o = store.get("mr-onscreen");
    if (w) $("wish").value = w;
    if (o) $("onscreen").value = o;
    try { const saved = store.get("mr-ref"); if (saved) setReference(JSON.parse(saved)); } catch (e) { /* 読めなければお手本なしで始める */ }
    if (add) setTimeout(() => addWord(add), 300);
  }
  // 技法集のタブ（このページから開いたもの）の「この言葉で作る」：元のタブに言葉を足し、レシピを作ってあれば作り直す。お手本と調整はそのまま
  window.MR_addWord = (word) => { addWord(word); if (!$("recipe").hidden) make(false); };
})();
