const S=Swappr,el=S.el,CL=S.cloud,P=new URLSearchParams(location.search),app=document.getElementById('app'),who=P.get('u');
const btn=(t,fn,cls)=>{const x=el('button','btn small'+(cls?' '+cls:''),t);x.type='button';x.onclick=fn;return x;};
const stat=(n,l)=>{const s=el('span','sub');s.appendChild(el('b','',String(n)));s.append(' ');s.appendChild(el('span','',l));return s;};
const msgEl=()=>{const m=el('p','msg');m.setAttribute('role','status');m.setAttribute('aria-live','polite');return m;};
const colorOf=u=>{const c=u&&(u.color||(u.avatar&&u.avatar.c))||'';return /^#[0-9a-f]{6}$/i.test(c)?c:'';};
function head(u,extra){
  const h=el('div','phead');h.appendChild(S.avatar(u.username,{big:true,color:colorOf(u)}));
  const t=el('div');t.appendChild(el('h1','',u.username));if(extra)t.appendChild(extra);h.appendChild(t);app.appendChild(h);
}
function binders(title,items){
  app.appendChild(el('h2','sec',title));
  if(!items.length){app.appendChild(el('p','sub','Nessun binder.'));return;}
  app.appendChild(S.rail(items.map(i=>S.cover(i[0],i[1],i[2],i[3]))));
}
function wishRail(title,cards,opt){
  app.appendChild(el('h2','sec',title));
  if(!cards.length){app.appendChild(el('p','sub','Nessuna carta.'));return;}
  app.appendChild(S.rail(cards.map(c=>S.tile(c,opt))));
}
function field(label,id,val,max,type,ac){
  const f=el('div','field'),l=el('label','',label);l.htmlFor=id;
  const i=document.createElement(type==='area'?'textarea':'input');i.id=id;if(type&&type!=='area')i.type=type;if(max)i.maxLength=max;i.value=val||'';if(ac)i.autocomplete=ac;
  f.append(l,i);return[f,i];
}
function swatches(cur,onPick){
  const sw=el('div','sws');
  S.AVC.forEach((c,k)=>{const b=el('button');b.type='button';b.style.background=c;b.setAttribute('aria-label',S.AVN[k]);b.setAttribute('aria-pressed',String(cur===c));b.onclick=()=>{onPick(c);sw.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));};sw.appendChild(b);});
  return sw;
}

/* =============== SENZA ACCOUNT VERI: profilo salvato su questo dispositivo =============== */
const nameError=n=>!/^[A-Za-z0-9_]{3,20}$/.test(n)?'Almeno 3 caratteri: lettere, numeri e _.':(S.DEMO.some(u=>u.u.toLowerCase()===n.toLowerCase())?'Questo nome è già preso.':'');
function wizard(old){
  app.replaceChildren();
  const st={username:old?old.username:'',avatar:{c:colorOf(old)||S.AVC[0]},city:old&&old.city||'',bio:old&&old.bio||''},total=3;let step=1;
  app.appendChild(el('h1','',old?'Modifica profilo':'Crea il profilo'));
  if(!old)app.appendChild(el('div','notice','Modalità anteprima: il profilo è salvato solo su questo dispositivo, senza password. Per attivare i veri account compila swappr-config.js con i dati di Supabase.'));
  const box=el('section','panel');app.appendChild(box);
  function draw(){
    box.replaceChildren();
    const pg=el('div','pg');for(let k=1;k<=total;k++)pg.appendChild(el('span',k<=step?'on':''));box.append(pg,el('p','sub','Passo '+step+' di '+total));
    const m=msgEl();let next=()=>'';
    if(step===1){
      box.append(el('h2','','Come ti chiami?'),el('p','sub','Scegli il tuo nome utente: lo vedranno gli altri collezionisti.'));
      const[f,i]=field('Nome utente','un',st.username,20);i.autocomplete='off';f.style.marginTop='14px';box.appendChild(f);
      i.oninput=()=>{st.username=i.value.trim();m.textContent='';};
      next=()=>nameError(st.username);
    }else if(step===2){
      box.appendChild(el('h2','','Scegli il colore del tuo avatar'));
      const pv=el('div');pv.style.margin='14px 0 4px';pv.appendChild(S.avatar(st.username||'?',{big:true,color:st.avatar.c}));box.appendChild(pv);
      const sw=el('div','sws');
      S.AVC.forEach((c,k)=>{const b=el('button');b.type='button';b.style.background=c;b.setAttribute('aria-label',S.AVN[k]);b.setAttribute('aria-pressed',String(st.avatar.c===c));b.onclick=()=>{st.avatar.c=c;draw();};sw.appendChild(b);});
      box.appendChild(sw);
    }else{
      box.appendChild(el('h2','',"Un po' di te"));
      const grid=el('div','form-grid');grid.style.marginTop='14px';
      const[fc,ic]=field('Città (facoltativa)','ct',st.city,40);ic.oninput=()=>{st.city=ic.value;};grid.appendChild(fc);box.appendChild(grid);
      const[fb,ib]=field('Descrizione (facoltativa)','bio',st.bio,140,'area');const cnt=el('p','sub',st.bio.length+'/140');ib.oninput=()=>{st.bio=ib.value;cnt.textContent=ib.value.length+'/140';};fb.style.marginTop='12px';box.append(fb,cnt);
    }
    const act=el('div','actions');
    if(step>1)act.appendChild(btn('Indietro',()=>{step--;draw();},'ghost'));
    act.appendChild(btn(step<total?'Avanti':(old?'Salva profilo':'Crea il profilo'),()=>{
      const e=next();if(e){m.textContent=e;return;}
      if(step<total){step++;draw();return;}
      S.set('user',Object.assign({},old||{},{created:(old&&old.created)||Date.now()},{username:st.username,city:st.city.trim().slice(0,40),bio:st.bio.trim().slice(0,140),avatar:st.avatar}));
      location.href='profilo.html';
    }));
    act.appendChild(m);box.appendChild(act);
  }
  draw();
}
async function logoutLocal(){
  if(!await S.confirm('Eliminare il profilo da questo dispositivo?','Binder e scambi restano salvati.','Elimina profilo',true))return;
  try{localStorage.removeItem('swappr-user-v1');}catch(e){}
  location.href='profilo.html';
}
function firstSteps(){
  stepsList([['Aggiungi una carta alla wishlist','wishlist.html',S.wish().length>0],['Metti una carta nel tuo binder di scambio','binder.html',Object.keys(S.haveCards()).length>0],['Guarda i tuoi match','scambi.html',S.matches().length>0||S.trades().length>0]]);
}
function stepsList(items){
  if(items.every(i=>i[2]))return;
  app.appendChild(el('h2','sec','Primi passi'));
  items.forEach(i=>{const a=el('a','item');a.href=i[1];const tx=el('span','tx');tx.appendChild(el('span','',i[0]));const c=el('span','chk'+(i[2]?' on':''));if(i[2])c.innerHTML=S.IC.check;a.append(c,tx);app.appendChild(a);});
}
function mineLocal(){
  const me=S.me();if(!me)return wizard();
  if(CL.problem)app.appendChild(el('div','notice',CL.problem));
  const st=el('div','row');st.style.gap='18px';st.append(stat(0,'Follower'),stat(S.follows().length,'Segui'));
  head(me,st);
  if(me.city||me.bio){const t=el('div');if(me.city)t.appendChild(el('p','sub',me.city));if(me.bio)t.appendChild(el('p','',me.bio));t.style.margin='8px 0 4px';app.appendChild(t);}
  const act=el('div','row');act.style.margin='12px 0';
  act.append(btn('Modifica profilo',()=>wizard(me),'ghost'),btn('Elimina profilo locale',logoutLocal,'danger'));app.appendChild(act);
  firstSteps();
  binders('I miei binder',S.binders().map(b=>[b.name,b.cards.reduce((s,e)=>s+e.qty,0),b.cards.length,'binder.html?b='+b.id]));
  wishRail('La mia wishlist',S.wish(),{onWish:()=>location.reload()});
}
async function demo(u){
  head({username:u.u},el('span','tag info','Utente di esempio'));
  const f=S.follows().includes(u.u),act=el('div','row');act.style.margin='12px 0';
  act.append(btn(f?'Non seguire più':'Inizia a seguire',()=>{S.toggleFollow(u.u);location.reload();},f?'ghost':''));
  const m=el('a','btn small ghost','Scrivi');m.href='messaggi.html?c='+encodeURIComponent(u.u);act.appendChild(m);app.appendChild(act);
  binders('Binder',u.b.map((b,i)=>[S.demoName(b[0]),b[1].length,b[1].length,'binder.html?u='+encodeURIComponent(u.u)+'&b='+i]));
  let mp={};try{mp=await S.byIds(u.w);}catch(e){}
  wishRail('Wishlist',u.w.map(id=>mp[id]).filter(Boolean));
}

/* =============== CON GLI ACCOUNT VERI (Supabase) =============== */
function authScreen(tab){
  tab=tab||(P.get('new')?'new':'in');
  app.replaceChildren();
  app.appendChild(el('h1','',tab==='new'?'Crea il tuo account':'Accedi'));
  const t=el('div','tabs');
  [['in','Accedi'],['new','Crea account']].forEach(([k,n])=>{const b=el('button','tab',n);b.type='button';b.setAttribute('aria-selected',String(k===tab));b.onclick=()=>authScreen(k);t.appendChild(b);});
  app.appendChild(t);
  if(who)app.appendChild(el('div','notice','Per vedere i profili degli altri collezionisti serve un account.'));
  tab==='new'?signupForm():loginForm();
}
function loginForm(){
  const box=el('section','panel'),f=el('form'),g=el('div','form-grid');
  const[fe,ie]=field('Email','email','',120,'email','email'),[fp,ip]=field('Password','pw','',72,'password','current-password');
  ie.required=true;ip.required=true;g.append(fe,fp);f.appendChild(g);
  const act=el('div','actions'),go=el('button','btn','Accedi'),m=msgEl();go.type='submit';act.append(go,m);f.appendChild(act);
  const fg=el('a','sub','Password dimenticata?');fg.href='#';fg.style.display='inline-block';fg.style.marginTop='14px';fg.onclick=e=>{e.preventDefault();forgotForm(ie.value);};
  f.appendChild(fg);
  const extra=el('div');f.appendChild(extra);
  f.onsubmit=async e=>{
    e.preventDefault();m.textContent='';extra.replaceChildren();go.disabled=true;
    try{await CL.signIn(ie.value,ip.value);location.href='profilo.html';}
    catch(err){
      m.textContent=err.message;go.disabled=false;
      if(err.code==='email_not_confirmed'){
        const rs=btn('Invia di nuovo l’email di conferma',async()=>{rs.disabled=true;try{await CL.resend(ie.value);m.textContent='Email inviata: controlla la posta.';}catch(e2){m.textContent=e2.message;}rs.disabled=false;},'ghost');
        rs.style.marginTop='12px';extra.appendChild(rs);
      }
    }
  };
  box.appendChild(f);app.appendChild(box);
}
function forgotForm(email){
  app.replaceChildren();app.appendChild(el('h1','','Recupera la password'));
  const box=el('section','panel'),f=el('form');
  box.appendChild(el('p','sub','Scrivi l’email del tuo account: ti mandiamo un link per scegliere una nuova password.'));
  const[fe,ie]=field('Email','email',email||'',120,'email','email');ie.required=true;fe.style.marginTop='14px';f.appendChild(fe);
  const act=el('div','actions'),go=el('button','btn','Invia il link'),m=msgEl(),bk=btn('Indietro',()=>authScreen('in'),'ghost');go.type='submit';act.append(bk,go,m);f.appendChild(act);
  f.onsubmit=async e=>{
    e.preventDefault();m.textContent='';go.disabled=true;
    try{await CL.recover(ie.value);m.textContent='Se l’indirizzo è registrato, tra poco arriva un’email con il link. Controlla anche lo spam.';}
    catch(err){m.textContent=err.message;}
    go.disabled=false;
  };
  box.appendChild(f);app.appendChild(box);
}
function signupForm(){
  const st={color:S.AVC[0]},box=el('section','panel'),f=el('form');
  const[fu,iu]=field('Nome utente','un','',20,'text','username'),[fe,ie]=field('Email','email','',120,'email','email'),[fp,ip]=field('Password','pw','',72,'password','new-password'),[fc,ic]=field('Città (facoltativa)','ct','',40,'text','address-level2');
  iu.autocapitalize='off';iu.spellcheck=false;iu.required=true;ie.required=true;ip.required=true;ip.minLength=8;
  if(CL.legacyName&&/^[A-Za-z0-9_]{3,20}$/.test(CL.legacyName))iu.value=CL.legacyName;
  const um=msgEl();um.style.minHeight='0';
  iu.onblur=async()=>{
    const v=iu.value.trim();um.textContent='';if(!v)return;
    if(!/^[A-Za-z0-9_]{3,20}$/.test(v)){um.textContent='Nome utente non valido: da 3 a 20 caratteri tra lettere, numeri e _.';return;}
    try{um.textContent=(await CL.usernameFree(v))?'Nome disponibile.':'Questo nome utente è già in uso.';}catch(e){}
  };
  fu.appendChild(um);const g1=el('div','form-grid');g1.append(fu,fe);const g2=el('div','form-grid');g2.style.marginTop='12px';g2.append(fp,fc);
  f.append(g1,g2,el('p','sub','La password deve avere almeno 8 caratteri.'));
  const cl=el('p','sub','Colore del tuo avatar');cl.style.marginTop='14px';f.append(cl,swatches(st.color,c=>{st.color=c;}));
  const cw=el('label','consent'),cb=document.createElement('input');cb.type='checkbox';cb.id='consent';
  const tx=el('span'),a1=el('a','','Termini e Condizioni'),a2=el('a','','Informativa privacy');
  a1.href='termini.html';a2.href='privacy.html';[a1,a2].forEach(a=>{a.target='_blank';a.rel='noopener';});
  tx.append('Ho almeno 18 anni e accetto i ',a1,' e l’',a2,'.');cw.append(cb,tx);f.appendChild(cw);
  const act=el('div','actions'),go=el('button','btn','Crea account'),m=msgEl();go.type='submit';act.append(go,m);f.appendChild(act);
  f.onsubmit=async e=>{
    e.preventDefault();m.textContent='';
    if(!cb.checked){m.textContent='Per creare l’account devi accettare i Termini e l’Informativa privacy.';cb.focus();return;}
    go.disabled=true;
    try{
      const r=await CL.signUp({email:ie.value,password:ip.value,username:iu.value,city:ic.value,color:st.color,terms:true});
      if(!r.needsConfirm){location.href='profilo.html';return;}
      box.replaceChildren(el('h2','','Controlla la tua email'),el('p','sub','Ti abbiamo mandato un’email di conferma a:'));
      const em=el('p','',ie.value.trim());em.style.fontWeight='600';em.style.margin='6px 0';
      box.append(em,el('p','sub','Apri il link nel messaggio per attivare l’account, poi accedi. Se non la trovi, guarda anche nello spam.'));
      const m2=msgEl(),rs=btn('Invia di nuovo l’email',async()=>{rs.disabled=true;try{await CL.resend(ie.value);m2.textContent='Email inviata.';}catch(e2){m2.textContent=e2.message;}rs.disabled=false;},'ghost');
      const row=el('div','actions');row.append(rs,btn('Vai all’accesso',()=>authScreen('in')),m2);box.appendChild(row);
    }catch(err){m.textContent=err.message;go.disabled=false;}
  };
  box.appendChild(f);app.appendChild(box);
}
function resetScreen(){
  app.replaceChildren();app.appendChild(el('h1','','Scegli una nuova password'));
  const box=el('section','panel'),f=el('form'),g=el('div','form-grid');
  const[f1,i1]=field('Nuova password','np','',72,'password','new-password'),[f2,i2]=field('Ripeti la password','np2','',72,'password','new-password');
  i1.required=true;i2.required=true;i1.minLength=8;g.append(f1,f2);f.append(g,el('p','sub','Almeno 8 caratteri.'));
  const act=el('div','actions'),go=el('button','btn','Salva la password'),m=msgEl();go.type='submit';act.append(go,m);f.appendChild(act);
  f.onsubmit=async e=>{
    e.preventDefault();m.textContent='';
    if(i1.value!==i2.value){m.textContent='Le due password non coincidono.';return;}
    go.disabled=true;
    try{await CL.setPassword(i1.value);S.toast('Password aggiornata.');location.href='profilo.html';}
    catch(err){m.textContent=err.message;go.disabled=false;}
  };
  box.appendChild(f);app.appendChild(box);
}

function editProfile(){
  const u=CL.user;
  S.modal((d,fin)=>{
    d.appendChild(el('h2','','Modifica profilo'));
    const f=el('form'),st={color:u.color||S.AVC[0]};
    const[fu,iu]=field('Nome utente','e-un',u.username,20,'text','username'),[fc,ic]=field('Città','e-ct',u.city,40,'text','address-level2'),[fb,ib]=field('Descrizione','e-bio',u.bio,140,'area');
    iu.autocapitalize='off';iu.spellcheck=false;fc.style.marginTop='12px';fb.style.marginTop='12px';
    const cl=el('p','sub','Colore del tuo avatar');cl.style.marginTop='12px';
    const m=msgEl(),act=el('div','actions'),no=btn('Annulla',()=>fin(null),'ghost'),go=el('button','btn small','Salva');go.type='submit';act.append(no,go);
    f.append(fu,fc,fb,cl,swatches(st.color,c=>{st.color=c;}),act,m);
    f.onsubmit=async e=>{
      e.preventDefault();m.textContent='';go.disabled=true;
      try{await CL.updateProfile({username:iu.value.trim()===u.username?null:iu.value.trim(),city:ic.value,bio:ib.value,color:st.color});fin(true);location.reload();}
      catch(err){m.textContent=err.message;go.disabled=false;}
    };
    d.appendChild(f);setTimeout(()=>iu.focus(),0);
  });
}
function addressSection(){
  const a=CL.address||{},h=el('h2','sec','Indirizzo di spedizione');h.id='indirizzo';app.appendChild(h);
  app.appendChild(el('p','sub','Serve per spedire e ricevere le carte: lo vede solo Swappr, mai gli altri utenti. Ti serve prima di proporre o accettare uno scambio.'));
  const box=el('section','panel'),f=el('form');
  const[n1,i1]=field('Nome e cognome','ad-name',a.full_name,80,'text','name'),[n2,i2]=field('Via e numero civico','ad-l1',a.line1,100,'text','address-line1'),[n3,i3]=field('Scala, interno… (facoltativo)','ad-l2',a.line2,100,'text','address-line2'),
    [n4,i4]=field('CAP','ad-cap',a.postal_code,12,'text','postal-code'),[n5,i5]=field('Città','ad-city',a.city,60,'text','address-level2'),[n6,i6]=field('Provincia','ad-prov',a.province,40,'text','address-level1'),
    [n7,i7]=field('Paese','ad-co',a.country||'Italia',40,'text','country-name'),[n8,i8]=field('Telefono (facoltativo)','ad-tel',a.phone,30,'tel','tel');
  [i1,i2,i4,i5].forEach(i=>{i.required=true;});
  const g=el('div','form-grid');g.append(n1,n2,n3,n4,n5,n6,n7,n8);f.appendChild(g);
  const act=el('div','actions'),go=el('button','btn','Salva indirizzo'),m=msgEl();go.type='submit';act.append(go);
  if(CL.address)act.appendChild(btn('Rimuovi indirizzo',async()=>{
    if(!await S.confirm('Rimuovere l’indirizzo?','Senza indirizzo non puoi proporre né accettare scambi.','Rimuovi',true))return;
    try{await CL.deleteAddress();location.reload();}catch(err){m.textContent=err.message;}
  },'danger'));
  act.appendChild(m);f.appendChild(act);
  f.onsubmit=async e=>{
    e.preventDefault();m.textContent='';go.disabled=true;
    try{await CL.saveAddress({full_name:i1.value,line1:i2.value,line2:i3.value,postal_code:i4.value,city:i5.value,province:i6.value,country:i7.value,phone:i8.value});m.textContent='Indirizzo salvato.';}
    catch(err){m.textContent=err.message;}
    go.disabled=false;
  };
  box.appendChild(f);app.appendChild(box);
}
function accountSection(){
  const u=CL.user;
  app.appendChild(el('h2','sec','Account e privacy'));
  const box=el('section','panel');
  const em=el('p','sub','Email dell’account: ');em.appendChild(el('b','',u.email));box.appendChild(em);
  const vw=el('label','consent'),vc=document.createElement('input');vc.type='checkbox';vc.checked=u.visible;
  vw.append(vc,el('span','','Mostra il mio profilo, i binder e la wishlist agli altri collezionisti'));
  const vm=msgEl();
  vc.onchange=async()=>{vm.textContent='';try{await CL.updateProfile({visible:vc.checked});vm.textContent=vc.checked?'Il tuo profilo è visibile.':'Il tuo profilo è nascosto: non compari più nelle ricerche né nei match.';}catch(err){vc.checked=!vc.checked;vm.textContent=err.message;}};
  box.append(vw,vm);
  const pw=el('details','acc');pw.style.marginTop='14px';pw.appendChild(el('summary','','Cambia password'));
  const pf=el('form'),pg=el('div','form-grid');const[p1,q1]=field('Nuova password','cp1','',72,'password','new-password');q1.minLength=8;q1.required=true;
  const pm=msgEl(),pb=el('button','btn small','Salva la password');pb.type='submit';pg.appendChild(p1);pf.append(pg,el('p','sub','Almeno 8 caratteri.'));
  const pa=el('div','actions');pa.append(pb,pm);pf.appendChild(pa);
  pf.onsubmit=async e=>{e.preventDefault();pm.textContent='';pb.disabled=true;try{await CL.setPassword(q1.value);q1.value='';pm.textContent='Password aggiornata.';}catch(err){pm.textContent=err.message;}pb.disabled=false;};
  pw.appendChild(pf);box.appendChild(pw);
  if(CL.blocks.length){
    const bh=el('h3','','Utenti bloccati');bh.style.margin='16px 0 6px';box.appendChild(bh);
    CL.blocks.forEach(n=>{const r=el('div','urow'),a=el('a','',n);a.href='profilo.html?u='+encodeURIComponent(n);r.append(S.avatar(n,{sm:true}),a,btn('Sblocca',async()=>{try{await CL.block(n,false);location.reload();}catch(err){S.toast(err.message,true);}},'ghost'));box.appendChild(r);});
  }
  const row=el('div','row');row.style.marginTop='16px';
  const dm=msgEl();
  row.append(
    btn('Scarica i miei dati',async()=>{
      dm.textContent='';
      try{const d=await CL.exportData(),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}));a.download='swappr-i-miei-dati.json';document.body.appendChild(a);a.click();a.remove();dm.textContent='Dati scaricati.';}
      catch(err){dm.textContent=err.message;}
    },'ghost'),
    btn('Elimina il mio account',async()=>{
      if(!await S.confirm('Eliminare il tuo account?','Profilo, binder, wishlist e messaggi vengono cancellati e non si può tornare indietro. Non puoi farlo se hai uno scambio in corso.','Elimina account',true))return;
      try{await CL.deleteAccount();S.toast('Account eliminato.');location.href='index.html';}catch(err){dm.textContent=err.message;}
    },'danger'));
  box.append(row,dm);app.appendChild(box);
}
function termsNotice(){
  if(CL.user.termsAt)return;
  const n=el('div','notice','Per continuare a scambiare devi accettare i Termini e Condizioni e l’Informativa privacy. ');
  const a1=el('a','','Leggi i Termini');a1.href='termini.html';n.appendChild(a1);n.append(' ');
  const ok=btn('Accetto',async()=>{try{await CL.acceptTerms();location.reload();}catch(err){S.toast(err.message,true);}},'');ok.style.marginLeft='6px';n.appendChild(ok);
  app.appendChild(n);
}
function mineCloud(){
  const u=CL.user;app.replaceChildren();
  if(CL.sync&&(CL.sync.state==='offline'||CL.sync.state==='error')&&CL.sync.msg)app.appendChild(el('div','notice',CL.sync.msg));
  if(u.status==='suspended')app.appendChild(el('div','notice','Il tuo account è sospeso: puoi vedere i tuoi dati, ma non puoi più scambiare né scrivere. Contatta Swappr per chiarire.'));
  termsNotice();
  const st=el('div','row');st.style.gap='18px';st.append(stat(CL.followers,'Follower'),stat(S.follows().length,'Segui'));
  head(u,st);
  if(u.city||u.bio){const t=el('div');if(u.city)t.appendChild(el('p','sub',u.city));if(u.bio)t.appendChild(el('p','',u.bio));t.style.margin='8px 0 4px';app.appendChild(t);}
  const act=el('div','row');act.style.margin='12px 0';
  act.append(btn('Modifica profilo',editProfile,'ghost'),btn('Esci',async()=>{await CL.signOut();location.href='profilo.html';},'ghost'));
  if(CL.isStaff){const a=el('a','btn small ghost','Area staff');a.href='admin.html';act.appendChild(a);}
  app.appendChild(act);
  stepsList([['Aggiungi una carta alla wishlist','wishlist.html',S.wish().length>0],['Metti una carta nel tuo binder di scambio','binder.html',Object.keys(S.haveCards()).length>0],['Aggiungi il tuo indirizzo di spedizione','profilo.html#indirizzo',!!CL.address],['Guarda i tuoi match e proponi uno scambio','scambi.html',CL.trades.length>0]]);
  binders('I miei binder',S.binders().map(b=>[b.name,b.cards.reduce((s,e)=>s+e.qty,0),b.cards.length,'binder.html?b='+b.id]));
  wishRail('La mia wishlist',S.wish(),{onWish:()=>location.reload()});
  addressSection();accountSection();
  if(location.hash==='#indirizzo'){const h=document.getElementById('indirizzo');if(h)h.scrollIntoView();}
}
async function otherCloud(name){
  app.replaceChildren();
  app.appendChild(el('p','sub','Carico il profilo…'));
  let p;
  try{p=await CL.profile(name);}catch(err){app.replaceChildren(S.back('index.html','Cerca'),el('div','empty',err.message));return;}
  if(p.is_me){location.replace('profilo.html');return;}
  app.replaceChildren(S.back('index.html','Cerca'));
  if(p.hidden){
    head({username:p.username||name,color:''});
    app.appendChild(el('div','empty',p.blocked?'Hai bloccato questo utente.':(p.private?'Questo profilo è privato.':'Questo profilo non è disponibile.')));
    if(p.blocked){const b=btn('Sblocca',async()=>{try{await CL.block(p.username,false);location.reload();}catch(err){S.toast(err.message,true);}},'ghost');b.style.marginTop='12px';app.appendChild(b);}
    return;
  }
  const st=el('div','row');st.style.gap='18px';st.append(stat(p.followers,'Follower'),stat(p.following_count,'Segui'));
  head({username:p.username,color:p.avatar_color},st);
  if(p.status==='suspended')app.appendChild(el('span','tag warn','Account sospeso'));
  if(p.city||p.bio){const t=el('div');if(p.city)t.appendChild(el('p','sub',p.city));if(p.bio)t.appendChild(el('p','',p.bio));t.style.margin='8px 0 4px';app.appendChild(t);}
  const act=el('div','row');act.style.margin='12px 0';
  const fb=btn(p.following?'Non seguire più':'Inizia a seguire',async()=>{fb.disabled=true;try{await CL.follow(p.username,!p.following);location.reload();}catch(err){S.toast(err.message,true);fb.disabled=false;}},p.following?'ghost':'');
  const wr=el('a','btn small ghost','Scrivi');wr.href='messaggi.html?c='+encodeURIComponent(p.username);
  act.append(fb,btn('Proponi scambio',()=>CL.composeTrade(p.username)),wr,btn('Segnala',()=>CL.reportDialog(p.username),'ghost'),btn('Blocca',async()=>{
    if(await S.confirm('Bloccare '+p.username+'?','Non vedrete più i profili l’uno dell’altro e non potrete scrivervi né proporre scambi.','Blocca',true)){try{await CL.block(p.username,true);location.reload();}catch(err){S.toast(err.message,true);}}
  },'danger'));
  app.appendChild(act);
  binders('Binder',p.binders.map(b=>[b.name,b.cards.reduce((s,e)=>s+e.qty,0),b.cards.length,'binder.html?u='+encodeURIComponent(p.username)+'&b='+b.id]));
  app.appendChild(el('h2','sec','Wishlist'));
  const holder=el('div');app.appendChild(holder);
  if(!p.wishlist.length)holder.appendChild(el('p','sub','Nessuna carta.'));
  else{const cs=await CL.cardsFor(p.wishlist);holder.appendChild(S.rail(cs.map(c=>S.tile(c))));}
}
async function cloudMain(){
  const u=CL.user;
  if(!u){authScreen();return;}
  if(CL.recovery||P.get('reset')==='1'){resetScreen();return;}
  if(who&&who.toLowerCase()!==u.username.toLowerCase()){await otherCloud(who);return;}
  mineCloud();
}
S.start(()=>{
  if(CL.on)return cloudMain();
  const d=who&&S.DEMO.find(x=>x.u===who);
  if(d)return demo(d);
  mineLocal();
});
