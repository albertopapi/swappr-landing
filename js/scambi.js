const S=Swappr,el=S.el,CL=S.cloud,app=document.getElementById('app');
const names=a=>a.map(c=>c.name).join(', ');
const mk=(t,fn,cls)=>{const x=el('button','btn small'+(cls?' '+cls:''),t);x.type='button';x.onclick=fn;return x;};
const stat=(n,l)=>{const s=el('span','sub');s.appendChild(el('b','',String(n)));s.append(' ');s.appendChild(el('span','',l));return s;};
const msgEl=()=>{const m=el('p','msg');m.setAttribute('role','status');m.setAttribute('aria-live','polite');return m;};

/* =============== SENZA ACCOUNT VERI: anteprima con utenti di esempio, tutto sul dispositivo =============== */
/* carte di esempio: le prime tre in wishlist, le altre nel binder, così compare un match con un utente di esempio */
async function sample(){
  const ids=['base1-4','base1-2','base1-10','base1-16','base1-14','base1-58'];let m={};
  try{m=await S.byIds(ids);}catch(e){return;}
  ids.slice(0,3).forEach(id=>{if(m[id]&&!S.inWish(id))S.toggleWish(m[id]);});
  const b=S.binders()[0]||S.newBinder(S.lang==='en'?'My binder':'Il mio binder');
  ids.slice(3).forEach(id=>{if(m[id])S.addToBinder(b.id,m[id],1,'NM');});
  render();
}
function block(m,map,have){
  const box=el('section','match'),selR=new Set(m.recv),selG=new Set(m.give);
  const h=el('h3'),a=el('a','plain','Match con '+m.u);a.href='profilo.html?u='+encodeURIComponent(m.u);h.appendChild(a);box.appendChild(h);
  const mini=(c,sel)=>{
    const b=el('button','mini');b.type='button';b.setAttribute('aria-pressed','true');b.setAttribute('aria-label',c.name);
    const im=S.safe(c.img);if(im){const i=document.createElement('img');i.src=im;i.alt='';i.width=245;i.height=342;i.decoding='async';b.appendChild(i);}else b.textContent=c.name;
    b.onclick=()=>{const off=sel.has(c.id);off?sel.delete(c.id):sel.add(c.id);b.classList.toggle('off',off);b.setAttribute('aria-pressed',String(!off));};
    return b;
  };
  const row=el('div','mrow'),l=el('div','mside'),r=el('div','mside'),mid=el('span','ic');mid.innerHTML=S.IC.swap;mid.setAttribute('aria-hidden','true');
  m.recv.forEach(id=>{if(map[id])l.appendChild(mini(map[id],selR));});
  m.give.forEach(id=>{if(have[id])r.appendChild(mini(have[id],selG));});
  row.append(l,mid,r);box.appendChild(row);
  const lab=el('div','mlab');lab.append(el('span','','Tu ricevi'),el('span'),el('span','',m.u+' riceve'));box.appendChild(lab);
  const go=mk('Proponi scambio',()=>{if(!selR.size||!selG.size)return;S.propose(m.u,[...selG].map(id=>have[id]),[...selR].map(id=>map[id]));render();});
  go.style.marginTop='14px';box.appendChild(go);return box;
}
function trades(){
  app.appendChild(el('h2','sec','I tuoi scambi'));
  const ts=S.trades();
  if(!ts.length){app.appendChild(el('p','sub','Nessuno scambio.'));return;}
  ts.forEach(t=>{
    const c=el('section','match');c.appendChild(el('h3','','Scambio con '+t.with));
    c.appendChild(el('p','sub','Tu ricevi: '+names(t.recv)));
    c.appendChild(el('p','sub',t.with+' riceve: '+names(t.give)));
    const st=el('div','row');st.style.margin='12px 0 8px';
    if(t.status==='Annullato')st.appendChild(el('span','tag warn','Annullato'));
    else S.FLOW.forEach(f=>st.appendChild(el('span','tag'+(S.FLOW.indexOf(f)<=S.FLOW.indexOf(t.status)?' ok':''),f)));
    c.appendChild(st);
    if(S.HELP[t.status])c.appendChild(el('p','sub',S.HELP[t.status]));
    const row=el('div','row');row.style.marginTop='12px';
    if(t.status!=='Completato'&&t.status!=='Annullato'){
      const nx=S.FLOW[S.FLOW.indexOf(t.status)+1];
      row.append(mk('Segna come: '+nx,()=>{S.setStatus(t.id,nx);render();}),
        mk('Annulla scambio',async()=>{if(await S.confirm('Annullare questo scambio?','Potrai sempre proporne un altro.','Annulla scambio',true,'Indietro')){S.setStatus(t.id,'Annullato');render();}},'danger'));
    }
    const chat=el('a','btn small ghost','Apri chat');chat.href='messaggi.html?c='+encodeURIComponent(t.with);row.appendChild(chat);
    c.appendChild(row);app.appendChild(c);
  });
}
async function render(){
  app.replaceChildren();
  app.appendChild(el('h1','','Scambi'));
  const have=S.haveCards();
  const sm=el('div','row');sm.style.gap='18px';sm.append(stat(S.wish().length,'in wishlist'),stat(Object.keys(have).length,'carte diverse nei binder'));app.appendChild(sm);
  const how=el('details','acc');how.style.marginTop='16px';how.appendChild(el('summary','','Come funziona il match'));
  ['1. Metti in wishlist le carte che desideri e nei binder quelle che vuoi scambiare.','2. Swappr cerca chi ha le tue carte desiderate e chi cerca le tue.',"3. Se ci sono carte da entrambe le parti, ti propone lo scambio: tu confermi e scrivi all'altro collezionista."].forEach(t=>how.appendChild(el('p','',t)));
  app.appendChild(how);
  app.appendChild(el('h2','sec','I tuoi match'));
  const ms=S.matches(),ps=S.partials();
  if(!ms.length&&!ps.length){
    const e=el('div','empty','Nessun match per ora. Aggiungi carte alla wishlist e ai binder: Swappr confronta le tue liste con quelle degli altri collezionisti.');
    const b=mk('Carica carte di esempio',sample,'ghost');b.style.marginTop='14px';e.append(document.createElement('br'),b);app.appendChild(e);
  }else{
    let map={};try{map=await S.byIds([...new Set(ms.concat(ps).flatMap(m=>m.recv))]);}catch(e){}
    if(!ms.length)app.appendChild(el('p','sub','Nessun match completo per ora.'));
    ms.forEach(m=>app.appendChild(block(m,map,have)));
    if(ps.length){
      app.appendChild(el('h2','sec','Altre occasioni'));
      app.appendChild(el('p','sub','Utenti che hanno carte della tua wishlist o cercano carte dei tuoi binder: scrivi per concordare uno scambio.'));
      ps.forEach(m=>{
        const box=el('section','match');box.style.marginTop='14px';
        const h=el('h3'),a=el('a','plain',m.u);a.href='profilo.html?u='+encodeURIComponent(m.u);h.appendChild(a);box.appendChild(h);
        box.appendChild(el('p','sub',m.recv.length?m.u+' ha delle carte della tua wishlist ('+m.recv.length+')':m.u+' cerca delle tue carte ('+m.give.length+')'));
        const g=el('div','cards');g.style.margin='12px 0';
        (m.recv.length?m.recv.map(id=>map[id]):m.give.map(id=>have[id])).filter(Boolean).forEach(c=>g.appendChild(S.tile(c,{heart:false})));
        box.appendChild(g);
        const w=el('a','btn small','Scrivi a '+m.u);w.href='messaggi.html?c='+encodeURIComponent(m.u);box.appendChild(w);app.appendChild(box);
      });
    }
    app.appendChild(el('p','note','Tocca una carta per escluderla dallo scambio. Swappr verifica le carte prima di inoltrarle.'));
    const a=el('a','sub','Come funziona la verifica');a.href='verifica.html';app.appendChild(a);
  }
  trades();
}

/* =============== CON GLI ACCOUNT VERI (Supabase) =============== */
const SHOW=12; /* carte mostrate per elenco nei match */
const ACTIVE=['proposed','accepted','sent','verifying','shipped'];
let matchP=null,matchAt=0,tradesBox=null;

function loginWall(){
  const e=el('div','empty','Accedi per trovare scambi, proporli agli altri collezionisti e seguirne l’andamento.');
  const row=el('div','row');row.style.cssText='justify-content:center;margin-top:14px';
  const a=el('a','btn','Accedi'),b=el('a','btn ghost','Crea account');a.href='profilo.html';b.href='profilo.html?new=1';row.append(a,b);e.append(document.createElement('br'),row);
  app.appendChild(e);
}
function notices(box){
  const u=CL.user;
  if(u.status==='suspended')box.appendChild(el('div','notice','Il tuo account è sospeso: puoi vedere i tuoi scambi, ma non puoi proporne né accettarne altri. Contatta Swappr per chiarire.'));
  if(!u.termsAt){const n=el('div','notice','Per scambiare devi accettare i Termini e Condizioni. '),a=el('a','','Vai al profilo');a.href='profilo.html';n.appendChild(a);box.appendChild(n);}
  if(!CL.address){const n=el('div','notice','Per proporre o accettare uno scambio serve il tuo indirizzo di spedizione: lo vede solo Swappr. '),a=el('a','','Aggiungilo nel profilo');a.href='profilo.html#indirizzo';n.appendChild(a);box.appendChild(n);}
}
const cardOf=(map,it)=>map[it.card_id]||CL.toCard(it.card_id,it.card_name);
function grid(items,map){
  const g=el('div','cards w4');
  items.forEach(it=>g.appendChild(S.tile(cardOf(map,it),{badge:it.qty?it.qty+'x '+it.cond:'',heart:false})));
  return g;
}
const idsOf=items=>(items||[]).map(x=>x.card_id);

/* ---- match ---- */
function loadMatches(force){
  if(!matchP||force||Date.now()-matchAt>90000){matchAt=Date.now();matchP=CL.matches();}
  return matchP;
}
function setOf(items){const o={};(items||[]).forEach(x=>{o[x.card_id]=1;});return o;}
function moreNote(n){return n>SHOW?el('p','sub','…e altre '+(n-SHOW)+(n-SHOW===1?' carta':' carte')):null;}
function cardRow(items,map){
  const g=el('div','cards w4');g.style.margin='8px 0 12px';
  items.slice(0,SHOW).forEach(it=>g.appendChild(S.tile(cardOf(map,it),{heart:false})));
  return g;
}
function matchBlock(m,map,full){
  const box=el('section','match');
  const h=el('h3'),a=el('a','plain',full?'Match con '+m.username:m.username);a.href='profilo.html?u='+encodeURIComponent(m.username);h.appendChild(a);box.appendChild(h);
  if(m.recv.length){
    box.appendChild(el('p','sub',full?'Tu ricevi':m.username+' ha carte della tua wishlist'));
    box.appendChild(cardRow(m.recv,map));const mr=moreNote(m.recv.length);if(mr)box.appendChild(mr);
  }
  if(m.give.length){
    box.appendChild(el('p','sub',full?m.username+' riceve':m.username+' cerca delle tue carte'));
    box.appendChild(cardRow(m.give,map));const mg=moreNote(m.give.length);if(mg)box.appendChild(mg);
  }
  const row=el('div','row');row.style.marginTop='6px';
  row.appendChild(mk(full?'Scegli le carte e proponi':'Proponi uno scambio',()=>CL.composeTrade(m.username,{recv:setOf(m.recv),give:setOf(m.give)})));
  const w=el('a','btn small ghost','Scrivi');w.href='messaggi.html?c='+encodeURIComponent(m.username);row.appendChild(w);
  box.appendChild(row);return box;
}
async function drawMatches(box,force){
  box.replaceChildren(el('p','sub','Cerco i match…'));
  let list;
  try{list=await loadMatches(force);}catch(e){matchP=null;box.replaceChildren(el('p','msg',e.message));return;}
  const full=list.filter(m=>m.recv.length&&m.give.length),part=list.filter(m=>!(m.recv.length&&m.give.length));
  let map={};try{map=await S.byIds([...new Set(list.flatMap(m=>idsOf(m.recv.slice(0,SHOW)).concat(idsOf(m.give.slice(0,SHOW)))))]);}catch(e){}
  box.replaceChildren();
  if(!list.length){
    const e=el('div','empty','Nessun match per ora. Aggiungi carte alla wishlist e ai binder: Swappr confronta le tue liste con quelle degli altri collezionisti.');
    const row=el('div','row');row.style.cssText='justify-content:center;margin-top:14px';
    const a=el('a','btn small ghost','Vai alla wishlist'),b=el('a','btn small ghost','Vai ai binder');a.href='wishlist.html';b.href='binder.html';row.append(a,b);e.append(document.createElement('br'),row);box.appendChild(e);return;
  }
  if(!full.length)box.appendChild(el('p','sub','Nessun match completo per ora.'));
  full.forEach(m=>box.appendChild(matchBlock(m,map,true)));
  if(part.length){
    const h=el('h2','sec','Altre occasioni');h.style.marginTop='24px';box.appendChild(h);
    box.appendChild(el('p','sub','Utenti che hanno carte della tua wishlist o cercano carte dei tuoi binder: scrivi per concordare uno scambio.'));
    part.forEach(m=>{const b=matchBlock(m,map,false);b.style.marginTop='14px';box.appendChild(b);});
  }
}

/* ---- scambi ---- */
function flowTags(t){
  const st=el('div','row');st.style.margin='12px 0 8px';
  if(t.status==='cancelled')st.appendChild(el('span','tag warn','Annullato'));
  else if(t.status==='declined')st.appendChild(el('span','tag warn','Rifiutato'));
  else{const at=S.FLOW.indexOf(CL.statusLabel(t.status));S.FLOW.forEach((f,i)=>st.appendChild(el('span','tag'+(i<=at?' ok':''),f)));}
  return st;
}
function guide(t){
  const o=t.other,p=el('p','sub');
  switch(t.status){
    case 'proposed':
      if(t.role==='proposer')p.append(o,' deve ancora accettare la tua proposta.');
      else p.append(o,' ti propone questo scambio. Se accetti, ognuno spedisce le sue carte a Swappr.');
      break;
    case 'accepted':
      if(t.my_sent&&!t.their_sent)p.append('Hai spedito le tue carte. Aspettiamo che ',o,' spedisca le sue.');
      else if(!t.my_sent&&t.their_sent)p.append(o,' ha già spedito. Ora tocca a te: spedisci le tue carte a Swappr con spedizione tracciata.');
      else p.append('Ora ognuno spedisce le sue carte a Swappr con spedizione tracciata, poi segna «Ho spedito».');
      break;
    case 'sent':p.textContent='Entrambi avete spedito: Swappr controllerà le carte appena arrivano.';break;
    case 'verifying':p.textContent=S.HELP['In verifica'];break;
    case 'shipped':
      if(t.my_recv&&!t.their_recv)p.append('Hai confermato la ricezione. Aspettiamo che ',o,' confermi.');
      else if(!t.my_recv)p.textContent='Verifica superata: le carte sono state inoltrate. Conferma quando le ricevi.';
      break;
    case 'completed':p.textContent=S.HELP['Completato'];break;
    case 'cancelled':p.textContent=S.HELP['Annullato'];break;
    case 'declined':p.textContent='Questo scambio è stato rifiutato.';break;
  }
  return p;
}
function shipBox(t){
  const box=el('div','ship');box.appendChild(el('p','sub','Carico l’indirizzo di Swappr…'));
  CL.shipInfo(t.id).then(r=>{
    box.replaceChildren();
    if(!r.ship_to){box.appendChild(el('p','sub','L’indirizzo di spedizione di Swappr non è ancora disponibile: riprova più tardi o scrivici prima di spedire.'));return;}
    box.append(el('b','','Spedisci a:'),el('p','addr',r.ship_to));
    if(r.ship_note)box.appendChild(el('p','sub',r.ship_note));
  }).catch(e=>{box.replaceChildren(el('p','msg',e.message));});
  return box;
}
async function run(fn,btn,msg,okText){
  msg.textContent='';if(btn)btn.disabled=true;
  try{await fn();if(okText)S.toast(okText);return true;}
  catch(e){
    msg.textContent=e.message;
    if(e.code==='no_address'){const a=el('a','',' Aggiungilo nel profilo');a.href='profilo.html#indirizzo';msg.appendChild(a);}
    if(btn)btn.disabled=false;return false;
  }
}
function tradeCard(t,map){
  const c=el('section','match trade'),msg=msgEl(),act=el('div','row');act.style.marginTop='12px';
  const h=el('h3'),a=el('a','plain','Scambio con '+t.other);a.href='profilo.html?u='+encodeURIComponent(t.other);h.appendChild(a);c.appendChild(h);
  c.appendChild(el('p','sub',S.when(t.updated_at||t.created_at)));
  c.appendChild(el('p','sub','Tu ricevi'));c.appendChild(grid(t.recv,map));
  c.appendChild(el('p','sub',t.other+' riceve'));c.appendChild(grid(t.give,map));
  if(t.note){const n=el('p','',t.note);n.style.cssText='margin-top:10px;font-style:italic';c.appendChild(n);}
  c.appendChild(flowTags(t));c.appendChild(guide(t));
  if(t.staff_note)c.appendChild(el('p','sub','Nota di Swappr: '+t.staff_note));
  const ask=(title,text,ok,fn,okText,danger)=>async()=>{if(await S.confirm(title,text,ok,!!danger,'Indietro'))await run(fn,null,msg,okText);};
  if(t.status==='proposed'&&t.role==='recipient'){
    const yes=mk('Accetta lo scambio',()=>run(()=>CL.respond(t.id,true),yes,msg,'Scambio accettato.'));
    act.append(yes,mk('Rifiuta',ask('Rifiutare lo scambio?',t.other+' riceverà un avviso.','Rifiuta',()=>CL.respond(t.id,false),'Scambio rifiutato.',true),'ghost'));
  }
  if(t.status==='proposed'&&t.role==='proposer')act.appendChild(mk('Annulla la proposta',ask('Annullare la proposta?','Potrai sempre proporne un’altra.','Annulla la proposta',()=>CL.cancel(t.id),'Proposta annullata.',true),'ghost'));
  if(t.status==='accepted'||t.status==='sent')c.appendChild(shipBox(t));
  if(t.status==='accepted'&&!t.my_sent){
    const f=el('form','shipform'),tr=document.createElement('input');tr.maxLength=60;tr.placeholder='Numero di tracking (facoltativo)';tr.setAttribute('aria-label','Numero di tracking');tr.autocomplete='off';
    const go=el('button','btn small','Ho spedito');go.type='submit';f.append(tr,go);
    f.onsubmit=async e=>{e.preventDefault();if(await S.confirm('Hai già spedito le carte?','Segna la spedizione solo dopo aver consegnato il pacco al corriere.','Sì, ho spedito',false,'Indietro'))await run(()=>CL.markSent(t.id,tr.value),go,msg,'Spedizione segnata.');};
    c.appendChild(f);
  }
  if(t.my_sent&&t.my_tracking)c.appendChild(el('p','sub','Il tuo tracking: '+t.my_tracking));
  if(t.status==='accepted'&&!t.my_sent&&!t.their_sent)act.appendChild(mk('Annulla lo scambio',ask('Annullare questo scambio?','Nessuno ha ancora spedito: puoi annullarlo senza conseguenze.','Annulla lo scambio',()=>CL.cancel(t.id),'Scambio annullato.',true),'ghost'));
  if(t.status==='shipped'&&!t.my_recv){const go=mk('Ho ricevuto le carte',()=>run(()=>CL.received(t.id),go,msg,'Grazie per la conferma.'));act.appendChild(go);}
  const chat=el('a','btn small ghost','Apri chat');chat.href='messaggi.html?c='+encodeURIComponent(t.other);act.appendChild(chat);
  if(ACTIVE.indexOf(t.status)>=0&&t.status!=='proposed')act.appendChild(mk('Segnala un problema',()=>CL.reportDialog(t.other,t.id),'ghost'));
  c.append(act,msg);return c;
}
async function drawTrades(){
  if(!tradesBox)return;
  const ts=CL.trades||[],box=tradesBox;
  const act=ts.filter(t=>ACTIVE.indexOf(t.status)>=0),old=ts.filter(t=>ACTIVE.indexOf(t.status)<0);
  let map={};
  try{map=await S.byIds([...new Set(ts.flatMap(t=>idsOf(t.give).concat(idsOf(t.recv))))]);}catch(e){}
  box.replaceChildren();
  if(!ts.length){box.appendChild(el('p','sub','Nessuno scambio.'));return;}
  if(!act.length)box.appendChild(el('p','sub','Nessuno scambio in corso.'));
  act.forEach(t=>box.appendChild(tradeCard(t,map)));
  if(old.length){
    const d=el('details','acc');d.style.marginTop='14px';d.appendChild(el('summary','','Scambi conclusi o annullati ('+old.length+')'));
    const w=el('div');w.style.paddingTop='12px';old.forEach(t=>w.appendChild(tradeCard(t,map)));d.appendChild(w);box.appendChild(d);
  }
}
async function cloudMain(){
  app.replaceChildren(el('h1','','Scambi'));
  if(!CL.user){loginWall();return;}
  const nb=el('div');app.appendChild(nb);notices(nb);
  const have=S.haveCards(),sm=el('div','row');sm.style.gap='18px';sm.append(stat(S.wish().length,'in wishlist'),stat(Object.keys(have).length,'carte diverse nei binder'),stat((CL.trades||[]).filter(t=>ACTIVE.indexOf(t.status)>=0).length,'scambi in corso'));app.appendChild(sm);
  const how=el('details','acc');how.style.marginTop='16px';how.appendChild(el('summary','','Come funziona lo scambio'));
  ['1. Metti in wishlist le carte che desideri e nei binder quelle che vuoi scambiare.','2. Swappr cerca chi ha le tue carte desiderate e chi cerca le tue.','3. Proponi lo scambio: quando l’altro accetta, ognuno spedisce le sue carte a Swappr.','4. Swappr controlla che le carte corrispondano a quanto dichiarato e le inoltra a ciascuna parte.','5. Quando ricevi le carte, confermalo: lo scambio è concluso.'].forEach(t=>how.appendChild(el('p','',t)));
  app.appendChild(how);
  app.appendChild(el('h2','sec','I tuoi scambi'));
  tradesBox=el('div');app.appendChild(tradesBox);drawTrades();
  const h2=el('h2','sec','I tuoi match');h2.style.marginTop='30px';app.appendChild(h2);
  const mb=el('div');app.appendChild(mb);drawMatches(mb,false);
  const rf=mk('Aggiorna i match',()=>drawMatches(mb,true),'ghost');rf.style.marginTop='14px';app.appendChild(rf);
  app.appendChild(el('p','note','Swappr verifica le carte prima di inoltrarle.'));
  const a=el('a','sub','Come funziona la verifica');a.href='verifica.html';app.appendChild(a);
  document.addEventListener('swappr:sync',()=>{
    if(CL.user){nb.replaceChildren();notices(nb);}
    const x=document.activeElement;
    if(document.querySelector('dialog[open]')||(x&&tradesBox.contains(x)&&/^(INPUT|TEXTAREA|SELECT)$/.test(x.tagName)))return;
    drawTrades();
  });
}
S.start(()=>CL.on?cloudMain():render());
