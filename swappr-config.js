// Collegamento al database Supabase di Swappr (progetto "swappr", server in Europa - Francoforte).
// L'indirizzo e la chiave "publishable" sono PUBBLICI per natura: finiscono in ogni browser.
// La sicurezza dei dati non dipende dal nasconderli, ma dalle regole del database (supabase/schema.sql).
// Non incollare mai qui una chiave segreta (sb_secret_... oppure service_role): il sito la rifiuta.
// Per tornare alla modalità locale di prova lascia vuoti i due valori.
window.SWAPPR_CONFIG = {
  SUPABASE_URL: 'https://fqymxshbcorrerigivnl.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_v0WkptLnAzxiGX0F_xsAQw_lBMVCYrJ'
};
