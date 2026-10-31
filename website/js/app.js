/* 石椅答卷：路由、内容渲染、轮播、个人档案与通用可访问交互 */
(function () {
  'use strict';
  const D = window.DATA;
  const $ = id => document.getElementById(id);
  const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = window.shiyiEscape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (_) { return fallback; } };
  const safeStore = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } };
  let toastTimer = 0, lastFocus = null;

  function toast(text) {
    const el = $('siteToast');
    if (!el) return;
    el.textContent = text; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  }
  function syncScrollLock() {
    document.body.classList.toggle('layer-open', !!document.querySelector('.ft-overlay.on,.modal-mask.on'));
  }
  function openLayer(el) {
    if (!el) return;
    lastFocus = document.activeElement;
    el.classList.add('on'); syncScrollLock();
    const focus = el.querySelector('input:not([hidden]),button,[tabindex="0"]');
    if (focus) setTimeout(() => focus.focus({ preventScroll: true }), 30);
  }
  function closeLayer(el) {
    if (!el) return;
    el.classList.remove('on'); syncScrollLock();
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }
  window.ShiyiUI = { toast, openLayer, closeLayer, syncScrollLock, esc, safeJSON, safeStore, reduced };

  /* 路由同时写入 hash，刷新与浏览器前进/后退不丢页面。 */
  const PAGES = ['home', 'spirit', 'history', 'tour', 'profile', 'game'];
  window.go = function (page, fromHash) {
    if (!PAGES.includes(page) || !$('page-' + page)) page = 'home';
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('on', p.id === 'page-' + page));
    document.querySelectorAll('.nav-tab').forEach(t => {
      const on = t.dataset.page === page;
      t.classList.toggle('on', on);
      if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    });
    if (!fromHash && location.hash !== '#' + page) history.pushState(null, '', '#' + page);
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    document.title = ({ home: '石椅答卷 · 政绩观好样本', spirit: '政绩观五问 · 石椅答卷', history: '接力村史 · 石椅答卷', tour: '看石椅 · 石椅答卷', profile: '我的接力棒 · 石椅答卷', game: '凿通大岩路 · 石椅答卷' })[page];
    if (['spirit', 'history', 'tour'].includes(page)) markVisit(page);
    if (page === 'game' && window.ShiyiGame) ShiyiGame.init();
    if (page === 'profile') renderProfile();
  };
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-page]');
    if (t) go(t.dataset.page);
  });
  window.addEventListener('hashchange', () => go(location.hash.slice(1), true));

  /* 首页五问：自动播放可暂停，鼠标悬停/键盘聚焦/后台页面均停止。 */
  const SHORT = ['为谁树', '靠谁树', '干多久', '树什么', '政绩界'];
  const five = D.spirit.five.map((f, i) => ({ ...f, short: SHORT[i] || f.question }));
  let qIdx = 0, qPaused = reduced, qTimer = 0;
  function renderQ() {
    const f = five[qIdx];
    $('qCarousel').innerHTML = `
      <article class="q-slide" aria-live="off">
        <span class="q-number">0${qIdx + 1}</span>
        <div class="q-eyebrow">${esc(f.name)}</div>
        <h2>${esc(f.short)}</h2>
        <p>${esc(f.essence)}</p>
        <button class="text-link" data-qalink="${qIdx}">阅读完整回答 <span aria-hidden="true">→</span></button>
      </article>
      <div class="q-controls">
        <button class="q-arrow" data-qmove="-1" aria-label="上一问">←</button>
        <div class="q-dots">${five.map((_, i) => `<button class="q-dot ${i === qIdx ? 'on' : ''}" data-qdot="${i}" aria-label="第 ${i + 1} 问" aria-pressed="${i === qIdx}"></button>`).join('')}</div>
        <button class="q-arrow" data-qmove="1" aria-label="下一问">→</button>
        <button class="q-pause" data-qpause aria-pressed="${qPaused}">${qPaused ? '播放' : '暂停'}</button>
      </div>`;
  }
  function qSchedule() {
    clearInterval(qTimer);
    if (!qPaused) qTimer = setInterval(() => { if (!document.hidden && $('page-home').classList.contains('on')) { qIdx = (qIdx + 1) % five.length; renderQ(); } }, 6000);
  }
  renderQ(); qSchedule();
  $('qCarousel').addEventListener('click', e => {
    const move = e.target.closest('[data-qmove]'), dot = e.target.closest('[data-qdot]');
    if (move) qIdx = (qIdx + Number(move.dataset.qmove) + five.length) % five.length;
    else if (dot) qIdx = Number(dot.dataset.qdot);
    else if (e.target.closest('[data-qpause]')) { qPaused = !qPaused; qSchedule(); }
    else if (e.target.closest('[data-qalink]')) { go('spirit'); setTimeout(() => { const el = $('qa' + qIdx); if (el) { el.classList.add('open'); el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); } }, 80); return; }
    else return;
    renderQ();
  });
  $('qCarousel').addEventListener('mouseenter', () => clearInterval(qTimer));
  $('qCarousel').addEventListener('mouseleave', qSchedule);
  $('qCarousel').addEventListener('focusin', () => clearInterval(qTimer));
  $('qCarousel').addEventListener('focusout', qSchedule);
  document.addEventListener('visibilitychange', qSchedule);

  const stats = [
    { label: '人均可支配收入', before: '8000 元', after: '10 万元', note: '2008 → 2022，增长超 11 倍' },
    { label: '年接待游客', before: '4 万人次', after: '50 万人次', note: '文旅融合，羌寨客如潮' },
    { label: '村集体年收入', before: '一穷二白', after: '154 万元', note: '「好样子」公司覆盖全镇' },
    { label: '国家级荣誉', before: '寂寂无名', after: '11 项', note: '全国文明村等国字号桂冠' },
  ];
  $('statsGrid').innerHTML = stats.map(s => `<article class="card stat-card"><div class="stat-label">${s.label}</div><div class="stat-before">昔日 ${s.before}</div><div class="stat-after">${s.after}</div><div class="stat-note">${s.note}</div></article>`).join('');

  const entries = [
    { icon: '凿', name: '重走大岩路', desc: '亲手抡镐凿岩，三年凿出五米宽、三公里的绝壁生路', act: "go('game')", feat: true },
    { icon: '问', name: '政绩观五问', desc: '五问五答', act: "go('spirit')" },
    { icon: '谱', name: '接力村史', desc: '七任书记', act: "go('history')" },
    { icon: '游', name: '看石椅', desc: '六大点位', act: "go('tour')" },
    { icon: '句', name: '金句海报生成器', desc: '选语录选模板，生成专属海报', act: 'openPoster()' },
    { icon: '章', name: '云上集章打卡', desc: '六大点位，盖章见证', act: 'openCheckin()' },
    { icon: '测', name: '情境测评', desc: '24 道抉择，测一测你的政绩观底色', act: 'openQuiz()', wide: true },
  ];
  $('plazaGrid').innerHTML = entries.map((e, i) => `<button class="plaza-card${e.feat ? ' plaza-feat' : ''}${e.wide ? ' plaza-wide' : ''}" onclick="${e.act}"><span class="plaza-idx">${String(i + 1).padStart(2, '0')}</span><span class="plaza-icon">${e.icon}</span><span class="plaza-txt"><span class="plaza-name">${e.name}</span><span class="plaza-desc">${e.desc}</span></span>${e.wide ? '<span class="plaza-go" aria-hidden="true">→</span>' : ''}</button>`).join('');

  $('qaList').innerHTML = D.spirit.five.map((f, i) => `<section class="qa" id="qa${i}"><button class="qa-head" aria-expanded="false" aria-controls="qaBody${i}" onclick="toggleQa(${i})"><span class="qa-seal">${i + 1}</span><span class="qa-question">${esc(f.question)} · ${esc(f.name)}</span><span class="qa-arrow" aria-hidden="true">⌄</span></button><div class="qa-body" id="qaBody${i}"><div class="qa-full">${esc(f.full)}</div><div class="qa-essence">${esc(f.essence)}</div><div class="qa-anchor">事实锚点：${esc(f.anchor)}</div><blockquote class="bio-quote">“${esc(f.quote)}”<b>—— ${esc(f.who)}</b></blockquote></div></section>`).join('');
  window.toggleQa = i => { const el = $('qa' + i), open = el.classList.toggle('open'); el.querySelector('.qa-head').setAttribute('aria-expanded', String(open)); };

  const withFirstPhrase = text => { const m = String(text).match(/^(.{1,24}?[，。；、：！？])([\s\S]*)$/); return m ? `<span class="first-phrase">${esc(m[1])}</span>${esc(m[2])}` : esc(text); };
  $('leaderList').innerHTML = D.leaders.map(l => `<article class="card bio"><div class="bio-portrait">${l.photo ? `<img src="${esc(l.photo)}" alt="${esc(l.name)}肖像" loading="lazy" onerror="this.closest('.bio-portrait').innerHTML='<div class=bio-seal>${esc(l.keyword)}</div>'">` : `<div class="bio-seal">${esc(l.keyword)}</div>`}</div><div class="bio-right"><span class="bio-order">${esc(l.order)}</span><h2 class="bio-name">${esc(l.name)}<span class="bio-keyword">${esc(l.keyword)}</span></h2><div class="bio-period">任期 · ${esc(l.period)}</div><div class="bio-title">${esc(l.title)}</div><p class="bio-story">${withFirstPhrase(l.story)}</p>${l.quotes && l.quotes[0] ? `<blockquote class="bio-quote">“${esc(l.quotes[0])}”<b>—— ${esc(l.name)}</b></blockquote>` : ''}</div></article>`).join('');

  $('spotGrid').innerHTML = D.spots.map(s => `<article class="card spot-card">${s.photo ? `<img src="${esc(s.photo)}" alt="${esc(s.name)}" loading="lazy" onerror="this.remove()">` : ''}<div class="spot-bd"><h2 class="spot-name">${esc(s.name)}</h2><p class="spot-ol">${esc(s.oneLine)}</p><button class="text-link" onclick="openCheckin(${s.id})">云上打卡 →</button></div></article>`).join('');
  const route = ['石椅羌寨', '村史馆', '大岩路', '林海石源', '亚日萨茶园', '龙吟寺'];
  $('routeFlow').innerHTML = route.map((r, i) => `<span class="res-chip">${r}</span>${i < route.length - 1 ? '<span class="route-arrow" aria-hidden="true">→</span>' : ''}`).join('');

  function progressKey() { const me = window.ShiyiAuth && ShiyiAuth.current(); return 'shiyi_progress_' + (me ? me.uid : 'guest'); }
  function getProgress() { return Object.assign({ visits: {}, gameWin: false }, safeJSON(progressKey(), {})); }
  function markVisit(page) { const p = getProgress(); if (!p.visits[page]) { p.visits[page] = true; safeStore(progressKey(), p); renderProfile(); } }
  window.ShiyiMarkGameWin = () => { const p = getProgress(); p.gameWin = true; safeStore(progressKey(), p); renderProfile(); };
  function renderProfile() {
    const me = window.ShiyiAuth && ShiyiAuth.current();
    const score = me ? Number(me.score || 0) : Number(localStorage.getItem('shiyi_score') || 0);
    const stamps = me && me.stamps ? me.stamps.ids.length : safeJSON('shiyi_stamps_guest', safeJSON('shiyi_stamps_v1', { ids: [] })).ids.length;
    const quizDone = me ? !!me.quiz : !!(safeJSON('shiyi_quiz_guest', null) || localStorage.getItem('shiyi_quiz_v1'));
    const p = getProgress();
    $('scoreNum').textContent = Number.isFinite(score) ? score : 0;
    const badges = [
      { ic: '读', n: '读完村史', on: !!p.visits.history }, { ic: '问', n: '五问五答', on: !!p.visits.spirit },
      { ic: '凿', n: '凿通大岩路', on: !!p.gameWin }, { ic: '章', n: '云上见证', on: stamps >= D.spots.length },
      { ic: '测', n: '政绩测评', on: quizDone }, { ic: '游', n: '云游石椅', on: !!p.visits.tour },
    ];
    $('badgeGrid').innerHTML = badges.map(b => `<div class="badge ${b.on ? '' : 'dim'}"><div class="ic">${b.ic}</div><div class="bn">${b.n}</div><div class="badge-state">${b.on ? '已获得' : '待解锁'}</div></div>`).join('');
  }
  window.ShiyiProfileRefresh = renderProfile;

  window.showModal = html => { $('modalCard').innerHTML = html; openLayer($('modalMask')); $('modalCard').focus({ preventScroll: true }); };
  window.closeModal = () => closeLayer($('modalMask'));
  $('modalMask').addEventListener('click', e => { if (e.target === $('modalMask')) closeModal(); });
  $('authMask').addEventListener('click', e => { if (e.target === $('authMask')) ShiyiAuth.hide(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const top = document.querySelector('.ft-overlay.on') || document.querySelector('#modalMask.on') || document.querySelector('#authMask.on');
      if (!top) return;
      if (top.id === 'ftPoster') closePoster(); else if (top.id === 'ftCheckin') closeCheckin(); else if (top.id === 'ftQuiz') closeQuiz(); else if (top.id === 'authMask') ShiyiAuth.hide(); else closeModal();
    }
    if (e.key === 'Tab') {
      const layer = document.querySelector('.ft-overlay.on,.modal-mask.on');
      if (!layer) return;
      const items = [...layer.querySelectorAll('button:not([disabled]),input:not([disabled]),[tabindex="0"]')].filter(el => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  go(PAGES.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home', true);
})();
