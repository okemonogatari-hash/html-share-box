# 飛び出す絵本ムービー：AIさん向けの最初の手順

このページは、頼んだ人から「このページを読んで、飛び出す絵本のムービーを作って」と言われた Claude Code が読むための物です。頼んだ人は、何もダウンロードしていません。下の3つを、あなたが進めてください。

## 1. 作り方の箱（スキル）を取ってきて、開く

いま開いている作業フォルダの中で：

```bash
curl -L -o tobidasu-ehon.skill "https://okemonogatari-hash.github.io/html-share-box/ehon-kit/tobidasu-ehon.skill"
unzip -q -o tobidasu-ehon.skill -d .     # → ./tobidasu-ehon/ ができる（zip です。約8MB）
```

`./tobidasu-ehon/SKILL.md` を最初から最後まで読み、そこに書いてある順で作ります。「このスキルのフォルダ」は `./tobidasu-ehon` です。土台・道具・見本・書体は、全部その中に入っています。

## 2. お手本を見てから作る

作り始める前に、お手本のコマ一覧を取ってきて、開いて見てください。紙の立体感・影・ぼけ・キャラの動きは、この水準を目指します。

```bash
curl -L -o otehon_cafe.jpg "https://okemonogatari-hash.github.io/html-share-box/ehon-kit/v/cafe_sheet.jpg"
curl -L -o otehon_aozora.jpg "https://okemonogatari-hash.github.io/html-share-box/ehon-kit/v/aozora_sheet.jpg"
```

動画でも見られます：`https://okemonogatari-hash.github.io/html-share-box/ehon-kit/v/cafe.mp4`・`https://okemonogatari-hash.github.io/html-share-box/ehon-kit/v/undokai.mp4`

## 3. 頼んだ人との進め方

- 足りない道具（Node.js 20 以上・ffmpeg・Python3 と numpy と Pillow・Google Chrome）があれば、SKILL.md の道具の確かめが教えてくれます。入れ方を頼んだ人に伝えて、一緒に入れてください。
- 題材が1行だけでも始められます。見る人・言ってほしい一言・画面に出す事実（日付・時刻・場所・名前）が足りない時は、最初に1回だけまとめて聞きます。事実は、頼んだ人の言葉の外から足しません。
- 最初の10秒くらいの試しが出来たら、全部を作る前に動画の場所を伝えて、一言もらいます。
- 完成の物差しは1つ：見た人が、思わず声を出すか。迷ったら楽しい方へ。
