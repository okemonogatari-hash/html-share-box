/* 技法集（教科書） — recipe.js の TECHNIQUES を章ごとに並べる */
(function () {
  "use strict";
  const R = window.MotionRecipe, DEMO = window.MR_DEMOS || {};
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const CHAPTERS = [
    { role: "hero", title: "主役の見せ方", lead: "1本の中心になる見せ方。ここから1つ選ぶと、作品の顔が決まります。" },
    { role: "trans", title: "場面のつなぎ", lead: "場面から場面へ、どう移るか。つなぎがなめらかだと、1本の作品に見えます。" },
    { role: "feel", title: "動きの気持ちよさ", lead: "同じ距離を動いても、速さの変化と止め方で、見た人の気持ちが変わります。" },
    { role: "atmos", title: "空気と光", lead: "画面の手ざわりと光。少し足すだけで、質感がぐっと上がります。" },
    { role: "sound", title: "音", lead: "音と動きが同じ瞬間に合うと、気持ちよさが何倍にもなります。" },
  ];

  // 相性の数字（0〜3）から「向いている」を作る。3が無ければ2の上位
  function suits(map, labels) {
    const ent = Object.entries(map || {}).filter(([k]) => labels[k]).sort((a, b) => b[1] - a[1]);
    const top = ent.filter(([, v]) => v >= 3);
    return (top.length ? top : ent.filter(([, v]) => v >= 2).slice(0, 3)).map(([k]) => labels[k]);
  }
  const moodLabel = Object.fromEntries(Object.entries(R.MOODS).map(([k, m]) => [k, m.label]));
  const purposeLabel = Object.fromEntries(Object.entries(R.PURPOSES).filter(([, p]) => !p.hidden).map(([k, p]) => [k, p.label]));

  function entry(t, n) {
    const moods = suits(t.moods, moodLabel), purposes = suits(t.purposes, purposeLabel);
    const hint = t.hint ? `
          <div class="tb-row"><span class="tb-k">頼み方</span><div><span class="tb-word">「${esc(t.hint)}」</span>と、作りたいものの言葉に書き足す
            <div class="tb-actions"><a class="btn chip-btn ref-btn" href="./?add=${encodeURIComponent(t.hint)}#make">この言葉で作る →</a><button type="button" class="btn chip-btn" data-copy="${esc(t.hint)}">言葉をコピー</button></div></div></div>` : "";
    return `
      <article class="tb-entry" id="t-${t.id}">
        <div class="stage tb-stage d-${t.id}">${DEMO[t.id] || ""}</div>
        <div class="tb-body">
          <p class="tb-num">${n}</p>
          <h3 class="tb-name">${esc(t.name)}</h3>
          <div class="tb-row tb-formal"><span class="tb-k">正式名称</span><div><b class="tb-formal-ja">${esc(t.formal)}</b><span class="tb-formal-en" lang="en">${esc(t.en)}</span>${t.aka ? `<p class="tb-aka">ほかの呼び方：${esc(t.aka)}</p>` : ""}
            <div class="tb-actions"><button type="button" class="btn chip-btn" data-copy="${esc(t.formal)}（${esc(t.en)}）">正式名称をコピー</button></div></div></div>
          <div class="tb-row"><span class="tb-k">どんな技か</span><p>${esc(t.plain)}</p></div>
          ${moods.length || purposes.length ? `<div class="tb-row"><span class="tb-k">向いている</span><div class="tb-tags">${moods.map((x) => `<span class="tag">${esc(x)}</span>`).join("")}${purposes.map((x) => `<span class="tag p">${esc(x)}</span>`).join("")}</div></div>` : ""}
          ${hint}
          <div class="tb-row"><span class="tb-k">注文書に入る文</span><blockquote>${esc(t.orderLine)}</blockquote></div>
        </div>
      </article>`;
  }

  $("chapters").innerHTML = CHAPTERS.map((c, ci) => {
    const list = R.TECHNIQUES.filter((t) => t.role === c.role);
    const body = list.map((t, i) => entry(t, `${ci + 1}-${i + 1}`)).join("");
    return `
    <section class="card tb-chapter" id="ch-${c.role}">
      <p class="kicker">第${ci + 1}章</p>
      <h2>${esc(c.title)} <span class="tb-count">${list.length}</span></h2>
      <p class="sec-lead">${esc(c.lead)}</p>
      ${body}
    </section>`;
  }).join("");
  $("toc").innerHTML = CHAPTERS.map((c, ci) => `<a class="chip" href="#ch-${c.role}">第${ci + 1}章 ${esc(c.title)}（${R.TECHNIQUES.filter((t) => t.role === c.role).length}）</a>`).join("");

  // 見えている見本だけ動かす
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("paused", !e.isIntersecting)), { rootMargin: "80px" });
    document.querySelectorAll(".tb-entry").forEach((el) => { el.classList.add("paused"); io.observe(el); });
  }

  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.classList.add("on");
    clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("on"), 2000);
  }
  document.addEventListener("click", async (e) => {
    // アプリのタブから開いた時は、そのタブに言葉を足してこのタブを閉じる（タブが2つにならず、お手本と調整も消えない）
    const add = e.target.closest("a.ref-btn[href*='?add=']");
    if (add) {
      let op = null;
      try { op = window.opener && !window.opener.closed && typeof window.opener.MR_addWord === "function" ? window.opener : null; } catch (err) { op = null; }
      if (op) {
        e.preventDefault();
        const word = new URL(add.href).searchParams.get("add");
        op.MR_addWord(word);
        toast(`アプリのタブに「${word}」を足しました`);
        setTimeout(() => { window.close(); }, 900);
        return;
      }
    }
    const b = e.target.closest("[data-copy]");
    if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.copy); } catch (err) { /* コピーできない環境でも止めない */ }
    toast(`「${b.dataset.copy}」をコピーしました`);
  });

  // #t-<id> で来たら、その技を少し目立たせる
  const target = location.hash && document.querySelector(location.hash);
  if (target && target.classList.contains("tb-entry")) { target.classList.add("focus"); setTimeout(() => target.scrollIntoView({ block: "center" }), 200); }
})();
