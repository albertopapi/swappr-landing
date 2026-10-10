(function(){
var K={binder:'swappr-binder-v1',user:'swappr-user-v1',trades:'swappr-trades-v1'};
function get(k,d){try{var r=localStorage.getItem(K[k]);return r?JSON.parse(r):d;}catch(e){return d;}}
function set(k,v){try{localStorage.setItem(K[k],JSON.stringify(v));return true;}catch(e){return false;}}
function el(t,c,x){var n=document.createElement(t);if(c)n.className=c;if(x!==undefined)n.textContent=x;return n;}
function binder(){var b=get('binder',{have:[],want:[]});return{have:b.have||[],want:b.want||[]};}
function addCard(list,card){
  var b=binder();
  var same=b[list].find(function(c){return c.name.toLowerCase()===card.name.toLowerCase()&&c.game===card.game&&(c.set||'').toLowerCase()===(card.set||'').toLowerCase()&&(list==='want'||c.cond===card.cond);});
  if(same){same.qty=Math.min(999,same.qty+card.qty);if(card.price&&!same.price)same.price=card.price;}
  else{card.id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);b[list].unshift(card);}
  return set('binder',b);
}
function eur(n){return n==null?'n.d.':n.toLocaleString('it-IT',{style:'currency',currency:'EUR'});}
var LINKS=[['Home','index'],['Binder','binder'],['Cerca','cerca'],['Match','match'],['Scambi','scambi'],['Profilo','account']];
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
}
var st=document.createElement('style');
st.textContent='header{display:flex;align-items:center;justify-content:space-between;gap:10px 20px;flex-wrap:wrap;padding:14px 20px;border-bottom:1px solid #1e293b;width:100%;text-align:left}header .brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:#f8fafc;font-weight:800;font-size:1.2rem}header .brand img{width:36px;height:36px}header nav{display:flex;flex-wrap:wrap;gap:6px 16px}header nav a{color:#38bdf8;text-decoration:none;font-size:.95rem;padding:4px 2px;border-bottom:2px solid transparent}header nav a[aria-current]{color:#f8fafc;font-weight:700;border-bottom-color:#38bdf8}';
document.head.appendChild(st);
window.Swappr={get:get,set:set,el:el,binder:binder,addCard:addCard,eur:eur,nav:nav};
nav();
})();
