import {dimensions} from './dimensions.js';
export const products = [
 {id:'wanko',name:'わんこといっしょ',short:'わんこと',number:'01',price:1800,bg:'#e5edde',story:'ぎゅっと抱っこしたあの子も、いつもの笑顔も。そのまま連れていけたら。'},
 {id:'oyako',name:'おやこのピース',short:'おやこ',number:'02',price:1800,bg:'#f5ddd3',story:'ふたりの笑顔と、小さなピース。なんでもない毎日を、ちょっと特別な宝物に。'},
 {id:'hakui',name:'ごきげん白衣',short:'白衣の子',number:'03',price:1800,bg:'#eef0cb',story:'白衣を着た、元気なあの子。今日もいっしょに「よし、やってみよう」。'},
 {id:'anbata',name:'あんバターびより',short:'あんバター',number:'04',price:1800,bg:'#f0e0bf',story:'こんがりパンに、あんことバター。おなかは満たせないけど、気分は甘やかしてくれる。'}
];
const $=s=>document.querySelector(s), money=n=>'¥'+n.toLocaleString('ja-JP');
let line='figurine';
function variantProduct(id,kind=line){const p=products.find(p=>p.id===id);return {...p,line:kind,key:id+'-'+kind,price:kind==='figurine'?2800:1800,typeLabel:kind==='figurine'?'立体キーホルダー':'バッジ',modelUrl:`assets/models/${kind}/${id}.glb`,renderUrl:`assets/renders/${kind}/${id}.png`};}
export let selectedProduct=variantProduct('wanko');
let selected=selectedProduct,quantity=1,cart=[],toastTimer;
$('.mobile-options').innerHTML='<div class="line-options" role="group" aria-label="商品の形を選ぶ モバイル">'+$('.line-options').innerHTML+'</div><div class="mobile-variants" role="group" aria-label="デザインを選ぶ モバイル">'+$('.variants').innerHTML+'</div>';
window.shopState={selected:selected.id,line,quantity,cart};
const sync=()=>Object.assign(window.shopState,{selected:selected.id,line,quantity,cart:cart.map(x=>({...x})),total:cart.reduce((s,x)=>s+x.qty*variantProduct(x.id,x.line).price,0)});
function quantityUpdate(){ $('#quantity').textContent=quantity;$('#minus').disabled=quantity<=1;$('#plus').disabled=quantity>=9;sync(); }
export function selectProduct(id){if(!products.find(p=>p.id===id))return;const p=variantProduct(id);selected=p;selectedProduct=p;$('.showroom').style.setProperty('--stage',p.bg);$('#selection-index').textContent=`${p.number} / 04`;$('#product-no').textContent=`BUDDY No. ${p.number}`;$('#product-name').textContent=p.name;$('#product-story').textContent=p.story;$('#price').textContent=p.price.toLocaleString('ja-JP');$('#original').src=`assets/icons/${p.id}.webp`;$('#original').alt=p.name+'の元のアイコン';$('#fallback').src=p.renderUrl;$('#fallback').alt=p.name+'の'+p.typeLabel+'完成イメージ';document.querySelectorAll('.variant').forEach(b=>{const on=b.dataset.id===p.id;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on);});$('.series-tag').textContent=line==='figurine'?'3D FIGURE KEYRING':'RELIEF BADGE';$('#spec-form').textContent=line==='figurine'?'頭・体・髪・手足にも奥行きのあるフィギュア':'丸い土台に、段差を付けたバッジ';$('#spec-colors').textContent=line==='figurine'?'髪・服・顔など、色分けした立体パーツ':'元の絵をもとにした色面＋表面の絵柄';updateSpecifications(p);document.dispatchEvent(new CustomEvent('productchange',{detail:p}));sync();}
function selectLine(kind){line=kind;document.querySelectorAll('[data-line]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.line===line));}
document.querySelectorAll('[data-line]').forEach(b=>b.addEventListener('click',()=>{selectLine(b.dataset.line);selectProduct(selected.id);}));
document.querySelectorAll('.variant').forEach(b=>b.addEventListener('click',()=>selectProduct(b.dataset.id)));
document.querySelectorAll('[data-select]').forEach(b=>b.addEventListener('click',()=>{selectLine(b.dataset.kind);selectProduct(b.dataset.select);$('#showroom').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}));
$('#minus').onclick=()=>{quantity=Math.max(1,quantity-1);quantityUpdate();};$('#plus').onclick=()=>{quantity=Math.min(9,quantity+1);quantityUpdate();};quantityUpdate();
function toast(msg){clearTimeout(toastTimer);$('#toast').textContent=msg;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2500);}
function renderCart(){const totalQty=cart.reduce((s,x)=>s+x.qty,0);$('#cart-count').textContent=totalQty;$('#cart-items').replaceChildren();if(!cart.length){const p=document.createElement('p');p.className='empty-cart';p.textContent='まだ、なかまがいません。お気に入りの子を選んでみてね。';$('#cart-items').append(p);}cart.forEach(row=>{const p=variantProduct(row.id,row.line),el=document.createElement('div');el.className='cart-item';el.innerHTML=`<img src="${p.renderUrl}" alt="${p.name}"><div><h3>${p.name}<small>${p.typeLabel}</small></h3><div class="cart-item-meta"><span>${money(p.price)} / 個</span><strong>${money(row.qty*p.price)}</strong></div><div class="cart-item-controls"><div class="quantity"><button data-action="minus" aria-label="${p.name}・${p.typeLabel}の数量を減らす" ${row.qty<=1?'disabled':''}>−</button><output>${row.qty}</output><button data-action="plus" aria-label="${p.name}・${p.typeLabel}の数量を増やす" ${row.qty>=9?'disabled':''}>＋</button></div><button data-action="remove" class="remove" aria-label="${p.name}・${p.typeLabel}をカートから削除">削除</button></div></div>`;el.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.dataset.action==='remove')cart=cart.filter(x=>x.key!==p.key);else row.qty=Math.max(1,Math.min(9,row.qty+(b.dataset.action==='plus'?1:-1)));renderCart();});$('#cart-items').append(el);});$('#cart-total').textContent=money(cart.reduce((s,x)=>s+x.qty*variantProduct(x.id,x.line).price,0));$('#cart-bottom').hidden=!cart.length;$('#order-preview').hidden=true;$('#cart-items').hidden=false;sync();}
$('#add-cart').onclick=()=>{let row=cart.find(x=>x.key===selected.key);if(row)row.qty=Math.min(9,row.qty+quantity);else cart.push({id:selected.id,line,key:selected.key,qty:quantity});renderCart();toast(selected.name+'をカートに入れました');};
const dialog=$('#cart-dialog');$('.cart-toggle').onclick=()=>{renderCart();dialog.showModal();};$('#close-cart').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
$('#review-cart').onclick=()=>{$('#cart-bottom').hidden=true;$('#order-preview').hidden=false;$('#order-preview h3').tabIndex=-1;$('#order-preview h3').focus();};$('#return-cart').onclick=()=>{renderCart();$('#review-cart').focus();};
renderCart();selectProduct('wanko');

function updateSpecifications(p){
 const figurine=p.line==='figurine', dims=dimensions[p.id];
 if(figurine&&p.id==='anbata'){$('#spec-form').textContent='丸く膨らんだパンと、厚みのある具材';$('#spec-colors').textContent='焼き色のパン・濃いあんこ・淡黄色のバター';}
 const thickness={wanko:4.95,oyako:4.8,hakui:4.58,anbata:5.02};
 $('#size-short').textContent=figurine?(p.id==='anbata'?'幅 約50 mm':'高さ 約56 mm'):'幅 約48 mm';
 $('#form-short').textContent=figurine?'ころん、と立体':'ぷっくりバッジ';
 $('#form-note').textContent=figurine?'横も後ろも、かわいい':'段差のある絵柄';
 $('#spec-size').textContent=figurine?`本体 幅${dims[0].toFixed(1)} × 奥行${dims[1].toFixed(1)} × 高さ${dims[2].toFixed(1)} mm（金具・吊り穴を除く）`:`幅48.4 × 高さ54.7 × 厚さ${thickness[p.id]} mm（吊り穴を含む）`;
 $('#spec-hardware').textContent=figurine?'本体と一体の吊り穴＋別付けのキーリング':'吊り穴付きのレリーフ。背面のピン金具は未設計です';
}
