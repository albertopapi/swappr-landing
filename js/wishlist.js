const S=Swappr,el=S.el,CL=S.cloud,app=document.getElementById('app');
const link=(href,text,cls)=>{const a=el('a',cls||'',text);a.href=href;return a;};
function main(){
  app.appendChild(el('h1','','La mia wishlist'));
  app.appendChild(el('p','sub','Le carte che desideri: Swappr le cerca nei binder degli altri collezionisti.'));
  if(CL.on&&!CL.user)app.appendChild(el('div','notice','Senza account la tua wishlist resta solo su questo dispositivo. Accedi o crea un account per salvarla online e trovare chi ha le tue carte.'));
  const mine=el('div','cards w4');mine.style.marginTop='14px';app.appendChild(mine);
  const add=el('button','btn ghost wide','Aggiungi carte');add.type='button';
  add.onclick=()=>S.picker('Aggiungi alla wishlist',c=>{if(!S.inWish(c.id))S.toggleWish(c);draw();});
  app.appendChild(add);
  function draw(){
    mine.replaceChildren();const w=S.wish();
    if(!w.length){mine.appendChild(el('div','empty','La tua wishlist è vuota. Cerca una carta e tocca il cuore.'));return;}
    w.forEach((c,k)=>mine.appendChild(S.tile(c,{onWish:()=>draw(),eager:k<8})));
  }
  draw();
  const others=el('div');app.appendChild(others);
  CL.on?cloudOthers(others):demoOthers(others);
}

/* le wishlist degli altri: righe scorrevoli, come negli schizzi */
function demoOthers(others){
  function skeletons(){
    others.replaceChildren();
    S.DEMO.forEach(u=>{
      others.appendChild(el('h2','sec','Wishlist di '+u.u));
      const r=el('div','rail');S.skel(r,Math.min(u.w.length,6));others.appendChild(r);
    });
  }
  async function load(){
    skeletons();
    let m;try{m=await S.byIds([...new Set(S.DEMO.flatMap(u=>u.w))]);}catch(e){others.replaceChildren(S.failBox(load));return;}
    others.replaceChildren();
    S.DEMO.forEach(u=>{
      const h=el('h2','sec'),a=el('a','plain','Wishlist di '+u.u);a.href='profilo.html?u='+encodeURIComponent(u.u);h.appendChild(a);others.appendChild(h);
      others.appendChild(S.rail(u.w.map(id=>m[id]).filter(Boolean).map(c=>S.tile(c))));
    });
    others.appendChild(el('p','note','Le wishlist degli altri utenti sono di esempio finché gli account non sono attivi.'));
  }
  load();
}
async function cloudOthers(others){
  others.appendChild(el('h2','sec','Wishlist degli altri collezionisti'));
  if(!CL.user){
    const e=el('div','empty','Accedi per vedere cosa cercano gli altri collezionisti e scoprire chi ha bisogno delle tue carte.');
    const row=el('div','row');row.style.cssText='justify-content:center;margin-top:14px';
    row.append(link('profilo.html','Accedi','btn small'),link('profilo.html?new=1','Crea account','btn small ghost'));e.append(document.createElement('br'),row);others.appendChild(e);return;
  }
  const box=el('div');others.appendChild(box);box.appendChild(el('p','sub','Carico le wishlist…'));
  let d;try{d=await CL.discover(30);}catch(e){box.replaceChildren(el('p','msg',e.message));return;}
  if(!d.wishlists.length){box.replaceChildren(el('div','empty','Nessun altro collezionista ha ancora una wishlist. Appena qualcuno ne crea una, la trovi qui.'));return;}
  let m={};try{m=await S.byIds([...new Set(d.wishlists.flatMap(w=>(w.cards||[]).map(c=>c.card_id)))]);}catch(e){}
  box.replaceChildren();
  d.wishlists.forEach(w=>{
    const h=el('h2','sec'),a=el('a','plain','Wishlist di '+w.username);a.href='profilo.html?u='+encodeURIComponent(w.username);h.appendChild(a);box.appendChild(h);
    box.appendChild(S.rail((w.cards||[]).map(x=>S.tile(m[x.card_id]||CL.toCard(x.card_id,x.card_name)))));
  });
}
S.start(main);
