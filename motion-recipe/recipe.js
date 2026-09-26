/* モーションレシピ — ことば → 技法 → Opus 5.5 へのプロンプト
 * 外部のAIやAPIは使わない。辞書と組み合わせのルールだけで、同じ言葉なら同じレシピになる。
 * ブラウザでは window.MotionRecipe、Node では module.exports。
 */
(function (root) {
  "use strict";

  // ---------------------------------------------------------------- 雰囲気
  const MOODS = {
    cute: {
      adv: "かわいく", adj: "かわいい",
      label: "かわいい",
      words: ["かわい", "可愛", "キュート", "ゆるい", "ゆるっ", "ほっこり", "ぽよん", "ぷにぷに", "ふわふわ", "まんまる", "丸い", "パステル", "ピンク", "おちゃめ", "愛嬌", "カピバラ", "ねこ", "猫", "いぬ", "犬", "うさぎ", "動物", "赤ちゃん", "子ども", "こども", "キッズ", "スイーツ", "お菓子", "ぬいぐるみ"],
      feel: "丸くてやわらかく、ぽよんと弾む",
      palette: ["#FFF6EE", "#FF8FA3", "#FFC75F", "#7FD8BE", "#4A4458"],
      paletteWords: "ミルクのような白、ピーチピンク、はちみつ色、ミントを少し",
      bpm: 112,
    },
    cool: {
      adv: "かっこよく", adj: "かっこいい",
      label: "かっこいい",
      words: ["かっこい", "カッコい", "格好", "クール", "スタイリッシュ", "シャープ", "力強", "迫力", "大胆", "ダイナミック", "疾走", "スピード", "キレ", "モノクロ", "黒", "ストリート", "スポーツ", "バトル", "ロック", "渋い", "男前"],
      feel: "切れ味よく、メリハリの効いた",
      palette: ["#0E0E10", "#F4F4EF", "#E8FF3A", "#6B6B70"],
      paletteWords: "黒と白を基本に、差し色に蛍光イエローを1色だけ",
      bpm: 128,
    },
    calm: {
      adv: "やさしく", adj: "やさしい",
      label: "癒やし",
      words: ["癒", "いやし", "落ち着", "ゆったり", "のんびり", "静か", "しずか", "やさし", "優し", "穏やか", "おだやか", "リラックス", "眠", "おやすみ", "夜", "雨", "海", "波", "森", "自然", "水", "瞑想", "ヨガ", "深呼吸", "ほっと", "カフェ", "朝", "ぬくもり", "あたたか", "温か"],
      feel: "ゆったりと呼吸するような",
      palette: ["#F3F5EF", "#A8C5B5", "#6E9FB5", "#F2E3C4", "#3E4A46"],
      paletteWords: "朝の光のような生成り、セージグリーン、淡い水色",
      bpm: 72,
    },
    elegant: {
      adv: "上品に", adj: "上品な",
      label: "上品",
      words: ["おしゃれ", "オシャレ", "お洒落", "上品", "高級", "エレガント", "品", "大人", "洗練", "ラグジュアリー", "上質", "ホテル", "ジュエリー", "ブランド", "シック", "ミニマル", "シンプル", "余白", "美しい", "美し"],
      feel: "静かで、余白の美しい",
      palette: ["#F7F3EC", "#1F1D1A", "#B8975A", "#8C8479"],
      paletteWords: "アイボリー、墨色、控えめな金",
      bpm: 84,
    },
    future: {
      adv: "近未来っぽく", adj: "近未来の",
      label: "未来",
      words: ["未来", "近未来", "サイバー", "SF", "テック", "テクノロジー", "AI", "ＡＩ", "デジタル", "ネオン", "宇宙", "ロボット", "データ", "ホログラム", "ハイテク", "システム", "プログラム", "コード"],
      feel: "光と線が走る、近未来の",
      palette: ["#070B1A", "#1B2A6B", "#3DF5FF", "#B06CFF", "#EAF6FF"],
      paletteWords: "深い紺の夜に、シアンと紫の光",
      bpm: 124,
    },
    emo: {
      adv: "少し切なく", adj: "少し切ない",
      label: "エモい",
      words: ["エモ", "切な", "せつな", "懐かし", "なつかし", "思い出", "青春", "夕暮れ", "夕焼け", "ノスタルジー", "レトロ", "卒業", "旅", "記憶", "手紙", "フィルム", "昭和", "平成"],
      feel: "夕暮れみたいに少し切ない",
      palette: ["#2B1B3D", "#FF7E5F", "#FEB47B", "#F7E6D4"],
      paletteWords: "夕焼けのオレンジから、夜の紫へのグラデーション",
      bpm: 90,
    },
    pop: {
      adv: "にぎやかに", adj: "にぎやかな",
      label: "ポップ",
      words: ["ポップ", "カラフル", "元気", "明るい", "にぎやか", "楽しい", "たのしい", "ハッピー", "パーティ", "お祭り", "祭", "ビビッド", "陽気", "ノリノリ", "テンション"],
      feel: "カラフルで元気いっぱいの",
      palette: ["#FFFFFF", "#FF3E6C", "#FFD23F", "#3BCEAC", "#2D2D2D"],
      paletteWords: "白地に、ビビッドな赤・黄・ミントをはっきり",
      bpm: 132,
    },
    wa: {
      adv: "和の風情たっぷりに", adj: "和の風情の",
      label: "和",
      words: ["和", "和風", "日本", "着物", "浴衣", "神社", "お寺", "鳥居", "書道", "筆", "墨", "和柄", "桜", "紅葉", "抹茶", "茶道", "京都", "侍", "忍者", "伝統", "職人"],
      feel: "墨や和柄が息づく",
      palette: ["#F3EDE0", "#1B1712", "#1F3668", "#E4472F"],
      paletteWords: "生成りの紙、墨、藍、朱",
      bpm: 96,
    },
    exciting: {
      adv: "ワクワクするように", adj: "ワクワクする",
      label: "ワクワク",
      words: ["ワクワク", "わくわく", "ドキドキ", "どきどき", "期待", "始まる", "はじまる", "スタート", "オープン", "挑戦", "冒険", "発表", "新しい", "新発売", "いよいよ", "カウントダウン", "爆発", "すごい", "全力"],
      feel: "ワクワクがどんどん高まっていく",
      palette: ["#FFF8F0", "#FF5A36", "#1E2A78", "#FFC93C"],
      paletteWords: "明るい白に、朱赤と紺、ひとさじの黄色",
      bpm: 124,
    },
    mystic: {
      adv: "神秘的に", adj: "神秘的な",
      label: "神秘的",
      words: ["神秘", "幻想", "ファンタジー", "魔法", "星", "月", "夜空", "銀河", "オーロラ", "光", "精霊", "夢", "不思議", "スピリチュアル", "占い", "タロット"],
      feel: "星や光がゆらめく、神秘的な",
      palette: ["#0B0A1F", "#3A2E7A", "#C9B6FF", "#FFE9A8"],
      paletteWords: "夜の藍色に、藤色の光と月の黄色",
      bpm: 80,
    },
  };

  // ---------------------------------------------------------------- 用途
  const PURPOSES = {
    intro: { noun: "自己紹介", label: "自己紹介", words: ["自己紹介", "紹介", "プロフィール", "名刺", "はじめまして", "わたし", "私", "自分", "ぼく", "僕"], ending: "最後に名前（と一言）が気持ちよく止まって終わる" },
    event: { noun: "告知", label: "イベント告知", words: ["告知", "お知らせ", "イベント", "開催", "募集", "セミナー", "オフ会", "講座", "勉強会", "ライブ", "交流会", "ワークショップ", "読書会", "シェア会"], ending: "最後にタイトルと日付がはっきり読める形で止まる" },
    shop: { noun: "お店・商品の紹介", label: "お店・商品", words: ["商品", "お店", "店", "カフェ", "メニュー", "サービス", "ブランド", "新作", "販売", "CM", "ＣＭ", "広告", "宣伝", "ショップ", "アプリ"], ending: "最後に商品名やお店の名前が主役で止まる" },
    explain: { noun: "解説", label: "解説・図解", words: ["解説", "説明", "仕組み", "しくみ", "手順", "流れ", "図解", "比較", "数字", "グラフ", "データ", "わかりやすく", "教える", "学び"], ending: "最後に要点がひと目でわかる形で止まる" },
    poster: { noun: "動くポスター", label: "動くポスター", words: ["ポスター", "待ち受け", "壁紙", "ループ", "背景", "BGM", "作業用", "ずっと"], ending: "最初と最後がなめらかにつながるループにする" },
    showreel: { noun: "ショーリール", label: "ショーリール", words: ["ショーリール", "腕前", "作品集", "ポートフォリオ", "全力", "本気", "すごい", "見せつけ"], ending: "最後に作り手の名前が署名のように止まる" },
    celebrate: { noun: "お祝い", label: "お祝い", words: ["誕生日", "おめでとう", "結婚", "お祝い", "記念", "周年", "卒業", "合格", "ありがとう", "感謝"], ending: "最後にお祝いの言葉が大きく残る" },
    sns: { noun: "SNS動画", label: "SNSのつかみ", words: ["SNS", "インスタ", "Instagram", "TikTok", "ティックトック", "リール", "ショート", "X", "バズ", "つかみ"], ending: "最初の1秒で目を止め、最後にもう一度見たくなる一瞬で終わる" },
  };

  // ---------------------------------------------------------------- 技法
  // role: hero（主役の見せ方）/ trans（場面のつなぎ）/ feel（動きの気持ちよさ）/ atmos（空気・光）/ sound
  // moods・purposes はその雰囲気・用途との相性（0〜3）
  const T = (o) => o;
  const TECHNIQUES = [
    T({ id: "kinetic", end: "言葉が弾みながら現れる", role: "hero", name: "文字が主役で動く", en: "Kinetic Typography", plain: "言葉そのものが跳ねたり流れたりして、読むより先に気持ちが伝わる", short: "言葉が弾みながら現れて", prompt: "キネティック・タイポグラフィ：画面に出す言葉を主役にして、文字ごとに登場と退場の動きをつける", moods: { cute: 2, cool: 3, pop: 3, exciting: 3, emo: 1, elegant: 1, future: 1, wa: 1 }, purposes: { intro: 2, event: 3, sns: 3, showreel: 2, celebrate: 2, shop: 1 } }),
    T({ id: "semantic", end: "言葉が自分の意味どおりに動く", role: "hero", name: "意味どおりに動く文字", en: "Semantic Type Motion", plain: "「ゆっくり」はゆっくり、「はやく」ははやく。言葉の意味を動きで見せる", short: "言葉が自分の意味どおりに動いて", prompt: "言葉の意味をそのまま動きにする（例：「ゆっくり」はゆっくり、「ぴたっ」で完全に止める）", moods: { pop: 2, cute: 2, cool: 2, exciting: 2, wa: 1 }, purposes: { sns: 3, showreel: 3, intro: 1, explain: 1 }, keys: ["ゆっくり", "はやく", "ぴたっ", "意味"] }),
    T({ id: "morph", end: "ひとつの形が次々に変身する", role: "hero", name: "形が変身する", en: "Morphing", plain: "丸が四角に、線が文字に。ひとつの形が次々に姿を変える", short: "ひとつの形が次々に変身して", prompt: "モーフィング：ひとつの形が別の形へなめらかに変身していく（丸→ロゴ→文字、など）", moods: { future: 2, cool: 2, elegant: 2, mystic: 2, cute: 1, pop: 2, exciting: 2 }, purposes: { showreel: 3, shop: 2, explain: 2, intro: 1 }, keys: ["変身", "変形", "モーフ", "変わる"] }),
    T({ id: "line", end: "一本の線が走って形を描く", role: "hero", name: "線がすーっと描かれる", en: "Line / Stroke Animation", plain: "一本の線が走って、図やロゴや文字を描いていく", short: "一本の線が走って形を描き", prompt: "ラインアニメーション：線が描かれていく動きで、図・ロゴ・文字の輪郭を見せる", moods: { elegant: 3, future: 2, calm: 2, cool: 1, mystic: 1 }, purposes: { explain: 3, shop: 2, intro: 1, showreel: 1 }, keys: ["線", "ライン", "描く", "えがく", "一筆"] }),
    T({ id: "brush", end: "筆が書き順どおりに文字を書く", role: "hero", name: "筆で書き順どおりに書く", en: "Brush Stroke Writing", plain: "墨の筆が、書き順どおりに文字を書いていく", short: "筆が書き順どおりに文字を書いて", prompt: "筆の書き順アニメーション：墨の筆が書き順どおりに漢字や言葉を書く。入りと払いの太さの変化、かすれも表現する", moods: { wa: 3, elegant: 2, calm: 1, emo: 1 }, purposes: { intro: 1, showreel: 2, celebrate: 1 }, keys: ["筆", "書道", "墨", "漢字", "書き順", "習字"] }),
    T({ id: "particles", end: "光の粒が集まっては弾ける", role: "hero", name: "粒・光・紙吹雪", en: "Particles", plain: "小さな粒が集まって形になったり、ぱっと散ったりする", short: "光の粒が集まっては弾けて", prompt: "パーティクル：小さな粒（光・紙吹雪・星）が集まって形になり、また散る", moods: { mystic: 3, future: 2, pop: 2, exciting: 2, celebrate: 0, cute: 1, calm: 1, emo: 1 }, purposes: { celebrate: 3, event: 2, showreel: 2, poster: 2 }, keys: ["キラキラ", "きらきら", "粒", "紙吹雪", "星", "花火", "パーティクル", "光"] }),
    T({ id: "pattern", end: "模様が波のように広がる", role: "hero", name: "模様が自分で育つ", en: "Generative Pattern", plain: "模様やタイルが波のように広がって、画面全体が生きもののように動く", short: "模様が波のように広がって", prompt: "ジェネラティブ・パターン：模様（和柄・タイル・グリッド）がコードで生まれ、波のように広がってうねる", moods: { wa: 3, future: 2, pop: 2, calm: 1, mystic: 2, elegant: 1 }, purposes: { poster: 3, showreel: 2, sns: 1 }, keys: ["模様", "柄", "パターン", "タイル", "青海波", "幾何学"] }),
    T({ id: "camera3d", end: "カメラが3Dの奥へ飛び込む", role: "hero", name: "3Dの中をカメラが進む", en: "3D Camera Fly-through", plain: "画面の奥へ奥へと、カメラが3Dの空間を進んでいく", short: "カメラが3Dの奥へ飛び込み", prompt: "3Dカメラ移動：three.js などで奥行きのある空間を作り、カメラが中を進んでいく", moods: { future: 3, cool: 3, mystic: 2, exciting: 3, wa: 1 }, purposes: { showreel: 3, event: 2, sns: 2 }, keys: ["3D", "３Ｄ", "立体", "奥行き", "空間", "トンネル", "宇宙"] }),
    T({ id: "infographic", end: "数字やグラフが気持ちよく伸びる", role: "hero", name: "数字やグラフが動く", en: "Kinetic Infographics", plain: "数字がカウントアップし、グラフが伸びて、説明がすっと入る", short: "数字やグラフが気持ちよく伸びて", prompt: "キネティック・インフォグラフィック：数字のカウントアップ、グラフが伸びる動きで、情報を気持ちよく見せる", moods: { future: 2, cool: 1, elegant: 1, pop: 1 }, purposes: { explain: 3, shop: 1, event: 1 }, keys: ["数字", "グラフ", "データ", "実績", "割合", "%", "％", "ランキング", "比較"] }),
    T({ id: "ui", end: "アプリの画面が動いて使い方を見せる", role: "hero", name: "画面やボタンが動く", en: "UI Motion", plain: "スマホやパソコンの画面が動いて、使っている様子を見せる", short: "アプリの画面が動いて使い方を見せ", prompt: "UIモーション：架空のスマホやPCの画面を作り、ボタンやカードが動いて操作の流れを見せる", moods: { future: 2, pop: 1, cool: 1, elegant: 1 }, purposes: { shop: 1, explain: 2, sns: 1 }, keys: ["アプリ", "画面", "スマホ", "サイト", "ボタン", "操作", "UI", "ツール"] }),
    T({ id: "collage", end: "切り抜いた紙がぺたぺた重なる", role: "hero", name: "切り抜いた紙を重ねる", en: "Paper Cut / Collage", plain: "紙を切り抜いて貼ったような重なりが、ぺたぺた動く", short: "切り抜いた紙がぺたぺた重なって", prompt: "ペーパーカット／コラージュ：紙を切り抜いたような形が重なり、影つきで貼られたり剥がれたりする", moods: { cute: 3, emo: 2, pop: 2, calm: 1 }, purposes: { intro: 2, celebrate: 2, event: 2, shop: 1 }, keys: ["紙", "切り絵", "コラージュ", "手作り", "ノート", "付箋", "スクラップ", "手帳"] }),
    T({ id: "liquid", end: "色がインクのようににじみ広がる", role: "hero", name: "とろける・にじむ", en: "Liquid / Ink Bleed", plain: "インクがにじんだり、液体のようにとろけて形が変わる", short: "色がインクのようににじみ広がって", prompt: "リキッド表現：インクがにじむ、しずくが落ちて広がる、液体のように形がとろける", moods: { calm: 2, mystic: 2, wa: 2, elegant: 2, emo: 2, cute: 1 }, purposes: { poster: 2, showreel: 2, shop: 1 }, keys: ["にじ", "滲", "インク", "しずく", "雫", "水彩", "とろけ", "液体"] }),
    T({ id: "geometric", end: "丸や三角がリズムよく並び替わる", role: "hero", name: "図形のリズム", en: "Geometric Shape Animation", plain: "丸・三角・四角が音楽のように並んだり回ったりする", short: "丸や三角がリズムよく並び替わり", prompt: "ジオメトリック・アニメーション：丸・三角・四角などの図形がリズムよく並び、回り、組み替わる", moods: { pop: 3, cool: 2, cute: 2, exciting: 2, future: 1 }, purposes: { sns: 2, event: 2, showreel: 2, poster: 2 }, keys: ["図形", "丸", "三角", "四角", "幾何学"] }),

    T({ id: "matchcut", end: "前の場面の形が、そのまま次の場面になる", role: "trans", name: "前の形が次の形になる", en: "Match Transition", plain: "場面が切り替わる時、前の場面の形がそのまま次の場面の部品になる", short: "前の場面の形がそのまま次の場面になって", prompt: "マッチトランジション：場面の切り替えでカットせず、前の場面の形を次の場面の部品へ受け渡す", moods: { cool: 2, elegant: 2, future: 2, wa: 2, exciting: 2, mystic: 2, cute: 1, pop: 1, calm: 1, emo: 1 }, purposes: { showreel: 3, shop: 2, explain: 2, intro: 2 } }),
    T({ id: "maskreveal", end: "文字がスッと幕の向こうから現れる", role: "trans", name: "スッと現れる", en: "Mask Reveal", plain: "見えない幕の向こうから、文字や写真がスッと現れる", short: "文字がスッと幕の向こうから現れて", prompt: "マスク・リビール：マスク（見えない窓）で文字や形を少しずつ見せる", moods: { elegant: 3, cool: 2, calm: 1, emo: 1, future: 1 }, purposes: { shop: 3, intro: 2, event: 1 } }),
    T({ id: "colorwipe", end: "色の面がシャッと画面を入れ替える", role: "trans", name: "色の面がシャッと切り替わる", en: "Color Wipe", plain: "大きな色の面が画面を横切って、場面ごと入れ替わる", short: "色の面がシャッと画面を入れ替えて", prompt: "カラーワイプ：大きな色の面が画面を横切り、背景の色ごと場面を切り替える", moods: { pop: 3, cool: 2, exciting: 3, cute: 1 }, purposes: { event: 3, sns: 3, showreel: 1 } }),
    T({ id: "parallax", end: "手前と奥が違う速さで流れる", role: "trans", name: "手前と奥が違う速さで動く", en: "Parallax / 2.5D", plain: "手前はすばやく、奥はゆっくり。平らな絵に奥行きが生まれる", short: "手前と奥が違う速さで流れて", prompt: "パララックス（2.5D）：手前・中・奥の層を違う速さで動かして奥行きを出す", moods: { calm: 3, emo: 3, mystic: 2, elegant: 2, cute: 1 }, purposes: { poster: 3, intro: 1, shop: 1 } }),
    T({ id: "slowzoom", end: "カメラが静かに寄っていく", role: "trans", name: "ゆっくり寄っていく", en: "Slow Zoom", plain: "カメラが静かに寄っていき、見る人を画面の中へ連れていく", short: "カメラが静かに寄っていき", prompt: "スローズーム：カメラがゆっくり寄っていく（途中で止めず、なめらかに）", moods: { elegant: 3, calm: 3, emo: 2, mystic: 2 }, purposes: { shop: 2, poster: 2, intro: 1 } }),

    T({ id: "squash", role: "feel", name: "つぶれて伸びる", en: "Squash & Stretch", plain: "着地でむにっとつぶれ、跳ぶ時にびよんと伸びる。アニメの基本", short: "ぽよんとつぶれて伸び", prompt: "スクワッシュ＆ストレッチ：着地でつぶれ、飛ぶ時に伸びる。体積は保つ", moods: { cute: 3, pop: 3, exciting: 1 }, purposes: { sns: 2, intro: 2, celebrate: 1 }, keys: ["ぽよん", "ぷにぷに", "弾む", "はずむ", "バウンド", "跳ね"] }),
    T({ id: "spring", role: "feel", name: "ビョンと行き過ぎて戻る", en: "Spring / Overshoot", plain: "目標を少し行き過ぎてから、バネのように戻って止まる", short: "バネのように行き過ぎて戻り", prompt: "スプリング：目標の位置を少し行き過ぎてから戻る、バネの動き", moods: { cute: 3, pop: 3, exciting: 2, cool: 1 }, purposes: { sns: 2, event: 2, intro: 1, shop: 1 } }),
    T({ id: "stagger", role: "feel", name: "少しずつ時間差で", en: "Stagger", plain: "たくさんの物が、ほんの少しずつ遅れて順番に動く", short: "少しずつ時間差で順番に動き", prompt: "スタッガー：複数の要素をほんの少しずつ時間差で動かし、波のような流れを作る", moods: { elegant: 2, cool: 2, pop: 2, calm: 1, future: 2, cute: 1 }, purposes: { explain: 2, event: 2, intro: 1, shop: 1 } }),
    T({ id: "anticipation", role: "feel", name: "動く前に、ためる", en: "Anticipation", plain: "大きく動く前に、いったん逆にぐっとためる", short: "ぐっとためてから一気に動き", prompt: "予備動作（アンティシペーション）：大きく動く前に、いったん反対にためる", moods: { exciting: 3, cool: 2, pop: 2, cute: 1 }, purposes: { sns: 2, showreel: 2, event: 1 } }),
    T({ id: "hold", role: "feel", name: "ピタッと止めて見せる", en: "Hold (Ma)", plain: "動きをピタッと止めて、見せたいものを一瞬しっかり見せる。日本でいう「間」", short: "大事なところでピタッと止まり", prompt: "間（ホールド）：見せたい瞬間は動きをピタッと止めて、一拍しっかり見せる", moods: { wa: 3, elegant: 3, cool: 2, calm: 1 }, purposes: { shop: 2, showreel: 2, intro: 1 } }),
    T({ id: "breathing", role: "feel", name: "呼吸するように、ずっと続く", en: "Breathing Loop", plain: "ふくらんで、しぼんで。ずっと見ていられるループ", short: "呼吸するようにゆっくりふくらんで", prompt: "ブリージング・ループ：ゆっくりふくらんでしぼむ動きで、切れ目なくループさせる", moods: { calm: 3, mystic: 2, elegant: 1, emo: 1 }, purposes: { poster: 3 }, keys: ["ループ", "ずっと", "待ち受け", "壁紙", "作業用"] }),

    T({ id: "lightsweep", role: "atmos", name: "きらっと光が走る", en: "Light Sweep / Glow", plain: "光が表面をすっと横切って、きらっと輝く", short: "光がきらっと表面を走り", prompt: "ライトスイープ：光の筋が表面を横切ってきらっと輝く。光のにじみ（グロー）も少し", moods: { elegant: 3, future: 3, cool: 2, mystic: 2, exciting: 1 }, purposes: { shop: 3, showreel: 1, event: 1 }, keys: ["ネオン", "光", "キラ", "輝", "ゴールド", "金"] }),
    T({ id: "glitch", role: "atmos", name: "ちょっとだけノイズ", en: "Glitch (subtle)", plain: "画面が一瞬ざざっと乱れる、デジタルなノイズ", short: "一瞬だけデジタルなノイズが走り", prompt: "控えめなグリッチ：場面の切り替えで一瞬だけ色ずれやノイズを入れる（多用しない）", moods: { future: 3, cool: 2 }, purposes: { sns: 1, showreel: 1 }, keys: ["グリッチ", "ノイズ", "バグ", "サイバー", "ハッカー"] }),
    T({ id: "texture", role: "atmos", name: "紙や光の手ざわり", en: "Texture / Grain", plain: "紙の繊維や、うっすらした粒子で、画面に手ざわりが生まれる", short: "紙のような手ざわりの上で", prompt: "テクスチャ：紙の繊維やうっすらした粒子を画面にのせて、手ざわりを出す", moods: { wa: 3, emo: 3, calm: 2, cute: 1, elegant: 1 }, purposes: { poster: 1, intro: 1 }, keys: ["紙", "手ざわり", "手触り", "レトロ", "フィルム", "和紙"] }),

    T({ id: "beatsync", role: "sound", name: "音に合わせて動く", en: "Beat Sync", plain: "リズムに合わせて形が弾み、場面が切り替わる", short: "", prompt: "ビートシンク：テンポを1つ決め、場面の切り替えや大事な動きを拍に合わせる。効果音も動きと同じ瞬間に鳴らす", moods: { pop: 2, exciting: 2, cool: 2, future: 1 }, purposes: { sns: 2, event: 2, showreel: 2 } }),
  ];
  const TECH = Object.fromEntries(TECHNIQUES.map((t) => [t.id, t]));

  // ---------------------------------------------------------------- 聞き取り
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function jitter(seed, id) { return (hashStr(seed + "|" + id) % 1000) / 1000; }
  function count(text, word) {
    if (!word) return 0;
    let n = 0, i = 0;
    while ((i = text.indexOf(word, i)) !== -1) { n++; i += word.length; }
    return n;
  }

  function readWords(text) {
    const t = (text || "").normalize("NFKC");
    const moods = {}, purposes = {};
    for (const [k, m] of Object.entries(MOODS)) {
      let s = 0;
      for (const w of m.words) s += Math.min(2, count(t, w.normalize("NFKC")));
      if (s) moods[k] = s;
    }
    for (const [k, p] of Object.entries(PURPOSES)) {
      let s = 0;
      for (const w of p.words) s += Math.min(2, count(t, w.normalize("NFKC")));
      if (s) purposes[k] = s;
    }
    // 画面に出したい言葉：「」『』"" で囲まれた部分
    const quotes = [];
    const re = /[「『"“]([^」』"”]{1,40})[」』"”]/g;
    let m;
    while ((m = re.exec(t))) quotes.push(m[1].trim());
    // 長さ・画面の形・音
    let seconds = null;
    const sm = t.match(/(\d{1,3})\s*(秒|sec|s\b)/);
    if (sm) seconds = Math.max(5, Math.min(60, parseInt(sm[1], 10)));
    let aspect = null;
    if (/(縦|たて|リール|ショート|TikTok|ティックトック|ストーリー|スマホ全画面|9:16)/i.test(t)) aspect = "9:16";
    else if (/(正方形|スクエア|アイコン|1:1)/i.test(t)) aspect = "1:1";
    else if (/(横|YouTube|ユーチューブ|16:9|プレゼン|スライド)/i.test(t)) aspect = "16:9";
    let sound = null;
    if (/(無音|音なし|音無し|サイレント)/.test(t)) sound = false;
    else if (/(音|BGM|効果音|音楽|ビート|リズム)/.test(t)) sound = true;
    return { text: t, moods, purposes, quotes, seconds, aspect, sound };
  }

  // ---------------------------------------------------------------- 組み立て
  const ADJUST_LABELS = { calm: "もっと落ち着いて", bold: "もっと大胆に", cute: "もっとかわいく", wild: "もっと攻めて" };

  function build(input) {
    const opts = Object.assign({ text: "", purpose: "auto", moods: [], seconds: "auto", aspect: "auto", sound: "auto", onscreen: "", adjust: {}, variant: 0 }, input || {});
    const heard = readWords(opts.text);
    const adj = Object.assign({ calm: 0, bold: 0, cute: 0, wild: 0 }, opts.adjust);

    // 雰囲気の重み
    const M = {};
    for (const [k, v] of Object.entries(heard.moods)) M[k] = (M[k] || 0) + v;
    for (const k of opts.moods || []) M[k] = (M[k] || 0) + 3;
    const noMood = Object.keys(M).length === 0;
    if (noMood) { M.exciting = 1.2; M.cool = 0.8; M.elegant = 0.5; }
    M.calm = (M.calm || 0) + 1.6 * Math.max(0, adj.calm) + 0.8 * Math.max(0, -adj.bold);
    M.elegant = (M.elegant || 0) + 0.8 * Math.max(0, adj.calm);
    M.cool = (M.cool || 0) + 1.4 * Math.max(0, adj.bold);
    M.exciting = (M.exciting || 0) + 1.2 * Math.max(0, adj.bold) - 0.8 * Math.max(0, adj.calm);
    M.cute = (M.cute || 0) + 2.2 * Math.max(0, adj.cute);
    for (const k of Object.keys(M)) if (M[k] <= 0) delete M[k];

    // 用途
    let purpose = opts.purpose && opts.purpose !== "auto" ? opts.purpose : null;
    if (!purpose) {
      const best = Object.entries(heard.purposes).sort((a, b) => b[1] - a[1])[0];
      purpose = best ? best[0] : "showreel";
    }

    // 並べる順：雰囲気の強い順
    const moodOrder = Object.entries(M).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    const topMood = moodOrder[0];
    const seed = heard.text + "#" + opts.variant;

    // 技法の点数
    const scored = TECHNIQUES.map((t) => {
      let s = 0;
      for (const [k, w] of Object.entries(M)) s += w * (t.moods[k] || 0);
      s += 1.6 * (t.purposes[purpose] || 0);
      if (t.keys) for (const w of t.keys) if (heard.text.includes(w)) s += 4;
      if (adj.calm > 0 && ["glitch", "colorwipe", "camera3d", "anticipation"].includes(t.id)) s -= 3 * adj.calm;
      if (adj.calm > 0 && ["breathing", "slowzoom", "hold", "parallax"].includes(t.id)) s += 2.5 * adj.calm;
      if (adj.bold > 0 && ["kinetic", "camera3d", "colorwipe", "anticipation", "geometric"].includes(t.id)) s += 2.5 * adj.bold;
      if (adj.bold > 0 && ["breathing", "slowzoom"].includes(t.id)) s -= 2 * adj.bold;
      if (adj.cute > 0 && ["squash", "spring", "collage", "geometric"].includes(t.id)) s += 2.5 * adj.cute;
      if (adj.wild > 0) s += 6 * jitter(seed + "wild" + adj.wild, t.id);
      s += 1.2 * jitter(seed, t.id); // 同じ言葉なら同じ・「別のレシピ」で入れ替わる
      return { t, s };
    });
    const pick = (role, n) => scored.filter((x) => x.t.role === role).sort((a, b) => b.s - a.s).slice(0, n).map((x) => x.t);
    const heroes = pick("hero", 2);
    const trans = pick("trans", 1);
    const feel = pick("feel", 2);
    const atmosTop = pick("atmos", 1).filter((t) => scored.find((x) => x.t === t).s > 4);

    // 長さ・画面・音・テンポ
    const seconds = opts.seconds !== "auto" && opts.seconds ? Number(opts.seconds) : heard.seconds || (purpose === "poster" ? 10 : 15);
    const aspect = opts.aspect !== "auto" && opts.aspect ? opts.aspect : heard.aspect || (purpose === "sns" ? "9:16" : "16:9");
    const sound = opts.sound !== "auto" ? opts.sound === "on" || opts.sound === true : heard.sound !== null ? heard.sound : true;
    let bpm = Math.round(moodOrder.slice(0, 2).reduce((a, k, i) => a + MOODS[k].bpm * (i ? 0.35 : 0.65), 0) / (moodOrder.length > 1 ? 1 : 0.65));
    bpm = Math.round(bpm * (1 - 0.12 * Math.max(0, adj.calm)) * (1 + 0.1 * Math.max(0, adj.bold)) * (1 + 0.06 * Math.max(0, adj.wild)));
    bpm = Math.max(60, Math.min(150, bpm));
    const chosen = [...heroes, ...trans, ...feel, ...atmosTop];
    if (sound) chosen.push(TECH.beatsync);

    // 色：いちばん強い雰囲気の色＋2番目の差し色
    const palette = MOODS[topMood].palette.slice();
    const second = moodOrder[1] ? MOODS[moodOrder[1]] : null;
    const paletteWords = MOODS[topMood].paletteWords + (second && second !== MOODS[topMood] ? `（${second.label}らしさを少し）` : "");

    const onscreen = (opts.onscreen || "").trim() || heard.quotes.join("／");
    const moodLabel = moodOrder.slice(0, 2).map((k) => MOODS[k].label).join("×");
    const feelWord = MOODS[topMood].feel;

    // 人の言葉での「仕上がりのイメージ」
    const A = MOODS[topMood], B = moodOrder[1] ? MOODS[moodOrder[1]] : null;
    const noun = PURPOSES[purpose].noun;
    const d1 = B ? `${A.adv}、${B.adj}${noun}。${seconds}秒。` : `${A.adj}${noun}。${seconds}秒。`;
    const d2 = heroes.length > 1 ? `${heroes[0].short}、${heroes[1].end}。` : `${heroes[0].end}。`;
    const d3 = feel[0] && trans[0] ? `${feel[0].short}、${trans[0].end}。` : "";
    const direction = `${d1}${d2}${d3}${PURPOSES[purpose].ending}。`;

    const prompt = composePrompt({ text: opts.text, heard, purpose, seconds, aspect, sound, bpm, palette, paletteWords, onscreen, direction, chosen, wild: adj.wild > 0, moodLabel });
    return { purpose, purposeLabel: PURPOSES[purpose].label, moods: moodOrder.slice(0, 3), moodLabel, seconds, aspect, sound, bpm, palette, onscreen, direction, techniques: chosen, prompt };
  }

  const SIZE = { "16:9": "横長 16:9（1920×1080）", "9:16": "縦長 9:16（1080×1920）", "1:1": "正方形 1:1（1080×1080）" };

  function composePrompt(r) {
    const L = [];
    L.push("あなたが今できる最高のモーショングラフィックで、見た人が思わず「すごい」と声に出す1本を作ってください。");
    L.push("いま世界中で話題の「AIが本気で作るモーショングラフィック」です。あなたの腕前を、出し惜しみせず全力で証明してください。");
    L.push("");
    L.push("■ 作りたいもの（本人の言葉）");
    L.push(r.text && r.text.trim() ? r.text.trim() : "おまかせ。あなたがいちばん得意な見せ方で");
    L.push("");
    L.push("■ 仕上がりのイメージ");
    L.push(r.direction);
    L.push("");
    L.push("■ 使ってほしい演出（これは出発点です。もっと良い見せ方を思いついたら、そちらを選んでかまいません）");
    r.chosen.forEach((t, i) => L.push(`${i + 1}. ${t.prompt}`));
    L.push("");
    L.push("■ 条件");
    L.push(`- 長さ：${r.seconds}秒　画面：${SIZE[r.aspect]}`);
    L.push("- 形式：HTMLファイル1枚（HTML・CSS・JavaScriptをすべてこの中にまとめる）。今いる作業フォルダに motion.html として保存し（同じ名前があれば motion-2.html のように番号をつける）、できたらブラウザで開く（Mac なら open コマンド）");
    L.push(r.sound
      ? "- 再生：最後まで行ったら「もう一度見る」ボタンを出す"
      : "- 再生：開いたらすぐ再生し、最後まで行ったら「もう一度見る」ボタンを出す");
    L.push("- 外部のライブラリを使う時は CDN から読み込む（three.js など）。フォントはパソコンに入っている日本語フォントを使う");
    L.push("- 時間の管理：すべての動きを1本のタイムライン（経過時間から各場面の状態を計算する形）で管理し、コマ落ちしても時間どおりに進むようにする");
    if (r.sound) L.push(`- 音：Web Audio API で、BGM（テンポ ${r.bpm}BPM 前後）と効果音をコードだけで作る。ブラウザの決まりで最初は音が出ないので、最初の画面に大きな「▶ 音つきで再生」ボタンを置き、押したら映像と音を同時に始める。大事な動きと効果音は同じ瞬間に`);
    else L.push("- 音：なし（映像だけで気持ちよく見せる）");
    L.push(r.onscreen ? `- 画面に出す言葉：「${r.onscreen}」（この言葉は一字一句そのまま使う）` : "- 画面に出す言葉：上の「作りたいもの」から、短くて強い言葉をあなたが選ぶ（多くても1場面1〜2語）");
    L.push(`- 色：${r.paletteWords}（例：${r.palette.join(" ")}）`);
    L.push("- 文字：日本語は読みやすい太さのフォントで。小さすぎる文字は使わない");
    L.push("");
    L.push("■ いちばん大事なこと");
    L.push("- 演出を並べるだけにしない。ひとつの芯のアイデア（たとえば最初に出た形が最後まで姿を変え続ける）で、全部の場面をつなぐ");
    L.push("- その芯は、説明がなくても画面を見るだけで伝わるようにする");
    L.push("- 場面の切れ目はパッと切らず、前の場面の形を次の場面へ受け渡してつなぐ");
    L.push("- 動きは等速にしない。加速・減速（イージング）と、止める瞬間（間）をつける");
    L.push("- キャラクターや動物の絵をコードで描かない。図形・文字・模様・光・3Dの形で表現する（写真やイラストのファイルを渡された時だけ、それを使う）");
    if (r.wild) L.push("- 今回は攻めてください。型どおりの展開を1か所わざと裏切って、予想外の見せ方を入れる");
    L.push("");
    L.push("作り始める前に、芯のアイデアと場面の流れを3行で書き出してから作ってください。");
    L.push("完成したら、使った演出と、芯のアイデアを1行ずつ教えてください。");
    return L.join("\n");
  }

  // おまかせのお題（入力が空のとき）
  const IDEAS = [
    "やさしくて、ちょっとワクワクする自己紹介",
    "雨の日のカフェみたいに、ほっとする動くポスター",
    "新メニューを、おしゃれでかっこよく告知したい",
    "友だちの誕生日を、にぎやかに全力でお祝いしたい",
    "AIの仕組みを、近未来っぽくわかりやすく解説",
    "和風で上品な、筆と墨のショーリール",
    "夜空と星で、神秘的な15秒",
    "夕焼けみたいに少し切ない、旅の思い出",
  ];

  const api = { MOODS, PURPOSES, TECHNIQUES, TECH, ADJUST_LABELS, IDEAS, readWords, build };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MotionRecipe = api;
})(typeof window !== "undefined" ? window : globalThis);
