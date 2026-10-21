/* ============================================================
   文件名：js/features-checkin.js
   功能描述：云上集章打卡——六大点位卡片（DATA.spots），点击
            盖章（红色圆形印章弹入动画 + 震动反馈），集章进度
            localStorage 持久化，显示已集/未集与集齐贺词。
   作者：云上党旗飘项目组
   创建日期：2026-10-21
   版权声明：本代码为项目原创代码，用于软件著作权登记。
   ============================================================ */
(function () {
  const D = window.DATA;
  const LS_KEY = 'shiyi_stamps_v1';

  /* ---------- 本地存档 ---------- */
  function loadStamps() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || { ids: [], dates: {} }; }
    catch (e) { return { ids: [], dates: {} }; }
  }
  function saveStamps(s) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

  let inited = false;

  /* ---------- 打开 / 关闭 ---------- */
  window.openCheckin = function () {
    if (!inited) { buildDom(); inited = true; }
    renderAll();
    document.getElementById('ftCheckin').classList.add('on');
    document.body.style.overflow = 'hidden';
  };
  window.closeCheckin = function () {
    document.getElementById('ftCheckin').classList.remove('on');
    document.body.style.overflow = '';
  };

  /* ---------- 注入弹层 DOM（仅一次） ---------- */
  function buildDom() {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="ft-overlay" id="ftCheckin">
        <div class="ft-head">
          <div>
            <div class="ft-head-title">云上集章打卡</div>
            <div class="ft-head-sub">走过六大点位，盖下你的云上见证</div>
          </div>
          <button class="ft-close" onclick="closeCheckin()" aria-label="关闭">✕</button>
        </div>
        <div class="ft-body">
          <div class="checkin-progress" id="checkinProgress"></div>
          <div class="stamp-grid" id="stampGrid"></div>
          <p class="note" style="margin-top:20px;text-align:center;">点击卡片即可盖章打卡，集齐六枚解锁「云上见证」徽章。</p>
        </div>
      </div>`);
  }

  /* ---------- 渲染 ---------- */
  function renderAll() {
    const s = loadStamps();
    const n = s.ids.length, total = D.spots.length;

    // 进度头
    document.getElementById('checkinProgress').innerHTML = `
      <div>
        <div class="big">${n}<span style="font-size:20px;"> / ${total}</span></div>
        <div class="lab">已集印章</div>
      </div>
      <div class="checkin-bar"><i style="width:${(n / total) * 100}%"></i></div>
      ${n >= total ? '<div class="checkin-done-tip">六章集齐！你已完成云上见证，石椅的山山水水都记住了你的足迹。</div>' : ''}`;

    // 点位卡
    document.getElementById('stampGrid').innerHTML = D.spots.map(sp => {
      const stamped = s.ids.includes(sp.id);
      const date = s.dates[sp.id] || '';
      return `
      <div class="stamp-card ${stamped ? 'stamped' : ''}" id="stampCard${sp.id}" onclick="stampSpot(${sp.id})">
        <div class="stamp-seal">
          <div class="ss-t">${sp.name.slice(0, 2)}</div>
          <div class="ss-d">云上见证${date ? ' · ' + date : ''}</div>
        </div>
        ${sp.photo
          ? `<img class="stamp-photo" src="${sp.photo}" alt="${sp.name}" onerror="this.outerHTML='<div class=stamp-photo-none>${sp.icon}</div>'">`
          : `<div class="stamp-photo-none">${sp.icon}</div>`}
        <div class="stamp-bd">
          <div class="stamp-name">${sp.name}</div>
          <div class="stamp-ol">${sp.oneLine}</div>
          <div class="stamp-state">${stamped ? '已盖章 · ' + (date || '今日') : '点击盖章打卡'}</div>
        </div>
      </div>`;
    }).join('');
  }

  /* ---------- 盖章 ---------- */
  window.stampSpot = function (id) {
    const s = loadStamps();
    if (s.ids.includes(id)) return;   // 已集过，不重复盖

    const now = new Date();
    s.ids.push(id);
    s.dates[id] = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    saveStamps(s);

    // 震动反馈（支持的设备上）
    if (navigator.vibrate) navigator.vibrate(40);

    renderAll();

    // 卡片轻颤，增强盖章手感
    const card = document.getElementById('stampCard' + id);
    if (card) { card.classList.add('shake'); setTimeout(() => card.classList.remove('shake'), 350); }
  };
})();
