const S=Swappr,el=S.el,CL=S.cloud,app=document.getElementById('app');
const mk=(t,fn,cls)=>{const b=el('button','btn small'+(cls?' '+cls:''),t);b.type='button';b.onclick=fn;return b;};
const msgEl=()=>{const m=el('p','msg');m.setAttribute('role','status');m.setAttribute('aria-live','polite');m.style.margin='10px 0';return m;};
const save=(name,data)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();a.remove();};
app.appendChild(el('h1','','Impostazioni'));
app.appendChild(el('h2','sec','Lingua'));
const tabs=el('div','tabs');
[['it','Italiano'],['en','English']].forEach(([l,n])=>{const b=el('button','tab',n);b.type='button';b.setAttribute('aria-selected',String(S.lang===l));b.onclick=()=>{if(S.lang!==l)S.setLang(l);};tabs.appendChild(b);});
app.appendChild(tabs);
app.appendChild(el('h2','sec','Tema'));
const th=el('div','tabs');
function drawTheme(){th.replaceChildren();[['light','Chiaro'],['dark','Scuro'],['auto','Automatico']].forEach(([v,n])=>{const b=el('button','tab',n);b.type='button';b.setAttribute('aria-selected',String(S.themePref()===v));b.onclick=()=>{S.setTheme(v);drawTheme();};th.appendChild(b);});}
drawTheme();app.appendChild(th);
app.appendChild(el('h2','sec','Informazioni'));
[['Come funziona la verifica','verifica.html'],['Guida alle condizioni','guida.html'],['Termini e Condizioni','termini.html'],['Informativa privacy','privacy.html'],['Iscriviti alla Beta','beta.html'],['Cardmarket','https://www.cardmarket.com/'+S.lang+'/Pokemon']].forEach(([t,h])=>{
  const ext=h.startsWith('https'),a=el('a','item'),tx=el('span','tx'),ic=el('span','ic');
  a.href=h;tx.appendChild(el('span','',t));ic.innerHTML=ext?S.IC.ext:S.IC.chevr;a.append(tx,ic);
  if(ext){a.target='_blank';a.rel='noopener noreferrer';}
  app.appendChild(a);
});
const rest=el('div');app.appendChild(rest);

/* backup dei dati salvati nel browser (senza account) */
function localData(box){
  box.appendChild(el('h2','sec','Dati'));
  box.appendChild(el('p','sub','I tuoi binder, la wishlist, gli scambi e i messaggi sono salvati solo su questo dispositivo: fai ogni tanto un backup.'));
  const msg=msgEl(),row=el('div','row');row.style.marginTop='12px';
  const imp=document.createElement('input');imp.type='file';imp.accept='.json,application/json';imp.hidden=true;imp.setAttribute('aria-label','Importa backup');
  imp.onchange=e=>{
    const f=e.target.files[0];e.target.value='';if(!f)return;
    if(f.size>5e6){msg.textContent='File non valido: scegli un backup scaricato da Swappr.';return;}
    const r=new FileReader();
    r.onload=async()=>{
      let o;try{o=JSON.parse(r.result);if(!o||o.app!=='swappr')throw 0;}catch(err){msg.textContent='File non valido: scegli un backup scaricato da Swappr.';return;}
      if(!await S.confirm('Sostituire i dati attuali con quelli del backup?','Binder, wishlist, scambi e messaggi attuali vengono sostituiti.','Sostituisci',true))return;
      S.importAll(o);msg.textContent='Backup importato.';
    };
    r.readAsText(f);
  };
  row.append(
    mk('Scarica backup (JSON)',()=>{save('swappr-backup.json',S.exportAll());msg.textContent='Backup scaricato.';}),
    mk('Importa backup',()=>imp.click(),'ghost'),
    mk('Svuota cache carte',()=>{S.clearCache();msg.textContent='Cache svuotata: le carte vengono scaricate di nuovo.';},'ghost'),
    mk('Cancella tutti i dati locali',async()=>{if(!await S.confirm('Cancellare tutti i dati locali?','Binder, wishlist, scambi e messaggi vengono rimossi da questo dispositivo. Non si può annullare.','Cancella tutto',true))return;S.wipe();msg.textContent='Dati locali cancellati.';},'danger'));
  box.append(row,msg,imp);
}

/* con gli account veri */
const SYNC={ok:'Tutto salvato nel tuo account.',pending:'Ci sono modifiche in attesa di essere salvate.',offline:'Sei offline: le modifiche verranno salvate appena torna la connessione.'};
function account(box){
  box.appendChild(el('h2','sec','Account'));
  if(!CL.user){
    box.appendChild(el('p','sub','Non hai effettuato l’accesso. Con un account salvi binder e wishlist online, trovi gli scambi e scrivi agli altri collezionisti.'));
    const row=el('div','row');row.style.marginTop='12px';
    const a=el('a','btn small','Accedi'),b=el('a','btn small ghost','Crea account');a.href='profilo.html';b.href='profilo.html?new=1';row.append(a,b);box.appendChild(row);
    return;
  }
  const u=CL.user,p=el('p','sub','Connesso come ');p.appendChild(el('b','',u.username));if(u.email){p.append(' (');p.appendChild(el('span','',u.email));p.append(')');}box.appendChild(p);
  const st=el('p','sub',CL.sync&&CL.sync.state==='error'?(CL.sync.msg||'Alcune modifiche non sono state salvate.'):(SYNC[(CL.sync&&CL.sync.state)||'ok']||SYNC.ok));st.setAttribute('role','status');st.style.marginTop='6px';box.appendChild(st);
  const msg=msgEl(),row=el('div','row');row.style.marginTop='12px';
  const pr=el('a','btn small ghost','Vai al profilo');pr.href='profilo.html';
  if(CL.isStaff){const ad=el('a','btn small ghost','Area staff');ad.href='admin.html';row.appendChild(ad);}
  row.append(pr,mk('Sincronizza ora',async()=>{msg.textContent='';try{await CL.refresh();st.textContent=SYNC[(CL.sync&&CL.sync.state)||'ok']||SYNC.ok;msg.textContent='Dati aggiornati.';}catch(e){msg.textContent=e.message;}},'ghost'),
    mk('Esci',async()=>{await CL.signOut();location.href='profilo.html';},'ghost'));
  box.append(row,msg);
}
function cloudData(box){
  box.appendChild(el('h2','sec','Dati'));
  box.appendChild(el('p','sub','I tuoi binder, la wishlist, gli scambi e i messaggi sono salvati nel tuo account e si ritrovano su ogni dispositivo.'));
  const msg=msgEl(),row=el('div','row');row.style.marginTop='12px';
  row.append(
    mk('Scarica i miei dati',async()=>{msg.textContent='';try{save('swappr-i-miei-dati.json',await CL.exportData());msg.textContent='Dati scaricati.';}catch(e){msg.textContent=e.message;}},'ghost'),
    mk('Svuota cache carte',()=>{S.clearCache();msg.textContent='Cache svuotata: le carte vengono scaricate di nuovo.';},'ghost'));
  box.append(row,msg);
}
if(!CL.on)localData(rest);
else S.start(()=>{
  account(rest);
  if(CL.user)cloudData(rest);else localData(rest);
});
