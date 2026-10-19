const S=Swappr,el=S.el,CL=S.cloud,P=new URLSearchParams(location.search),app=document.getElementById('app');
const q=(P.get('q')||'').trim(),set=P.get('set')||'',rar=P.get('rar')||'',sup=P.get('sup')||'',all=P.get('all');
const PAGE=30,natural=(a,b)=>String(a.number).localeCompare(String(b.number),undefined,{numeric:true});
function sec(t,ic){const h=el('h2','sec');h.appendChild(el('span','',t));if(ic){const i=el('span','ic');i.innerHTML=S.IC[ic];h.appendChild(i);}app.appendChild(h);}

/* tutte le carte di un'espansione: la prima richiesta dice quante pagine servono, le altre partono insieme */
async function loadSet(){
  const f={name:q,set,rarity:rar,supertype:sup,size:250};
  const first=await S.cards(Object.assign({page:1},f)),out=first.cards.slice(),n=Math.ceil(first.total/250);
  if(n>1)(await Promise.all(Array.from({length:n-1},(_,i)=>S.cards(Object.assign({page:i+2},f))))).forEach(r=>out.push(...r.cards));
  return out.sort(natural);
}
function results(){
  app.appendChild(el('h1','','Risultati'));
  /* dati dell'espansione scelta: dal catalogo; se è più nuova del catalogo, dalla API */
  const info=set?S.sets().then(a=>a.find(x=>x.id===set)||S.newSets().then(e=>e.find(x=>x.id===set))).catch(()=>null):null;
  if(set){ /* intestazione dell'espansione: logo, serie, data, numero di carte */
    const hd=el('div','sethead');app.appendChild(hd);
    info.then(s=>{
      if(!s){hd.hidden=true;return;}
      const lg=el('div','lg');
      if(S.safe(s.logo)){const im=document.createElement('img');im.alt='';im.decoding='async';im.onerror=()=>lg.remove();im.src=s.logo;lg.appendChild(im);}else lg.hidden=true;
      const tx=el('div','tx');tx.append(el('h2','',s.name),el('p','',[s.series==='Other'?'Altre espansioni':s.series,(s.date||'').slice(0,4),s.total?s.total+(s.total===1?' carta':' carte'):''].filter(Boolean).join(', ')));
      hd.append(lg,tx);
    });
  }
  const row=el('div','row');row.style.marginBottom='14px';
  if(q)row.appendChild(el('span','tag info','“'+q+'”'));
  if(rar)row.appendChild(el('span','tag',S.rarLabel(rar)));
  if(sup)row.appendChild(el('span','tag',sup));
  if(set){const sc=el('span','tag info',set);row.appendChild(sc);info.then(s=>{if(s)sc.textContent=s.name;});}
  const cnt=el('span','sub');row.appendChild(cnt);
  const rs=el('a','btn small ghost','Azzera');rs.href='index.html';row.appendChild(rs);
  app.appendChild(row);
  const grid=el('div','cards'),sent=el('div','sentinel');app.append(grid,sent);
  let list=null;
  const loader=set?async page=>{
    if(!list)list=await loadSet();
    return{cards:list.slice((page-1)*PAGE,page*PAGE),total:list.length};
  }:page=>S.cards({name:q,rarity:rar,supertype:sup,page,size:PAGE});
  S.feed(grid,sent,loader,null,t=>{cnt.textContent=t+(t===1?' carta trovata':' carte trovate');});
}
async function home(){
  app.appendChild(el('h1','sr','Cerca carte Pokémon'));
  const sess=S.get('session',null);
  if(!(CL.on&&sess&&sess.access_token)){
    const bn=el('p','beta');
    if(CL.on){bn.append('Swappr è in Beta. ');const a=el('a','','Crea un account per iniziare');a.href='profilo.html?new=1';bn.appendChild(a);}
    else{bn.append('Swappr è in Beta. ');const a=el('a','',"Iscriviti per l'accesso");a.href='beta.html';bn.appendChild(a);}
    app.appendChild(bn);
  }
  sec('Ultime uscite');
  const g1=el('div','cards dense');app.appendChild(g1);const rm1=S.skel(g1,14);
  S.latest().then(cs=>{rm1();cs.forEach(c=>g1.appendChild(S.tile(c,{eager:true})));}).catch(()=>{rm1();g1.appendChild(S.failBox());});
  const more=el('a','btn ghost wide','Sfoglia tutte le carte');more.href='index.html?all=1';app.appendChild(more);
  sec('Espansioni');
  const ch=el('div','chips');ch.setAttribute('role','list');app.appendChild(ch);
  S.sets().then(a=>{
    a.slice(0,14).forEach(s=>{
      const c=el('a','chip');c.href='index.html?set='+encodeURIComponent(s.id);c.setAttribute('role','listitem');
      const sy=el('span','sym');if(S.safe(s.symbol)){const im=document.createElement('img');im.alt='';im.width=19;im.height=19;im.loading='lazy';im.decoding='async';im.onerror=()=>im.remove();im.src=s.symbol;sy.appendChild(im);}
      c.append(sy,el('span','',s.name));ch.appendChild(c);
    });
    const all=el('button','chip');all.type='button';all.setAttribute('role','listitem');
    const sy=el('span','sym');sy.innerHTML=S.IC.filter;all.append(sy,el('span','','Tutte le '+a.length+' espansioni'));all.onclick=S.openFilters;ch.appendChild(all);
  }).catch(()=>{ch.remove();});
  sec('Le più ricercate','trend');
  app.appendChild(el('p','sub',CL.on?'In base alle wishlist dei collezionisti di Swappr.':'In base alle wishlist. Utenti di esempio finché gli account non sono attivi.'));
  const g2=el('div','cards big');g2.style.marginTop='12px';app.appendChild(g2);
  const rm2=S.skel(g2,6);
  try{
    /* con gli account veri la classifica viene dal database; senza, dagli utenti di esempio */
    let list;
    if(CL.on){
      await S.ready; /* il collegamento si carica in parallelo: il resto della pagina non aspetta */
      try{list=await CL.mostWanted(6);}
      catch(e){list=null;}
      if(list===null){rm2();g2.appendChild(S.failBox());return;}
    }else list=S.mostWanted(6).map(id=>({card_id:id,owner:S.owners(id)[0]||null}));
    const m=await S.byIds(list.map(x=>x.card_id));rm2();
    if(!list.length){g2.appendChild(el('div','empty','Ancora nessuna carta in wishlist. Cerca una carta e tocca il cuore per aggiungere la prima.'));return;}
    list.forEach(x=>{
      const c=m[x.card_id]||(CL.on?CL.toCard(x.card_id,x.card_name):null);if(!c)return;
      const w=el('div');w.appendChild(S.tile(c,{eager:true,badge:CL.on&&x.wants?x.wants+(x.wants===1?' lo cerca':' lo cercano'):''}));
      const u=x.owner;
      if(u){const l=el('a','who');l.href='profilo.html?u='+encodeURIComponent(u);l.append(S.avatar(u,{sm:true}),el('span','',u));w.appendChild(l);}
      g2.appendChild(w);
    });
  }catch(e){rm2();g2.appendChild(S.failBox());}
}
(q||set||rar||sup||all)?results():home();
