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

  /* Рисованные иллюстрации, если у позиции нет фото */
  function art(it,noBg){
    var n=(it.name||"").toLowerCase(), h=hash(it.id), cat=it.cat||"";
    var bg=noBg?'':'<rect width="160" height="100" fill="#2c1a10"/><circle cx="20" cy="18" r="40" fill="#3a2215"/><circle cx="150" cy="95" r="45" fill="#3a2215"/>';
    if(/напит|кола|сок|вода/.test(n)||cat==="drinks"){
      var col=/сок/.test(n)?"#f39a2b":/вода/.test(n)?"#8fd3f0":"#4a1d10";
      return '<svg viewBox="0 0 160 100" aria-hidden="true">'+bg+'<rect x="66" y="22" width="28" height="64" rx="8" fill="'+col+'" stroke="#fff3" stroke-width="2"/><rect x="72" y="12" width="16" height="12" rx="3" fill="#e8492c"/><rect x="66" y="44" width="28" height="16" fill="#e8492c"/></svg>';
    }
    if(/соус|кетчуп/.test(n)||cat==="sauce"){
      var sc=/сыр/.test(n)?"#f2c94c":/барбекю/.test(n)?"#6b2a12":/чеснок/.test(n)?"#f4ecd8":"#c3242b";
      return '<svg viewBox="0 0 160 100" aria-hidden="true">'+bg+'<ellipse cx="80" cy="58" rx="34" ry="22" fill="#eee4d6"/><ellipse cx="80" cy="54" rx="26" ry="14" fill="'+sc+'"/></svg>';
    }
    if(/фри/.test(n))return '<svg viewBox="0 0 160 100" aria-hidden="true">'+bg+'<g fill="#f6c445">'+[52,62,72,82,92,102].map(function(x,i){return '<rect x="'+x+'" y="'+(18+(i%3)*6)+'" width="7" height="44" rx="2" transform="rotate('+((i-2.5)*5)+' '+x+' 60)"/>';}).join("")+'</g><path d="M50 50h60l-8 40H58z" fill="#e8492c"/></svg>';
    if(/наггет|палоч/.test(n))return '<svg viewBox="0 0 160 100" aria-hidden="true">'+bg+'<g fill="#d9902f" stroke="#a86318" stroke-width="2"><ellipse cx="62" cy="52" rx="16" ry="11"/><ellipse cx="96" cy="48" rx="16" ry="11"/><ellipse cx="80" cy="68" rx="16" ry="11"/></g></svg>';
    // пицца
    var top=[["#c8331f","#8b1a0e"],["#5a3b22","#3d2615"],["#f0d07a","#e8b04a"],["#2f6b2a","#d63a2a"],["#8b4a2b","#c8331f"]][h%5];
    var dots="";for(var i=0;i<9;i++){var a=(h%360+i*40)*Math.PI/180,r=12+((h>>i)%3)*8;dots+='<circle cx="'+(80+Math.cos(a)*r).toFixed(1)+'" cy="'+(52+Math.sin(a)*r*.8).toFixed(1)+'" r="'+(i%2?4:5.5)+'" fill="'+top[i%2]+'"/>';}
    var combo=/комбо/.test(n)||cat==="combo";
    var pizza='<ellipse cx="80" cy="54" rx="44" ry="38" fill="#d99a4a"/><ellipse cx="80" cy="53" rx="37" ry="31" fill="#f3cf6e"/><path d="M50 45q10 8 20 0t20 2 18-3" stroke="#fff5" stroke-width="3" fill="none"/>'+dots;
    if(combo)return '<svg viewBox="0 0 160 100" aria-hidden="true">'+bg+'<g transform="translate(-22 0)">'+pizza+'</g><rect x="112" y="30" width="20" height="50" rx="6" fill="#4a1d10" stroke="#fff3" stroke-width="2"/><rect x="112" y="46" width="20" height="12" fill="#e8492c"/><g fill="#f6c445"><rect x="136" y="40" width="5" height="34" rx="2"/><rect x="143" y="36" width="5" height="38" rx="2"/></g></svg>';
    return '<svg viewBox="0 0 160 100" aria-hidden="true">'+bg+pizza+'</svg>';
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

  return {prev:prev,src:src,REPO:REPO,esc:esc,money:money,lsGet:lsGet,lsSet:lsSet,lsDel:lsDel,art:art,pic:pic,ICON:ICON,isOpen:isOpen,waDigits:waDigits,loadMenu:loadMenu,hash:hash};
})();
