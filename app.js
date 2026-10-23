(() => {
const R = window.RECIPES || [], $ = s => document.querySelector(s), app = $('#app');
const CATS = ["Breakfast","Mains","Sides & Salads","Snacks & Apps","Desserts","Drinks"];
const store = { get(k,d){try{return JSON.parse(localStorage.getItem('cb.'+k))??d}catch(e){return d}}, set(k,v){try{localStorage.setItem('cb.'+k,JSON.stringify(v))}catch(e){}} };
const esc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const bySlug = s => R.find(r=>r.slug===s);
let ui = {q:'',cat:null,tags:[]}, wake=null, tick=null;

function fmtQ(q){ if(q==null) return ''; const w=Math.floor(q), f=q-w;
  const fr=[[.125,'⅛'],[.25,'¼'],[.333,'⅓'],[.5,'½'],[.667,'⅔'],[.75,'¾']];
  if(q>=20) return String(Math.round(q));
  for(const [v,s] of fr) if(Math.abs(f-v)<.04) return (w?w:'')+s;
  if(f<.04) return String(w); if(f>.96) return String(w+1);
  return q.toFixed(1).replace(/\.0$/,''); }
function altScaled(alt,k){ if(!alt) return ''; if(k===1) return alt;
  const m=alt.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/); return m? fmtQ(+m[1]*k)+' '+m[2] : ''; }
function ingHTML(i,k){ const q=i.qty!=null?fmtQ(i.qty*k):'', a=altScaled(i.alt,k);
  return `<span class="t">${q?`<span class="q">${q} ${esc(i.unit)}</span> `:''}${esc(i.name)}${a?` <span class="alt">(${esc(a)})</span>`:''}${i.note?` <span class="note">· ${esc(i.note)}</span>`:''}</span>`; }
const mins = m => m>=60 ? `${Math.floor(m/60)}h${m%60?' '+m%60+'m':''}` : `${m}m`;
const totalMin = r => (r.times.prep_min||0)+(r.times.cook_min||0)+(r.times.bake_min||0)+(r.times.rest_min||0);
function shopCount(){ const n=store.get('shop',[]).length; $('#shopcount').textContent=n||''; }

function home(){
  const tags=[...new Set(R.flatMap(r=>r.tags))].sort(), q=ui.q.toLowerCase();
  const list=R.filter(r=>(!ui.cat||r.category===ui.cat)&&ui.tags.every(t=>r.tags.includes(t))&&
    (!q||[r.title,r.description,r.source.creator_handle,...r.tags,...r.ingredient_groups.flatMap(g=>g.items.map(i=>i.name))].join(' ').toLowerCase().includes(q)));
  app.innerHTML=`<div class="pad hello"><h1>What are we cooking?</h1><p>${R.length} saved recipe${R.length===1?'':'s'}</p>
    <input class="search" id="q" placeholder="Search recipes, ingredients, creators…" value="${esc(ui.q)}"></div>
    <div class="chips">${['All',...CATS].map(c=>`<button class="chip ${(c==='All'?!ui.cat:ui.cat===c)?'on':''}" data-cat="${c}">${c}</button>`).join('')}</div>
    <div class="chips tags">${tags.map(t=>`<button class="chip ${ui.tags.includes(t)?'on':''}" data-tag="${t}">#${t}</button>`).join('')}</div>
    <div class="grid">${list.map(r=>`<a class="card" href="#/r/${r.slug}"><img src="${r.hero_image}" alt="" loading="lazy"><div class="b">
      <span class="pill">${esc(r.category)}</span><h3 style="margin-top:8px">${esc(r.title)}</h3>
      <div class="meta"><span>⏱ ${mins(totalMin(r))}</span><span>🍽 ${r.servings} ${esc(r.servings_unit||'')}</span>${r.macros?`<span>💪 ${r.macros.protein_g}g protein</span>`:''}</div>
      <div class="meta" style="margin-top:6px">${esc(r.source.creator_handle)}</div></div></a>`).join('')||'<div class="empty">No recipes match. Try clearing filters.</div>'}</div>`;
  const qi=$('#q'); qi.oninput=e=>{ui.q=e.target.value;const p=qi.selectionStart;home();const n=$('#q');n.focus();n.setSelectionRange(p,p);};
  app.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{ui.cat=b.dataset.cat==='All'?null:b.dataset.cat;home();});
  app.querySelectorAll('[data-tag]').forEach(b=>b.onclick=()=>{const t=b.dataset.tag;ui.tags=ui.tags.includes(t)?ui.tags.filter(x=>x!==t):[...ui.tags,t];home();});
}

function recipe(r){
  const sv=store.get('sv.'+r.slug,r.servings), k=sv/r.servings, chk=store.get('chk.'+r.slug,{}), m=r.macros, t=r.times;
  const inShop=store.get('shop',[]).includes(r.slug);
  app.innerHTML=`<div class="hero"><img src="${r.hero_image}" alt=""><a class="back" href="#/">← Back</a></div>
  <div class="sheet"><span class="pill">${esc(r.category)}</span><h1 style="margin-top:8px">${esc(r.title)}</h1>
  <p class="by">${r.source.url?`from <a href="${esc(r.source.url)}" target="_blank" rel="noopener">${esc(r.source.creator_handle)}</a> on ${esc(r.source.platform)}`:`${esc(r.source.platform)} · by <b>${esc(r.source.creator_handle)}</b>`}</p>
  ${r.description?`<p class="desc">${esc(r.description)}</p>`:''}
  <div class="stats"><div class="stat"><b>${t.prep_min?'~'+t.prep_min+'m':'—'}</b><span>Prep</span></div>
  <div class="stat"><b>${t.cook_min?mins(t.cook_min):'—'}</b><span>Cook</span></div>
  <div class="stat"><b>${t.bake_min?mins(t.bake_min):(t.rest_min?mins(t.rest_min):'—')}</b><span>${t.bake_min?'Bake':'Rest'}</span></div></div>
  ${m?`<div class="macros"><div><b>${m.calories}</b>cal</div><div><b>${m.protein_g}g</b>protein</div><div><b>${m.carbs_g!=null?m.carbs_g+"g":"—"}</b>carbs</div><div><b>${m.fat_g!=null?m.fat_g+"g":"—"}</b>fat</div></div><p class="small" style="margin:6px 2px 0">per ${esc(m.per)}${t.cook?` · cook ${esc(t.cook)}`:''}${t.rest?` · rest ${esc(t.rest)}`:''}</p>`:''}
  <div class="sec"><h2>Ingredients</h2><div class="scaler"><button id="dn" aria-label="fewer">−</button><span>${sv} ${esc(r.servings_unit||'servings')}</span><button id="up" aria-label="more">+</button></div></div>
  ${k!==1?`<p class="small">Scaled ×${+k.toFixed(2)} from ${r.servings}. <a class="link" href="javascript:" id="rs">Reset</a></p>`:''}
  ${r.ingredient_groups.map(g=>`<div class="grp">${esc(g.name)}</div>${g.fixed?'<p class="small" style="margin:0 0 4px">Full batch, not scaled</p>':''}${g.items.map(i=>`<button class="ing ${chk[i.id]?'done':''}" data-id="${i.id}"><span class="box">${chk[i.id]?'✓':''}</span>${ingHTML(i,g.fixed?1:k)}</button>`).join('')}`).join('')}
  ${r.equipment?.length?`<div class="sec"><h2>Equipment</h2></div><div class="box2">${r.equipment.map(esc).join('<br>')}</div>`:''}
  <div class="sec"><h2>Steps</h2></div><ol class="steps">${r.steps.map(s=>`<li>${esc(s.text)}${s.timer_min?` <span class="tm">⏲ ${mins(s.timer_min)}</span>`:''}</li>`).join('')}</ol>
  ${r.storage?`<div class="sec"><h2>Storage</h2></div><div class="box2">${esc(r.storage)}</div>`:''}
  ${r.notes?`<div class="sec"><h2>My notes</h2></div><div class="box2">${esc(r.notes)}</div>`:''}
  ${r.estimates&&Object.keys(r.estimates).length?`<div class="est"><b>Estimates:</b> ${Object.values(r.estimates).map(esc).join(' ')}</div>`:''}
  </div><div class="cta"><button class="btn ghost" id="shop">${inShop?'✓ 🛒':'+ 🛒'}</button><a class="btn" href="#/cook/${r.slug}/1">Start cooking</a></div>`;
  const setSv=v=>{store.set('sv.'+r.slug,Math.max(1,v));recipe(r);};
  $('#dn').onclick=()=>setSv(sv-1); $('#up').onclick=()=>setSv(sv+1); if($('#rs')) $('#rs').onclick=()=>setSv(r.servings);
  app.querySelectorAll('.ing').forEach(b=>b.onclick=()=>{chk[b.dataset.id]=!chk[b.dataset.id];store.set('chk.'+r.slug,chk);b.classList.toggle('done');b.querySelector('.box').textContent=chk[b.dataset.id]?'✓':'';});
  $('#shop').onclick=()=>{let s=store.get('shop',[]);s=s.includes(r.slug)?s.filter(x=>x!==r.slug):[...s,r.slug];store.set('shop',s);shopCount();recipe(r);};
}

async function lockWake(){ try{ if('wakeLock' in navigator && !wake) { wake=await navigator.wakeLock.request('screen'); wake.addEventListener('release',()=>wake=null);} }catch(e){} }
function unlockWake(){ try{wake&&wake.release();}catch(e){} wake=null; }
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible' && location.hash.startsWith('#/cook')) lockWake(); });

const timers={}; // key slug:n -> {end, left, running}
function cook(r,n){
  lockWake(); const N=r.steps.length; n=Math.min(Math.max(1,n),N); const s=r.steps[n-1], k=store.get('sv.'+r.slug,r.servings)/r.servings;
  const all=r.ingredient_groups.flatMap(g=>g.items.map(i=>({...i,_f:g.fixed}))), uses=(s.ingredients||[]).map(id=>all.find(i=>i.id===id)).filter(Boolean);
  const key=r.slug+':'+n; if(s.timer_min && !timers[key]) timers[key]={left:s.timer_min*60,running:false,end:0};
  app.innerHTML=`<div class="cook"><div class="bar"><i style="width:${n/N*100}%"></i></div>
   <div class="hd"><span>${esc(r.title)}</span><button id="x">✕ Close</button></div>
   <div class="body" id="body">${s.image?`<img class="ph" src="${s.image}" alt="">`:''}
   <div class="n">Step ${n} of ${N}</div><div class="txt">${esc(s.text)}</div>
   ${uses.length?`<div class="uses">${uses.map(i=>`<span>${ingHTML(i,i._f?1:k)}</span>`).join('')}</div>`:''}
   ${s.timer_min?`<div class="timer" id="tmr"><div class="clock" id="clk"></div><button id="tgo"></button><button class="sec2" id="trs">Reset</button></div>`:''}
   ${n===N?`<p style="color:#cdbfb4;margin-top:20px">${esc(r.storage||'')}</p>`:''}</div>
   <div class="nav"><button id="pv" ${n===1?'disabled':''}>← Back</button><button class="nx" id="nx">${n===N?'Done ✓':'Next →'}</button></div></div>`;
  const go=m=>location.hash=`#/cook/${r.slug}/${m}`;
  $('#pv').onclick=()=>n>1&&go(n-1); $('#nx').onclick=()=>n<N?go(n+1):(location.hash='#/r/'+r.slug);
  $('#x').onclick=()=>location.hash='#/r/'+r.slug;
  let x0=null,y0=0; const b=$('.cook'); b.ontouchstart=e=>{x0=e.touches[0].clientX;y0=e.touches[0].clientY};
  b.ontouchend=e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){dx<0?(n<N&&go(n+1)):(n>1&&go(n-1));}x0=null};
  document.onkeydown=e=>{ if(e.key==='ArrowRight'&&n<N)go(n+1); if(e.key==='ArrowLeft'&&n>1)go(n-1); if(e.key==='Escape')location.hash='#/r/'+r.slug; };
  if(s.timer_min){ const T=timers[key];
    const paint=()=>{ const left=T.running?Math.max(0,Math.round((T.end-Date.now())/1000)):T.left; const h=Math.floor(left/3600),m=Math.floor(left%3600/60),sc=left%60;
      const c=$('#clk'); if(!c) return; c.textContent=(h?h+':'+String(m).padStart(2,'0'):m)+':'+String(sc).padStart(2,'0');
      $('#tgo').textContent=T.running?'Pause':(left===0?'Done!':(T.left<s.timer_min*60?'Resume':'Start'));
      if(T.running&&left===0){T.running=false;T.left=0;$('#tmr').classList.add('ring');try{navigator.vibrate&&navigator.vibrate([300,150,300]);beep();}catch(e){}} };
    $('#tgo').onclick=()=>{ if(T.running){T.left=Math.max(0,Math.round((T.end-Date.now())/1000));T.running=false;} else if(T.left>0){T.end=Date.now()+T.left*1000;T.running=true;} paint(); };
    $('#trs').onclick=()=>{T.running=false;T.left=s.timer_min*60;$('#tmr').classList.remove('ring');paint();};
    clearInterval(tick); tick=setInterval(paint,500); paint(); }
}
function beep(){ const a=new (window.AudioContext||window.webkitAudioContext)(); [0,.4,.8].forEach(t=>{const o=a.createOscillator();o.frequency.value=880;o.connect(a.destination);o.start(a.currentTime+t);o.stop(a.currentTime+t+.25);}); }

function shop(){
  const sel=store.get('shop',[]), chk=store.get('shopchk',{}), items={};
  sel.map(bySlug).filter(Boolean).forEach(r=>{ const k=store.get('sv.'+r.slug,r.servings)/r.servings;
    r.ingredient_groups.forEach(g=>g.items.forEach(i=>{ const key=(i.name.toLowerCase()+'|'+(i.unit||'').toLowerCase());
      const e=items[key]||(items[key]={name:i.name,unit:i.unit,qty:i.qty==null?null:0,from:new Set()});
      if(i.qty!=null&&e.qty!=null) e.qty+=i.qty*(g.fixed?1:k); e.from.add(r.title); })); });
  const list=Object.entries(items);
  app.innerHTML=`<div class="pad"><a class="link" href="#/">← Recipes</a><h1 style="font-size:28px;margin-top:10px">Shopping list</h1>
   <p class="small">Pick recipes, then check things off as you shop. Quantities follow each recipe's servings setting.</p>
   <div class="sec"><h2>Recipes</h2></div>${R.map(r=>`<button class="pick ${sel.includes(r.slug)?'on':''}" data-s="${r.slug}"><img src="${r.hero_image}" alt=""><span><b>${esc(r.title)}</b><br><span class="small">${store.get('sv.'+r.slug,r.servings)} ${esc(r.servings_unit||'servings')}</span></span><span class="box">${sel.includes(r.slug)?'✓':''}</span></button>`).join('')}
   <div class="sec"><h2>To buy (${list.length})</h2>${list.length?'<a class="link" href="javascript:" id="clr">Uncheck all</a>':''}</div>
   ${list.map(([key,e])=>`<button class="ing ${chk[key]?'done':''}" data-k="${esc(key)}"><span class="box">${chk[key]?'✓':''}</span><span class="t">${e.qty?`<span class="q">${fmtQ(e.qty)} ${esc(e.unit)}</span> `:''}${esc(e.name)}${sel.length>1?`<br><span class="note">${[...e.from].map(esc).join(', ')}</span>`:''}</span></button>`).join('')||'<div class="empty">Pick a recipe above to build your list.</div>'}</div>`;
  app.querySelectorAll('.pick').forEach(b=>b.onclick=()=>{let s=store.get('shop',[]);const v=b.dataset.s;s=s.includes(v)?s.filter(x=>x!==v):[...s,v];store.set('shop',s);shopCount();shop();});
  app.querySelectorAll('.ing').forEach(b=>b.onclick=()=>{chk[b.dataset.k]=!chk[b.dataset.k];store.set('shopchk',chk);shop();});
  if($('#clr')) $('#clr').onclick=()=>{store.set('shopchk',{});shop();};
}

function route(){
  const p=location.hash.replace(/^#\/?/,'').split('/'); document.onkeydown=null; clearInterval(tick);
  if(p[0]!=='cook') unlockWake();
  const r=bySlug(p[1]);
  if(p[0]==='r'&&r) recipe(r); else if(p[0]==='cook'&&r) cook(r,+p[2]||1); else if(p[0]==='shop') shop(); else home();
  $('.top').style.display=p[0]==='cook'?'none':''; if(p[0]!=='cook') window.scrollTo(0,0); shopCount();
}
addEventListener('hashchange',route); route();
})();
