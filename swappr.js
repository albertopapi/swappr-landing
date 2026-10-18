// Swappr - nucleo condiviso: dati locali, Pokémon TCG API (con cache), barre dell'app, finestre carta/filtri/ricerca.
(function(){
'use strict';
var V='8'; /* versione dei file: deve essere uguale al numero dopo ?v= nelle pagine */
var K={theme:'swappr-theme-v1',binders:'swappr2-binders',wish:'swappr2-wish',trades:'swappr2-trades',convs:'swappr2-convs',notifs:'swappr2-notifs',follows:'swappr2-follows',user:'swappr-user-v1',session:'swappr-session-v1',lang:'swappr-lang-v1',logodark:'swappr-logodark-v1'};
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
var HELP={'Proposta':"In attesa che l'altra parte accetti.",'Accettato':'Ora ognuno prepara le carte e le spedisce a Swappr con spedizione tracciata.','Inviato a Swappr':'Le carte sono in viaggio verso Swappr.','In verifica':'Stiamo controllando che le carte corrispondano a quanto dichiarato.','Spedito':'Verifica superata: le carte sono state inoltrate alle parti.','Completato':'Scambio concluso. Grazie!','Annullato':'Questo scambio è stato annullato.'};
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
gear:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
bell:'<svg viewBox="0 0 24 24"><path d="M6 17v-6a6 6 0 0 1 12 0v6l2 2H4zM10 21h4"/></svg>',
swap:'<svg viewBox="0 0 24 24"><path d="M4 8h14l-4-4M20 16H6l4 4"/></svg>',
trend:'<svg viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8M15 7h6v6"/></svg>',
moon:'<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>',
sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
chevr:'<svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>',
chevl:'<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
check:'<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>',
plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
ext:'<svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>'};

/* ---------- utenti di esempio (finché non c'è il database) ---------- */
var DEMO=[
{u:'Athos',b:[['Binder Rare',['base1-4','base1-2','base1-10']],['Binder set base',['base1-15','base1-1','base1-6','base1-8']]],w:['base1-16','base1-14','base1-58','base1-12']},
{u:'Luca',b:[['Binder Fuoco',['base1-4','base1-12','base1-7']],['Binder Acqua',['base1-2','base1-13','base1-6']]],w:['base1-58','base1-9','base1-15']},
{u:'Lucia',b:[['Binder Psico',['base1-1','base1-10','base1-5']],['Binder Elettro',['base1-14','base1-16','base1-58']]],w:['base1-4','base1-2','base1-3']},
{u:'Gio27',b:[['Binder Base',['base1-3','base1-9','base1-11']]],w:['base1-4','base1-10','base1-14']},
{u:'Abby8',b:[['Binder Preferiti',['base1-16','base1-58','base1-5']]],w:['base1-2','base1-15','base1-1']},
{u:'Nico11',b:[['Binder Rare',['base1-13','base1-11','base1-7']]],w:['base1-4','base1-12','base1-6']}];
var DEMO_EN={'Binder Rare':'Rare Binder','Binder set base':'Base Set Binder','Binder Fuoco':'Fire Binder','Binder Acqua':'Water Binder','Binder Psico':'Psychic Binder','Binder Elettro':'Electric Binder','Binder Base':'Base Binder','Binder Preferiti':'Favorites Binder'};
function demoName(n){return lang==='en'&&DEMO_EN[n]?DEMO_EN[n]:n;}
function owners(id){return DEMO.filter(function(u){return u.b.some(function(b){return b[1].indexOf(id)>=0;});}).map(function(u){return u.u;});}
function wishers(id){return DEMO.filter(function(u){return u.w.indexOf(id)>=0;}).map(function(u){return u.u;});}

/* ---------- Pokémon TCG API: cache nel browser, ponte opzionale, tempi massimi ---------- */
/* Ordine: 1) memoria della pagina  2) cache nel browser (resta tra una pagina e l'altra)  3) ponte /api/pokemon (se c'è)  4) API diretta. */
var API='https://api.pokemontcg.io/v2/',PROXY='/api/pokemon',FIELDS='id,name,number,rarity,supertype,images,set,cardmarket';
var MIN=6e4,DAY=864e5,CP='swc:',mem={},inflight={},snap={},snapDirty=false,snapTimer=0;
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
function cread(k){try{var r=localStorage.getItem(CP+k);return r?JSON.parse(r):null;}catch(e){return null;}}
function cwrite(k,v){
  var s;try{s=JSON.stringify({t:Date.now(),v:v});}catch(e){return;}
  try{localStorage.setItem(CP+k,s);}catch(e){prune();try{localStorage.setItem(CP+k,s);}catch(e2){}}
}
function prune(){ /* spazio finito: toglie la metà più vecchia della cache delle carte (mai i dati dell'utente) */
  try{
    var list=[],i,k,t;
    for(i=0;i<localStorage.length;i++){k=localStorage.key(i);if(k&&k.indexOf(CP)===0){t=0;try{t=JSON.parse(localStorage.getItem(k)).t||0;}catch(e){}list.push([k,t]);}}
    list.sort(function(a,b){return a[1]-b[1];});
    list.slice(0,Math.ceil(list.length/2)).forEach(function(x){localStorage.removeItem(x[0]);});
  }catch(e){}
}
function clearCache(){
  try{var ks=[K.logodark],i,k;for(i=0;i<localStorage.length;i++){k=localStorage.key(i);if(k&&k.indexOf(CP)===0)ks.push(k);}ks.forEach(function(x){localStorage.removeItem(x);});}catch(e){}
  mem={};snap={};snapDirty=false;
}
(function(){var e=cread('snap');if(e&&e.v&&Date.now()-e.t<60*DAY)snap=e.v;})();
/* Le carte del set Base usate dagli utenti di esempio sono già qui: niente chiamate alla API per mostrarle. */
[[1,'Alakazam'],[2,'Blastoise'],[3,'Chansey'],[4,'Charizard'],[5,'Clefairy'],[6,'Gyarados'],[7,'Hitmonchan'],[8,'Machamp'],[9,'Magneton'],[10,'Mewtwo'],[11,'Nidoking'],[12,'Ninetales'],[13,'Poliwrath'],[14,'Raichu'],[15,'Venusaur'],[16,'Zapdos'],[58,'Pikachu']].forEach(function(x){
  var id='base1-'+x[0];
  if(!snap[id])snap[id]={id:id,name:x[1],number:String(x[0]),rarity:x[0]===58?'Common':'Rare Holo',supertype:'Pokémon',setId:'base1',setName:'Base',img:'https://images.pokemontcg.io/base1/'+x[0]+'.png',imgBig:'https://images.pokemontcg.io/base1/'+x[0]+'_hires.png',cm:''};
});
function register(m){var had=!!snap[m.id];snap[m.id]=m;if(!had){snapDirty=true;if(!snapTimer)snapTimer=setTimeout(saveSnap,1500);}}
function saveSnap(){
  snapTimer=0;if(!snapDirty)return;snapDirty=false;
  var ids=Object.keys(snap);if(ids.length>800)ids.slice(0,ids.length-800).forEach(function(i){delete snap[i];});
  cwrite('snap',snap);
}
window.addEventListener('pagehide',saveSnap);
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')saveSnap();});
function proxyOk(){try{return sessionStorage.getItem('swappr-px')!=='0';}catch(e){return true;}}
function proxyDown(){try{sessionStorage.setItem('swappr-px','0');}catch(e){}}
function viaProxy(url){var r=url.slice(API.length),i=r.indexOf('?');return PROXY+'?r='+(i<0?r:r.slice(0,i))+(i<0?'':'&'+r.slice(i+1));}
function getJSON(u,ms,px){
  var ctl=typeof AbortController==='function'?new AbortController():null,t=ctl?setTimeout(function(){ctl.abort();},ms):0;
  return fetch(u,ctl?{signal:ctl.signal}:undefined).then(function(r){
    if(px&&r.headers.get('x-swappr-proxy')!=='1'){var d=new Error('ponte non disponibile');d.dead=true;throw d;}
    if(r.status===404&&!px)return null;
    if(r.status===429||r.status>=500){var e=new Error('HTTP '+r.status);e.retry=true;e.wait=r.status===429?2500:1200;throw e;}
    if(!r.ok)throw new Error('HTTP '+r.status);
    return r.json();
  }).then(function(j){clearTimeout(t);return j;},function(e){clearTimeout(t);if(!e.retry&&!e.dead&&!/^HTTP/.test(e.message)){e.retry=true;e.net=true;}throw e;});
}
async function net(url){
  if(proxyOk()){
    try{return await getJSON(viaProxy(url),11000,true);}
    catch(e){if(e.dead||e.net)proxyDown();}
  }
  var last;
  for(var i=0;i<3;i++){
    try{return await getJSON(url,12000,false);}
    catch(e){last=e;if(!e.retry||i===2)break;await sleep(e.wait||700*(i+1));}
  }
  throw last;
}
function soft(url){ /* se l'ordinamento non è accettato, riprova senza */
  return net(url).catch(function(e){
    if(/HTTP 4\d\d/.test(e.message)&&url.indexOf('orderBy=')>0)return net(url.replace(/orderBy=[^&]*&?/,'').replace(/[?&]$/,''));
    throw e;
  });
}
function dedupe(key,fn){
  if(inflight[key])return inflight[key];
  var p=fn().then(function(v){delete inflight[key];return v;},function(e){delete inflight[key];throw e;});
  inflight[key]=p;return p;
}
/* fresh: entro questo tempo non si chiede nulla. stale: oltre, si mostra la copia vecchia e si aggiorna in silenzio. */
function cached(key,fresh,stale,fetcher){
  if(mem[key])return Promise.resolve(mem[key]);
  var e=cread(key),age=e?Date.now()-e.t:Infinity;
  function load(){return dedupe(key,fetcher).then(function(v){mem[key]=v;cwrite(key,v);return v;});}
  if(e&&age<fresh){mem[key]=e.v;return Promise.resolve(e.v);}
  if(e&&age<stale){mem[key]=e.v;load().catch(function(){});return Promise.resolve(e.v);}
  return load().catch(function(err){if(e){mem[key]=e.v;return e.v;}throw err;});
}
function cmSearch(n){return'https://www.cardmarket.com/'+lang+'/Pokemon/Products/Search?searchString='+encodeURIComponent(n);}
function mapCard(c){
  var im=c.images||{},st=c.set||{};
  var m={id:c.id,name:c.name,number:c.number||'',rarity:c.rarity||'',supertype:c.supertype||'',setId:st.id||'',setName:st.name||'',
    img:safe(im.small),imgBig:safe(im.large)||safe(im.small),cm:safe(c.cardmarket&&c.cardmarket.url)};
  register(m);return m;
}
function q1(s){return String(s).replace(/["\\]/g,'');}
function cardsUrl(o){
  var p=[];
  if(o.name){String(o.name).toLowerCase().replace(/\bv\s+(max|star|union)\b/g,'v$1').split(/\s+/).map(function(t){return t.replace(/[^\p{L}\p{N}]/gu,'');}).filter(Boolean).forEach(function(t){p.push('name:'+t+'*');});}
  if(o.set)p.push('set.id:'+String(o.set).replace(/[^\w-]/g,''));
  if(o.rarity)p.push('rarity:"'+q1(o.rarity)+'"');
  if(o.supertype)p.push('supertype:"'+q1(o.supertype)+'"');
  return API+'cards?page='+(o.page||1)+'&pageSize='+(o.size||30)+'&select='+FIELDS+(p.length?'&q='+encodeURIComponent(p.join(' ')):'')+'&orderBy='+(o.set?'number':'-set.releaseDate');
}
async function cards(o){
  var url=cardsUrl(o);
  var r=await cached(url.slice(API.length),30*MIN,3*DAY,function(){return soft(url).then(function(j){return{cards:((j&&j.data)||[]).map(mapCard),total:(j&&j.totalCount)||0};});});
  r.cards.forEach(register);
  return r;
}
function chunk(ids,out){
  var url=API+'cards?pageSize=30&select='+FIELDS+'&q='+encodeURIComponent(ids.map(function(x){return'id:"'+x+'"';}).join(' OR '));
  return dedupe(url,function(){return net(url);}).then(function(j){((j&&j.data)||[]).forEach(function(c){var m=mapCard(c);out[m.id]=m;});});
}
async function byIds(ids){
  var out={},need=[],jobs=[],i;
  ids.forEach(function(x){x=String(x).replace(/[^\w-]/g,'');if(!x)return;if(snap[x])out[x]=snap[x];else if(need.indexOf(x)<0)need.push(x);});
  for(i=0;i<need.length;i+=30)jobs.push(chunk(need.slice(i,i+30),out));
  await Promise.all(jobs);
  return out;
}
function sets(){
  return cached('sets',DAY,30*DAY,function(){return soft(API+'sets?orderBy=-releaseDate&select=id,name,series,total,releaseDate').then(function(j){return((j&&j.data)||[]).map(function(s){return{id:s.id,name:s.name,series:s.series||'',total:s.total};});});});
}
function list(path){return cached('list:'+path,DAY,30*DAY,function(){return net(API+path).then(function(j){return(j&&j.data)||[];});});}

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
  if(o.user&&typeof o.user.username==='string'){var av=o.user.avatar||{};set('user',{username:o.user.username.slice(0,20),city:String(o.user.city||'').slice(0,40),bio:String(o.user.bio||'').slice(0,140),avatar:{c:/^#[0-9a-f]{6}$/i.test(av.c)?av.c:''}});}
  return true;
}
function wipe(){DATA.concat(['user','session']).forEach(function(k){try{localStorage.removeItem(K[k]);}catch(e){}});}
function setLang(l){set('lang',l);location.reload();}

/* ---------- piccoli componenti ---------- */
var AVC=['#f6c945','#f2a0a0','#9db8ff','#8fd9b0','#c8b0ff','#f7b98a','#7fd3e0','#cbd5e1'];
var AVN=['Giallo','Rosa','Blu','Verde','Viola','Arancione','Azzurro','Grigio'];
function failBox(retry){
  var d=el('div','empty',NODATA),b=el('button','btn small ghost','Riprova');
  b.type='button';b.style.marginTop='12px';b.onclick=retry||function(){location.reload();};
  d.append(document.createElement('br'),b);return d;
}
function avatar(name,o){
  o=o||{};name=String(name||'?');
  var h=0,i;for(i=0;i<name.length;i++)h=(h*31+name.charCodeAt(i))>>>0;
  var a=el('span','av'+(o.big?' big':'')+(o.sm?' sm':''),name.charAt(0).toUpperCase());
  a.style.background=/^#[0-9a-f]{6}$/i.test(o.color||'')?o.color:AVC[h%AVC.length];
  a.setAttribute('aria-hidden','true');return a;
}
function back(href,text){var a=el('a','back');a.href=href;var i=el('span','ic');i.innerHTML=IC.chevl;a.append(i,text);return a;}
function binderArt(n){ /* due pagine da 9 tasche: si riempiono tante tasche quante sono le carte */
  var s='<svg viewBox="0 0 132 99" aria-hidden="true" focusable="false">',k=0,pg,x,y;
  for(pg=0;pg<2;pg++)for(y=0;y<3;y++)for(x=0;x<3;x++){s+='<rect class="bp'+(k<n?' on':'')+'" x="'+((pg?73:9)+x*17.5)+'" y="'+(14+y*25)+'" width="15" height="21" rx="2.5"/>';k++;}
  return s+'<line class="bsp" x1="66" y1="8" x2="66" y2="91"/></svg>';
}
function cover(name,total,distinct,href){
  var a=el('a','bind');a.href=href;var c=el('span','cover');c.innerHTML=binderArt(Math.min(18,distinct));
  a.append(c,el('span','bn',name),el('span','bc',total+(total===1?' carta':' carte')));return a;
}
function rail(nodes){
  var w=el('div','railwrap'),r=el('div','rail');nodes.forEach(function(n){r.appendChild(n);});w.appendChild(r);
  function nb(side){
    var b=el('button','railnav '+side);b.type='button';b.innerHTML=side==='l'?IC.chevl:IC.chevr;b.setAttribute('aria-label',side==='l'?'Scorri indietro':'Scorri avanti');b.hidden=true;
    b.onclick=function(){var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;r.scrollBy({left:(side==='l'?-1:1)*r.clientWidth*0.8,behavior:reduce?'auto':'smooth'});};
    return b;
  }
  var L=nb('l'),R=nb('r');
  function upd(){L.hidden=r.scrollLeft<8;R.hidden=r.scrollLeft+r.clientWidth>=r.scrollWidth-8;}
  r.addEventListener('scroll',upd,{passive:true});window.addEventListener('resize',upd);
  if('ResizeObserver' in window)new ResizeObserver(upd).observe(r);
  else setTimeout(upd,60);
  w.append(L,R);w.track=r;w.update=upd;return w;
}

/* ---------- finestre ---------- */
function dlg(id){var d=document.getElementById(id);if(!d){d=document.createElement('dialog');d.id=id;document.body.appendChild(d);d.addEventListener('click',function(e){if(e.target===d)d.close();});}return d;}
function show(d){if(d.showModal){if(!d.open)d.showModal();}else d.setAttribute('open','');}
function modal(build){
  return new Promise(function(res){
    var d=document.createElement('dialog');d.className='small';document.body.appendChild(d);
    var ended=false;
    function fin(v){if(ended)return;ended=true;try{d.close();}catch(e){}d.remove();res(v);}
    d.addEventListener('cancel',function(e){e.preventDefault();fin(null);});
    d.addEventListener('click',function(e){if(e.target===d)fin(null);});
    build(d,fin);show(d);
  });
}
function confirmBox(title,text,ok,danger,noLabel){
  return modal(function(d,fin){
    d.appendChild(el('h2','',title));if(text)d.appendChild(el('p','',text));
    var a=el('div','actions'),no=el('button','btn small ghost',noLabel||'Annulla'),yes=el('button','btn small'+(danger?' danger':''),ok||'Conferma');
    no.type='button';yes.type='button';no.onclick=function(){fin(false);};yes.onclick=function(){fin(true);};
    a.append(no,yes);d.appendChild(a);setTimeout(function(){(danger?no:yes).focus();},0);
  }).then(function(v){return v===true;});
}
function askBox(title,label,value,ok,max){
  return modal(function(d,fin){
    d.appendChild(el('h2','',title));
    var f=el('form'),w=el('div','field'),l=el('label','',label),i=document.createElement('input');
    i.id='ask-i';l.htmlFor='ask-i';i.value=value||'';i.maxLength=max||30;i.autocomplete='off';w.append(l,i);f.appendChild(w);
    var a=el('div','actions'),no=el('button','btn small ghost','Annulla'),yes=el('button','btn small',ok||'Salva');
    no.type='button';yes.type='submit';no.onclick=function(){fin(null);};a.append(no,yes);f.appendChild(a);
    f.onsubmit=function(e){e.preventDefault();fin(i.value.trim()||null);};d.appendChild(f);
    setTimeout(function(){i.focus();i.select();},0);
  });
}

/* ---------- carte ---------- */
function tile(card,o){
  o=o||{};
  var d=el('div','ct'),b=el('button','ct-open');b.type='button';
  var im=safe(card.img);
  if(im){
    var i=document.createElement('img');i.alt=card.name;i.width=245;i.height=342;i.decoding='async';
    if(o.eager){i.loading='eager';i.fetchPriority='high';}else i.loading='lazy';
    i.onload=function(){i.classList.add('ld');};i.src=im;b.appendChild(i);
  }else b.appendChild(el('div','ct-ph',card.name));
  b.appendChild(el('span','ct-name',card.name));
  if(o.badge)b.appendChild(el('span','ct-sub',o.badge));
  b.onclick=function(){openCard(card);};
  d.appendChild(b);
  if(o.heart!==false){
    var h=el('button','heart'+(inWish(card.id)?' on':''));h.type='button';h.setAttribute('aria-pressed',String(inWish(card.id)));h.innerHTML=IC.heart;h.setAttribute('aria-label','Wishlist');
    h.onclick=function(e){e.stopPropagation();var on=toggleWish(card);h.classList.toggle('on',on);h.setAttribute('aria-pressed',String(on));if(o.onWish)o.onWish(card,on);};
    d.appendChild(h);
  }
  return d;
}
function skel(grid,n){
  var a=[];grid.setAttribute('aria-busy','true');
  for(var i=0;i<n;i++){var d=el('div','sk-t');d.setAttribute('aria-hidden','true');d.append(el('div','sk'),el('div','sk-l'));grid.appendChild(d);a.push(d);}
  return function(){a.forEach(function(x){x.remove();});grid.removeAttribute('aria-busy');};
}
function feed(grid,sent,loader,opt,onFirst){
  var page=0,seen=0,busy=false,done=false,rm=skel(grid,12);
  function near(){return sent.getBoundingClientRect().top<window.innerHeight+700;}
  function fail(){
    sent.textContent='';var b=el('button','btn small ghost','Riprova');b.type='button';
    b.onclick=function(){sent.textContent='';more();};sent.append(el('span','',NODATA),b);
  }
  async function more(){
    if(busy||done)return;busy=true;
    var slow=setTimeout(function(){sent.textContent='Il servizio carte sta rispondendo lentamente…';},7000);
    try{
      var r=await loader(page+1);clearTimeout(slow);page++;rm();rm=function(){};
      r.cards.forEach(function(c,k){grid.appendChild(tile(c,page===1&&k<8?Object.assign({},opt,{eager:true}):opt));});seen+=r.cards.length;
      if(page===1){if(onFirst)onFirst(r.total);if(!r.cards.length)grid.appendChild(el('div','empty','Nessuna carta trovata. Prova con un altro nome.'));}
      if(!r.cards.length||seen>=r.total)done=true;
      sent.textContent='';
    }catch(e){clearTimeout(slow);rm();rm=function(){};busy=false;fail();return;}
    busy=false;
    if(!done&&near())setTimeout(more,50);
  }
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){if(es[0].isIntersecting)more();},{rootMargin:'700px'}).observe(sent);
  else window.addEventListener('scroll',function(){if(near())more();});
  more();
}
function people(box,title,names,card,kind){
  if(!names.length)return;
  box.appendChild(el('h3','',title));
  names.forEach(function(u){
    var r=el('div','urow'),a=el('a','',u);a.href='profilo.html?u='+encodeURIComponent(u);
    var w=el('a','btn small ghost','Scrivi');w.href='messaggi.html?c='+encodeURIComponent(u)+'&re='+encodeURIComponent(card.name)+'&m='+kind;
    r.append(avatar(u,{sm:true}),a,w);box.appendChild(r);
  });
}
function openCard(c){
  var d=dlg('cardDlg');d.replaceChildren();d.setAttribute('aria-label',c.name);
  var wrap=el('div','detail'),big=safe(c.imgBig)||safe(c.img);
  if(big){var i=document.createElement('img');i.src=big;i.alt=c.name;i.decoding='async';wrap.appendChild(i);}
  var info=el('div');info.appendChild(el('h2','',c.name));
  var m=el('div','meta');[c.setName,c.number?'#'+c.number:'',c.rarity].filter(Boolean).forEach(function(x,k){m.appendChild(el('span',k?'tag':'tag info',x));});info.appendChild(m);
  var msg=el('p','msg');msg.setAttribute('role','status');msg.setAttribute('aria-live','polite');
  var r1=el('div','row');r1.style.margin='10px 0';
  var hb=el('button','btn small',''),lbl=function(){var on=inWish(c.id);hb.textContent=on?'Nella wishlist':'Aggiungi alla wishlist';hb.className='btn small'+(on?'':' ghost');};
  hb.type='button';lbl();hb.onclick=function(){toggleWish(c);lbl();};
  var cmk=el('a','btn small ghost','Cardmarket');var ei=el('span','ic');ei.innerHTML=IC.ext;cmk.appendChild(ei);
  cmk.href=safe(c.cm)||cmSearch(c.name);cmk.target='_blank';cmk.rel='noopener noreferrer';
  r1.append(hb,cmk);info.appendChild(r1);
  var r2=el('div','row');
  var bs=document.createElement('select');bs.setAttribute('aria-label','Binder');
  var nn=document.createElement('input');nn.placeholder='Nome del nuovo binder';nn.maxLength=30;nn.setAttribute('aria-label','Nome del nuovo binder');nn.hidden=true;
  function fillB(){bs.replaceChildren();binders().forEach(function(b){var o=el('option','',b.name);o.value=b.id;bs.appendChild(o);});var o=el('option','','Nuovo binder…');o.value='__new';bs.appendChild(o);}
  fillB();nn.hidden=bs.value!=='__new';
  bs.onchange=function(){nn.hidden=bs.value!=='__new';if(!nn.hidden)nn.focus();};
  var cs=document.createElement('select');cs.setAttribute('aria-label','Condizioni');CONDS.forEach(function(x){cs.appendChild(el('option','',x));});cs.value='NM';
  var qn=document.createElement('input');qn.type='number';qn.min=1;qn.max=99;qn.value=1;qn.setAttribute('aria-label','Quantità');
  [bs,cs,qn].forEach(function(x){x.style.width='auto';x.style.flex='1 1 90px';});nn.style.flex='1 1 100%';
  var add=el('button','btn small','Aggiungi al binder');add.type='button';
  add.onclick=function(){
    var id=bs.value;
    if(id==='__new'||!id){
      var n=nn.value.trim();if(!n){msg.textContent='Scrivi un nome per il nuovo binder.';nn.focus();return;}
      id=newBinder(n).id;fillB();bs.value=id;nn.value='';nn.hidden=true;
    }
    addToBinder(id,c,Math.max(1,Math.min(99,parseInt(qn.value,10)||1)),cs.value);
    var b=binders().find(function(x){return x.id===id;});msg.textContent='“'+c.name+'” aggiunta a «'+b.name+'».';
  };
  r2.append(bs,nn,cs,qn,add);info.append(r2,msg);
  var ow=owners(c.id),wh=wishers(c.id);
  people(info,'Chi la offre in scambio',ow,c,'o');people(info,'Chi la cerca',wh,c,'w');
  if(ow.length||wh.length)info.appendChild(el('p','note','Utenti di esempio finché gli account non sono attivi.'));
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
    grid.replaceChildren();var rm=skel(grid,8);
    try{
      var r=await cards({name:t,size:24});rm();
      if(!r.cards.length)grid.appendChild(el('div','empty','Nessuna carta trovata. Prova con un altro nome.'));
      r.cards.forEach(function(c){var tl=tile(c,{heart:false});tl.querySelector('.ct-open').onclick=function(){onPick(c);msg.textContent='“'+c.name+'” aggiunta.';};grid.appendChild(tl);});
    }catch(err){rm();grid.replaceChildren(el('div','empty',NODATA));}
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
function suggest(inp,form){
  var box=el('div','sugg'),list=null,topA=null,topB=null,seq=0,timer=0,page=0,term='',done=true,busy=false,idx=-1;
  box.id='sugg';box.setAttribute('role','listbox');box.hidden=true;document.body.appendChild(box);
  inp.setAttribute('role','combobox');inp.setAttribute('aria-autocomplete','list');inp.setAttribute('aria-controls','sugg');inp.setAttribute('aria-expanded','false');
  function place(){
    var vw=document.documentElement.clientWidth||window.innerWidth,r=form.getBoundingClientRect(),w=Math.min(560,vw-16),l=Math.min(Math.max(8,r.left),vw-8-w);
    box.style.left=l+'px';box.style.width=w+'px';box.style.top=(r.bottom+8)+'px';box.style.maxHeight=Math.max(160,window.innerHeight-r.bottom-100)+'px';
  }
  function rows(){return Array.prototype.slice.call(box.querySelectorAll('.sg-row'));}
  function hi(i){var r=rows();if(!r.length)return;idx=(i+r.length)%r.length;r.forEach(function(x,k){x.classList.toggle('on',k===idx);x.setAttribute('aria-selected',String(k===idx));});r[idx].scrollIntoView({block:'nearest'});}
  function close(){box.hidden=true;inp.setAttribute('aria-expanded','false');idx=-1;seq++;busy=false;}
  function note(t){var n=el('div','sg-note',t);list.appendChild(n);return n;}
  function row(c){
    var b=el('button','sg-row');b.type='button';b.setAttribute('role','option');
    var th=el('span','sg-th'),im=safe(c.img);if(im){var i=document.createElement('img');i.src=im;i.alt='';i.width=34;i.height=48;i.loading='lazy';i.decoding='async';th.appendChild(i);}
    var tx=el('span','sg-tx');tx.append(el('b','',c.name),el('small','',[c.setName,c.number?'#'+c.number:'',c.rarity].filter(Boolean).join(', ')));
    b.append(th,tx);b.onclick=function(){close();openCard(c);};return b;
  }
  function ensure(t){
    if(box.hidden){
      box.replaceChildren();topA=el('a','sg-row sg-top');topA.setAttribute('role','option');
      var ic=el('span','ic');ic.innerHTML=IC.search;var tx=el('span','sg-tx');topB=el('b','');tx.append(topB,el('small','','Vedi tutti i risultati'));topA.append(ic,tx);
      list=el('div','sg-list');box.append(topA,list);place();box.hidden=false;box.scrollTop=0;inp.setAttribute('aria-expanded','true');
    }
    topB.textContent='“'+t+'”';topA.href='index.html?q='+encodeURIComponent(t);
  }
  async function load(){
    if(busy||done)return;busy=true;var my=seq,n=note('Cerco…');
    try{
      var r=await cards({name:term,page:page+1,size:20});
      if(my!==seq)return;
      page++;n.remove();r.cards.forEach(function(c){list.appendChild(row(c));});
      done=page*20>=r.total;if(!r.cards.length&&page===1)note('Nessuna carta trovata. Prova con un altro nome.');
    }catch(e){if(my!==seq)return;n.remove();note(NODATA);done=true;}
    busy=false;
  }
  function fresh(t){seq++;busy=false;page=0;term=t;done=t.length<2;idx=-1;list.replaceChildren();if(done)note('Digita almeno due lettere.');else load();}
  inp.addEventListener('input',function(){
    var t=inp.value.trim();clearTimeout(timer);
    if(!t){close();return;}
    ensure(t);timer=setTimeout(function(){fresh(t);},260);
  });
  inp.addEventListener('focus',function(){var t=inp.value.trim();if(t&&box.hidden){ensure(t);fresh(t);}});
  inp.addEventListener('keydown',function(e){
    if(box.hidden)return;
    if(e.key==='ArrowDown'){e.preventDefault();hi(idx+1);}
    else if(e.key==='ArrowUp'){e.preventDefault();hi(idx-1);}
    else if(e.key==='Escape'){close();}
    else if(e.key==='Enter'&&idx>0){e.preventDefault();rows()[idx].click();}
  });
  box.addEventListener('scroll',function(){if(box.scrollTop+box.clientHeight>box.scrollHeight-80)load();});
  document.addEventListener('mousedown',function(e){if(!box.hidden&&!box.contains(e.target)&&!form.contains(e.target))close();});
  window.addEventListener('resize',function(){if(!box.hidden)place();});
  form.addEventListener('submit',close);
}

/* ---------- lingua, tema chiaro/scuro e logo ---------- */
function langButton(box){
  var b=el('button','pill',lang==='it'?'English':'Italiano');b.type='button';b.setAttribute('aria-label',lang==='it'?'Switch to English':"Passa all'italiano");
  b.onclick=function(){setLang(lang==='it'?'en':'it');};box.appendChild(b);
}
function themePref(){var t=get('theme','light');return t==='dark'||t==='auto'?t:'light';}
function themeApply(){
  var p=themePref(),d=p==='dark'||(p==='auto'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme=d?'dark':'light';
  var m=document.querySelector('meta[name="theme-color"]');if(m)m.content=d?'#0b1120':'#ffffff';
  return d;
}
function setTheme(p){set('theme',p);themeApply();}
function themeButton(box){
  var b=el('button','pill');b.type='button';
  function lab(){var d=document.documentElement.dataset.theme==='dark';b.innerHTML=d?IC.sun:IC.moon;b.setAttribute('aria-label',d?'Tema chiaro':'Tema scuro');}
  lab();b.onclick=function(){setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');lab();};box.appendChild(b);
}
var LOGO_SVG='<svg viewBox="0 0 36 36" width="34" height="34" aria-hidden="true"><rect width="36" height="36" rx="9" fill="#2563eb"/><text x="18" y="26" text-anchor="middle" font-size="22" font-weight="800" fill="#fff" font-family="system-ui,sans-serif">S</text></svg>';
function logoImg(){
  var im=document.createElement('img');im.alt='Swappr';im.decoding='async';
  var ld=get('logodark',0),chain=['logo2.png'],k=0;
  if(document.documentElement.dataset.theme==='dark'&&!(ld&&Date.now()-ld<36e5))chain.unshift('logo2-dark.png'); /* se manca, lo ricorda per un'ora */
  im.onerror=function(){
    if(chain[k]==='logo2-dark.png')set('logodark',Date.now());
    k++;
    if(k<chain.length){im.src=chain[k];}
    else{var f=el('span','');f.innerHTML=LOGO_SVG;f.setAttribute('role','img');f.setAttribute('aria-label','Swappr');im.replaceWith(f);}
  };
  im.src=chain[0];return im;
}
function shell(){
  var b=document.body;if(b.dataset.shell==='none')return;
  var old=document.querySelector('header');if(old)old.remove();
  var cur=location.pathname.split('/').pop().replace('.html','')||'index',u=new URLSearchParams(location.search);
  var mn=document.querySelector('main');if(mn){if(!mn.id)mn.id='main';var sk=el('a','skip','Vai al contenuto');sk.href='#'+mn.id;b.prepend(sk);}
  var top=el('header','topbar'),lg=el('a','logo');lg.href='index.html';lg.setAttribute('aria-label','Swappr');
  lg.appendChild(logoImg());
  var f=el('form','search');f.action='index.html';f.method='get';f.setAttribute('role','search');
  var si=el('span','ic');si.innerHTML=IC.search;
  var inp=document.createElement('input');inp.type='search';inp.name='q';inp.placeholder='Cerca...';inp.maxLength=60;inp.autocomplete='off';inp.setAttribute('aria-label','Cerca carte');
  if(cur==='index')inp.value=u.get('q')||'';
  f.append(si,inp);suggest(inp,f);
  var fb=el('button','iconbtn push');fb.type='button';fb.innerHTML=IC.filter;fb.setAttribute('aria-label','Filtri');fb.onclick=openFilters;
  var sp=el('span','sep');sp.setAttribute('aria-hidden','true');
  var gb=el('a','iconbtn');gb.href='impostazioni.html';gb.innerHTML=IC.gear;gb.setAttribute('aria-label','Impostazioni');
  top.append(lg,f,fb,sp,gb);
  var tabs=[['index','Cerca','search'],['binder','Binder','book'],['wishlist','Wishlist','heart'],['scambi','Scambi','trade'],['messaggi','Messaggi','chat'],['profilo','Profilo','user']];
  var nav=el('nav','tabbar');nav.setAttribute('aria-label','Menu principale');
  tabs.forEach(function(t){
    var a=el('a');a.href=t[0]+'.html';var ic=el('span','ic');ic.innerHTML=IC[t[2]];a.append(ic,el('span','',t[1]));
    if(t[0]===cur)a.setAttribute('aria-current','page');
    if(t[0]==='messaggi'){var n=unreadCount();if(n)a.appendChild(el('b','badge',n>9?'9+':String(n)));}
    nav.appendChild(a);
  });
  b.insertBefore(top,mn||b.firstChild);b.insertBefore(nav,mn||b.firstChild);
}
S.get=get;S.set=set;S.el=el;S.uid=uid;S.IC=IC;S.DEMO=DEMO;S.NODATA=NODATA;S.CONDS=CONDS;S.FLOW=FLOW;S.HELP=HELP;S.when=when;S.safe=safe;S.lang=lang;S.V=V;
S.owners=owners;S.wishers=wishers;S.demoName=demoName;S.cards=cards;S.byIds=byIds;S.sets=sets;S.list=list;S.clearCache=clearCache;
S.binders=binders;S.saveBinders=saveBinders;S.newBinder=newBinder;S.addToBinder=addToBinder;S.haveCards=haveCards;
S.wish=wish;S.inWish=inWish;S.toggleWish=toggleWish;S.follows=follows;S.toggleFollow=toggleFollow;S.me=me;
S.notifs=notifs;S.saveNotifs=saveNotifs;S.notify=notify;S.convs=convs;S.saveConvs=saveConvs;S.say=say;
S.trades=trades;S.propose=propose;S.setStatus=setStatus;S.matches=matches;S.partials=partials;S.mostWanted=mostWanted;
S.themePref=themePref;S.setTheme=setTheme;S.themeButton=themeButton;S.exportAll=exportAll;S.importAll=importAll;S.wipe=wipe;S.setLang=setLang;S.langButton=langButton;
S.tile=tile;S.feed=feed;S.skel=skel;S.openCard=openCard;S.picker=picker;S.openFilters=openFilters;S.unreadCount=unreadCount;
S.avatar=avatar;S.back=back;S.cover=cover;S.rail=rail;S.confirm=confirmBox;S.ask=askBox;S.binderArt=binderArt;S.failBox=failBox;S.AVC=AVC;S.AVN=AVN;
S._t={mapCard:mapCard,snapSize:function(){return Object.keys(snap).length;},saveSnap:saveSnap};
window.Swappr=S;
if(!document.querySelector('link[rel~="icon"]')){['icon','apple-touch-icon'].forEach(function(r){var l=document.createElement('link');l.rel=r;l.href='logo.png';document.head.appendChild(l);});}
if(!document.querySelector('meta[name="theme-color"]')){var tm=document.createElement('meta');tm.name='theme-color';tm.content='#ffffff';document.head.appendChild(tm);}
themeApply();
if(window.matchMedia)try{window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){if(themePref()==='auto')themeApply();});}catch(e){}
shell();
if(lang==='en'){var sc=document.createElement('script');sc.src='swappr-i18n.js?v='+V;document.body.appendChild(sc);}
})();
