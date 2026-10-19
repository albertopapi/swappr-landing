const S=Swappr,el=S.el,CL=S.cloud,app=document.getElementById('app');
const EXPECT='1'; /* versione dello schema SQL attesa dal sito (vedi supabase/schema.sql) */
const TAG={ok:['ok','Ok'],warn:['warn','Attenzione'],bad:['bad','Errore'],info:['info','Info']};
const local=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const mk=(t,fn,cls)=>{const b=el('button','btn small'+(cls?' '+cls:''),t);b.type='button';b.onclick=fn;return b;};

async function checks(){
  const out=[],add=(st,title,text)=>out.push({st,title,text});
  /* 1. configurazione */
  if(CL.problem)add('bad','Configurazione','swappr-config.js: '+CL.problem);
  else if(!CL.on)add('info','Configurazione','Non ancora collegato: swappr-config.js è vuoto. Il sito funziona in modalità locale: i dati restano sul dispositivo e gli altri utenti sono di esempio. Per attivare gli account segui le istruzioni di LEGGIMI.txt.');
  else{
    add('ok','Configurazione',CL.url+', chiave pubblica di tipo '+(/^sb_publishable_/.test(CL.key)?'publishable':'anon')+'.');
    let host='';try{host=new URL(CL.url).hostname;}catch(e){}
    if(host&&!/\.supabase\.co$/.test(host)&&!/^(localhost|127\.0\.0\.1)$/.test(host))add('warn','Dominio personalizzato','L’indirizzo non finisce con .supabase.co: aggiungilo a connect-src nel Content-Security-Policy di vercel.json, altrimenti il browser blocca le chiamate.');
  }
  /* 2-4. servizio account, database, protezione delle tabelle */
  if(CL.on&&CL.probe){
    let p;
    try{p=await CL.probe();}catch(e){p={auth:{ok:false,msg:e.message},schema:{ok:false,msg:e.message},tables:{status:0}};}
    if(p.auth&&p.auth.ok)add('ok','Servizio account','Risponde: registrazione e accesso sono raggiungibili.');
    else add('bad','Servizio account',((p.auth&&p.auth.msg)||'Non risponde.')+' Controlla l’indirizzo e la chiave in swappr-config.js e che il progetto Supabase non sia in pausa.');
    const sc=p.schema||{};
    const miss=Array.isArray(sc.missing)?sc.missing:[];
    if(sc.ok&&miss.length)add('bad','Database','Lo schema SQL è incompleto: mancano '+miss.length+(miss.length===1?' funzione (':' funzioni (')+miss.slice(0,6).join(', ')+(miss.length>6?'…':'')+'). Apri su Supabase l’SQL Editor, incolla di nuovo tutto il file supabase/schema.sql e premi Run.');
    else if(sc.ok&&String(sc.version)===EXPECT)add('ok','Database','Lo schema SQL è installato (versione '+sc.version+').');
    else if(sc.ok)add('warn','Database','Lo schema SQL ha la versione '+sc.version+' ma il sito si aspetta la '+EXPECT+': esegui di nuovo supabase/schema.sql.');
    else add('bad','Database',(sc.msg||'Lo schema SQL non risponde.')+' Apri su Supabase l’SQL Editor, incolla il file supabase/schema.sql e premi Run.');
    const t=p.tables||{};
    if(!sc.ok)add('info','Protezione dei dati','Da controllare dopo aver installato lo schema SQL.');
    else if(t.open||t.exposed)add('bad','Protezione dei dati','Le tabelle sono leggibili da chiunque, anche senza accedere. Esegui di nuovo supabase/schema.sql: attiva la protezione su ogni tabella e toglie i permessi pubblici.');
    else if(!t.status)add('warn','Protezione dei dati','Non sono riuscito a fare la prova.');
    else add('ok','Protezione dei dati','Le tabelle non sono leggibili dal pubblico (risposta '+t.status+'): i dati si leggono solo con le funzioni del database.');
  }
  /* 5. catalogo carte */
  try{
    const r=await Promise.all([fetch('catalogo/sets.json',{cache:'no-cache'}),fetch('catalogo/carte.json',{cache:'no-cache'})]);
    if(!r[0].ok||!r[1].ok)throw new Error('manca');
    const s=await r[0].json(),c=await r[1].json(),sets=(s.sets||[]).length,day=/^\d{4}-\d{2}-\d{2}$/.test(s.data||'')?String(s.data).split('-').reverse().join('/'):'';let cards=0;
    Object.keys(c).forEach(k=>{cards+=(c[k]||[]).length;});
    if(sets>0&&cards>0)add('ok','Catalogo carte',sets+' espansioni e '+cards.toLocaleString('it-IT')+' carte nel catalogo incluso nel sito'+(day?' (aggiornato al '+day+')':'')+': i filtri e la ricerca funzionano senza servizi esterni.');
    else add('bad','Catalogo carte','Il catalogo è vuoto o incompleto: carica di nuovo la cartella «catalogo».');
  }catch(e){add('bad','Catalogo carte','Non trovo catalogo/sets.json o catalogo/carte.json: controlla di aver caricato la cartella «catalogo».');}
  /* 6. intestazioni di sicurezza */
  try{
    const r=await fetch(location.pathname,{cache:'no-store'});
    const csp=r.headers.get('content-security-policy'),xf=r.headers.get('x-frame-options'),xc=r.headers.get('x-content-type-options');
    if(csp&&xf&&xc)add('ok','Intestazioni di sicurezza','Attive: Content-Security-Policy, X-Frame-Options e X-Content-Type-Options.');
    else add(local?'info':'warn','Intestazioni di sicurezza',local?'In locale non ci sono: su Vercel arrivano dal file vercel.json.':'Non le trovo: controlla che vercel.json sia nella cartella principale del sito e fai un nuovo deploy.');
  }catch(e){add('warn','Intestazioni di sicurezza','Non sono riuscito a leggerle.');}
  /* 7. account di chi guarda la pagina */
  if(CL.on){
    if(CL.user)add('ok','Il tuo account','Sei collegato come '+CL.user.username+(CL.isStaff?', con accesso allo staff.':'. Non sei nello staff: per diventarlo segui il punto «Staff» di LEGGIMI.txt.'));
    else add('info','Il tuo account','Non hai effettuato l’accesso.');
  }
  /* 8. cose da provare a mano */
  add('info','Email di conferma','Prova a creare un account con una tua email: la mail di conferma deve arrivare (controlla anche lo spam). Con il servizio email di prova di Supabase ne partono pochissime all’ora: prima del lancio imposta un tuo servizio email (SMTP) nel pannello di Supabase.');
  add('info','Pokémon TCG API','L’API gratuita chiude il 1 marzo 2027. Swappr usa il catalogo incluso nel sito e la contatta solo come riserva: dopo quella data basta rigenerare il catalogo (vedi LEGGIMI.txt).');
  return out;
}
function report(out){
  const d=new Date().toLocaleString('it-IT'),L=['Swappr, controllo del '+d+' ('+location.hostname+')'];
  out.forEach(x=>L.push(TAG[x.st][1]+' - '+x.title+': '+x.text));
  return L.join('\n');
}
async function run(box){
  box.replaceChildren(el('p','sub','Controllo in corso…'));
  let out;try{out=await checks();}catch(e){out=[{st:'bad',title:'Controllo',text:'Il controllo si è interrotto: '+e.message}];}
  box.replaceChildren();
  const list=el('div','dg-list');
  out.forEach(x=>{
    const it=el('div','dg'),tx=el('div','tx');
    it.appendChild(el('span','tag st '+TAG[x.st][0],TAG[x.st][1]));
    tx.append(el('b','',x.title),el('span','',x.text));it.appendChild(tx);list.appendChild(it);
  });
  box.appendChild(list);
  const bad=out.filter(x=>x.st==='bad').length,warn=out.filter(x=>x.st==='warn').length;
  const sum=el('div','notice',bad?'Ci sono '+bad+(bad===1?' errore':' errori')+' da correggere prima di pubblicare.':warn?'Nessun errore, ma '+(warn===1?'c’è un punto':'ci sono '+warn+' punti')+' da controllare.':'Tutto a posto.');
  sum.setAttribute('role','status');box.insertBefore(sum,list);
  box.appendChild(el('h2','sec','Rapporto da copiare'));
  box.appendChild(el('p','sub','Se chiedi aiuto a qualcuno, mandagli questo testo: non contiene password né chiavi.'));
  const ta=document.createElement('textarea');ta.className='report';ta.readOnly=true;ta.value=report(out);ta.setAttribute('aria-label','Rapporto del controllo');box.appendChild(ta);
  const row=el('div','row'),msg=el('p','msg');msg.setAttribute('role','status');row.style.marginTop='10px';
  row.append(mk('Copia il rapporto',async()=>{
    try{await navigator.clipboard.writeText(ta.value);msg.textContent='Copiato.';}
    catch(e){ta.focus();ta.select();msg.textContent='Selezionato: premi Ctrl+C (o Copia) per copiarlo.';}
  }),mk('Rifai i controlli',()=>run(box),'ghost'));
  if(CL.isStaff){const a=el('a','btn small ghost','Apri l’area staff');a.href='admin.html';row.appendChild(a);}
  box.append(row,msg);
}
function main(){
  app.appendChild(el('h1','','Controllo del collegamento'));
  app.appendChild(el('p','sub','Verifica che Swappr sia collegato correttamente a Supabase e pronto per la pubblicazione. Questa pagina non mostra né salva dati personali.'));
  const box=el('div');box.style.marginTop='16px';app.appendChild(box);run(box);
}
S.start(main);
