/* Glowcap app: screens and behaviour. Lives on GitHub so every buyer gets fixes at once. */
(function(){
document.body.insertAdjacentHTML('afterbegin',"<header class=\"hero\" style=\"background-image:url('https://designsbynyxie.github.io/art/app_hero.jpg')\">\n  <div class=\"chips\"><span class=\"chip\" id=\"gold\">🪙 0</span><span class=\"chip\" id=\"tok\">☾ 0</span></div>\n  <div class=\"in\"><div class=\"name\" id=\"nm\">Glowcap</div><div class=\"title\" id=\"ti\">&nbsp;</div>\n  <div class=\"bar\"><i id=\"xb\" style=\"width:0\"></i></div><div class=\"meta\"><span id=\"xl\"></span><span id=\"xn\"></span></div></div>\n</header>\n<main class=\"wrap\" id=\"view\"><div class=\"load\"><div class=\"grow\"><img src=\"https://designsbynyxie.github.io/art/grow0.png\" style=\"animation-delay:0.00s\" alt=\"\"><img src=\"https://designsbynyxie.github.io/art/grow1.png\" style=\"animation-delay:0.42s\" alt=\"\"><img src=\"https://designsbynyxie.github.io/art/grow2.png\" style=\"animation-delay:0.84s\" alt=\"\"><img src=\"https://designsbynyxie.github.io/art/grow3.png\" style=\"animation-delay:1.26s\" alt=\"\"><img src=\"https://designsbynyxie.github.io/art/grow4.png\" style=\"animation-delay:1.68s\" alt=\"\"><img src=\"https://designsbynyxie.github.io/art/grow5.png\" style=\"animation-delay:2.10s\" alt=\"\"></div>Opening your quest log…</div></main>\n<nav><div>\n<button data-t=\"today\" class=\"on\"><b>🌿</b>Today</button><button data-t=\"side\"><b>🗺️</b>Quests</button>\n<button data-t=\"shop\"><b>🎁</b>Rewards</button><button data-t=\"journey\"><b>🌙</b>Journey</button>\n</div></nav>\n<div id=\"toast\"></div><div id=\"modal\"></div>");

try{window.top.postMessage('glowcap-ready','*');}catch(e){}
var VIEW=window.GC_VIEW||'', S=null, tab=VIEW==='quick'?'quick':VIEW==='side'?'addside':'today', day=todayStr(), TZ=Intl.DateTimeFormat().resolvedOptions().timeZone, busy=false, newDiff='Easy', noteT=null;
function todayStr(d){d=d||new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
function parse(s){var p=s.split('-');return new Date(+p[0],p[1]-1,+p[2]);}
function shift(s,n){var d=parse(s);d.setDate(d.getDate()+n);return todayStr(d);}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function $(id){return document.getElementById(id);}
function rpc(req,ok,fail){google.script.run.withSuccessHandler(ok).withFailureHandler(fail).rpc(req);}
function load(){var d0=day,t=++loadTok;rpc({tz:TZ,r:GC.reads(day)},function(res){if(t!==loadTok||d0!==day||Q.length||sending)return;soft(GC.parse(res,d0));},function(e){toast('⚠ '+(e.message||e));});}
var loadTok=0,lastTap=0,softT=null;
/* never redraw the list under a finger: wait until taps pause */
function soft(s){clearTimeout(softT);var w=1200-(Date.now()-lastTap);if(S&&w>0){softT=setTimeout(function(){if(!Q.length&&!sending)soft(s);},w);return;}apply(s);}
/* taps save in the background: the screen updates at once and never waits for the sheet */
var Q=[],sending=false;
function save(key,w){Q=Q.filter(function(j){return j.key!==key;});Q.push({key:key,w:w,day:day});pump();}
function pump(){if(sending||!Q.length)return;sending=true;var j=Q.shift();
  rpc({tz:TZ,w:j.w,r:GC.reads(j.day)},function(res){sending=false;if(Q.length)pump();else if(j.day===day)soft(GC.parse(res,j.day));},
  function(e){sending=false;Q=[];toast('⚠ Not saved: '+(e.message||e));load();});}
function apply(s){var old=S;S=s;head();render();if(!old&&tab==='addside')setTimeout(function(){var i=$('sqn');if(i)i.focus();},150);
  if(old&&s.level>old.level)levelUp(s);else if(old&&s.xp>old.xp)toast('+'+(s.xp-old.xp)+' XP ✦');
  if(old){var a=s.ach.filter(function(x,i){return x.on&&!old.ach[i].on;});if(a.length)setTimeout(function(){badge(a[0]);},s.level>old.level?2600:700);}}
function head(){$('nm').textContent=S.name;$('ti').textContent='Level '+S.level+' · '+S.title;
  $('xb').style.width=Math.round(Math.max(0,Math.min(1,S.progress))*100)+'%';
  $('xl').textContent=S.xp.toLocaleString()+' XP';$('xn').textContent=S.nextXP>S.xp?(S.nextXP-S.xp).toLocaleString()+' to '+S.nextTitle:'Max level ✦';
  $('gold').textContent='🪙 '+S.gold.toLocaleString();$('tok').textContent='☾ '+S.tokensLeft;}
function render(){document.body.classList.toggle('compact',tab==='quick'||tab==='addside');var v=$('view');v.innerHTML=({today:vToday,side:vSide,shop:vShop,journey:vJourney,quick:vQuick,addside:vAddSide})[tab]();bind();}
function vAddSide(){var n=S.side.open.length;return '<div class="qhead"><b>✦ New side quest</b><span>'+n+' open</span></div><input id="sqn" placeholder="e.g. Repot the monstera" maxlength="120" enterkeyhint="done"><div class="row pick">'+
  ['Easy','Tricky','Epic'].map(function(d){return '<button data-a="diff" data-d="'+d+'" class="'+(newDiff===d?'on':'')+'">'+d+' · '+({Easy:10,Tricky:25,Epic:60})[d]+'</button>';}).join('')+'</div><div class="row"><button class="btn" style="flex:1" data-a="addside">Add side quest ✦</button></div>'+
  '<div style="text-align:center;margin-top:14px"><button class="btn ghost" data-a="full">Open the full app</button></div>';}
function vQuick(){var done=S.quests.filter(isDone).length,h='<div class="qhead"><b>✦ Quick log</b><span>'+done+' of '+S.quests.length+' done today</span></div><div class="qgrid">';
  S.quests.forEach(function(q){var dn=isDone(q);h+='<button class="qt '+(dn?'done':'')+'" data-a="'+(q.goal>1?'inc':'tick')+'" data-k="'+q.k+'"><b>'+esc(q.icon)+'</b><span>'+esc(q.name)+'</span><small>'+(q.goal>1?q.value+' / '+q.goal+' '+esc(q.unit):(dn?'done ✦':'+'+q.xp+' XP'))+'</small></button>';});
  if(!S.quests.length)h+='<div class="panel empty" style="grid-column:1/3">No quests yet — add them on the Quest Board tab.</div>';
  return h+'</div><div style="text-align:center;margin-top:16px"><button class="btn ghost" data-a="full">Open the full app</button></div>';}
function ring(p){var r=24,c=2*Math.PI*r;return '<svg width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="'+r+'" stroke="#0b120d" stroke-width="7" fill="none"/><circle cx="30" cy="30" r="'+r+'" stroke="#c9a860" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="'+c+'" stroke-dashoffset="'+(c*(1-p))+'" transform="rotate(-90 30 30)" style="transition:stroke-dashoffset .8s"/><text x="30" y="35" text-anchor="middle" fill="#f2e8d0" font-size="14" font-weight="800" font-family="Nunito">'+Math.round(p*100)+'%</text></svg>';}
function isDone(q){return q.goal>1?q.value>=q.goal:!!q.value;}
function vToday(){
  var t=todayStr(), d=parse(day), lbl=day===t?'Today':day===shift(t,-1)?'Yesterday':d.toLocaleDateString(undefined,{weekday:'long'});
  var h='<div class="dnav"><button data-a="prev">‹</button><div class="d"><b>'+lbl+'</b><span>'+d.toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'})+'</span></div><button data-a="next" '+(day>=t?'disabled':'')+'>›</button></div>';
  if(!S.inRange)return h+'<div class="panel empty">This day is outside your quest year (it starts '+esc(S.start)+'). Change the start date on the Quest Board.</div>';
  var done=S.quests.filter(isDone).length, n=S.quests.length||1;
  h+='<div class="ring">'+ring(done/n)+'<div class="t"><b>'+done+' of '+S.quests.length+' quests</b><span>'+(S.rest?'Resting — your streaks are safe ☾':(done===S.quests.length&&done?'Every quest done. Splendid!':'+'+S.dayXP+' XP earned this day'))+'</span></div></div>';
  S.quests.forEach(function(q){var dn=isDone(q);
    var st=q.isDaily?(q.cur?'<span class="st">🔥 '+q.cur+'-day streak</span>':''):'<span class="st">'+q.week+'/'+q.perWeek+' this week'+(q.cur?' · 🔥 '+q.cur+' wk':'')+'</span>';
    h+='<div class="q '+(dn?'done':'')+'" '+(q.goal>1?'':'data-a="tick" data-k="'+q.k+'"')+'><div class="ic">'+esc(q.icon)+'</div><div class="tx"><div class="nm">'+esc(q.name)+'</div><div class="sub"><span class="xp">+'+q.xp+' XP</span>'+st+'</div>'+
      (q.goal>1?'<div class="pbar"><i style="width:'+Math.min(100,q.value/q.goal*100)+'%"></i></div>':'')+'</div>'+
      (q.goal>1?'<div class="cnt"><button data-a="dec" data-k="'+q.k+'">−</button><div class="v">'+q.value+'/'+q.goal+'<small>'+esc(q.unit)+'</small></div><button data-a="inc" data-k="'+q.k+'">+</button></div>':'<div class="chk">✔</div>')+'</div>';});
  if(!S.quests.length)h+='<div class="panel empty">No quests yet — add them on the Quest Board tab of your sheet.</div>';
  h+='<div class="sec">Rest & reflect</div><div class="panel rest '+(S.rest?'resting':'')+'"><div class="tx"><b>☾ Rest day</b><span>'+(S.rest?'Streaks protected for this day':S.tokensLeft+' of '+S.tokensPerMonth+' rest days left this month')+'</span></div><div class="tog '+(S.rest?'on':'')+'" data-a="rest"></div></div>';
  h+='<div class="panel"><div style="font-weight:800;margin-bottom:6px">How did the day feel?</div><div class="moods">'+['😄','🙂','😐','😔','😫'].map(function(m){return '<button data-a="mood" data-m="'+m+'" class="'+(S.mood===m?'on':'')+'">'+m+'</button>';}).join('')+
    '</div><textarea id="note" placeholder="A line about today…">'+esc(S.note)+'</textarea></div>';
  return h;}
function vMains(){if(!S.mains||!S.mains.length)return '';var h='<div class="sec">Main quests</div>';S.mains.forEach(function(m){h+='<div class="mq '+(m.done?'won':'')+'"><div class="t"><span>'+esc(m.icon)+'</span>'+esc(m.name)+'<em>'+(m.done?'✦ complete':'+'+m.xp+' XP')+'</em></div><div class="sub">'+(m.area?esc(m.area):'')+(m.due?' · due '+esc(m.due):'')+'</div><div class="pbar"><i style="width:'+Math.round(m.pct*100)+'%"></i></div>'+m.steps.map(function(s){return '<div class="st '+(s.done?'on':'')+'" data-a="step" data-r="'+m.row+'" data-i="'+s.i+'" data-on="'+(s.done?0:1)+'"><b>✔</b>'+esc(s.name)+'</div>';}).join('')+'</div>';});return h;}
function vSide(){var h=vMains()+'<div class="sec">New side quest</div><div class="panel"><input id="sqn" placeholder="e.g. Repot the monstera" maxlength="120"><div class="row pick">'+
  ['Easy','Tricky','Epic'].map(function(d){return '<button data-a="diff" data-d="'+d+'" class="'+(newDiff===d?'on':'')+'">'+d+' · '+({Easy:10,Tricky:25,Epic:60})[d]+'</button>';}).join('')+'</div><div class="row"><button class="btn" style="flex:1" data-a="addside">Add side quest</button></div></div>';
  h+='<div class="sec">Open side quests</div><div class="panel">';
  h+=S.side.open.length?S.side.open.map(function(s){return '<div class="item"><div class="tx">'+esc(s.name)+'<small>'+s.diff+'</small></div><span class="badge">+'+s.xp+'</span><button class="btn" data-a="sdone" data-r="'+s.row+'">Done</button></div>';}).join(''):'<div class="empty">Nothing open. A quiet road ahead ✦</div>';
  h+='</div>';
  if(S.side.done.length)h+='<div class="sec">Recently completed</div><div class="panel">'+S.side.done.map(function(s){return '<div class="item" style="opacity:.6"><div class="tx"><s>'+esc(s.name)+'</s><small>'+s.date+'</small></div><button class="btn ghost" data-a="sundo" data-r="'+s.row+'">Undo</button></div>';}).join('')+'</div>';
  return h;}
function vShop(){var h='<div class="panel" style="text-align:center"><div style="font-size:34px">🪙</div><div style="font-family:Cinzel,serif;font-size:24px;color:var(--gold2)">'+S.gold.toLocaleString()+' gold</div><div style="font-size:12px;color:var(--muted)">Every 10 XP earns 1 gold</div></div>';
  var open=S.rewards.filter(function(r){return !r.claimed;}), got=S.rewards.filter(function(r){return r.claimed;});
  h+='<div class="sec">Rewards shop</div><div class="panel">'+(open.length?open.map(function(r){return '<div class="item"><div class="tx">'+esc(r.name)+'<small>'+r.cost+' gold</small></div><button class="btn" data-a="claim" data-r="'+r.row+'" '+(S.gold<r.cost?'disabled':'')+'>'+(S.gold<r.cost?'Need '+(r.cost-S.gold):'Claim')+'</button></div>';}).join(''):'<div class="empty">Add a treat to save up for.</div>')+'</div>';
  h+='<div class="sec">Add a reward</div><div class="panel"><input id="rwn" placeholder="e.g. A new candle" maxlength="120"><div class="row"><input id="rwc" type="number" inputmode="numeric" placeholder="Gold cost" style="flex:1"><button class="btn" data-a="addrw">Add</button></div></div>';
  if(got.length)h+='<div class="sec">Claimed</div><div class="panel">'+got.slice(-6).reverse().map(function(r){return '<div class="item" style="opacity:.6"><div class="tx">'+esc(r.name)+'<small>'+r.date+'</small></div><span class="badge">'+r.cost+'</span></div>';}).join('')+'</div>';
  return h;}
function vJourney(){var t=todayStr(),h='<div class="sec">The last five weeks</div><div class="panel"><div class="wk">'+['Mo','Tu','We','Th','Fr','Sa','Su'].map(function(x){return '<span>'+x+'</span>';}).join('')+'</div><div class="heat">';
  S.heat.forEach(function(r){r.forEach(function(c){var cl=c.pct===null?'fu':c.pct===-1?'hr':c.pct>=.99?'h3':c.pct>=.5?'h2':c.pct>0?'h1':'';h+='<div class="'+cl+(c.d===t?' td':'')+'">'+(c.pct===-1?'☾':c.day)+'</div>';});});
  h+='</div></div><div class="sec">XP per week</div><div class="panel"><div class="bars">';
  var mx=Math.max.apply(null,S.weekXP.concat([1]));S.weekXP.forEach(function(x){h+='<i style="height:'+Math.max(3,x/mx*100)+'%" title="'+x+'"></i>';});
  h+='</div></div><div class="sec">Streaks</div><div class="panel">'+S.quests.map(function(q){return '<div class="item"><div class="tx">'+esc(q.icon)+' '+esc(q.name)+'<small>best '+q.best+(q.isDaily?' days':' weeks')+' · '+Math.round(q.last30*100)+'% last 30 days</small></div><span class="badge">🔥 '+q.cur+'</span></div>';}).join('')+'</div>';
  h+='<div class="sec">Achievements · '+S.achUnlocked+'/12</div><div class="ach">'+S.ach.map(function(a){return '<div class="'+(a.on?'on':'')+'"><b>'+a.icon+'</b>'+esc(a.name)+'</div>';}).join('')+'</div>';
  h+='<div class="sec">Mood · last 30 days</div><div class="panel" style="display:flex;justify-content:space-around">'+S.moods.map(function(m){return '<div style="text-align:center;font-size:24px">'+m.e+'<div style="font-size:13px;color:var(--muted);font-weight:800">'+m.n+'</div></div>';}).join('')+'</div>';
  return h;}
function q(k){for(var i=0;i<S.quests.length;i++)if(S.quests[i].k==k)return S.quests[i];}
function bind(){
  document.querySelectorAll('[data-a]').forEach(function(el){el.onclick=function(ev){act(el.dataset.a,el,ev);};});
  var n=$('note');if(n)n.oninput=function(){clearTimeout(noteT);noteT=setTimeout(function(){S.note=n.value;save('note',GC.W.note(day,n.value));},900);};}
function act(a,el,ev){var light=/^(tick|inc|dec|rest|mood|diff|prev|next|sdone|sundo|step|claim|addside|addrw)$/.test(a);if(/^(tick|inc|dec|rest|mood|sdone|sundo|step|claim|addside|addrw)$/.test(a))lastTap=Date.now();if((busy&&!light)||(!S&&a!=='prev'&&a!=='next'))return;var k=el.dataset.k,o;
  if(a==='prev'){day=shift(day,-1);S.quests=[];render();load();}
  else if(a==='next'){day=shift(day,1);render();load();}
  else if(a==='tick'){o=q(k);o.value=!o.value;if(o.value)sparks(ev);render();save('q'+k,GC.W.quest(day,+k,o.value));}
  else if(a==='inc'||a==='dec'){o=q(k);var nv=Math.max(0,o.value+(a==='inc'?1:-1));if(nv===o.value)return;var was=isDone(o);o.value=nv;if(!was&&isDone(o))sparks(ev);render();save('q'+k,GC.W.quest(day,+k,nv));}
  else if(a==='rest'){if(!S.rest&&S.tokensLeft<1){toast('No rest days left this month ☾');return;}S.rest=!S.rest;render();save('rest',GC.W.rest(day,S.rest));}
  else if(a==='mood'){var m=S.mood===el.dataset.m?'':el.dataset.m;S.mood=m;render();save('mood',GC.W.mood(day,m));}
  else if(a==='diff'){newDiff=el.dataset.d;render();}
  else if(a==='addside'){var nm=$('sqn').value.trim();if(!nm){$('sqn').focus();return;}var keep=tab==='addside';sparks(ev);var nr=GC.freeRow(S.sideRows,GC.QL.SQF,GC.QL.SQN);if(!nr){toast('Your side quest list is full');return;}S.sideRows.push(nr);S.side.open.push({row:nr,name:nm,diff:newDiff,xp:GC.XP[newDiff]||10});render();toast(keep?'Added ✦ — add another or swipe away':'Side quest added ✦');var i2=$('sqn');if(i2){i2.value='';if(keep)i2.focus();}save('add'+nr,GC.W.addSide(nr,nm,newDiff));}
  else if(a==='sdone'){var r=+el.dataset.r;var o2=S.side.open.filter(function(x){return x.row===r;})[0];if(!o2)return;sparks(ev);S.side.open=S.side.open.filter(function(x){return x!==o2;});o2.date=todayStr();S.side.done.unshift(o2);render();toast('+'+o2.xp+' XP ✦');save('s'+r,GC.W.side(r,true,todayStr()));}
  else if(a==='step'){var on=el.dataset.on==='1',mr=+el.dataset.r,si=+el.dataset.i,m=S.mains.filter(function(x){return x.row===mr;})[0];if(!m)return;var was=m.done;m.steps.forEach(function(x){if(x.i===si)x.done=on;});var nd=m.steps.filter(function(x){return x.done;}).length;m.pct=m.steps.length?nd/m.steps.length:0;m.done=m.steps.length>0&&nd===m.steps.length;if(on)sparks(ev);render();if(m.done&&!was){modal('🐉','Main quest complete!',esc(m.name)+'<br><b style="color:#f0c96a">+'+m.xp+' XP</b>');burst();}save('m'+mr+'_'+si,GC.W.step(mr,si,on,m.done,todayStr()));}
  else if(a==='sundo'){var r3=+el.dataset.r,o3=S.side.done.filter(function(x){return x.row===r3;})[0];if(!o3)return;S.side.done=S.side.done.filter(function(x){return x!==o3;});S.side.open.push(o3);render();save('s'+r3,GC.W.side(r3,false,todayStr()));}
  else if(a==='claim'){var r4=+el.dataset.r,w=S.rewards.filter(function(x){return x.row===r4;})[0];if(!w)return;if(S.gold<w.cost)return;sparks(ev);w.claimed=true;w.date=todayStr();S.gold-=w.cost;head();render();modal('🎁','Reward claimed','Enjoy it — you earned this.');save('r'+r4,GC.W.claim(r4,todayStr()));}
  else if(a==='addrw'){var rn=$('rwn').value.trim(),rc=$('rwc').value;if(!rn){$('rwn').focus();return;}var rr=GC.freeRow(S.rewards.map(function(x){return x.row;}),GC.QL.RWF,GC.QL.RWN);if(!rr){toast('Your rewards list is full');return;}S.rewards.push({row:rr,name:rn,cost:Math.max(1,Math.round(Number(rc)||10)),claimed:false,date:''});render();toast('Reward added 🎁');var ri=$('rwn');if(ri)ri.value='';var rci=$('rwc');if(rci)rci.value='';save('rw'+rr,GC.W.addReward(rr,rn,rc||10));}
  else if(a==='full'){tab='today';document.querySelectorAll('nav button').forEach(function(x){x.classList.toggle('on',x.dataset.t==='today');});render();scrollTo(0,0);}
  else if(a==='close'){$('modal').className='';}}
function toast(t){var e=$('toast');e.textContent=t;e.className='show';clearTimeout(e._t);e._t=setTimeout(function(){e.className='';},1800);}
function modal(ic,h,p){var m=$('modal');m.innerHTML='<div class="box"><div class="big">'+ic+'</div><h2>'+h+'</h2><p>'+p+'</p><button class="btn" data-a="close">Onward</button></div>';m.className='show';m.querySelector('button').onclick=function(){m.className='';};}
function levelUp(s){modal('🌟','Level '+s.level+'!','You are now a<br><b style="color:#f0c96a">'+esc(s.title)+'</b>');burst();}
function badge(a){modal(a.icon,'Achievement unlocked',esc(a.name)+'<br><span style="font-size:15px;color:#94a58a">'+esc(a.desc)+'</span>');}
function sparks(ev){var x=ev&&ev.clientX||innerWidth/2,y=ev&&ev.clientY||innerHeight/2;for(var i=0;i<10;i++){var s=document.createElement('div');s.className='spark';s.textContent=['✦','✧','✨','·'][i%4];s.style.left=x+'px';s.style.top=y+'px';s.style.color=i%2?'#f0c96a':'#9fb07f';
  var an=Math.random()*Math.PI*2,d=40+Math.random()*50;s.style.setProperty('--x',Math.cos(an)*d+'px');s.style.setProperty('--y',Math.sin(an)*d+'px');document.body.appendChild(s);setTimeout(function(e){return function(){e.remove();};}(s),950);}
  if(navigator.vibrate)navigator.vibrate(12);}
function burst(){for(var i=0;i<4;i++)setTimeout(function(){sparks({clientX:innerWidth*(.2+Math.random()*.6),clientY:innerHeight*(.25+Math.random()*.3)});},i*180);}
document.querySelectorAll('nav button').forEach(function(b){b.onclick=function(){tab=b.dataset.t;document.querySelectorAll('nav button').forEach(function(x){x.classList.toggle('on',x===b);});if(S)render();scrollTo(0,0);};});
document.addEventListener('visibilitychange',function(){if(!document.hidden){var t=todayStr();if(day>t)day=t;load();}});
load();

})();
