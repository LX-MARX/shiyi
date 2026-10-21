/**
 * 文件名：js/app.js
 * 功能描述：石椅答卷网站逻辑——五个 tab 页路由切换、数据驱动渲染、
 *           凿路游戏 Canvas 版（点击推进、体力、章节、配图弹层）。
 * 作者：云上党旗飘项目组
 * 创建日期：2026-10-21
 * 版权声明：本代码为项目原创代码，用于软件著作权登记。
 */
(function () {
  const D = window.DATA;
  const $ = id => document.getElementById(id);

  /* ================= 路由切换 ================= */
  window.go = function (page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
    $('page-' + page).classList.add('on');
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('on', t.dataset.page === page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (page === 'game' && window.ShiyiGame) ShiyiGame.init();
  };
  $('navTabs').addEventListener('click', e => {
    const t = e.target.closest('.nav-tab');
    if (t) go(t.dataset.page);
  });

  /* ================= 首页渲染 ================= */
  const SHORT = ['为谁树', '靠谁树', '干多久', '树什么', '政绩界'];
  const five = D.spirit.five.map((f, i) => ({ ...f, short: SHORT[i] || f.question }));
  /* 五问单卡自动轮播：一次突出一问，4 秒切换，就这 5 个 */
  let qIdx = 0;
  function renderQ() {
    const f = five[qIdx];
    $('qCarousel').innerHTML = `
      <div class="card" onclick="go('spirit')" style="cursor:pointer;text-align:center;padding:44px 30px;border-top:4px solid var(--gold);position:relative;overflow:hidden;">
        <div style="position:absolute;top:14px;left:50%;transform:translateX(-50%);width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,var(--red),var(--red-deep));color:#FFF;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;box-shadow:0 6px 16px rgba(192,57,43,.3);">${qIdx + 1}</div>
        <div style="margin-top:52px;font-size:13px;color:var(--gold-deep);letter-spacing:6px;">${f.name}</div>
        <div style="font-size:38px;font-weight:700;color:var(--red-deep);letter-spacing:8px;margin-top:12px;">${f.short}</div>
        <div style="font-size:14px;color:var(--ink-soft);margin-top:16px;line-height:1.8;max-width:520px;margin-left:auto;margin-right:auto;">${f.essence}</div>
        <div style="margin-top:22px;font-size:12px;color:var(--gold-deep);">点击查看完整回答 →</div>
        <div style="display:flex;justify-content:center;gap:8px;margin-top:18px;">${five.map((_, i) => `<span style="width:${i === qIdx ? 22 : 8}px;height:8px;border-radius:4px;background:${i === qIdx ? 'var(--red)' : 'rgba(42,36,25,.18)'};transition:all .3s;display:inline-block;"></span>`).join('')}</div>
      </div>`;
  }
  renderQ();
  setInterval(() => { qIdx = (qIdx + 1) % 5; renderQ(); }, 4000);

  const stats = [
    { label: '人均可支配收入', before: '8000 元', after: '10 万元', note: '2008 → 2022，增长超 11 倍' },
    { label: '年接待游客', before: '4 万人次', after: '50 万人次', note: '文旅融合，羌寨客如潮' },
    { label: '村集体年收入', before: '一穷二白', after: '154 万元', note: '「好样子」公司覆盖全镇' },
    { label: '国家级荣誉', before: '寂寂无名', after: '11 项', note: '全国文明村等国字号桂冠' },
  ];
  $('statsGrid').innerHTML = stats.map(s => `
    <div class="card stat-card">
      <div class="stat-label">${s.label}</div>
      <div class="stat-before">昔日 ${s.before}</div>
      <div class="stat-after">${s.after}</div>
      <div class="stat-note">${s.note}</div>
    </div>`).join('');

  const entries = [
    { icon: '凿', name: '重走大岩路', desc: '亲手凿通绝壁', go: 'game' },
    { icon: '问', name: '政绩观五问', desc: '五问五答', go: 'spirit' },
    { icon: '谱', name: '接力村史', desc: '七任书记', go: 'history' },
    { icon: '游', name: '看石椅', desc: '六大点位', go: 'tour' },
  ];
  $('entryGrid').innerHTML = entries.map((e, i) => `
    <div class="card entry-card" onclick="go('${e.go}')">
      <div class="entry-idx">0${i + 1}</div>
      <div class="entry-icon">${e.icon}</div>
      <div class="entry-name">${e.name}</div>
      <div class="entry-desc">${e.desc}</div>
    </div>`).join('');

  /* ================= 政绩观渲染 ================= */
  $('qaList').innerHTML = D.spirit.five.map((f, i) => `
    <div class="qa" id="qa${i}">
      <div class="qa-head" onclick="toggleQa(${i})">
        <div class="qa-seal">${i + 1}</div>
        <div class="qa-question">${f.question} · ${f.name}</div>
        <div class="qa-arrow">−</div>
      </div>
      <div class="qa-body">
        <div class="qa-full">${f.full}</div>
        <div class="qa-essence">${f.essence}</div>
        <div class="qa-anchor">事实锚点：${f.anchor}</div>
        <div class="bio-quote" style="margin-top:14px;">“${f.quote}”<b>—— ${f.who}</b></div>
      </div>
    </div>`).join('');
  window.toggleQa = i => $('qa' + i).classList.toggle('open');

  /* ================= 村史渲染 ================= */
  $('leaderList').innerHTML = D.leaders.map(l => `
    <div class="card bio">
      <div class="bio-portrait">
        ${l.photo ? `<img src="${l.photo}" alt="${l.name}">` : `<div class="bio-seal">${l.keyword}</div>`}
      </div>
      <div class="bio-right">
        <span class="bio-order">${l.order}</span>
        <div class="bio-name">${l.name}<span class="bio-keyword">${l.keyword}</span></div>
        <div class="bio-period">任期 · ${l.period}</div>
        <div class="bio-title">${l.title}</div>
        <div class="bio-story">${l.story}</div>
        ${l.quotes && l.quotes[0] ? `<div class="bio-quote">“${l.quotes[0]}”<b>—— ${l.name}</b></div>` : ''}
      </div>
    </div>`).join('');

  /* ================= 看石椅渲染 ================= */
  $('spotGrid').innerHTML = D.spots.map(s => `
    <div class="card spot-card">
      ${s.photo ? `<img src="${s.photo}" alt="${s.name}">` : ''}
      <div class="spot-bd">
        <div class="spot-name">${s.name}</div>
        <div class="spot-ol">${s.oneLine}</div>
      </div>
    </div>`).join('');
  const route = ['石椅羌寨', '村史馆', '大岩路', '林海石源', '亚日萨茶园', '龙吟寺'];
  $('routeFlow').innerHTML = route.map((r, i) =>
    `<span class="res-chip">${r}</span>${i < route.length - 1 ? '<span style="color:var(--red);">→</span>' : ''}`).join('');

  /* ================= 我的接力棒渲染 ================= */
  // 优先取登录账号的政绩值，未登录用本机值
  const me = window.ShiyiAuth && ShiyiAuth.current();
  let score = me ? (me.score || 0) : +(localStorage.getItem('shiyi_score') || 0);
  $('scoreNum').textContent = score;
  const badges = [
    { ic: '读', n: '读完村史', on: true }, { ic: '问', n: '五问五答', on: true },
    { ic: '凿', n: '凿通大岩路', on: score > 0 }, { ic: '章', n: '云上见证', on: false },
    { ic: '测', n: '政绩测评', on: false }, { ic: '游', n: '云游石椅', on: false },
  ];
  $('badgeGrid').innerHTML = badges.map(b => `
    <div class="badge ${b.on ? '' : 'dim'}"><div class="ic">${b.ic}</div><div class="bn">${b.n}</div></div>`).join('');

  /* ================= 弹层 ================= */
  window.showModal = html => { $('modalCard').innerHTML = html; $('modalMask').classList.add('on'); };
  window.closeModal = () => $('modalMask').classList.remove('on');
  $('modalMask').addEventListener('click', e => { if (e.target === $('modalMask')) closeModal(); });

})();
