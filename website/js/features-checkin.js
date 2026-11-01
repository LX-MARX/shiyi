/* 云上集章打卡：账号隔离、本地/云端合并与无障碍卡片 */
(function () {
  'use strict';
  const D = window.DATA;
  const UI = window.ShiyiUI;
  const esc = UI ? UI.esc : String;
  const validIds = new Set(D.spots.map(s => s.id));
  let inited = false, viewOwner = null;
  function key() { const me = window.ShiyiAuth && ShiyiAuth.current(); return 'shiyi_stamps_' + (me ? me.uid : 'guest'); }
  function normalize(raw) {
    const ids = Array.isArray(raw && raw.ids) ? [...new Set(raw.ids.map(Number).filter(id => validIds.has(id)))] : [];
    const dates = {};
    ids.forEach(id => { const value = raw && raw.dates && raw.dates[id]; if (/^\d{2}-\d{2}$/.test(value || '')) dates[id] = value; });
    return { ids, dates };
  }
  function load() { return normalize(UI ? UI.safeJSON(key(), {}) : JSON.parse(localStorage.getItem(key()) || '{}')); }
  function save(value) { if (UI) UI.safeStore(key(), value); else localStorage.setItem(key(), JSON.stringify(value)); }
  function openLayer(el) { if (UI) UI.openLayer(el); else el.classList.add('on'); }
  function closeLayer(el) { if (UI) UI.closeLayer(el); else el.classList.remove('on'); }

  window.openCheckin = function (selectedId) {
    if (!inited) { buildDom(); inited = true; }
    renderOwner(); openLayer(document.getElementById('ftCheckin'));
    if (validIds.has(Number(selectedId))) setTimeout(() => { const card = document.getElementById('stampCard' + selectedId); if (card) { card.scrollIntoView({ block: 'center' }); card.focus({ preventScroll: true }); } }, 60);
  };
  function renderOwner() {
    viewOwner = key();
    const me = window.ShiyiAuth && ShiyiAuth.current && ShiyiAuth.current();
    let local = load();
    if (me && me.stamps) {
      const cloud = normalize(me.stamps);
      local = normalize({ ids: [...local.ids, ...cloud.ids], dates: { ...cloud.dates, ...local.dates } });
      save(local);
      if (JSON.stringify(local) !== JSON.stringify(cloud)) ShiyiAuth.saveFields({ stamps: local });
    }
    renderAll();
  }
  window.closeCheckin = function () { closeLayer(document.getElementById('ftCheckin')); };
  function buildDom() {
    document.body.insertAdjacentHTML('beforeend', `
      <section class="ft-overlay" id="ftCheckin" role="dialog" aria-modal="true" aria-labelledby="checkinTitle">
        <div class="ft-head"><div><div class="ft-head-title" id="checkinTitle">云上集章打卡</div><div class="ft-head-sub">走过六大点位，盖下你的云上见证</div></div>
          <button class="ft-close" onclick="closeCheckin()" aria-label="关闭集章">✕</button></div>
        <div class="ft-body"><div class="checkin-progress" id="checkinProgress" aria-live="polite"></div><div class="stamp-grid" id="stampGrid"></div>
          <p class="note" style="margin-top:20px;text-align:center;">选择点位卡片即可盖章；已盖章点位不会重复记录。</p></div>
      </section>`);
  }
  function renderAll() {
    const s = load(), n = s.ids.length, total = D.spots.length;
    document.getElementById('checkinProgress').innerHTML = `
      <div><div class="big">${n}<span style="font-size:20px;"> / ${total}</span></div><div class="lab">已集印章</div></div>
      <div class="checkin-bar" role="progressbar" aria-label="集章进度" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${n}"><i style="width:${n / total * 100}%"></i></div>
      ${n >= total ? '<div class="checkin-done-tip">六章集齐！石椅的山山水水都记住了你的足迹。</div>' : ''}`;
    document.getElementById('stampGrid').innerHTML = D.spots.map(sp => {
      const stamped = s.ids.includes(sp.id), date = s.dates[sp.id] || '';
      return `<button class="stamp-card ${stamped ? 'stamped' : ''}" id="stampCard${sp.id}" onclick="stampSpot(${sp.id})" aria-pressed="${stamped}" aria-label="${esc(sp.name)}，${stamped ? '已盖章' : '未盖章，选择后打卡'}">
        <span class="stamp-seal" aria-hidden="true"><span class="ss-t">${esc(sp.name.slice(0, 2))}</span><span class="ss-d">云上见证${date ? ' · ' + date : ''}</span></span>
        ${sp.photo ? `<img class="stamp-photo" src="${esc(sp.photo)}" alt="" loading="lazy" onerror="this.remove()">` : `<span class="stamp-photo-none">${esc(sp.icon)}</span>`}
        <span class="stamp-bd"><span class="stamp-name">${esc(sp.name)}</span><span class="stamp-ol">${esc(sp.oneLine)}</span><span class="stamp-state">${stamped ? '已盖章 · ' + (date || '今日') : '选择盖章打卡'}</span></span>
      </button>`;
    }).join('');
  }
  window.stampSpot = function (id) {
    id = Number(id); if (!validIds.has(id)) return;
    const s = load(); if (s.ids.includes(id)) { if (UI) UI.toast('这个点位已经盖过章了'); return; }
    const now = new Date(); s.ids.push(id);
    s.dates[id] = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    save(s);
    if (window.ShiyiAuth && ShiyiAuth.current()) ShiyiAuth.saveFields({ stamps: s });
    if (navigator.vibrate) navigator.vibrate(40);
    renderAll();
    const card = document.getElementById('stampCard' + id);
    if (card) { card.classList.add('shake'); setTimeout(() => card.classList.remove('shake'), 350); }
    if (UI) UI.toast(s.ids.length === D.spots.length ? '六章集齐，云上见证徽章已解锁！' : '盖章成功，进度已保存');
    if (window.ShiyiProfileRefresh) ShiyiProfileRefresh();
  };
  if (window.ShiyiAuth && typeof ShiyiAuth.onChange === 'function') {
    ShiyiAuth.onChange(() => {
      const layer = document.getElementById('ftCheckin');
      if (!inited || !layer.classList.contains('on') || viewOwner === key()) return;
      renderOwner();
      const close = layer.querySelector('.ft-close'); if (close) close.focus({ preventScroll: true });
    });
  }
})();
