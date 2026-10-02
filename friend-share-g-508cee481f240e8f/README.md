# カピバラとインコの15秒動画｜ChatGPT × Google Flow

[動画付きの制作ガイドを開く](https://okemonogatari-hash.github.io/html-share-box/friend-share-g-508cee481f240e8f/)

今日のオフ会で共有するために、実際のプロンプトと作成フローをまとめました。完成MP4は[こちら](media/bowling-15s.mp4)。

## 作り方

1. ChatGPTでアイコンから開始画像を生成し、インコを追加。
2. FlowのFramesで開始画像を指定。Omni 1.1 Flash、10秒、9:16、720p、x1で投球を生成。
3. 動画の7.75秒のコマをChatGPTで整え、Veo 3.1 Qualityで衝突8秒を生成。
4. 動画の9.958秒のコマからOmni 1.1 Flashで喜び6秒を生成。
5. 使える部分を選び、ffmpegで15秒へ編集。

完成版は約5.2秒に投球、約8.1秒に接触、9.5秒からふたりの喜び。手離れの瞬間はカットで省略しています。10秒の第二試作にあった二重ボール部分と衝突省略部分は採用せず、投球と走行だけ使っています。

## 実際のプロンプト

- [1a｜ChatGPT：カピバラの開始画像](prompts/image-01.txt)：自分のアイコンを参照画像として添付。これは最初の単体画像を作った原文です。
- [1b｜ChatGPT：インコも登場](prompts/image-02-budgie.txt)：1枚目に作った画像と、ふたりが写った元アイコンを添付して編集しました。
- [2｜Flow：投球の10秒](prompts/flow-02-cinematic-bowling.txt)：開始画像を指定し、Omni 1.1 Flashで生成。後半の不自然な部分は最終編集で使いませんでした。
- [3a｜ChatGPT：ピンの開始画像](prompts/image-03-pins.txt)：生成した投球動画の7.75秒のコマを参照して、ボールとピンの配置を整えました。
- [3b｜Flow：衝突の8秒](prompts/flow-04-strike.txt)：整えた開始画像からVeo 3.1 Qualityで生成。接触後にピンが倒れる部分を採用しました。
- [4｜Flow：喜びの6秒](prompts/flow-03-celebration.txt)：投球動画の9.958秒のコマからOmni 1.1 Flashで生成。最後はインコが肩に乗ります。

## 編集する方へ

[render-final.py](render-final.py)は今回の24fps素材に合わせた編集です。Pythonとffmpegが必要です。自身で生成した3本を次の名前で同じフォルダへ置きます。

    flow-02-cinematic-bowling.mp4
    flow-04-strike.mp4
    flow-03-celebration.mp4
    python3 render-final.py

冒頭32フレームを2倍へ、投球32〜92、走行156〜173、衝突0〜85、喜び13〜143フレームを接続。合計360フレーム＝15秒。素材の出来方に合わせて範囲を調整してください。

## 今回の設定と費用

2026-10-02の実測。投球10秒15クレジット×2、喜び6秒10、衝突Veo Quality8秒100で計140クレジット（不採用試作を含む）。画像はChatGPT内蔵生成、具体的モデルID未返却。完成版15.000秒、720×1280、24fps、H.264/AAC。提供モデル・クレジットは再生成時のFlow画面で確認してください。

## 参考

- [元投球](https://www.youtube.com/shorts/F1XZ_JLzp0A)
- [はすきーさんの公開プロンプト](https://x.com/husky__create/status/2103422119476641974)
- [Flow公式：作成](https://support.google.com/flow/answer/16353334?hl=en)、[編集](https://support.google.com/flow/answer/16935718?hl=en)、[対応モデル](https://support.google.com/flow/answer/16352836?hl=en)

## 素材と公開範囲

あや＠ロロカデザインさん制作のおけもんアイコンを、許可を得てAIで加工した作例です。再現する場合は、自分が使える素材へ差し替えてください。元アイコンの原データと第三者の参考映像は同梱していません。GitHubとPagesは認証なしのURL共有で、noindexは検索避けです。

[制作記録](PROCESS.md)に工程を残しています。
