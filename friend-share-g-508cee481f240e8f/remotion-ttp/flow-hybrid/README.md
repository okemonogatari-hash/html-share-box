# カピバラとインコのボウリング・15秒版

Flow演技＋Blender接触＋Remotion合成の無音映像版。全編15.000秒、720×1280、60fps、900フレームです。親とAstraが離球・接触・全編を確認。受入記録は `qa-receipt.json` です。

Flow単独の完全TTPは達成していません。投球フォームとカメラは元動画と異なり、強い「ぬぼー落ち」にも届いていません。球の分裂・逆行・先倒れが出たため、演技と接触を分けた方式へ変更しました。

|映像|採用範囲|役割|
|---|---|---|
|Flow投球|先頭3.7167秒|立ち上がりから離球|
|Blender|先頭0.05秒を除いた4.45秒|一球の走行、接触、10本の倒壊|
|Flow顔アップ|先頭6.8333秒|カピバラとインコの反応|

Flow素材は24fps。60fps書き出しがFlow演技をネイティブ60fpsにするわけではありません。音声は未聴取のため、合成版は全素材をミュートしています。

## 接触をどう保証したか

球は一つのメッシュで前進と回転を制御。ピンは実形状MESHのBullet剛体で計算し、各フレームの姿勢を保存しました。球自体は自由運動の物理計算ではありません。開始から接触まで2.633390秒、接触前の全ピンは静止。球のみ外した比較では10本が立ったままで、球ありでは10本が倒れます。

カメラは球より遅い低速追従。接触前159フレームの球の投影半径は単調に縮み、画面内を奥へ進みます。TTPの時間と因果を参考にしたものです。競技場の公式寸法・実際のピンの個別軌道の再現ではありません。

## 同じ映像を作り直す

Node.js/npm、Blender、FFmpegを使用。保存したAI素材を使う限り、Flowを再生成せず合成できます。AIの再生成は同じプロンプトでも同一結果を保証しません。

```sh
cd code
npm ci
mkdir -p out
npm run render
```

`code/public/flow-hybrid/` に3素材を格納済みです。投球・反応は元の8秒出力を保持し、`hybrid.tsx` のSequenceで上表の採用範囲だけ使います。投球の後半は不採用区間なので、元ファイル全体を完成映像と扱わないでください。

### 3Dショットも作り直す場合

```sh
cd code/physics
blender -b --python build_shot.py -- --render none
blender -b bowling-baked.blend --python render_eevee.py
blender -b bowling-eevee-linear.blend -o //frames-final/frame- -s 1 -e 270 -a
ffmpeg -framerate 60 -start_number 1 -i frames-final/frame-%04d.png -frames:v 270 -c:v libx264 -crf 17 -pix_fmt yuv420p -movflags +faststart -an physics.mp4
cp physics.mp4 ../public/flow-hybrid/physics.mp4
```

Blender 5.2.1 LTSで制作。OS・GPU・バージョンにより見た目や計算が変わる可能性があり、固定出力を併記しています。詳細は `code/physics/README.md`、検査記録は同フォルダのJSONを参照。

### 元と並べる場合

自分で使用できる参照動画を `code/public/reference.mp4` に置いて `npm run contact-audit`。元動画単体は公開パックに含めません。比較映像の左側はRankseeker掲載・坂本かやプロの投球（https://www.youtube.com/shorts/F1XZ_JLzp0A ）の引用で、離球から接触を検討する用途です。フォーム全体の一致を示す比較ではありません。

## 指示と素材の出どころ

実行した指示原文は `prompts/`、工程と失敗は `PROCESS.md` と隣の失敗博物館へ。参考画像はChatGPT画像生成、演技はGoogle FlowのVeo 3.1 Quality、3DはBlender、合成はRemotion 4.0.532/React 19.3.0。Astraは接触制作と独立レビュー、Luna MAXは公開記録の整理を担当。

キャラクター案は、あや＠ロロカデザインさんのアイコンを起点にしています。派生利用の許可は前案件で確認済み。原案画像や元データは含めません。

制作時の最終確認残高は600クレジット、Flow生成の消費計310。追加購入なし。これは制作当時の記録です。
