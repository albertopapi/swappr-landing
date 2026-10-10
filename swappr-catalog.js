// Catalogo carte: legge Pokémon (Pokémon TCG API) e Magic (Scryfall) in tempo reale dal browser.
(function(){
'use strict';
var P_API='https://api.pokemontcg.io/v2/',S_API='https://api.scryfall.com/';
var GAMES=[{id:'pokemon',name:'Pokémon'},{id:'magic',name:'Magic: The Gathering'}];
var mem={};
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
async function get(url){
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
function safe(u){return typeof u==='string'&&/^https:\/\//.test(u)?u:'';}
function num(v){v=typeof v==='string'?parseFloat(v):v;return typeof v==='number'&&isFinite(v)&&v>0?v:null;}
function cmSearch(game,name){return'https://www.cardmarket.com/'+Swappr.lang+'/'+(game==='magic'?'Magic':'Pokemon')+'/Products/Search?searchString='+encodeURIComponent(name);}
function byNum(a,b){return String(a.number).localeCompare(String(b.number),undefined,{numeric:true});}
function mapP(c){
  var p=(c.cardmarket&&c.cardmarket.prices)||{},im=c.images||{},st=c.set||{};
  return{game:'pokemon',id:c.id,name:c.name,number:c.number||'',rarity:c.rarity||'',setId:st.id||'',setName:st.name||'',
    img:safe(im.small),imgBig:safe(im.large)||safe(im.small),
    price:{avg:num(p.averageSellPrice),trend:num(p.trendPrice),low:num(p.lowPrice),avg1:num(p.avg1),avg7:num(p.avg7),avg30:num(p.avg30)},
    cm:safe(c.cardmarket&&c.cardmarket.url)||cmSearch('pokemon',c.name)};
}
function mapS(c){
  var f=(c.card_faces&&c.card_faces[0])||{},im=c.image_uris||f.image_uris||{};
  var eur=num(c.prices&&c.prices.eur),fo=num(c.prices&&c.prices.eur_foil);
  return{game:'magic',id:c.id,name:c.name,number:c.collector_number||'',rarity:c.rarity||'',setId:c.set||'',setName:c.set_name||'',
    img:safe(im.small),imgBig:safe(im.normal)||safe(im.small),
    price:{avg:eur!=null?eur:fo,foil:eur!=null?fo:null,foilOnly:eur==null&&fo!=null},
    cm:safe(c.purchase_uris&&c.purchase_uris.cardmarket)||cmSearch('magic',c.name)};
}
async function sets(game){
  if(game==='pokemon'){
    var j=await get(P_API+'sets?orderBy=-releaseDate&select=id,name,series,total,releaseDate');
    return((j&&j.data)||[]).map(function(s){return{id:s.id,name:s.name,group:s.series||'',date:s.releaseDate||'',total:s.total};});
  }
  var k=await get(S_API+'sets');
  return((k&&k.data)||[]).filter(function(s){return!s.digital&&s.card_count>0;})
    .sort(function(a,b){return(b.released_at||'').localeCompare(a.released_at||'');})
    .map(function(s){return{id:s.code,name:s.name,group:s.set_type||'',date:s.released_at||'',total:s.card_count};});
}
async function setCards(game,id){
  var out=[],i;
  if(game==='pokemon'){
    for(i=1;;i++){
      var j=await get(P_API+'cards?q='+encodeURIComponent('set.id:'+id)+'&page='+i+'&pageSize=250&select=id,name,number,rarity,images,set,cardmarket');
      if(!j)break;
      (j.data||[]).forEach(function(c){out.push(mapP(c));});
      if(i*250>=(j.totalCount||0))break;
    }
  }else{
    var url=S_API+'cards/search?q='+encodeURIComponent('e:'+id)+'&unique=prints&include_extras=true&order=set';
    while(url){
      var k=await get(url);if(!k)break;
      (k.data||[]).forEach(function(c){out.push(mapS(c));});
      url=k.has_more?k.next_page:null;
    }
  }
  return out.sort(byNum);
}
async function search(game,term){
  term=String(term||'').trim().replace(/["\\]/g,'');
  if(term.length<2)return[];
  if(game==='pokemon'){
    var j=await get(P_API+'cards?q='+encodeURIComponent('name:"'+term+'*"')+'&pageSize=60&orderBy=-set.releaseDate&select=id,name,number,rarity,images,set,cardmarket');
    return((j&&j.data)||[]).map(mapP);
  }
  var k=await get(S_API+'cards/search?q='+encodeURIComponent(term+' game:paper')+'&unique=prints&order=released&dir=desc');
  return((k&&k.data)||[]).slice(0,60).map(mapS);
}
// Storico raccolto da Swappr (opzionale, vedi scripts/track-prices.mjs)
async function history(game,setId){
  if(game!=='pokemon')return null;
  try{var r=await fetch('data/history/'+encodeURIComponent(setId)+'.json');return r.ok?await r.json():null;}catch(e){return null;}
}
// Storico personale: salva il prezzo ogni volta che apri una carta
function snaps(){return Swappr.get('snaps',{})||{};}
function record(c){
  if(c.price.avg==null)return;
  var s=snaps(),k=c.game+':'+c.id,a=s[k]||[],t=new Date().toISOString().slice(0,10);
  if(a.length&&a[a.length-1][0]===t)a[a.length-1][1]=c.price.avg;else a.push([t,c.price.avg]);
  s[k]=a.slice(-365);
  var ks=Object.keys(s);if(ks.length>300)delete s[ks[0]];
  Swappr.set('snaps',s);
}
function mySeries(c){return snaps()[c.game+':'+c.id]||[];}
function statRows(c){
  var p=c.price,r=[];
  if(c.game==='pokemon'){
    [['Prezzo medio',p.avg],['Tendenza',p.trend],['Prezzo minimo',p.low],['Media 1 giorno',p.avg1],['Media 7 giorni',p.avg7],['Media 30 giorni',p.avg30]].forEach(function(x){if(x[1]!=null)r.push(x);});
  }else{
    if(p.avg!=null)r.push([p.foilOnly?'Prezzo foil':'Prezzo',p.avg]);
    if(p.foil!=null)r.push(['Foil',p.foil]);
  }
  return r;
}
function recentSeries(c){
  if(c.game!=='pokemon')return null;
  var v=[c.price.avg30,c.price.avg7,c.price.avg1];
  return v.filter(function(x){return x!=null;}).length>1?{labels:['Media 30 gg','Media 7 gg','Media 1 gg'],values:v}:null;
}
function lineChart(labels,values,opt){
  opt=opt||{};
  var pts=[];values.forEach(function(v,i){if(v!=null)pts.push([i,v]);});
  if(pts.length<2)return null;
  var NS='http://www.w3.org/2000/svg',W=620,H=230,L=64,R=14,T=14,B=30;
  var vs=pts.map(function(p){return p[1];}),mn=Math.min.apply(null,vs),mx=Math.max.apply(null,vs),sp=(mx-mn)||mx||1;
  var lo=Math.max(0,mn-sp*0.15),hi=mx+sp*0.15,n=Math.max(values.length-1,1);
  function X(i){return L+(W-L-R)*i/n;}
  function Y(v){return T+(H-T-B)*(1-(v-lo)/(hi-lo));}
  var s=document.createElementNS(NS,'svg');
  s.setAttribute('viewBox','0 0 '+W+' '+H);s.setAttribute('class','chart');s.setAttribute('role','img');s.setAttribute('aria-label',opt.label||'Grafico del prezzo');
  function add(tag,attrs,text){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(text!==undefined)e.textContent=text;s.appendChild(e);return e;}
  [lo,(lo+hi)/2,hi].forEach(function(v){var y=Y(v);add('line',{x1:L,x2:W-R,y1:y,y2:y,stroke:'#334155','stroke-width':1});add('text',{x:L-8,y:y+4,'text-anchor':'end',fill:'#94a3b8','font-size':11},Swappr.eur(v));});
  var d='',prev=-2;
  pts.forEach(function(p){d+=(p[0]===prev+1?'L':'M')+X(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1)+' ';prev=p[0];});
  add('path',{d:d,fill:'none',stroke:'#38bdf8','stroke-width':2.5,'stroke-linejoin':'round'});
  pts.forEach(function(p){
    var c=add('circle',{cx:X(p[0]).toFixed(1),cy:Y(p[1]).toFixed(1),r:3.5,fill:'#38bdf8'});
    var t=document.createElementNS(NS,'title');t.textContent=labels[p[0]]+': '+Swappr.eur(p[1]);c.appendChild(t);
  });
  var step=Math.max(1,Math.ceil(labels.length/6));
  labels.forEach(function(l,i){if(i%step===0||i===labels.length-1)add('text',{x:X(i),y:H-8,'text-anchor':i===0?'start':(i===labels.length-1?'end':'middle'),fill:'#94a3b8','font-size':11},l);});
  return s;
}
window.SwapprCatalog={GAMES:GAMES,sets:sets,setCards:setCards,search:search,history:history,record:record,mySeries:mySeries,statRows:statRows,recentSeries:recentSeries,lineChart:lineChart,cmSearch:cmSearch,byNum:byNum,_t:{mapP:mapP,mapS:mapS,num:num}};
})();
