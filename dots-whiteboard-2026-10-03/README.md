> [編集素材一式をダウンロード](source.zip) · [動画を見る](index.html)

# Dots：動く手書きホワイトボード

120秒の日本語解説。視聴入口は `viewer.html`、完成MP4は `renders/dots-whiteboard.mp4`。

## 次は、題材と台本を替える

1. このフォルダを新しい作品フォルダへコピーする。`renders/` と `qa/` の前作結果は新しい作品へ流用しない。
2. `script.json` の章タイトル・本文・根拠を新しい題材へ替え、`sources.md` に確認した一次資料をまとめる。
3. ナレーションを `narration/narration.wav` に置く。`narration/timing.json` に発話の章境界を保存し、`visual-timing.json` の各章 `start` と `duration` を実音声に合わせる。音声ファイルの尺は `audio-config.json` に記載する。
4. `build.mjs` の8場面を新しい題材の動詞へ替える。「見る」「渡す」「運ぶ」「指す」を、人物と物の関係として描く。単に見出しと説明だけを差し替えると、絵と台本がずれる。
5. `node build.mjs` で編集可能なHTMLを生成する。`node make-viewer.mjs` で視聴ページを生成する。
6. `npm run check`。読みやすさ、図の重なり、手渡しの位置、各章末を確認する。スナップショットは下記のように **`--describe false` を必ず付ける**。
7. `npm run preview` でStudioを開き、`npm run render` で1080p・30fpsのMP4を書き出す。`ffprobe` と実フレーム、音声の検査を行う。

```sh
npx --yes hyperframes@0.8.114 snapshot --at 16,34,51,63,73,84,104,119.95 --describe false --output qa/final-snapshots
```

HyperFramesの `snapshot` はGemini接続が環境にあると画像説明を自動実行する。上記指定で追加の解析API利用を止める。今回の初回スナップショットでは既定動作により9枚の自動解析が走った。使用量と費用は未取得。詳しくは `PROCESS.md`。

## 再利用する部品

`lib/whiteboard.mjs`：

- `ink()`：SVGの各線を長さに応じて順番に描く。
- `label()`：手書き文字を1文字ずつ書く。
- `person()`：頭・胴・腕・脚を分けたオリジナル人物。渡す、抱える、指す、声で話す姿勢を選ぶ。
- `page()` / `envelope()` / `calendar()` / `book()` / `laptop()`：仕事に使う小物。
- `arrow()` / `check()`：関係や確認の結果を描く。
- `boardScene()`：白板・小さい出典ラベル・章末の消し込み。

`build.mjs` の `motion()` は同じ物の移動、`pose()` は腕や脚の変形、`walk()` は紙を持った歩行を担当する。配置用の外側SVGグループと、動かす内側グループを分ける。これで手渡しの相対移動を再利用しやすくする。

紙を持つ場面は、完成図に加え、持ち始め・運ぶ途中・置く直前を確認する。今回は完成図では見えなかった口と紙の重なりを途中の実フレームで見つけ、紙を下げて修正した。

## 正本と出力

| 役割 | ファイル |
|---|---|
| 本人依頼・制作方針 | `BRIEF.md`, `CREATIVE_PROMPT.txt` |
| 内容と一次出典 | `script.json`, `sources.md` |
| 音声と実時間 | `narration/`, `audio-config.json`, `visual-timing.json` |
| 線画と動き | `lib/whiteboard.mjs`, `build.mjs` |
| 生成HTML | `index.html` |
| 完成映像 | `renders/dots-whiteboard.mp4` |
| 視聴ページ | `viewer.html` |
| 検証 | `qa/`, `QA.md` |
| 制作経緯・道具・出どころ | `PROCESS.md` |

ローカルサーバーで `viewer.html` を開くと章ボタンから頭出しできる。Studioは [localhost:8774](http://localhost:8774/#project/dots-whiteboard-2026-10-03)。公開版はこの視聴ページ。
