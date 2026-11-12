/* Rollmi — режим редактирования прямо на сайте (index.html?edit).
   Нажал на цену / название / фото / описание — поменял. Кнопка «Опубликовать» сохраняет всё в menu.json. */
(function(){
"use strict";
var E=PZ.esc,R=PZ.REPO,API="https://api.github.com/repos/"+R.owner+"/"+R.repo+"/contents/";
var token=PZ.lsGet("pz-admin-token")||"",H=null,sha=null,saved="",busy=false;

/* ---------- GitHub ---------- */
function gh(path,opt){opt=opt||{};opt.headers=Object.assign({"Accept":"application/vnd.github+json","Authorization":"Bearer "+token},opt.headers||{});
  return fetch(API+path,opt).then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok){var e=new Error(j.message||("Ошибка "+r.status));e.status=r.status;throw e;}return j;});});}
function b64enc(str){var b=new TextEncoder().encode(str),s="";for(var i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(s);}
function b64dec(b){var bin=atob(b.replace(/\n/g,"")),a=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new TextDecoder().decode(a);}
function fetchMenu(){return gh(R.path+"?ref="+R.branch+"&t="+Date.now()).then(function(j){sha=j.sha;return JSON.parse(b64dec(j.content));});}
function putMenu(retry){
  var body=JSON.stringify(S(),null,2)+"\n";
  return gh(R.path,{method:"PUT",body:JSON.stringify({message:"Меню: правка на сайте",content:b64enc(body),sha:sha,branch:R.branch})})
    .then(function(j){sha=j.content.sha;})
    .catch(function(e){if((e.status===409||e.status===422)&&!retry)return gh(R.path+"?ref="+R.branch+"&t="+Date.now()).then(function(j){sha=j.sha;return putMenu(true);});throw e;});}
function uploadImage(file,prefix){
  return new Promise(function(ok,bad){
    var img=new Image(),url=URL.createObjectURL(file);
    img.onload=function(){var max=1100,w=img.width,h=img.height,k=Math.min(1,max/Math.max(w,h));
      var c=document.createElement("canvas");c.width=Math.round(w*k);c.height=Math.round(h*k);c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);
      var full=c.toDataURL("image/jpeg",.82),name=prefix+"-"+Date.now().toString(36)+".jpg";
      gh(R.img+name,{method:"PUT",body:JSON.stringify({message:"Фото: "+name,content:full.split(",")[1],branch:R.branch})}).then(function(){PZ.prev["img/"+name]=full;ok("img/"+name);}).catch(bad);};
    img.onerror=function(){bad(new Error("Это не картинка"));};img.src=url;});}

/* ---------- состояние ---------- */
function S(){return H.S();}
function dirty(){return !!H&&JSON.stringify(S())!==saved;}
function draft(){PZ.lsSet("pz-admin-draft",JSON.stringify({d:S(),base:saved}));}
function toast(m){var t=document.createElement("div");t.className="ed-toast";t.textContent=m;document.body.appendChild(t);setTimeout(function(){t.remove();},2600);}
function uid(p){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function cat(id){return S().categories.filter(function(c){return c.id===id;})[0];}
function changed(msg){draft();H.render();if(msg!==false)toast(msg||"Изменено. Не забудьте «Опубликовать»");}
window.addEventListener("beforeunload",function(e){if(dirty()){e.preventDefault();e.returnValue="";}});

/* ---------- вход и загрузка ---------- */
function load(){
  return new Promise(function(ok){
    function go(){
      fetchMenu().then(function(d){
        saved=JSON.stringify(d);
        try{var dr=JSON.parse(PZ.lsGet("pz-admin-draft")||"null");if(dr&&dr.base===saved&&JSON.stringify(dr.d)!==saved){d=dr.d;setTimeout(function(){toast("Восстановлены неопубликованные изменения");},900);}}catch(e){}
        ok(d);
      }).catch(function(e){
        if(e.status===401||e.status===403||e.status===404){token="";PZ.lsDel("pz-admin-token");login(go,"Ключ не подошёл. Проверьте и вставьте ещё раз.");}
        else login(go,"Нет связи: "+e.message);
      });
    }
    if(token)go();else login(go);
  });
}
function login(next,err){
  var sp=document.querySelector(".splash");if(sp)sp.remove();
  sheet('<h3>Вход для владельца</h3><p class="ed-p">Вставьте ключ доступа — и меняйте всё прямо на сайте: нажали на цену, название или фото — поменяли.</p>'+
    '<label class="ed-f"><span>Ключ доступа</span><input id="ed-tk" type="password" autocomplete="off" placeholder="github_pat_…"></label>'+
    (err?'<p class="ed-err">'+E(err)+'</p>':'')+
    '<div class="ed-btns"><button class="ed-b main" data-ok>Войти</button></div><p class="ed-p"><a href="admin.html">Где взять ключ?</a> · <a href="./">Обычный сайт</a></p>',
    function(box){var v=box.querySelector("#ed-tk").value.trim();if(!v){box.querySelector("#ed-tk").focus();return false;}token=v;PZ.lsSet("pz-admin-token",v);next();},true);
}

/* ---------- окошко (sheet) ---------- */
function sheet(html,onOk,locked,extra){
  closeSheet();
  var w=document.createElement("div");w.className="ed-scrim";w.innerHTML='<div class="ed-sheet" role="dialog">'+html+'</div>';
  document.body.appendChild(w);document.body.classList.add("ed-lock");
  var box=w.firstChild;
  w.addEventListener("click",function(ev){
    if(ev.target===w&&!locked){closeSheet();return;}
    var b=ev.target.closest("button");if(!b)return;
    if("ok" in b.dataset){if(onOk(box)!==false)closeSheet();}
    else if("cancel" in b.dataset)closeSheet();
    else if(extra)extra(b,box);
  });
  w.addEventListener("keydown",function(ev){if(ev.key==="Enter"&&ev.target.tagName==="INPUT"){ev.preventDefault();var b=box.querySelector("[data-ok]");if(b)b.click();}if(ev.key==="Escape"&&!locked)closeSheet();});
  var f=box.querySelector("input,textarea");if(f)setTimeout(function(){f.focus();if(f.select&&f.type!=="file")f.select();},60);
  return box;
}
function closeSheet(){var o=document.querySelector(".ed-scrim");if(o)o.remove();document.body.classList.remove("ed-lock");}
function fld(k,label,val,o){o=o||{};
  if(o.area)return '<label class="ed-f"><span>'+label+'</span><textarea data-k="'+k+'" rows="'+(o.rows||4)+'">'+E(val)+'</textarea>'+(o.hint?'<small>'+o.hint+'</small>':'')+'</label>';
  return '<label class="ed-f"><span>'+label+'</span><input data-k="'+k+'" value="'+E(val==null?"":val)+'"'+(o.num?' inputmode="numeric"':'')+(o.ph?' placeholder="'+E(o.ph)+'"':'')+'>'+(o.hint?'<small>'+o.hint+'</small>':'')+'</label>';}
function vals(box){var r={};box.querySelectorAll("[data-k]").forEach(function(i){r[i.dataset.k]=i.value;});return r;}
function num(v){v=String(v||"").replace(/[^\d]/g,"");return v===""?0:+v;}
var BTNS='<div class="ed-btns"><button class="ed-b" data-cancel>Отмена</button><button class="ed-b main" data-ok>Готово</button></div>';

/* ---------- фото ---------- */
function pickPhoto(prefix,apply,quiet){
  var inp=document.createElement("input");inp.type="file";inp.accept="image/*";
  inp.onchange=function(){var f=inp.files[0];if(!f)return;
    var t=document.createElement("div");t.className="ed-toast stay";t.textContent="Загружаю фото…";document.body.appendChild(t);
    uploadImage(f,prefix).then(function(p){t.remove();apply(p);if(quiet){draft();H.render();}else changed("Фото заменено. Не забудьте «Опубликовать»");})
      .catch(function(e){t.remove();toast(e.status===401?"Ключ больше не действует":"Фото не загрузилось: "+e.message);});};
  inp.click();
}

/* ---------- правка позиции ---------- */
function itemField(it,what){
  var h,ok;
  if(what==="name"){h='<h3>Название</h3>'+fld("name","Название блюда",it.name);ok=function(v){if(!v.name.trim())return false;it.name=v.name.trim();};}
  else if(what==="price"){h='<h3>Цена — '+E(it.name)+'</h3>'+fld("price","Цена, ₸",it.price,{num:1})+fld("old","Старая цена (зачёркнутая), ₸",+it.old||"",{num:1,ph:"нет",hint:"Оставьте пустым, если скидки нет"});
    ok=function(v){if(!/\d/.test(v.price))return false;it.price=num(v.price);it.old=num(v.old);};}
  else if(what==="desc"){h='<h3>Описание — '+E(it.name)+'</h3>'+fld("desc","Состав / описание",it.desc,{area:1})+fld("weight","Вес или количество",it.weight,{ph:"например, 8 шт или 250 г"});
    ok=function(v){it.desc=v.desc.trim();it.weight=v.weight.trim();};}
  else if(what==="badge"){h='<h3>Метка — '+E(it.name)+'</h3>'+fld("badge","Метка на фото",it.badge,{ph:"Хит, Новинка, Острое…",hint:"Пусто — метки не будет"});ok=function(v){it.badge=v.badge.trim();};}
  sheet(h+BTNS,function(box){if(ok(vals(box))===false){toast("Заполните поле");return false;}changed();});
}
function itemFull(it,isNew){
  var C=S().categories,hasImg=!!it.img;
  var h='<h3>'+(isNew?'Новое блюдо':E(it.name))+'</h3>'+
    '<div class="ed-photo">'+(hasImg?'<img src="'+E(PZ.src(it.img))+'" alt="">':'<span>Нет фото</span>')+'<div><button class="ed-b sm" data-photo>'+(hasImg?'Сменить фото':'Добавить фото')+'</button>'+(hasImg?'<button class="ed-b sm" data-nophoto>Убрать фото</button>':'')+'</div></div>'+
    fld("name","Название",it.name)+
    '<div class="ed-2">'+fld("price","Цена, ₸",it.price===""?"":it.price,{num:1})+fld("old","Старая цена, ₸",+it.old||"",{num:1,ph:"нет"})+'</div>'+
    fld("weight","Вес или количество",it.weight,{ph:"8 шт / 250 г"})+
    fld("desc","Состав / описание",it.desc,{area:1,rows:3})+
    fld("badge","Метка",it.badge,{ph:"Хит, Новинка…"})+
    '<label class="ed-f"><span>Раздел</span><select data-k="cat">'+C.map(function(c){return '<option value="'+E(c.id)+'"'+(c.id===it.cat?' selected':'')+'>'+E(c.name)+'</option>';}).join("")+'</select></label>'+
    (isNew?'':'<div class="ed-row"><button class="ed-b sm" data-up>↑ Выше</button><button class="ed-b sm" data-down>↓ Ниже</button><button class="ed-b sm" data-hide>'+(it.hidden?'Показать клиентам':'Скрыть (нет в наличии)')+'</button><button class="ed-b sm danger" data-del>Удалить</button></div>')+BTNS;
  var tmp=JSON.parse(JSON.stringify(it));
  sheet(h,function(box){var v=vals(box);
      if(!v.name.trim()){toast("Введите название");return false;}
      if(!/\d/.test(v.price)){toast("Введите цену (для бесплатного — 0)");return false;}
      it.name=v.name.trim();it.price=num(v.price);it.old=num(v.old);it.weight=v.weight.trim();it.desc=v.desc.trim();it.badge=v.badge.trim();it.img=tmp.img;
      var catChanged=it.cat!==v.cat;it.cat=v.cat;
      var items=S().items;
      if(isNew||catChanged){var i=items.indexOf(it);if(i>=0)items.splice(i,1);var last=-1;items.forEach(function(x,j){if(x.cat===it.cat)last=j;});items.splice(last+1,0,it);}
      changed(isNew?"Блюдо добавлено. Не забудьте «Опубликовать»":undefined);},false,
    function(b,box){var d=b.dataset,items=S().items;
      if("photo" in d)pickPhoto("i",function(p){tmp.img=p;if(!isNew)it.img=p;box.querySelector(".ed-photo").innerHTML='<img src="'+E(PZ.src(p))+'" alt=""><div><b>Новое фото</b></div>';},true);
      else if("nophoto" in d){tmp.img="";var ph=box.querySelector(".ed-photo");ph.innerHTML='<span>Фото будет убрано</span>';}
      else if("hide" in d){it.hidden=!it.hidden;closeSheet();changed(it.hidden?"Скрыто от клиентов":"Снова видно клиентам");}
      else if("del" in d){if(b.dataset.armed){S().items=items.filter(function(x){return x!==it;});closeSheet();changed("Удалено. Не забудьте «Опубликовать»");}else{b.dataset.armed=1;b.textContent="Точно удалить?";}}
      else if("up" in d||"down" in d){var i=items.indexOf(it),j=i+("up" in d?-1:1);while(j>=0&&j<items.length&&items[j].cat!==it.cat)j+=("up" in d?-1:1);if(j<0||j>=items.length){toast("Дальше некуда");return;}items[i]=items[j];items[j]=it;closeSheet();changed(false);toast("Перемещено");}
    });
}
function newItem(catId){itemFull({id:uid("i"),cat:catId,name:"",desc:"",price:"",old:0,weight:"",img:"",badge:"",hidden:false},true);}

/* ---------- разделы ---------- */
function catSheet(c){
  var C=S().categories,n=S().items.filter(function(i){return i.cat===c.id;}).length;
  sheet('<h3>Раздел</h3>'+fld("name","Название раздела",c.name)+'<div class="ed-row"><button class="ed-b sm" data-up>↑ Выше</button><button class="ed-b sm" data-down>↓ Ниже</button><button class="ed-b sm" data-add>+ Блюдо в раздел</button><button class="ed-b sm danger" data-del>Удалить раздел</button></div>'+BTNS,
    function(box){var v=vals(box);if(!v.name.trim())return false;c.name=v.name.trim();changed();},false,
    function(b){var d=b.dataset,i=C.indexOf(c);
      if("up" in d||"down" in d){var j=i+("up" in d?-1:1);if(j<0||j>=C.length)return;C[i]=C[j];C[j]=c;closeSheet();changed(false);toast("Раздел перемещён");}
      else if("add" in d)newItem(c.id);
      else if("del" in d){if(n){toast("Сначала удалите или перенесите блюда ("+n+")");return;}S().categories=C.filter(function(x){return x!==c;});closeSheet();changed("Раздел удалён");}});
}
function newCat(){sheet('<h3>Новый раздел</h3>'+fld("name","Название","",{ph:"например, Напитки"})+BTNS,function(box){var v=vals(box);if(!v.name.trim())return false;var c={id:uid("c"),name:v.name.trim()};S().categories.push(c);draft();setTimeout(function(){newItem(c.id);},50);});}

/* ---------- настройки ---------- */
function setSheet(title,keys){
  var st=S().settings,L={name:["Название","",0],slogan:["Слоган","",0],city:["Город","",0],address:["Адрес","",0],whatsapp:["WhatsApp для заказов","+7 7XX XXX XX XX",0],instagram:["Instagram","rollmi.kz",0],
    open:["Открываемся","11:00",0],close:["Закрываемся","01:00",0],deliveryFee:["Доставка, ₸","0 — бесплатно",1],freeFrom:["Бесплатная доставка от, ₸","пусто — нет",1],minOrder:["Минимальный заказ, ₸","пусто — нет",1],notice:["Объявление внизу главной","",2]};
  var h='<h3>'+title+'</h3>';
  keys.forEach(function(k){var l=L[k];if(!l)return;h+=l[2]===2?fld(k,l[0],st[k],{area:1,rows:2}):fld(k,l[0],l[2]?(+st[k]||""):st[k],{num:l[2],ph:l[1]});});
  if(keys.indexOf("name")>=0)h+='<div class="ed-row"><button class="ed-b sm" data-logo>Сменить логотип</button><button class="ed-b sm" data-hero>Сменить фон главной</button><button class="ed-b sm" data-newcat>+ Новый раздел</button></div>';
  sheet(h+BTNS,function(box){var v=vals(box);
      Object.keys(v).forEach(function(k){st[k]=L[k][2]===1?num(v[k]):v[k].trim();});
      if(st.open&&!/^\d{1,2}:\d{2}$/.test(st.open)||st.close&&!/^\d{1,2}:\d{2}$/.test(st.close)){toast("Время в формате 11:00");return false;}
      changed();},false,
    function(b){var d=b.dataset;
      if("logo" in d)pickPhoto("logo",function(p){st.logo=p;});
      else if("hero" in d)pickPhoto("hero",function(p){st.hero=p;});
      else if("newcat" in d)newCat();});
}
var ALL=["name","slogan","city","address","whatsapp","instagram","open","close","deliveryFee","freeFrom","minOrder","notice"];

/* ---------- публикация ---------- */
function publish(){
  if(busy)return;if(!dirty()){toast("Изменений нет — всё уже на сайте");return;}
  var bad=S().items.filter(function(i){return !i.hidden&&(!String(i.name).trim()||!(+i.price>=0));});
  if(bad.length){toast("Проверьте название и цену: "+bad.map(function(i){return i.name||"без названия";}).join(", "));return;}
  busy=true;bar();
  putMenu().then(function(){saved=JSON.stringify(S());PZ.lsDel("pz-admin-draft");busy=false;bar();toast("Опубликовано! Клиенты увидят через 1–2 минуты");})
    .catch(function(e){busy=false;bar();toast(e.status===401?"Ключ больше не действует — войдите заново":"Не сохранилось: "+e.message);});
}
function exit(){
  if(!dirty()){location.href="./";return;}
  sheet('<h3>Есть неопубликованные изменения</h3><p class="ed-p">Клиенты их пока не видят.</p><div class="ed-btns col"><button class="ed-b main" data-pub>Опубликовать и выйти</button><button class="ed-b danger" data-drop>Выйти без сохранения</button><button class="ed-b" data-cancel>Остаться</button></div>',function(){},false,
    function(b){if("pub" in b.dataset){closeSheet();publish();var w=setInterval(function(){if(!busy){clearInterval(w);if(!dirty())location.href="./";}},300);}
      else if("drop" in b.dataset){PZ.lsDel("pz-admin-draft");saved=JSON.stringify(S());location.href="./";}});
}

/* ---------- панель и подсказки ---------- */
function bar(){
  var b=document.getElementById("ed-bar");
  if(!b){b=document.createElement("div");b.id="ed-bar";document.body.appendChild(b);
    b.addEventListener("click",function(ev){var t=ev.target.closest("button");if(!t)return;var a=t.dataset.a;
      if(a==="pub")publish();else if(a==="set")setSheet("Настройки",ALL);else if(a==="exit")exit();});}
  var d=dirty();
  b.innerHTML='<span class="ed-t"><b>✎ Редактирование</b><small>Нажмите на что угодно, чтобы изменить</small></span><button data-a="set" aria-label="Настройки">⚙</button><button data-a="pub" class="'+(d?'hot':'')+'"'+(busy?' disabled':'')+'>'+(busy?'Сохраняю…':d?'Опубликовать':'Сохранено ✓')+'</button><button data-a="exit" aria-label="Выйти">✕</button>';
}
function after(view){
  document.body.classList.add("editing");bar();
  document.querySelectorAll("[data-item]").forEach(function(c){if(!c.querySelector(".ed-more"))c.insertAdjacentHTML("beforeend",'<button class="ed-more" data-ed="more" aria-label="Все настройки блюда">✎</button>');});
  if(view==="menu"){
    document.querySelectorAll(".sec").forEach(function(s){var g=s.querySelector(".grid");if(g&&!g.querySelector(".ed-add"))g.insertAdjacentHTML("beforeend",'<button class="ed-add" data-ed="add" data-cat="'+E(s.dataset.cat)+'">+ Добавить блюдо</button>');});
    var m=document.querySelector("main.wrap");if(m&&!m.querySelector(".ed-newcat"))m.insertAdjacentHTML("beforeend",'<button class="ed-add ed-newcat" data-ed="newcat">+ Новый раздел</button>');
  }
}

/* ---------- клики: что нажали — то и меняем ---------- */
document.addEventListener("click",function(ev){
  if(!H||!S())return;var t=ev.target;
  if(t.closest(".ed-scrim,#ed-bar"))return;
  var hit=null,it=null,card=t.closest("[data-item]");
  if(card)it=H.item(card.dataset.item);
  var ed=t.closest("[data-ed]");
  if(ed){var k=ed.dataset.ed;hit=function(){if(k==="more")itemFull(it);else if(k==="add")newItem(ed.dataset.cat);else if(k==="newcat")newCat();};}
  else if(it){
    if(t.closest(".step"))hit=function(){};
    else if(t.closest(".badge"))hit=function(){itemField(it,"badge");};
    else if(t.closest(".ph,.th"))hit=function(){pickPhoto("i",function(p){it.img=p;});};
    else if(t.closest(".prices"))hit=function(){itemField(it,"price");};
    else if(t.closest(".name"))hit=function(){itemField(it,"name");};
    else if(t.closest(".desc,.pcs"))hit=function(){itemField(it,"desc");};
    else hit=function(){itemFull(it);};
  }
  else if(t.closest(".sec>h2")){var c=cat(t.closest(".sec").dataset.cat);if(c)hit=function(){catSheet(c);};}
  else if(t.closest(".pop-h h2")){var pc=S().categories[0];if(pc)hit=function(){catSheet(pc);};}
  else if(t.closest(".hero-h"))hit=function(){setSheet("Название",["name"]);};
  else if(t.closest(".hero-p"))hit=function(){setSheet("Слоган и город",["slogan","city"]);};
  else if(t.closest(".hero-status,.status"))hit=function(){setSheet("Время работы",["open","close"]);};
  else if(t.closest(".logo"))hit=function(){pickPhoto("logo",function(p){S().settings.logo=p;});};
  else if(t.closest(".fact"))hit=function(){setSheet("Доставка и время работы",["deliveryFee","freeFrom","minOrder","open","close"]);};
  else if(t.closest(".act.wa,.act.sm"))hit=function(){setSheet("Контакты",["whatsapp","instagram"]);};
  else if(t.closest(".home .hint"))hit=function(){setSheet("Объявление",["notice"]);};
  else if(t.closest("footer"))hit=function(){setSheet("Настройки",ALL);};
  else if(t.closest(".hero")&&!t.closest("button,a"))hit=function(){pickPhoto("hero",function(p){S().settings.hero=p;});};
  if(!hit)return;
  ev.preventDefault();ev.stopPropagation();hit();
},true);

window.RMEdit={prev:PZ.prev,load:load,attach:function(h){H=h;},after:after};
})();
