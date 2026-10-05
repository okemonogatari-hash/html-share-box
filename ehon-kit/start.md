# 飛び出す絵本ムービー：AIさん向けの最初の手順

このページは、頼んだ人から「このページを読んで、飛び出す絵本のムービーを作って」と言われた Claude Code が読むための物です。頼んだ人は、何もダウンロードしていません。下の3つを、あなたが進めてください。

## 1. 作り方の箱（スキル）を取ってきて、開く

頼んだ人は、普段使っているフォルダで Claude Code を開いています。そのフォルダを散らかさないように、中に作業用のフォルダを1つ作って、そこで進めます。

```bash
mkdir -p ehon-movie && cd ehon-movie
curl -L -o tobidasu-ehon.skill "https://okemonogatari-hash.github.io/html-share-box/ehon-kit/tobidasu-ehon.skill"
unzip -q -o tobidasu-ehon.skill -d .     # → ./tobidasu-ehon/ ができる（zip です。約8MB）
```

普段のフォルダにある物（題材のメモ、お店や教室の説明、キャラの立ち絵、前に作った物）は、題材に関わる所を先に読んで、台本と絵に生かします。画面に出す事実は、頼んだ人の文と、そこで見つけた文に書いてある物だけにします。

`./tobidasu-ehon/SKILL.md` を最初から最後まで読み、そこに書いてある順で作ります。「このスキルのフォルダ」は `ehon-movie/tobidasu-ehon` です。土台・道具・見本・書体は、全部その中に入っています。

## 2. お手本を見てから作る

作り始める前に、お手本のコマ一覧を取ってきて、開いて見てください。紙の立体感・影・ぼけ・キャラの動きは、この水準を目指します。

```bash
curl -L -o otehon_cafe.jpg "https://okemonogatari-hash.github.io/html-share-box/ehon-kit/v/cafe_sheet.jpg"
curl -L -o otehon_aozora.jpg "https://okemonogatari-hash.github.io/html-share-box/ehon-kit/v/aozora_sheet.jpg"
```

動画でも見られます：`https://okemonogatari-hash.github.io/html-share-box/ehon-kit/v/cafe.mp4`・`https://okemonogatari-hash.github.io/html-share-box/ehon-kit/v/undokai.mp4`

## 3. 題材の世界に、絵を描き替える（ここがいちばん大事）

見本は「図書館のおはなし会」です。字と色を替えただけだと、看板だけ違う図書館の動画になります（実際にそうなった試しがあります）。頼んだ人が見たいのは、自分の題材が紙の世界になって飛び出す所です。

- `film/sc_cover.js` と `film/sc_spread.js` を、題材の世界として書き直します。建物の形、台の上の絵、まわりの小物、聞き手の子まで、題材の物に替えます。
- **題材ならではの物を3つ以上、紙で立てます。** パン教室なら、ふくらむパン・オーブン・麺棒とエプロン。運動会なら、万国旗・玉入れのかご・ゴールテープ。1つは動かします（ふくらむ・回る・飛ぶ）。
- 持ち物や料金のように、見本に置き場の無い事実は、札を1枚足して画面に出します。
- 案内役は、題材の役が一目で分かる服や小物にします（`tools/make_paper_doll.py` の冒頭に作り方。作ったら `tools/prep_assets.py`）。
- 書き直したら `bash tools/snap.sh` で撮って、お手本のコマ一覧と自分のコマ一覧を並べて見ます。見本の絵（本棚・くまの絵本・おはなし会の聞き手）が残っていたら、そこが次に描く所です。
- かける時間の目安は20〜40分。10分で出来た時は、まだ見本のままの所が残っています。

## 4. 頼んだ人との進め方

- 足りない道具（Node.js 20 以上・ffmpeg・Python3 と numpy と Pillow・Google Chrome）があれば、SKILL.md の道具の確かめが教えてくれます。入れ方を頼んだ人に伝えて、一緒に入れてください。
- 題材が1行だけでも始められます。見る人・言ってほしい一言・画面に出す事実（日付・時刻・場所・名前）が足りない時は、最初に1回だけまとめて聞きます。事実は、頼んだ人の言葉の外から足しません。
- 最初の10秒くらいの試しが出来たら、全部を作る前に動画の場所を伝えて、一言もらいます。
- 完成の物差しは1つ：見た人が、思わず声を出すか。迷ったら楽しい方へ。
