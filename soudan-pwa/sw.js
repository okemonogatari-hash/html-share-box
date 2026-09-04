/* おけもん相談所 PWA — オフライン最優先の Service Worker
 *
 * 設計方針（ここが工夫の本体）
 *  1. ページ表示は必ずキャッシュから返す（cache-first）。ネットワークを一切待たない。
 *     → 圏外・機内モード・Wi-Fiが死んでる会議室でも、タップした瞬間に開く。
 *  2. 更新は開いた後に裏で取ってくる（stale-while-revalidate）。反映は次回起動時。
 *     → 「起動が遅い」と「古いまま」を両立させずに解決する。
 *  3. 取ってきたものが本物か検査してからキャッシュに焼く。
 *     → Cloudflare Access などのログイン画面・エラーページ・キャプティブポータル
 *       （空港やホテルWi-Fiの認証画面）が返ってきても、絶対にアプリを壊さない。
 *       検査に落ちたら、いま持っている正しいページをそのまま使い続ける。
 *  4. フォントも初回インストール時に取り込む。落ちてもインストールは成功させる。
 */

const VERSION   = 'okemon-soudan-v4';
const CACHE     = VERSION;
const MARKER    = 'OKEMON-SOUDAN-OK';        // 本物のページにだけ入っている合言葉
/* ページの取得先は './index.html' ではなく './'。
 * Cloudflare Pages は /index.html を / へ 308リダイレクトするため、
 * './index.html' で取ると下の「リダイレクトされたものは信用しない」検査に
 * 自分で引っかかってインストールが中止される（2026-08-24 本番で踏んだ）。
 * localhost では起きず、本番でだけ出る差。 */
const PAGE      = './';

/* インストール時に必ず持っておくもの（同一オリジン） */
const ASSETS = [
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
];

/* ---------- 本物かどうかの検査 ---------- */
async function isRealPage(res) {
  if (!res || !res.ok) return false;
  if (res.redirected) return false;                 // 認証画面などへ飛ばされた
  if (res.type === 'opaqueredirect') return false;
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('text/html')) return false;
  try {
    const text = await res.text();
    return text.includes(MARKER);                   // 合言葉があるものだけ本物
  } catch (e) {
    return false;
  }
}

/* ---------- フォントの取り込み（best-effort・上限つき） ----------
 * このページ自体は端末のフォント（ヒラギノ等）で組んでいるので、通常ここは
 * 何もしない。外部フォントを使う版に作り替えた時のための安全網として残す。
 *
 * 上限を置いている理由：最初の版では日本語Notoを丸ごと抱えてしまい、
 * フォントだけで 11.9MB（ページ本体の22倍）になった。容量が大きいほど
 * 端末に消されやすく、初回インストールも遅い。2MBで打ち切る。 */
const FONT_BUDGET = 2 * 1024 * 1024;

async function cacheFonts(cache) {
  let spent = 0;
  const cssUrls = [];
  try {
    const page = await cache.match(PAGE);
    if (!page) return;
    const html = await page.text();
    const re = /https:\/\/fonts\.googleapis\.com\/css2\?[^"']+/g;
    let m;
    while ((m = re.exec(html)) !== null) cssUrls.push(m[0].replace(/&amp;/g, '&'));
  } catch (e) { return; }

  for (const cssUrl of cssUrls) {
    try {
      const res = await fetch(cssUrl, { mode: 'cors' });
      if (!res.ok) continue;
      const css = await res.clone().text();
      await cache.put(cssUrl, res);
      const files = css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+/g) || [];
      for (const u of files) {
        if (spent >= FONT_BUDGET) break;          // 予算切れ。ここで静かに止める
        try {
          const f = await fetch(u, { mode: 'cors' });
          if (!f.ok) continue;
          const size = (await f.clone().blob()).size;
          if (spent + size > FONT_BUDGET) continue;
          await cache.put(u, f);
          spent += size;
        } catch (e) { /* 1本落ちても続ける */ }
      }
    } catch (e) { /* 取れなくても進む */ }
  }
}

/* ---------- install ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);

    // ページ本体だけは検査つきで確実に入れる
    const res = await fetch(PAGE, { cache: 'reload' });
    if (!(await isRealPage(res.clone()))) {
      throw new Error('本物のページが取得できなかったので、インストールを中止した');
    }
    await cache.put(PAGE, res);

    // 画像・manifest（落ちても止めない）
    await Promise.allSettled(ASSETS.map(async (u) => {
      const r = await fetch(u, { cache: 'reload' });
      if (r.ok) await cache.put(u, r);
    }));

    await cacheFonts(cache);
    await self.skipWaiting();
  })());
});

/* ---------- activate ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* ---------- 裏での更新 ---------- */
async function refreshPage(cache) {
  try {
    const res = await fetch(PAGE, { cache: 'reload' });
    if (await isRealPage(res.clone())) {
      await cache.put(PAGE, res);
    }
    // 検査に落ちた場合は何もしない＝いま持っている正しいページを守る
  } catch (e) { /* オフラインなら当然ここに来る。正常 */ }
}

/* ---------- fetch ---------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // ① ページを開く時（ホーム画面アイコンからの起動もここ）
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(PAGE);
      if (cached) {
        event.waitUntil(refreshPage(cache));   // 即返してから、裏で更新
        return cached;
      }
      try {
        const res = await fetch(req);
        if (await isRealPage(res.clone())) await cache.put(PAGE, res.clone());
        return res;
      } catch (e) {
        return new Response(FALLBACK, {
          status: 200,
          headers: { 'content-type': 'text/html;charset=utf-8' },
        });
      }
    })());
    return;
  }

  // ② それ以外（画像・フォント）はキャッシュ優先、無ければ取りに行く
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreVary: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok && (res.type === 'basic' || res.type === 'cors')) {
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    } catch (e) {
      return new Response('', { status: 504 });
    }
  })());
});

/* キャッシュもネットも無い、本当の初回オフライン時だけ出る画面 */
const FALLBACK = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>おけもん相談所</title>
<style>
 body{margin:0;min-height:100vh;display:grid;place-items:center;background:#FBF8F3;color:#1F1B16;
      font-family:'Hiragino Sans','Hiragino Kaku Gothic ProN',system-ui,sans-serif;line-height:1.9;padding:24px}
 .box{max-width:380px;text-align:center}
 h1{font-family:'Hiragino Mincho ProN',serif;font-size:19px;margin:0 0 12px}
 p{font-size:14.5px;color:#4A4239;margin:0 0 18px}
 b{color:#8A5A2B}
</style></head><body><div class="box">
<h1>まだ中身を持っていません</h1>
<p>一度だけネットにつないだ状態で開いてください。<br>
そのあとは<b>ネットが無くても開けます</b>。</p>
</div></body></html>`;
