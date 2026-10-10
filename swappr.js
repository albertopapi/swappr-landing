(function(){
var K={binder:'swappr-binder-v1',user:'swappr-user-v1',trades:'swappr-trades-v1',session:'swappr-session-v1',lang:'swappr-lang-v1',listings:'swappr-listings-v1'};
function get(k,d){try{var r=localStorage.getItem(K[k]);return r?JSON.parse(r):d;}catch(e){return d;}}
function set(k,v){try{localStorage.setItem(K[k],JSON.stringify(v));return true;}catch(e){return false;}}
function el(t,c,x){var n=document.createElement(t);if(c)n.className=c;if(x!==undefined)n.textContent=x;return n;}
var lang=get('lang','it')==='en'?'en':'it',loc=lang==='en'?'en-GB':'it-IT';
document.documentElement.lang=lang;
function binder(){var b=get('binder',{have:[],want:[]});return{have:b.have||[],want:b.want||[]};}
function addCard(list,card){
  var b=binder();
  var same=b[list].find(function(c){return c.name.toLowerCase()===card.name.toLowerCase()&&c.game===card.game&&(c.set||'').toLowerCase()===(card.set||'').toLowerCase()&&(list==='want'||c.cond===card.cond);});
  if(same){same.qty=Math.min(999,same.qty+card.qty);if(card.price&&!same.price)same.price=card.price;}
  else{card.id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);b[list].unshift(card);}
  return set('binder',b);
}
function eur(n){return n==null?(lang==='en'?'n/a':'n.d.'):n.toLocaleString(loc,{style:'currency',currency:'EUR'});}
function cm(q){return'https://www.cardmarket.com/'+lang+'/Pokemon/Products/Search?searchString='+encodeURIComponent(q||'');}
function cmLink(c){var u=c&&c.cardmarket&&c.cardmarket.url;return(typeof u==='string'&&/^https:\/\//.test(u))?u:cm(c&&c.name);}
function cmExtra(c){var p=c&&c.cardmarket&&c.cardmarket.prices;if(!p||(!p.trendPrice&&!p.lowPrice&&!p.avg30))return'';return'Tendenza '+eur(p.trendPrice)+' · Minimo '+eur(p.lowPrice)+' · Media 30gg '+eur(p.avg30);}
var LINKS=[['Home','index'],['Binder','binder'],['Catalogo','catalogo'],['Cerca','cerca'],['Mercato','mercato'],['Match','match'],['Scambi','scambi'],['Profilo','account']];
function nav(){
  var h=document.querySelector('header');
  if(!h){h=el('header');var a=el('a','brand');a.href='index.html';var i=document.createElement('img');i.src='logo.png';i.alt='';i.width=36;i.height=36;a.append(i,document.createTextNode('Swappr'));h.appendChild(a);document.body.prepend(h);}
  var n=h.querySelector('nav');if(!n){n=el('nav');h.appendChild(n);}
  n.replaceChildren();
  var cur=location.pathname.split('/').pop().replace('.html','')||'index';
  var u=get('user',null);
  LINKS.forEach(function(l){
    var a=el('a','',l[1]==='account'&&u?'👤 '+u.username:l[0]);a.href=l[1]+'.html';
    if(l[1]===cur)a.setAttribute('aria-current','page');n.appendChild(a);
  });
  var d=el('details','more'),sm=el('summary','','Strumenti'),box=el('div');
  [['Verifica','verifica'],['Calcolatore','calcolatore'],['Il mio valore','dashboard'],['Guida','guida']].forEach(function(l){var a=el('a','',l[0]);a.href=l[1]+'.html';if(l[1]===cur)a.setAttribute('aria-current','page');box.appendChild(a);});
  d.append(sm,box);n.appendChild(d);
  var x=el('a','','Cardmarket ↗');x.href='https://www.cardmarket.com/'+lang+'/Pokemon';x.target='_blank';x.rel='noopener noreferrer';n.appendChild(x);
  var b=el('button','lang-btn','🌐 '+(lang==='it'?'EN':'IT'));b.type='button';b.setAttribute('aria-label','Cambia lingua');
  b.onclick=function(){set('lang',lang==='it'?'en':'it');location.reload();};
  n.appendChild(b);
}
var st=document.createElement('style');
st.textContent='header{display:flex;align-items:center;justify-content:space-between;gap:10px 20px;flex-wrap:wrap;padding:14px 20px;border-bottom:1px solid #1e293b;width:100%;text-align:left}header .brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:#f8fafc;font-weight:800;font-size:1.2rem}header .brand img{width:36px;height:36px}header nav{display:flex;flex-wrap:wrap;align-items:center;gap:6px 16px}header nav a{color:#38bdf8;text-decoration:none;font-size:.95rem;padding:4px 2px;border-bottom:2px solid transparent}header nav a[aria-current]{color:#f8fafc;font-weight:700;border-bottom-color:#38bdf8}header .lang-btn{background:transparent;border:1px solid #334155;color:#cbd5e1;border-radius:20px;padding:3px 10px;font-size:.85rem;font-weight:500;width:auto;cursor:pointer}header .lang-btn:hover{background:#1e293b}header details.more{position:relative}header details.more summary{cursor:pointer;color:#38bdf8;font-size:.95rem;list-style:none;padding:4px 2px}header details.more summary::-webkit-details-marker{display:none}header details.more div{position:absolute;right:0;top:100%;z-index:10;background:#1e293b;border:1px solid #334155;border-radius:10px;padding:8px 14px;display:flex;flex-direction:column;gap:8px;min-width:160px;white-space:nowrap}';
document.head.appendChild(st);
if(!document.querySelector('link[rel~="icon"]')){var ic=document.createElement('link');ic.rel='icon';ic.href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%232563eb'/%3E%3Ctext x='32' y='46' font-size='40' font-family='Arial' font-weight='700' text-anchor='middle' fill='white'%3ES%3C/text%3E%3C/svg%3E";document.head.appendChild(ic);}
window.Swappr={cmExtra:cmExtra,get:get,set:set,el:el,binder:binder,addCard:addCard,eur:eur,nav:nav,cm:cm,cmLink:cmLink,lang:lang,loc:loc,t:function(s){return s;}};
nav();
if(lang==='en'){var s=document.createElement('script');s.src='swappr-i18n.js';document.body.appendChild(s);}
})();
