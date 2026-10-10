'use strict';
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=CVIcons.icon(el.dataset.icon));
const catalogPartner=document.getElementById('catalogPartner'),catalogSort=document.getElementById('catalogSort'),productSearch=document.getElementById('productSearch');
function cvSearchText(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
renderProducts=function(){
  const q=cvSearchText(document.getElementById('searchInput').value.trim()),partner=catalogPartner.value;
  productSearch.value=document.getElementById('searchInput').value;
  const list=PRODUCTS.filter(p=>(filter==='all'||p.category===filter||filter==='ofertas'&&p.featured)&&(!partner||p.store===partner)&&cvSearchText([p.title,p.subtitle,p.categoryLabel,p.brand,p.store].join(' ')).includes(q));
  if(catalogSort.value==='price')list.sort((a,b)=>(a.price??Infinity)-(b.price??Infinity));
  if(catalogSort.value==='name')list.sort((a,b)=>a.title.localeCompare(b.title,'pt-BR'));
  document.getElementById('productGrid').innerHTML=list.map(productCard).join('');
  document.getElementById('emptyState').classList.toggle('hidden',list.length>0);
  document.getElementById('catalogCount').textContent=`${list.length} ${list.length===1?'achadinho encontrado':'achadinhos encontrados'}${partner?' · '+partner:''}`;
  document.getElementById('catalogReset').hidden=!(q||partner||filter!=='all');
  document.getElementById('productGrid').setAttribute('aria-busy','false');document.getElementById('catalogRetry').hidden=true;document.getElementById('emptyReset').hidden=false;document.getElementById('catalogEmptyTitle').textContent='Ainda não encontramos esse achado.';document.getElementById('catalogEmptyText').textContent='Experimente outro nome, parceiro ou categoria.';
};
productSearch.addEventListener('input',()=>{document.getElementById('searchInput').value=productSearch.value;renderProducts();});
catalogPartner.addEventListener('change',renderProducts);catalogSort.addEventListener('change',renderProducts);
function cvResetCatalog(){document.getElementById('searchInput').value='';productSearch.value='';catalogPartner.value='';setFilter('all');productSearch.focus();}
document.getElementById('catalogReset').addEventListener('click',cvResetCatalog);document.getElementById('emptyReset').addEventListener('click',cvResetCatalog);
document.getElementById('searchToggle').onclick=()=>{document.getElementById('produtos').scrollIntoView({behavior:reduceMotion?'instant':'smooth'});setTimeout(()=>productSearch.focus({preventScroll:true}),100);};
document.getElementById('searchInput').setAttribute('aria-label','Buscar produtos');
document.addEventListener('error',e=>{if(e.target.tagName==='IMG'&&!e.target.dataset.cvFallback){e.target.dataset.cvFallback='true';e.target.src='/assets/brand/carrinho.webp';}},true);
const communityLink=document.getElementById('communityLink');
if(TELEGRAM_GROUP_URL&&/^https:\/\/t\.me\//i.test(TELEGRAM_GROUP_URL))communityLink.href=TELEGRAM_GROUP_URL;
else document.getElementById('communityStrip').hidden=true;
const pause=document.getElementById('heroPause');let manuallyPaused=reduceMotion,heroFocused=false;
const oldRestartHeroTimer=restartHeroTimer;
restartHeroTimer=function(){clearInterval(heroTimer);if(!manuallyPaused&&!document.hidden&&!heroFocused)oldRestartHeroTimer();};
pause.addEventListener('click',()=>{manuallyPaused=!manuallyPaused;pause.setAttribute('aria-pressed',String(manuallyPaused));pause.setAttribute('aria-label',manuallyPaused?'Retomar carrossel':'Pausar carrossel');pause.innerHTML=CVIcons.icon(manuallyPaused?'arrow':'pause')+(manuallyPaused?'Retomar':'Pausar');restartHeroTimer();});
document.getElementById('heroSlides').closest('.hero-shell').addEventListener('focusin',()=>{heroFocused=true;restartHeroTimer();});
document.getElementById('heroSlides').closest('.hero-shell').addEventListener('focusout',e=>{if(!e.currentTarget.contains(e.relatedTarget)){heroFocused=false;restartHeroTimer();}});
document.addEventListener('visibilitychange',restartHeroTimer);restartHeroTimer();
const originalShowSlide=showSlide;
showSlide=function(next){originalShowSlide(next);slides.forEach((el,i)=>{el.inert=i!==slide;el.setAttribute('aria-hidden',String(i!==slide));});[...dotsWrap.children].forEach((el,i)=>el.setAttribute('aria-current',String(i===slide)));};
showSlide(slide);
// A light loading state instead of an empty catalog while the first request runs.
if(!PRODUCTS.length){document.getElementById('productGrid').innerHTML=Array.from({length:4},()=>'<div class="catalog-skeleton" aria-hidden="true"></div>').join('');document.getElementById('productGrid').setAttribute('aria-busy','true');document.getElementById('emptyState').classList.add('hidden');document.getElementById('catalogCount').textContent='Preparando os achadinhos…';}

document.getElementById('catalogRetry').addEventListener('click',cvRefresh);
