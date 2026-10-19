// Swappr - script condiviso da tutte le pagine. Prima parte: dati locali, catalogo carte, barre dell'app, finestre carta/filtri/ricerca.
// Seconda parte (in fondo): collegamento a Supabase (account, salvataggio online, scambi, messaggi, staff); si attiva solo se swappr-config.js è compilato.
(function(){
'use strict';
var V='10'; /* versione dei file: deve essere uguale al numero dopo ?v= nelle pagine */
var K={theme:'swappr-theme-v1',binders:'swappr2-binders',wish:'swappr2-wish',trades:'swappr2-trades',convs:'swappr2-convs',notifs:'swappr2-notifs',follows:'swappr2-follows',user:'swappr-user-v1',session:'swappr-session-v1',lang:'swappr-lang-v1',logodark:'swappr-logodark-v1',cloud:'swappr-cloud-v1'};
var DATA=['binders','wish','trades','convs','notifs','follows'];
var S={t:function(s){return s;}};
function get(k,d){try{var r=localStorage.getItem(K[k]);var v=r?JSON.parse(r):d;return v==null?d:v;}catch(e){return d;}}
function set(k,v){
  try{localStorage.setItem(K[k],JSON.stringify(v));}catch(e){return false;}
  if((k==='binders'||k==='wish'||k==='follows')&&S.cloud&&S.cloud.dirty)S.cloud.dirty(); /* con l'account attivo, le modifiche partono verso il database */
  return true;
}
function el(t,c,x){var n=document.createElement(t);if(c)n.className=c;if(x!==undefined)n.textContent=x;return n;}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function uuid(){ /* identificatore casuale (UUID v4): i binder ne hanno bisogno per essere salvati nel database */
  try{if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();}catch(e){}
  var b=new Uint8Array(16),i;
  if(window.crypto&&crypto.getRandomValues)crypto.getRandomValues(b);else for(i=0;i<16;i++)b[i]=Math.floor(Math.random()*256);
  b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;
  var h=Array.prototype.map.call(b,function(x){return(x+256).toString(16).slice(1);}).join('');
  return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
}
var lang=get('lang','it')==='en'?'en':'it',loc=lang==='en'?'en-GB':'it-IT';
document.documentElement.lang=lang;

/* ---------- collegamento a Supabase: si attiva solo se swappr-config.js è compilato ---------- */
function cfgCheck(c){
  var u=String(c.SUPABASE_URL||'').trim().replace(/\/+$/,''),k=String(c.SUPABASE_ANON_KEY||'').trim();
  if(!u&&!k)return{};
  if(!u||!k)return{err:'In swappr-config.js mancano l’indirizzo (URL) o la chiave: servono tutti e due.'};
  if(!/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(u)&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(u))return{err:'L’indirizzo di Supabase deve iniziare con https:// (esempio: https://abcdwxyz.supabase.co).'};
  if(/^sb_secret_/i.test(k))return{err:'Hai inserito una chiave segreta. Usa solo la chiave pubblica (anon o publishable) e non pubblicare mai quella segreta.'};
  if(/^sb_publishable_/i.test(k))return{url:u,key:k};
  var p=k.split('.'),role='';
  if(p.length!==3)return{err:'La chiave non sembra una chiave pubblica di Supabase (anon o publishable).'};
  try{role=JSON.parse(atob(p[1].replace(/-/g,'+').replace(/_/g,'/'))).role;}catch(e){}
  if(role==='service_role')return{err:'Hai inserito la chiave service_role, che è segreta: non usarla mai nel sito. Usa la chiave anon (pubblica).'};
  if(role!=='anon')return{err:'La chiave non sembra una chiave pubblica di Supabase (anon o publishable).'};
  return{url:u,key:k};
}
var CK=cfgCheck(window.SWAPPR_CONFIG||{});
S.cloud={on:!!CK.url,url:CK.url||'',key:CK.key||'',problem:CK.err||'',loaded:false,user:null,unread:0};
(function(){var c=get('cloud',null);if(c&&c.unread)S.cloud.unread=c.unread;})();
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

/* ---------- utenti di esempio (solo finché non è collegato il database) ---------- */
var DEMO0=[
{u:'Athos',b:[['Binder Rare',['base1-4','base1-2','base1-10']],['Binder set base',['base1-15','base1-1','base1-6','base1-8']]],w:['base1-16','base1-14','base1-58','base1-12']},
{u:'Luca',b:[['Binder Fuoco',['base1-4','base1-12','base1-7']],['Binder Acqua',['base1-2','base1-13','base1-6']]],w:['base1-58','base1-9','base1-15']},
{u:'Lucia',b:[['Binder Psico',['base1-1','base1-10','base1-5']],['Binder Elettro',['base1-14','base1-16','base1-58']]],w:['base1-4','base1-2','base1-3']},
{u:'Gio27',b:[['Binder Base',['base1-3','base1-9','base1-11']]],w:['base1-4','base1-10','base1-14']},
{u:'Abby8',b:[['Binder Preferiti',['base1-16','base1-58','base1-5']]],w:['base1-2','base1-15','base1-1']},
{u:'Nico11',b:[['Binder Rare',['base1-13','base1-11','base1-7']]],w:['base1-4','base1-12','base1-6']}];
var DEMO=S.cloud.on?[]:DEMO0; /* gli utenti di esempio servono solo senza account veri */
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
async function apiCards(o){
  var url=cardsUrl(o);
  var r=await cached(url.slice(API.length),30*MIN,3*DAY,function(){return soft(url).then(function(j){return{cards:((j&&j.data)||[]).map(mapCard),total:(j&&j.totalCount)||0};});});
  r.cards.forEach(register);
  return r;
}
function chunk(ids,out){
  var url=API+'cards?pageSize=30&select='+FIELDS+'&q='+encodeURIComponent(ids.map(function(x){return'id:"'+x+'"';}).join(' OR '));
  return dedupe(url,function(){return net(url);}).then(function(j){((j&&j.data)||[]).forEach(function(c){var m=mapCard(c);out[m.id]=m;});});
}
function apiSets(){
  return cached('sets',DAY,30*DAY,function(){return soft(API+'sets?orderBy=-releaseDate&select=id,name,series,total,releaseDate,ptcgoCode').then(function(j){return((j&&j.data)||[]).map(function(s){return{id:s.id,name:s.name,series:s.series||'',total:s.total,date:s.releaseDate||'',code:s.ptcgoCode||''};});});});
}
function apiList(path){return cached('list:'+path,DAY,30*DAY,function(){return net(API+path).then(function(j){return(j&&j.data)||[];});});}

/* ---------- catalogo delle carte: file del sito (cartella catalogo/), senza API ---------- */
/* sets.json (piccolo): set, rarità, modelli delle immagini.  carte.json (circa 120 KB compressi): tutte le carte, caricato solo quando serve. */
var CAT={m:null,pm:null,ix:null,pi:null,rows:null,by:null,ids:null,sr:{}};
function catGet(f){return fetch('catalogo/'+f+'?v='+V).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();});}
function catMeta(){
  if(CAT.m)return Promise.resolve(CAT.m);
  if(!CAT.pm)CAT.pm=catGet('sets.json').then(function(m){CAT.m=m;m.sets.forEach(function(s,i){CAT.sr[s[0]]=i;});return m;},function(e){CAT.pm=null;throw e;});
  return CAT.pm;
}
function catFill(x,sid,id,stem){return x.replace('{s}',sid).replace('{n}',stem).replace('{id}',id);}
function mkCard(si,t){ /* carta completa dal formato compatto: [numero, nome, rarità, tipo, (suffisso id, nome file immagine)] */
  var m=CAT.m,s=m.sets[si],suf=t[4]||t[0],stem=t[5]||t[0],id=s[0]+'-'+suf,tp=m.imgs[s[6]];
  return{id:id,name:t[1],number:t[0],rarity:t[2]>=0?m.rarities[t[2]]:'',supertype:m.supertypes[t[3]]||'',setId:s[0],setName:s[1],img:catFill(tp.s,s[0],id,stem),imgBig:catFill(tp.l,s[0],id,stem),cm:''};
}
function cleanId(x){return String(x).replace(/[^\w!?-]/g,'');}
function cardFromId(id,name){ /* carta con i soli dati ricavabili dall'id (serve sets.json, non carte.json): rarità e tipo restano vuoti */
  var m=CAT.m,k=String(id).indexOf('-'),sid=String(id).slice(0,k),suf=String(id).slice(k+1);
  if(!m||k<1||CAT.sr[sid]===undefined)return null;
  var s=m.sets[CAT.sr[sid]],tp=m.imgs[s[6]],stem=(m.exc&&m.exc[id])||suf;
  return{id:id,name:name||suf,number:suf,rarity:'',supertype:'',setId:sid,setName:s[1],img:catFill(tp.s,sid,id,stem),imgBig:catFill(tp.l,sid,id,stem),cm:''};
}
function catIndex(){
  if(CAT.ix)return Promise.resolve(CAT.ix);
  if(!CAT.pi)CAT.pi=Promise.all([catMeta(),catGet('carte.json')]).then(function(r){
    CAT.ix=r[1];CAT.rows=[];CAT.by={};
    r[0].sets.forEach(function(s,si){var rs=(r[1][s[0]]||[]).map(function(t){return{s:si,t:t,w:null,n:null};});CAT.by[s[0]]=rs;rs.forEach(function(x){CAT.rows.push(x);});});
    return CAT.ix;
  },function(e){CAT.pi=null;throw e;});
  return CAT.pi;
}
function norm(s){
  s=String(s).toLowerCase();
  try{s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(e){}
  return s.replace(/['’`]/g,'').replace(/\bv[\s-]+(max|star|union)\b/g,'v$1').replace(/[^a-z0-9]+/g,' ').trim();
}
function catRow(id){
  if(!CAT.ids){CAT.ids={};CAT.rows.forEach(function(x){var s=CAT.m.sets[x.s];CAT.ids[s[0]+'-'+(x.t[4]||x.t[0])]=x;});}
  return CAT.ids[id]||null;
}
function catSearch(o){ /* stessa forma della API: {cards, total}; ordine: prima il nome uguale, poi chi inizia così, poi gli altri; a parità, dal set più recente */
  var rarity=o.rarity||'',sup=o.supertype?CAT.m.supertypes.indexOf(o.supertype):-1,qn=o.name?norm(o.name):'',qt=qn?qn.split(' '):[],m=CAT.m;
  var src=o.set?(CAT.by[o.set]||[]):CAT.rows,ri=rarity?m.rarities.indexOf(rarity):-2,t0=[],t1=[],t2=[],i,x,j,k,ok;
  if(rarity&&ri<0)return{cards:[],total:0};
  if(o.supertype&&sup<0)return{cards:[],total:0};
  for(i=0;i<src.length;i++){
    x=src[i];
    if(sup>=0&&x.t[3]!==sup)continue;
    if(ri>=0&&x.t[2]!==ri)continue;
    if(!qt.length){t2.push(x);continue;}
    if(!x.n){x.n=norm(x.t[1]);x.w=x.n.split(' ');}
    ok=true;
    for(j=0;j<qt.length&&ok;j++){ok=false;for(k=0;k<x.w.length;k++){if(x.w[k].indexOf(qt[j])===0){ok=true;break;}}}
    if(!ok)continue;
    if(x.n===qn)t0.push(x);else if(x.n.indexOf(qn)===0)t1.push(x);else t2.push(x);
  }
  var all=t0.concat(t1,t2),size=o.size||30,page=o.page||1;
  return{cards:all.slice((page-1)*size,page*size).map(function(r){return mkCard(r.s,r.t);}),total:all.length};
}
async function cards(o){
  try{
    var m=await catMeta();
    if(!o.set||CAT.sr[o.set]!==undefined){await catIndex();return catSearch(o);}
  }catch(e){}
  return apiCards(o); /* ripiego: set più nuovi del catalogo, o catalogo non raggiungibile */
}
async function byIds(ids){
  var out={},need=[],i;
  ids.forEach(function(x){x=cleanId(x);if(!x)return;if(snap[x])out[x]=snap[x];else if(need.indexOf(x)<0)need.push(x);});
  if(need.length){
    try{await catIndex();need=need.filter(function(x){var r=catRow(x);if(r){out[x]=mkCard(r.s,r.t);return false;}return true;});}catch(e){}
  }
  if(need.length){
    var jobs=[];for(i=0;i<need.length;i+=30)jobs.push(chunk(need.slice(i,i+30),out));
    try{await Promise.all(jobs);}catch(e){if(!Object.keys(out).length)throw e;}
  }
  return out;
}
async function sets(){ /* tutti i set del catalogo, dal più recente: [{id,name,series,total,date,code,symbol}] */
  try{
    var m=await catMeta();
    return m.sets.map(function(s){return{id:s[0],name:s[1],series:m.series[s[2]],si:s[2],total:s[3],date:s[4],code:s[5],symbol:catFill(m.imgs[s[6]].y,s[0],'',''),logo:catFill(m.imgs[s[6]].g,s[0],'','')};});
  }catch(e){return apiSets();}
}
function newSets(){ /* set che la API conosce e il catalogo no (uscite più recenti): per ora le carte si leggono dalla API */
  return catMeta().then(function(){return apiSets();}).then(function(a){return a.filter(function(s){return CAT.sr[s.id]===undefined;});}).catch(function(){return[];});
}
async function list(path){
  try{var m=await catMeta();if(path==='rarities')return m.rarities.slice();if(path==='supertypes')return m.supertypes.slice();}catch(e){}
  return apiList(path);
}
async function latest(){ /* le carte migliori dell'ultimo set: dal catalogo, senza API */
  try{var m=await catMeta();return m.latest.map(function(t){return mkCard(CAT.sr[t[0]],t.slice(1));});}
  catch(e){return(await apiCards({size:14})).cards;}
}
async function enrich(c){ /* completa rarità e tipo di una carta nota solo dall'id */
  if(!c||c.rarity)return c;
  try{await catIndex();var r=catRow(c.id);if(r){var f=mkCard(r.s,r.t);c.rarity=f.rarity;c.supertype=f.supertype;c.number=f.number;c.name=f.name;}}catch(e){}
  return c;
}
function prefetchCatalog(){catIndex().catch(function(){});}
async function count(o){ /* quante carte darebbe questa ricerca (null se non si sa: set fuori catalogo o catalogo non raggiungibile) */
  try{
    await catMeta();
    if(o.set&&CAT.sr[o.set]===undefined)return null;
    await catIndex();
    return catSearch(Object.assign({},o,{size:1,page:1})).total;
  }catch(e){return null;}
}
function rarLabel(r){return /_/.test(r)?String(r).toLowerCase().split('_').map(function(w){return w.charAt(0).toUpperCase()+w.slice(1);}).join(' '):r;}

/* ---------- dati dell'utente (salvati nel browser) ---------- */
function binders(){return get('binders',[]);}
function saveBinders(b){return set('binders',b);}
function newBinder(name){var b=binders(),x={id:uuid(),name:String(name).trim().slice(0,30)||'Binder',cards:[]};b.push(x);saveBinders(b);return x;}
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
function saveNotifs(n){var ok=set('notifs',n);if(S.cloud.onNotifs)S.cloud.onNotifs(n);badge();return ok;}
function notify(text,href){var n=notifs();n.unshift({id:uid(),text:text,href:href||'',t:Date.now(),read:false});saveNotifs(n.slice(0,100));}
function convs(){return get('convs',[]);}
function saveConvs(c){return set('convs',c);}
function say(who,from,text,unread){
  var c=convs(),x=c.find(function(y){return y.with===who;});
  if(!x){x={with:who,msgs:[],unread:0};c.unshift(x);}
  x.msgs.push({from:from,text:text,t:Date.now()});if(unread)x.unread++;saveConvs(c);
}
function unreadCount(){return notifs().filter(function(n){return!n.read;}).length+(S.cloud.on?(S.cloud.unread||0):convs().reduce(function(s,c){return s+c.unread;},0));}
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
function wipe(){DATA.concat(['user','session','cloud']).forEach(function(k){try{localStorage.removeItem(K[k]);}catch(e){}});}
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
  var m=el('div','meta');[c.setName,c.number?'#'+c.number:'',rarLabel(c.rarity)].filter(Boolean).forEach(function(x,k){m.appendChild(el('span',k?'tag':'tag info',x));});info.appendChild(m);
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
  if(S.cloud.on){ /* account veri: chi la offre e chi la cerca vengono dal database */
    var pb=el('div');info.appendChild(pb);
    if(!S.cloud.user){var la=el('a','',' Accedi o crea un account');la.href='profilo.html';var pn=el('p','note','Per vedere chi offre o cerca questa carta serve un account.');pn.append(la);pb.appendChild(pn);}
    else if(S.cloud.cardPeople)S.cloud.cardPeople(c.id).then(function(r){
      people(pb,'Chi la offre in scambio',(r.offers||[]).map(function(x){return x.username;}),c,'o');
      people(pb,'Chi la cerca',(r.wants||[]).map(function(x){return x.username;}),c,'w');
    }).catch(function(){});
  }else{
    var ow=owners(c.id),wh=wishers(c.id);
    people(info,'Chi la offre in scambio',ow,c,'o');people(info,'Chi la cerca',wh,c,'w');
    if(ow.length||wh.length)info.appendChild(el('p','note','Utenti di esempio finché gli account non sono attivi.'));
  }
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
  var selSet=String(u.get('set')||'').replace(/[^\w-]/g,''),q0=onIdx?(u.get('q')||'').trim():'';
  var f=el('form'),rows=[],groups=[],hl=-1,seq=0,allRow=null;
  /* espansione: campo di ricerca e, sotto, l'elenco di tutti i set raggruppati per serie */
  var fs=el('div','field'),lb=el('label','','Espansione'),qi=document.createElement('input');
  qi.id='f-setq';lb.htmlFor='f-setq';qi.type='search';qi.maxLength=40;qi.autocomplete='off';qi.placeholder='Cerca per nome o codice';
  qi.setAttribute('role','combobox');qi.setAttribute('aria-autocomplete','list');qi.setAttribute('aria-controls','f-setbox');qi.setAttribute('aria-expanded','true');
  var box=el('div','setbox');box.id='f-setbox';box.setAttribute('role','listbox');box.setAttribute('aria-label','Espansioni');
  box.appendChild(el('div','sg-note','Carico le espansioni…'));
  fs.append(lb,qi,box);f.appendChild(fs);
  /* rarità e tipo */
  var g2=el('div','form-grid');g2.style.marginTop='12px';
  function fld(label,id){var w=el('div','field'),l=el('label','',label);l.htmlFor=id;var sl=document.createElement('select');sl.id=id;var o=el('option','','Tutte');o.value='';sl.appendChild(o);w.append(l,sl);g2.appendChild(w);return sl;}
  var rs=fld('Rarità','f-rar'),us=fld('Tipo di carta','f-sup');f.appendChild(g2);
  var act=el('div','actions'),ok=el('button','btn','Mostra le carte');ok.type='submit';
  var cnt=el('span','sub');cnt.setAttribute('role','status');cnt.setAttribute('aria-live','polite');
  var rz=el('a','btn ghost','Azzera');rz.href='index.html';
  act.append(ok,rz,cnt);f.appendChild(act);d.appendChild(f);
  var x=el('button','btn small ghost','Chiudi');x.type='button';x.style.marginTop='14px';x.onclick=function(){d.close();};d.appendChild(x);
  f.onsubmit=function(e){
    e.preventDefault();var p=new URLSearchParams();
    if(q0)p.set('q',q0);
    if(selSet)p.set('set',selSet);if(rs.value)p.set('rar',rs.value);if(us.value)p.set('sup',us.value);
    if(!p.toString())p.set('all','1');
    location.href='index.html?'+p.toString();
  };
  function upd(){
    var my=++seq;
    count({name:q0,set:selSet,rarity:rs.value,supertype:us.value}).then(function(n){
      if(my!==seq)return;
      cnt.textContent=n===null?'':n+(n===1?' carta':' carte');
    });
  }
  rs.onchange=upd;us.onchange=upd;
  /* righe dell'elenco */
  function vis(){return rows.filter(function(r){return!r.hidden;});}
  function ensureVis(r){var t=r.offsetTop,h=r.offsetHeight;if(t<box.scrollTop+30)box.scrollTop=Math.max(0,t-30);else if(t+h>box.scrollTop+box.clientHeight)box.scrollTop=t+h-box.clientHeight;}
  function hi(i){var v=vis();if(!v.length)return;hl=(i+v.length)%v.length;v.forEach(function(r,k){r.classList.toggle('hl',k===hl);});qi.setAttribute('aria-activedescendant',v[hl].id);ensureVis(v[hl]);}
  function pick(v){
    selSet=v;var cur=null;
    rows.forEach(function(r){var on=r.dataset.v===v;r.setAttribute('aria-selected',String(on));if(on)cur=r;});
    upd();return cur;
  }
  function centerSel(){var c=rows.filter(function(r){return r.getAttribute('aria-selected')==='true';})[0];if(c)box.scrollTop=Math.max(0,c.offsetTop-box.clientHeight/2+c.offsetHeight/2);}
  function mkRow(s,nAll){
    var isAll=s===null,b=el('button','setrow'),sym=el('span','sym'),tx=el('span','stx'),ck=el('span','ic');
    b.type='button';b.setAttribute('role','option');b.dataset.v=isAll?'':s.id;b.id='so-'+(isAll?'all':s.id);b.setAttribute('aria-selected',String((isAll?'':s.id)===selSet));
    if(isAll){sym.innerHTML=IC.book;sym.classList.add('all');tx.append(el('b','','Tutte le espansioni'),el('small','',nAll+(nAll===1?' espansione':' espansioni')));b.k='tutte le espansioni';}
    else{
      var sy=safe(s.symbol);
      if(sy){var im=document.createElement('img');im.alt='';im.width=22;im.height=22;im.loading='lazy';im.decoding='async';im.onerror=function(){im.remove();};im.src=sy;sym.appendChild(im);}
      var yr=String(s.date||'').slice(0,4);
      tx.append(el('b','',s.name),el('small','',[s.code,yr,s.total?s.total+(s.total===1?' carta':' carte'):''].filter(Boolean).join(', ')));
      b.k=norm([s.name,s.series,s.code,s.id,yr].join(' '));
    }
    ck.innerHTML=IC.check;b.append(sym,tx,ck);
    b.onclick=function(){pick(b.dataset.v);qi.value='';filt();centerSel();};
    rows.push(b);return b;
  }
  function addGroup(label,list,before){
    var g=el('div'),h=el('div','setgh',label);g.setAttribute('role','group');g.setAttribute('aria-label',label);h.setAttribute('aria-hidden','true');g.appendChild(h);g.rows=[];
    list.forEach(function(s){var r=mkRow(s);g.rows.push(r);g.appendChild(r);});
    if(before)box.insertBefore(g,before);else box.appendChild(g);groups.push(g);return g;
  }
  var none=el('div','sg-note','Nessuna espansione trovata.');none.hidden=true;
  function filt(){
    var t=norm(qi.value).split(' ').filter(Boolean),any=false;
    rows.forEach(function(r){var okk=r===allRow?!t.length:(!t.length||t.every(function(w){return r.k.indexOf(w)>=0;}));r.hidden=!okk;if(okk&&r!==allRow)any=true;});
    groups.forEach(function(g){g.hidden=!g.rows.some(function(r){return!r.hidden;});});
    none.hidden=any||!t.length;hl=-1;qi.removeAttribute('aria-activedescendant');
    rows.forEach(function(r){r.classList.remove('hl');});
  }
  qi.addEventListener('input',function(){filt();box.scrollTop=0;});
  qi.addEventListener('keydown',function(e){
    if(e.key==='ArrowDown'){e.preventDefault();hi(hl+1);}
    else if(e.key==='ArrowUp'){e.preventDefault();hi(hl<0?-1:hl-1);}
    else if(e.key==='Enter'){
      var v=vis().filter(function(r){return r!==allRow;});
      if(hl>=0||(qi.value.trim()&&v.length)){e.preventDefault();var r=hl>=0?vis()[hl]:v[0];pick(r.dataset.v);qi.value='';filt();centerSel();}
    }
  });
  show(d);
  if(window.matchMedia&&window.matchMedia('(pointer: coarse)').matches){d.tabIndex=-1;d.focus({preventScroll:true});} /* sul telefono non apre subito la tastiera */
  try{
    var all=await Promise.all([sets(),list('rarities'),list('supertypes')]);
    var order=[],by={};
    all[0].forEach(function(s){var k=s.series||'';if(!by[k]){by[k]={name:k,si:s.si===undefined?order.length:s.si,list:[]};order.push(by[k]);}by[k].list.push(s);});
    order.sort(function(a,b){return a.si-b.si;});
    box.replaceChildren();
    allRow=mkRow(null,all[0].length);box.appendChild(allRow);
    order.forEach(function(g){addGroup(g.name==='Other'?'Altre espansioni':g.name,g.list);});
    box.appendChild(none);
    all[1].forEach(function(r){var o=el('option','',rarLabel(r));o.value=r;rs.appendChild(o);});all[2].forEach(function(r){var o=el('option','',r);o.value=r;us.appendChild(o);});
    rs.value=u.get('rar')||'';if(rs.selectedIndex<0)rs.value='';us.value=u.get('sup')||'';if(us.selectedIndex<0)us.value='';
    centerSel();upd();
    /* set più nuovi del catalogo (se la API li conosce già): in cima, senza far aspettare nessuno */
    newSets().then(function(ex){
      if(!ex.length||!d.open)return;
      addGroup('Nuove uscite',ex,box.children[1]);
      var cur=rows.filter(function(r){return r.dataset.v===selSet;})[0];if(cur){cur.setAttribute('aria-selected','true');}
    });
  }catch(err){
    box.replaceChildren();var n=el('div','sg-note',NODATA),rt=el('button','btn small ghost','Riprova');rt.type='button';rt.style.marginTop='10px';rt.onclick=openFilters;n.append(document.createElement('br'),rt);box.appendChild(n);
  }
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
    var tx=el('span','sg-tx');tx.append(el('b','',c.name),el('small','',[c.setName,c.number?'#'+c.number:'',rarLabel(c.rarity)].filter(Boolean).join(', ')));
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
  inp.addEventListener('focus',function(){prefetchCatalog();var t=inp.value.trim();if(t&&box.hidden){ensure(t);fresh(t);}});
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
function badge(){ /* numero di notifiche e messaggi da leggere sulla scheda Messaggi */
  var a=document.querySelector('.tabbar a[href="messaggi.html"]');if(!a)return;
  var n=unreadCount(),b=a.querySelector('.badge');
  if(!n){if(b)b.remove();return;}
  if(!b){b=el('b','badge');a.appendChild(b);}
  b.textContent=n>9?'9+':String(n);
}
function toast(text,bad){ /* avviso in alto che sparisce da solo */
  var d=el('div','toast'+(bad?' bad':''),text);d.setAttribute('role',bad?'alert':'status');
  d.onclick=function(){d.remove();};document.body.appendChild(d);setTimeout(function(){d.remove();},bad?12000:7000);return d;
}
function foot(){
  if(document.querySelector('footer'))return;
  var f=el('footer','sitefoot wait'),n=el('nav');n.setAttribute('aria-label','Informazioni');
  [['Termini','termini.html'],['Privacy','privacy.html'],['Come funziona la verifica','verifica.html'],['Guida alle condizioni','guida.html']].forEach(function(x){var a=el('a','',x[0]);a.href=x[1];n.appendChild(a);});
  f.append(el('p','','Swappr non è affiliato a The Pokémon Company, a Nintendo né a Cardmarket. Pokémon e i nomi delle carte sono marchi dei rispettivi proprietari.'),n);
  document.body.appendChild(f);
  /* resta invisibile finché la pagina ha finito di caricarsi (al massimo 2,5 secondi): così non "salta" verso il basso quando arriva il contenuto */
  var shown=false,tm,show=function(){if(shown)return;shown=true;clearTimeout(tm);f.classList.remove('wait');};
  tm=setTimeout(show,2500);
  if(document.readyState==='complete')show();
  else window.addEventListener('load',function(){requestAnimationFrame(show);});
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
    nav.appendChild(a);
  });
  b.insertBefore(top,mn||b.firstChild);b.insertBefore(nav,mn||b.firstChild);
  badge();foot();
}
S.get=get;S.set=set;S.el=el;S.uid=uid;S.IC=IC;S.DEMO=DEMO;S.NODATA=NODATA;S.CONDS=CONDS;S.FLOW=FLOW;S.HELP=HELP;S.when=when;S.safe=safe;S.lang=lang;S.V=V;
S.owners=owners;S.wishers=wishers;S.demoName=demoName;S.cards=cards;S.byIds=byIds;S.sets=sets;S.list=list;S.clearCache=clearCache;
S.latest=latest;S.cardFromId=cardFromId;S.enrich=enrich;S.count=count;S.newSets=newSets;S.prefetch=prefetchCatalog;S.rarLabel=rarLabel;S.norm=norm;S.catMeta=catMeta;S.catIndex=catIndex;
S.binders=binders;S.saveBinders=saveBinders;S.newBinder=newBinder;S.addToBinder=addToBinder;S.haveCards=haveCards;
S.wish=wish;S.inWish=inWish;S.toggleWish=toggleWish;S.follows=follows;S.toggleFollow=toggleFollow;S.me=me;
S.notifs=notifs;S.saveNotifs=saveNotifs;S.notify=notify;S.convs=convs;S.saveConvs=saveConvs;S.say=say;
S.trades=trades;S.propose=propose;S.setStatus=setStatus;S.matches=matches;S.partials=partials;S.mostWanted=mostWanted;
S.themePref=themePref;S.setTheme=setTheme;S.themeButton=themeButton;S.exportAll=exportAll;S.importAll=importAll;S.wipe=wipe;S.setLang=setLang;S.langButton=langButton;
S.tile=tile;S.feed=feed;S.skel=skel;S.openCard=openCard;S.picker=picker;S.openFilters=openFilters;S.unreadCount=unreadCount;
S.uuid=uuid;S.badge=badge;S.toast=toast;S.modal=modal;S.dlg=dlg;S.show=show;S.avatar=avatar;S.back=back;S.cover=cover;S.rail=rail;S.confirm=confirmBox;S.ask=askBox;S.binderArt=binderArt;S.failBox=failBox;S.AVC=AVC;S.AVN=AVN;
S._t={mapCard:mapCard,snapSize:function(){return Object.keys(snap).length;},saveSnap:saveSnap};
window.Swappr=S;
if(!document.querySelector('link[rel~="icon"]')){['icon','apple-touch-icon'].forEach(function(r){var l=document.createElement('link');l.rel=r;l.href='logo.png';document.head.appendChild(l);});}
if(!document.querySelector('meta[name="theme-color"]')){var tm=document.createElement('meta');tm.name='theme-color';tm.content='#ffffff';document.head.appendChild(tm);}
/* con l'account attivo, le pagine aspettano S.start(...) / S.ready (il collegamento si avvia in fondo a questo file) prima di mostrare i dati dell'utente */
S.ready=Promise.resolve();
S.start=function(fn){
  if(!S.cloud.on)return fn();
  S.ready.then(function(){
    if(S.cloud.loaded)return fn();
    var m=document.querySelector('main');if(m){m.replaceChildren(failBox());}
  });
};
themeApply();
if(window.matchMedia)try{window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){if(themePref()==='auto')themeApply();});}catch(e){}
shell();
if(lang==='en'){var sc=document.createElement('script');sc.src='swappr-i18n.js?v='+V;document.body.appendChild(sc);}
})();

/* ===================================================================================
   COLLEGAMENTO A SUPABASE
   Il browser non legge mai le tabelle: parla solo con le funzioni del database (vedi supabase/schema.sql).
   =================================================================================== */
(function(){
'use strict';
var S,C,URL_,KEY;
var A={token:'',refresh:'',exp:0,uid:''}; /* sessione */
var SESS='swappr-session-v1';
var UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var CARD=/^[a-z0-9]{1,20}-[A-Za-z0-9_!?]{1,15}$/;
var COND=['M','NM','EX','GD','LP','PL','PO'];
function noop(){}
function wait(ms){return new Promise(function(r){setTimeout(r,ms);});}

/* ---------- messaggi di errore (in italiano, pensati per chi usa il sito) ---------- */
var ERR={
 network:'Non riesco a contattare il server. Controlla la connessione e riprova.',
 timeout:'Il server non risponde. Riprova tra poco.',
 server:'Il server ha avuto un problema. Riprova tra poco.',
 schema:'Il database non è pronto: esegui lo schema SQL su Supabase (vedi LEGGIMI.txt).',
 permission:'Permessi del database non corretti: esegui di nuovo lo schema SQL su Supabase.',
 jwt:'Sessione scaduta: accedi di nuovo.',
 generic:'Qualcosa è andato storto. Riprova.',
 not_authenticated:'Accedi per continuare.',
 profile_missing:'Profilo non trovato: esci e accedi di nuovo.',
 suspended:'Il tuo account è sospeso. Scrivi a Swappr per chiarire.',
 invalid_input:'Dati non validi: controlla i campi e riprova.',
 not_allowed:'Operazione non consentita.',
 invalid_state:'Questa azione non è più disponibile: aggiorna la pagina.',
 user_not_found:'Utente non trovato.',
 too_many_items:'Hai raggiunto il limite massimo consentito.',
 rate_limited:'Troppe richieste in poco tempo: riprova tra un po’.',
 blocked:'Non puoi farlo: uno dei due utenti ha bloccato l’altro.',
 username_taken:'Questo nome utente è già in uso.',
 username_invalid:'Nome utente non valido: da 3 a 20 caratteri tra lettere, numeri e _.',
 trade_in_progress:'Hai uno scambio in corso: concludilo prima.',
 no_address:'Per scambiare serve il tuo indirizzo di spedizione: aggiungilo nel profilo.',
 too_many_trades:'Hai troppi scambi aperti: concludine qualcuno prima di proporne altri.',
 invalid_address:'Indirizzo non valido: controlla nome, via, CAP e città.',
 card_not_in_binder:'Una delle carte non è più nel binder: aggiorna la pagina e riprova.',
 already_sent:'Hai già segnato la spedizione.',
 invalid_credentials:'Email o password non corrette.',
 email_not_confirmed:'Devi prima confermare l’email: controlla la posta (anche lo spam).',
 user_already_exists:'Esiste già un account con questa email: prova ad accedere.',
 weak_password:'Password troppo debole: usa almeno 8 caratteri.',
 same_password:'La nuova password deve essere diversa da quella attuale.',
 over_request_rate_limit:'Troppe richieste: riprova tra qualche minuto.',
 over_email_send_rate_limit:'Sono state inviate troppe email: riprova tra qualche minuto.',
 user_banned:'Questo account non può accedere.',
 validation_failed:'Controlla i dati inseriti: email o password non validi.',
 email_address_invalid:'Indirizzo email non valido.',
 signup_disabled:'Le registrazioni sono chiuse al momento.',
 otp_expired:'Il link non è valido o è scaduto: richiedine uno nuovo.'
};
var TXT=[[/invalid login credentials/i,'invalid_credentials'],[/email not confirmed/i,'email_not_confirmed'],[/already registered/i,'user_already_exists'],
 [/password should be|weak password/i,'weak_password'],[/rate limit/i,'over_request_rate_limit'],[/different from the old|same.*password/i,'same_password'],
 [/unable to validate email|invalid email/i,'validation_failed'],[/signups? (not allowed|disabled)/i,'signup_disabled']];
function err(code){var e=new Error(ERR[code]||ERR.generic);e.code=code;e.status=0;return e;}
function mkErr(st,b,ne){
  var code,m='',i;
  if(ne){code=ne.name==='AbortError'?'timeout':'network';}
  else{
    b=b&&typeof b==='object'?b:{};
    m=String(b.message||b.msg||b.error_description||'');
    if(b.error_code&&ERR[b.error_code])code=b.error_code;
    else if(/^[a-z_]+$/.test(m)&&ERR[m])code=m;
    else if(b.code==='PGRST202'||b.code==='42883'||b.code==='42P01'||b.code==='PGRST205')code='schema';
    else if(b.code==='42501')code='permission';
    else if(b.code==='PGRST301'||b.code==='PGRST303'||b.error_code==='bad_jwt'||b.error_code==='no_authorization')code='jwt';
    else{for(i=0;i<TXT.length;i++)if(TXT[i][0].test(m)){code=TXT[i][1];break;}}
    if(!code){code=st===401?'jwt':st===429?'over_request_rate_limit':st>=500?'server':'generic';}
  }
  var e=new Error(ERR[code]||ERR.generic);e.code=code;e.status=st||0;e.raw=m;return e;
}
function transient(e){return e&&(e.code==='network'||e.code==='timeout'||e.code==='server'||e.code==='jwt');}

/* ---------- richieste ---------- */
function http(path,o){
  o=o||{};
  var ctl=typeof AbortController==='function'?new AbortController():null,t=ctl?setTimeout(function(){ctl.abort();},o.timeout||15000):0;
  var h={apikey:KEY};
  if(o.body!==undefined)h['Content-Type']='application/json';
  if(o.token)h.Authorization='Bearer '+o.token;
  return fetch(URL_+path,{method:o.method||'GET',headers:h,body:o.body!==undefined?JSON.stringify(o.body):undefined,signal:ctl?ctl.signal:undefined,cache:'no-store'}).then(function(r){
    clearTimeout(t);
    return r.text().then(function(tx){
      var j=null;try{j=tx?JSON.parse(tx):null;}catch(e){}
      if(r.ok)return j;
      throw mkErr(r.status,j);
    });
  },function(e){clearTimeout(t);throw mkErr(0,null,e);});
}
function lock(fn){try{if(navigator.locks&&navigator.locks.request)return navigator.locks.request('swappr-auth',fn);}catch(e){}return fn();}
var refreshing=null;
function fresh(){ /* access token valido per almeno un minuto (lo rinnova se serve) */
  if(!A.token)return Promise.resolve('');
  if(A.exp-Date.now()>60000)return Promise.resolve(A.token);
  if(refreshing)return refreshing;
  refreshing=lock(function(){
    var s=S.get('session',null); /* un'altra scheda può aver già rinnovato la sessione */
    if(s&&s.access_token&&s.access_token!==A.token&&(s.expires_at||0)*1000-Date.now()>60000){loadSession();return A.token;}
    var rt=(s&&s.refresh_token)||A.refresh;
    return http('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:rt}}).then(function(j){setSession(j);return A.token;});
  }).catch(function(e){
    if(transient(e)&&e.code!=='jwt')throw e;
    var s=S.get('session',null);
    if(s&&s.access_token&&s.refresh_token&&s.refresh_token!==A.refresh){loadSession();return A.token;}
    expired();throw err('jwt');
  }).then(function(v){refreshing=null;return v;},function(e){refreshing=null;throw e;});
  return refreshing;
}
function rpc(name,args,o){
  o=o||{};
  return fresh().then(function(tok){
    if(!tok&&!o.anon)throw err('not_authenticated');
    return http('/rest/v1/rpc/'+name,{method:'POST',body:args||{},token:tok,timeout:o.timeout}).catch(function(e){
      if(e.code==='jwt'&&tok&&!o.retried){A.exp=0;return rpc(name,args,Object.assign({},o,{retried:true}));}
      throw e;
    });
  });
}
function call(name,args,o){return A.token?rpc(name,args,o):Promise.reject(err('not_authenticated'));}

/* ---------- sessione ---------- */
function jwtPayload(t){try{return JSON.parse(decodeURIComponent(escape(atob(String(t).split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))));}catch(e){return{};}}
function setSession(j){
  var p=jwtPayload(j.access_token);
  A.token=j.access_token;A.refresh=j.refresh_token||A.refresh;
  A.exp=j.expires_at?j.expires_at*1000:(p.exp?p.exp*1000:Date.now()+(j.expires_in||3600)*1000);
  A.uid=p.sub||(j.user&&j.user.id)||A.uid||'';
  S.set('session',{access_token:A.token,refresh_token:A.refresh,expires_at:Math.floor(A.exp/1000),user_id:A.uid});
}
function loadSession(){
  var s=S.get('session',null);
  if(s&&s.access_token&&s.refresh_token){A.token=s.access_token;A.refresh=s.refresh_token;A.exp=(s.expires_at||0)*1000;A.uid=s.user_id||jwtPayload(s.access_token).sub||'';}
  else{A.token=A.refresh='';A.exp=0;A.uid='';}
}
function expired(){ /* sessione non più valida: si resta nel sito, ma da visitatori (i dati locali non si perdono) */
  var had=!!A.token;
  A.token=A.refresh='';A.exp=0;
  try{localStorage.removeItem(SESS);}catch(e){}
  C.user=null;C.isStaff=false;S.set('user',null);
  if(had&&S.toast)S.toast('Sessione scaduta: accedi di nuovo.',true);
}

/* ---------- dati dell'utente: copia nel browser (mirror) e istantanea di ciò che il database ha già ---------- */
function clean(s,n){return String(s==null?'':s).replace(/[\u0000-\u001f\u007f]+/g,' ').trim().slice(0,n);}
function hash(s){var a=0x811c9dc5,b=0x9e3779b9,i,c;for(i=0;i<s.length;i++){c=s.charCodeAt(i);a=Math.imul(a^c,0x01000193)>>>0;b=Math.imul(b+c+i,0x85ebca6b)>>>0;b^=b>>>13;}return a.toString(36)+b.toString(36)+s.length.toString(36);}
function normBinder(b){
  var m={};
  (b.cards||[]).forEach(function(e){
    var c=e&&e.c;if(!c||!CARD.test(String(c.id||'')))return;
    var cond=COND.indexOf(e.cond)>=0?e.cond:'NM',key=c.id+'|'+cond,q=Math.max(1,Math.min(99,parseInt(e.qty,10)||1));
    if(m[key])m[key].qty=Math.min(99,m[key].qty+q);else m[key]={card_id:c.id,card_name:clean(c.name,80),qty:q,cond:cond};
  });
  return{id:b.id,name:clean(b.name,30)||'Binder',cards:Object.keys(m).sort().map(function(k){return m[k];})};
}
function toCard(id,name){
  var c=S.cardFromId?S.cardFromId(id,name):null;
  if(c)return c;
  var k=id.indexOf('-');
  return{id:id,name:name||id.slice(k+1),number:id.slice(k+1),rarity:'',supertype:'',setId:id.slice(0,k),setName:'',img:'',imgBig:'',cm:''};
}
function localState(){
  var L={b:{},w:{},f:{}};
  S.binders().forEach(function(x){if(x&&UUID.test(x.id)){var p=normBinder(x);L.b[x.id]={p:p,h:hash(JSON.stringify(p))};}});
  S.wish().forEach(function(c){if(c&&CARD.test(String(c.id||'')))L.w[c.id]=clean(c.name,80);});
  S.follows().forEach(function(u){if(u)L.f[u]=1;});
  return L;
}
function emptySnap(){return{uid:A.uid,b:{},w:{},f:{},bad:{}};}
function same(L,sn){ /* le copie locali coincidono con l'istantanea (ignorando ciò che il database ha rifiutato) */
  var k;
  for(k in L.b)if(sn.b[k]!==L.b[k].h&&sn.bad['b:'+k]!==L.b[k].h)return false;
  for(k in sn.b)if(!L.b[k])return false;
  if(sn.bad.w&&sn.bad.w===hash(Object.keys(L.w).sort().join(',')))return true;
  for(k in L.w)if(sn.w[k]===undefined)return false;
  for(k in sn.w)if(L.w[k]===undefined)return false;
  for(k in L.f)if(sn.f[k]===undefined&&!sn.bad['f:'+k])return false;
  for(k in sn.f)if(L.f[k]===undefined)return false;
  return true;
}
function saveCache(){
  try{localStorage.setItem('swappr-cloud-v1',JSON.stringify({uid:A.uid,pulledAt:C.pulledAt||0,data:C.data,snap:C.snap,unread:C.unread||0}));}catch(e){}
}
function applyDerived(){
  var d=C.data;if(!d)return;
  var p=d.profile;
  C.user=p?{id:p.id,username:p.username,email:d.email||'',city:p.city||'',bio:p.bio||'',color:p.avatar_color||'',visible:p.visible!==false,status:p.status||'active',termsAt:p.terms_at||null,created:p.created_at||''}:null;
  C.address=d.address||null;C.trades=d.trades||[];C.isStaff=!!d.staff;C.followers=d.followers||0;C.blocks=d.blocks||[];C.unread=d.unread_messages||0;
  C.following=d.follows||[];
}
function href(h){h=String(h||'');return /^[a-z0-9-]+\.html(\?[\w=&%.-]*)?$/i.test(h)?h:'';}

/* ---------- scarico dei dati dal database ---------- */
var pulling=null;
function pull(){
  if(!A.token)return Promise.resolve(false);
  if(pulling)return pulling;
  pulling=doPull().then(function(v){pulling=null;return v;},function(e){pulling=null;throw e;});
  return pulling;
}
async function doPull(){
  var d=await rpc('get_my_data');
  if(!d||!d.profile)throw err('profile_missing');
  try{await S.catMeta();}catch(e){}
  if(!C.snap||C.snap.uid!==A.uid)C.snap=emptySnap();
  var sn=C.snap,L=localState(),local=same(L,sn); /* se ci sono modifiche locali non ancora salvate, non le sovrascrivo */
  C.muted=true;
  try{
    if(local){
      var bs=(d.binders||[]).map(function(b){return{id:b.id,name:b.name,cards:(b.cards||[]).map(function(x){return{c:toCard(x.card_id,x.card_name),qty:x.qty,cond:x.cond};})};});
      S.set('binders',bs);
      S.set('wish',(d.wishlist||[]).map(function(x){return toCard(x.card_id,x.card_name);}));
      S.set('follows',d.follows||[]);
      sn.b={};bs.forEach(function(b){sn.b[b.id]=hash(JSON.stringify(normBinder(b)));});
      sn.w={};(d.wishlist||[]).forEach(function(x){sn.w[x.card_id]=1;});
      sn.f={};(d.follows||[]).forEach(function(u){sn.f[u]=1;});
      sn.bad={};
    }
    C.unreadIds={};
    S.set('notifs',(d.notifications||[]).map(function(n){if(!n.read)C.unreadIds[n.id]=1;return{id:n.id,text:n.text,href:href(n.href),t:Date.parse(n.created_at)||Date.now(),read:!!n.read};}));
    var p=d.profile;
    S.set('user',{username:p.username,city:p.city||'',bio:p.bio||'',avatar:{c:p.avatar_color||''},email:d.email||'',remote:true,created:Date.parse(p.created_at)||Date.now()});
  }finally{C.muted=false;}
  C.data=d;C.pulledAt=Date.now();applyDerived();
  C.counters={notif_max:(d.notifications&&d.notifications[0]&&d.notifications[0].id)||0,messages:d.unread_messages||0,trades_updated:maxUpdated(d.trades)};
  saveCache();setSync(same(localState(),sn)?'ok':'pending');
  if(S.badge)S.badge();
  if(local)hydrate();
  emit();
  return true;
}
function maxUpdated(ts){var m='1970-01-01T00:00:00+00:00';(ts||[]).forEach(function(t){if(t.updated_at>m)m=t.updated_at;});return m;}
function emit(){try{document.dispatchEvent(new CustomEvent('swappr:sync'));}catch(e){}}
function hydrate(){ /* completa le immagini delle carte di espansioni che il catalogo non conosce ancora (in silenzio) */
  var ids={},n=0;
  S.binders().forEach(function(b){b.cards.forEach(function(e){if(!e.c.img&&!ids[e.c.id]){ids[e.c.id]=1;n++;}});});
  S.wish().forEach(function(c){if(!c.img&&!ids[c.id]){ids[c.id]=1;n++;}});
  if(!n||n>150)return;
  S.byIds(Object.keys(ids)).then(function(m){
    C.muted=true;
    try{
      var bs=S.binders();bs.forEach(function(b){b.cards.forEach(function(e){if(m[e.c.id]&&!e.c.img)e.c=m[e.c.id];});});S.set('binders',bs);
      S.set('wish',S.wish().map(function(c){return c.img?c:(m[c.id]||c);}));
    }finally{C.muted=false;}
  }).catch(noop);
}

/* ---------- invio delle modifiche (binder, wishlist, seguiti) ---------- */
var flushP=null,flushAgain=false,dirtyT=0,retryT=0,retryN=0;
function setSync(state,msg){C.sync={state:state,msg:msg||''};}
function dirty(){
  if(!A.token||C.muted)return;
  clearTimeout(dirtyT);dirtyT=setTimeout(function(){flush().catch(noop);},800);
  if(C.sync&&C.sync.state==='ok')setSync('pending');
}
function fixBinderIds(){ /* binder creati con versioni vecchie del sito: servono id UUID */
  var bs=S.binders(),ch=false;
  bs.forEach(function(b){if(!UUID.test(String(b.id))){b.id=S.uuid();ch=true;}});
  if(ch){C.muted=true;try{S.set('binders',bs);}finally{C.muted=false;}}
}
function flush(){
  if(!A.token)return Promise.resolve(false);
  if(flushP){flushAgain=true;return flushP;}
  flushP=doFlush().then(function(v){flushP=null;if(flushAgain){flushAgain=false;return flush();}return v;},function(e){flushP=null;flushAgain=false;scheduleRetry(e);throw e;});
  return flushP;
}
function scheduleRetry(e){
  if(!transient(e)||e.code==='jwt'){setSync('error',e&&e.message);return;}
  setSync('offline',e.message);
  clearTimeout(retryT);retryN=Math.min(retryN+1,5);
  retryT=setTimeout(function(){flush().catch(noop);},Math.min(120000,8000*Math.pow(2,retryN-1)));
}
function fatal(e){ /* errori che non passano con un nuovo tentativo */
  if(e.code==='not_authenticated'||e.code==='profile_missing'){expired();}
  if(e.code==='suspended'){setSync('error',e.message);}
}
async function doFlush(){
  if(!C.snap||C.snap.uid!==A.uid)C.snap=emptySnap();
  fixBinderIds();
  var sn=C.snap,L=localState(),k,msg='',touched=false;
  function bad(e){if(!msg)msg=e.message;fatal(e);}
  try{
    for(k in L.b){
      if(sn.b[k]===L.b[k].h||sn.bad['b:'+k]===L.b[k].h)continue;
      try{await rpc('save_binder',{p_binder:L.b[k].p});sn.b[k]=L.b[k].h;delete sn.bad['b:'+k];touched=true;}
      catch(e){if(transient(e))throw e;sn.bad['b:'+k]=L.b[k].h;bad(e);touched=true;}
    }
    for(k in sn.b){
      if(L.b[k])continue;
      try{await rpc('delete_binder',{p_id:k});delete sn.b[k];touched=true;}
      catch(e){if(transient(e))throw e;delete sn.b[k];bad(e);touched=true;}
    }
    for(k in sn.bad)if(k.indexOf('b:')===0&&!L.b[k.slice(2)])delete sn.bad[k];
    /* wishlist */
    var ids=Object.keys(L.w).sort(),wh=hash(ids.join(','));
    var add=ids.filter(function(i){return sn.w[i]===undefined;}),rem=Object.keys(sn.w).filter(function(i){return L.w[i]===undefined;});
    if((add.length||rem.length)&&sn.bad.w!==wh){
      try{
        while(rem.length){var r=rem.splice(0,1000);await rpc('wish_apply',{p_add:[],p_remove:r});r.forEach(function(i){delete sn.w[i];});touched=true;}
        while(add.length){var a=add.splice(0,300);await rpc('wish_apply',{p_add:a.map(function(i){return{card_id:i,card_name:L.w[i]};}),p_remove:[]});a.forEach(function(i){sn.w[i]=1;});touched=true;}
        delete sn.bad.w;
      }catch(e){if(transient(e))throw e;sn.bad.w=wh;bad(e);touched=true;}
    }else if(!add.length&&!rem.length)delete sn.bad.w;
    /* profili che segui */
    for(k in L.f){
      if(sn.f[k]!==undefined||sn.bad['f:'+k])continue;
      try{await rpc('follow_user',{p_username:k,p_on:true});sn.f[k]=1;touched=true;}
      catch(e){if(transient(e))throw e;sn.bad['f:'+k]=1;bad(e);touched=true;}
    }
    for(k in sn.f){
      if(L.f[k]!==undefined)continue;
      try{await rpc('follow_user',{p_username:k,p_on:false});delete sn.f[k];touched=true;}
      catch(e){if(transient(e))throw e;delete sn.f[k];bad(e);touched=true;}
    }
    for(k in sn.bad)if(k.indexOf('f:')===0&&L.f[k.slice(2)]===undefined)delete sn.bad[k];
  }finally{if(touched)saveCache();}
  retryN=0;
  if(msg){setSync('error',msg);return false;}
  setSync('ok');return true;
}

/* ---------- accesso, registrazione, uscita ---------- */
function redirectUrl(){return new URL('profilo.html',location.href).href;}
function hasLocal(){return S.binders().length>0||S.wish().length>0||S.follows().length>0;}
function clearMirrors(){
  C.muted=true;
  try{['binders','wish','follows','notifs','convs','trades'].forEach(function(k){S.set(k,[]);});}finally{C.muted=false;}
}
function forget(){ /* toglie dal browser ogni dato dell'account */
  clearTimeout(dirtyT);clearTimeout(retryT);
  A.token=A.refresh='';A.exp=0;A.uid='';
  try{localStorage.removeItem(SESS);localStorage.removeItem('swappr-cloud-v1');localStorage.removeItem('swappr-user-v1');}catch(e){}
  clearMirrors();
  C.user=null;C.data=null;C.snap=emptySnap();C.address=null;C.trades=[];C.isStaff=false;C.unread=0;C.pulledAt=0;
}
async function afterLogin(){
  var cache=S.get('cloud',null);
  if(!cache||cache.uid!==A.uid){
    C.snap=emptySnap();C.data=null;
    if(hasLocal()){
      var keep=await S.confirm('Importare i dati di questo dispositivo?','Su questo dispositivo ci sono binder, wishlist o profili seguiti. Vuoi aggiungerli al tuo account?','Importa',false,'Non importare');
      if(!keep)clearMirrors();
    }
  }else{C.snap=cache.snap||emptySnap();C.data=cache.data||null;}
  startPoll();
  try{await flush();}catch(e){if(S.toast&&!transient(e))S.toast(e.message,true);}
  try{await pull();}catch(e){if(!transient(e))throw e;}
  return true;
}
function signUp(o){
  var email=String(o.email||'').trim(),pw=String(o.password||''),name=String(o.username||'').trim();
  if(!/^[A-Za-z0-9_]{3,20}$/.test(name))return Promise.reject(err('username_invalid'));
  if(pw.length<8)return Promise.reject(err('weak_password'));
  if(!o.terms)return Promise.reject(err('invalid_input'));
  return rpc('username_available',{p_username:name},{anon:true}).then(function(ok){
    if(ok===false)throw err('username_taken');
    var data={username:name,terms:true};
    if(o.city)data.city=clean(o.city,40);
    if(o.bio)data.bio=clean(o.bio,140);
    if(/^#[0-9a-f]{6}$/i.test(o.color||''))data.avatar_color=o.color;
    return http('/auth/v1/signup?redirect_to='+encodeURIComponent(redirectUrl()),{method:'POST',body:{email:email,password:pw,data:data}});
  }).then(function(j){
    if(j&&j.access_token){setSession(j);return afterLogin().then(function(){return{needsConfirm:false};});}
    return{needsConfirm:true};
  });
}
function signIn(email,password){
  return http('/auth/v1/token?grant_type=password',{method:'POST',body:{email:String(email||'').trim(),password:String(password||'')}}).then(function(j){
    setSession(j);return afterLogin();
  });
}
async function signOut(){
  try{await Promise.race([flush(),wait(3000)]);}catch(e){}
  var tok=A.token;
  if(tok)http('/auth/v1/logout',{method:'POST',token:tok,timeout:5000}).catch(noop);
  forget();
}
function recover(email){return http('/auth/v1/recover?redirect_to='+encodeURIComponent(redirectUrl()),{method:'POST',body:{email:String(email||'').trim()}}).then(function(){return true;});}
function resend(email){return http('/auth/v1/resend?redirect_to='+encodeURIComponent(redirectUrl()),{method:'POST',body:{type:'signup',email:String(email||'').trim()}}).then(function(){return true;});}
function setPassword(pw){
  if(String(pw).length<8)return Promise.reject(err('weak_password'));
  return fresh().then(function(tok){
    if(!tok)throw err('not_authenticated');
    return http('/auth/v1/user',{method:'PUT',token:tok,body:{password:String(pw)}});
  }).then(function(){try{sessionStorage.removeItem('swappr-recovery');}catch(e){}C.recovery=false;return true;});
}
function handleHash(){ /* link ricevuti per email: conferma dell'account o recupero della password */
  var h=location.hash;if(!h||h.length<2)return;
  var p=new URLSearchParams(h.slice(1)),clear=function(){try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}};
  if(p.get('error')||p.get('error_code')){
    clear();
    var code=p.get('error_code');
    setTimeout(function(){if(S.toast)S.toast(ERR[code]||'Il link non è valido o è scaduto: richiedine uno nuovo.',true);},0);
    return;
  }
  if(p.get('access_token')&&p.get('refresh_token')){
    var type=p.get('type')||'';
    setSession({access_token:p.get('access_token'),refresh_token:p.get('refresh_token'),expires_at:+p.get('expires_at')||0,expires_in:+p.get('expires_in')||3600});
    clear();
    if(type==='recovery'){
      try{sessionStorage.setItem('swappr-recovery','1');}catch(e){}
      if(!/profilo\.html$/.test(location.pathname)){location.replace('profilo.html?reset=1');return;}
    }else setTimeout(function(){if(S.toast)S.toast('Email confermata: il tuo account è attivo.');},0);
  }
  try{C.recovery=sessionStorage.getItem('swappr-recovery')==='1';}catch(e){}
}

/* ---------- aggiornamento periodico ---------- */
var pollT=0,lastTick=0;
function tick(){
  if(!A.token||document.visibilityState!=='visible')return;
  lastTick=Date.now();
  flush().catch(noop).then(function(){return rpc('get_counters');}).then(function(c){
    var o=C.counters||{};
    if(c.notif_max!==o.notif_max||c.messages!==o.messages||c.trades_updated!==o.trades_updated)return pull();
  }).catch(noop);
}
function startPoll(){
  if(pollT)return;
  pollT=setInterval(tick,30000);
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&Date.now()-lastTick>20000)tick();});
  window.addEventListener('online',tick);
}
function recount(){ /* dopo aver letto una conversazione: aggiorna il numero sulla scheda Messaggi */
  return rpc('get_counters').then(function(c){
    C.unread=c.messages||0;if(C.counters)C.counters.messages=C.unread;if(C.data)C.data.unread_messages=C.unread;saveCache();if(S.badge)S.badge();
  }).catch(noop);
}

/* ---------- carte: dall'elenco {card_id, card_name} del database alle carte con immagine ---------- */
function cardsFor(items){
  items=items||[];
  return S.byIds(items.map(function(x){return x.card_id;})).catch(function(){return{};}).then(function(m){
    return items.map(function(x){return m[x.card_id]||toCard(x.card_id,x.card_name);});
  });
}
function wanted(c,qty,cond){return{card_id:c.id,card_name:clean(c.name,80),qty:qty||1,cond:cond||'NM'};}

/* ---------- stati degli scambi ---------- */
var ST={proposed:'Proposta',accepted:'Accettato',sent:'Inviato a Swappr',verifying:'In verifica',shipped:'Spedito',completed:'Completato',cancelled:'Annullato',declined:'Rifiutato'};
function statusLabel(s){return ST[s]||s;}
function afterChange(v){return pull().then(function(){return v;},function(){return v;});}

/* ---------- finestre usate da più pagine: segnalazione e proposta di scambio ---------- */
function reportDialog(name,tradeId){
  var el=S.el;
  return S.modal(function(d,fin){
    d.appendChild(el('h2','','Segnala '+name));
    d.appendChild(el('p','','Le segnalazioni le legge solo lo staff di Swappr. Non avvisiamo l’altra persona.'));
    var f=el('form'),w=el('div','field'),l=el('label','','Motivo'),sl=document.createElement('select');l.htmlFor='rp-r';sl.id='rp-r';
    [['spam','Spam o pubblicità'],['fraud','Truffa o comportamento sospetto'],['abuse','Linguaggio offensivo o molestie'],['other','Altro']].forEach(function(x){var o=el('option','',x[1]);o.value=x[0];sl.appendChild(o);});
    w.append(l,sl);w.style.marginTop='12px';
    var fd=el('div','field'),ld=el('label','','Cosa è successo? (facoltativo)'),ta=document.createElement('textarea');ld.htmlFor='rp-d';ta.id='rp-d';ta.maxLength=500;fd.append(ld,ta);fd.style.marginTop='12px';
    var m=el('p','msg'),act=el('div','actions'),no=el('button','btn small ghost','Annulla'),go=el('button','btn small','Invia segnalazione');
    m.setAttribute('role','status');no.type='button';go.type='submit';no.onclick=function(){fin(null);};act.append(no,go);
    f.append(w,fd,act,m);
    f.onsubmit=function(e){
      e.preventDefault();go.disabled=true;m.textContent='';
      API.report(name,sl.value,ta.value,tradeId).then(function(){fin(true);S.toast('Segnalazione inviata. Grazie.');},function(er){m.textContent=er.message;go.disabled=false;});
    };
    d.appendChild(f);
  });
}
function stackCards(list){ /* una riga per carta: quantità totale e condizione migliore */
  var m={},order=[];
  (list||[]).forEach(function(x){
    var e=m[x.card_id];
    if(!e){e=m[x.card_id]={card_id:x.card_id,card_name:x.card_name,qty:0,cond:COND.indexOf(x.cond)>=0?x.cond:'NM'};order.push(x.card_id);}
    e.qty+=x.qty||1;
    if(COND.indexOf(x.cond)>=0&&COND.indexOf(x.cond)<COND.indexOf(e.cond))e.cond=x.cond;
  });
  return order.map(function(k){return m[k];});
}
function composeTrade(name,pre){
  var el=S.el,d=S.dlg('tradeDlg'),MAX=10;
  pre=pre||{};
  d.replaceChildren();d.setAttribute('aria-label','Proponi uno scambio');
  d.appendChild(el('h2','','Scambio con '+name));
  var body=el('div');d.appendChild(body);
  var close=el('button','btn small ghost','Chiudi');close.type='button';close.style.marginTop='14px';close.onclick=function(){d.close();};
  body.appendChild(el('p','sub','Carico le carte…'));d.appendChild(close);S.show(d);
  return flush().catch(noop).then(function(){return API.profile(name);}).then(function(p){
    body.replaceChildren();
    if(p.hidden){body.appendChild(el('p','sub','Non puoi proporre uno scambio a questo utente.'));return;}
    if(!C.address){
      var n=el('div','notice','Per proporre uno scambio serve il tuo indirizzo di spedizione. '),a=el('a','','Aggiungilo nel profilo');a.href='profilo.html#indirizzo';n.appendChild(a);body.appendChild(n);return;
    }
    var theirs=stackCards([].concat.apply([],p.binders.map(function(b){return b.cards;})));
    var mine=stackCards([].concat.apply([],S.binders().map(function(b){return b.cards.map(function(e){return{card_id:e.c.id,card_name:e.c.name,qty:e.qty,cond:e.cond};});})));
    var myWish={},theirWish={};S.wish().forEach(function(c){myWish[c.id]=1;});(p.wishlist||[]).forEach(function(c){theirWish[c.card_id]=1;});
    var sides=[];
    function side(title,items,hot,hotLabel,preset){
      var sec=el('section');sec.style.marginTop='16px';
      var hd=el('h3','',title),cnt=el('p','sub','');sec.append(hd,cnt);
      var st={items:items,sel:{},qty:{},rows:[]};
      items.sort(function(a,b){return(hot[b.card_id]?1:0)-(hot[a.card_id]?1:0);});
      if(!items.length){sec.appendChild(el('p','sub',title.indexOf('dai')>=0?'Non hai carte nei binder: aggiungile prima di proporre uno scambio.':name+' non ha carte nei binder.'));st.empty=true;sides.push(st);return sec;}
      var q=document.createElement('input');q.type='search';q.placeholder='Filtra per nome';q.maxLength=40;q.setAttribute('aria-label','Filtra per nome');q.style.margin='8px 0';sec.appendChild(q);
      var box=el('div','pickbox');sec.appendChild(box);
      function count(){var n=Object.keys(st.sel).length;cnt.textContent='Scelte: '+n+' su '+MAX+' al massimo';st.rows.forEach(function(r){if(!r.cb.checked)r.cb.disabled=n>=MAX;});up();}
      items.forEach(function(it){
        var row=el('label','pick'),cb=document.createElement('input');cb.type='checkbox';
        var c=toCard(it.card_id,it.card_name),th=el('span','th');
        if(S.safe(c.img)){var im=document.createElement('img');im.alt='';im.width=36;im.height=50;im.loading='lazy';im.decoding='async';im.src=c.img;th.appendChild(im);}
        var tx=el('span','tx'),nm=el('b','',it.card_name||it.card_id),sb=el('small','',it.qty+(it.qty===1?' copia, ':' copie, ')+it.cond);
        tx.append(nm,sb);if(hot[it.card_id])tx.appendChild(el('span','tag info',hotLabel));
        row.append(cb,th,tx);
        var qs=null;
        if(it.qty>1){qs=document.createElement('select');qs.setAttribute('aria-label','Quante copie');for(var k=1;k<=Math.min(it.qty,9);k++){var o=el('option','',k+'x');o.value=k;qs.appendChild(o);}qs.hidden=true;qs.onclick=function(e){e.stopPropagation();};qs.onchange=function(){st.qty[it.card_id]=+qs.value;};row.appendChild(qs);}
        cb.onchange=function(){if(cb.checked){st.sel[it.card_id]=it;st.qty[it.card_id]=1;if(qs){qs.value='1';qs.hidden=false;}}else{delete st.sel[it.card_id];delete st.qty[it.card_id];if(qs)qs.hidden=true;}count();};
        row.name=S.norm(it.card_name||it.card_id);st.rows.push({row:row,cb:cb,it:it});box.appendChild(row);
        if(preset&&preset[it.card_id]&&Object.keys(st.sel).length<MAX){cb.checked=true;cb.onchange();}
      });
      q.oninput=function(){var t=S.norm(q.value);st.rows.forEach(function(r){r.row.hidden=!!t&&r.row.name.indexOf(t)<0;});};
      sides.push(st);count();return sec;
    }
    var up=function(){};
    body.appendChild(side('Tu ricevi da '+name,theirs,myWish,'La cerchi',pre.recv));
    body.appendChild(side('Tu dai',mine,theirWish,'La cerca',pre.give));
    var fn=el('div','field'),ln=el('label','','Messaggio (facoltativo)'),ta=document.createElement('textarea');ln.htmlFor='tr-note';ta.id='tr-note';ta.maxLength=300;ta.style.minHeight='64px';fn.append(ln,ta);fn.style.marginTop='16px';body.appendChild(fn);
    body.appendChild(el('p','note','Le carte passano da Swappr, che le verifica prima di inoltrarle. Dopo la proposta, '+name+' deve accettarla.'));
    var m=el('p','msg');m.setAttribute('role','status');
    var act=el('div','actions'),go=el('button','btn','Proponi lo scambio');go.type='button';act.append(go,m);body.appendChild(act);
    up=function(){go.disabled=!(Object.keys(sides[0].sel).length&&Object.keys(sides[1].sel).length);};up();
    go.onclick=function(){
      m.textContent='';go.disabled=true;
      function pack(st){return Object.keys(st.sel).map(function(k){var it=st.sel[k];return{card_id:it.card_id,card_name:it.card_name,qty:st.qty[k]||1,cond:it.cond};});}
      API.propose(name,pack(sides[1]),pack(sides[0]),ta.value).then(function(){location.href='scambi.html';},function(e){
        m.textContent=e.message;up();
        if(e.code==='no_address'){var a=el('a','',' Vai al profilo');a.href='profilo.html#indirizzo';m.appendChild(a);}
      });
    };
  }).catch(function(e){body.replaceChildren(el('p','msg',e.message||ERR.generic));});
}

/* ---------- interfaccia per le pagine ---------- */
var API={
  err:err,statusLabel:statusLabel,cardsFor:cardsFor,toCard:toCard,wanted:wanted,stackCards:stackCards,reportDialog:reportDialog,composeTrade:composeTrade,
  signUp:signUp,signIn:signIn,signOut:signOut,recover:recover,resend:resend,setPassword:setPassword,
  refresh:function(){return flush().catch(noop).then(pull);},flush:flush,dirty:dirty,recount:recount,
  usernameFree:function(n){return rpc('username_available',{p_username:n},{anon:true});},
  mostWanted:function(n){return rpc('most_wanted',{p_limit:n||6},{anon:true});},
  discover:function(n){return call('discover',{p_limit:n||24});},
  matches:function(){return call('find_matches');},
  cardPeople:function(id){return call('card_people',{p_card_id:id});},
  profile:function(u){return call('get_profile',{p_username:u});},
  searchUsers:function(q){return call('search_users',{p_query:q});},
  conversations:function(){return call('list_conversations');},
  thread:function(u,after){return call('get_conversation',{p_username:u,p_after:after||0}).then(function(r){recount();return r;});},
  send:function(u,body){return call('send_message',{p_to:u,p_body:body});},
  propose:function(to,give,recv,note){return flush().catch(noop).then(function(){return call('propose_trade',{p_to:to,p_give:give,p_recv:recv,p_note:note||''});}).then(afterChange);},
  respond:function(id,yes){return call('respond_trade',{p_trade:id,p_accept:!!yes}).then(afterChange);},
  cancel:function(id){return call('cancel_trade',{p_trade:id}).then(afterChange);},
  markSent:function(id,tracking){return call('mark_sent',{p_trade:id,p_tracking:tracking||''}).then(afterChange);},
  received:function(id){return call('confirm_received',{p_trade:id}).then(afterChange);},
  shipInfo:function(id){return call('trade_ship_info',{p_trade:id});},
  updateProfile:function(o){
    return call('update_profile',{p_username:o.username==null?null:o.username,p_city:o.city==null?null:o.city,p_bio:o.bio==null?null:o.bio,p_avatar_color:o.color==null?null:o.color,p_visible:o.visible==null?null:o.visible}).then(afterChange);
  },
  saveAddress:function(a){return call('save_address',{p_address:a}).then(afterChange);},
  deleteAddress:function(){return call('delete_address').then(afterChange);},
  acceptTerms:function(){return call('accept_terms').then(afterChange);},
  follow:function(u,on){return call('follow_user',{p_username:u,p_on:!!on}).then(function(r){
    C.muted=true;try{var f=S.follows().filter(function(x){return x!==u;});if(on)f.push(u);S.set('follows',f);if(C.snap){if(on)C.snap.f[u]=1;else delete C.snap.f[u];}}finally{C.muted=false;}
    return r;});},
  block:function(u,on){return call('block_user',{p_username:u,p_on:!!on}).then(afterChange);},
  report:function(u,reason,details,trade){return call('report_user',{p_username:u,p_reason:reason,p_details:details||'',p_trade:trade||null});},
  exportData:function(){return call('export_my_data',{},{timeout:40000});},
  deleteAccount:function(){return call('delete_my_account').then(function(){forget();return true;});},
  admin:{
    overview:function(){return call('staff_overview');},
    trades:function(status){return call('staff_list_trades',{p_status:status||null,p_limit:100});},
    setTrade:function(id,status,note){return call('staff_trade_set_status',{p_trade:id,p_status:status,p_note:note||''});},
    reports:function(status){return call('staff_list_reports',{p_status:status===undefined?'open':status});},
    closeReport:function(id,action,note){return call('staff_close_report',{p_id:id,p_action:action,p_note:note||''});},
    findUser:function(q){return call('staff_find_user',{p_query:q});},
    setUser:function(id,status,reason){return call('staff_set_user_status',{p_user:id,p_status:status,p_reason:reason||''});},
    setSetting:function(k,v){return call('staff_set_setting',{p_key:k,p_value:v});},
    log:function(n){return call('staff_recent_log',{p_limit:n||50});}
  },
  /* usato dalla pagina "Controllo": prove sul collegamento, senza dati personali */
  probe:function(){
    var out={};
    return http('/auth/v1/health').then(function(j){out.auth={ok:true,info:j&&j.name?j.name:'ok'};},function(e){out.auth={ok:false,code:e.code,msg:e.message};})
      .then(function(){return rpc('app_status',{},{anon:true}).then(function(j){out.schema={ok:!!(j&&j.ok),version:j&&j.schema_version,missing:(j&&Array.isArray(j.missing))?j.missing.slice(0,80):[]};},function(e){out.schema={ok:false,code:e.code,msg:e.message};});})
      .then(function(){return fetch(URL_+'/rest/v1/profiles?select=*&limit=1',{headers:{apikey:KEY},cache:'no-store'}).then(function(r){return r.text().then(function(t){var j=null;try{j=JSON.parse(t);}catch(e){}out.tables={status:r.status,exposed:r.ok&&Array.isArray(j)&&j.length>0,open:r.ok&&Array.isArray(j)};});},function(){out.tables={status:0};});})
      .then(function(){return out;});
  }
};
API.onNotifs=function(list){
  if(!A.token||C.muted||!C.unreadIds)return;
  var ids=[];
  list.forEach(function(n){if(n.read&&C.unreadIds[n.id]){ids.push(n.id);delete C.unreadIds[n.id];}});
  if(ids.length)rpc('mark_notifications_read',{p_ids:ids}).then(function(){if(C.counters)C.counters.notif_max=C.counters.notif_max;}).catch(noop);
};

function bindEvents(){
  window.addEventListener('storage',function(e){
    if(e.key!==SESS)return;
    var s=S.get('session',null),has=!!(s&&s.access_token);
    if(has!==!!A.token)location.reload();else if(has)loadSession();
  });
}

function init(core){
  S=core;C=S.cloud;URL_=C.url;KEY=C.key;
  Object.assign(C,API);
  C.snap=emptySnap();C.data=null;C.counters={};C.muted=false;C.sync={state:'ok',msg:''};C.pulledAt=0;C.recovery=false;C.address=null;C.trades=[];C.isStaff=false;C.followers=0;C.blocks=[];C.following=[];
  loadSession();
  handleHash();
  if(!A.token)C.recovery=false;
  var cache=S.get('cloud',null);
  if(A.token&&cache&&cache.uid===A.uid){C.snap=cache.snap||C.snap;C.data=cache.data||null;C.pulledAt=cache.pulledAt||0;C.unread=cache.unread||0;applyDerived();}
  C.snap.uid=A.uid;
  C.loaded=true;
  bindEvents();
  if(!A.token){
    var old=S.get('user',null);
    if(old){C.legacyName=old.username||'';S.set('user',null);}
    return Promise.resolve();
  }
  startPoll();
  var stale=!C.data||Date.now()-C.pulledAt>30000;
  var job=flush().catch(noop).then(function(){return pull();}).catch(function(e){
    if(e.code==='profile_missing'||e.code==='not_authenticated')expired();
    else if(transient(e))setSync('offline',e.message);
  });
  return stale?Promise.race([job,wait(6000)]):Promise.resolve();
}
window.SwapprCloud={init:init};
/* avvio: le pagine aspettano S.ready (dati dell'account scaricati o prova scaduta) */
(function(){
  var core=window.Swappr;
  if(!core||!core.cloud.on||document.body.dataset.shell==='none')return;
  try{core.ready=init(core).then(noop,noop);}catch(e){core.ready=Promise.resolve();}
})();
})();
