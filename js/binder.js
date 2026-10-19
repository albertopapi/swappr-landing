const S=Swappr,el=S.el,CL=S.cloud,P=new URLSearchParams(location.search),app=document.getElementById('app');
const bid=P.get('b'),who=P.get('u');
const link=(href,text,cls)=>{const a=el('a',cls||'',text);a.href=href;return a;};
const head=(t,href)=>{const h=el('h2','sec');h.appendChild(href?link(href,t,'plain'):el('span','',t));app.appendChild(h);};
const mk=(t,fn,cls)=>{const x=el('button','btn small'+(cls?' '+cls:''),t);x.type='button';x.onclick=fn;return x;};
const colorOf=c=>/^#[0-9a-f]{6}$/i.test(c||'')?c:'';
const wall=text=>{
  const e=el('div','empty',text);const row=el('div','row');row.style.cssText='justify-content:center;margin-top:14px';
  row.append(link('profilo.html','Accedi','btn small'),link('profilo.html?new=1','Crea account','btn small ghost'));e.append(document.createElement('br'),row);return e;
};
function mineList(){
  const mine=S.binders().map(b=>S.cover(b.name,b.cards.reduce((s,e)=>s+e.qty,0),b.cards.length,'binder.html?b='+b.id));
  const nb=el('button','bind new'),nc=el('span','cover');nb.type='button';nc.innerHTML=S.IC.plus;nb.append(nc,el('span','bn','Nuovo binder'));
  nb.onclick=async()=>{const n=await S.ask('Nuovo binder','Nome del binder','','Crea');if(n)location.href='binder.html?b='+S.newBinder(n).id;};
  mine.push(nb);
  const r=el('div');r.style.marginTop='14px';r.appendChild(S.rail(mine));app.appendChild(r);
}
/* i binder degli altri: senza account veri sono utenti di esempio, con gli account veri vengono dal database */
async function othersCloud(){
  app.appendChild(el('h2','sec','Binder degli altri collezionisti'));
  if(!CL.user){app.appendChild(wall('Accedi per vedere i binder degli altri collezionisti e trovare chi ha le carte che cerchi.'));return;}
  const f=el('form','chat-form'),i=document.createElement('input');i.type='search';i.maxLength=20;i.placeholder='Cerca un collezionista per nome';i.setAttribute('aria-label','Cerca un collezionista per nome');i.autocomplete='off';
  f.appendChild(i);f.onsubmit=e=>e.preventDefault();app.appendChild(f);
  const res=el('div'),box=el('div');app.append(res,box);
  let seq=0,timer=0;
  i.oninput=()=>{
    clearTimeout(timer);const q=i.value.trim(),my=++seq;
    if(q.length<2){res.replaceChildren();box.hidden=false;return;}
    box.hidden=true;
    timer=setTimeout(async()=>{
      try{
        const r=await CL.searchUsers(q);if(my!==seq)return;
        res.replaceChildren();
        if(!r.length)res.appendChild(el('div','empty','Nessun collezionista con questo nome.'));
        r.forEach(u=>{const a=el('a','item');a.href='profilo.html?u='+encodeURIComponent(u.username);const tx=el('span','tx');tx.appendChild(el('span','',u.username));if(u.city)tx.appendChild(el('small','',u.city));a.append(S.avatar(u.username,{color:colorOf(u.avatar_color)}),tx);res.appendChild(a);});
      }catch(e){if(my===seq)res.replaceChildren(el('p','msg',e.message));}
    },250);
  };
  box.appendChild(el('p','sub','Carico i binder…'));
  let d;try{d=await CL.discover(40);}catch(e){box.replaceChildren(el('p','msg',e.message));return;}
  box.replaceChildren();
  if(!d.binders.length){box.appendChild(el('div','empty','Nessun altro collezionista ha ancora dei binder. Appena qualcuno ne crea uno, lo trovi qui.'));return;}
  const by={},order=[];
  d.binders.forEach(b=>{if(!by[b.username]){by[b.username]=[];order.push(b.username);}by[b.username].push(b);});
  order.forEach(u=>{
    const h=el('h2','sec'),a=el('a','plain','Binder di '+u);a.href='profilo.html?u='+encodeURIComponent(u);h.appendChild(a);box.appendChild(h);
    box.appendChild(S.rail(by[u].map(b=>S.cover(b.name,b.total,b.distinct,'binder.html?u='+encodeURIComponent(u)+'&b='+encodeURIComponent(b.binder_id)))));
  });
}
function list(){
  app.appendChild(el('h1','','I tuoi binder'));
  app.appendChild(el('p','sub','Metti nel binder le carte che vuoi scambiare: Swappr le propone a chi le cerca nella sua wishlist.'));
  if(CL.on&&!CL.user)app.appendChild(el('div','notice','Senza account i tuoi binder restano solo su questo dispositivo. Accedi o crea un account per salvarli online e trovare scambi.'));
  mineList();
  if(CL.on){othersCloud();return;}
  S.DEMO.forEach(u=>{
    head('Binder di '+u.u,'profilo.html?u='+encodeURIComponent(u.u));
    app.appendChild(S.rail(u.b.map((b,i)=>S.cover(S.demoName(b[0]),b[1].length,b[1].length,'binder.html?u='+encodeURIComponent(u.u)+'&b='+i))));
  });
  app.appendChild(el('p','note','I binder degli altri utenti sono di esempio finché gli account non sono attivi.'));
}
function mine(){
  const b0=S.binders().find(x=>x.id===bid);
  if(!b0){location.replace('binder.html');return;}
  app.appendChild(S.back('binder.html','Binder'));
  app.appendChild(el('h1','',b0.name));
  const act=el('div','row');act.style.margin='0 0 16px';
  act.append(
    mk('Aggiungi carte',()=>S.picker('Aggiungi carte',c=>{S.addToBinder(bid,c,1,'NM');draw();})),
    mk('Rinomina',async()=>{const all=S.binders(),x=all.find(y=>y.id===bid),n=await S.ask('Rinomina il binder','Nome del binder',x.name,'Salva');if(n){x.name=n.slice(0,30);S.saveBinders(all);location.reload();}},'ghost'),
    mk('Elimina',async()=>{if(await S.confirm('Eliminare questo binder?','Il binder e le carte che contiene vengono rimossi.','Elimina',true)){S.saveBinders(S.binders().filter(y=>y.id!==bid));location.href='binder.html';}},'danger'));
  app.appendChild(act);
  const grid=el('div','cards');app.appendChild(grid);
  const ib=(svg,label,fn)=>{const x=el('button');x.type='button';x.innerHTML=svg;x.setAttribute('aria-label',label);x.onclick=fn;return x;};
  const MINUS='<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',CROSS='<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function draw(){
    const all=S.binders(),b=all.find(x=>x.id===bid);grid.replaceChildren();
    if(!b.cards.length){grid.appendChild(el('div','empty','Questo binder è vuoto. Usa «Aggiungi carte» per iniziare.'));return;}
    b.cards.forEach((e,k)=>{
      const cell=el('div','cell');cell.appendChild(S.tile(e.c,{badge:e.qty+'x '+e.cond,eager:k<12,heart:false}));
      const ctl=el('div','ctl');
      ctl.append(
        ib(MINUS,'Diminuisci',()=>{e.qty=Math.max(1,e.qty-1);S.saveBinders(all);draw();}),
        ib(S.IC.plus,'Aumenta',()=>{e.qty=Math.min(99,e.qty+1);S.saveBinders(all);draw();}),
        ib(CROSS,'Rimuovi',()=>{b.cards.splice(b.cards.indexOf(e),1);S.saveBinders(all);draw();}));
      cell.appendChild(ctl);grid.appendChild(cell);
    });
  }
  draw();
}
async function demo(){
  const u=S.DEMO.find(x=>x.u===who),b=u&&u.b[+bid];
  if(!b){location.replace('binder.html');return;}
  app.appendChild(S.back('binder.html','Binder'));
  app.appendChild(el('h1','',S.demoName(b[0])));
  const row=el('div','row'),w=el('a','who');w.href='profilo.html?u='+encodeURIComponent(u.u);w.append(S.avatar(u.u,{sm:true}),el('span','',u.u));
  row.append(w,el('span','tag info','Utente di esempio'));app.appendChild(row);
  const grid=el('div','cards');grid.style.marginTop='16px';app.appendChild(grid);
  const rm=S.skel(grid,Math.min(b[1].length,12));
  try{const m=await S.byIds(b[1]);rm();b[1].forEach(id=>{if(m[id])grid.appendChild(S.tile(m[id],{eager:true}));});}
  catch(e){rm();grid.appendChild(S.failBox());}
}
/* binder di un altro collezionista (account veri) */
async function theirs(){
  app.appendChild(S.back('binder.html','Binder'));
  if(!CL.user){app.appendChild(wall('Accedi per vedere i binder degli altri collezionisti.'));return;}
  let p;
  try{p=await CL.profile(who);}catch(e){app.appendChild(el('div','empty',e.message));return;}
  if(p.is_me){location.replace(bid?'binder.html?b='+encodeURIComponent(bid):'binder.html');return;}
  if(p.hidden){app.appendChild(el('div','empty',p.blocked?'Hai bloccato questo utente.':'Questo binder non è disponibile.'));return;}
  const b=p.binders.find(x=>x.id===bid);
  if(!b){location.replace('binder.html');return;}
  app.appendChild(el('h1','',b.name));
  const row=el('div','row'),w=el('a','who');w.href='profilo.html?u='+encodeURIComponent(p.username);w.append(S.avatar(p.username,{sm:true,color:colorOf(p.avatar_color)}),el('span','',p.username));
  row.append(w);app.appendChild(row);
  const act=el('div','row');act.style.margin='12px 0 0';
  const wr=el('a','btn small ghost','Scrivi');wr.href='messaggi.html?c='+encodeURIComponent(p.username);
  act.append(mk('Proponi scambio',()=>CL.composeTrade(p.username)),wr);app.appendChild(act);
  const grid=el('div','cards');grid.style.marginTop='16px';app.appendChild(grid);
  if(!b.cards.length){grid.appendChild(el('div','empty','Questo binder è vuoto.'));return;}
  const rm=S.skel(grid,Math.min(b.cards.length,12));
  const cs=await CL.cardsFor(b.cards);rm();
  const mine=new Set(S.wish().map(c=>c.id));
  const rows=b.cards.map((e,k)=>({c:cs[k],e}));
  rows.sort((x,y)=>(mine.has(y.c.id)?1:0)-(mine.has(x.c.id)?1:0));
  rows.forEach((x,k)=>grid.appendChild(S.tile(x.c,{badge:x.e.qty+'x '+x.e.cond,eager:k<12})));
}
S.start(()=>{
  if(CL.on&&who)return theirs();
  who?demo():bid?mine():list();
});
