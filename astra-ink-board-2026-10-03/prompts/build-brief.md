# 制作担当への依頼と修正フィードバック（原文）

## 初回の委任

```text
Own ONLY /Users/monoke/Okemori/outputs/astra-lab-2026-10-03/ink-board/ . You are not alone; don't revert/edit others. Build one original polished interactive browser artwork 『インクの盤上』, queue#5 ボールペンの盤上. User full-power through Oct5, difficult creation explicitly Astra ultra, no paid API/new subscriptions. Need complete playable/art-making experience, not research. Concept: a cream sketchbook page with BLUE BALLPOINT-PEN STYLE chessboard/pieces: varied line pressure, layered contour strokes, cross-hatching for curved forms/shadows, paper fibers, small crafted doodle details. Pieces must have recognisable king/queen/rook/bishop/knight/pawn silhouettes and feel dimensional; emphasize drawn ink rather than generic shiny solid chess pieces. User composes an illustration by selecting a piece + white/dark ink side and tapping square to place it; can select/move existing piece, remove, undo/redo, choose 2–3 attractive compositions incl quiet6–10pieces and full32 start, change camera preset/isometric/top or orbit if robust, ink/hatching strength controls, reset, PNG save. Free composition, label near controls 『自由に並べるスケッチ盤』; don't imply legal chess engine or enforce full chess rules. Empty/occupied square behavior obvious and reversible. Tap-to-select/tap destination must work on375px; drag optional, never mix camera drag with piece drag ambiguously. Core artwork beautiful onfirstload; board large, controls concise Japanese ≥12px onphone, refined editorialwarmcream/navy paper layout distinct from forest. Respect reduced motion. Stop animation when idle. No external CDN/fonts/images/libraries/generativeAPIs. Original code/assets. Can REUSE our own paper-forest/gpu.mjs math/Zbuffer base if useful and document internal reuse, but final folder self-contained. Important prior lessons: average polygon depth painter failed; use robust occlusion if real3D. Camera fit at every allowed angle, selectedpiece/mobilekeyboard accessible, reliable PNG immutable snapshot, frame=0 onpagehide and revoke stale download links. Parent owns all browser QA + publication, you MUST NOT automate browser/commit/edit shelf/queue. Parent has bundled Playwright isolatedChromium151 withWebGL24depth and real PNG/touch ability. Send control IDs/selectors early; notify assoonfirstrender ready beforedocsfinish. Files index.html/style.css/app.mjs/model.mjs/renderer.mjs etc asuseful, making.html with full codeblock+copy button, README, PROCESS (original user request can read paper-forest/PROCESS.md and research/claude-favorites.md, raw delegation in prompts/build-brief.md, tool/model REQUEST vs actual evidence, provenance, reproduction). Public target https://okemonogatari-hash.github.io/html-share-box/astra-ink-board-2026-10-03/ . PROCESS metadata needed title/一言/完成物/サムネ:poster.png and reusablepromptcodeblock for existing build_lab_works.py; parent provides actualPNGposter. Write bounded meaningful model tests for placement/undo/redo/capture/invalidinput/camera. Maker should prioritize finished attractive artwork+usablecontrols; parent will return actual screenshot feedback, expect revisions. Keep internal implementation jargon out of UI. Source inspiration: confirmed morningvideo discussesballpointchess, external source not copied. Existing shelf duplication check by separateLunaongoing; parent passesifneeded.
```

## 棚の重複確認（親からの読戻し）

> 棚150作品を独立照合し、チェス・ボールペン・盤上の同種は0件と確認済みです。selectors受領しました。私は親QA／公開に専念、あなたの描画可能な初稿通知を待って実物検証します。細部制作を続けてください。

## 初稿の画面フィードバック

> 初稿を実見。PCの青い線・紙・駒の違いは良いです。修正依頼: 375px local-mobile.pngでh1が「インクの盤／上.」と分断、03見出しも「線の、手ざわ／り。」になるので、mobile introを縦配置などでタイトルを1行、見出しを自然な行幅にしてください。ログの404はposter未作成＋faviconの可能性、favicon data URI追加をお願いします。PNG保存は選択/キーボード焦点のマークが混入しないきれいな盤面出力にしてほしいです（今copy current canvasなので選択中をこれから実検証）。初稿画像はruns/...2213/local-initial.png,local-mobile.png,local-preset-study.png,local-export-initial.png。posterは親が最終PNGから作成予定です。

> 独立レビューの確定不具合: button:hover:not(:disabled) が active背景を薄色で上書きし、button[aria-pressed=true] の白文字が消える。local-camera-top.png の真上からが実例。選択中hoverの背景/文字色を一緒に定義してください。6枚の実画像で形・紙・ハッチング・隠蔽・PNG構図は重大問題なしとのレビュー。

> 初回404はサーバーログでposter.pngが2回（初回/reload）と確定。親がlocal-export-initial.pngをposter.pngへコピー済み、404原因解消しました。最終exportが変われば親が更新します。touch-export-qa.cjs は選択中と選択解除後のPNGが同一ハッシュになること、画面上mouse/touch配置移動・連続保存・back復帰まで確認予定です。

## 2026-10-04の再開指示

> 10/4 01:14のheartbeatで再開します。前回中断され、現在あなたはinterruptedです。保存済みartifactから続行してください。所有はink-board/のみ。親確認ではmaking.htmlまでは保存済み、README/PROCESS/raw briefなし。未完修正: 375pxタイトル末尾「上.」折返し・03見出し末尾「り。」折返し、active hover薄色背景で白字消える問題、選択/focusマークを含めないPNG。親QA追加 touch-export-qa.cjs は完成済みです。親がposter.pngを初期PNGから設置済み。元の要求どおりdocs/原文プロンプト/テスト結果まで仕上げて通知してください。課金APIなし、他者の変更を戻さず、ブラウザ・commit・公開は親担当。再開時に既存ファイルを確認し、完成した修正を重複作業しないでください。

> reviewer追加の確定文言不一致: app.mjsの配置mode-help「駒のあるマスには重ねずに置けます。」は実際は拒否なので「駒のあるマスには置けません。」等へ訂正してください。

修正の実装・検証状態は上のフィードバック本文を変更せず、`../PROCESS.md`に追記します。

## 再検証後の細部調整

> 修正受領、今から最終QA開始。reviewer追加: making.html .prompt-head button(濃紺＋白文字)も共通hoverに背景のみ薄色上書きされます。コピーbuttonのhover色も明示してください。配置説明は空きマスのみと分かるなら最新文言でOK。

> 最終browser/touch QA通過、選択中PNG==選択解除PNG、連続保存==同一構図、戻る後再保存もOK。追加実見調整: local-mobile-touch.png の真上375pxで .page-mark i の英文が盤上端と重なります。mobileでは副英文のみ非表示などで避けてください。canvasにも -webkit-tap-highlight-color:transparent を足すと、実タップ直後の大きな灰色ハイライトが絵全体を覆うのを避けられます（同画像）。タイトルと章見出し・active hoverは修正確認済み。
