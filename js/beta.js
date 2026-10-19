const S=Swappr;
S.langButton(document.getElementById('langslot'));S.themeButton(document.getElementById('themeslot'));
const art=document.getElementById('art');art.innerHTML=S.binderArt(14);
art.querySelectorAll('.bp.on').forEach((r,i)=>{r.style.animationDelay=(160+i*70)+'ms';});
