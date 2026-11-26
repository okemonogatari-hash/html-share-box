/* 日めくりカウントダウン（デザインチームの「リベフェスまであと○日！」画像）
   1日1行。n＝画像の「あと○日」。日付は n から決まる（2027-07-02 の n 日前）。
   足す時は countdown/add.py を使う（画像の変換とこの表への1行を一度にやる）。
   tag：その日の出来事（自己紹介など）／who：その日の主役（data.js の k。紹介ページへつながる）／by：絵を作った人（data.js の k） */
window.CD = [
  {n:220, d:"2026-11-25", img:"assets/cd/220.webp", by:"mizuno", tag:"交流チャットOPEN"},
  {n:218, img:"assets/cd/218.webp", by:"mizuno"},
  {n:217, img:"assets/cd/217.webp", by:"mizuno"},
  {n:213, img:"assets/cd/213.webp", by:"mizuno", tag:"neco.さんの自己紹介", who:"neco"},
  {n:212, img:"assets/cd/212.webp", by:"mizuno", tag:"助手さんの自己紹介", who:"joshu"},
  {n:211, img:"assets/cd/211.webp", by:"mizuno", tag:"みずのさんの自己紹介", who:"mizuno"},
  {n:210, img:"assets/cd/210.webp", by:"mizuno", tag:"くまさんの自己紹介", who:"kuma"},
  {n:209, img:"assets/cd/209.webp", by:"mizuno", tag:"YUKAさんの自己紹介", who:"yuka"},
];
