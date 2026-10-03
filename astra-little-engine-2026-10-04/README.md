# 風の機関室

羽根と軸をほどいて眺める、小さな機械の模型。ブラウザ標準WebGLだけで描く、独自の立体作品です。

- 作品: `index.html`
- 制作の説明と全文コピー: `making.html`
- 依頼、道具、素材、検証の記録: `PROCESS.md`
- 公開先: https://okemonogatari-hash.github.io/html-share-box/astra-little-engine-2026-10-04/

## 開く

ES Modulesを使うので、HTTPサーバーから開きます。追加ライブラリは不要です。

```sh
python3 -m http.server 8878 --directory /Users/monoke/Okemori
```

http://127.0.0.1:8878/outputs/astra-lab-2026-10-03/little-engine/

## 操作

- 殻をひらく: 前上側の殻を欠いて、羽根と軸を眺めます。
- 軸に沿ってほどく: 入口と出口のまとまりが軸方向に離れます。
- 羽根をまわす: 速度、一時停止・再開。停止時と速度0では手動角度も選べます。
- 風の通り道: 細い青緑の線の表示切替。
- 眺める角度: 工房・真横・入口・上から。Canvasをドラッグ、またはフォーカスして矢印キーでも回せます。
- はじめの姿: 視点、断面、分解、回転、気流を初期状態に戻します。
- PNG: クリックした瞬間の構図を保存します。保存前後で画面状態は変わりません。

回転を減らすOS設定では初期停止します。非表示のタブと停止中は連続描画しません。WebGLを使えない時は`poster.png`と案内を表示し、操作を無効にします。模型の気流は視覚表現です。

## ファイル

| ファイル | 内容 |
|---|---|
| `geometry.mjs` | 羽根、外殻、輪、軸受、ボルト、台座の独自形状 |
| `model.mjs` | 状態、時間進行、軸方向の分離、カメラの範囲 |
| `renderer.mjs` | 深度テスト、金属の光、床と接地影 |
| `app.mjs` | 操作、停止・復帰、同期PNG取得、読み取り専用QA情報 |
| `prompts/build-brief.md` | 制作担当への依頼と修正指示の原文 |
| `prompts/reusable-prompt.txt` | 作り方ページと同じ再利用プロンプト |
| `qa/model.test.mjs` | 状態・時刻・幾何・カメラの検査 |

## 検査

```sh
node --test qa/model.test.mjs
node --check app.mjs
node --check renderer.mjs
node --check model.mjs
node --check geometry.mjs
```

`window.__ENGINE__.snapshot()`は状態と描画診断のコピーを返します。操作用APIではありません。

数理検査は有限な形、状態遷移、時間差、頂点の画面内範囲を確かめます。金属の見え方、UIの読みやすさ、実入力とPNGは親担当の実ブラウザ検査で受け入れます。その証拠は`../runs/2026-10-04-0414/`に保存されます。実機Safariや実機端末の確認と同一視しません。

親の最終受入: 18描画、375pxのタッチ、PNG保存、1351文字の全文コピーを確認。断面を閉じた時のボルト修正も再確認済み。検査の範囲と限界は[qa/artifact-readback.json](qa/artifact-readback.json)。
