// Swappr - nucleo condiviso: dati locali, Pokémon TCG API, barre dell'app, finestre carta/filtri/ricerca.
(function(){
'use strict';
var K={binders:'swappr2-binders',wish:'swappr2-wish',trades:'swappr2-trades',convs:'swappr2-convs',notifs:'swappr2-notifs',follows:'swappr2-follows',user:'swappr-user-v1',session:'swappr-session-v1',lang:'swappr-lang-v1'};
var DATA=['binders','wish','trades','convs','notifs','follows'];
function get(k,d){try{var r=localStorage.getItem(K[k]);var v=r?JSON.parse(r):d;return v==null?d:v;}catch(e){return d;}}
function set(k,v){try{localStorage.setItem(K[k],JSON.stringify(v));return true;}catch(e){return false;}}
function el(t,c,x){var n=document.createElement(t);if(c)n.className=c;if(x!==undefined)n.textContent=x;return n;}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
var lang=get('lang','it')==='en'?'en':'it',loc=lang==='en'?'en-GB':'it-IT';
document.documentElement.lang=lang;
var S={t:function(s){return s;}};
var NODATA='Non riesco a contattare il servizio carte in questo momento. Riprova tra poco.';
var CONDS=['M','NM','EX','GD','LP','PL','PO'];
var FLOW=['Proposta','Accettato','Inviato a Swappr','In verifica','Spedito','Completato'];
var HELP={'Proposta':"In attesa che l'altra parte accetti.",'Accettato':'Ora ognuno prepara le carte e le spedisce a Swappr con spedizione tracciata.','Inviato a Swappr':'Le carte sono in viaggio verso Swappr.','In verifica':'Controlliamo che le carte corrispondano a quanto dichiarato.','Spedito':'Verifica superata: le carte sono state inoltrate alle parti.','Completato':'Scambio concluso. Grazie!','Annullato':'Questo scambio è stato annullato.'};
function when(t){return new Date(t).toLocaleString(loc,{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}
function safe(u){return typeof u==='string'&&/^https:\/\//.test(u)?u:'';}
var IC={
search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
book:'<svg viewBox="0 0 24 24"><path d="M12 6v14M12 6C10 4.5 7 4 3 4v14c4 0 7 .5 9 2 2-1.5 5-2 9-2V4c-4 0-7 .5-9 2z"/></svg>',
heart:'<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.4-9.5-9A5.5 5.5 0 0 1 12 6.5 5.5 5.5 0 0 1 21.5 12C19 16.6 12 21 12 21z"/></svg>',
trade:'<svg viewBox="0 0 24 24"><path d="M7 20V4M7 4L3 8M7 4l4 4M17 4v16M17 20l-4-4M17 20l4-4"/></svg>',
chat:'<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z"/></svg>',
user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
filter:'<svg viewBox="0 0 24 24"><path d="M3 4h18l-7 8v7l-4 2v-9z"/></svg>',
gear:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/></svg>',
bell:'<svg viewBox="0 0 24 24"><path d="M6 17v-6a6 6 0 0 1 12 0v6l2 2H4zM10 21h4"/></svg>',
swap:'<svg viewBox="0 0 24 24"><path d="M4 8h14l-4-4M20 16H6l4 4"/></svg>',
trend:'<svg viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8M15 7h6v6"/></svg>'};

/* ---------- utenti dimostrativi (finché non c'è il database) ---------- */
var DEMO=[
{u:'Athos',b:[['Binder Rare',['base1-4','base1-2','base1-10']],['Binder set base',['base1-15','base1-1','base1-6','base1-8']]],w:['base1-16','base1-14','base1-58','base1-12']},
{u:'Luca',b:[['Binder Fuoco',['base1-4','base1-12','base1-7']],['Binder Acqua',['base1-2','base1-13','base1-6']]],w:['base1-58','base1-9','base1-15']},
{u:'Lucia',b:[['Binder Psico',['base1-1','base1-10','base1-5']],['Binder Elettro',['base1-14','base1-16','base1-58']]],w:['base1-4','base1-2','base1-3']},
{u:'Gio27',b:[['Binder Base',['base1-3','base1-9','base1-11']]],w:['base1-4','base1-10','base1-14']},
{u:'Abby8',b:[['Binder Preferiti',['base1-16','base1-58','base1-5']]],w:['base1-2','base1-15','base1-1']},
{u:'Nico11',b:[['Binder Rare',['base1-13','base1-11','base1-7']]],w:['base1-4','base1-12','base1-6']}];
function owners(id){return DEMO.filter(function(u){return u.b.some(function(b){return b[1].indexOf(id)>=0;});}).map(function(u){return u.u;});}
function wishers(id){return DEMO.filter(function(u){return u.w.indexOf(id)>=0;}).map(function(u){return u.u;});}

/* ---------- Pokémon TCG API ---------- */
var API='https://api.pokemontcg.io/v2/',FIELDS='id,name,number,rarity,supertype,images,set,cardmarket',mem={},snap={};
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
async function api(url){
  if(mem[url])return mem[url];
  for(var i=0;;i++){
    var r;
    try{r=await fetch(url);}catch(e){if(i>=2)throw e;await sleep(800*(i+1));continue;}
    if(r.status===404)return null;
    if((r.status===429||r.status>=500)&&i<2){await sleep(1500*(i+1));continue;}
    if(!r.ok)throw new Error('HTTP '+r.status);
    var j=await r.json();mem[url]=j;return j;
  }
}
function cmSearch(n){return'https://www.cardmarket.com/'+lang+'/Pokemon/Products/Search?searchString='+encodeURIComponent(n);}
function mapCard(c){
  var im=c.images||{},st=c.set||{};
  var m={id:c.id,name:c.name,number:c.number||'',rarity:c.rarity||'',supertype:c.supertype||'',setId:st.id||'',setName:st.name||'',
    img:safe(im.small),imgBig:safe(im.large)||safe(im.small),cm:safe(c.cardmarket&&c.cardmarket.url)||cmSearch(c.name)};
  snap[m.id]=m;return m;
}
function q1(s){return String(s).replace(/["\\]/g,'');}
async function cards(o){
  var p=[];
  if(o.name)p.push('name:"'+q1(o.name)+'*"');
  if(o.set)p.push('set.id:'+String(o.set).replace(/[^\w-]/g,''));
  if(o.rarity)p.push('rarity:"'+q1(o.rarity)+'"');
  if(o.supertype)p.push('supertype:"'+q1(o.supertype)+'"');
  var url=API+'cards?page='+(o.page||1)+'&pageSize='+(o.size||48)+'&select='+FIELDS+(p.length?'&q='+encodeURIComponent(p.join(' ')):'')+'&orderBy='+(o.set?'number':'-set.releaseDate');
  var j=await apiSoft(url);
  return{cards:((j&&j.data)||[]).map(mapCard),total:(j&&j.totalCount)||0};
}
async function byIds(ids){
  var out={},need=[];
  ids.forEach(function(i){if(snap[i])out[i]=snap[i];else need.push(i);});
  for(var i=0;i<need.length;i+=30){
    var ch=need.slice(i,i+30);
    var j=await api(API+'cards?pageSize=30&select='+FIELDS+'&q='+encodeURIComponent(ch.map(function(x){return'id:"'+x+'"';}).join(' OR ')));
    ((j&&j.data)||[]).forEach(function(c){var m=mapCard(c);out[m.id]=m;});
  }
  return out;
}
async function sets(){
  var j=await apiSoft(API+'sets?orderBy=-releaseDate&select=id,name,series,total,releaseDate');
  return((j&&j.data)||[]).map(function(s){return{id:s.id,name:s.name,series:s.series||'',total:s.total};});
}
async function apiSoft(url){try{return await api(url);}catch(e){if(/HTTP 4\d\d/.test(e.message)&&url.indexOf('orderBy=')>0)return api(url.replace(/orderBy=[^&]*&?/,'').replace(/[?&]$/,''));throw e;}}
async function list(path){var j=await api(API+path);return(j&&j.data)||[];}

/* ---------- dati dell'utente (salvati nel browser) ---------- */
function binders(){return get('binders',[]);}
function saveBinders(b){return set('binders',b);}
function newBinder(name){var b=binders(),x={id:uid(),name:String(name).trim().slice(0,30)||'Binder',cards:[]};b.push(x);saveBinders(b);return x;}
function addToBinder(bid,card,qty,cond){
  var b=binders(),x=b.find(function(y){return y.id===bid;});if(!x)return false;
  var e=x.cards.find(function(c){return c.c.id===card.id&&c.cond===cond;});
  if(e)e.qty=Math.min(99,e.qty+qty);else x.cards.unshift({c:card,qty:qty,cond:cond});
  return saveBinders(b);
}
function haveCards(){var m={};binders().forEach(function(b){b.cards.forEach(function(e){m[e.c.id]=e.c;});});return m;}
function wish(){return get('wish',[]);}
function inWish(id){return wish().some(function(c){return c.id===id;});}
function toggleWish(card){var w=wish(),i=w.findIndex(function(c){return c.id===card.id;});if(i>=0)w.splice(i,1);else w.unshift(card);set('wish',w);return i<0;}
function follows(){return get('follows',[]);}
function toggleFollow(u){var f=follows(),i=f.indexOf(u);if(i>=0)f.splice(i,1);else f.push(u);set('follows',f);return i<0;}
function me(){var u=get('user',null);return u&&u.username?u:null;}
function notifs(){return get('notifs',[]);}
function saveNotifs(n){return set('notifs',n);}
function notify(text,href){var n=notifs();n.unshift({id:uid(),text:text,href:href||'',t:Date.now(),read:false});saveNotifs(n.slice(0,100));}
function convs(){return get('convs',[]);}
function saveConvs(c){return set('convs',c);}
function say(who,from,text,unread){
  var c=convs(),x=c.find(function(y){return y.with===who;});
  if(!x){x={with:who,msgs:[],unread:0};c.unshift(x);}
  x.msgs.push({from:from,text:text,t:Date.now()});if(unread)x.unread++;saveConvs(c);
}
function unreadCount(){return notifs().filter(function(n){return!n.read;}).length+convs().reduce(function(s,c){return s+c.unread;},0);}
function trades(){return get('trades',[]);}
function nm(c){return c.name;}
function propose(who,give,recv){
  var t=trades();t.unshift({id:uid(),with:who,give:give,recv:recv,status:'Proposta',created:Date.now()});set('trades',t);
  say(who,'sistema','Scambio proposto: '+recv.map(nm).join(', ')+' contro '+give.map(nm).join(', ')+'.',false);
  notify('Hai proposto uno scambio a '+who+'.','scambi.html');
}
function setStatus(id,st){
  var t=trades(),x=t.find(function(y){return y.id===id;});if(!x)return;
  x.status=st;set('trades',t);
  say(x.with,'sistema',st==='Annullato'?'Scambio annullato.':'Stato aggiornato: '+st+'.',true);
  notify(st==='Annullato'?'Scambio con '+x.with+' annullato.':'Scambio con '+x.with+': stato aggiornato a '+st+'.','scambi.html');
}
function overlaps(){
  var wi=wish().map(function(c){return c.id;}),have=haveCards();
  return DEMO.map(function(u){
    var th={},tw={};u.b.forEach(function(b){b[1].forEach(function(i){th[i]=1;});});u.w.forEach(function(i){tw[i]=1;});
    return{u:u.u,recv:wi.filter(function(i){return th[i];}),give:Object.keys(have).filter(function(i){return tw[i];})};
  });
}
function matches(){return overlaps().filter(function(m){return m.recv.length&&m.give.length;});}
function partials(){return overlaps().filter(function(m){return(m.recv.length>0)!==(m.give.length>0);});}
function mostWanted(n){
  var c={};DEMO.forEach(function(u){u.w.forEach(function(i){c[i]=(c[i]||0)+1;});});
  wish().forEach(function(x){c[x.id]=(c[x.id]||0)+1;});
  return Object.keys(c).sort(function(a,b){return c[b]-c[a];}).slice(0,n);
}
function exportAll(){var o={app:'swappr',version:2};DATA.forEach(function(k){o[k]=get(k,[]);});o.user=get('user',null);return o;}
function importAll(o){
  if(!o||o.app!=='swappr')return false;
  DATA.forEach(function(k){if(Array.isArray(o[k]))set(k,o[k]);});
  if(o.user&&typeof o.user.username==='string')set('user',{username:o.user.username.slice(0,20),city:String(o.user.city||'').slice(0,40)});
  return true;
}
function wipe(){DATA.concat(['user','session']).forEach(function(k){try{localStorage.removeItem(K[k]);}catch(e){}});}
function setLang(l){set('lang',l);location.reload();}
function langButton(box){
  var b=el('button','lang-btn','🌐 '+(lang==='it'?'EN':'IT'));b.type='button';b.setAttribute('aria-label','Cambia lingua');
  b.style.cssText='background:#fff;border:2px solid #17130f;color:#17130f;border-radius:20px;padding:4px 12px;font-size:.85rem;font-weight:700;cursor:pointer;width:auto;box-shadow:2px 2px 0 #17130f';
  b.onclick=function(){setLang(lang==='it'?'en':'it');};box.appendChild(b);
}

/* ---------- interfaccia ---------- */
function dlg(id){var d=document.getElementById(id);if(!d){d=document.createElement('dialog');d.id=id;document.body.appendChild(d);d.addEventListener('click',function(e){if(e.target===d)d.close();});}return d;}
function show(d){if(d.showModal){if(!d.open)d.showModal();}else d.setAttribute('open','');}
function tile(card,o){
  o=o||{};
  var d=el('div','ct'),b=el('button','ct-open');b.type='button';
  var im=safe(card.img);
  if(im){var i=document.createElement('img');i.src=im;i.alt=card.name;i.loading='lazy';b.appendChild(i);}else b.appendChild(el('div','ct-ph',card.name));
  b.appendChild(el('span','ct-name',card.name));
  b.onclick=function(){openCard(card);};
  d.appendChild(b);
  if(o.heart!==false){
    var h=el('button','heart'+(inWish(card.id)?' on':''));h.type='button';h.setAttribute('aria-pressed',String(inWish(card.id)));h.innerHTML=IC.heart;h.setAttribute('aria-label','Wishlist');
    h.onclick=function(e){e.stopPropagation();var on=toggleWish(card);h.classList.toggle('on',on);h.setAttribute('aria-pressed',String(on));if(o.onWish)o.onWish(card,on);};
    d.appendChild(h);
  }
  if(o.badge)d.appendChild(el('span','qty',o.badge));
  return d;
}
function skel(grid,n){var a=[];for(var i=0;i<n;i++){var d=el('div','sk');grid.appendChild(d);a.push(d);}return function(){a.forEach(function(x){x.remove();});};}
function feed(grid,sent,loader,opt,onFirst){
  var page=0,seen=0,busy=false,done=false,rm=skel(grid,12);
  function near(){return sent.getBoundingClientRect().top<window.innerHeight+700;}
  async function more(){
    if(busy||done)return;busy=true;
    try{
      var r=await loader(page+1);page++;rm();rm=function(){};
      r.cards.forEach(function(c){grid.appendChild(tile(c,opt));});seen+=r.cards.length;
      if(page===1){if(onFirst)onFirst(r.total);if(!r.cards.length)grid.appendChild(el('div','empty','Nessuna carta trovata. Prova con un altro nome.'));}
      if(!r.cards.length||seen>=r.total)done=true;
      sent.textContent='';
    }catch(e){rm();rm=function(){};sent.textContent=NODATA;sent.onclick=function(){sent.textContent='';more();};busy=false;return;}
    busy=false;
    if(!done&&near())setTimeout(more,50);
  }
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){if(es[0].isIntersecting)more();},{rootMargin:'700px'}).observe(sent);
  else window.addEventListener('scroll',function(){if(near())more();});
  more();
}
function chips(box,title,names,card,kind){
  if(!names.length)return;
  box.appendChild(el('h3','',title));
  var r=el('div','row');
  names.forEach(function(u){
    var a=el('a','owner',u);a.href='profilo.html?u='+encodeURIComponent(u);
    var w=el('a','owner go','Scrivi');w.href='messaggi.html?c='+encodeURIComponent(u)+'&re='+encodeURIComponent(card.name)+'&m='+kind;
    r.append(a,w);
  });
  box.appendChild(r);
}
function openCard(c){
  var d=dlg('cardDlg');d.replaceChildren();d.setAttribute('aria-label',c.name);
  var wrap=el('div','detail'),big=safe(c.imgBig)||safe(c.img);
  if(big){var i=document.createElement('img');i.src=big;i.alt=c.name;wrap.appendChild(i);}
  var info=el('div');info.appendChild(el('h2','',c.name));
  var m=el('div','meta');[c.setName,c.number?'#'+c.number:'',c.rarity].filter(Boolean).forEach(function(x,k){m.appendChild(el('span',k?'tag':'tag info',x));});info.appendChild(m);
  var msg=el('p','msg');msg.setAttribute('role','status');msg.setAttribute('aria-live','polite');
  var r1=el('div','row');r1.style.margin='10px 0';
  var hb=el('button','btn small',''),lbl=function(){var on=inWish(c.id);hb.textContent=on?'Nella wishlist':'Aggiungi alla wishlist';hb.className='btn small'+(on?'':' ghost');};
  hb.type='button';lbl();hb.onclick=function(){toggleWish(c);lbl();};
  var cmk=el('a','btn small ghost','Cardmarket ↗');cmk.href=safe(c.cm)||cmSearch(c.name);cmk.target='_blank';cmk.rel='noopener noreferrer';
  r1.append(hb,cmk);info.appendChild(r1);
  var r2=el('div','row');
  var bs=document.createElement('select');bs.setAttribute('aria-label','Binder');
  function fillB(){bs.replaceChildren();binders().forEach(function(b){var o=el('option','',b.name);o.value=b.id;bs.appendChild(o);});var o=el('option','','＋ Nuovo binder…');o.value='__new';bs.appendChild(o);}
  fillB();
  var cs=document.createElement('select');cs.setAttribute('aria-label','Condizioni');CONDS.forEach(function(x){cs.appendChild(el('option','',x));});cs.value='NM';
  var qn=document.createElement('input');qn.type='number';qn.min=1;qn.max=99;qn.value=1;qn.setAttribute('aria-label','Quantità');
  [bs,cs,qn].forEach(function(x){x.style.width='auto';x.style.flex='1 1 90px';});
  var add=el('button','btn small','Aggiungi al binder');add.type='button';
  add.onclick=function(){
    var id=bs.value;
    if(id==='__new'||!id){var n=prompt(S.t('Nome del nuovo binder'),'');if(!n||!n.trim())return;id=newBinder(n).id;fillB();bs.value=id;}
    addToBinder(id,c,Math.max(1,parseInt(qn.value,10)||1),cs.value);
    var b=binders().find(function(x){return x.id===id;});msg.textContent='“'+c.name+'” aggiunta a «'+b.name+'».';
  };
  r2.append(bs,cs,qn,add);info.append(r2,msg);
  var ow=owners(c.id),wh=wishers(c.id);
  chips(info,'Chi la offre in scambio',ow,c,'o');chips(info,'Chi la cerca',wh,c,'w');
  if(ow.length||wh.length)info.appendChild(el('p','sub','Utenti dimostrativi'));
  wrap.appendChild(info);d.appendChild(wrap);
  var x=el('button','btn small ghost','Chiudi');x.type='button';x.style.marginTop='14px';x.onclick=function(){d.close();};d.appendChild(x);
  show(d);
}
function picker(title,onPick){
  var d=dlg('pickDlg');d.replaceChildren();d.setAttribute('aria-label',title);d.appendChild(el('h2','',title));
  var f=el('form','row'),inp=document.createElement('input');inp.type='search';inp.maxLength=60;inp.placeholder='Es. Charizard';inp.setAttribute('aria-label','Nome della carta');inp.style.flex='1';
  var go=el('button','btn small','Cerca');go.type='submit';f.append(inp,go);d.appendChild(f);
  var msg=el('p','msg');msg.setAttribute('role','status');msg.setAttribute('aria-live','polite');msg.style.margin='8px 0';d.appendChild(msg);
  var grid=el('div','cards');d.appendChild(grid);
  f.onsubmit=async function(e){
    e.preventDefault();var t=inp.value.trim();msg.textContent='';
    if(t.length<2){msg.textContent='Digita almeno due lettere.';return;}
    grid.replaceChildren(el('div','empty','Ricerca in corso…'));
    try{
      var r=await cards({name:t,size:24});grid.replaceChildren();
      if(!r.cards.length)grid.appendChild(el('div','empty','Nessuna carta trovata. Prova con un altro nome.'));
      r.cards.forEach(function(c){var tl=tile(c,{heart:false});tl.querySelector('.ct-open').onclick=function(){onPick(c);msg.textContent='“'+c.name+'” aggiunta.';};grid.appendChild(tl);});
    }catch(err){grid.replaceChildren(el('div','empty',NODATA));}
  };
  var x=el('button','btn small ghost','Chiudi');x.type='button';x.style.marginTop='14px';x.onclick=function(){d.close();};d.appendChild(x);
  show(d);inp.focus();
}
async function openFilters(){
  var d=dlg('filterDlg');d.replaceChildren();d.setAttribute('aria-label','Filtri');d.appendChild(el('h2','','Filtri'));
  var onIdx=(location.pathname.split('/').pop().replace('.html','')||'index')==='index',u=new URLSearchParams(onIdx?location.search:'');
  var f=el('form','form-grid');
  function fld(label,id){var w=el('div','field'),l=el('label','',label);l.htmlFor=id;var s=document.createElement('select');s.id=id;var o=el('option','','Tutte');o.value='';s.appendChild(o);w.append(l,s);f.appendChild(w);return s;}
  var ss=fld('Espansione','f-set'),rs=fld('Rarità','f-rar'),us=fld('Tipo di carta','f-sup');
  var act=el('div','actions');
  var ok=el('button','btn','Applica');ok.type='submit';
  var rz=el('a','btn ghost','Azzera');rz.href='index.html';
  act.append(ok,rz);f.appendChild(act);d.appendChild(f);
  var x=el('button','btn small ghost','Chiudi');x.type='button';x.style.marginTop='14px';x.onclick=function(){d.close();};d.appendChild(x);
  f.onsubmit=function(e){
    e.preventDefault();var p=new URLSearchParams();
    if(onIdx&&u.get('q'))p.set('q',u.get('q'));
    if(ss.value)p.set('set',ss.value);if(rs.value)p.set('rar',rs.value);if(us.value)p.set('sup',us.value);
    if(!p.toString())p.set('all','1');
    location.href='index.html?'+p.toString();
  };
  show(d);
  try{
    var all=await Promise.all([sets(),list('rarities'),list('supertypes')]),g={};
    all[0].forEach(function(s){if(!g[s.series]){var og=document.createElement('optgroup');og.label=s.series;g[s.series]=og;ss.appendChild(og);}var o=el('option','',s.name);o.value=s.id;g[s.series].appendChild(o);});
    all[1].forEach(function(r){rs.appendChild(el('option','',r));});all[2].forEach(function(r){us.appendChild(el('option','',r));});
    ss.value=u.get('set')||'';rs.value=u.get('rar')||'';us.value=u.get('sup')||'';
  }catch(err){act.appendChild(el('p','msg',NODATA));}
}
function shell(){
  var b=document.body;if(b.dataset.shell==='none')return;
  var old=document.querySelector('header');if(old)old.remove();
  var cur=location.pathname.split('/').pop().replace('.html','')||'index',u=new URLSearchParams(location.search);
  var mn=document.querySelector('main');if(mn){if(!mn.id)mn.id='main';var sk=el('a','skip','Vai al contenuto');sk.href='#'+mn.id;b.prepend(sk);}
  var top=el('header','topbar'),lg=el('a','logo');lg.href='index.html';lg.setAttribute('aria-label','Swappr');
  var im=document.createElement('img');im.src='logo.png';im.alt='Swappr';im.width=34;im.height=34;lg.appendChild(im);
  var f=el('form','search');f.action='index.html';f.method='get';f.setAttribute('role','search');
  var si=el('span','ic');si.innerHTML=IC.search;
  var inp=document.createElement('input');inp.type='search';inp.name='q';inp.placeholder='Cerca...';inp.maxLength=60;inp.autocomplete='off';inp.setAttribute('aria-label','Cerca carte');
  if(cur==='index')inp.value=u.get('q')||'';
  f.append(si,inp);
  var fb=el('button','iconbtn');fb.type='button';fb.innerHTML=IC.filter;fb.setAttribute('aria-label','Filtri');fb.onclick=openFilters;
  var gb=el('a','iconbtn');gb.href='impostazioni.html';gb.innerHTML=IC.gear;gb.setAttribute('aria-label','Impostazioni');
  top.append(lg,f,fb,gb);b.insertBefore(top,b.firstChild.nextSibling&&mn?b.firstChild.nextSibling:b.firstChild);
  var tabs=[['index','Cerca','search'],['binder','Binder','book'],['wishlist','Wishlist','heart'],['scambi','Scambi','trade'],['messaggi','Messaggi','chat'],['profilo','Profilo','user']];
  var nav=el('nav','tabbar');nav.setAttribute('aria-label','Menu principale');
  tabs.forEach(function(t){
    var a=el('a');a.href=t[0]+'.html';var ic=el('span','ic');ic.innerHTML=IC[t[2]];a.append(ic,el('span','',t[1]));
    if(t[0]===cur)a.setAttribute('aria-current','page');
    if(t[0]==='messaggi'){var n=unreadCount();if(n)a.appendChild(el('b','badge',n>9?'9+':String(n)));}
    nav.appendChild(a);
  });
  b.appendChild(nav);
}
S.get=get;S.set=set;S.el=el;S.uid=uid;S.IC=IC;S.DEMO=DEMO;S.NODATA=NODATA;S.CONDS=CONDS;S.FLOW=FLOW;S.HELP=HELP;S.when=when;S.safe=safe;S.lang=lang;
S.owners=owners;S.wishers=wishers;S.cards=cards;S.byIds=byIds;S.sets=sets;S.list=list;
S.binders=binders;S.saveBinders=saveBinders;S.newBinder=newBinder;S.addToBinder=addToBinder;S.haveCards=haveCards;
S.wish=wish;S.inWish=inWish;S.toggleWish=toggleWish;S.follows=follows;S.toggleFollow=toggleFollow;S.me=me;
S.notifs=notifs;S.saveNotifs=saveNotifs;S.notify=notify;S.convs=convs;S.saveConvs=saveConvs;S.say=say;
S.trades=trades;S.propose=propose;S.setStatus=setStatus;S.matches=matches;S.partials=partials;S.mostWanted=mostWanted;
S.exportAll=exportAll;S.importAll=importAll;S.wipe=wipe;S.setLang=setLang;S.langButton=langButton;
S.tile=tile;S.feed=feed;S.skel=skel;S.openCard=openCard;S.picker=picker;S.openFilters=openFilters;S.unreadCount=unreadCount;
S._t={mapCard:mapCard};
window.Swappr=S;
if(!document.querySelector('link[rel~="icon"]')){['icon','apple-touch-icon'].forEach(function(r){var l=document.createElement('link');l.rel=r;l.href='logo.png';document.head.appendChild(l);});}
if(!document.querySelector('meta[name="theme-color"]')){var tm=document.createElement('meta');tm.name='theme-color';tm.content='#ffffff';document.head.appendChild(tm);}
shell();
if(lang==='en'){var sc=document.createElement('script');sc.src='swappr-i18n.js';document.body.appendChild(sc);}
})();
