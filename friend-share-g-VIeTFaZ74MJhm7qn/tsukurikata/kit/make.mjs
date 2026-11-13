// 使い方（どのOSでも同じ。パスは / で書いてよい）
//   node make.mjs snap 1,5,9        … その秒のコマを preview/ に PNG で（試しの確かめ）
//   node make.mjs video [幅]         … 無音の映像 renders/silent.mp4（幅を 1280 にすると速い試し）
//   node make.mjs audio              … story.js の music と sfx から曲と効果音を作る renders/sound.wav
//   node make.mjs finish             … 映像と音を合わせる renders/movie.mp4（音量をそろえる）と軽い版 movie_720p.mp4
//   node make.mjs sheet [mp4]        … 2秒おきのコマ一覧 preview/sheet.jpg（お手本の mp4 にも使える）
import puppeteer from 'puppeteer';
import ffmpegPath from 'ffmpeg-static';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { spawn } from 'node:child_process'; import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const [cmd, a1] = process.argv.slice(2);
const { STORY: S } = await import(pathToFileURL(path.join(root, 'story.js')).href + '?' + Date.now());
fs.mkdirSync(path.join(root, 'renders'), { recursive: true }); fs.mkdirSync(path.join(root, 'preview'), { recursive: true });
const ff = (args, input) => new Promise((ok, ng) => { const p = spawn(ffmpegPath, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: [input ? 'pipe' : 'ignore', 'inherit', 'inherit'] });
  p.on('close', c => c === 0 ? ok() : ng(new Error('ffmpeg ' + c))); if (input) input(p.stdin); });

async function openPage() {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.json': 'application/json' };
  const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
    fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const args = ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'];
  let browser;
  try { browser = await puppeteer.launch({ headless: true, args }); }
  catch (e) {  // 付属のブラウザが入っていない時は、OS のブラウザを使う（Windows は Edge が必ずある）
    const cands = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'];
    const exe = process.env.CHROME_PATH || cands.find(p => fs.existsSync(p)); if (!exe) throw e;
    console.log('付属のブラウザが無いので、これを使う:', exe); browser = await puppeteer.launch({ headless: true, args, executablePath: exe });
  }
  const page = await browser.newPage(); await page.setViewport({ width: S.w, height: S.h, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.log('絵のエラー:', e.message));
  await page.goto(`http://127.0.0.1:${srv.address().port}/scene.html`);
  await page.waitForFunction(() => window.ready, { timeout: 60000 });
  return { page, done: async () => { await browser.close(); srv.close(); } };
}

if (cmd === 'snap') {
  const { page, done } = await openPage();
  for (const t of (a1 || '1,5,9').split(',').map(Number)) {
    await page.evaluate(t => window.renderAt(t), t);
    const f = path.join(root, 'preview', `t${t.toFixed(1).padStart(4, '0')}.png`); await page.screenshot({ path: f }); console.log(f);
  }
  await done();
} else if (cmd === 'video') {
  const w = Number(a1) || S.w, out = path.join(root, 'renders', 'silent.mp4'), n = Math.round(S.duration * S.fps), st = Date.now();
  const { page, done } = await openPage();
  let stdin; const job = ff(['-f', 'image2pipe', '-framerate', String(S.fps), '-c:v', 'mjpeg', '-i', '-', '-vf', `scale=${w}:-2`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], s => stdin = s);
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => window.renderAt(t), i / S.fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!stdin.write(buf)) await new Promise(r => stdin.once('drain', r));
    if (i % (S.fps * 5) === 0) console.log(`${(i / S.fps).toFixed(0)}秒目 / ${S.duration}秒`);
  }
  stdin.end(); await job; await done(); console.log('できた', out, ((Date.now() - st) / 1000).toFixed(0) + '秒かかった');
} else if (cmd === 'audio') {
  const SR = 44100, N = Math.ceil(S.duration * SR), L = new Float32Array(N), R = new Float32Array(N);
  const { bpm, root: rn, drop } = S.music, beat = 60 / bpm, hz = m => 440 * Math.pow(2, (m - 69) / 12);
  let sd = 3; const nz = () => ((sd = (sd * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const add = (t0, len, fn, gain, pan = 0) => { const s0 = Math.floor(t0 * SR); for (let i = 0; i < len * SR; i++) { const j = s0 + i; if (j >= N) break; const v = fn(i / SR) * gain; L[j] += v * (1 - pan); R[j] += v * (1 + pan); } };
  const prog = [[0, 4, 7, 11], [7, 11, 14, 17], [9, 12, 16, 19], [5, 9, 12, 16]];   // I V vi IV
  for (let bar = 0; bar * 4 * beat < S.duration; bar++) {
    const t0 = bar * 4 * beat, ch = prog[bar % 4], after = t0 >= drop;
    ch.forEach((n, k) => add(t0, 4 * beat, x => Math.sin(2 * Math.PI * hz(rn + 12 + n) * x) * Math.min(1, x * 3) * Math.exp(-x * .4), .045, k % 2 ? .3 : -.3));
    for (let b = 0; b < 8; b++) {                                     // 8分の分散和音
      const n = ch[(b * 3) % 4] + (b % 2 ? 12 : 0), tt = t0 + b * beat / 2;
      add(tt, .4, x => Math.sin(2 * Math.PI * hz(rn + 24 + n) * x) * Math.exp(-x * 9), after ? .07 : .045, b % 2 ? .4 : -.4);
    }
    if (after) for (let b = 0; b < 4; b++) {
      const tt = t0 + b * beat;
      add(tt, .35, x => Math.sin(2 * Math.PI * (50 + 90 * Math.exp(-x * 30)) * x) * Math.exp(-x * 9), .5);   // キック
      add(tt + beat / 2, .06, () => nz() * .5, .06, .2);                                              // ハイハット
      add(tt, beat, x => Math.sin(2 * Math.PI * hz(rn - 12 + ch[0]) * x) * Math.exp(-x * 3), .18);      // ベース
    }
  }
  const SFX = {
    pop: x => Math.sin(2 * Math.PI * (600 + 900 * Math.exp(-x * 40)) * x) * Math.exp(-x * 25),
    tick: x => Math.sin(2 * Math.PI * 1800 * x) * Math.exp(-x * 60),
    ding: x => (Math.sin(2 * Math.PI * 1318 * x) + .5 * Math.sin(2 * Math.PI * 2637 * x)) * Math.exp(-x * 3),
    chime: x => [1046, 1318, 1568].reduce((s, f, i) => s + (x > i * .08 ? Math.sin(2 * Math.PI * f * (x - i * .08)) * Math.exp(-(x - i * .08) * 4) : 0), 0) * .6,
    whoosh: x => nz() * Math.sin(Math.PI * Math.min(1, x / .7)) * .5
  };
  for (const e of S.sfx) add(e.t, e.s === 'whoosh' ? .7 : 1.2, SFX[e.s] || SFX.pop, .35);
  const fade = Math.min(N, SR * 1.5); for (let i = 0; i < fade; i++) { const k = i / fade; L[N - 1 - i] *= k; R[N - 1 - i] *= k; }
  const buf = Buffer.alloc(44 + N * 4); buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(Math.tanh(L[i]) * 32000), 44 + i * 4); buf.writeInt16LE(Math.round(Math.tanh(R[i]) * 32000), 46 + i * 4); }
  const out = path.join(root, 'renders', 'sound.wav'); fs.writeFileSync(out, buf); console.log('できた', out);
} else if (cmd === 'finish') {
  const v = path.join(root, 'renders', 'silent.mp4'), a = path.join(root, 'renders', 'sound.wav'), out = path.join(root, 'renders', 'movie.mp4');
  await ff(['-i', v, '-i', a, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-shortest', '-movflags', '+faststart', out]);
  await ff(['-i', out, '-vf', 'scale=1280:-2', '-c:v', 'libx264', '-crf', '23', '-c:a', 'copy', '-movflags', '+faststart', path.join(root, 'renders', 'movie_720p.mp4')]);
  console.log('できた', out, 'と movie_720p.mp4');
} else if (cmd === 'sheet') {
  const src = a1 || path.join(root, 'renders', 'movie.mp4'), out = path.join(root, 'preview', 'sheet.jpg');
  await ff(['-i', src, '-vf', 'fps=1/2,scale=480:-2,tile=4x4:padding=6', '-frames:v', '1', '-q:v', '3', out]); console.log('できた', out);
} else console.log('使い方は make.mjs の先頭を見てください');
