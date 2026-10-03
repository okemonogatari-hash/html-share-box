# 制作担当へ渡した依頼原文

オリジナルの3D作品『風の機関室』を実装し、動く完成品へ仕上げてください。ユーザーは10月5日までフルパワー、難しい制作はAstra ultraを明示。所有は /Users/monoke/Okemori/outputs/astra-lab-2026-10-03/little-engine/ 全体のみ。他者と共有workspaceです。他者の変更を戻さず、README/queue/runや公開repoを変更しないでください。親がブラウザ・QA・公開・棚を所有。あなたはブラウザ操作・commit・公開・外部通信・追加課金APIを使わない。必要なら子agentを増やす前に親へ知らせる。
入口: /Users/monoke/Okemori/outputs/astra-lab-2026-10-03/runs/2026-10-04-0414/{BRIEF.md,qa-plan.md}。既存151棚のエンジン同種0を独立調査済み。一番近い水車は風景と歯車なので、今回は軸・羽根・外殻の断面、軸方向分解が主役です。発想出典は ../research/claude-favorites.md の確認済み公式作品『分解・切断できるジェットエンジン』。外部作品コード/画像は複写せず、独自の卓上機械模型にします。
品質: 金属の羽根の厚みと曲がり、軸・軸受・輪・ボルト・青緑の外殻・真鍮色の縁・台座など、細部を作り込む。上品な工房/展示室のUI、初期構図だけで触りたくなる質感に。前作の紙/インクと異なる金属の造形。厳密な燃焼/熱/推力などの工学シミュレーションとは説明せず『羽根と軸をほどいて眺める、小さな機械の模型』として成立させる。気流は視覚表現として、断面を開くと通り道が分かる。既存自作paper-forest/gpu.mjsやink-boardの数学等は内部参考可、出どころをPROCESSへ。外部CDN/新ライブラリ/フォント/APIなし。自前WebGLで深度を扱い、独自の形と表示にしてください。
必須操作: 断面の開き量（外殻が実際に開く/欠く）、軸に沿う分解と戻し、羽根回転の速度/停止再開、停止中の手動回転角、気流ON/OFF、全体と部品が観察しやすい視点、mouse/touchで視点回転か分かりやすい代替、reset、PNG。断面と分解の極値の組合せや全視点を画面内fitし、375pxでもラベルと主要操作が扱える。過剰な部品数より見やすい形と隠蔽を優先。部品の流れは入口羽根→軸/中央→奥の羽根/出口など数グループ。表示と操作名が一致。実機性能を断定する専門説明は増やさない。
描画: 常時running時も効率を考え、静止/背景では不要なRAF停止。初期の負delta・巨大deltaとページ復帰を扱う。prefers-reduced-motionでは初期停止し手動操作可。pause後の画像が止まり、playで再開。PNGは保存クリック時点の構図を同期スナップショットしてから非同期化、選択やfocus印を混ぜず画面状態を保つ。古いblob URLを解放、pagehideでframe=0、戻ると操作復帰。WebGL不可のfallbackはposter.png＋案内と操作無効（posterは親が最終実PNGから配置）。
成果物: index.html, style.css, model/geometry/renderer/app等の自己完結フォルダ、making.html（再利用プロンプト全文pre/code＋コピー、hoverも文字が読める）、README、PROCESS、prompts/build-brief.mdにこの委任原文と後の修正原文、意味のある状態/時刻/幾何のテストと結果。PROCESSには本人依頼原文（../ink-board/PROCESS.mdから既存原文）、ツール・モデル要求値と未確認の実行証明区別、素材出所、再制作を保存。棚parser用先頭に『一言：...』『完成物：https://okemonogatari-hash.github.io/html-share-box/astra-little-engine-2026-10-04/』『サムネ：poster.png』を入れ、コピー用コードブロックを置く。内部HTMLコメントが棚のnoteになるためPROCESSのプロンプト前にコメントを入れない。
進め方: 最初に簡潔な制御selectorsと描画方針を親へ知らせる。最低限描画が動いたらすぐ通知して親の実画面QAを並行させ、その後docs/テストを完成。コード自己申告だけで完了にせず親の画像指摘を受けて修正。最終返却はファイル、検証結果、残件だけ短く。

## 追加指示原文

> selectors受領しました。親は #engine-canvas の初期/断面/分解極値/375pxを実見し、RAF停止・時間差・再開とPNGの同期、実mouse/touch orbitを検証予定です。read-only __ENGINE__ は snapshot()（UI状態、角度/位相、カメラ、running、RAFの有無、描画stats）を返す形だと誤って内部へ書かずに検証できます。makerは予定の造形とコード制作を優先し、初描画通知を待っています。

> 初稿をPC/375px/全分解で実見しました。形・青緑外殻/真鍮/銀の区別・台座・操作余白は良く、初期描画例外0です。親が draft-export.png を poster.png に配置済み。初画像はrunの draft-initial.png / draft-exploded.png / draft-mobile*.png。品質修正1点: 羽根の広い金属面が格子状の平面の継ぎ合わせに見えるので、blade面の頂点法線を曲面に沿って補間（側面の厚みはhard edge維持）し、曲がりが連続して見えるようにしてほしいです。geometry.mjs blade→quadが現在flat normalなのでここが対象。ポリゴン数を増やすより法線の連続性を優先。初稿は他に確定ブロッカーなし、これから全操作QAです。サーバーのrootはlittle-engineなのでURLはhttp://127.0.0.1:8878/そのものです。

> 現在04:38、引き継ぎ後も親で進行しています。独立レビューも初稿PC/375px/PNG実見、端切れなし、flat normals改善を支持。making.htmlと法線更新が揃ったらfull QAへ進むので通知ください。併せて #download-again は download 属性があるため文言を「保存した画像をもう一度ダウンロード」にしてください（現在「開く」）。親はQA・poster・公開を引き続き所有します。

> full QA終了：18描画/全9 cut×explode/4視点、17動作ステップ、375pxタッチ、PNG同状態同hash・回転中保存・戻る、makingコピー、WebGL不可fallback、hover、親のnode9テストすべて合格。errors0。親実見で羽根の曲面改善OK、最終PNGをposter置換済み。PROCESS/結果記録ができたら作成完了通知ください。以後runtime変更は親との調整後に。親は独立レビュー受入と公開準備中。
