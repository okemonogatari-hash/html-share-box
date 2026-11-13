// 台本。ここを題材に合わせて書き替える（字・秒・色・効果音）。画面の事実は頼んだ人の言葉だけ。
// 見本の題材は架空の「ひだまりパン工房」。
export const STORY = {
  duration: 15,          // 秒。試しは15、通しは60まで
  fps: 30,
  w: 1920, h: 1080,
  color: { bg: '#0f2340', grid: '#2c4a78', line: '#ffd166', accent: '#7fd1ff', text: '#ffffff' },
  beats: [
    // kind: ask=問いかけ / draw=線が引かれて点が灯る / count=数が増える / cards=3枚の札 / end=締め
    { kind: 'ask',   from: 0,    to: 4,    text: ['朝ごはん、', 'いつも同じになっていませんか？'] },
    { kind: 'draw',  from: 4,    to: 7.5,  text: ['焼きたてが、毎朝7時に。'] },
    { kind: 'count', from: 7.5,  to: 10,   n: 24, unit: '種類のパン', text: ['毎日並ぶのは'] },
    { kind: 'cards', from: 10,   to: 13,   items: ['食パン', 'あんぱん', 'クロワッサン'] },
    { kind: 'end',   from: 13,   to: 15,   text: ['ひだまりパン工房', 'みどり町3丁目'] }
  ],
  // 曲：コードで作る。bpm と調、盛り上がる秒（drop）
  music: { bpm: 104, root: 50, drop: 4 },
  // 効果音：t=秒, s=種類（pop / whoosh / ding / tick / chime）
  sfx: [
    { t: 0.3, s: 'whoosh' }, { t: 4.0, s: 'chime' }, { t: 5.0, s: 'pop' }, { t: 5.6, s: 'pop' }, { t: 6.2, s: 'pop' },
    { t: 7.6, s: 'tick' }, { t: 10.0, s: 'pop' }, { t: 10.6, s: 'pop' }, { t: 11.2, s: 'pop' }, { t: 13.0, s: 'ding' }
  ]
};
