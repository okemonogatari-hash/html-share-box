# 1分ムービー：AIさん向けの手順

このページは、頼んだ人から「このページを読んで、一緒に1分ムービーを作ってください」と言われた Claude Code が読むための物です。頼んだ人は何もダウンロードしていません。上から順に、あなたが進めてください。コマンドは、あなたのシェル（Mac・Windows の Git Bash なら bash、PowerShell なら下の別の書き方）でそのまま動きます。

お手本（この水準を目指します。どれも音つき・約1分）：
- 箱庭のような立体の世界：https://github.com/okemonogatari-hash/html-share-box/releases/download/sasurai-motion-20261113/g-mKtMApS-nzOH-hakoniwa-v3.mp4
- 方眼のような図の世界：https://github.com/okemonogatari-hash/html-share-box/releases/download/sasurai-motion-20261113/g-mKtMApS-nzOH-hougan-v2.mp4
- 飛び出す絵本：https://github.com/okemonogatari-hash/html-share-box/releases/download/sasurai-motion-20261113/g-mKtMApS-nzOH-ehon-v3.mp4

## 1. 頼んだ人に3つ聞く

1. 何のムービーか（例：事務所の紹介、知り合いのお店の紹介）
2. だれが見て、見終わって何と声に出してほしいか（例：「この人に頼みたい」）
3. 材料：自分で書いた文章（ホームページのURL・プロフィール・一問一答）と、使ってよい写真

画面に出す名前・数字・地名・経歴は、頼んだ人の文に書いてある事だけにします。足したくなった事は、足さずに聞きます。

世界は3つから選びます。頼んだ人に好みが無ければ、題材に合う方をあなたが決めます。
- **方眼の図の世界・箱庭の立体の世界** → このまま 2 へ
- **飛び出す絵本** → 別のキットがあります。`https://okemonogatari-hash.github.io/html-share-box/ehon-kit/start.md` を読んで、そちらの手順で進めます（Windows の時は、そのキットの語りの声が Mac 専用なので、語り無しで作ります）

## 2. 道具をそろえる（Node.js 22 以上）

```bash
node -v
```

- 22 以上と出れば次へ。
- 無い・古い時：Windows は `winget install OpenJS.NodeJS.LTS`、Mac は `brew install node`（Homebrew が無ければ https://nodejs.org の LTS を入れてもらう）。入れたら Claude Code を開き直すと `node` が見えるようになります。

ffmpeg とブラウザは、次の `npm install` で作業フォルダの中に入ります（自分で入れる必要はありません）。Python も要りません。

## 3. 作業フォルダを作り、土台を取る

作業フォルダの場所は、パスに日本語と空白が入らない所にします。今いるフォルダのパスに日本語や空白が入っている時は、Windows なら `C:/Users/Public/movie-kit`、Mac なら `~/movie-kit` に作ります。

bash（Mac・Git Bash）：

```bash
mkdir -p movie-kit && cd movie-kit
BASE=https://okemonogatari-hash.github.io/html-share-box/friend-share-g-VIeTFaZ74MJhm7qn/tsukurikata/kit
for f in package.json make.mjs scene.html scene.js story.js; do curl -fsSL -o "$f" "$BASE/$f"; done
npm install
```

PowerShell：

```powershell
mkdir movie-kit; cd movie-kit
$BASE = "https://okemonogatari-hash.github.io/html-share-box/friend-share-g-VIeTFaZ74MJhm7qn/tsukurikata/kit"
foreach ($f in "package.json","make.mjs","scene.html","scene.js","story.js") { curl.exe -fsSL -o $f "$BASE/$f" }
npm install
```

`npm install` は数分かかります（ブラウザを1つ取ってくるため）。中身：

| ファイル | 役目 |
|---|---|
| `story.js` | 台本。字・秒・色・曲の速さ・効果音の秒。**最初に書き替えるのはここ** |
| `scene.js` | 絵。すべて時間 `t` の関数 `renderAt(t)`。見本は方眼の世界 |
| `make.mjs` | 撮る・音を作る・合わせる（使い方は先頭に） |

## 4. 試しを作って見せる

まず見本のまま動くかを確かめます。

```bash
node make.mjs snap 1,5,9,12,14
```

`preview/` にできた PNG を開いて目で見ます。見えたら、頼んだ人の題材に書き替えます。

- `story.js`：`beats` の字を頼んだ人の言葉に。`duration` は試しなら 15、通しなら 60。秒を伸ばしたら beat の `from`・`to` と `sfx` の `t` も伸ばす。
- `scene.js`：題材の物を描き足す（パン屋ならパン、測量なら測量の点と線）。字と色だけ替えた試しは、看板だけ違う見本になります。写真を使う時は作業フォルダに置き、`new Image()` で読んで `renderAt` の中で描きます（読み終わってから `window.ready = true` にする）。

描き替えたら、また `snap` してコマを見ます。字の欠け・はみ出し・重なり・小さすぎる字が無くなるまで直します。

次に最初の15秒を、音つきで頼んだ人に見せます。

```bash
node make.mjs video 1280
node make.mjs audio
node make.mjs finish
```

`renders/movie.mp4` ができます。頼んだ人に場所を伝えて見てもらい、一言もらいます（「字をもっと大きく」など）。直しは1回に1か所。

## 5. 通しを作る

`duration` を 60 にして、beats と sfx を足し、同じ3つのコマンドを `video`（幅なし＝1920）で流します。できたら：

```bash
node make.mjs sheet
```

`preview/sheet.jpg`（2秒おきのコマ一覧）を開いて、全部目で見ます。お手本の mp4 を取ってきて `node make.mjs sheet otehon.mp4` とすれば、お手本のコマ一覧と並べて見られます。

渡す物：`renders/movie.mp4`（1920×1080・音つき）と `renders/movie_720p.mp4`（スマホで送る軽い版）。

## 6. もっと遊ぶ時

- **箱庭の立体の世界**にしたい時：`npm install three` を足し、`scene.js` を Three.js で書きます。形は同じ（`renderAt(t)` で1コマを決まった形に描く・最後に `window.ready = true`）。`WebGLRenderer` には `preserveDrawingBuffer: true` を付けます。空に浮かぶ箱庭の町、もやから青空へ晴れる、カメラが止まらずゆっくり回る、がお手本の芯です。
- 曲と効果音は `make.mjs audio` がコードで作ります。曲の速さは `music.bpm`、盛り上がりの秒は `music.drop`。手持ちの曲を使う時は、頼んだ人が使ってよいと言った物だけにして、`renders/sound.wav` を差し替えて `finish` します。
- 音はあなたには聞こえません。音の良し悪しは、頼んだ人の耳で聞いてもらいます。

## 困った時

| 起きた事 | やる事 |
|---|---|
| `npm install` でブラウザの取得に失敗した | そのままでよい。`make.mjs` は、Windows なら Edge、Mac なら Chrome を自動で使います。別の場所なら `CHROME_PATH` にブラウザの実行ファイルを入れる |
| 字が四角（□）になる | `scene.js` の `FONT` に、その PC にある日本語の書体名を足す（Windows は Yu Gothic・Meiryo、Mac は Hiragino Sans） |
| `node` が見つからない（入れた直後） | Claude Code を開き直してもらう |
| パスの日本語でエラー | 3 の「日本語と空白が入らない所」に作り直す |
| 書き出しが遅い | `video 1280` で試し、通しだけ 1920 にする |
