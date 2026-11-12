/* Общие функции для сайта и админки */
var PZ = (function(){
  "use strict";
  var REPO = {owner:"sukrievmusa-hash", repo:"raf", branch:"main", path:"pizza/menu.json", img:"pizza/img/"};

  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function money(n){return (Math.round(+n)||0).toLocaleString("ru-RU").replace(/[\s  ,]/g," ")+" ₸";}
  function lsGet(k,st){try{return (st||localStorage).getItem(k);}catch(e){return null;}}
  function lsSet(k,v,st){try{(st||localStorage).setItem(k,v);}catch(e){}}
  function lsDel(k,st){try{(st||localStorage).removeItem(k);}catch(e){}}

  function hash(s){var h=0;s=String(s||"");for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h;}

  /* Рисованные иллюстрации (как на основном сайте), если у позиции нет фото */
  var cats=[];
  function setCats(c){cats=c||[];}
  function catName(id){for(var i=0;i<cats.length;i++)if(cats[i].id===id)return cats[i].name;return "";}
  function art(it){
    var n=(it.name+" "+catName(it.cat)).toLowerCase(),h=0;for(var i=0;i<it.id.length;i++)h=(h*31+it.id.charCodeAt(i))>>>0;
    if(/пицц/.test(n))return '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="22" fill="#e9b25a"/><circle cx="30" cy="30" r="18" fill="#f3d27a"/><circle cx="24" cy="24" r="3.5" fill="#d94b33"/><circle cx="36" cy="27" r="3.5" fill="#d94b33"/><circle cx="28" cy="37" r="3.5" fill="#d94b33"/><circle cx="38" cy="38" r="2" fill="#3b4d2a"/><circle cx="21" cy="33" r="2" fill="#3b4d2a"/></svg>';
    if(/соус|имбир|васаби/.test(n)){var col=/имбир/.test(n)?"#f4c9a0":/васаби/.test(n)?"#93c255":/сырн/.test(n)?"#f1e2b8":/остр/.test(n)?"#c3242b":"#2b1b14";return '<svg viewBox="0 0 60 60" aria-hidden="true"><ellipse cx="30" cy="32" rx="19" ry="14" fill="#1b1f27"/><ellipse cx="30" cy="30" rx="14" ry="9" fill="'+col+'"/></svg>';}
    var F=[["#ff8a5c","#ffd6c2"],["#ea4429","#ffc9bd"],["#f2b84b","#fff0c7"],["#7cc36a","#e3f4d6"]],c=F[h%F.length];
    if(/гункан/.test(n))return '<svg viewBox="0 0 60 60" aria-hidden="true"><rect x="16" y="24" width="28" height="22" rx="6" fill="#13241b"/><ellipse cx="30" cy="24" rx="14" ry="6" fill="#f4efe3"/><ellipse cx="30" cy="20" rx="11" ry="6" fill="'+c[0]+'"/></svg>';
    if(it.cat==="sushi")return '<svg viewBox="0 0 60 60" aria-hidden="true"><rect x="12" y="30" width="36" height="14" rx="7" fill="#f4efe3"/><path d="M10 31c4-10 36-12 40 0-8 3-32 3-40 0z" fill="'+c[0]+'"/></svg>';
    return '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="20" fill="#13241b"/><circle cx="30" cy="30" r="16.5" fill="#f4efe3"/><circle cx="30" cy="30" r="8" fill="'+c[0]+'"/><circle cx="27.5" cy="28" r="3" fill="'+c[1]+'"/></svg>';
  }
  var prev={};
  function src(p){return prev[p]||p;}
  function pic(it){return it.img?'<img src="'+esc(src(it.img))+'" alt="'+esc(it.name)+'" loading="lazy">':art(it);}

  var ICON={
    bag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    wa:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 13.9c-.2.6-1.3 1.2-1.8 1.2s-1 .3-3.4-.7a11.8 11.8 0 0 1-4.6-4.1c-.4-.5-1-1.5-1-2.8s.7-2 1-2.3a1 1 0 0 1 .7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6a8 8 0 0 0 1.5 1.9 7.4 7.4 0 0 0 2.2 1.3c.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3a2.4 2.4 0 0 1 0 1.2z"/></svg>',
    phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    ig:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    truck:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
    gift:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11h16v10H4zM3 7h18v4H3zM12 7v14M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0"/></svg>',
    clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    pizza:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 20c6 3 14 3 20 0z"/><circle cx="11" cy="12" r="1.3" fill="currentColor"/><circle cx="14" cy="16" r="1.3" fill="currentColor"/><circle cx="9" cy="17" r="1.3" fill="currentColor"/></svg>'
  };

  function mins(t){var m=/^(\d{1,2}):(\d{2})$/.exec(t||"");return m?(+m[1])*60+(+m[2]):null;}
  function isOpen(s){
    var o=mins(s.open),c=mins(s.close);if(o==null||c==null)return true;
    var d=new Date(),now=d.getHours()*60+d.getMinutes();
    if(c===0)c=1440;
    return o<c?(now>=o&&now<c):(now>=o||now<c);
  }
  function waDigits(p){var d=String(p||"").replace(/\D/g,"");if(d.length===11&&d[0]==="8")d="7"+d.slice(1);if(d.length===10)d="7"+d;return d;}

  /* Загрузка меню: всегда свежее (без кеша) */
  function loadMenu(){
    return fetch("menu.json?t="+Date.now(),{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error("menu "+r.status);return r.json();});
  }

  return {setCats:setCats,prev:prev,src:src,REPO:REPO,esc:esc,money:money,lsGet:lsGet,lsSet:lsSet,lsDel:lsDel,art:art,pic:pic,ICON:ICON,isOpen:isOpen,waDigits:waDigits,loadMenu:loadMenu,hash:hash};
})();
