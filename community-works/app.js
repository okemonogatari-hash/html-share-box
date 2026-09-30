(function () {
  "use strict";

  const grid = document.getElementById("works-grid");
  const loadState = document.getElementById("load-state");
  const moreRow = document.getElementById("more-works-row");
  const moreButton = document.getElementById("more-works");
  const panel = document.getElementById("submit-panel");
  const aiPromptPanel = document.getElementById("ai-prompt-panel");
  const manualEntryToolbar = document.getElementById("manual-entry-toolbar");
  const aiPromptTextarea = document.getElementById("ai-posting-prompt");
  const copyPromptButton = document.getElementById("copy-posting-prompt");
  const promptStatus = document.getElementById("prompt-status");
  const showManualFormButton = document.getElementById("show-manual-form");
  const backToAiPromptButton = document.getElementById("back-to-ai-prompt");
  const openButtons = [document.getElementById("show-submit"), document.getElementById("hero-show-submit")].filter(Boolean);
  const form = document.getElementById("submit-form");
  const submitButton = document.getElementById("submit-button");
  const submitStatus = document.getElementById("submit-status");
  const apiNotice = document.getElementById("api-notice");
  const profileInput = document.getElementById("profile-input");
  const workUrlInput = document.getElementById("work-url-input");
  const workUrlField = document.getElementById("work-url-field");
  const fileUploadFields = document.getElementById("file-upload-fields");
  const workFileInput = document.getElementById("work-file-input");
  const filePreview = document.getElementById("file-preview");
  const uploadResume = document.getElementById("upload-resume");
  const uploadResumeList = document.getElementById("upload-resume-list");
  const consentInput = document.getElementById("consent-input");
  const API_LOAD_ERROR = "投稿作品を読み込めませんでした。再読み込みしてください。";
  const tokenPrefix = "community-works:delete-token:";
  const uploadPrefix = "community-works:upload:";
  const MAX_MP4_BYTES = 20 * 1024 * 1024;
  const MAX_HTML_BYTES = 2 * 1024 * 1024;
  const removedIds = new Set();
  const memoryTokens = new Map();
  let seedWorks = [];
  let apiWorks = [];
  let preferredIds = [];
  let nextCursor = null;
  let loadingMore = false;
  let lastOpener = null;
  let selectedFile = null;
  let selectedPreviewUrl = "";
  let activeUploadRecord = null;
  let uploadUiRecords = [];
  let formBusy = false;

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

  function buildAiPostingPrompt() {
    const apiBase = apiBaseUrl || "未設定です。設定が入るまでAPIリクエストは実行しないでください。";
    return [
      "あなたは、ユーザー本人が作った作品を「みんなの『作ってみた』棚」へ登録する作業を手伝うAIです。ユーザー本人が共有を依頼した作品だけを投稿してください。",
      "",
      "## 作品情報を確認する",
      "- 現在の会話と作業コンテキストから、作品名・作品URLまたは手元のMP4/HTMLファイル・どんなふうに作ったかの説明を整理してください。確認できた情報を本人に聞き直さず、分からない項目だけ確認してください。",
      "- 作者名とリベのプロフィールURLが確認できない場合も、上の不足項目とまとめて一度に本人へ質問してください。推測で補わないでください。プロフィールURLは https://libecity.com/user_profile/<会員ID> の形式に限ります。",
      "- 作品URLがある場合は従来どおりURLで投稿できます。公開URLがなくても、ユーザー本人のローカルMP4または自己完結HTMLをこの棚のアップロードAPIへ直接送れます。MP4/HTMLが手元にある時は公開URLの作成を求めないでください。ローカルファイルが見つからない場合だけ、URLまたはファイルの場所を確認してください。",
      "- HTMLは依存する画像・音・CSS・JavaScriptを1ファイルにまとめます。外部CDN、外部fetch、evalを使うHTMLは投稿しません。MP4の再エンコードが必要なら、元ファイルを保持したうえで本人に確認してください。",
      "- 公開されるのは作者名、プロフィールURL、プロフィール画像、作品名、作品URL、説明です。共有範囲はこの棚のURLを知る人です。これらを共有する依頼と矛盾がないことを確認してください。",
      "- ノウハウ図書館の記事や他の投稿から文章を引用せず、ユーザー本人の作品の説明だけを使ってください。プロフィールアイコンURLは送信不要です。",
      "",
      "## APIの共通条件",
      "- APIベースURLは次の値だけを使います：" + apiBase,
      "- コードから送るすべてのAPI要求（GET、POST、PUT、DELETE）に Origin: https://okemonogatari-hash.github.io を付けます。ブラウザfetchではOriginをブラウザに任せます。Bearer tokenが必要なendpointには Authorization: Bearer <token> を付けます。応答全体やtoken値を画面・チャット・コマンド出力・ログへ出さないでください。403時に別のURLやAPIへ送らないでください。",
      "- まず公開seed https://okemonogatari-hash.github.io/html-share-box/community-works/works.json と GET <APIベースURL>/api/works の両方を読み、APIのnextCursorがあれば before=<URLエンコードしたカーソル> で最後まで取得します。",
      "- URL投稿の重複とみなすのは、同じリベプロフィール会員IDかつ正規化した作品URLが一致するときだけです。作品URLはURLとして正規化しますが、path・query・fragmentは意味を保ち、www.や末尾スラッシュも一律には変えません。utm_*等の明らかな計測用queryのみ除けます。YouTubeは youtu.be/<ID>、youtube.com/watch?v=<ID>、youtube.com/shorts/<ID> を同じ動画IDとして比べます。作者名や作品名だけでは重複扱いしません。seed/APIのどちらかに一致する掲載があればPOSTせず、そのカードを案内してください。",
      "",
      "## HTTPS作品URLを投稿する場合",
      "1. 重複がなく、必須項目と公開意図が確認できたら POST <APIベースURL>/api/works を呼びます。Content-Type は application/json。body は author, profile, title, workUrl, description, consent:true のJSONです。アイコンはプロフィールから取得されます。author/titleは各100字以内、descriptionは1〜500字、workUrlはHTTPS、profileは指定形式を守ってください。",
      "2. curlまたはPythonなど利用できるHTTP手段を使います。CloudflareでPython既定User-Agentが403になる場合は、User-Agentに curl/8.7.1 を明示するか、curlを使ってください。409なら再投稿せず、seedと全GETページを再確認します。一致が見つかれば既存カードを案内し、見つからなければ競合として報告します。",
      "3. POSTが201で {work, deleteToken} を返したら、token値を画面・チャット・コマンド出力・ログへ絶対に出さず、apiUrl・work.id・tokenを作業フォルダとGit管理の外にあるローカル秘密ファイルへ保存します。ディレクトリは所有者のみアクセス可能（chmod 700相当）、ファイルは所有者だけ読み書き可能（chmod 600相当）にし、保存後に読み戻して一致を確認してください。tokenを含む応答JSON全体は表示しません。",
      "4. 秘密ファイルへの保存または権限確認に失敗したら、受け取ったtokenで直ちに DELETE <APIベースURL>/api/works/<work.id> を呼び、GETでも作品が消えたことを確かめてください。token保存後はOrigin付きGETを読み直し、work.idが掲載されていることを確認します。",
      "",
      "## 手元のMP4/HTMLファイルを投稿する場合",
      "1. 形式と大きさを確認します。MP4は video/mp4 で20MiB以下、HTML/HTMは text/html で2MiB以下、0 byteは不可です。作品名など必須情報と本人の投稿意図を確認します。HTMLは外部CDN・外部fetch・evalを使わず、必要な素材とコードを1ファイルにまとめます。",
      "2. tokenと再開に必要な情報を、作業フォルダとGit管理の外にある秘密ディレクトリ（chmod 700相当）と秘密ファイル（chmod 600相当）へ保存する準備を先に整えます。",
      "3. POST <APIベースURL>/api/uploads に Content-Type: application/json で {author,profile,title,description,consent:true,fileName,fileType:'mp4'|'html',fileSize} を送り、201の {id,workId,deleteToken,uploadUrl,publishUrl,statusUrl,expiresAt} を受け取ります。idはupload-UUID、workIdは公開後のcommunity-UUIDです。tokenを含む応答は表示しません。apiUrl、id、workId、token、各URL、期限、ファイル名・形式・サイズを秘密ファイルへ保存し、権限と読み戻しの一致を確認してから次へ進みます。秘密保存に失敗した場合は、受け取ったtokenで直ちに DELETE <APIベースURL>/api/uploads/<id> を呼んで準備を取り消し、以降のPUTをしません。",
      "4. 同じupload id・tokenのまま PUT <uploadUrl> へファイルの生バイナリを送ります。Content-TypeはMP4なら video/mp4、HTMLなら text/html。AuthorizationとOriginを付け、multipart/form-dataやbase64にはしません。200 {state:'ready'} を確認した後、POST <publishUrl> をBearer付きで呼びます。公開APIでは準備した情報からworkが作られ、201または再試行時200で {work} が返ります。work.idが準備時workIdと同じことを確かめます。",
      "5. 保存後はOrigin付きGET <APIベースURL>/api/works を読み直し、同じidのworkが掲載されたことを確認します。公開URLはAPIが返すwork.workUrlを使います。ファイル投稿で公開URLの作成を本人に求めないでください。",
      "6. PUTやpublishの通信が不確かな時は、秘密ファイルの同じstatusUrlをBearer付きGETして状態を確認します。続ける時も同じupload id・uploadUrl・publishUrlを使い、準備POSTを作り直しません。readyならpublishだけを再試行します。pendingなら同じファイル名・形式・サイズを確認して同じuploadUrlへ再試行します。uploadingとretryAfterSecondsが返ったら指定秒数待ってstatusUrlを再確認し、readyまたはpendingへ変わるまで重ねてPUTしません。期限切れは404/410で確認して報告します。",
      "7. 未公開uploadを取りやめる時は DELETE <APIベースURL>/api/uploads/<upload id> をBearerとOrigin付きで実行します。公開後の取り下げは従来どおり DELETE <APIベースURL>/api/works/<workId> をBearerとOrigin付きで実行し、GETで消えたことを確認します。tokenを紛失していたら推測・再発行せず、管理者への取り下げ依頼が必要と伝えてください。",
      "",
      "成功したらtokenを含めず、共有ページURL https://okemonogatari-hash.github.io/html-share-box/community-works/#work-<URLエンコードしたwork.id> と掲載結果を本人に伝えてください。取り下げも同じAIに頼めること、秘密ファイルの場所（token値なし）も伝えてください。GETで確認できなければ、成功と断言せず状態を分けて説明してください。",
    ].join("\n");
  }

  aiPromptTextarea.value = buildAiPostingPrompt();

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
    const isUploadedVideo = work.uploaded === true && work.mediaType === "mp4";
    fallback.append(element("span", "media-fallback-copy", isUploadedVideo
      ? "保存済み・再生準備中です。少し待って開き直してください。"
      : "プレビューを表示できませんでした。"));
    if (isUploadedVideo) {
      const retry = element("button", "media-retry-button", "再読み込み");
      retry.type = "button";
      retry.addEventListener("click", () => {
        fallback.remove();
        const video = document.createElement("video");
        video.controls = true;
        video.preload = "none";
        video.playsInline = true;
        video.src = safeWebUrl(work.workUrl);
        video.setAttribute("aria-label", `${work.title || "作品"}の動画`);
        video.addEventListener("error", () => mediaFallback(media, work, video));
        video.addEventListener("pointerdown", () => { video.preload = "metadata"; video.load(); }, { once: true });
        video.addEventListener("keydown", () => { video.preload = "metadata"; video.load(); }, { once: true });
        media.append(video);
      });
      fallback.append(retry);
    }
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
    const isUploadedMp4 = work.uploaded === true && work.mediaType === "mp4";
    const isUploadedHtml = work.uploaded === true && work.mediaType === "html";

    if (isUploadedHtml) {
      media.setAttribute("aria-label", `${title}のHTML作品`);
      media.append(element("span", "media-file-placeholder", "HTML作品"));
    } else if (isUploadedMp4 && safeWebUrl(work.workUrl)) {
      const video = document.createElement("video");
      video.controls = true;
      video.preload = "none";
      video.playsInline = true;
      video.src = safeWebUrl(work.workUrl);
      if (poster) video.poster = poster;
      video.setAttribute("aria-label", `${title}の動画`);
      video.addEventListener("error", () => mediaFallback(media, work, video));
      video.addEventListener("pointerdown", () => { video.preload = "metadata"; video.load(); }, { once: true });
      video.addEventListener("keydown", () => { video.preload = "metadata"; video.load(); }, { once: true });
      media.append(video);
    } else if (mediaUrl) {
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
    } else if (isUploadedMp4 || isUploadedHtml) {
      media.append(element("span", "kind-badge", isUploadedMp4 ? "MP4" : "HTML"));
    }
    return media;
  }

  function makeAuthorAvatar(work, authorName) {
    const avatar = externalLink(work.profile, "author-avatar author-avatar-link", `${authorName}のプロフィール`)
      || element("span", "author-avatar");
    avatar.textContent = "";
    avatar.setAttribute("aria-label", `${authorName}のプロフィール`);
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
    for (const token of memoryTokens.values()) {
      if (token) detail = detail.split(token).join("[非表示]");
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

  async function findApiWorkById(id) {
    let cursor = null;
    let firstPage = null;
    const seenCursors = new Set();
    for (let pageIndex = 0; pageIndex < 200; pageIndex += 1) {
      const page = await readApiWorks(cursor);
      if (!firstPage) firstPage = page;
      const found = page.works.find((work) => workId(work) === String(id));
      if (found) return { work: found, firstPage };
      if (!page.nextCursor) return { work: null, firstPage };
      if (seenCursors.has(page.nextCursor)) throw new Error("作品一覧のページを続けて確認できませんでした。");
      seenCursors.add(page.nextCursor);
      cursor = page.nextCursor;
    }
    throw new Error("作品一覧のページ数が多く、最後まで確認できませんでした。");
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

  function uploadStorageKey(id) {
    return uploadPrefix + String(id);
  }

  function apiEndpointUrl(value) {
    if (typeof value !== "string" || !value.trim() || !apiBaseUrl) return "";
    try {
      const url = new URL(value.trim(), `${apiBaseUrl}/`);
      const base = new URL(apiBaseUrl);
      if (url.origin !== base.origin || url.username || url.password || url.hash) return "";
      return url.href;
    } catch (_) {
      return "";
    }
  }

  function uploadRecordIsValid(record) {
    return Boolean(record && typeof record === "object"
      && typeof record.id === "string" && record.id.startsWith("upload-")
      && typeof record.workId === "string" && record.workId.startsWith("community-")
      && typeof record.deleteToken === "string" && record.deleteToken
      && apiEndpointUrl(record.uploadUrl) && apiEndpointUrl(record.publishUrl) && apiEndpointUrl(record.statusUrl)
      && typeof record.fileName === "string" && (record.fileType === "mp4" || record.fileType === "html")
      && Number.isInteger(record.fileSize) && record.fileSize > 0);
  }

  function persistUploadRecord(record) {
    if (!uploadRecordIsValid(record)) return false;
    const tokenKey = tokenStorageKey(record.workId);
    const uploadKey = uploadStorageKey(record.id);
    const { deleteToken, ...publicRecord } = record;
    const serialized = JSON.stringify(publicRecord);
    try {
      window.localStorage.setItem(tokenKey, deleteToken);
      window.localStorage.setItem(uploadKey, serialized);
      const storedRecord = window.localStorage.getItem(uploadKey);
      const parsed = storedRecord ? JSON.parse(storedRecord) : null;
      const readToken = window.localStorage.getItem(tokenKey);
      const matches = storedRecord === serialized && readToken === deleteToken
        && parsed && parsed.id === record.id && parsed.workId === record.workId;
      if (matches) memoryTokens.set(record.workId, deleteToken);
      return Boolean(matches);
    } catch (_) {
      return false;
    }
  }

  function getStoredUploadRecords() {
    const records = [];
    try {
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (!key || !key.startsWith(uploadPrefix)) continue;
        try {
          const stored = JSON.parse(window.localStorage.getItem(key));
          const record = stored && typeof stored === "object"
            ? { ...stored, deleteToken: window.localStorage.getItem(tokenStorageKey(stored.workId)) || "" }
            : null;
          if (uploadRecordIsValid(record) && uploadStorageKey(record.id) === key) records.push(record);
        } catch (_) {
          // Ignore malformed local recovery entries without exposing their contents.
        }
      }
    } catch (_) {
      // The storage preflight will explain whether recovery can be offered.
    }
    return records;
  }

  function clearUploadRecord(record, removeToken) {
    if (!record) return;
    try { window.localStorage.removeItem(uploadStorageKey(record.id)); } catch (_) { /* the server state can still be reported */ }
    if (removeToken) {
      try { window.localStorage.removeItem(tokenStorageKey(record.workId)); } catch (_) { /* keep the in-memory token only for this page */ }
      memoryTokens.delete(record.workId);
    }
    if (activeUploadRecord && activeUploadRecord.id === record.id) {
      setActiveUploadRecord(null);
      selectedFile = null;
      workFileInput.value = "";
      clearFilePreview();
    }
    uploadUiRecords = uploadUiRecords.filter((item) => item.id !== record.id);
    renderUploadResume();
  }

  async function cancelUploadRequest(record) {
    const url = apiEndpointUrl(`/api/uploads/${encodeURIComponent(record.id)}`);
    if (!url) throw new Error("投稿の取りやめ先を確認できませんでした。");
    return fetch(url, {
      method: "DELETE",
      headers: { Accept: "application/json", Authorization: `Bearer ${record.deleteToken}` },
    });
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
    [document.getElementById("description-input"), "description-error", "作品の説明", { required: true }],
    [consentInput, "consent-error", "公開範囲", { required: true, requiredMessage: "投稿内容と公開範囲を確認し、チェックを入れてください。" }],
  ];

  function currentEntryMode() {
    const selected = form.querySelector('input[name="entryMode"]:checked');
    return selected ? selected.value : "file";
  }

  function updateEntryMode() {
    const mode = currentEntryMode();
    const fileMode = mode === "file";
    fileUploadFields.hidden = !fileMode;
    workUrlField.hidden = fileMode;
    workFileInput.required = fileMode;
    workUrlInput.required = !fileMode;
    if (workUrlInput.getAttribute("aria-invalid") === "true" && fileMode) {
      setFieldError(workUrlInput, "work-url-error", "");
    }
    if (!fileMode) setFileError("");
  }

  function fileType(file) {
    if (!file || typeof file.name !== "string") return "";
    const extension = file.name.toLowerCase().split(".").pop();
    if (extension === "mp4") return "mp4";
    if (extension === "html" || extension === "htm") return "html";
    return "";
  }

  function fileTypeError(file) {
    if (!file) return "作品ファイルを選んでください。";
    if (!file.size) return "0 byteのファイルは投稿できません。";
    const type = fileType(file);
    if (!type) return "MP4、HTML、HTMのファイルを選んでください。";
    if (type === "mp4" && file.size > MAX_MP4_BYTES) return "MP4は20MB以下のファイルを選んでください。";
    if (type === "html" && file.size > MAX_HTML_BYTES) return "HTMLは2MB以下のファイルを選んでください。";
    if (file.type && file.type !== "application/octet-stream" && file.type !== (type === "mp4" ? "video/mp4" : "text/html")) {
      return type === "mp4" ? "MP4形式のファイルを選んでください。" : "HTML形式のファイルを選んでください。";
    }
    return "";
  }

  function setFileError(message) {
    const error = document.getElementById("work-file-error");
    workFileInput.setAttribute("aria-invalid", message ? "true" : "false");
    error.textContent = message || "";
    error.hidden = !message;
  }

  function clearFilePreview() {
    if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl);
    selectedPreviewUrl = "";
    filePreview.replaceChildren();
    filePreview.hidden = true;
  }

  function showFilePreview(file) {
    clearFilePreview();
    if (!file) return;
    const name = element("span", "file-preview-name", `${file.name}（${Math.ceil(file.size / 1024)}KB）`);
    filePreview.append(name);
    if (fileType(file) === "mp4" && !fileTypeError(file)) {
      selectedPreviewUrl = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.controls = true;
      video.preload = "metadata";
      video.playsInline = true;
      video.src = selectedPreviewUrl;
      video.setAttribute("aria-label", `${file.name}のローカルプレビュー`);
      filePreview.append(video);
    }
    filePreview.hidden = false;
  }

  function validateForm() {
    let valid = true;
    let firstInvalid = null;
    for (const [field, errorId, label, rules] of validation) {
      if (!validateField(field, errorId, label, rules)) {
        valid = false;
        if (!firstInvalid) firstInvalid = field;
      }
    }
    if (currentEntryMode() === "url") {
      if (!validateField(workUrlInput, "work-url-error", "作品URL", { required: true, https: true })) {
        valid = false;
        if (!firstInvalid) firstInvalid = workUrlInput;
      }
      setFileError("");
    } else {
      const fileError = fileTypeError(selectedFile);
      setFileError(fileError);
      if (fileError) {
        valid = false;
        if (!firstInvalid) firstInvalid = workFileInput;
      }
      setFieldError(workUrlInput, "work-url-error", "");
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
    setFieldError(workUrlInput, "work-url-error", "");
    setFileError("");
  }

  form.querySelectorAll('input[name="entryMode"]').forEach((input) => input.addEventListener("change", updateEntryMode));
  workUrlInput.addEventListener("input", () => {
    if (workUrlInput.getAttribute("aria-invalid") === "true") validateField(workUrlInput, "work-url-error", "作品URL", { required: true, https: true });
  });
  workFileInput.addEventListener("change", () => {
    selectedFile = workFileInput.files && workFileInput.files[0] ? workFileInput.files[0] : null;
    showFilePreview(selectedFile);
    setFileError(fileTypeError(selectedFile));
    if (activeUploadRecord && selectedFile) {
      const matches = selectedFile.name === activeUploadRecord.fileName
        && selectedFile.size === activeUploadRecord.fileSize
        && fileType(selectedFile) === activeUploadRecord.fileType;
      if (!matches) setFileError("最初に選んだファイルと同じ名前・形式・サイズのファイルを選んでください。");
    }
  });
  updateEntryMode();

  function showAiPrompt() {
    aiPromptPanel.hidden = false;
    manualEntryToolbar.hidden = true;
    form.hidden = true;
    promptStatus.textContent = "";
    promptStatus.hidden = true;
  }

  function showManualEntry() {
    aiPromptPanel.hidden = true;
    manualEntryToolbar.hidden = false;
    form.hidden = false;
    document.getElementById("author-input").focus();
  }

  async function copyAiPrompt() {
    promptStatus.textContent = "";
    promptStatus.hidden = true;
    try {
      const clipboard = window.navigator && window.navigator.clipboard;
      if (!window.isSecureContext || !clipboard || typeof clipboard.writeText !== "function") throw new Error("clipboard unavailable");
      await clipboard.writeText(aiPromptTextarea.value);
      promptStatus.textContent = "プロンプトをコピーしました。CodexまたはClaude Codeに貼り付けてください。";
    } catch (_) {
      aiPromptTextarea.focus();
      aiPromptTextarea.select();
      aiPromptTextarea.setSelectionRange(0, aiPromptTextarea.value.length);
      promptStatus.textContent = "自動コピーできませんでした。選択された全文をコピーしてCodexまたはClaude Codeに貼り付けてください。";
    }
    promptStatus.hidden = false;
  }

  function openSubmitPanel(button) {
    lastOpener = button;
    showAiPrompt();
    setSubmitStatus("", false);
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

  function setFormBusy(busy, label) {
    formBusy = Boolean(busy);
    form.setAttribute("aria-busy", formBusy ? "true" : "false");
    submitButton.disabled = formBusy || !apiBaseUrl;
    if (label) submitButton.textContent = label;
    else if (activeUploadRecord) submitButton.textContent = activeUploadRecord.state === "ready" ? "公開を続ける" : "続きから投稿する";
    else submitButton.textContent = "棚に投稿する";
  }

  function setActiveUploadRecord(record) {
    activeUploadRecord = record || null;
    const lockFields = [
      document.getElementById("author-input"), profileInput, document.getElementById("title-input"),
      document.getElementById("description-input"), consentInput,
      ...Array.from(form.querySelectorAll('input[name="entryMode"]')),
    ];
    for (const field of lockFields) field.disabled = Boolean(activeUploadRecord);
    if (activeUploadRecord) {
      document.getElementById("author-input").value = activeUploadRecord.author;
      profileInput.value = activeUploadRecord.profile;
      document.getElementById("title-input").value = activeUploadRecord.title;
      document.getElementById("description-input").value = activeUploadRecord.description;
      consentInput.checked = true;
      form.querySelector('input[name="entryMode"][value="file"]').checked = true;
      updateEntryMode();
    }
    setFormBusy(formBusy);
  }

  function sameSelectedFile(record, file) {
    return Boolean(file && file.name === record.fileName && file.size === record.fileSize && fileType(file) === record.fileType);
  }

  function setUploadUiRecord(record, state, extra) {
    const updated = { ...record, state, ...(extra || {}) };
    const position = uploadUiRecords.findIndex((item) => item.id === record.id);
    if (position >= 0) uploadUiRecords[position] = { ...updated, uiState: state };
    else uploadUiRecords.push({ ...updated, uiState: state });
    if (persistUploadRecord(updated)) {
      memoryTokens.set(updated.workId, updated.deleteToken);
    }
    if (activeUploadRecord && activeUploadRecord.id === updated.id) activeUploadRecord = updated;
    renderUploadResume();
    return updated;
  }

  async function readUploadStatus(record) {
    const url = apiEndpointUrl(record.statusUrl);
    if (!url) throw new Error("投稿の状態を確認できませんでした。");
    const response = await fetch(url, {
      headers: { Accept: "application/json", Authorization: `Bearer ${record.deleteToken}` },
      cache: "no-store",
    });
    if (response.status === 404 || response.status === 410) {
      const expiredError = new Error("投稿の受付期限が過ぎました。ファイルを選び直して投稿してください。");
      expiredError.expired = true;
      throw expiredError;
    }
    if (!response.ok) throw new Error(await responseError(response, "投稿の状態を確認できませんでした"));
    let data;
    try { data = await response.json(); } catch (_) { throw new Error("投稿の状態を読み取れませんでした。"); }
    const state = data && (data.state || (data.upload && data.upload.state) || data.status);
    if (!["pending", "uploading", "ready", "published", "cancelled", "expired"].includes(state)) {
      throw new Error("投稿の状態を読み取れませんでした。");
    }
    if (data.workId && String(data.workId) !== record.workId) throw new Error("投稿先の情報が一致しませんでした。");
    const nestedUpload = data.upload && typeof data.upload === "object" ? data.upload : {};
    return {
      state,
      retryAfterSeconds: Number.isFinite(Number(data.retryAfterSeconds ?? nestedUpload.retryAfterSeconds))
        ? Math.max(0, Number(data.retryAfterSeconds ?? nestedUpload.retryAfterSeconds)) : 0,
      work: data.work && typeof data.work === "object" && !Array.isArray(data.work)
        ? data.work
        : (nestedUpload.work && typeof nestedUpload.work === "object" && !Array.isArray(nestedUpload.work) ? nestedUpload.work : null),
    };
  }

  function resumeMessageFor(record) {
    const state = record.uiState || record.state || "unknown";
    if (state === "ready") return "ファイルの準備ができています。続きを公開できます。";
    if (state === "pending") return "同じファイルを選び直すと、続きから投稿できます。";
    if (state === "uploading") return record.retryAfterSeconds
      ? `ファイルの送信中です。約${record.retryAfterSeconds}秒後に状態をもう一度確認してください。`
      : "ファイルの送信中です。少し待ってから状態をもう一度確認してください。";
    if (state === "published") return "公開済みです。棚への掲載を確認できます。";
    return "投稿の状態を確認できません。通信を確かめて、続きから投稿してください。";
  }

  function renderUploadResume() {
    uploadResumeList.replaceChildren();
    const records = uploadUiRecords.filter((record) => record && !["cancelled", "expired"].includes(record.uiState || record.state));
    uploadResume.hidden = records.length === 0;
    for (const record of records) {
      const item = element("div", "upload-resume-item");
      const copy = element("div", "upload-resume-copy");
      copy.append(element("span", "upload-resume-title", record.title || record.fileName || "作品"));
      copy.append(element("span", "upload-resume-note", resumeMessageFor(record)));
      const actions = element("div", "upload-resume-actions");
      const continueButton = element("button", "submit-button", "続きから投稿");
      continueButton.type = "button";
      const cancelButton = element("button", "cancel-button", "取りやめ");
      cancelButton.type = "button";
      continueButton.disabled = Boolean(record.busy) || !apiBaseUrl;
      cancelButton.disabled = Boolean(record.busy) || !apiBaseUrl;
      continueButton.addEventListener("click", () => continueUploadRecord(record.id));
      cancelButton.addEventListener("click", () => cancelSavedUpload(record.id));
      actions.append(continueButton, cancelButton);
      item.append(copy, actions);
      uploadResumeList.append(item);
    }
  }

  async function verifyPublishedUpload(record, work) {
    if (!work || workId(work) !== record.workId) {
      setSubmitStatus("公開結果の作品番号が一致しません。状態を確認してから続けてください。", true);
      return false;
    }
    let found;
    try {
      found = await findApiWorkById(record.workId);
    } catch (_) {
      renderWorks(API_LOAD_ERROR);
      const pendingCheck = setUploadUiRecord(record, "published", { publishedWork: work });
      setActiveUploadRecord(pendingCheck);
      setSubmitStatus("保存は完了しましたが、棚への反映をまだ確認できません。少し待ってから「続きから投稿」で再確認してください。", true);
      return false;
    }
    const listedWork = found.work;
    const confirmed = Boolean(listedWork);
    if (confirmed) {
      apiWorks = uniqueWorks([listedWork], apiWorks);
      nextCursor = found.firstPage.nextCursor;
      preferredIds = [record.workId, ...preferredIds.filter((id) => id !== record.workId)];
      renderWorks("");
      setActiveUploadRecord(null);
      activeUploadRecord = null;
      form.reset();
      selectedFile = null;
      clearFilePreview();
      clearFieldErrors();
      clearUploadRecord(record, false);
      renderWorks("");
      revealWork(record.workId);
      setSubmitStatus("棚に投稿しました。取り下げもこのブラウザ、または同じAIに頼めます。");
      return true;
    }
    apiWorks = uniqueWorks(apiWorks);
    nextCursor = found.firstPage.nextCursor;
    renderWorks("保存は完了しましたが、作品はまだ一覧で確認できません。少し待ってから再確認してください。");
    const pendingCheck = setUploadUiRecord(record, "published", { publishedWork: work });
    setActiveUploadRecord(pendingCheck);
    setSubmitStatus("保存は完了しました。棚への反映をまだ確認できないため、少し待ってから「続きから投稿」で再確認してください。", true);
    return false;
  }

  async function publishPreparedUpload(record, knownWork) {
    const url = apiEndpointUrl(record.publishUrl);
    if (!url) throw new Error("公開先を確認できませんでした。");
    if (knownWork && workId(knownWork) === record.workId) {
      await verifyPublishedUpload(record, knownWork);
      return;
    }
    setFormBusy(true, "公開しています…");
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${record.deleteToken}` },
      });
      if (!response.ok) throw new Error(await responseError(response, "公開できませんでした。続きから再試行できます"));
      let result;
      try { result = await response.json(); } catch (_) { throw new Error("公開結果を読み取れませんでした。状態を確認して続けてください。"); }
      if (!result || !result.work || workId(result.work) !== record.workId) {
        throw new Error("公開結果の作品番号が一致しません。状態を確認して続けてください。");
      }
      await verifyPublishedUpload(record, result.work);
    } catch (error) {
      setSubmitStatus(error instanceof Error ? error.message : "公開できませんでした。状態を確認して続けてください。", true);
      const failed = setUploadUiRecord(record, record.state === "ready" ? "ready" : "published");
      setActiveUploadRecord(failed);
    } finally {
      setFormBusy(false);
    }
  }

  async function sendFileToUpload(record, file) {
    if (!sameSelectedFile(record, file)) {
      setFileError("最初に選んだファイルと同じ名前・形式・サイズのファイルを選んでください。");
      setSubmitStatus("選んだファイルを確認できません。最初に選んだファイルを選び直してください。", true);
      return;
    }
    const uploadUrl = apiEndpointUrl(record.uploadUrl);
    if (!uploadUrl) {
      setSubmitStatus("ファイルの送信先を確認できませんでした。取りやめてからやり直してください。", true);
      return;
    }
    setFormBusy(true, "ファイルを送っています…");
    setSubmitStatus("ファイルを安全に送信しています…", false);
    try {
      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${record.deleteToken}`,
          "Content-Type": record.fileType === "mp4" ? "video/mp4" : "text/html",
        },
        body: file,
      });
      if (!response.ok) throw new Error(await responseError(response, "ファイルを送れませんでした。続きから再試行できます"));
      let result;
      try { result = await response.json(); } catch (_) { throw new Error("送信結果を読み取れませんでした。状態を確認して続けてください。"); }
      if (!result || result.state !== "ready") throw new Error("ファイルの準備が完了したことを確認できませんでした。状態を確認して続けてください。");
      const readyRecord = setUploadUiRecord(record, "ready", { retryAfterSeconds: 0 });
      setActiveUploadRecord(readyRecord);
      setSubmitStatus("ファイルを受け取りました。作品を棚に並べています…", false);
      await publishPreparedUpload(readyRecord);
    } catch (error) {
      setSubmitStatus(error instanceof Error ? error.message : "ファイルを送れませんでした。状態を確認して続けてください。", true);
      const waitingRecord = setUploadUiRecord(record, record.state || "pending");
      setActiveUploadRecord(waitingRecord);
    } finally {
      setFormBusy(false);
    }
  }

  async function continueUploadRecord(id) {
    if (formBusy || !apiBaseUrl) return;
    const record = uploadUiRecords.find((item) => item.id === String(id)) || getStoredUploadRecords().find((item) => item.id === String(id));
    if (!record) return;
    const current = { ...record, busy: true };
    uploadUiRecords = uploadUiRecords.map((item) => item.id === record.id ? current : item);
    renderUploadResume();
    setFormBusy(true, "状態を確認しています…");
    setSubmitStatus("投稿の状態を確認しています…", false);
    try {
      const status = await readUploadStatus(record);
      if (status.state === "expired" || status.state === "cancelled") {
        clearUploadRecord(record, true);
        setSubmitStatus(status.state === "expired" ? "この投稿は期限切れです。ファイルを選び直して投稿してください。" : "この投稿は取りやめ済みです。", true);
        return;
      }
      const updated = setUploadUiRecord(record, status.state, { retryAfterSeconds: status.retryAfterSeconds });
      setActiveUploadRecord(updated);
      showManualEntry();
      if (status.state === "ready") {
        await publishPreparedUpload(updated, status.work);
        return;
      }
      if (status.state === "published") {
        await publishPreparedUpload(updated, status.work || updated.publishedWork);
        return;
      }
      if (status.state === "uploading") {
        const seconds = status.retryAfterSeconds;
        setSubmitStatus(seconds ? `ファイル送信中のため、約${seconds}秒後に状態を再確認してください。` : "ファイル送信中のため、少し待ってから状態を再確認してください。", true);
        return;
      }
      if (selectedFile && sameSelectedFile(updated, selectedFile)) {
        await sendFileToUpload(updated, selectedFile);
      } else {
        selectedFile = null;
        workFileInput.value = "";
        clearFilePreview();
        setFileError("");
        setSubmitStatus("最初に選んだファイルを選び直してください。名前・形式・サイズが一致したら「続きから投稿」を押してください。", false);
        workFileInput.focus();
        fileUploadFields.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } catch (error) {
      if (error && error.expired) {
        clearUploadRecord(record, true);
        setSubmitStatus(error.message, true);
      } else {
        const stale = { ...record, busy: false, uiState: record.state || "unknown" };
        uploadUiRecords = uploadUiRecords.map((item) => item.id === record.id ? stale : item);
        setSubmitStatus(error instanceof Error ? error.message : "投稿の状態を確認できませんでした。通信状態を確かめてください。", true);
      }
    } finally {
      const currentRecord = uploadUiRecords.find((item) => item.id === record.id);
      if (currentRecord && currentRecord.busy) {
        uploadUiRecords = uploadUiRecords.map((item) => item.id === record.id ? { ...item, busy: false } : item);
      }
      renderUploadResume();
      setFormBusy(false);
    }
  }

  async function cancelSavedUpload(id) {
    if (formBusy || !apiBaseUrl) return;
    const record = uploadUiRecords.find((item) => item.id === String(id)) || getStoredUploadRecords().find((item) => item.id === String(id));
    if (!record) return;
    uploadUiRecords = uploadUiRecords.map((item) => item.id === record.id ? { ...item, busy: true } : item);
    renderUploadResume();
    setFormBusy(true, "投稿を取りやめています…");
    setSubmitStatus("投稿を取りやめています…", false);
    try {
      const response = await cancelUploadRequest(record);
      if (response.status === 404 || response.status === 410) {
        clearUploadRecord(record, true);
        setSubmitStatus("投稿の受付はすでに終了しています。", false);
        return;
      }
      if (!response.ok) throw new Error(await responseError(response, "投稿を取りやめできませんでした"));
      clearUploadRecord(record, true);
      if (activeUploadRecord && activeUploadRecord.id === record.id) setActiveUploadRecord(null);
      setSubmitStatus("投稿を取りやめました。", false);
    } catch (error) {
      setSubmitStatus(error instanceof Error ? error.message : "投稿を取りやめできませんでした。通信状態を確かめてください。", true);
    } finally {
      uploadUiRecords = uploadUiRecords.map((item) => item.id === record.id ? { ...item, busy: false } : item);
      renderUploadResume();
      setFormBusy(false);
    }
  }

  async function loadUploadRecovery() {
    uploadUiRecords = getStoredUploadRecords();
    for (const record of uploadUiRecords) memoryTokens.set(record.workId, record.deleteToken);
    renderUploadResume();
    if (!apiBaseUrl || !uploadUiRecords.length) return;
    const records = [...uploadUiRecords];
    let expiredFound = false;
    await Promise.all(records.map(async (record) => {
      try {
        const status = await readUploadStatus(record);
        if (status.state === "expired" || status.state === "cancelled") {
          if (status.state === "expired") expiredFound = true;
          clearUploadRecord(record, true);
          return;
        }
        setUploadUiRecord(record, status.state, { retryAfterSeconds: status.retryAfterSeconds });
      } catch (error) {
        if (error && error.expired) {
          expiredFound = true;
          clearUploadRecord(record, true);
        }
        else {
          const position = uploadUiRecords.findIndex((item) => item.id === record.id);
          if (position >= 0) uploadUiRecords[position] = { ...record, uiState: "unknown" };
        }
      }
    }));
    renderUploadResume();
    if ((uploadUiRecords.length || expiredFound) && panel.hidden) openSubmitPanel(openButtons[0] || null);
    if (expiredFound) setSubmitStatus("期限切れの投稿受付を片付けました。ファイルを選び直して投稿できます。", true);
  }

  function formValues() {
    return {
      author: document.getElementById("author-input").value.trim(),
      profile: profileInput.value.trim(),
      title: document.getElementById("title-input").value.trim(),
      description: document.getElementById("description-input").value.trim(),
      consent: true,
    };
  }

  async function submitFileWork() {
    if (!preflightTokenStorage()) {
      setSubmitStatus("この端末では取り下げに必要な情報を保存できないため、投稿を中止しました。ブラウザの保存設定を確認してください。", true);
      return;
    }
    const file = selectedFile;
    const fields = formValues();
    const body = {
      ...fields,
      fileName: file.name,
      fileType: fileType(file),
      fileSize: file.size,
    };
    setFormBusy(true, "投稿を受け付けています…");
    try {
      const response = await fetch(`${apiBaseUrl}/api/uploads`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setSubmitStatus(await responseError(response, "投稿を受け付けできませんでした"), true);
        return;
      }
      let result;
      try { result = await response.json(); } catch (_) { throw new Error("受付結果を読み取れませんでした。状態を確認してください。"); }
      const record = result && {
        id: typeof result.id === "string" ? result.id : "",
        workId: typeof result.workId === "string" ? result.workId : "",
        deleteToken: typeof result.deleteToken === "string" ? result.deleteToken : "",
        uploadUrl: typeof result.uploadUrl === "string" ? result.uploadUrl : "",
        publishUrl: typeof result.publishUrl === "string" ? result.publishUrl : "",
        statusUrl: typeof result.statusUrl === "string" ? result.statusUrl : "",
        expiresAt: result.expiresAt || "",
        fileName: file.name,
        fileType: fileType(file),
        fileSize: file.size,
        ...fields,
        state: "pending",
      };
      if (!uploadRecordIsValid(record)) {
        if (record && record.id.startsWith("upload-") && record.workId.startsWith("community-") && record.deleteToken) {
          try { await cancelUploadRequest(record); } catch (_) { /* report the incomplete preparation without exposing its token */ }
        }
        throw new Error("受付情報を安全に保存できないため、ファイルを送りませんでした。少し待って棚を確認してください。");
      }
      if (!persistUploadRecord(record)) {
        let cancelled = false;
        try {
          const cancelResponse = await cancelUploadRequest(record);
          if (!cancelResponse.ok && cancelResponse.status !== 404 && cancelResponse.status !== 410) {
            throw new Error("投稿受付を取りやめできませんでした。");
          }
          cancelled = true;
        } catch (_) {
          memoryTokens.set(record.workId, record.deleteToken);
          uploadUiRecords.push({ ...record, uiState: "pending" });
          renderUploadResume();
          setSubmitStatus("取り下げ情報を保存できず、準備の取りやめも確認できませんでした。ページを閉じずに「取りやめ」を再試行してください。", true);
          return;
        }
        if (cancelled) clearUploadRecord(record, true);
        setSubmitStatus("この端末に取り下げ情報を保存できなかったため、投稿受付を取りやめました。ブラウザの保存設定を確認してください。", true);
        return;
      }
      activeUploadRecord = record;
      uploadUiRecords.push({ ...record, uiState: "pending" });
      setActiveUploadRecord(record);
      renderUploadResume();
      await sendFileToUpload(record, file);
    } catch (error) {
      setSubmitStatus(error instanceof Error ? error.message : "投稿を受け付けできませんでした。通信状態を確認してください。", true);
    } finally {
      setFormBusy(false);
    }
  }

  async function submitUrlWork() {
    if (!preflightTokenStorage()) {
      setSubmitStatus("この端末では取り下げに必要な情報を保存できないため、投稿を中止しました。ブラウザの保存設定を確認してください。", true);
      return;
    }
    const body = { ...formValues(), workUrl: workUrlInput.value.trim() };
    setFormBusy(true, "投稿しています…");
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
      const tokenProvided = typeof result.deleteToken === "string" && Boolean(result.deleteToken);
      let tokenStored = false;
      if (tokenProvided) {
        memoryTokens.set(createdId, result.deleteToken);
        try {
          window.localStorage.setItem(tokenStorageKey(createdId), result.deleteToken);
          tokenStored = window.localStorage.getItem(tokenStorageKey(createdId)) === result.deleteToken;
        } catch (_) { tokenStored = false; }
      }

      if (tokenProvided && !tokenStored) {
        try {
          const removeResponse = await fetch(`${apiBaseUrl}/api/works/${encodeURIComponent(createdId)}`, {
            method: "DELETE",
            headers: { Accept: "application/json", Authorization: `Bearer ${result.deleteToken}` },
          });
          if (!removeResponse.ok) throw new Error(await responseError(removeResponse, "投稿の取り下げを確認できませんでした"));
          const remaining = await findApiWorkById(createdId);
          if (remaining.work) throw new Error("棚に作品が残っていることを確認しました。");
          removedIds.add(createdId);
          preferredIds = preferredIds.filter((id) => id !== createdId);
          apiWorks = apiWorks.filter((work) => workId(work) !== createdId);
          memoryTokens.delete(createdId);
          try { window.localStorage.removeItem(tokenStorageKey(createdId)); } catch (_) { /* no token is needed after verified removal */ }
          form.reset();
          selectedFile = null;
          clearFilePreview();
          clearFieldErrors();
          updateEntryMode();
          renderWorks("");
          setSubmitStatus("取り下げ情報を保存できなかったため、自動で投稿を取り下げ、棚から消えたことを確認しました。ブラウザの保存設定を確認してください。", true);
          return;
        } catch (error) {
          await refreshAfterPost(createdId, createdWork);
          revealWork(createdId);
          setSubmitStatus("取り下げ情報を保存できず、自動の取り下げも確認できませんでした。このページを閉じず、作品カードの「自分の投稿を取り下げる」から再試行してください。", true);
          return;
        }
      }

      const confirmed = await refreshAfterPost(createdId, createdWork);
      form.reset();
      selectedFile = null;
      clearFilePreview();
      clearFieldErrors();
      updateEntryMode();
      revealWork(createdId);
      if (!tokenProvided) setSubmitStatus("投稿は保存されましたが、取り下げ用トークンを受け取れませんでした。", true);
      else if (!confirmed) setSubmitStatus("投稿は保存されましたが、棚で再確認できませんでした。再読み込みしてください。", true);
      else setSubmitStatus("棚に投稿しました。");
    } catch (error) {
      setSubmitStatus(error instanceof Error ? error.message : "投稿できませんでした。通信状態を確認して、もう一度お試しください。", true);
    } finally {
      setFormBusy(false);
    }
  }

  async function submitWork(event) {
    event.preventDefault();
    if (formBusy) return;
    setSubmitStatus("", false);
    if (!apiBaseUrl) {
      setSubmitStatus("投稿機能は公開前の準備中です。", true);
      return;
    }
    if (activeUploadRecord) {
      await continueUploadRecord(activeUploadRecord.id);
      return;
    }
    if (!validateForm()) return;
    if (currentEntryMode() === "file") await submitFileWork();
    else await submitUrlWork();
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
  copyPromptButton.addEventListener("click", copyAiPrompt);
  showManualFormButton.addEventListener("click", showManualEntry);
  backToAiPromptButton.addEventListener("click", () => {
    showAiPrompt();
    copyPromptButton.focus();
  });
  form.addEventListener("submit", submitWork);
  moreButton.addEventListener("click", loadMoreWorks);

  if (!apiBaseUrl) {
    apiNotice.textContent = "投稿機能は公開前の準備中です。";
    apiNotice.hidden = false;
    submitButton.disabled = true;
  }

  window.addEventListener("hashchange", restoreWorkFragment);
  loadInitialWorks().then(() => window.requestAnimationFrame(restoreWorkFragment));
  loadUploadRecovery();
})();
