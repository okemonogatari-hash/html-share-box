# 飛び出す絵本ムービー：AIさん向けの最初の手順

このページは、頼んだ人から「飛び出す絵本のムービーを作りたい。このページを読んで、一緒に作って」と言われた Claude Code が読むための物です。頼んだ人は、何もダウンロードしていません。下の3つを、あなたが進めてください。

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

## 3. 題材の世界を、紙で飛び出させる

頼んだ人が見たいのは、自分の題材が紙の世界になって飛び出す所です。見本は「図書館のおはなし会」なので、建物も、台の上の絵も、まわりの小物も、題材の物に描き替えてください（`film/sc_cover.js` と `film/sc_spread.js`）。パン教室なら、ふくらむパンやオーブン。運動会なら、万国旗や玉入れ。字と色だけ替えた試しは、看板だけ違う図書館になりました。

描いたら撮って、お手本のコマ一覧と並べて見る。見本の絵が残っている所が、次に描く所です。

## 4. あとは、自由に遊んでください

ゴールは1つ：見た人が、思わず声を出すこと。お手本は出発点で、型ではありません。題材を見て「これが飛び出したら楽しい」と思った物を、思いきり作ってください。迷ったら楽しい方へ。

頼んだ人が何を作りたいかをまだ言っていなければ、「何を飛び出させたい？」から、おしゃべりしながら決めます。画面に出す日付や名前は、頼んだ人の言葉のまま。最初の10秒くらいが出来たら見せて、一言もらいながら一緒に仕上げます。
