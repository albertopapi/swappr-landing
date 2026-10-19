const S=Swappr,el=S.el,CL=S.cloud,P=new URLSearchParams(location.search),app=document.getElementById('app');
const who=P.get('c'),tab=(P.get('t')==='msg'||who)?'msg':'notif';
const msgEl=()=>{const m=el('p','msg');m.setAttribute('role','status');m.setAttribute('aria-live','polite');return m;};
const counts=()=>[CL.on?S.notifs().filter(n=>!n.read).length:0,CL.on?(CL.unread||0):0];
function tabs(){
  app.appendChild(el('h1','sr','Notifiche e messaggi'));
  const t=el('div','tabs'),links=[];
  [['notif','Notifiche','messaggi.html'],['msg','Messaggi','messaggi.html?t=msg']].forEach(x=>{
    const a=el('a','tab',x[1]);a.href=x[2];a.setAttribute('aria-selected',String(x[0]===tab));links.push(a);
    t.appendChild(a);
  });
  const paint=()=>{ /* i numeri accanto alle schede restano aggiornati anche quando arrivano notifiche nuove */
    const n=counts();
    links.forEach((a,i)=>{const old=a.querySelector('.cnt');if(old)old.remove();if(n[i])a.appendChild(el('span','cnt',n[i]>9?'9+':String(n[i])));});
  };
  paint();app.appendChild(t);
  if(CL.on)document.addEventListener('swappr:sync',paint);
}
function notifs(box){
  box=box||app;
  const ns=S.notifs();
  if(!ns.length){box.appendChild(el('div','empty','Nessuna notifica.'));return;}
  if(ns.some(n=>!n.read)){
    const all=el('button','btn small ghost','Segna tutto come letto');all.type='button';all.style.marginBottom='8px';
    all.onclick=()=>{ns.forEach(n=>{n.read=true;});S.saveNotifs(ns);location.reload();};box.appendChild(all);
  }
  ns.forEach(n=>{
    const a=el('a','item'+(n.read?'':' unread'));a.href=n.href||'messaggi.html';
    const ic=el('span','av ico');ic.innerHTML=S.IC.bell;
    const tx=el('span','tx');tx.append(el('span','',n.text),el('small','',S.when(n.t)));
    a.append(ic,tx);if(!n.read)a.appendChild(el('span','dot'));
    a.onclick=()=>{n.read=true;S.saveNotifs(ns);};box.appendChild(a);
  });
}
function liveNotifs(){ /* con gli account veri l'elenco si aggiorna da solo quando arrivano notifiche nuove */
  const box=el('div');app.appendChild(box);notifs(box);
  document.addEventListener('swappr:sync',()=>{box.replaceChildren();notifs(box);});
}
/* messaggio di partenza quando si arriva da una carta ("Scrivi" nella scheda carta) */
function starter(){
  const re=(P.get('re')||'').slice(0,60),en=S.lang==='en';
  if(!re)return'';
  return P.get('m')==='w'?(en?'Hi! I have the '+re+' card you are looking for. Want to swap?':'Ciao! Ho la carta '+re+' che cerchi. Ti va di scambiare?'):(en?'Hi! I am interested in your '+re+' card. Want to swap it?':'Ciao! Mi interessa la tua carta '+re+'. Ti va di scambiarla?');
}

/* =============== SENZA ACCOUNT VERI: messaggi di prova salvati sul dispositivo =============== */
function convs(){
  const cs=S.convs();
  if(!cs.length){app.appendChild(el('div','empty','Nessun messaggio. Le conversazioni iniziano quando proponi uno scambio.'));return;}
  cs.forEach(c=>{
    const last=c.msgs[c.msgs.length-1],a=el('a','item'+(c.unread?' unread':''));a.href='messaggi.html?c='+encodeURIComponent(c.with);
    const tx=el('span','tx');tx.append(el('span','',c.with),el('small','',last?last.text:''));
    a.append(S.avatar(c.with),tx);if(c.unread)a.appendChild(el('span','dot'));app.appendChild(a);
  });
}
function thread(){
  const cs=S.convs();let c=cs.find(x=>x.with===who);
  if(!c){c={with:who,msgs:[],unread:0};cs.unshift(c);}
  c.unread=0;S.saveConvs(cs);
  app.appendChild(S.back('messaggi.html?t=msg','Messaggi'));
  const ph=el('div','phead');ph.append(S.avatar(who),el('h1','',who));ph.style.marginBottom='12px';app.appendChild(ph);
  const box=el('div','chat');box.setAttribute('role','log');app.appendChild(box);
  c.msgs.forEach(m=>{
    const b=el('div','bubble '+(m.from==='sistema'?'sys':m.from==='me'?'me':''),m.text);
    if(m.from!=='sistema')b.appendChild(el('small','',S.when(m.t)));box.appendChild(b);
  });
  box.scrollTop=box.scrollHeight;
  const f=el('form','chat-form'),i=document.createElement('input');i.maxLength=300;i.placeholder='Scrivi un messaggio';i.setAttribute('aria-label','Messaggio');
  i.value=starter();
  const bt=el('button','btn small','Invia');bt.type='submit';f.append(i,bt);
  f.onsubmit=e=>{e.preventDefault();const v=i.value.trim();if(!v)return;S.say(who,'me',v,false);location.reload();};
  app.append(f,el('p','note','I messaggi restano su questo dispositivo finché gli account non sono attivi.'));
}

/* =============== CON GLI ACCOUNT VERI (Supabase) =============== */
function loginWall(){
  const e=el('div','empty','Accedi per leggere le notifiche e scrivere agli altri collezionisti.');
  const row=el('div','row');row.style.cssText='justify-content:center;margin-top:14px';
  const a=el('a','btn','Accedi'),b=el('a','btn ghost','Crea account');a.href='profilo.html';b.href='profilo.html?new=1';row.append(a,b);e.append(document.createElement('br'),row);
  app.appendChild(e);
}
const colorOf=c=>/^#[0-9a-f]{6}$/i.test(c||'')?c:'';
function userRow(u,sub){
  const a=el('a','item');a.href='messaggi.html?c='+encodeURIComponent(u.username);
  const tx=el('span','tx');tx.appendChild(el('span','',u.username));if(sub)tx.appendChild(el('small','',sub));
  a.append(S.avatar(u.username,{color:colorOf(u.avatar_color)}),tx);return a;
}
async function cConvs(){
  const f=el('form','chat-form'),i=document.createElement('input');i.type='search';i.maxLength=20;i.placeholder='Cerca un collezionista per nome';i.setAttribute('aria-label','Cerca un collezionista per nome');i.autocomplete='off';
  f.appendChild(i);f.onsubmit=e=>e.preventDefault();app.appendChild(f);
  const res=el('div'),list=el('div');app.append(res,list);
  let seq=0,timer=0;
  i.oninput=()=>{
    clearTimeout(timer);const q=i.value.trim(),my=++seq;
    if(q.length<2){res.replaceChildren();list.hidden=false;return;}
    list.hidden=true;
    timer=setTimeout(async()=>{
      try{
        const r=await CL.searchUsers(q);if(my!==seq)return;
        res.replaceChildren();
        if(!r.length)res.appendChild(el('div','empty','Nessun collezionista con questo nome.'));
        r.forEach(u=>res.appendChild(userRow(u,u.city||'')));
      }catch(e){if(my===seq)res.replaceChildren(el('p','msg',e.message));}
    },250);
  };
  list.appendChild(el('p','sub','Carico le conversazioni…'));
  async function draw(first){
    let cs;
    try{cs=await CL.conversations();}catch(e){if(first)list.replaceChildren(el('p','msg',e.message));return;}
    list.replaceChildren();
    if(!cs.length){list.appendChild(el('div','empty','Nessun messaggio. Le conversazioni iniziano quando scrivi a qualcuno o proponi uno scambio.'));return;}
    cs.forEach(c=>{
      const a=el('a','item'+(c.unread?' unread':''));a.href='messaggi.html?c='+encodeURIComponent(c.username);
      const tx=el('span','tx');tx.append(el('span','',c.username),el('small','',(c.last_mine&&c.last_kind==='msg'?'Tu: ':'')+c.last_body));
      a.append(S.avatar(c.username,{color:colorOf(c.avatar_color)}),tx);
      if(c.unread)a.appendChild(el('span','dot'));list.appendChild(a);
    });
  }
  await draw(true);
  const t=setInterval(()=>{if(document.visibilityState==='visible'&&!i.value.trim())draw(false);},10000);window.addEventListener('pagehide',()=>clearInterval(t));
}
async function cThread(){
  app.appendChild(S.back('messaggi.html?t=msg','Messaggi'));
  let r;
  try{r=await CL.thread(who,0);}catch(e){app.appendChild(el('div','empty',e.message));return;}
  const name=r.other.username,last={id:0};
  const ph=el('div','phead'),tt=el('div'),h=el('h1'),ha=el('a','plain',name);ha.href='profilo.html?u='+encodeURIComponent(name);h.appendChild(ha);tt.appendChild(h);
  ph.append(S.avatar(name,{big:true,color:colorOf(r.other.avatar_color)}),tt);ph.style.marginBottom='8px';app.appendChild(ph);
  const row=el('div','row');row.style.marginBottom='12px';
  const pb=el('button','btn small ghost','Proponi scambio');pb.type='button';pb.onclick=()=>CL.composeTrade(name);
  const pr=el('a','btn small ghost','Profilo');pr.href='profilo.html?u='+encodeURIComponent(name);row.append(pb,pr);app.appendChild(row);
  const box=el('div','chat');box.setAttribute('role','log');app.appendChild(box);
  let empty=null;
  function add(list,force){
    const near=box.scrollTop+box.clientHeight>=box.scrollHeight-40;let n=0;
    list.forEach(m=>{
      if(m.id<=last.id)return;last.id=m.id;n++;
      if(empty){empty.remove();empty=null;}
      const sys=m.kind!=='msg',b=el('div','bubble '+(sys?'sys':m.mine?'me':''),m.body);
      if(!sys)b.appendChild(el('small','',S.when(m.created_at)));box.appendChild(b);
    });
    if(n&&(near||force))box.scrollTop=box.scrollHeight;
  }
  add(r.messages,true);
  if(!r.messages.length){empty=el('div','bubble sys','Nessun messaggio: scrivi per primo.');box.appendChild(empty);}
  const blocked=r.blocked||r.other.status!=='active';
  if(blocked){
    app.appendChild(el('div','notice',r.blocked?'Non puoi scrivere a questo utente: uno dei due ha bloccato l’altro.':'Questo account non è attivo: non puoi scrivergli.'));
    return;
  }
  const f=el('form','chat-form'),i=document.createElement('input'),bt=el('button','btn small','Invia'),m=msgEl();
  i.maxLength=500;i.placeholder='Scrivi un messaggio';i.setAttribute('aria-label','Messaggio');i.autocomplete='off';i.value=starter();bt.type='submit';f.append(i,bt);
  let sending=false;
  f.onsubmit=async e=>{
    e.preventDefault();const v=i.value.trim();if(!v||sending)return;
    sending=true;bt.disabled=true;m.textContent='';
    try{
      await CL.send(name,v);i.value='';
      const x=await CL.thread(name,last.id);
      add(x.messages,true);
    }catch(err){m.textContent=err.message;}
    sending=false;bt.disabled=false;i.focus();
  };
  app.append(f,m);
  async function poll(){
    if(document.visibilityState!=='visible'||sending)return;
    try{const x=await CL.thread(name,last.id);if(x.messages.length)add(x.messages,false);}catch(e){}
  }
  const timer=setInterval(poll,7000);window.addEventListener('pagehide',()=>clearInterval(timer));
  if(i.value)i.focus();
}
function cloudMain(){
  if(!CL.user){app.appendChild(el('h1','','Messaggi'));loginWall();return;}
  if(who){cThread();return;}
  tabs();
  if(tab==='msg')cConvs();else liveNotifs();
}
S.start(()=>{
  if(CL.on)return cloudMain();
  if(who)thread();else{tabs();tab==='msg'?convs():notifs();}
});
