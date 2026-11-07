/* =========================================================
   慢邮局 · La Poste Lente — 交互逻辑
   ========================================================= */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const DAY = 864e5;
const now = () => Date.now();
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DOW = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const fmtD = (t, sep='.') => { const d = new Date(t); return `${d.getFullYear()}${sep}${pad(d.getMonth()+1)}${sep}${pad(d.getDate())}`; };
const fmtMD = t => { const d = new Date(t); return `${pad(d.getMonth()+1)}.${pad(d.getDate())}`; };
const fmtHM = t => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtCN = t => { const d = new Date(t); return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`; };

/* ---------- 存储（失败时退回内存） ---------- */
const KEY = 'slowpost.v1';
const store = {
  load(){ try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } },
  save(d){ try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} }
};
const saved = store.load();

/* ---------- 示例信件（时间相对“现在”生成，任何一天打开都成立） ---------- */
const T = now();
const seed = [
  { id:'s1', no:178, to:'一年后的我', title:'关于这个秋天', kind:'letter', img:['postcard','30% 35%'],
    sent:T-10*DAY-3.2e6, arrive:T+355*DAY,
    body:'今年秋天来得很慢。我学会了在早上给植物浇水，学会了一个人去看电影。\n如果你读到这封信的时候，还在为同样的事情发愁——没关系，慢慢来。' },
  { id:'s2', no:179, to:'外婆', title:'院子里的桂花开了', kind:'letter', img:['stationery','62% 30%'],
    sent:T-9*DAY-5e6, arrive:T-2*DAY,
    body:'院子里的桂花开了，我摘了一小把放在窗台上，整间屋子都是您做的桂花糕的味道。\n天凉了，记得添衣服。等过年回家，我想学那道糖醋排骨。' },
  { id:'s3', no:180, to:'阿青', title:'从海边小镇寄出的明信片', kind:'card', img:['postcard','70% 45%'],
    sent:T-20*DAY, arrive:T-6*DAY,
    body:'阿青，这里的桥是石头的，火车每天下午四点经过。\n我坐在河边写这张卡片，突然很想你。' },
  { id:'s4', no:181, to:'慢邮局', title:'只是想说说话', kind:'chat', img:['ticket','30% 50%'],
    sent:T-3*DAY-2e6, arrive:T-3*DAY-2e6,
    convo:[['me','今天加班到很晚，回家路上风很大。'],['post','辛苦了。风大的夜晚适合写信——把今天的事写下来，它就不会一直压在心上。'],['me','好，那我明天写。'],['post','好。慢邮局不打烊，信纸给你留着。']],
    body:'今天加班到很晚，回家路上风很大。' },
  { id:'s5', no:182, to:'十年后的我们', title:'我们约定的那家咖啡馆', kind:'letter', img:['columns','50% 30%'],
    sent:T-14*DAY, arrive:T+3640*DAY,
    body:'如果那家咖啡馆还在，就再去点一次肉桂卷吧。\n如果不在了，就找一家新的，坐在靠窗的位置。' },
  { id:'s6', no:183, to:'小满', title:'生日快乐，迟到的那种', kind:'card', img:['postcard','25% 70%'], fav:true,
    sent:T-8*DAY, arrive:T-1*DAY,
    body:'生日快乐！我知道这张卡片会迟到，但慢邮局说，迟到的祝福走过了更远的路，所以更重一点。' },
  { id:'s7', no:184, to:'雨天的自己', title:'把伞留在门口', kind:'letter', img:['arch','50% 40%'],
    sent:T-2*DAY, arrive:T+12*DAY,
    body:'下雨的时候不必急着出门。把伞留在门口，泡一壶茶，等雨停。' },
  { id:'s8', no:185, to:'陌生人', title:'漂流瓶 No.7', kind:'letter', img:['ticket','70% 40%'], fav:true,
    sent:T-45*DAY, arrive:T-30*DAY,
    body:'你好，陌生人。\n我不知道你是谁，但今天我看到了一片很好看的晚霞，想分享给一个不认识的人。\n愿你今天也有一件小小的好事。' },
  { id:'s9', no:186, to:'未来的房间', title:'关于搬家这件事', kind:'letter', img:['ladder','50% 25%'],
    sent:T-1*DAY, arrive:T+40*DAY,
    body:'新房间朝南，冬天会有太阳。我打算在窗边放一把椅子，和一架梯子形状的书架。' },
];
let mine = saved.mine || [];
const favs = new Set(saved.favs || seed.filter(l => l.fav).map(l => l.id));
const persist = () => store.save({ mine, favs:[...favs], name: $('#greetName').textContent.trim() });
const all = () => [...mine, ...seed].sort((a, b) => b.sent - a.sent);
const isArrived = l => l.arrive <= now();
const nextNo = () => Math.max(186, ...mine.map(m => m.no)) + 1;
const IMG = { postcard:'assets/postcard.webp', stationery:'assets/stationery.webp', ticket:'assets/ticket.webp', arch:'assets/arch.webp', columns:'assets/columns.webp', ladder:'assets/ladder.webp' };
const wordOf = l => l.kind === 'chat' ? 'Bavarder' : !isArrived(l) ? 'En route' : l.kind === 'card' ? 'Carte' : 'Souvenir';

/* ---------- 舞台缩放 ---------- */
const stage = $('#stage');
const fit = () => stage.style.setProperty('--s', Math.min(innerWidth / 1440, innerHeight / 900));
addEventListener('resize', fit); fit();

/* ---------- 时钟 / 日期 ---------- */
function tick(){
  const t = now(), d = new Date(t), hm = fmtHM(t);
  ['#homeClock','#aClock','#footClock'].forEach(s => $(s).textContent = hm);
  $('#bigDate').textContent = fmtD(t, '/');
  $('#bigDow').textContent = DOW[d.getDay()];
  $('#gsDate').textContent = `${fmtD(t)} ${DOW[d.getDay()]}.`;
  $('#pmDay').textContent = pad(d.getDate());
  $('#pmMon').textContent = `${MON[d.getMonth()]} · ${String(d.getFullYear()).slice(2)}`;
  const h = d.getHours();
  $('#greet1').textContent = h < 5 ? 'Bonne nuit,' : h < 12 ? 'Bonjour,' : h < 18 ? 'Bon après-midi,' : 'Bonsoir,';
}
tick(); setInterval(tick, 20000);

/* ---------- 名字可编辑 ---------- */
const nameEl = $('#greetName');
if (saved.name) nameEl.textContent = saved.name;
nameEl.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); } e.stopPropagation(); });
nameEl.addEventListener('blur', () => { if (!nameEl.textContent.trim()) nameEl.textContent = 'Lente'; persist(); toast('Enchanté', `你好，${nameEl.textContent.trim()}`); });

/* ---------- 光尘 ---------- */
const motes = $('#motes');
for (let i = 0; i < 18; i++) {
  const m = document.createElement('i');
  m.style.cssText = `left:${Math.random()*100}%;top:${40+Math.random()*60}%;--dx:${(Math.random()-.5)*80}px;animation-duration:${9+Math.random()*10}s;animation-delay:${-Math.random()*15}s;scale:${.5+Math.random()}`;
  motes.appendChild(m);
}

/* ---------- 吐司 ---------- */
let toastT;
function toast(fr, zh){
  const el = $('#toast'); el.innerHTML = `<em>${esc(fr)}</em>${esc(zh)}`;
  el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2200);
}

/* =========================================================
   视图切换 + 过场
   ========================================================= */
let view = 'home', busy = false, prevView = 'home';
const mist = $('#mist');
function go(next, { fx = 'sweep', after } = {}){
  if (next === view || busy) { after && after(); return; }
  busy = true; prevView = view;
  const cur = $('#' + view), nx = $('#' + next);
  mist.classList.remove('sweep','puff'); void mist.offsetWidth; mist.classList.add(fx);
  cur.classList.add('leaving'); cur.classList.remove('in');
  $$('.charm').forEach(c => { c.classList.remove('wind'); void c.offsetWidth; c.classList.add('wind'); });
  document.body.dataset.view = next;
  setTimeout(() => {
    cur.classList.remove('active','leaving');
    nx.classList.add('active');
    after && after();
    requestAnimationFrame(() => requestAnimationFrame(() => nx.classList.add('in')));
    view = next; markCharms();
    setTimeout(() => busy = false, 300);
  }, fx === 'sweep' ? 560 : 420);
}
requestAnimationFrame(() => requestAnimationFrame(() => $('#home').classList.add('in')));

/* ---------- 左侧挂饰导航 ---------- */
const CHARMS = [ // [起点%, 终点%, 中文, 法文, 动作]
  [0, 12.8, '首页', 'Accueil', () => go('home')],
  [12.8, 22.3, '明信片', 'Carte', () => preset('card')],
  [22.3, 30.8, '关于慢邮局', 'À propos', () => toast('Lentement', '每一封信都会准时迟到。')],
  [30.8, 41.3, '寻信', 'Chercher', () => openArchive('all')],
  [41.3, 50.3, '写信', 'Écrire', () => preset('future')],
  [50.3, 59.8, '随机拆一封', 'Hasard', () => randomLetter()],
  [59.8, 67.3, '收藏', 'Favoris', () => openArchive('fav')],
  [67.3, 76.5, '已送达', 'Arrivées', () => openArchive('arrived')],
  [76.5, 84.3, '私密模式', 'Secret', () => togglePrivate()],
  [84.3, 100, '在途', 'En route', () => openArchive('route')],
];
const charmsEl = $('#charms'), H = 708;
charmsEl.insertAdjacentHTML('beforeend', '<span class="hook"></span>');
CHARMS.forEach(([a, b, zh, fr, fn], i) => {
  const btn = document.createElement('button');
  btn.className = 'charm'; btn.setAttribute('aria-label', zh);
  btn.style.cssText = `top:${a/100*H}px;height:${(b-a)/100*H}px;background-position:0 ${-a/100*H}px;--k:${i}`;
  btn.classList.add('enter');
  btn.addEventListener('animationend', ev => { if (ev.animationName === 'charmIn' || ev.animationName === 'swing') btn.classList.remove('enter', 'wind'); });
  btn.innerHTML = `<span class="tip">${zh}<em>${fr}</em></span>`;
  btn.addEventListener('click', fn);
  charmsEl.appendChild(btn);
});
function markCharms(){
  const on = view === 'home' ? 0 : view === 'archive' ? ({all:3, route:9, arrived:7, fav:6})[filter] : 4;
  $$('.charm').forEach((c, i) => c.classList.toggle('on', i === on));
}
let priv = false;
function togglePrivate(){
  priv = !priv;
  document.documentElement.style.setProperty('--priv', priv ? 'blur(5px)' : 'none');
  $$('.det-text p, .letter, .msg .bubble').forEach(el => el.style.filter = priv ? 'blur(5px)' : '');
  toast(priv ? 'Secret' : 'Visible', priv ? '私密模式已开启：信件内容被模糊' : '私密模式已关闭');
}

/* =========================================================
   首页：视差 + 预设
   ========================================================= */
const layers = $$('#collage [data-depth]');
let mx = 0, my = 0, cx = 0, cy = 0;
addEventListener('mousemove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
(function loop(){
  cx += (mx - cx) * .06; cy += (my - cy) * .06;
  if (view === 'home') layers.forEach(l => { const d = +l.dataset.depth; l.style.translate = `${-cx*d}px ${-cy*d}px`; });
  $('.a-columns').style.translate = `${-cx*10}px ${-cy*6}px`;
  $('.a-ladder').style.translate = `${-cx*18}px ${-cy*10}px`;
  requestAnimationFrame(loop);
})();

const DELAYS = [['即刻', 0], ['明天', 1], ['一周后', 7], ['一个月后', 30], ['一年后', 365], ['十年后', 3650]];
let delayIdx = 3, withCard = false, chatMode = false;
const cpTo = $('#cpTo'), cpText = $('#cpText');
function setDelay(i){ delayIdx = (i + DELAYS.length) % DELAYS.length; $('#cpDelay b').textContent = DELAYS[delayIdx][0]; }
function setCard(v){ withCard = v; $('#cpCard').classList.toggle('on', v); $('#cpCard span').textContent = v ? '●' : '○'; }
$('#cpDelay').addEventListener('click', () => setDelay(delayIdx + 1));
$('#cpCard').addEventListener('click', () => setCard(!withCard));
cpText.addEventListener('input', () => {
  cpText.style.height = '24px'; cpText.style.height = Math.min(cpText.scrollHeight, 88) + 'px';
  $('#cpCount').textContent = `${cpText.value.trim().length} 字`;
});
cpText.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#composer').requestSubmit(); }
});
cpTo.addEventListener('input', () => { chatMode = cpTo.value.trim() === '慢邮局'; });

function preset(kind){
  if (view !== 'home' && view !== 'thread') go('home', { fx:'puff' });
  if (kind === 'future'){ cpTo.value = '一年后的我'; setDelay(4); setCard(false); chatMode = false; }
  if (kind === 'card'){ cpTo.value = '远方的朋友'; setDelay(2); setCard(true); chatMode = false; }
  if (kind === 'chat'){ cpTo.value = '慢邮局'; setDelay(0); setCard(false); chatMode = true; }
  setTimeout(() => { cpText.focus({ preventScroll:true }); }, 500);
  const ph = { future:'À moi, dans un an…  写给一年后的自己', card:'Une carte postale…  在明信片背面写几句', chat:'Juste bavarder…  随便说点什么' }[kind];
  cpText.placeholder = ph;
  $('#composer').animate([{ transform:'translateY(0)' }, { transform:'translateY(-8px)' }, { transform:'translateY(0)' }], { duration:600, easing:'cubic-bezier(.2,.75,.15,1)' });
}
$$('.chip').forEach(c => c.addEventListener('click', () => preset(c.dataset.preset)));

/* ---------- 寄信 ---------- */
let current = null; // 当前信笺
$('#composer').addEventListener('submit', e => {
  e.preventDefault();
  const text = cpText.value.trim();
  if (!text) { cpText.focus(); toast('Vide', '信纸还是空的'); return; }
  const to = cpTo.value.trim() || '一个人';
  $('#composer').classList.remove('sending'); void $('#composer').offsetWidth; $('#composer').classList.add('sending');
  cpText.value = ''; cpText.dispatchEvent(new Event('input'));

  // 在已有对话中继续说话
  if ((chatMode || to === '慢邮局') && view === 'thread' && current && current.kind === 'chat') {
    current.convo.push(['me', text]); persist();
    appendMsg(current, ['me', text], 0); postmanReply(current, text); return;
  }
  const t = now();
  const L = chatMode || to === '慢邮局'
    ? { id:'m'+t, no:nextNo(), to:'慢邮局', title:text.slice(0, 16), kind:'chat', img:['ticket','30% 50%'], sent:t, arrive:t, convo:[['me', text]], body:text, fresh:true }
    : { id:'m'+t, no:nextNo(), to, title:text.split('\n')[0].slice(0, 18), kind: withCard ? 'card' : 'letter',
        img: withCard ? ['postcard', `${20+Math.random()*60|0}% ${20+Math.random()*60|0}%`] : ['stationery', `${20+Math.random()*60|0}% 40%`],
        sent:t, arrive:t + DELAYS[delayIdx][1]*DAY, body:text, fresh:true };
  mine.unshift(L); persist();
  openThread(L);
});

/* =========================================================
   信笺视图
   ========================================================= */
const tInner = $('#tInner'), tScroll = $('#tScroll');
function openThread(L){
  current = L;
  const build = () => renderThread(L);
  if (view === 'thread') { $('#thread').classList.remove('in'); build(); requestAnimationFrame(() => requestAnimationFrame(() => $('#thread').classList.add('in'))); }
  else go('thread', { after: build });
}
function renderThread(L){
  $('#tWord').textContent = wordOf(L) === 'En route' ? 'En route' : L.kind === 'chat' ? 'Bavarder' : L.kind === 'card' ? 'Carte' : 'Lettre';
  $('#tMeta').textContent = `N° ${String(L.no).padStart(4,'0')} · 致 ${L.to}`;
  $('#tFav').textContent = favs.has(L.id) ? '★' : '☆';
  tInner.innerHTML = '';
  if (L.kind === 'chat') {
    L.convo.forEach((m, i) => appendMsg(L, m, i, false));
    if (L.fresh) { L.fresh = false; postmanReply(L, L.convo[L.convo.length-1][1]); }
  } else {
    const arrived = isArrived(L);
    if (L.fresh || arrived) appendHTML(letterHTML(L), 'me wide', 0);
    if (!arrived && !L.fresh) appendHTML(envelopeHTML(L), 'me wide', 0);
    appendHTML(receiptHTML(L), 'wide', 1);
    const note = L.fresh
      ? (L.arrive - L.sent < DAY ? '信已投递。它马上就到。' : `信已经上路了。它会在 <b>${fmtCN(L.arrive)}</b> 到达。<br>在那之前，好好生活。`)
      : arrived ? `这封信已于 ${fmtCN(L.arrive)} 送达，签收人：${esc(L.to)}。` : `还没到拆信的时候。慢邮局会在 ${fmtCN(L.arrive)} 把它交到收信人手里。`;
    appendHTML(`<div class="bubble"><div class="who"><span>FACTEUR · 邮差</span><b>${fmtHM(now())}</b></div>${note}</div>`, '', 2);
    if (L.fresh) { L.fresh = false; persist(); }
    requestAnimationFrame(() => setTimeout(() => {
      $$('.receipt', tInner).forEach(r => { const p = r.dataset.p; r.querySelector('.done').style.width = p + '%'; r.querySelector('.train').style.left = p + '%'; });
    }, 300));
  }
  tScroll.scrollTop = 0;
  if (priv) $$('.letter, .msg .bubble', tInner).forEach(el => el.style.filter = 'blur(5px)');
}
function appendHTML(html, cls, i){
  const d = document.createElement('div'); d.className = 'msg ' + cls; d.style.setProperty('--i', i); d.innerHTML = html;
  tInner.appendChild(d); return d;
}
function appendMsg(L, [who, text], i, scroll = true){
  const me = who === 'me';
  const d = appendHTML(`<div class="bubble"><div class="who"><span>${me ? (nameEl.textContent.trim() || 'MOI').toUpperCase() : 'FACTEUR · 邮差'}</span><b>${fmtHM(now())}</b></div>${esc(text).replace(/\n/g,'<br>')}</div>`, me ? 'me' : '', scroll ? 0 : i);
  if (scroll) tScroll.scrollTo({ top: tScroll.scrollHeight, behavior:'smooth' });
  return d;
}
const REPLIES = [
  [/累|难|烦|丧|哭|焦虑|压力/, '那就先把信纸放下，喝口热茶。慢邮局不催你，今天的信可以明天再写。'],
  [/想|念|思念|回家/, '想念是一种很慢的邮件，但总会到的。要不要把它写成一封真正的信？点首页的「写给一年后的自己」，或者把收信人改成那个人。'],
  [/谢|感谢/, '不客气。邮差的工作就是把话送到该去的地方。'],
  [/雨|风|雪|晴|天气/, '窗外的天气也会被写进邮戳里。今天适合寄一张明信片。'],
  [/你好|hello|hi|嗨/i, '你好呀。今天想聊点什么？慢慢说，邮局不打烊。'],
];
const FALLBACK = ['收到。我把这句话夹进今天的邮包里了。', '嗯，我在听。', '这句话很好，值得被写在信纸上。', '慢慢说，不着急。邮局今天不打烊。'];
function postmanReply(L, text){
  const d = appendHTML(`<div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div>`, '', 0);
  tScroll.scrollTo({ top: tScroll.scrollHeight, behavior:'smooth' });
  const hit = REPLIES.find(([re]) => re.test(text));
  const reply = hit ? hit[1] : FALLBACK[L.convo.length % FALLBACK.length];
  setTimeout(() => {
    d.remove(); L.convo.push(['post', reply]); persist();
    appendMsg(L, ['post', reply], 0);
  }, 1100 + Math.min(text.length * 25, 1400));
}
function letterHTML(L){
  const sig = `<div class="sig">${esc(nameEl.textContent.trim() || 'Lente')}</div>`;
  if (L.kind === 'card') return `<div class="letter card"><div class="cimg" style="background-position:${L.img[1]}"></div><div><div class="lh">Carte postale · 致 ${esc(L.to)}</div>${esc(L.body)}${sig}</div></div>`;
  return `<div class="letter"><div class="lh">Cher·e ${esc(L.to)},</div>${esc(L.body)}${sig}</div>`;
}
function envelopeHTML(L){
  const days = Math.ceil((L.arrive - now()) / DAY);
  return `<div class="envelope"><div class="stampbox"></div><div class="seal"><span>L</span></div>
    <div class="etext"><b>这封信还在路上</b><span>预计 ${fmtD(L.arrive)} 送达 · 还有 ${days} 天才能拆开</span></div></div>`;
}
function receiptHTML(L){
  const total = Math.max(L.arrive - L.sent, 1), p = Math.max(0, Math.min(100, (now() - L.sent) / total * 100));
  const arrived = isArrived(L);
  return `<div class="receipt" data-p="${arrived ? 100 : Math.max(p, 3).toFixed(1)}">
    <div class="rh"><span>✉ <b>seal_letter</b> · 邮局回执</span><span>N° ${String(L.no).padStart(4,'0')}</span></div>
    <div class="rb">
      <div><span class="k">收件人</span>${esc(L.to)}</div>
      <div><span class="k">寄出</span>${fmtD(L.sent)} ${fmtHM(L.sent)}</div>
      <div><span class="k">预计送达</span>${fmtD(L.arrive)} <span class="v-g">· ${arrived ? '已送达 ✓' : `在途 ${Math.ceil((L.arrive-now())/DAY)} 天`}</span></div>
      <div><span class="k">类型</span>${L.kind === 'card' ? '明信片 carte postale' : '平信 lettre'}</div>
      <div class="track"><span class="p" style="left:0"></span><span class="p" style="left:100%;margin-left:-7px"></span><span class="done"></span><svg class="train" viewBox="0 0 30 18"><path fill="currentColor" d="M3 6h11v7H3zM5 3h3v3H5zM14 8h9l3 3v2H14zM16 9h5v2h-5z" opacity=".9"/><circle cx="6" cy="15" r="2" fill="currentColor"/><circle cx="12" cy="15" r="2" fill="currentColor"/><circle cx="21" cy="15" r="2" fill="currentColor"/><circle cx="7" cy="1.5" r="1.3" fill="currentColor" opacity=".35"/><circle cx="3.5" cy=".8" r=".9" fill="currentColor" opacity=".2"/></svg></div>
    </div></div>`;
}
$('#tBack').addEventListener('click', () => go(prevView === 'archive' ? 'archive' : 'home'));
$('#tFav').addEventListener('click', () => current && toggleFav(current));
function toggleFav(L){
  favs.has(L.id) ? favs.delete(L.id) : favs.add(L.id); persist();
  $('#tFav').textContent = favs.has(L.id) ? '★' : '☆';
  toast(favs.has(L.id) ? 'Favori' : 'Retiré', favs.has(L.id) ? `已收藏《${L.title}》` : '已取消收藏');
  if (view === 'archive') renderList(false);
}

/* =========================================================
   寻信视图
   ========================================================= */
const FILTERS = ['all', 'route', 'arrived', 'fav'];
const FNAME = { all:'全部', route:'在途', arrived:'已达', fav:'收藏' };
let filter = 'all', sel = 0, results = [], browsing = false;
const q = $('#q'), list = $('#list');

// 刻度
const ticks = $('#ticks');
for (let i = 0; i < 120; i++) {
  const a = i * 3 * Math.PI / 180, r1 = 152, r2 = i % 10 === 0 ? 164 : i % 5 === 0 ? 160 : 157;
  const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  l.setAttribute('x1', 170 + Math.cos(a)*r1); l.setAttribute('y1', 170 + Math.sin(a)*r1);
  l.setAttribute('x2', 170 + Math.cos(a)*r2); l.setAttribute('y2', 170 + Math.sin(a)*r2);
  l.setAttribute('stroke', 'currentColor'); l.setAttribute('stroke-width', i % 10 === 0 ? 1.2 : .6);
  ticks.appendChild(l);
}
let ringRot = 0;
function setFilter(f, quiet){
  filter = f;
  $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.f === f));
  $('#qTag').textContent = FNAME[f];
  const idx = FILTERS.indexOf(f);
  // 让对应刻字转到顶部，且始终朝同一方向转动
  let r = 90 - idx * 90;
  while (r > ringRot - 1) r -= 360;
  while (r < ringRot - 360) r += 360;
  ringRot = r;
  $('#dialRing').style.transform = `rotate(${ringRot}deg)`;
  sel = 0; renderList(true); markCharms();
  if (!quiet) browsing = true, glyph();
}
$$('#tabs button').forEach(b => b.addEventListener('click', () => setFilter(b.dataset.f)));

function search(){
  const kw = q.value.trim().toLowerCase();
  return all().filter(l => {
    if (filter === 'route' && isArrived(l)) return false;
    if (filter === 'arrived' && !isArrived(l)) return false;
    if (filter === 'fav' && !favs.has(l.id)) return false;
    if (!kw) return true;
    return [l.to, l.title, l.body].some(s => s.toLowerCase().includes(kw));
  });
}
const hl = s => { const kw = q.value.trim(); if (!kw) return esc(s); return esc(s).replace(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'gi'), m => `<mark>${m}</mark>`); };

function renderList(animate){
  results = search();
  sel = Math.min(sel, Math.max(results.length - 1, 0));
  const n = results.length;
  $('#resN').textContent = n; $('#resCount').textContent = n;
  const total = all().length;
  $('#aCount').textContent = pad(total); $('#aCount2').textContent = pad(total);
  $('#routeN').textContent = all().filter(l => !isArrived(l)).length;
  if (!n) { list.innerHTML = `<li class="empty">Rien trouvé · 没有找到信件</li>`; showDetail(null); return; }
  list.innerHTML = results.map((l, i) => {
    const arr = isArrived(l);
    return `<li data-i="${i}" class="${i === sel ? 'sel' : ''}" style="--i:${animate ? i : 0};${animate ? '' : 'animation:none'}">
      <span class="no">${pad(i+1)}</span>
      <div class="mid"><div class="tt">${hl(l.title)}${favs.has(l.id) ? '<span class="fav">★</span>' : ''}</div>
      <div class="mt">致 ${hl(l.to)} · N°${l.no} · <span class="${arr ? '' : 'st-route'}">${arr ? (l.kind === 'chat' ? '对话' : '已送达') : '在途'}</span></div></div>
      <div class="rt"><b>${fmtHM(l.sent)}</b>${fmtMD(l.sent)}</div></li>`;
  }).join('');
  showDetail(results[sel]);
}
list.addEventListener('click', e => {
  const li = e.target.closest('li[data-i]'); if (!li) return;
  const i = +li.dataset.i;
  if (i === sel) return openThread(results[i]);
  select(i);
});
list.addEventListener('dblclick', e => { const li = e.target.closest('li[data-i]'); li && openThread(results[+li.dataset.i]); });
function select(i){
  if (!results.length) return;
  sel = (i + results.length) % results.length;
  $$('#list li').forEach((li, k) => li.classList.toggle('sel', k === sel));
  const li = $(`#list li[data-i="${sel}"]`);
  if (li) { const top = li.offsetTop, bot = top + li.offsetHeight;
    if (top < list.scrollTop) list.scrollTo({ top: top - 6, behavior:'smooth' });
    else if (bot > list.scrollTop + list.clientHeight) list.scrollTo({ top: bot - list.clientHeight + 6, behavior:'smooth' }); }
  browsing = true; glyph();
  showDetail(results[sel]);
}

let flip = false, lastShown = null;
function showDetail(L){
  const body = $('#detBody');
  if (!L) {
    body.innerHTML = `<div class="det-title" style="color:var(--mute);font-weight:400;font-style:italic;font-family:var(--serif)">Aucune lettre ici.</div><div class="det-text"><p>换个关键词，或者切换分类试试。</p></div>`;
    $('#dTagT').textContent = '—'; $('#dword').textContent = 'Vide'; $('#dIdx').textContent = '00';
    return;
  }
  if (lastShown === L.id) return; lastShown = L.id;
  const arr = isArrived(L);
  $('#detNo').textContent = `N° ${pad(sel+1)}`;
  body.classList.remove('swap'); void body.offsetWidth; body.classList.add('swap');
  body.innerHTML = `
    <div class="row"><span class="chipk">致 · ${esc(L.to)}</span><span class="det-meta">N° ${String(L.no).padStart(4,'0')} · 寄于 ${fmtMD(L.sent)} ${fmtHM(L.sent)}</span>
      <span class="chipk ${arr ? 'line' : 'gold'}">${arr ? (L.kind === 'chat' ? '对话' : '已送达') : '在途'}</span>
      <button class="det-open" id="detOpen">${arr ? '拆信 ⏎' : '查看 ⏎'}</button></div>
    <div class="det-title">${hl(L.title)}</div>
    <div class="det-text"><span class="chipk line">${L.kind === 'card' ? 'CARTE' : L.kind === 'chat' ? 'CHAT' : 'TEXTE'}</span>
      ${arr || L.kind === 'chat' ? `<p style="${priv ? 'filter:blur(5px)' : ''}">${hl(L.body).replace(/\n/g, ' ')}</p>`
        : `<div class="sealed-lines"><i style="width:94%"></i><i style="width:80%"></i><i style="width:62%"></i><div class="det-meta" style="margin-top:2px">✉ 火漆未拆 · 预计 ${fmtD(L.arrive)} 送达，还有 ${Math.ceil((L.arrive-now())/DAY)} 天</div></div>`}</div>`;
  $('#detOpen').addEventListener('click', () => openThread(L));

  // 菱形图片交叉淡化
  flip = !flip;
  const a = flip ? $('#dimgA') : $('#dimgB'), b = flip ? $('#dimgB') : $('#dimgA');
  a.style.backgroundImage = `url(${IMG[L.img[0]]})`; a.style.backgroundPosition = L.img[1];
  a.style.backgroundSize = L.img[0] === 'postcard' || L.img[0] === 'stationery' || L.img[0] === 'ticket' ? '260%' : '160%';
  a.classList.add('on'); b.classList.remove('on');
  const dw = $('#dword'); dw.style.opacity = 0;
  setTimeout(() => { dw.textContent = wordOf(L); dw.style.opacity = 1; }, 250);
  // 序号与标签
  const idx = $('#dIdx'), tag = $('#dTag');
  idx.classList.add('swap'); tag.classList.add('swap');
  setTimeout(() => {
    idx.textContent = pad(sel + 1);
    $('#dTagK').textContent = arr ? (sel === 0 ? 'RECENT' : 'ARCHIVE') : 'EN ROUTE';
    $('#dTagD').textContent = fmtMD(L.sent);
    $('#dTagT').textContent = L.title;
    idx.classList.remove('swap'); tag.classList.remove('swap');
  }, 260);
  // 指针
  $('#dialHand').style.transform = `rotate(${(sel / Math.max(results.length, 1)) * 360}deg)`;
}
function glyph(){
  const read = browsing || q.value.trim();
  $('#glyphA').classList.toggle('on', !read);
  $('#glyphB').classList.toggle('on', !!read);
  $('#gsMode').textContent = read ? 'Lire · trouvé' : 'Chercher · en veille';
}
let qT;
q.addEventListener('input', () => { clearTimeout(qT); qT = setTimeout(() => { sel = 0; lastShown = null; renderList(true); glyph(); }, 160); });

function renderSugg(){
  const recent = ['桂花', '明信片', '一年后', '咖啡馆', '雨'];
  $('#sugg').innerHTML = recent.map(s => `<button>${s}</button>`).join('');
  $$('#sugg button').forEach(b => b.addEventListener('click', () => { q.value = b.textContent; q.dispatchEvent(new Event('input')); q.focus(); }));
}
renderSugg();

function openArchive(f = 'all'){
  const start = () => { browsing = false; lastShown = null; q.value = ''; setFilter(f, true); glyph();
    $$('#list li').forEach(li => li.style.setProperty('--base', '700ms')); };
  if (view === 'archive') { setFilter(f); return; }
  go('archive', { after: start });
  setTimeout(() => q.focus({ preventScroll:true }), 1100);
}
function randomLetter(){
  const pool = all().filter(isArrived);
  const L = pool[Math.random() * pool.length | 0];
  toast('Hasard', `随机拆开了《${L.title}》`);
  openThread(L);
}

/* =========================================================
   键盘
   ========================================================= */
addEventListener('keydown', e => {
  const typing = ['INPUT','TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable;
  if (view === 'archive') {
    if (e.key === 'ArrowDown') { e.preventDefault(); select(sel + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); select(sel - 1); }
    else if (e.key === 'Tab') { e.preventDefault(); setFilter(FILTERS[(FILTERS.indexOf(filter) + (e.shiftKey ? 3 : 1)) % 4]); }
    else if (e.key === 'Enter' && results[sel]) { e.preventDefault(); openThread(results[sel]); }
    else if (e.key === 'Escape') { if (q.value) { q.value = ''; q.dispatchEvent(new Event('input')); } else go('home'); }
    else if ((e.key === 'f' || e.key === 'F') && !typing && results[sel]) toggleFav(results[sel]);
    return;
  }
  if (e.key === 'Escape') { document.activeElement.blur(); if (view === 'thread') go(prevView === 'archive' ? 'archive' : 'home'); return; }
  if (typing) return;
  if (e.key === '/') { e.preventDefault(); openArchive('all'); }
  if (view === 'thread' && (e.key === 'f' || e.key === 'F') && current) toggleFav(current);
});

markCharms();
})();
