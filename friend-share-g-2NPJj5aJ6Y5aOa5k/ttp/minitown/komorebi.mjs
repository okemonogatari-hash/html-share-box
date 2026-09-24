import {newTown,placeBlock} from './simulation.mjs';
// A composed, editable town. These are ordinary plots, roads and residents.
export function komorebiTown(){
 const t=newTown();t.time=6*1440+20*60+15;
 const plan=[
  ['home',[[2,2],[3,2],[4,2]],1971],
  ['home',[[5,2],[6,2]],991],
  ['home',[[2,3],[2,4]],711],
  ['home',[[3,3],[4,3]],8102],
  ['work',[[5,3],[6,3]],6400],
  ['home',[[7,3],[7,4]],1997],
  ['shop',[[3,4],[4,4]],666],
  ['park',[[5,4],[5,5],[6,5]],120],
  ['shop',[[6,4]],820],
  ['shop',[[3,5],[4,5]],6668],
  ['home',[[2,5],[2,6]],899],
  ['park',[[3,6]],124],
  ['home',[[4,6],[5,6],[6,6]],2321],
  ['home',[[7,5],[7,6]],1252],
  ['shop',[[4,7],[5,7]],435],
  ['park',[[6,7]],131],
 ];
 for(let i=0;i<plan.length;i++){const [type,plots,seed]=plan[i];const b=placeBlock(t,type,plots);if(!b)throw Error('Invalid composed town');b.seed=seed;b.born=t.time-(type==='home'&&i%3===0?900:1800+i*90);}
 return t;
}
