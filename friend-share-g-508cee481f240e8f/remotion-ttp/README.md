# ボウリングのTTPを構造分解する｜Astra × Remotion

[比較動画と作り方](https://okemonogatari-hash.github.io/html-share-box/friend-share-g-508cee481f240e8f/remotion-ttp/)

元Shortsの動きを計測して、右側をRemotionのSVGリグで描き直す実験。左は元映像、右はコード描画です。**実写と全く同じ映像は作れていません。** 動作の時間軸・球軌道を再構成した部分と、絵や奥行き・服の動きの未一致を比較できます。無音、60fps、658コマ、10.966667秒。

## 作り方

1. Astraへ相談し、元コマで離球・ピン初動・カットを測る。
2. MediaPipeで657コマ×33点の姿勢を抽出。
3. 誤った腕の検出を両腕各13点の手測定で補正。球は22点の中心・半径を計測。
4. カットで区切った7コマの平滑化、球のPCHIP補間を使用。
5. RemotionのuseCurrentFrameで姿勢・球・ピンを描画。元映像と同じ時間軸で左右比較。
6. ピンの位置ずれ、胴体の自己交差、腕が頭に隠れる描画順、球のスイングの谷を独立レビューで見つけて修正。

## 書き出す

Node.js/npmが必要。固定された計測データから右側だけを描く場合は元動画なしで実行できます。

```sh
cd code
npm ci
npx remotion render index.tsx Reconstruction out/reconstruction.mp4 --concurrency=2
```

左も比較に入れる場合は、自分が使用できる参照動画を `code/public/reference.mp4` へ置きます。元動画の単体ファイルはこの公開パックに同梱していません。

```sh
npx remotion render index.tsx Comparison out/comparison.mp4 --concurrency=2
```

## 計測をやり直す

Python3.12で `mediapipe==0.10.32 scipy opencv-python-headless` を入れ、Google公式のpose_landmarker_heavy.taskを取得。新しい自分の動画を入力します。

```sh
python extract-motion.py /path/to/your-video.mp4 /path/to/pose_landmarker_heavy.task
python correct-motion.py
python prepare-ball.py
```

`correct-motion.py` の腕アンカー、`prepare-ball.py` の球測定、カットframe546はこの動画用です。別の動画ではその動画を見て置き換える必要があります。新しいrawは `code/analysis/pose-raw.json` に作られます。事前に `mkdir -p analysis qa public` を実行してください。

## 元の時刻

- 手と球の離れ：f317/5.288617秒は接触、f318/5.305300秒で明白な隙間。
- ピン初動：f477/7.957950秒は直立、f478/7.974633秒で動き始める。
- カット：f545/9.092417秒まで全身、f546/9.109100秒から上半身。
- 元映像60000/1001fps、657コマ、10.960950秒。60fpsの描画の量子化誤差は最大1元コマ未満。

## 受入結果と未一致

最終13点版は、動作構造の比較用試作・Flowへの動きガイドとして受入。助走から高いバックスイング、低い離球、球の走行、ピン初動、フォロースルーまで同じ時間軸で再構成できています。実写との完全同一再現は未達です。脚の接地や前半の隠れた関節には推定が残り、ピン個別の回転軸・跳ね方・衝突順も測定再現していません。服・髪・手指・光と影・奥行きも一致していません。

## 次のルート：Google Flow Edit（試作中）

Flowでの動画化を準備中で、新しいカピバラ動画の生成はまだ実施していません。最初は `media/motion-reference.mp4`（9:16・24fps・218コマ・実長9.083333秒）を動きの参照にし、カピバラとインコのキャラクターへ置き換える想定です。比較用 `media/reconstruction.mp4` は全長10.966667秒です。使う機能は既存動画のEdit（編集区間は最大10秒）です。3秒の「Reference video」入力とは別機能として扱います。

- [Google Flow公式の動画編集案内](https://support.google.com/flow/answer/16935718?hl=en)：既存動画の区間編集と追加修正。
- [Google DeepMind公式のGemini Omni紹介](https://deepmind.google/models/gemini-omni/)：動画の姿勢・動きを画像キャラクターへ移す作例。
- [Ajit Ingaleの一次制作例](https://me.muz.li/ajitingale/finally-total-motion-control-in-gemini-omni)：参照動画・キャラクターシート・背景を合わせ、姿勢と画角を確認する手順。

Flow出力・クレジット消費・動きの一致度は未確認です。生成後に実物を確認します。

## 出典

[Rankseeker：坂本かやプロの投球Shorts](https://www.youtube.com/shorts/F1XZ_JLzp0A)。左側の映像は、右の再構成との差を検討する比較引用。音声は不使用。

[Remotion公式](https://www.remotion.dev/docs/the-fundamentals)、[Google MediaPipe公式](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/python)。画像生成・Flow再生成は今回不使用。

[PROCESS.md](PROCESS.md) に頼み方と道具を記録しています。
