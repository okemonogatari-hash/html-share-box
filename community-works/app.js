(function () {
  "use strict";

  const grid = document.getElementById("works-grid");
  const loadState = document.getElementById("load-state");
  const moreRow = document.getElementById("more-works-row");
  const moreButton = document.getElementById("more-works");
  const panel = document.getElementById("submit-panel");
  const openButtons = [document.getElementById("show-submit"), document.getElementById("hero-show-submit")].filter(Boolean);
  const form = document.getElementById("submit-form");
  const submitButton = document.getElementById("submit-button");
  const submitStatus = document.getElementById("submit-status");
  const apiNotice = document.getElementById("api-notice");
  const profileInput = document.getElementById("profile-input");
  const workUrlInput = document.getElementById("work-url-input");
  const consentInput = document.getElementById("consent-input");
  const API_LOAD_ERROR = "投稿作品を読み込めませんでした。再読み込みしてください。";
  const tokenPrefix = "community-works:delete-token:";
  const removedIds = new Set();
  const memoryTokens = new Map();
  let seedWorks = [];
  let apiWorks = [];
  let preferredIds = [];
  let nextCursor = null;
  let loadingMore = false;
  let lastOpener = null;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function configuredApiBase() {
    const raw = window.COMMUNITY_API && window.COMMUNITY_API.baseUrl;
    if (typeof raw !== "string" || !raw.trim()) return "";
    try {
      const url = new URL(raw.trim());
      const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
      if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) return "";
      if (url.username || url.password || url.search || url.hash) return "";
      return url.href.replace(/\/+$/, "");
    } catch (_) {
      return "";
    }
  }

  const apiBaseUrl = configuredApiBase();

  function safeWebUrl(value) {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const url = new URL(value.trim(), document.baseURI);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  function safeHttpsUrl(value) {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const url = new URL(value.trim());
      return url.protocol === "https:" ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  function externalLink(href, className, label) {
    const url = safeWebUrl(href);
    if (!url) return null;
    const link = element("a", className, label);
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  }

  function workId(work) {
    if (!work || work.id === undefined || work.id === null) return "";
    return String(work.id).trim();
  }

  function cardId(id) {
    return `work-${String(id)}`;
  }

  function deleteToken(id) {
    const memoryToken = memoryTokens.get(String(id));
    if (memoryToken) return memoryToken;
    try {
      return window.localStorage.getItem(tokenPrefix + String(id)) || "";
    } catch (_) {
      return "";
    }
  }

  function mediaFallback(media, work, mediaElement) {
    if (mediaElement && mediaElement.isConnected) mediaElement.remove();
    if (media.querySelector(".media-fallback")) return;
    const fallback = element("div", "media-fallback");
    fallback.append(element("span", "media-fallback-copy", "プレビューを表示できませんでした。"));
    const link = externalLink(work.workUrl, "media-fallback-link", "元の作品を開く ↗");
    if (link) fallback.append(link);
    media.append(fallback);
  }

  function makeMedia(work) {
    const media = element("div", "work-media");
    const title = typeof work.title === "string" && work.title.trim() ? work.title.trim() : "作品";
    media.setAttribute("aria-label", `${title}のプレビュー`);
    const poster = safeWebUrl(work.poster);
    const mediaUrl = safeWebUrl(work.mediaUrl);

    if (mediaUrl) {
      const video = document.createElement("video");
      video.controls = true;
      video.preload = "none";
      video.playsInline = true;
      video.src = mediaUrl;
      if (poster) video.poster = poster;
      video.setAttribute("aria-label", `${title}の動画`);
      video.addEventListener("error", () => mediaFallback(media, work, video), { once: true });
      media.append(video);
    } else if (poster) {
      const image = document.createElement("img");
      image.src = poster;
      image.alt = `${title}の画像`;
      image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("error", () => mediaFallback(media, work, image), { once: true });
      media.append(image);
    } else {
      media.setAttribute("aria-label", "作品プレビューなし");
      media.append(element("span", "media-placeholder", "✦"));
    }

    if (typeof work.kind === "string" && work.kind.trim()) {
      media.append(element("span", "kind-badge", work.kind.trim()));
    }
    return media;
  }

  function makeAuthorAvatar(work, authorName) {
    const avatar = externalLink(work.profile, "author-avatar author-avatar-link", `${authorName}のプロフィール`)
      || element("span", "author-avatar");
    if (!avatar.matches("a")) {
      avatar.setAttribute("role", "img");
      avatar.setAttribute("aria-label", `${authorName}のプロフィール`);
    }

    const fallback = element("span", "author-avatar-fallback", Array.from(authorName.trim())[0] || "作");
    fallback.setAttribute("aria-hidden", "true");
    const avatarUrl = safeHttpsUrl(work.avatarUrl);
    if (!avatarUrl) {
      avatar.append(fallback);
      return avatar;
    }

    const image = document.createElement("img");
    image.className = "author-avatar-image";
    image.src = avatarUrl;
    image.alt = authorName;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => {
      if (!image.isConnected) return;
      image.replaceWith(fallback);
    }, { once: true });
    avatar.append(image);
    return avatar;
  }

  function makeCard(work) {
    const card = element("article", "work-card");
    const id = workId(work);
    if (id) {
      card.id = cardId(id);
      card.tabIndex = -1;
    }
    card.append(makeMedia(work));

    const body = element("div", "work-body");
    if (typeof work.date === "string" && work.date.trim()) {
      const date = element("time", "work-date", work.date.trim());
      if (/^\d{4}-\d{2}-\d{2}$/.test(work.date.trim())) date.dateTime = work.date.trim();
      body.append(date);
    }

    body.append(element("h3", "work-title", work.title || "作品"));
    if (typeof work.description === "string" && work.description.trim()) {
      body.append(element("p", "work-description", work.description.trim()));
    }

    const author = element("div", "author-box");
    const authorName = typeof work.author === "string" && work.author.trim() ? work.author.trim() : "作者";
    const authorIdentity = element("div", "author-identity");
    authorIdentity.append(makeAuthorAvatar(work, authorName));
    const authorDetails = element("div", "author-details");
    const authorTopline = element("div", "author-topline");
    authorTopline.append(element("span", "author-name", authorName));
    const profile = externalLink(work.profile, "profile-link", work.profileLabel || "作者のプロフィール");
    if (profile) authorTopline.append(profile);
    authorDetails.append(authorTopline);
    if (typeof work.authorBio === "string" && work.authorBio.trim()) {
      authorDetails.append(element("p", "author-bio", work.authorBio.trim()));
    }
    authorIdentity.append(authorDetails);
    author.append(authorIdentity);
    body.append(author);

    const actions = element("div", "card-actions");
    const workLink = externalLink(work.workUrl, "work-link", "作品を見る");
    if (workLink) actions.append(workLink);
    const sourceLink = externalLink(work.sourceUrl, "source-link", work.sourceLabel || "元の投稿を見る");
    if (sourceLink) actions.append(sourceLink);
    if (id && deleteToken(id)) {
      const removeButton = element("button", "remove-post-button", "自分の投稿を取り下げる");
      removeButton.type = "button";
      const confirmation = element("div", "remove-confirmation");
      confirmation.hidden = true;
      confirmation.setAttribute("role", "group");
      confirmation.setAttribute("aria-label", "作品の取り下げ確認");
      confirmation.append(element("p", "remove-confirmation-copy", "この作品を棚から取り下げますか？"));
      const confirmButton = element("button", "remove-post-button remove-confirm-button", "取り下げる");
      confirmButton.type = "button";
      const cancelButton = element("button", "remove-cancel-button", "戻る");
      cancelButton.type = "button";
      confirmation.append(confirmButton, cancelButton);
      removeButton.addEventListener("click", () => {
        removeButton.hidden = true;
        confirmation.hidden = false;
        confirmButton.focus();
      });
      cancelButton.addEventListener("click", () => {
        confirmation.hidden = true;
        removeButton.hidden = false;
        removeButton.focus();
      });
      confirmButton.addEventListener("click", () => removeOwnWork(id, confirmButton, cancelButton));
      actions.append(removeButton);
      actions.append(confirmation);
    }
    if (actions.childNodes.length) body.append(actions);

    card.append(body);
    return card;
  }

  function uniqueWorks(...groups) {
    const seen = new Set();
    const result = [];
    for (const group of groups) {
      if (!Array.isArray(group)) continue;
      for (const work of group) {
        if (!work || typeof work !== "object" || Array.isArray(work)) continue;
        const id = workId(work);
        if (!id || seen.has(id) || removedIds.has(id)) continue;
        seen.add(id);
        result.push(work);
      }
    }
    return result;
  }

  function orderedWorks() {
    const apiById = new Map(apiWorks.map((work) => [workId(work), work]));
    const preferred = preferredIds.map((id) => apiById.get(id)).filter(Boolean);
    return uniqueWorks(preferred, apiWorks, seedWorks);
  }

  function setLoadMessage(message) {
    if (!message) {
      loadState.hidden = true;
      loadState.textContent = "";
      return;
    }
    loadState.textContent = message;
    loadState.hidden = false;
  }

  function renderWorks(message) {
    const works = orderedWorks();
    grid.replaceChildren(...works.map(makeCard));
    grid.setAttribute("aria-busy", "false");
    if (message) setLoadMessage(message);
    else if (!works.length) setLoadMessage("掲載作品はまだありません。");
    else setLoadMessage("");
    moreRow.hidden = !apiBaseUrl || !nextCursor;
    moreButton.disabled = loadingMore;
    moreButton.textContent = loadingMore ? "読み込み中…" : "もっと見る";
  }

  async function responseError(response, fallback) {
    let detail = "";
    try {
      const data = await response.json();
      if (typeof data.message === "string") detail = data.message;
      else if (typeof data.error === "string") detail = data.error;
      else if (data.error && typeof data.error.message === "string") detail = data.error.message;
    } catch (_) {
      // APIが本文を返さない場合はHTTP状態だけを表示する。
    }
    if (detail.trim()) return `${fallback}：${detail.trim().slice(0, 220)}`;
    return `${fallback}（HTTP ${response.status}）`;
  }

  async function readApiWorks(cursor) {
    if (!apiBaseUrl) throw new Error("投稿機能は公開前の準備中です。");
    let url = `${apiBaseUrl}/api/works`;
    if (cursor !== undefined && cursor !== null && String(cursor)) {
      url += `?before=${encodeURIComponent(String(cursor))}`;
    }
    const response = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error(API_LOAD_ERROR);
    const data = await response.json();
    if (!data || !Array.isArray(data.works)) throw new Error(API_LOAD_ERROR);
    return {
      works: data.works.filter((work) => work && typeof work === "object" && !Array.isArray(work)),
      nextCursor: data.nextCursor === undefined || data.nextCursor === null || data.nextCursor === "" ? null : String(data.nextCursor),
    };
  }

  async function readSeedWorks() {
    const response = await fetch("works.json", { cache: "no-store" });
    if (!response.ok) throw new Error("作品データを読み込めませんでした。");
    const data = await response.json();
    if (!data || !Array.isArray(data.works)) throw new Error("作品データの形式を読み取れませんでした。");
    return data.works.filter((work) => work && typeof work === "object" && !Array.isArray(work));
  }

  async function loadInitialWorks() {
    grid.setAttribute("aria-busy", "true");
    if (!apiBaseUrl) {
      const seedResult = await Promise.resolve().then(readSeedWorks).then(
        (works) => ({ ok: true, works }),
        () => ({ ok: false, works: [] }),
      );
      seedWorks = seedResult.works;
      renderWorks(seedResult.ok ? "" : "作品データを読み込めませんでした。再読み込みしてください。");
      return;
    }

    const [seedResult, apiResult] = await Promise.all([
      Promise.resolve().then(readSeedWorks).then(
        (works) => ({ ok: true, works }),
        () => ({ ok: false, works: [] }),
      ),
      Promise.resolve().then(() => readApiWorks()).then(
        (page) => ({ ok: true, page }),
        () => ({ ok: false, page: { works: [], nextCursor: null } }),
      ),
    ]);
    seedWorks = seedResult.works;
    if (apiResult.ok) {
      apiWorks = uniqueWorks(apiResult.page.works);
      nextCursor = apiResult.page.nextCursor;
      renderWorks(seedResult.ok ? "" : "作品データを一部読み込めませんでした。再読み込みしてください。");
    } else {
      apiWorks = [];
      nextCursor = null;
      renderWorks(API_LOAD_ERROR);
    }
  }

  async function loadMoreWorks() {
    if (!apiBaseUrl || !nextCursor || loadingMore) return;
    const cursor = nextCursor;
    loadingMore = true;
    moreButton.disabled = true;
    moreButton.textContent = "読み込み中…";
    try {
      const page = await readApiWorks(cursor);
      apiWorks = uniqueWorks(apiWorks, page.works);
      nextCursor = page.nextCursor;
      renderWorks("");
    } catch (_) {
      renderWorks(API_LOAD_ERROR);
    } finally {
      loadingMore = false;
      moreButton.disabled = false;
      moreButton.textContent = "もっと見る";
      moreRow.hidden = !apiBaseUrl || !nextCursor;
    }
  }

  function tokenStorageKey(id) {
    return tokenPrefix + String(id);
  }

  function preflightTokenStorage() {
    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const key = `${tokenPrefix}preflight:${nonce}`;
    try {
      window.localStorage.setItem(key, "ready");
      if (window.localStorage.getItem(key) !== "ready") {
        window.localStorage.removeItem(key);
        return false;
      }
      window.localStorage.removeItem(key);
      return window.localStorage.getItem(key) === null;
    } catch (_) {
      try { window.localStorage.removeItem(key); } catch (_) { /* storage is unavailable */ }
      return false;
    }
  }

  function setSubmitStatus(message, isError) {
    submitStatus.textContent = message;
    submitStatus.hidden = !message;
    submitStatus.classList.toggle("is-error", Boolean(isError));
    submitStatus.classList.toggle("is-success", Boolean(message) && !isError);
  }

  function setFieldError(field, errorId, message) {
    const error = document.getElementById(errorId);
    field.setAttribute("aria-invalid", message ? "true" : "false");
    error.textContent = message || "";
    error.hidden = !message;
  }

  function validProfileUrl(value) {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || url.hostname !== "libecity.com" || url.port || url.username || url.password || url.search || url.hash) return false;
      const segments = url.pathname.split("/").filter(Boolean);
      if (segments.length !== 2 || segments[0] !== "user_profile") return false;
      const id = decodeURIComponent(segments[1]);
      return Boolean(id) && !id.includes("/") && !id.includes("?") && !id.includes("#");
    } catch (_) {
      return false;
    }
  }

  function validateField(field, errorId, label, rules) {
    const value = field.type === "checkbox" ? field.checked : field.value.trim();
    let message = "";
    if (rules.required && !value) message = rules.requiredMessage || `${label}を入力してください。`;
    else if (typeof value === "string" && field.maxLength > 0 && value.length > field.maxLength) message = `${label}は${field.maxLength}字以内で入力してください。`;
    else if (value && rules.profile && !validProfileUrl(value)) message = "https://libecity.com/user_profile/会員ID のURLを入力してください。";
    else if (value && rules.https) {
      try {
        if (new URL(value).protocol !== "https:") message = `https:// で始まる${label}を入力してください。`;
      } catch (_) {
        message = `有効な${label}を入力してください。`;
      }
    }
    setFieldError(field, errorId, message);
    return !message;
  }

  const validation = [
    [document.getElementById("author-input"), "author-error", "作者名", { required: true }],
    [profileInput, "profile-error", "プロフィールURL", { required: true, profile: true }],
    [document.getElementById("title-input"), "title-error", "作品名", { required: true }],
    [workUrlInput, "work-url-error", "作品URL", { required: true, https: true }],
    [document.getElementById("description-input"), "description-error", "作品の説明", { required: true }],
    [consentInput, "consent-error", "公開範囲", { required: true, requiredMessage: "投稿内容と公開範囲を確認し、チェックを入れてください。" }],
  ];

  function validateForm() {
    let valid = true;
    let firstInvalid = null;
    for (const [field, errorId, label, rules] of validation) {
      if (!validateField(field, errorId, label, rules)) {
        valid = false;
        if (!firstInvalid) firstInvalid = field;
      }
    }
    if (firstInvalid) firstInvalid.focus();
    return valid;
  }

  for (const [field, errorId, label, rules] of validation) {
    const update = () => {
      if (field.getAttribute("aria-invalid") === "true") validateField(field, errorId, label, rules);
    };
    field.addEventListener(field.type === "checkbox" ? "change" : "input", update);
  }

  function clearFieldErrors() {
    for (const [field, errorId] of validation) setFieldError(field, errorId, "");
  }

  function openSubmitPanel(button) {
    lastOpener = button;
    panel.hidden = false;
    for (const openButton of openButtons) openButton.setAttribute("aria-expanded", "true");
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
    window.requestAnimationFrame(() => document.getElementById("submit-title").focus());
  }

  function closeSubmitPanel() {
    panel.hidden = true;
    for (const openButton of openButtons) openButton.setAttribute("aria-expanded", "false");
    if (lastOpener) lastOpener.focus();
  }

  function revealWork(id) {
    const card = document.getElementById(cardId(id));
    if (!card) return;
    const fragment = cardId(id);
    try {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${encodeURIComponent(fragment)}`);
    } catch (_) {
      window.location.hash = encodeURIComponent(fragment);
    }
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.focus({ preventScroll: true });
  }

  function restoreWorkFragment() {
    if (!window.location.hash.startsWith("#work-")) return;
    let id = window.location.hash.slice(1);
    try { id = decodeURIComponent(id); } catch (_) { /* leave the literal fragment */ }
    const card = document.getElementById(id);
    if (card) card.scrollIntoView({ block: "center" });
  }

  async function refreshAfterPost(createdId, createdWork) {
    let confirmed = false;
    try {
      const page = await readApiWorks();
      confirmed = page.works.some((work) => workId(work) === createdId);
      apiWorks = uniqueWorks([createdWork], page.works, apiWorks);
      nextCursor = page.nextCursor;
      renderWorks(confirmed ? "" : API_LOAD_ERROR);
    } catch (_) {
      apiWorks = uniqueWorks([createdWork], apiWorks);
      renderWorks(API_LOAD_ERROR);
    }
    return confirmed;
  }

  async function submitWork(event) {
    event.preventDefault();
    setSubmitStatus("", false);
    if (!apiBaseUrl) {
      setSubmitStatus("投稿機能は公開前の準備中です。", true);
      return;
    }
    if (!validateForm()) return;
    if (!preflightTokenStorage()) {
      setSubmitStatus("この端末では取り下げに必要な情報を保存できないため、投稿を中止しました。ブラウザの保存設定を確認してください。", true);
      return;
    }

    const values = new FormData(form);
    const body = {
      author: String(values.get("author")).trim(),
      profile: String(values.get("profile")).trim(),
      title: String(values.get("title")).trim(),
      workUrl: String(values.get("workUrl")).trim(),
      description: String(values.get("description")).trim(),
      consent: true,
    };

    submitButton.disabled = true;
    form.setAttribute("aria-busy", "true");
    submitButton.textContent = "投稿しています…";
    try {
      const response = await fetch(`${apiBaseUrl}/api/works`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setSubmitStatus(await responseError(response, "投稿できませんでした"), true);
        return;
      }

      let result;
      try { result = await response.json(); } catch (_) { throw new Error("投稿結果を読み取れませんでした。再読み込みしてください。"); }
      if (!result || !result.work || typeof result.work !== "object" || !workId(result.work)) {
        throw new Error("投稿は受け付けられましたが、作品情報を読み取れませんでした。再読み込みしてください。");
      }

      const createdWork = result.work;
      const createdId = workId(createdWork);
      preferredIds = [createdId, ...preferredIds.filter((id) => id !== createdId)];
      let tokenStored = false;
      const tokenProvided = typeof result.deleteToken === "string" && Boolean(result.deleteToken);
      if (tokenProvided) {
        memoryTokens.set(createdId, result.deleteToken);
        try {
          window.localStorage.setItem(tokenStorageKey(createdId), result.deleteToken);
          tokenStored = true;
        } catch (_) {
          tokenStored = false;
        }
      }

      const confirmed = await refreshAfterPost(createdId, createdWork);
      form.reset();
      clearFieldErrors();
      revealWork(createdId);
      if (!tokenProvided) {
        setSubmitStatus("投稿は保存されましたが、取り下げ用トークンを受け取れませんでした。", true);
      } else if (!tokenStored) {
        setSubmitStatus("この端末で取り下げに必要な情報を保存できませんでした。このページを閉じる前に取り下げてください。", true);
      } else if (!confirmed) {
        setSubmitStatus("投稿は保存されましたが、棚で再確認できませんでした。再読み込みしてください。", true);
      } else {
        setSubmitStatus("棚に投稿しました。");
      }
    } catch (error) {
      setSubmitStatus(error instanceof Error ? error.message : "投稿できませんでした。通信状態を確認して、もう一度お試しください。", true);
    } finally {
      form.setAttribute("aria-busy", "false");
      submitButton.disabled = !apiBaseUrl;
      submitButton.textContent = "棚に投稿する";
    }
  }

  async function removeOwnWork(id, button, cancelButton) {
    const token = deleteToken(id);
    if (!token || !apiBaseUrl) {
      setLoadMessage("この端末に取り下げ情報が見つかりません。投稿した端末で再度お試しください。");
      return;
    }
    button.disabled = true;
    cancelButton.disabled = true;
    button.textContent = "取り下げています…";
    try {
      const response = await fetch(`${apiBaseUrl}/api/works/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        button.disabled = false;
        cancelButton.disabled = false;
        button.textContent = "取り下げる";
        setLoadMessage(await responseError(response, "取り下げできませんでした"));
        return;
      }

      removedIds.add(String(id));
      preferredIds = preferredIds.filter((workIdValue) => workIdValue !== String(id));
      apiWorks = apiWorks.filter((work) => workId(work) !== String(id));
      try { window.localStorage.removeItem(tokenStorageKey(id)); } catch (_) { /* 204 confirms removal; token stays private on this device. */ }
      memoryTokens.delete(String(id));
      renderWorks("");
      try {
        const page = await readApiWorks();
        apiWorks = uniqueWorks(page.works, apiWorks);
        nextCursor = page.nextCursor;
        renderWorks("");
        setLoadMessage("投稿を棚から取り下げました。");
      } catch (_) {
        renderWorks("投稿を取り下げました。一覧を再読み込みできませんでした。");
      }
    } catch (_) {
      button.disabled = false;
      cancelButton.disabled = false;
      button.textContent = "取り下げる";
      setLoadMessage("取り下げできませんでした。通信状態を確認して、もう一度お試しください。");
    }
  }

  for (const button of openButtons) {
    button.addEventListener("click", () => openSubmitPanel(button));
  }
  document.getElementById("close-submit").addEventListener("click", closeSubmitPanel);
  document.getElementById("cancel-submit").addEventListener("click", closeSubmitPanel);
  form.addEventListener("submit", submitWork);
  moreButton.addEventListener("click", loadMoreWorks);

  if (!apiBaseUrl) {
    apiNotice.textContent = "投稿機能は公開前の準備中です。";
    apiNotice.hidden = false;
    submitButton.disabled = true;
  }

  window.addEventListener("hashchange", restoreWorkFragment);
  loadInitialWorks().then(() => window.requestAnimationFrame(restoreWorkFragment));
})();
