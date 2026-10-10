// Traduzione IT -> EN: sostituisce i testi italiani con quelli inglesi (anche su contenuti creati dopo).
(function(){
var D={
"Cerca":"Search","Scambi":"Trades","Profilo":"Profile","Catalogo":"Catalog","Cambia lingua":"Change language",
"© 2026 Swappr. Tutti i diritti riservati.":"© 2026 Swappr. All rights reserved.",
"Informativa privacy":"Privacy policy","informativa privacy":"privacy policy","Binder (anteprima)":"Binder (preview)",
"Swappr - La Piattaforma per lo Swap di Carte Collezionabili":"Swappr - The Trading Card Swap Platform",
"Il tuo Binder - Swappr":"Your Binder - Swappr","Cerca carte - Swappr":"Search cards - Swappr","Match equi - Swappr":"Fair matches - Swappr","Scambi - Swappr":"Trades - Swappr","Profilo - Swappr":"Profile - Swappr","Catalogo Pokémon - Swappr":"Pokémon Catalog - Swappr","Informativa privacy - Swappr":"Privacy policy - Swappr",
"Trova le carte che cerchi,":"Find the cards you need,","scambia i tuoi doppi.":"swap your duplicates.",
"La piattaforma dedicata ai collezionisti per scambiare carte Pokémon, Yu-Gi-Oh!, Magic, One Piece, Lorcana e sportive in modo semplice, trasparente e alla pari.":"The platform for collectors to swap Pokémon, Yu-Gi-Oh!, Magic, One Piece, Lorcana and sports cards in a simple, transparent and fair way.",
"La tua email per la Beta":"Your email for the Beta","Indirizzo email":"Email address","Unisciti":"Join",
"Acconsento al trattamento della mia email per ricevere l'invito alla Beta e aggiornamenti su Swappr, come descritto nell'":"I agree to the processing of my email to receive the Beta invitation and Swappr updates, as described in the",
"🎁 I primi 500 iscritti otterranno il badge Founder e vantaggi esclusivi":"🎁 The first 500 sign-ups get the Founder badge and exclusive perks",
"⚽ Carte Sportive":"⚽ Sports Cards",
"Come funziona Swappr":"How Swappr works",
"Carica il tuo Binder":"Upload your Binder","Aggiungi le carte che vuoi scambiare specificando gioco, espansione, condizioni (NM, EX...) e rarità.":"Add the cards you want to swap, specifying game, set, condition (NM, EX...) and rarity.",
"Trova il Match Equo":"Find the Fair Match","I listini di mercato ti aiutano a proporre e ricevere proposte di scambio bilanciate.":"Market price lists help you offer and receive balanced trade proposals.",
"Concludi lo scambio":"Complete the trade","Conferma lo scambio, spedisci con tracciamento o concorda l'incontro e completa la tua collezione!":"Confirm the trade, ship with tracking or arrange a meetup, and complete your collection!",
"🃏 Tutti i principali TCG":"🃏 All the major TCGs","Supporto a Pokémon, Magic: The Gathering, Yu-Gi-Oh!, One Piece, Lorcana e carte sportive.":"Support for Pokémon, Magic: The Gathering, Yu-Gi-Oh!, One Piece, Lorcana and sports cards.",
"🛡️ Fiducia & Trasparenza":"🛡️ Trust & Transparency","Profili verificati e recensioni tra utenti per scambiare con più tranquillità.":"Verified profiles and user reviews for peace of mind.",
"📊 Valutazioni di Mercato":"📊 Market Valuations","Prezzi di riferimento per aiutarti a proporre scambi equilibrati.":"Reference prices to help you propose balanced trades.",
"Domande Frequenti":"FAQ","Come vengono valutati gli scambi?":"How are trades valued?",
"Ci basiamo sui listini di mercato per stimare il valore delle carte coinvolte e aiutarti a capire se una proposta è equilibrata.":"We rely on market price lists to estimate the value of the cards involved and help you see whether a proposal is balanced.",
"Come funziona la protezione contro le truffe?":"How does scam protection work?",
"Puntiamo su verifica dei profili e recensioni tracciate, e stiamo lavorando a strumenti di tutela per le spedizioni, in modo che entrambe le parti ricevano quanto concordato. I dettagli saranno comunicati al lancio della Beta.":"We focus on profile verification and tracked reviews, and we are working on shipping protection tools so both sides receive what was agreed. Details will be shared at Beta launch.",
"Quando sarà disponibile la Beta?":"When will the Beta be available?",
"Stiamo rifinendo gli ultimi dettagli. Gli iscritti alla lista d'attesa riceveranno l'invito prioritario per accedere prima del lancio ufficiale.":"We are polishing the final details. Waitlist members will get a priority invitation before the official launch.",
"Il tuo Binder":"Your Binder",
"Elenca le carte che hai in doppio e quelle che ti mancano. Saranno la base per trovare scambi equilibrati.":"List your duplicates and the cards you are missing. They are the basis for finding balanced trades.",
"Riepilogo":"Summary","Carte che possiedi":"Cards you own","Carte che cerchi":"Cards you want","Giochi nel binder":"Games in binder",
"Carte che ho":"Cards I have","Carte che cerco":"Cards I want","Aggiungi una carta":"Add a card",
"Nome della carta":"Card name","Gioco":"Game","Espansione":"Set","Rarità":"Rarity","Condizioni":"Condition","Quantità":"Quantity",
"Es. Charizard":"E.g. Charizard","Es. Base Set":"E.g. Base Set","Es. Holo Rare":"E.g. Holo Rare","Carte sportive":"Sports cards",
"Aggiungi al binder":"Add to binder","Svuota campi":"Clear fields","Tutti i giochi":"All games","Filtra per gioco":"Filter by game","Rimuovi":"Remove",
"Il tuo binder è vuoto. Aggiungi le carte che hai in doppio con il modulo qui sopra.":"Your binder is empty. Add your duplicates using the form above.",
"Non hai ancora indicato nessuna carta. Aggiungi quelle che ti mancano per completare la collezione.":"You have not listed any cards yet. Add the ones you are missing to complete your collection.",
"Nessuna carta per questo gioco. Scegli un altro filtro o aggiungine una.":"No cards for this game. Pick another filter or add one.",
"Cerca carte":"Search cards",
"Cerca una carta Pokémon, guarda il prezzo di riferimento e aggiungila al tuo binder con un clic.":"Search for a Pokémon card, check the reference price and add it to your binder in one click.",
"La ricerca usa il servizio pubblico Pokémon TCG API. Gli altri giochi arriveranno in seguito. I prezzi sono indicativi (media Cardmarket, in euro, quando disponibile).":"Search uses the public Pokémon TCG API. Other games will follow. Prices are indicative (Cardmarket average, in euros, when available).",
"Ricerca in corso…":"Searching…","Nessuna carta trovata. Prova con un altro nome (in inglese, ad esempio Pikachu).":"No cards found. Try another name (in English, e.g. Pikachu).",
"Non riesco a contattare il servizio carte in questo momento. Riprova tra poco, oppure aggiungi la carta a mano dal Binder.":"Cannot reach the card service right now. Try again shortly, or add the card manually from the Binder.",
"Non riesco a contattare il servizio carte in questo momento. Riprova tra poco.":"Cannot reach the card service right now. Try again shortly.",
"Ho questa":"I have this","La cerco":"I want this","Prezzo non disponibile":"Price not available",
"Impossibile salvare: controlla le impostazioni del browser.":"Could not save: check your browser settings.",
"Catalogo Pokémon":"Pokémon Catalog",
"Sfoglia tutte le espansioni e le carte Pokémon, segna quelle che hai e controlla il prezzo su Cardmarket.":"Browse every Pokémon set and card, mark the ones you own and check the price on Cardmarket.",
"Dati dalla Pokémon TCG API: l'elenco si carica in tempo reale e dipende dalla disponibilità del servizio.":"Data from the Pokémon TCG API: the list loads in real time and depends on the service being available.",
"Filtra per nome":"Filter by name","Mostra carte":"Show cards","Caricamento…":"Loading…","← Precedente":"← Previous","Successiva →":"Next →",
"✓ Ce l'hai":"✓ You have it","Servizio non disponibile":"Service unavailable","Nessuna carta trovata per questa ricerca.":"No cards found for this search.",
"Match equi":"Fair matches",
"Swappr confronta le carte che hai in doppio con quelle che cercano gli altri collezionisti e viceversa, e valuta se lo scambio è equilibrato.":"Swappr compares your duplicates with what other collectors want and vice versa, and checks whether the trade is balanced.",
"Anteprima: i collezionisti qui sotto sono utenti dimostrativi con prezzi indicativi, non persone reali. Uno scambio è considerato equo se la differenza di valore è entro il 15%.":"Preview: the collectors below are demo users with indicative prices, not real people. A trade is considered fair if the value difference is within 15%.",
"Carica carte di esempio nel binder":"Load sample cards into the binder","Carte di esempio aggiunte al binder.":"Sample cards added to the binder.",
"Per ora nessun match con gli utenti dimostrativi. Aggiungi più carte Pokémon al binder o prova le carte di esempio.":"No matches with the demo users yet. Add more Pokémon cards to the binder or try the sample cards.",
"Il tuo binder è vuoto. Aggiungi delle carte dalla pagina Cerca o dal Binder, oppure carica le carte di esempio.":"Your binder is empty. Add cards from the Search page or the Binder, or load the sample cards.",
"Equo":"Fair","Prezzo mancante":"Missing price","Utente dimostrativo":"Demo user","Proponi scambio":"Propose trade",
"I tuoi scambi":"Your trades",
"Segui lo stato di ogni scambio e usa la chat per accordarti su spedizione o incontro.":"Follow each trade's status and use the chat to agree on shipping or a meetup.",
"Anteprima: la chat e gli stati restano su questo dispositivo, perché gli altri collezionisti non sono ancora collegati. Con il database i messaggi arriveranno davvero all'altra persona.":"Preview: chat and statuses stay on this device because other collectors are not connected yet. With the database, messages will really reach the other person.",
"Elenco scambi":"Trades list","Nessuno scambio.":"No trades.","Vai ai Match":"Go to Matches",
"Proposta":"Proposal","Accettato":"Accepted","Spedito":"Shipped","Completato":"Completed","Annullato":"Cancelled",
"Seleziona uno scambio per vedere i dettagli.":"Select a trade to see the details.","Annulla scambio":"Cancel trade","Annullare questo scambio?":"Cancel this trade?",
"Invia":"Send","Scrivi un messaggio…":"Write a message…","Messaggio":"Message","Scambio annullato.":"Trade cancelled.",
"Il tuo profilo":"Your profile",
"Crea il tuo profilo da collezionista: è il nome con cui comparirai negli scambi.":"Create your collector profile: it is the name you will appear under in trades.",
"Modalità anteprima: il profilo è salvato solo su questo dispositivo, senza password. Per attivare i veri account compila swappr-config.js con i dati di Supabase.":"Preview mode: the profile is saved only on this device, without a password. To enable real accounts, fill in swappr-config.js with your Supabase details.",
"Accedi o crea un account: i dati dell'account sono gestiti da Supabase.":"Log in or create an account: account data is managed by Supabase.",
"Nome utente":"Username","Città (facoltativa)":"City (optional)","Gioco principale":"Main game",
"Salva profilo":"Save profile","Modifica profilo":"Edit profile","Elimina profilo locale":"Delete local profile","Esci":"Log out",
"Registrati":"Sign up","Accedi":"Log in","Crea il profilo":"Create your profile","Modifica il profilo":"Edit your profile",
"Crea il tuo account":"Create your account","Accedi al tuo account":"Log in to your account",
"Eliminare il profilo da questo dispositivo? Binder e scambi restano salvati.":"Delete the profile from this device? Binder and trades stay saved.",
"Profilo salvato.":"Profile saved.","Il nome utente deve avere almeno 3 caratteri.":"The username must be at least 3 characters.",
"Controlla la tua email per confermare l'account, poi accedi.":"Check your email to confirm your account, then log in."
};
var P=[
[/^“(.+)” aggiunta a «(.+)»\.$/,function(m){return'“'+m[1]+'” added to «'+T(m[2])+'».';}],
[/^Scambio con (.+)$/,function(m){return'Trade with '+m[1];}],
[/^Tu dai: (.+)$/,function(m){return'You give: '+m[1];}],
[/^Tu ricevi: (.+)$/,function(m){return'You receive: '+m[1];}],
[/^Tu aggiungi (.+)$/,function(m){return'You add '+m[1];}],
[/^L'altro aggiunge (.+)$/,function(m){return'The other adds '+m[1];}],
[/^Prezzo medio: (.+)$/,function(m){return'Average price: '+m[1];}],
[/^Prezzo: (.+) \$ \(non usato nel match\)$/,function(m){return'Price: '+m[1]+' $ (not used in matching)';}],
[/^Segna come: (.+)$/,function(m){return'Mark as: '+T(m[1]);}],
[/^Stato aggiornato: (.+)\.$/,function(m){return'Status updated: '+T(m[1])+'.';}],
[/^(Proposta|Accettato|Spedito|Completato|Annullato) · (.+)$/,function(m){return T(m[1])+' · '+m[2];}],
[/^Pagina (\d+) di (\d+)$/,function(m){return'Page '+m[1]+' of '+m[2];}],
[/^Gioco principale: (.+)$/,function(m){return'Main game: '+m[1];}],
[/^Nel tuo binder: (\d+) carte di questa espansione su (\d+)$/,function(m){return'In your binder: '+m[1]+' cards from this set out of '+m[2];}],
[/^Hai già uno scambio aperto con (.+)\. Lo trovi in «Scambi»\.$/,function(m){return'You already have an open trade with '+m[1]+'. Find it in «Trades».';}],
[/^Proposta creata con (.+)\. Continua in «Scambi»\.$/,function(m){return'Proposal created with '+m[1]+'. Continue in «Trades».';}]
];
function T(s){
  var k=s.trim();if(!k)return s;
  if(Object.prototype.hasOwnProperty.call(D,k))return s.replace(k,function(){return D[k];});
  for(var i=0;i<P.length;i++){var m=k.match(P[i][0]);if(m){var v=P[i][1](m);return s.replace(k,function(){return v;});}}
  return s;
}
window.SWAPPR_I18N={D:D,P:P,T:T};
if(typeof document==='undefined')return;
if(window.Swappr)window.Swappr.t=T;
document.title=T(document.title);
var ATTR=['placeholder','aria-label','title','alt'];
function walk(n){
  if(n.nodeType===3){var t=T(n.nodeValue);if(t!==n.nodeValue)n.nodeValue=t;return;}
  if(n.nodeType!==1||/^(SCRIPT|STYLE|TEXTAREA)$/.test(n.nodeName))return;
  ATTR.forEach(function(a){if(n.hasAttribute(a)){var v=n.getAttribute(a),t=T(v);if(t!==v)n.setAttribute(a,t);}});
  for(var c=n.firstChild;c;c=c.nextSibling)walk(c);
}
walk(document.body);
new MutationObserver(function(ms){ms.forEach(function(m){if(m.type==='characterData')walk(m.target);m.addedNodes.forEach(walk);});}).observe(document.body,{childList:true,subtree:true,characterData:true});
})();
