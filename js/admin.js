const S=Swappr,el=S.el,CL=S.cloud,app=document.getElementById('app');
const mk=(t,fn,cls)=>{const b=el('button','btn small'+(cls?' '+cls:''),t);b.type='button';b.onclick=fn;return b;};
const msgEl=()=>{const m=el('p','msg');m.setAttribute('role','status');m.setAttribute('aria-live','polite');return m;};
const dt=t=>{const d=new Date(t);return isNaN(d)?'—':d.toLocaleString('it-IT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});};
const mail=e=>{
  if(!e)return el('span','','email non disponibile');
  if(!/^[^\s@<>"'\\]+@[^\s@<>"'\\]+$/.test(e))return el('span','',e);
  const a=el('a','',e);a.href='mailto:'+e;return a;
};
const LBL={proposed:'Proposto',accepted:'Accettato',sent:'Spedito a Swappr',verifying:'In verifica',shipped:'Inoltrato',completed:'Completato',cancelled:'Annullato',declined:'Rifiutato'};
const TONE={sent:'info',verifying:'info',shipped:'info',completed:'ok',cancelled:'warn',declined:'warn'};
const REASON={spam:'Spam o pubblicità',fraud:'Truffa o comportamento sospetto',abuse:'Linguaggio offensivo o molestie',other:'Altro'};
const GROUPS=[
  ['todo','Da gestire',['sent','verifying']],
  ['wait','In attesa degli utenti',['proposed','accepted','shipped']],
  ['done','Completati',['completed']],
  ['closed','Annullati o rifiutati',['cancelled','declined']],
  ['all','Tutti',null]];
/* cosa può fare lo staff in ogni stato: le stesse regole del database */
const STEPS={proposed:['cancelled'],accepted:['cancelled'],sent:['verifying','cancelled'],verifying:['shipped','cancelled'],shipped:['completed']};
const STEP={
  verifying:{btn:'Carte arrivate: inizia la verifica',title:'Le carte sono arrivate?',text:'Segna «In verifica» quando hai ricevuto i pacchi di entrambe le parti. Le due parti ricevono un avviso.',ok:'Inizia la verifica'},
  shipped:{btn:'Verifica superata: carte inoltrate',title:'Verifica superata?',text:'Conferma solo dopo aver controllato le carte e averle rispedite a ciascuna parte. Le due parti dovranno confermare la ricezione.',ok:'Carte inoltrate'},
  completed:{btn:'Chiudi lo scambio',title:'Chiudere lo scambio?',text:'Di solito si chiude da solo quando entrambi confermano la ricezione. Usalo solo se è già tutto a posto.',ok:'Chiudi lo scambio'},
  cancelled:{btn:'Annulla lo scambio',title:'Annullare lo scambio?',text:'Le due parti ricevono un avviso con la nota che hai scritto. Se hai già ricevuto delle carte, ricordati di rispedirle.',ok:'Annulla lo scambio',danger:true}};
const TABS=[['panoramica','Panoramica'],['scambi','Scambi'],['segnalazioni','Segnalazioni'],['utenti','Utenti'],['impostazioni','Impostazioni'],['registro','Registro']];
const st={tab:'panoramica',tf:'todo',rf:'open',focus:''};

/* carica i dati di una scheda, con messaggio d'errore e «Riprova» */
async function load(box,fn,draw){
  box.replaceChildren(el('p','sub','Carico…'));
  try{const d=await fn();box.replaceChildren();draw(d);}
  catch(e){const r=mk('Riprova',()=>load(box,fn,draw),'ghost');r.style.marginTop='8px';box.replaceChildren(el('p','msg',e.message),r);}
}
const field=(id,label,input)=>{const w=el('div','field'),l=el('label','',label);input.id=id;l.htmlFor=id;w.append(l,input);return w;};
const input=(max,ph)=>{const i=document.createElement('input');i.maxLength=max;i.autocomplete='off';if(ph)i.placeholder=ph;return i;};
const area=(max,rows,ph)=>{const i=document.createElement('textarea');i.maxLength=max;i.rows=rows;if(ph)i.placeholder=ph;return i;};
const select=(id,label,opts,val,fn)=>{
  const s=document.createElement('select');opts.forEach(o=>{const x=document.createElement('option');x.value=o[0];x.textContent=o[1];s.appendChild(x);});
  s.value=val;s.onchange=()=>fn(s.value);return field(id,label,s);
};

/* ---------------- panoramica ---------------- */
function overview(box,go){
  load(box,()=>CL.admin.overview(),o=>{
    const t=o.trades||{},n=k=>Number(t[k]||0),s=o.settings||{};
    if(!s.ship_to){
      const w=el('div','notice'),r=el('div','row');
      w.appendChild(el('p','','L’indirizzo di spedizione di Swappr non è ancora impostato: gli utenti non sanno dove spedire le carte.'));
      r.style.marginTop='10px';r.appendChild(mk('Impostalo ora',()=>go('impostazioni')));w.appendChild(r);box.appendChild(w);
    }
    const g=el('div','stats');
    const tile=(num,label,tab,hot,fn)=>{
      const b=el('button','stat'+(hot&&num>0?' hot':''));b.type='button';b.append(el('b','',String(num)),el('span','',label));
      b.onclick=()=>{if(fn)fn();go(tab);};g.appendChild(b);
    };
    tile(n('sent'),'Carte in arrivo a Swappr','scambi',true,()=>{st.tf='todo';});
    tile(n('verifying'),'Scambi in verifica','scambi',true,()=>{st.tf='todo';});
    tile(n('proposed')+n('accepted')+n('shipped'),'In attesa degli utenti','scambi',false,()=>{st.tf='wait';});
    tile(n('completed'),'Scambi completati','scambi',false,()=>{st.tf='done';});
    tile(n('cancelled')+n('declined'),'Annullati o rifiutati','scambi',false,()=>{st.tf='closed';});
    tile(Number(o.open_reports||0),'Segnalazioni aperte','segnalazioni',true,()=>{st.rf='open';});
    tile(Number(o.users||0),'Utenti iscritti','utenti',false);
    tile(Number(o.suspended||0),'Utenti sospesi','utenti',false);
    box.appendChild(g);
    box.appendChild(el('p','note','Ogni azione dello staff viene registrata nel Registro. Gli indirizzi e le email degli utenti sono visibili solo qui e solo a chi è nello staff.'));
  });
}

/* ---------------- scambi ---------------- */
async function fetchTrades(key){
  const g=GROUPS.find(x=>x[0]===key)||GROUPS[0];
  if(!g[2])return CL.admin.trades(null);
  const parts=await Promise.all(g[2].map(s=>CL.admin.trades(s)));
  return parts.flat().sort((a,b)=>Date.parse(b.updated_at)-Date.parse(a.updated_at));
}
function party(p,role,gives){
  const b=el('div','party');
  b.appendChild(el('h4','',p.username+' ('+role+')'));
  const line=el('p','kvline');line.appendChild(mail(p.email));
  if(p.status==='suspended'){line.append(' ');line.appendChild(el('span','tag warn','sospeso'));}
  b.appendChild(line);
  const a=p.address;
  if(a){
    const lines=[a.full_name,a.line1,a.line2,[a.postal_code,a.city].filter(Boolean).join(' ')+(a.province?' ('+a.province+')':''),a.country,a.phone?'Tel. '+a.phone:''].filter(x=>x&&String(x).trim());
    b.appendChild(el('p','addr',lines.join('\n')));
  }else b.appendChild(el('p','kvline','Indirizzo non disponibile.'));
  b.appendChild(el('p','',p.sent_at?'Ha spedito il '+dt(p.sent_at)+(p.tracking?', tracking: '+p.tracking:', senza tracking'):'Non ha ancora segnato la spedizione.'));
  if(p.received_at)b.appendChild(el('p','','Ha confermato la ricezione il '+dt(p.received_at)+'.'));
  b.appendChild(el('p','kvline','Carte che spedisce a Swappr:'));
  const ul=el('ul');
  gives.forEach(i=>ul.appendChild(el('li','',i.qty+'× '+i.cond+', '+i.card_name+' ('+i.card_id+')')));
  if(!gives.length)ul.appendChild(el('li','','nessuna'));
  b.appendChild(ul);return b;
}
function tradeCard(t,reload){
  const c=el('section','match trade');c.dataset.id=t.id;
  c.appendChild(el('h3','','Scambio '+String(t.id).slice(0,8)));
  const meta=el('div','meta');
  meta.append(el('span','tag '+(TONE[t.status]||''),LBL[t.status]||t.status),el('span','tag','creato il '+dt(t.created_at)),el('span','tag','aggiornato il '+dt(t.updated_at)));
  if(t.cancelled_by)meta.appendChild(el('span','tag warn','annullato da '+({proposer:'chi ha proposto',recipient:'chi ha ricevuto la proposta',staff:'Swappr'}[t.cancelled_by]||t.cancelled_by)));
  c.appendChild(meta);
  const ps=el('div','parties');
  ps.append(party(t.proposer,'ha proposto',t.proposer_gives||[]),party(t.recipient,'ha ricevuto la proposta',t.recipient_gives||[]));
  c.appendChild(ps);
  if(t.note)c.appendChild(el('p','kvline','Messaggio nella proposta: «'+t.note+'»'));
  if(t.staff_note)c.appendChild(el('p','kvline','Ultima nota di Swappr: '+t.staff_note));
  const steps=STEPS[t.status]||[];
  if(steps.length){
    const ta=area(500,2,'Facoltativa. La leggono entrambe le parti (con l’annullamento è il motivo).');
    c.appendChild(field('note-'+t.id,'Nota per le due parti',ta));
    const row=el('div','row'),msg=msgEl();row.style.marginTop='12px';
    const btns=steps.map(s=>{
      const d=STEP[s];
      const b=mk(d.btn,async()=>{
        if(!await S.confirm(d.title,d.text,d.ok,!!d.danger,'Indietro'))return;
        msg.textContent='';btns.forEach(x=>{x.disabled=true;});
        try{await CL.admin.setTrade(t.id,s,ta.value);S.toast('Scambio aggiornato: '+LBL[s]+'.');reload();}
        catch(e){msg.textContent=e.message;btns.forEach(x=>{x.disabled=false;});}
      },d.danger?'danger':'');
      row.appendChild(b);return b;
    });
    c.append(row,msg);
  }
  return c;
}
function trades(box){
  const bar=el('div','adm-bar'),list=el('div');
  const draw=()=>load(list,()=>fetchTrades(st.tf),ts=>{
    if(!ts.length){list.appendChild(el('div','empty',st.tf==='todo'?'Nessuno scambio da gestire: non ci sono carte in arrivo né da verificare.':'Nessuno scambio in questo elenco.'));return;}
    ts.forEach(t=>list.appendChild(tradeCard(t,draw)));
    if(st.focus){const x=list.querySelector('[data-id="'+st.focus+'"]');st.focus='';if(x){x.scrollIntoView({block:'start'});x.classList.add('flash');}}
  });
  bar.append(select('adm-tf','Mostra',GROUPS.map(g=>[g[0],g[1]]),st.tf,v=>{st.tf=v;draw();}),mk('Aggiorna',draw,'ghost'));
  box.append(bar,list);draw();
}

/* ---------------- segnalazioni ---------------- */
function reportCard(r,reload,go){
  const c=el('section','match');
  const h=el('h3','',(REASON[r.reason]||r.reason)+' (n. '+r.id+')');c.appendChild(h);
  const meta=el('div','meta');
  meta.append(el('span','tag '+(r.status==='open'?'warn':'ok'),r.status==='open'?'Aperta':'Chiusa'),el('span','tag',dt(r.created_at)));
  if(r.target_status==='suspended')meta.appendChild(el('span','tag warn','utente già sospeso'));
  c.appendChild(meta);
  c.appendChild(el('p','sub','Da '+r.reporter+' contro '+r.target));
  if(r.details)c.appendChild(el('p','','«'+r.details+'»'));
  if(r.trade_id){
    const p=el('p','kvline','Scambio collegato: '+String(r.trade_id).slice(0,8)+' ');
    const b=mk('Vedi lo scambio',()=>{st.tf='all';st.focus=r.trade_id;go('scambi');},'ghost');p.appendChild(b);c.appendChild(p);
  }
  if(r.status==='open'){
    const ta=area(500,2,'Nota interna (facoltativa)');c.appendChild(field('rn-'+r.id,'Nota',ta));
    const row=el('div','row'),msg=msgEl();row.style.marginTop='12px';
    const act=(action,title,text,ok,danger)=>async()=>{
      if(!await S.confirm(title,text,ok,danger,'Indietro'))return;
      msg.textContent='';
      try{await CL.admin.closeReport(r.id,action,ta.value);S.toast(action==='suspend'?'Utente sospeso e segnalazione chiusa.':'Segnalazione archiviata.');reload();}
      catch(e){msg.textContent=e.message;}
    };
    row.appendChild(mk('Archivia',act('dismiss','Archiviare la segnalazione?','Non verrà presa nessuna misura contro '+r.target+'.','Archivia',false),'ghost'));
    if(r.target_id&&r.target_status!=='suspended')row.appendChild(mk('Sospendi '+r.target,act('suspend','Sospendere '+r.target+'?','L’account viene sospeso e l’utente riceve un avviso: non potrà più proporre scambi né scrivere. La segnalazione viene chiusa.','Sospendi',true),'danger'));
    c.append(row,msg);
  }else if(r.staff_note)c.appendChild(el('p','kvline','Nota: '+r.staff_note));
  return c;
}
function reports(box,go){
  const bar=el('div','adm-bar'),list=el('div');
  const draw=()=>load(list,()=>CL.admin.reports(st.rf==='all'?null:st.rf),rs=>{
    if(!rs.length){list.appendChild(el('div','empty',st.rf==='open'?'Nessuna segnalazione aperta.':'Nessuna segnalazione.'));return;}
    rs.forEach(r=>list.appendChild(reportCard(r,draw,go)));
  });
  bar.append(select('adm-rf','Mostra',[['open','Aperte'],['closed','Chiuse'],['all','Tutte']],st.rf,v=>{st.rf=v;draw();}),mk('Aggiorna',draw,'ghost'));
  box.append(bar,list);draw();
}

/* ---------------- utenti ---------------- */
function userCard(u,reload){
  const c=el('section','match'),h=el('h3'),a=el('a','plain',u.username);
  a.href='profilo.html?u='+encodeURIComponent(u.username);h.appendChild(a);c.appendChild(h);
  const sus=u.status==='suspended',meta=el('div','meta');
  meta.append(el('span','tag '+(sus?'warn':'ok'),sus?'Sospeso':'Attivo'),el('span','tag',u.visible?'Profilo visibile':'Profilo nascosto'),el('span','tag','iscritto il '+dt(u.created_at)));
  c.appendChild(meta);
  const p=el('p','kvline');p.appendChild(mail(u.email));c.appendChild(p);
  c.appendChild(el('p','sub',u.binders+' binder, '+u.wishlist+' carte in wishlist, '+u.trades+' scambi, '+u.reports_against+' segnalazioni ricevute'));
  const row=el('div','row'),msg=msgEl();row.style.marginTop='10px';
  if(sus)row.appendChild(mk('Riattiva l’account',async()=>{
    if(!await S.confirm('Riattivare l’account di '+u.username+'?','L’utente riceve un avviso e può di nuovo usare Swappr.','Riattiva',false,'Indietro'))return;
    try{await CL.admin.setUser(u.user_id,'active','');S.toast('Account riattivato.');reload();}catch(e){msg.textContent=e.message;}
  },'ghost'));
  else row.appendChild(mk('Sospendi l’account',async()=>{
    const why=await S.ask('Sospendere '+u.username+'?','Motivo (lo legge l’utente)','','Sospendi',300);
    if(!why)return;
    try{await CL.admin.setUser(u.user_id,'suspended',why);S.toast('Account sospeso.');reload();}catch(e){msg.textContent=e.message;}
  },'danger'));
  c.append(row,msg);return c;
}
function users(box){
  const f=el('form','adm-bar'),i=input(60),res=el('div');
  i.type='search';
  const go=el('button','btn small','Cerca');go.type='submit';
  f.append(field('adm-uq','Nome utente o email (le prime lettere)',i),go);
  box.append(f,res);
  const run=async()=>{
    const q=i.value.trim();
    if(q.length<2){res.replaceChildren(el('p','sub','Scrivi almeno due lettere.'));return;}
    res.replaceChildren(el('p','sub','Cerco…'));
    try{
      const r=await CL.admin.findUser(q);res.replaceChildren();
      if(!r.length)res.appendChild(el('div','empty','Nessun utente trovato.'));
      r.forEach(u=>res.appendChild(userCard(u,run)));
    }catch(e){res.replaceChildren(el('p','msg',e.message));}
  };
  f.onsubmit=e=>{e.preventDefault();run();};
}

/* ---------------- impostazioni ---------------- */
function setting(key,label,value,multi,ph,help){
  const c=el('section','panel'),i=multi?area(500,4,ph):input(500,ph),msg=msgEl();
  i.value=value||'';
  c.appendChild(field('st-'+key,label,i));
  if(help)c.appendChild(el('p','kvline',help));
  const b=mk('Salva',async()=>{
    msg.textContent='';b.disabled=true;
    try{await CL.admin.setSetting(key,i.value);msg.textContent='Salvato.';}
    catch(e){msg.textContent=e.message;}
    b.disabled=false;
  });
  b.style.marginTop='12px';c.append(b,msg);return c;
}
function settings(box){
  load(box,()=>CL.admin.overview(),o=>{
    const s=o.settings||{};
    box.appendChild(el('p','sub','Queste informazioni le vedono gli utenti, nella pagina Scambi, quando uno scambio è accettato.'));
    box.appendChild(setting('ship_to','Indirizzo di spedizione di Swappr',s.ship_to,true,'Swappr, Nome Cognome\nVia Roma 1\n20100 Milano (MI)\nItalia','Scrivilo come lo scriveresti su un pacco. Va a capo come lo scrivi qui.'));
    box.appendChild(setting('ship_note','Istruzioni per chi spedisce (facoltative)',s.ship_note,false,'Spedizione tracciata, carte in bustina e busta rigida.'));
  });
}

/* ---------------- registro ---------------- */
const ACT={trade_status:'Scambio',report_dismiss:'Segnalazione archiviata',report_suspend:'Segnalazione, utente sospeso',user_suspended:'Utente sospeso',user_active:'Utente riattivato',setting:'Impostazione modificata'};
function log(box){
  load(box,()=>CL.admin.log(100),rows=>{
    if(!rows.length){box.appendChild(el('div','empty','Ancora nessuna azione registrata.'));return;}
    rows.forEach(r=>{
      const it=el('div','item'),tx=el('span','tx');
      tx.appendChild(el('span','',(ACT[r.action]||r.action)+(r.details?': '+r.details:'')));
      tx.appendChild(el('small','',dt(r.created_at)+', '+r.who+', '+String(r.target||'').slice(0,36)));
      it.appendChild(tx);box.appendChild(it);
    });
  });
}

/* ---------------- pagina ---------------- */
function wall(text){
  const e=el('div','empty',text),row=el('div','row');row.style.cssText='justify-content:center;margin-top:14px';
  const a=el('a','btn small','Accedi'),b=el('a','btn small ghost','Torna alla home');a.href='profilo.html';b.href='index.html';row.append(a,b);e.append(document.createElement('br'),row);app.appendChild(e);
}
async function main(){
  app.replaceChildren(el('h1','','Staff'));
  if(!CL.on){app.appendChild(el('div','notice',CL.problem||'Il collegamento a Supabase non è attivo: compila swappr-config.js (vedi LEGGIMI.txt).'));return;}
  if(!CL.user){wall('Accedi con l’account dello staff per usare questa pagina.');return;}
  if(!CL.isStaff){try{await CL.refresh();}catch(e){}} /* i dati in memoria possono essere di pochi secondi fa: se hai appena ricevuto l'accesso staff, li riscarico */
  if(!CL.isStaff){
    const e=el('div','empty','Questa pagina è riservata allo staff di Swappr.'),row=el('div','row');row.style.cssText='justify-content:center;margin-top:14px';
    const b=el('a','btn small ghost','Torna alla home');b.href='index.html';row.appendChild(b);e.append(document.createElement('br'),row);app.appendChild(e);return;
  }
  const tabs=el('div','tabs scroll'),body=el('div');
  const draw={panoramica:overview,scambi:trades,segnalazioni:reports,utenti:users,impostazioni:settings,registro:log};
  const btn={};
  function go(tab){
    if(!draw[tab])tab='panoramica';
    st.tab=tab;TABS.forEach(t=>btn[t[0]].setAttribute('aria-selected',String(t[0]===tab)));
    try{history.replaceState(null,'','#'+tab);}catch(e){}
    body.replaceChildren();draw[tab](body,go);
  }
  TABS.forEach(t=>{const b=el('button','tab',t[1]);b.type='button';b.onclick=()=>go(t[0]);btn[t[0]]=b;tabs.appendChild(b);});
  app.append(tabs,body);
  go(location.hash.slice(1)||'panoramica');
}
S.start(main);
