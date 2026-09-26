/* モーションレシピ — ことば → 技法 → Opus 5.5 へのプロンプト
 * 外部のAIやAPIは使わない。辞書と組み合わせのルールだけで、同じ言葉なら同じレシピになる。
 * ブラウザでは window.MotionRecipe、Node では module.exports。
 *
 * 2026-09-26 19:3x 初見レビュー（review/REVIEW.md）を受けて作り直した所
 * - 色は「夜・朝・秋…」のような場面の言葉からも決める（夜の図書館が朝の色になっていた）
 * - 「10月1日」の「月」のような日付は、雰囲気の聞き取りから外す
 * - 用途が読めない時は「短い映像作品」。署名で締めるのは名前を入れた時だけ
 * - 自分で選んだ雰囲気は推測より必ず上。言葉の中の決め手（数字・筆・3D…）は必ず演出に入れる
 * - 「別のレシピ」は主役の演出と色を本当に入れ替える。調整ボタンは演出を最低1つ動かす
 */
(function (root) {
  "use strict";

  // ---------------------------------------------------------------- 雰囲気
  // palettes は2案。「別のレシピ」で入れ替わる
  const MOODS = {
    cute: {
      adv: "かわいく", adj: "かわいい", noun: "かわいさ", label: "かわいい",
      words: ["かわい", "可愛", "キュート", "ゆるい", "ゆるっ", "ぽよん", "ぷにぷに", "まんまる", "丸い", "パステル", "ピンク", "おちゃめ", "愛嬌", "カピバラ", "ねこ", "猫", "いぬ", "犬", "うさぎ", "動物", "赤ちゃん", "子ども", "こども", "キッズ", "スイーツ", "お菓子", "ぬいぐるみ"],
      palettes: [
        { c: ["#FFF6EE", "#FF8FA3", "#FFC75F", "#7FD8BE", "#4A4458"], w: "ミルクのような白、ピーチピンク、はちみつ色、ミントを少し" },
        { c: ["#FBF7FF", "#C9B6FF", "#9ADCF5", "#FFB5C8", "#46405A"], w: "ミルク色の地に、ラベンダー、ソーダ水の水色、いちごミルクのピンク" },
      ],
      bpm: 112,
    },
    cool: {
      adv: "かっこよく", adj: "かっこいい", noun: "かっこよさ", label: "かっこいい",
      words: ["かっこい", "カッコい", "格好い", "クール", "スタイリッシュ", "シャープ", "力強", "迫力", "ダイナミック", "疾走", "スピード", "キレ", "モノクロ", "ストリート", "バトル", "ロック", "渋い", "男前"],
      palettes: [
        { c: ["#0E0E10", "#F4F4EF", "#E8FF3A", "#6B6B70"], w: "黒と白を基本に、差し色に蛍光イエローを1色だけ" },
        { c: ["#0B0F14", "#EDEFF2", "#FF3B30", "#5A6270"], w: "黒と白を基本に、差し色に鮮やかな赤を1色だけ" },
      ],
      bpm: 128,
    },
    calm: {
      adv: "やさしく", adj: "やさしい", noun: "やさしさ", label: "癒やし",
      words: ["癒", "いやし", "落ち着", "ゆったり", "のんびり", "静か", "しずか", "やさし", "優し", "穏やか", "おだやか", "リラックス", "眠", "おやすみ", "雨", "自然", "森", "瞑想", "ヨガ", "深呼吸", "ほっと", "そっと", "ふんわり"],
      palettes: [
        { c: ["#F3F5EF", "#A8C5B5", "#6E9FB5", "#F2E3C4", "#3E4A46"], w: "生成り、セージグリーン、淡い水色" },
        { c: ["#F5F2EC", "#C7D3C0", "#B5C9D6", "#E8D9C5", "#4A4F4C"], w: "生成りに、くすんだミントと、霧のような青" },
      ],
      bpm: 72,
    },
    warm: {
      adv: "あたたかく", adj: "あたたかい", noun: "あたたかさ", label: "あたたかい",
      words: ["あたたか", "温か", "暖か", "ぬくもり", "ほっこり", "パン", "焼きたて", "カフェ", "コーヒー", "珈琲", "紅茶", "おいし", "美味し", "ごはん", "ご飯", "料理", "スープ", "手作り", "家族", "木の", "キャンドル", "灯り", "おうち"],
      palettes: [
        { c: ["#FFF4E6", "#E8A35C", "#C8553D", "#F2C14E", "#5B3A29"], w: "クリーム色、キャラメル、トマトの赤、はちみつ色" },
        { c: ["#FBF1E4", "#D98E4C", "#8A5A44", "#F4D58D", "#3F2A1E"], w: "ミルクティー色、焼き色のブラウン、バター色" },
      ],
      bpm: 92,
    },
    genki: {
      adv: "元気いっぱいに", adj: "元気いっぱいの", noun: "元気さ", label: "元気",
      words: ["元気", "明るい", "前向き", "ポジティブ", "朝活", "早起き", "がんば", "頑張", "応援", "エール", "スポーツ", "達成", "続け", "習慣", "チャレンジ", "やる気", "ファイト"],
      palettes: [
        { c: ["#FFFBEA", "#FFB400", "#FF6B35", "#2EC4B6", "#1B263B"], w: "朝日の黄色とオレンジに、ターコイズをひとさじ" },
        { c: ["#F6FFF4", "#7AE582", "#FFD23F", "#3A86FF", "#1F2A44"], w: "若葉の黄緑、レモン色、青空の青" },
      ],
      bpm: 128,
    },
    elegant: {
      adv: "上品に", adj: "上品な", noun: "上品さ", label: "上品",
      words: ["おしゃれ", "オシャレ", "お洒落", "上品", "高級", "エレガント", "大人", "洗練", "ラグジュアリー", "上質", "ホテル", "ジュエリー", "シック", "ミニマル", "シンプル", "余白", "美しい", "美し"],
      palettes: [
        { c: ["#F7F3EC", "#1F1D1A", "#B8975A", "#8C8479"], w: "アイボリー、墨色、控えめな金" },
        { c: ["#F4F1EE", "#2E3440", "#A3A9B5", "#C9A96E"], w: "白磁のような白、チャコール、銀と金をほんの少し" },
      ],
      bpm: 84,
    },
    future: {
      adv: "近未来っぽく", adj: "近未来の", noun: "近未来っぽさ", label: "未来",
      words: ["未来", "近未来", "サイバー", "SF", "テック", "テクノロジー", "AI", "デジタル", "ネオン", "宇宙", "ロボット", "データ", "ホログラム", "ハイテク", "プログラム"],
      palettes: [
        { c: ["#070B1A", "#1B2A6B", "#3DF5FF", "#B06CFF", "#EAF6FF"], w: "深い紺の夜に、シアンと紫の光" },
        { c: ["#050505", "#0F2E24", "#39FF88", "#E6FFE9"], w: "真っ黒な画面に、グリーンの光" },
      ],
      bpm: 124,
    },
    emo: {
      adv: "少し切なく", adj: "少し切ない", noun: "切なさ", label: "エモい",
      words: ["エモ", "切な", "せつな", "懐かし", "なつかし", "思い出", "青春", "夕暮れ", "夕焼け", "ノスタルジー", "レトロ", "卒業", "旅", "記憶", "手紙", "フィルム", "昭和", "平成"],
      palettes: [
        { c: ["#2B1B3D", "#FF7E5F", "#FEB47B", "#F7E6D4"], w: "夕焼けのオレンジから、夜の紫へのグラデーション" },
        { c: ["#1C2541", "#5BC0BE", "#F4D35E", "#EDE7E3"], w: "夜明け前の藍色に、青緑と街灯の黄色" },
      ],
      bpm: 90,
    },
    pop: {
      adv: "にぎやかに", adj: "にぎやかな", noun: "にぎやかさ", label: "ポップ",
      words: ["ポップ", "カラフル", "にぎやか", "楽しい", "たのしい", "ハッピー", "パーティ", "お祭り", "祭", "ビビッド", "陽気", "ノリノリ", "テンション"],
      palettes: [
        { c: ["#FFFFFF", "#FF3E6C", "#FFD23F", "#3BCEAC", "#2D2D2D"], w: "白地に、ビビッドな赤・黄・ミントをはっきり" },
        { c: ["#FFF8E7", "#7B61FF", "#FF8A00", "#00C2A8", "#222222"], w: "クリーム地に、ぶどう色・オレンジ・エメラルドをはっきり" },
      ],
      bpm: 132,
    },
    wa: {
      adv: "和の風情たっぷりに", adj: "和の風情の", noun: "和の風情", label: "和",
      words: ["和風", "和の", "和柄", "和紙", "日本", "着物", "浴衣", "神社", "お寺", "鳥居", "書道", "筆", "墨", "桜", "紅葉", "抹茶", "茶道", "京都", "侍", "忍者", "伝統", "職人", "お正月"],
      palettes: [
        { c: ["#F3EDE0", "#1B1712", "#1F3668", "#E4472F"], w: "生成りの紙、墨、藍、朱" },
        { c: ["#F2EEE3", "#2B2B2B", "#7B8D42", "#C0392B", "#D9A441"], w: "和紙の白、墨、抹茶、紅、金茶" },
      ],
      bpm: 96,
    },
    exciting: {
      adv: "ワクワクするように", adj: "ワクワクする", noun: "ワクワク感", label: "ワクワク",
      words: ["ワクワク", "わくわく", "ドキドキ", "どきどき", "期待", "始まる", "はじまる", "スタート", "オープン", "挑戦", "冒険", "発表", "新発売", "いよいよ", "カウントダウン", "爆発", "全力"],
      palettes: [
        { c: ["#FFF8F0", "#FF5A36", "#1E2A78", "#FFC93C"], w: "明るい白に、朱赤と紺、ひとさじの黄色" },
        { c: ["#0F1020", "#FF2E63", "#08D9D6", "#EAEAEA"], w: "夜のステージの暗さに、ピンクとシアンのライト" },
      ],
      bpm: 124,
    },
    mystic: {
      adv: "神秘的に", adj: "神秘的な", noun: "神秘的な空気", label: "神秘的",
      words: ["神秘", "幻想", "ファンタジー", "魔法", "星", "夜空", "銀河", "オーロラ", "精霊", "不思議", "スピリチュアル", "占い", "タロット", "月夜", "月明かり", "満月", "三日月", "蛍", "ホタル"],
      palettes: [
        { c: ["#0B0A1F", "#3A2E7A", "#C9B6FF", "#FFE9A8"], w: "夜の藍色に、藤色の光と月の黄色" },
        { c: ["#06141B", "#11575C", "#7FE7DC", "#F2F0D5"], w: "深い海の色に、青緑の光と、ほのかな白" },
      ],
      bpm: 80,
    },
  };
  const QUIET = ["calm", "elegant", "emo", "mystic", "warm"];

  // ---------------------------------------------------------------- 場面（時間帯・季節）
  // 書いた言葉に場面があれば、色は場面から決める。同点なら上にあるほうが先
  const SCENES = {
    night: { label: "夜", phrase: "夜の静けさの中で、", words: ["夜", "星空", "月夜", "月明かり", "満月", "三日月", "おやすみ", "寝る前", "眠る前", "ナイト", "蛍", "ホタル"],
      palettes: [
        { c: ["#0B1026", "#1E2A5A", "#F6E7B0", "#8FB8DE", "#E9ECF5"], w: "夜の藍色に、月明かりのクリーム色と淡い青" },
        { c: ["#0A0F1E", "#2A1E4A", "#FFD27A", "#6C8EBF", "#F2F2F2"], w: "夜の群青に、灯りのオレンジと星の白" },
      ] },
    autumn: { label: "秋", phrase: "秋の実りの中で、", words: ["秋", "栗", "かぼちゃ", "紅葉", "もみじ", "いちょう", "ハロウィン", "焼き芋", "さつまいも"],
      palettes: [
        { c: ["#FFF4E6", "#D9822B", "#8C3B1E", "#F2C14E", "#4A2C1A"], w: "秋の実りのクリーム色、栗色、かぼちゃのオレンジ" },
        { c: ["#FBF3E8", "#B5532B", "#C9A227", "#6B8F71", "#3A2A20"], w: "紅葉の赤茶、いちょうの黄、深い緑" },
      ] },
    winter: { label: "冬", phrase: "冬の澄んだ空気の中で、", words: ["冬", "雪", "クリスマス", "サンタ", "年末"],
      palettes: [
        { c: ["#F7FAFC", "#B8D8EB", "#E63946", "#2A9D8F", "#1D3557"], w: "雪の白と氷の青、差し色に赤" },
        { c: ["#F5F7FA", "#D6E2F0", "#8DA9C4", "#FFFFFF", "#243B53"], w: "雪の白と、しんとした青のグラデーション" },
      ] },
    spring: { label: "春", phrase: "春のやわらかい光の中で、", words: ["春", "桜", "さくら", "花見", "入学", "新生活", "新学期"],
      palettes: [
        { c: ["#FFF7FA", "#F6B5C6", "#A8D8B9", "#FFE08A", "#5A4A5E"], w: "桜色と若葉色、やわらかい黄色" },
        { c: ["#FAFFF7", "#FFC4D6", "#C1E1C1", "#FDFD96", "#4F5D75"], w: "白に近い桜色、若草、菜の花の黄色" },
      ] },
    summer: { label: "夏", phrase: "夏のまぶしい光の中で、", words: ["夏", "海", "花火", "プール", "青空", "ひまわり", "かき氷"],
      palettes: [
        { c: ["#F4FBFF", "#1FA2FF", "#12D8FA", "#FFE66D", "#0B3954"], w: "夏空の青と水色、ひまわりの黄色" },
        { c: ["#FFFDF5", "#FF6B6B", "#4ECDC4", "#FFE66D", "#1A535C"], w: "かき氷のいちご色、ラムネの青緑、レモン色" },
      ] },
    morning: { label: "朝", phrase: "朝の光の中で、", words: ["朝", "早起き", "モーニング", "日の出", "おはよう"],
      palettes: [
        { c: ["#FFF9EC", "#FFD37A", "#9FD8CB", "#F7A9A8", "#3D4B5C"], w: "朝の光のような生成りに、朝日の黄色とミント" },
        { c: ["#F7FBFF", "#BFE3F5", "#FFE3A3", "#F9C6B5", "#40505E"], w: "朝の空の水色に、やわらかい黄色と桃色" },
      ] },
  };

  // ---------------------------------------------------------------- 用途
  // end(w)：締めの一文。w は「」で囲んだ言葉か、画面に出したい言葉の1つ目
  const PURPOSES = {
    intro: { noun: "自己紹介", label: "自己紹介", words: ["自己紹介", "プロフィール", "名刺", "はじめまして", "私のこと", "わたしのこと", "自分のこと"],
      end: (w) => (w ? `最後に「${w}」が気持ちよく止まって終わる` : "最後に名前（と一言）が気持ちよく止まって終わる") },
    event: { noun: "告知", label: "イベント告知", words: ["告知", "お知らせ", "イベント", "開催", "募集", "セミナー", "オフ会", "講座", "勉強会", "ライブ", "交流会", "ワークショップ", "読書会", "シェア会", "説明会", "発表会"],
      end: () => "最後にタイトルと日付がはっきり読める形で止まる" },
    shop: { noun: "お店・商品の紹介", label: "お店・商品", words: ["お店", "店", "屋さん", "商品", "メニュー", "新作", "販売", "発売", "限定", "セール", "予約", "開店", "CM", "広告", "宣伝", "ショップ", "サービス", "ブランド"],
      end: (w) => (w ? `最後に「${w}」が主役で止まる` : "最後に商品名やお店の名前が主役で止まる") },
    explain: { noun: "解説", label: "解説・図解", words: ["解説", "説明", "仕組み", "しくみ", "手順", "図解", "比較", "わかりやすく", "教える", "入門"],
      end: () => "最後に要点がひと目でわかる形で止まる" },
    poster: { noun: "動くポスター", label: "動くポスター", words: ["ポスター", "待ち受け", "壁紙", "ループ", "背景", "作業用"], loop: true,
      end: (w) => (w ? `「${w}」がいちばん長く見えるようにして、最初へなめらかにつながるループにする` : "最初と最後がなめらかにつながるループにする") },
    showreel: { noun: "ショーリール", label: "ショーリール", words: ["ショーリール", "腕前", "作品集", "ポートフォリオ", "見せつけ"],
      end: (w) => (w ? `最後に「${w}」が署名のように止まる` : "最後にいちばん見せたい形が、ぴたっと決まって終わる") },
    celebrate: { noun: "お祝い", label: "お祝い", words: ["誕生日", "おめでとう", "結婚", "お祝い", "記念", "周年", "卒業", "合格", "ありがとう", "感謝"],
      end: (w) => (w ? `最後に「${w}」が大きく残る` : "最後にお祝いの言葉が大きく残る") },
    sns: { noun: "SNS動画", label: "SNSのつかみ", words: ["SNS", "インスタ", "Instagram", "TikTok", "ティックトック", "リール", "ショート動画", "ショーツ", "Twitter", "Threads", "スレッズ", "バズ", "つかみ"],
      end: () => "最初の1秒で目を止め、最後にもう一度見たくなる一瞬で終わる" },
    // 用途が読めない時の受け皿（選択肢には出さない）
    short: { noun: "短い映像作品", label: "短い映像作品", words: [], hidden: true,
      end: (w) => (w ? `最後に「${w}」がはっきり残って終わる` : "最後に、いちばん伝えたいものがはっきり残って終わる") },
  };

  // ---------------------------------------------------------------- 技法
  // role: hero（主役の見せ方）/ trans（場面のつなぎ）/ feel（動きの気持ちよさ）/ atmos（空気・光）/ sound
  // moods・purposes はその雰囲気・用途との相性（0〜3）
  // keys：書いた言葉にこれがあれば、その技法は必ず入る。hint：図鑑から入力欄に足す言葉（keys のどれかを含む）
  const T = (o) => o;
  const TECHNIQUES = [
    T({ id: "kinetic", end: "言葉が弾みながら現れる", role: "hero", name: "文字が主役で動く", en: "Kinetic Typography", plain: "言葉そのものが跳ねたり流れたりして、読むより先に気持ちが伝わる", short: "言葉が弾みながら現れて", prompt: "キネティック・タイポグラフィ：画面に出す言葉を主役にして、文字ごとに登場と退場の動きをつける", moods: { cute: 2, cool: 3, pop: 3, exciting: 3, genki: 3, emo: 1, elegant: 1, future: 1, wa: 1, warm: 1 }, purposes: { intro: 2, event: 3, sns: 3, showreel: 2, celebrate: 2, shop: 1 }, keys: ["文字が", "文字を", "タイポ", "テロップ"], hint: "文字が主役で動いて" }),
    T({ id: "semantic", end: "言葉が自分の意味どおりに動く", role: "hero", name: "意味どおりに動く文字", en: "Semantic Type Motion", plain: "「ゆっくり」はゆっくり、「はやく」ははやく。言葉の意味を動きで見せる", short: "言葉が自分の意味どおりに動いて", prompt: "言葉の意味をそのまま動きにする（例：「ゆっくり」はゆっくり、「ぴたっ」で完全に止める）", moods: { pop: 2, cute: 2, cool: 2, exciting: 2, genki: 2, wa: 1 }, purposes: { sns: 3, showreel: 3, intro: 1, explain: 1 }, keys: ["意味どおり", "擬音", "オノマトペ", "ぴたっ"], hint: "言葉が意味どおりに動いて" }),
    T({ id: "morph", end: "ひとつの形が次々に変身する", role: "hero", name: "形が変身する", en: "Morphing", plain: "丸が四角に、線が文字に。ひとつの形が次々に姿を変える", short: "ひとつの形が次々に変身して", prompt: "モーフィング：ひとつの形が別の形へなめらかに変身していく（丸→ロゴ→文字、など）", moods: { future: 2, cool: 2, elegant: 2, mystic: 2, cute: 1, pop: 2, exciting: 2 }, purposes: { showreel: 3, shop: 2, explain: 2, intro: 1 }, keys: ["変身", "変形", "モーフ", "姿を変", "形が変わ"], hint: "形が次々に変身して" }),
    T({ id: "line", end: "一本の線が走って形を描く", role: "hero", name: "線がすーっと描かれる", en: "Line / Stroke Animation", plain: "一本の線が走って、図やロゴや文字を描いていく", short: "一本の線が走って形を描き", prompt: "ラインアニメーション：線が描かれていく動きで、図・ロゴ・文字の輪郭を見せる", moods: { elegant: 3, future: 2, calm: 2, cool: 1, mystic: 1, warm: 1 }, purposes: { explain: 3, shop: 2, intro: 1, showreel: 1 }, keys: ["線が", "線で", "ライン", "一筆", "線画"], hint: "線で描いて" }),
    T({ id: "brush", end: "筆が書き順どおりに文字を書く", role: "hero", name: "筆で書き順どおりに書く", en: "Brush Stroke Writing", plain: "墨の筆が、書き順どおりに文字を書いていく", short: "筆が書き順どおりに文字を書いて", prompt: "筆の書き順アニメーション：墨の筆が書き順どおりに漢字や言葉を書く。入りと払いの太さの変化、かすれも表現する", moods: { wa: 3, elegant: 2, calm: 1, emo: 1 }, purposes: { intro: 1, showreel: 2, celebrate: 1 }, keys: ["筆", "書道", "墨", "書き順", "習字"], hint: "筆で" }),
    T({ id: "particles", end: "光の粒が集まっては弾ける", role: "hero", name: "粒・光・紙吹雪", en: "Particles", plain: "小さな粒が集まって形になったり、ぱっと散ったりする", short: "光の粒が集まっては弾けて", prompt: "パーティクル：小さな粒（光・紙吹雪・星）が集まって形になり、また散る", moods: { mystic: 3, future: 2, pop: 2, exciting: 2, cute: 1, calm: 1, emo: 1, genki: 1 }, purposes: { celebrate: 3, event: 2, showreel: 2, poster: 2 }, keys: ["キラキラ", "きらきら", "粒", "紙吹雪", "星", "花火", "パーティクル", "蛍", "ホタル"], hint: "光の粒で" }),
    T({ id: "pattern", end: "模様が波のように広がる", role: "hero", name: "模様が自分で育つ", en: "Generative Pattern", plain: "模様やタイルが波のように広がって、画面全体が生きもののように動く", short: "模様が波のように広がって", prompt: "ジェネラティブ・パターン：模様（和柄・タイル・グリッド）がコードで生まれ、波のように広がってうねる", moods: { wa: 3, future: 2, pop: 2, calm: 1, mystic: 2, elegant: 1 }, purposes: { poster: 3, showreel: 2, sns: 1 }, keys: ["模様", "柄", "パターン", "タイル", "青海波", "幾何学"], hint: "模様が広がって" }),
    T({ id: "camera3d", end: "カメラが3Dの奥へ飛び込む", role: "hero", name: "3Dの中をカメラが進む", en: "3D Camera Fly-through", plain: "画面の奥へ奥へと、カメラが3Dの空間を進んでいく", short: "カメラが3Dの奥へ飛び込み", prompt: "3Dカメラ移動：three.js などで奥行きのある空間を作り、カメラが中を進んでいく", moods: { future: 3, cool: 3, mystic: 2, exciting: 3, wa: 1, genki: 1 }, purposes: { showreel: 3, event: 2, sns: 2 }, keys: ["3D", "立体", "奥行き", "トンネル", "宇宙"], hint: "3Dで" }),
    T({ id: "infographic", end: "数字やグラフが気持ちよく伸びる", role: "hero", name: "数字やグラフが動く", en: "Kinetic Infographics", plain: "数字がカウントアップし、グラフが伸びて、説明がすっと入る", short: "数字やグラフが気持ちよく伸びて", prompt: "キネティック・インフォグラフィック：数字のカウントアップ、グラフが伸びる動きで、情報を気持ちよく見せる", moods: { future: 2, cool: 1, elegant: 1, pop: 1, genki: 3 }, purposes: { explain: 3, shop: 1, event: 1 }, keys: ["数字", "グラフ", "データ", "実績", "割合", "%", "ランキング", "カウント", "増えて", "増える"], hint: "数字がカウントアップして" }),
    T({ id: "ui", end: "アプリの画面が動いて使い方を見せる", role: "hero", name: "画面やボタンが動く", en: "UI Motion", plain: "スマホやパソコンの画面が動いて、使っている様子を見せる", short: "アプリの画面が動いて使い方を見せ", prompt: "UIモーション：架空のスマホやPCの画面を作り、ボタンやカードが動いて操作の流れを見せる", moods: { future: 2, pop: 1, cool: 1, elegant: 1 }, purposes: { shop: 1, explain: 2, sns: 1 }, keys: ["アプリの", "サイトの", "ボタン", "操作", "UI", "使い方"], hint: "アプリの画面で" }),
    T({ id: "collage", end: "切り抜いた紙がぺたぺた重なる", role: "hero", name: "切り抜いた紙を重ねる", en: "Paper Cut / Collage", plain: "紙を切り抜いて貼ったような重なりが、ぺたぺた動く", short: "切り抜いた紙がぺたぺた重なって", prompt: "ペーパーカット／コラージュ：紙を切り抜いたような形が重なり、影つきで貼られたり剥がれたりする", moods: { cute: 3, emo: 2, pop: 2, calm: 1, warm: 3, genki: 1 }, purposes: { intro: 2, celebrate: 2, event: 2, shop: 1 }, keys: ["切り絵", "コラージュ", "切り抜", "付箋", "スクラップ", "ペーパー"], hint: "切り絵風に" }),
    T({ id: "liquid", end: "色がインクのようににじみ広がる", role: "hero", name: "とろける・にじむ", en: "Liquid / Ink Bleed", plain: "インクがにじんだり、液体のようにとろけて形が変わる", short: "色がインクのようににじみ広がって", prompt: "リキッド表現：インクがにじむ、しずくが落ちて広がる、液体のように形がとろける", moods: { calm: 2, mystic: 2, wa: 2, elegant: 2, emo: 2, cute: 1, warm: 1 }, purposes: { poster: 2, showreel: 2, shop: 1 }, keys: ["にじ", "滲", "インク", "しずく", "雫", "水彩", "とろけ", "液体"], hint: "インクがにじむように" }),
    T({ id: "geometric", end: "丸や三角がリズムよく並び替わる", role: "hero", name: "図形のリズム", en: "Geometric Shape Animation", plain: "丸・三角・四角が音楽のように並んだり回ったりする", short: "丸や三角がリズムよく並び替わり", prompt: "ジオメトリック・アニメーション：丸・三角・四角などの図形がリズムよく並び、回り、組み替わる", moods: { pop: 3, cool: 2, cute: 2, exciting: 2, future: 1, genki: 2 }, purposes: { sns: 2, event: 2, showreel: 2, poster: 2 }, keys: ["図形", "三角", "四角", "幾何学"], hint: "図形がリズムよく" }),

    T({ id: "matchcut", end: "前の場面の形が、そのまま次の場面になる", role: "trans", name: "前の形が次の形になる", en: "Match Transition", plain: "場面が切り替わる時、前の場面の形がそのまま次の場面の部品になる", short: "前の場面の形がそのまま次の場面になって", prompt: "マッチトランジション：場面の切り替えでカットせず、前の場面の形を次の場面の部品へ受け渡す", moods: { cool: 2, elegant: 2, future: 2, wa: 2, exciting: 2, mystic: 2, cute: 1, pop: 1, calm: 1, emo: 1, warm: 1, genki: 1 }, purposes: { showreel: 3, shop: 2, explain: 2, intro: 2 }, keys: ["つなが", "受け渡", "マッチカット"], hint: "場面が形でつながって" }),
    T({ id: "maskreveal", end: "文字がスッと幕の向こうから現れる", role: "trans", name: "スッと現れる", en: "Mask Reveal", plain: "見えない幕の向こうから、文字や写真がスッと現れる", short: "文字がスッと幕の向こうから現れて", prompt: "マスク・リビール：マスク（見えない窓）で文字や形を少しずつ見せる", moods: { elegant: 3, cool: 2, calm: 1, emo: 1, future: 1, warm: 1 }, purposes: { shop: 3, intro: 2, event: 1 }, keys: ["スッと", "すっと", "現れ"], hint: "文字がスッと現れて" }),
    T({ id: "colorwipe", end: "色の面がシャッと画面を入れ替える", role: "trans", name: "色の面がシャッと切り替わる", en: "Color Wipe", plain: "大きな色の面が画面を横切って、場面ごと入れ替わる", short: "色の面がシャッと画面を入れ替えて", prompt: "カラーワイプ：大きな色の面が画面を横切り、背景の色ごと場面を切り替える", moods: { pop: 3, cool: 2, exciting: 3, cute: 1, genki: 2 }, purposes: { event: 3, sns: 3, showreel: 1 }, keys: ["ワイプ", "色の面"], hint: "色の面でシャッと切り替えて" }),
    T({ id: "parallax", end: "手前と奥が違う速さで流れる", role: "trans", name: "手前と奥が違う速さで動く", en: "Parallax / 2.5D", plain: "手前はすばやく、奥はゆっくり。平らな絵に奥行きが生まれる", short: "手前と奥が違う速さで流れて", prompt: "パララックス（2.5D）：手前・中・奥の層を違う速さで動かして奥行きを出す", moods: { calm: 3, emo: 3, mystic: 2, elegant: 2, cute: 1, warm: 2 }, purposes: { poster: 3, intro: 1, shop: 1 }, keys: ["パララックス", "手前と奥", "奥と手前"], hint: "手前と奥が違う速さで" }),
    T({ id: "slowzoom", end: "カメラが静かに寄っていく", role: "trans", name: "ゆっくり寄っていく", en: "Slow Zoom", plain: "カメラが静かに寄っていき、見る人を画面の中へ連れていく", short: "カメラが静かに寄っていき", prompt: "スローズーム：カメラがゆっくり寄っていく（途中で止めず、なめらかに）", moods: { elegant: 3, calm: 3, emo: 2, mystic: 2, warm: 2 }, purposes: { shop: 2, poster: 2, intro: 1 }, keys: ["ズーム", "寄って", "寄る"], hint: "ゆっくり寄って" }),

    T({ id: "squash", role: "feel", name: "つぶれて伸びる", en: "Squash & Stretch", plain: "着地でむにっとつぶれ、跳ぶ時にびよんと伸びる。アニメの基本", short: "ぽよんとつぶれて伸び", prompt: "スクワッシュ＆ストレッチ：着地でつぶれ、飛ぶ時に伸びる。体積は保つ", moods: { cute: 3, pop: 3, exciting: 1, genki: 2, warm: 1 }, purposes: { sns: 2, intro: 2, celebrate: 1 }, keys: ["ぽよん", "ぷにぷに", "弾む", "はずむ", "バウンド", "跳ね"], hint: "ぽよんと弾んで" }),
    T({ id: "spring", role: "feel", name: "ビョンと行き過ぎて戻る", en: "Spring / Overshoot", plain: "目標を少し行き過ぎてから、バネのように戻って止まる", short: "バネのように行き過ぎて戻り", prompt: "スプリング：目標の位置を少し行き過ぎてから戻る、バネの動き", moods: { cute: 3, pop: 3, exciting: 2, cool: 1, genki: 3 }, purposes: { sns: 2, event: 2, intro: 1, shop: 1 }, keys: ["バネ", "ばね", "ビョン", "びよん"], hint: "バネみたいに" }),
    T({ id: "stagger", role: "feel", name: "少しずつ時間差で", en: "Stagger", plain: "たくさんの物が、ほんの少しずつ遅れて順番に動く", short: "少しずつ時間差で順番に動き", prompt: "スタッガー：複数の要素をほんの少しずつ時間差で動かし、波のような流れを作る", moods: { elegant: 2, cool: 2, pop: 2, calm: 1, future: 2, cute: 1, warm: 1, genki: 1 }, purposes: { explain: 2, event: 2, intro: 1, shop: 1 }, keys: ["順番に", "時間差"], hint: "少しずつ時間差で" }),
    T({ id: "anticipation", role: "feel", name: "動く前に、ためる", en: "Anticipation", plain: "大きく動く前に、いったん逆にぐっとためる", short: "ぐっとためてから一気に動き", prompt: "予備動作（アンティシペーション）：大きく動く前に、いったん反対にためる", moods: { exciting: 3, cool: 2, pop: 2, cute: 1, genki: 2 }, purposes: { sns: 2, showreel: 2, event: 1 }, keys: ["ためて", "ためる", "溜め"], hint: "ぐっとためてから" }),
    T({ id: "hold", role: "feel", name: "ピタッと止めて見せる", en: "Hold (Ma)", plain: "動きをピタッと止めて、見せたいものを一瞬しっかり見せる。日本でいう「間」", short: "大事なところでピタッと止まり", prompt: "間（ホールド）：見せたい瞬間は動きをピタッと止めて、一拍しっかり見せる", moods: { wa: 3, elegant: 3, cool: 2, calm: 1, warm: 1 }, purposes: { shop: 2, showreel: 2, intro: 1 }, keys: ["ピタッと", "静止", "止めて"], hint: "ピタッと止めて" }),
    T({ id: "breathing", role: "feel", name: "呼吸するように動く", en: "Breathing", plain: "ふくらんで、しぼんで。ずっと見ていられる、呼吸のような動き", short: "呼吸するようにゆっくりふくらんで", prompt: "ブリージング：光や形が、呼吸のようにゆっくりふくらんでしぼむ（ループ作品なら、切れ目なくつなぐ）", moods: { calm: 3, mystic: 2, elegant: 1, emo: 1, warm: 1 }, purposes: { poster: 3 }, keys: ["ループ", "待ち受け", "壁紙", "作業用", "呼吸"], hint: "呼吸するように" }),

    T({ id: "lightsweep", role: "atmos", name: "きらっと光が走る", en: "Light Sweep / Glow", plain: "光が表面をすっと横切って、きらっと輝く", short: "光がきらっと表面を走り", prompt: "ライトスイープ：光の筋が表面を横切ってきらっと輝く。光のにじみ（グロー）も少し", moods: { elegant: 3, future: 3, cool: 2, mystic: 2, exciting: 1, warm: 1 }, purposes: { shop: 3, showreel: 1, event: 1 }, keys: ["ネオン", "キラッ", "きらっ", "輝", "ゴールド", "光が走"], hint: "きらっと光らせて" }),
    T({ id: "glitch", role: "atmos", name: "ちょっとだけノイズ", en: "Glitch (subtle)", plain: "画面が一瞬ざざっと乱れる、デジタルなノイズ", short: "一瞬だけデジタルなノイズが走り", prompt: "控えめなグリッチ：場面の切り替えで一瞬だけ色ずれやノイズを入れる（多用しない）", moods: { future: 3, cool: 2 }, purposes: { sns: 1, showreel: 1 }, keys: ["グリッチ", "ノイズ", "バグ", "サイバー", "ハッカー"], hint: "グリッチで" }),
    T({ id: "texture", role: "atmos", name: "紙や光の手ざわり", en: "Texture / Grain", plain: "紙の繊維や、うっすらした粒子で、画面に手ざわりが生まれる", short: "紙のような手ざわりの上で", prompt: "テクスチャ：紙の繊維やうっすらした粒子を画面にのせて、手ざわりを出す", moods: { wa: 3, emo: 3, calm: 2, cute: 1, elegant: 1, warm: 3 }, purposes: { poster: 1, intro: 1 }, keys: ["紙", "手ざわり", "手触り", "レトロ", "フィルム", "和紙"], hint: "紙の手ざわりで" }),

    T({ id: "beatsync", role: "sound", name: "音に合わせて動く", en: "Beat Sync", plain: "リズムに合わせて形が弾み、場面が切り替わる", short: "", prompt: "ビートシンク：テンポを1つ決め、場面の切り替えや大事な動きを拍に合わせる。効果音も動きと同じ瞬間に鳴らす", moods: { pop: 2, exciting: 2, cool: 2, future: 1, genki: 2 }, purposes: { sns: 2, event: 2, showreel: 2 }, keys: ["ビート", "リズムに", "音に合わせ"], hint: "音に合わせて" }),
    T({ id: "softsound", role: "sound", name: "静かな音で寄り添う", en: "Soft Sound", plain: "やわらかいBGMと小さな効果音が、動きにそっと寄り添う", short: "", prompt: "やさしい音づくり：BGMは静かなパッドやオルゴールのような音にして、効果音は大事な瞬間だけ小さく鳴らす", moods: { calm: 3, elegant: 2, emo: 2, mystic: 2, warm: 2 }, purposes: { poster: 2, intro: 1 }, keys: ["オルゴール", "静かな音", "ピアノ"], hint: "静かな音で" }),
  ];
  const TECH = Object.fromEntries(TECHNIQUES.map((t) => [t.id, t]));
  const PICK = { hero: 2, trans: 1, feel: 2, atmos: 1 };
  const POOL = { hero: 6, trans: 3, feel: 4, atmos: 2 };
  // 調整ボタンで、必ず1つは入れる演出の候補
  const BOOST = {
    calm: ["breathing", "hold", "slowzoom", "parallax", "liquid", "line", "maskreveal"],
    bold: ["kinetic", "colorwipe", "camera3d", "anticipation", "geometric", "semantic", "lightsweep"],
    cute: ["squash", "spring", "collage", "geometric", "particles", "stagger"],
    wild: ["camera3d", "glitch", "morph", "pattern", "semantic", "liquid"],
  };

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
  function score(text, words) {
    let s = 0;
    for (const w of words) s += Math.min(2, count(text, w.normalize("NFKC")));
    return s;
  }
  // 日付・曜日は雰囲気の聞き取りから外す（「10月1日」の「月」が神秘的に当たっていた）
  const DATE_RE = /[0-9〇一二三四五六七八九十]+\s*月\s*(?:[0-9〇一二三四五六七八九十]+\s*日)?|[0-9]+\s*日|(?:毎|今|来|先|翌|前|数|ヶ|か|カ)月|月(?:額|末|初|謝|曜|間|収|給|払)|[月火水木金土日]曜日?/g;

  function readWords(text) {
    const t = (text || "").normalize("NFKC");
    const plain = t.replace(DATE_RE, " ");
    const moods = {}, purposes = {}, scenes = {};
    for (const [k, m] of Object.entries(MOODS)) { const s = score(plain, m.words); if (s) moods[k] = s; }
    for (const [k, p] of Object.entries(PURPOSES)) { const s = score(plain, p.words); if (s) purposes[k] = s; }
    if (/[0-9,]+\s*円/.test(t)) purposes.shop = (purposes.shop || 0) + 2;
    for (const [k, sc] of Object.entries(SCENES)) { const s = score(plain, sc.words); if (s) scenes[k] = s; }
    // 画面に出したい言葉：「」『』"" で囲まれた部分
    const quotes = [];
    const re = /[「『"“]([^」』"”]{1,40})[」』"”]/g;
    let m;
    while ((m = re.exec(t))) { const q = m[1].trim(); if (q && !quotes.includes(q)) quotes.push(q); }
    // 長さ・画面の形・音
    let seconds = null;
    const sm = t.match(/(\d{1,3})\s*(秒|sec)/);
    if (sm) seconds = Math.max(5, Math.min(60, parseInt(sm[1], 10)));
    let aspect = null;
    if (/(縦長|縦型|縦向き|たて長|縦で|リール|ショート動画|ショーツ|TikTok|ティックトック|ストーリーズ|9:16)/i.test(t)) aspect = "9:16";
    else if (/(正方形|スクエア|1:1)/i.test(t)) aspect = "1:1";
    else if (/(横長|横型|横向き|YouTube|ユーチューブ|16:9|プレゼン|スライド)/i.test(t)) aspect = "16:9";
    let sound = null;
    if (/(無音|音なし|音無し|サイレント)/.test(t)) sound = false;
    else if (/(音|BGM|効果音|音楽|ビート|リズム)/.test(t)) sound = true;
    return { text: t, plain, moods, purposes, scenes, quotes, seconds, aspect, sound };
  }

  // ---------------------------------------------------------------- 組み立て
  const ADJUST_LABELS = { calm: "もっと落ち着いて", bold: "もっと大胆に", cute: "もっとかわいく", wild: "もっと攻めて" };
  const ADJUST_LINES = {
    calm: "動きは少なめに、間をたっぷり取る。",
    bold: "大きな文字と強いコントラストで、ぐいぐい見せる。",
    cute: "丸いかたちと、ぽよんと弾む動きを多めに。",
    wild: "途中で1か所、予想を裏切る展開を入れる。",
  };

  function build(input) {
    const opts = Object.assign({ text: "", purpose: "auto", moods: [], seconds: "auto", aspect: "auto", sound: "auto", onscreen: "", adjust: {}, variant: 0, last: "" }, input || {});
    const heard = readWords(opts.text);
    const adj = Object.assign({ calm: 0, bold: 0, cute: 0, wild: 0 }, opts.adjust);
    const variant = Math.max(0, opts.variant | 0);
    const picked = (opts.moods || []).filter((k) => MOODS[k]).slice(0, 2);

    // 雰囲気：rank＝並び（後から押した調整 ＞ 自分で選んだ ＞ 言葉からの推測）、W＝演出の点数に使う重み
    const rank = {}, W = {};
    for (const [k, v] of Object.entries(heard.moods)) { rank[k] = v; W[k] = Math.min(v, 5); }
    if (!picked.length && !Object.keys(rank).length) { rank.exciting = W.exciting = 1.2; rank.cool = W.cool = 0.8; rank.elegant = W.elegant = 0.5; }
    picked.forEach((k, i) => { rank[k] = 100 - i; W[k] = 6; });
    if (adj.cute > 0) { rank.cute = 200 + adj.cute; W.cute = 6 + adj.cute; }
    if (adj.calm > 0) W.calm = (W.calm || 0) + 1.5 * adj.calm;
    const moodOrder = Object.entries(rank).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    const topMood = moodOrder[0];

    // 場面（夜・朝・季節）
    const sceneEntry = Object.entries(heard.scenes).sort((a, b) => b[1] - a[1])[0];
    const scene = sceneEntry ? sceneEntry[0] : null;

    // 用途：読めない時は「短い映像作品」
    let purpose = opts.purpose && opts.purpose !== "auto" && PURPOSES[opts.purpose] ? opts.purpose : null;
    if (!purpose) {
      const best = Object.entries(heard.purposes).sort((a, b) => b[1] - a[1])[0];
      purpose = best ? best[0] : "short";
    }

    // 画面に出す言葉：欄に書いたもの（／で区切る）＋「」で囲んだ言葉
    const onscreen = (opts.onscreen || "").split(/[／/\n]+/).map((s) => s.trim()).filter(Boolean);
    for (const q of heard.quotes) if (!onscreen.includes(q)) onscreen.push(q);
    const endWord = heard.quotes.length ? heard.quotes[heard.quotes.length - 1] : onscreen[0] || "";

    // 技法の点数
    const forced = new Map(); // id → 優先度（大きいほど先）
    const scored = TECHNIQUES.map((t) => {
      let s = 0;
      for (const [k, w] of Object.entries(W)) s += w * (t.moods[k] || 0);
      s += 1.6 * (t.purposes[purpose] || 0);
      if (t.keys && t.keys.some((w) => heard.plain.includes(w.normalize("NFKC")))) { s += 4; forced.set(t.id, 1); }
      if (adj.calm > 0 && ["glitch", "colorwipe", "camera3d", "anticipation", "spring", "beatsync"].includes(t.id)) s -= 3 * adj.calm;
      if (adj.calm > 0 && BOOST.calm.includes(t.id)) s += 2.5 * adj.calm;
      if (adj.bold > 0 && BOOST.bold.includes(t.id)) s += 2.5 * adj.bold;
      if (adj.bold > 0 && ["breathing", "slowzoom"].includes(t.id)) s -= 2 * adj.bold;
      if (adj.cute > 0 && BOOST.cute.includes(t.id)) s += 2.5 * adj.cute;
      if (adj.wild > 0) s += 6 * jitter(heard.text + "wild" + adj.wild, t.id);
      s += 1.2 * jitter(heard.text, t.id); // 同じ言葉なら同じ
      return { t, s };
    });
    const S = Object.fromEntries(scored.map((x) => [x.t.id, x.s]));
    // 調整ボタン：そのボタンを1回前に押した時のレシピに入っていない候補を、必ず1つ入れる（押すたびに演出が動く）
    for (const k of ["calm", "bold", "cute", "wild"]) {
      if (!(adj[k] > 0)) continue;
      const prevAdj = Object.assign({}, adj, { [k]: adj[k] - 1 });
      const before = new Set(buildCached(Object.assign({}, opts, { adjust: prevAdj })).techniques.map((t) => t.id));
      const ranked = BOOST[k].slice().sort((a, b) => S[b] - S[a]);
      const fresh = ranked.filter((id) => !before.has(id));
      forced.set(fresh.length ? fresh[0] : ranked[0], k === opts.last ? 3 : 2); // 最後に押したボタンがいちばん先
    }

    // 役割ごとに選ぶ。必ず入れるもの → 残りは上位の候補から「別のレシピ」の回数ずらして選ぶ
    function pickRole(role) {
      const n = PICK[role];
      const list = scored.filter((x) => x.t.role === role).sort((a, b) => b.s - a.s);
      const must = list.filter((x) => forced.has(x.t.id)).sort((a, b) => forced.get(b.t.id) - forced.get(a.t.id) || b.s - a.s).slice(0, n).map((x) => x.t);
      const rest = list.filter((x) => !must.includes(x.t)).slice(0, POOL[role]).map((x) => x.t);
      const need = n - must.length, out = must.slice();
      if (need > 0 && rest.length) {
        const start = (variant * need) % rest.length;
        for (let i = 0; i < need && i < rest.length; i++) out.push(rest[(start + i) % rest.length]);
      }
      return out;
    }
    const heroes = pickRole("hero");
    const trans = pickRole("trans");
    const feel = pickRole("feel");
    const atmos = pickRole("atmos").filter((t) => forced.has(t.id) || S[t.id] > 4);

    // 長さ・画面・音・テンポ
    const P = PURPOSES[purpose];
    const seconds = opts.seconds !== "auto" && opts.seconds ? Number(opts.seconds) : heard.seconds || (P.loop ? 10 : 15);
    const aspect = opts.aspect !== "auto" && opts.aspect ? opts.aspect : heard.aspect || (purpose === "sns" ? "9:16" : "16:9");
    const sound = opts.sound !== "auto" ? opts.sound === "on" || opts.sound === true : heard.sound !== null ? heard.sound : true;
    const quiet = QUIET.includes(topMood) || scene === "night" || adj.calm > 0;
    const second = moodOrder[1] || topMood;
    let bpm = MOODS[topMood].bpm * 0.65 + MOODS[second].bpm * 0.35;
    bpm *= (1 - 0.12 * adj.calm) * (1 + 0.1 * adj.bold) * (1 + 0.06 * adj.wild) * (scene === "night" ? 0.92 : 1);
    bpm = Math.max(60, Math.min(150, Math.round(bpm)));
    const chosen = [...heroes, ...trans, ...feel, ...atmos];
    const soundTech = sound ? (forced.has("beatsync") ? TECH.beatsync : forced.has("softsound") || quiet ? TECH.softsound : TECH.beatsync) : null;
    if (soundTech) chosen.push(soundTech);

    // 色：場面があれば場面の色、なければいちばん強い雰囲気の色。「別のレシピ」で2案目へ
    const src = scene ? SCENES[scene] : MOODS[topMood];
    const pal = src.palettes[variant % src.palettes.length];
    const accent = scene ? topMood : moodOrder[1];
    const paletteWords = pal.w + (accent ? `（${MOODS[accent].noun}を少し）` : "");

    const moodLabel = moodOrder.slice(0, 2).map((k) => MOODS[k].label).join("×");

    // 人の言葉での「仕上がりのイメージ」
    const A = MOODS[topMood], B = moodOrder[1] ? MOODS[moodOrder[1]] : null;
    const d1 = B ? `${A.adv}、${B.adj}${P.noun}。${seconds}秒。` : `${A.adj}${P.noun}。${seconds}秒。`;
    const lead = scene ? SCENES[scene].phrase : "";
    const d2 = heroes.length > 1 ? `${lead}${heroes[0].short}、${heroes[1].end}。` : heroes.length ? `${lead}${heroes[0].end}。` : "";
    const d3 = feel[0] && trans[0] ? `${feel[0].short}、${trans[0].end}。` : "";
    const d4 = ["calm", "bold", "cute", "wild"].filter((k) => adj[k] > 0).map((k) => ADJUST_LINES[k]).join("");
    const direction = `${d1}${d2}${d3}${d4}${P.end(endWord)}。`;

    const prompt = composePrompt({ text: opts.text, purpose, loop: !!P.loop, seconds, aspect, sound, soft: soundTech === TECH.softsound, bpm, palette: pal.c, paletteWords, onscreen, direction, chosen, wild: adj.wild > 0, quiet });
    return { purpose, purposeLabel: P.label, moods: moodOrder.slice(0, 3), moodLabel, scene, sceneLabel: scene ? SCENES[scene].label : "", seconds, aspect, sound, bpm, palette: pal.c, paletteWords, onscreen, direction, heroes, techniques: chosen, prompt };
  }

  // 調整の「1回前」を何度も組み立てるので、同じ注文は覚えておく
  const cache = new Map();
  function buildCached(o) {
    const key = JSON.stringify(o);
    if (!cache.has(key)) { if (cache.size > 300) cache.clear(); cache.set(key, build(o)); }
    return cache.get(key);
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
    if (r.aspect === "9:16") L.push("- 縦長なので、ブラウザの真ん中に 9:16 の枠を高さいっぱいに置き、枠の外は黒にする（画面収録で切り取りやすいように）");
    L.push("- 形式：HTMLファイル1枚（HTML・CSS・JavaScriptをすべてこの中にまとめる）。今いる作業フォルダに motion.html として保存し（同じ名前があれば motion-2.html のように番号をつける）、できたらブラウザで開く（Mac なら open コマンド）");
    if (r.loop) L.push(r.sound ? "- 再生：最後まで行ったら切れ目なく最初に戻り、ずっとループする" : "- 再生：開いたらすぐ再生し、最後まで行ったら切れ目なく最初に戻って、ずっとループする");
    else L.push(r.sound ? "- 再生：最後まで行ったら「もう一度見る」ボタンを出す" : "- 再生：開いたらすぐ再生し、最後まで行ったら「もう一度見る」ボタンを出す");
    L.push("- 外部のライブラリを使う時は CDN から読み込む（three.js など）。フォントはパソコンに入っている日本語フォントを使う");
    L.push("- 時間の管理：すべての動きを1本のタイムライン（経過時間から各場面の状態を計算する形）で管理し、コマ落ちしても時間どおりに進むようにする");
    if (r.sound) L.push(`- 音：Web Audio API で、BGM（テンポ ${r.bpm}BPM 前後${r.soft ? "の静かな曲" : ""}）と効果音をコードだけで作る。ブラウザの決まりで最初は音が出ないので、最初の画面に大きな「▶ 音つきで再生」ボタンを置き、押したら映像と音を同時に始める。大事な動きと効果音は同じ瞬間に${r.soft ? "（効果音は控えめに）" : ""}`);
    else L.push("- 音：なし（映像だけで気持ちよく見せる）");
    L.push(r.onscreen.length ? `- 画面に出す言葉：${r.onscreen.map((w) => `「${w}」`).join("")}（どれも一字一句そのまま使う）` : "- 画面に出す言葉：上の「作りたいもの」から、短くて強い言葉をあなたが選ぶ（多くても1場面1〜2語）");
    L.push(`- 色：${r.paletteWords}（例：${r.palette.join(" ")}）`);
    L.push("- 文字：日本語は読みやすい太さのフォントで。小さすぎる文字は使わない");
    L.push("");
    L.push("■ いちばん大事なこと");
    L.push("- いちばん大事なのは「作りたいもの（本人の言葉）」。上の『仕上がりのイメージ』『使ってほしい演出』『色』が本人の言葉と食い違うところは、本人の言葉を優先する");
    if (r.quiet) L.push("- 「すごい」は派手さのことではない。静かな作品なら、静けさと美しさで「すごい」と言わせる");
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

  const MOOD_KEYS = ["cute", "cool", "calm", "warm", "genki", "elegant", "future", "emo", "pop", "wa", "exciting", "mystic"];
  const api = { MOODS, MOOD_KEYS, SCENES, PURPOSES, TECHNIQUES, TECH, ADJUST_LABELS, IDEAS, readWords, build };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MotionRecipe = api;
})(typeof window !== "undefined" ? window : globalThis);
