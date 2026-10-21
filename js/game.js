/**
 * 文件名：js/game.js
 * 功能描述：凿路游戏《凿通大岩路》网页版——五层视差场景、岩壁块状质感、
 *           各组义务工小人劳作动画、镐击手感（单击/长按蓄力/连击）、资源系统、
 *           队伍编组窝工、队友技能（人物特效+消耗）、电雷管爆破、五章叙事。
 * 作者：云上党旗飘项目组
 * 创建日期：2026-10-21
 * 版权声明：本代码为项目原创代码，用于软件著作权登记。
 */
window.ShiyiGame = (function () {
  /* ========== 配置 ========== */
  const CHAPTERS = [
    { name: '第一章 · 关门', short: '勘测', end: 300, hard: 1.2, rock: '#8A8078', rockDeep: '#5A5248', skyTop: '#B8C4CC', skyBot: '#DDE4E6', img: 'images/game/ch1_survey.jpg', card: '腰系麻绳悬在绝壁上，用 50 米皮尺一寸寸量完全线。' },
    { name: '第二章 · 药引子', short: '筹资', end: 800, hard: 1.0, rock: '#9A8468', rockDeep: '#6B5A44', skyTop: '#E8C87E', skyBot: '#F7E6C4', img: 'images/game/ch2_fund.jpg', card: '邵再贵把 1000 元拍在桌上——约等于两头肥猪的药引子。' },
    { name: '第三章 · 悬崖上的箩筐', short: '破土爆破', end: 1800, hard: 0.6, rock: '#6E6660', rockDeep: '#453E38', skyTop: '#3A3F47', skyBot: '#6B7280', img: 'images/game/ch3_blast.jpg', card: '陈华全坐箩筐吊上绝壁打孔装药，新麻绳打死结、不用活扣。' },
    { name: '第四章 · 唾沫与年夜饭', short: '阻挠坚守', end: 2600, hard: 0.5, rock: '#5E564E', rockDeep: '#3E3833', skyTop: '#5A6270', skyBot: '#8A8E96', img: 'images/game/ch4_hold.jpg', card: '唾沫吐到脸上，他拿袖子一抹，没抹去笑容。' },
    { name: '第五章 · 长虹', short: '贯通', end: 3000, hard: 1.5, rock: '#A89880', rockDeep: '#C9A254', skyTop: '#F2DDA0', skyBot: '#E8A87C', img: 'images/game/ch5_done.jpg', card: '2004 年 6 月 3 日，长虹路贯通，车开进了寨门。' },
  ];
  const TOOLS = [
    { id: 0, name: '钢钎', icon: '钎', mult: 1, unlock: 0 },
    { id: 1, name: '八磅锤', icon: '锤', mult: 2, unlock: 1 },
    { id: 2, name: '钻孔机', icon: '钻', mult: 4, unlock: 2, diesel: true },
  ];
  const MATES = [
    { id: 'shao', name: '邵再贵', skill: '督工巡视', desc: '30秒进度+50%', unlock: 0, cost: { fund: 10 }, costText: '资金10' },
    { id: 'he', name: '何国发', skill: '老书记的灯', desc: '体力全恢复', unlock: 1, cost: {}, costText: '恩情无耗' },
    { id: 'chen', name: '陈华全', skill: '精准爆破', desc: '免费起爆+20%', unlock: 2, cost: { diesel: 5 }, costText: '柴油5' },
    { id: 'wang', name: '王庆保', skill: '动员会', desc: '20镐免体力', unlock: 2, cost: { fund: 5 }, costText: '资金5' },
  ];
  const SAFE_QUIZ = [
    { q: '起爆前清点现场，最重要的是确认什么？', options: ['人员全部撤到安全距离', '炸药品牌是否响亮', '天气是否晴朗'], answer: 0 },
    { q: '箩筐吊人上绝壁，邵再贵亲自检查的是什么？', options: ['麻绳是否打死结', '箩筐是否刷红漆', '是否带了干粮'], answer: 0 },
    { q: '发现哑炮（没响的炮），正确处理是？', options: ['设警戒由专业人员处理', '马上凑近查看', '再点一把火'], answer: 0 },
  ];

  let G = null;

  /* ========== 初始化 ========== */
  function init() {
    const cv = document.getElementById('gameCanvas');
    if (!cv) return;
    if (G) { return; }
    cv.width = cv.clientWidth || 800;
    cv.height = 420;
    G = {
      cv, ctx: cv.getContext('2d'),
      mileage: 0, ch: 0, frame: 0,
      vit: 100, vitMax: 100, fund: 0, stone: 0, diesel: 0, blast: 0, heart: 70,
      tool: 0, crews: [{ key: 'dig', n: '凿岩', num: 3, cap: 3 }, { key: 'wall', n: '砌坎', num: 2, cap: 99 }, { key: 'move', n: '运输', num: 2, cap: 99 }, { key: 'log', n: '后勤', num: 1, cap: 99 }],
      particles: [], swings: [], cracks: [], skillFx: null,
      freeHits: 0, buffMult: 1, combo: 0, comboLast: 0, pressT: 0,
      won: false,
    };
    bindInput();
    renderPanels();
    setInterval(tick, 1000);
    requestAnimationFrame(loop);
    updateHUD();
  }

  /* ========== 输入：单击/长按蓄力/连击 ========== */
  function bindInput() {
    const cv = G.cv;
    cv.addEventListener('mousedown', e => { G.pressT = Date.now(); });
    cv.addEventListener('mouseup', e => {
      const held = Date.now() - G.pressT;
      hit(e, held > 400 ? 3 : 1);   // 长按=重镐3倍
    });
    cv.addEventListener('touchstart', e => { G.pressT = Date.now(); }, { passive: true });
    cv.addEventListener('touchend', e => {
      const held = Date.now() - G.pressT;
      const t = e.changedTouches[0];
      hit({ clientX: t.clientX, clientY: t.clientY }, held > 400 ? 3 : 1);
    });
  }

  /* ========== 凿岩 ========== */
  function hit(e, mult) {
    if (G.won) return;
    const dig = G.crews[0];
    // 体力：主角 + 义务工一起出力（每多2人多耗1）
    const cost = mult === 3 ? 3 : 1;
    const crewCost = Math.floor((dig.num - 1) / 2);
    const total = G.freeHits > 0 ? 0 : cost + crewCost;
    if (G.freeHits <= 0 && G.vit < total) { msg('体力耗尽，吃点背篓饭吧'); return; }
    const tool = TOOLS[G.tool];
    if (tool.diesel && G.diesel <= 0) { msg('柴油用尽，先买柴油'); G.tool = 1; renderPanels(); return; }
    if (tool.diesel) G.diesel--;

    // 连击：800ms 内连续，8 连触发号子
    const now = Date.now();
    if (now - G.comboLast < 800) G.combo++; else G.combo = 1;
    G.comboLast = now;
    if (G.combo >= 8) { G.combo = 0; G.buffMult = 1.2; msg('号子齐鸣！全队效率+20%'); setTimeout(() => G.buffMult = 1, 10000); }

    // 窝工：超作业面效率减半
    const crowdPenalty = dig.num > dig.cap ? 0.5 : 1;
    const crewBonus = 1 + (dig.num - 1) * 0.15 + (G.crews[1].num - 2) * 0.05;
    const gain = CHAPTERS[G.ch].hard * tool.mult * mult * G.buffMult * crowdPenalty * Math.max(0.5, crewBonus);
    G.mileage = Math.min(3000, G.mileage + gain);
    if (G.freeHits > 0) G.freeHits--; else G.vit = Math.max(0, G.vit - total);
    if (Math.random() < 0.5) G.stone += Math.random() < 0.3 ? 2 : 1;

    // 粒子与镐击
    const rect = G.cv.getBoundingClientRect();
    const x = (e.clientX ? e.clientX - rect.left : G.cv.width / 2), y = (e.clientY ? e.clientY - rect.top : 210);
    G.swings.push({ x, y: y - 10, rot: -0.9, life: 6 });
    for (let i = 0; i < (mult === 3 ? 18 : 10); i++) G.particles.push({ x, y, vx: (Math.random() - .5) * 6 * mult, vy: -Math.random() * 4 - 1, life: 24, size: 2 + Math.random() * 3 });
    G.cracks.push({ x, y, dx: 8, dy: 6, life: 30 });
    updateHUD(); checkChapter();
  }

  /* ========== 章节 ========== */
  function checkChapter() {
    const c = CHAPTERS[G.ch];
    if (G.mileage < c.end) return;
    if (G.ch >= 4) { winGame(); return; }
    showModal(`
      <img class="modal-img" src="${c.img}">
      <div class="modal-title">${c.name} · 凿通</div>
      <div class="modal-text">${c.card}</div>
      <button class="btn" onclick="ShiyiGame.next()">进入下一章</button>`);
  }
  function next() {
    G.ch++; closeModal();
    G.blast = G.ch >= 2 ? 3 : 0;
    renderPanels(); updateHUD();
  }
  function winGame() {
    G.won = true;
    const s = +(localStorage.getItem('shiyi_score') || 0) + 75;
    localStorage.setItem('shiyi_score', s);
    showModal(`
      <div class="modal-title" style="text-align:center;">大岩路，凿通了！</div>
      <div class="modal-text" style="text-align:center;">2004 年 6 月 3 日，长虹路贯通。<br>这条路不是你凿的，是一百零六户人凿的。<br><br><b style="color:var(--red);">+75 政绩值</b></div>
      <button class="btn" style="width:100%;" onclick="ShiyiGame.restart()">再走一次</button>`);
  }
  function restart() { closeModal(); const cv = G.cv, ctx = G.ctx; G = null; init(); }

  /* ========== 资源操作 ========== */
  function meal() { if (G.won) return; G.vit = Math.min(G.vitMax, G.vit + 10); msg('吃饱了，+10 体力'); updateHUD(); }
  function sell() { if (G.stone < 50) { msg('碎石还不够 50 块'); return; } G.stone -= 50; G.fund += 15; msg('碎石卖给水泥厂，+15 元'); updateHUD(); }
  function buyDiesel() { if (G.fund < 5) { msg('柴油 5 元，资金不足'); return; } G.fund -= 5; G.diesel += 10; msg('+10 柴油'); renderPanels(); updateHUD(); }
  function sharpen() { if (G.fund < 5) { msg('磨砺要 5 元'); return; } G.fund -= 5; msg('工具磨砺如新'); updateHUD(); }

  /* ========== 编组（窝工） ========== */
  function crew(key, d) {
    const c = G.crews.find(x => x.key === key);
    const total = G.crews.reduce((s, x) => s + x.num, 0);
    if (d > 0 && total >= 12) { msg('全村义务工就 12 人'); return; }
    c.num = Math.max(0, Math.min(c.cap, c.num + d));
    if (key === 'dig' && c.num > c.cap) msg('超过作业面，窝工了！效率减半');
    renderPanels(); updateHUD();
  }

  /* ========== 队友技能（有消耗+特效） ========== */
  function useMate(id) {
    const m = MATES.find(x => x.id === id);
    if (G.ch < m.unlock) { msg(`${m.name}后续章节加入`); return; }
    if (m.cost.fund && G.fund < m.cost.fund) { msg(`需资金 ${m.cost.fund} 元`); return; }
    if (m.cost.diesel && G.diesel < m.cost.diesel) { msg(`需柴油 ${m.cost.diesel}`); return; }
    // 扣消耗
    if (m.cost.fund) G.fund -= m.cost.fund;
    if (m.cost.diesel) G.diesel -= m.cost.diesel;
    // 特效：人物出现+光环
    G.skillFx = { life: 40, name: m.name };
    // 效果
    if (id === 'shao') { G.buffMult = 1.5; msg('邵再贵督工：30秒+50%'); setTimeout(() => G.buffMult = 1, 30000); }
    else if (id === 'he') { G.vit = G.vitMax; msg('老书记的灯：体力回满'); }
    else if (id === 'chen') { doBlast(true); }
    else if (id === 'wang') { G.freeHits = 20; G.heart = Math.min(100, G.heart + 5); msg('动员会：20镐免体力'); }
    renderPanels(); updateHUD();
  }

  /* ========== 爆破（安全题） ========== */
  function blast() {
    if (G.blast <= 0) { msg('本章炸药已用完'); return; }
    if (G.fund < 20) { msg('炸药 20 元，资金不足'); return; }
    const q = SAFE_QUIZ[Math.floor(Math.random() * SAFE_QUIZ.length)];
    window._quizAns = q.answer;
    showModal(`
      <div class="modal-title">装药许可 · 安全题</div>
      <div class="modal-text">${q.q}</div>
      ${q.options.map((o, i) => `<button class="modal-opt" onclick="ShiyiGame.quiz(${i})">${o}</button>`).join('')}`);
  }
  function quiz(i) {
    if (i === window._quizAns) { closeModal(); doBlast(false); }
    else { showModal(`<div class="modal-title">装药封存</div><div class="modal-text">安全题答错。爆破是专业活，先把规程记牢。</div><button class="btn" onclick="ShiyiGame.close()">继续</button>`); }
  }
  function doBlast(free) {
    if (!free) { if (G.blast <= 0) return; G.blast--; G.fund -= 20; }
    const gain = (15 + Math.random() * 3) * (G.ch >= 2 ? 1.2 : 1);
    G.mileage = Math.min(3000, G.mileage + gain);
    for (let i = 0; i < 40; i++) G.particles.push({ x: G.cv.width * .3 + Math.random() * G.cv.width * .4, y: G.cv.height * .55 + Math.random() * G.cv.height * .2, vx: (Math.random() - .5) * 10, vy: -Math.random() * 7 - 2, life: 40, size: 3 + Math.random() * 4, red: Math.random() < 0.3 });
    msg(`轰！推进 ${gain.toFixed(0)} 米`);
    updateHUD(); checkChapter();
  }

  /* ========== 弹层 ========== */
  function showModal(html) { document.getElementById('modalCard').innerHTML = html; document.getElementById('modalMask').classList.add('on'); }
  function closeModal() { document.getElementById('modalMask').classList.remove('on'); }
  function msg(t) { const el = document.getElementById('gameMsg'); if (el) el.textContent = t; }

  /* ========== HUD 与面板 ========== */
  function updateHUD() {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const bar = document.getElementById('mileBar');
    if (bar) bar.style.width = (G.mileage / 30) + '%';
    set('mileText', Math.round(G.mileage) + 'm / 3000m');
    set('vitNum', Math.round(G.vit));
    set('fundNum', G.fund);
    set('stoneNum', G.stone);
    set('heartNum', G.heart);
    set('chNum', G.ch + 1);
    set('dieselNum', G.diesel);
    set('blastNum', G.blast);
  }
  function renderPanels() {
    // 工具
    const tr = document.getElementById('toolRow');
    if (tr) tr.innerHTML = TOOLS.map(t => `
      <div class="tool ${G.tool === t.id ? 'on' : ''} ${G.ch < t.unlock ? 'locked' : ''}" onclick="ShiyiGame.tool(${t.id})">
        <div class="tool-ic">${t.icon}</div><div class="note">${t.name} ×${t.mult}</div>
      </div>`).join('') +
      `<div class="tool" onclick="ShiyiGame.buyDiesel()"><div class="tool-ic">油</div><div class="note">买柴油 5元</div></div>`;
    // 编组
    const cr = document.getElementById('crewRow');
    if (cr) cr.innerHTML = G.crews.map(c => `
      <div class="crew">
        <div class="note">${c.n}组${c.key === 'dig' ? '(作业面≤' + c.cap + ')' : ''}</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:6px;">
          <button class="crew-btn" onclick="ShiyiGame.crew('${c.key}',-1)">−</button>
          <span class="crew-num" style="color:${c.key === 'dig' && c.num > c.cap ? 'var(--red)' : 'inherit'}">${c.num}</span>
          <button class="crew-btn" onclick="ShiyiGame.crew('${c.key}',1)">＋</button>
        </div>
      </div>`).join('');
    // 队友
    const mr = document.getElementById('mateRow');
    if (mr) mr.innerHTML = MATES.map(m => `
      <div class="mate ${G.ch < m.unlock ? 'locked' : ''}" onclick="ShiyiGame.useMate('${m.id}')">
        <div class="mate-face">${m.name[0]}</div>
        <div class="note" style="font-weight:600;">${m.name}</div>
        <div class="note" style="color:var(--red-deep);font-size:12px;">${m.skill}</div>
        <div class="note" style="color:var(--gold-deep);font-size:11px;">${m.costText}</div>
      </div>`).join('');
  }

  /* ========== 资源节拍 ========== */
  function tick() { if (G && G.vit < G.vitMax && !G.won) { G.vit++; updateHUD(); } }

  /* ========== 渲染循环 ========== */
  function loop() {
    if (G && document.getElementById('page-game').classList.contains('on')) draw();
    requestAnimationFrame(loop);
  }

  /* 颜色工具 */
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 0xff) + amt, b = (n & 0xff) + amt;
    const c = v => Math.max(0, Math.min(255, v));
    return `rgb(${c(r)},${c(g)},${c(b)})`;
  }
  function prand(s) { const x = Math.sin(s * 127.1) * 43758.5453; return x - Math.floor(x); }

  /* ========== 主绘制 ========== */
  function draw() {
    const { ctx, cv } = G; const W = cv.width, H = cv.height;
    const c = CHAPTERS[G.ch]; G.frame++;
    // 天空
    const sky = ctx.createLinearGradient(0, 0, 0, H * .55);
    sky.addColorStop(0, c.skyTop); sky.addColorStop(1, c.skyBot);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // 远山双层
    ctx.globalAlpha = .5; ctx.fillStyle = shade(c.rock, 30); ridge(W, H * .34, H * .16); ctx.globalAlpha = .75; ctx.fillStyle = shade(c.rock, 12); ridge(W, H * .44, H * .2); ctx.globalAlpha = 1;
    // 云雾
    ctx.fillStyle = 'rgba(255,252,246,.5)';
    for (let i = 0; i < 3; i++) {
      const cx = ((G.frame * (0.3 + i * 0.12) + i * 200) % (W + 240)) - 120, cy = H * (0.3 + i * 0.09);
      ctx.beginPath(); ctx.arc(cx, cy, 46 + i * 14, 0, 7); ctx.arc(cx + 40, cy + 8, 38, 0, 7); ctx.arc(cx - 40, cy + 10, 34, 0, 7); ctx.fill();
    }
    // 岩壁
    const rockTop = H * .4;
    const rg = ctx.createLinearGradient(0, rockTop, 0, H);
    rg.addColorStop(0, c.rock); rg.addColorStop(1, c.rockDeep);
    ctx.fillStyle = rg; ctx.fillRect(0, rockTop, W, H - rockTop);
    rockTexture(W, H, rockTop, c);
    // 隧道口
    const segStart = G.ch === 0 ? 0 : CHAPTERS[G.ch - 1].end;
    const done = Math.max(0, Math.min(1, (G.mileage - segStart) / (c.end - segStart)));
    const tw = 36 + done * (W - 110);
    const tg = ctx.createLinearGradient(0, H * .56, tw, H * .8);
    tg.addColorStop(0, '#0F0C08'); tg.addColorStop(1, '#33291E');
    ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(0, H * .6); ctx.lineTo(tw, H * .56); ctx.lineTo(tw, H * .8); ctx.lineTo(0, H * .88); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(c.rock, 34); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tw, H * .56); ctx.lineTo(tw, H * .8); ctx.stroke();
    // 裂缝
    ctx.lineWidth = 2;
    G.cracks.forEach(cr => { ctx.strokeStyle = shade(c.rock, -40); ctx.globalAlpha = Math.min(1, cr.life / 30); ctx.beginPath(); ctx.moveTo(cr.x, cr.y); let px = cr.x, py = cr.y; for (let i = 0; i < 5; i++) { px += cr.dx + (i % 2 ? 6 : -4); py += cr.dy + (i % 2 ? -5 : 4); ctx.lineTo(px, py); } ctx.stroke(); });
    ctx.globalAlpha = 1;
    // 义务工小人
    drawCrews(W, H);
    // 红旗
    const wave = Math.sin(G.frame * .15) * 3;
    ctx.fillStyle = '#C0392B'; ctx.fillRect(tw - 2, H * .5, 3, H * .07);
    ctx.beginPath(); ctx.moveTo(tw + 1, H * .5); ctx.lineTo(tw + 22, H * .525 + wave); ctx.lineTo(tw + 1, H * .55); ctx.closePath(); ctx.fill();
    // 粒子
    G.particles = G.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += .35; p.life--; ctx.fillStyle = p.red ? '#C0392B' : c.rock; ctx.globalAlpha = Math.min(1, p.life / 24); ctx.fillRect(p.x, p.y, p.size, p.size); return p.life > 0; });
    ctx.globalAlpha = 1;
    // 镐击
    G.swings = G.swings.filter(s => { s.rot += .35; s.life--; ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.fillStyle = '#7A5230'; ctx.fillRect(-2, -40, 4, 44); ctx.fillStyle = '#4E453E'; ctx.beginPath(); ctx.moveTo(-15, -46); ctx.lineTo(15, -46); ctx.lineTo(8, -34); ctx.lineTo(-8, -34); ctx.closePath(); ctx.fill(); ctx.restore(); return s.life > 0; });
    // 技能特效
    if (G.skillFx && G.skillFx.life > 0) { drawSkillFx(W, H); G.skillFx.life--; }
  }

  function ridge(W, baseY, amp) {
    const ctx = G.ctx; ctx.beginPath(); ctx.moveTo(0, baseY);
    for (let x = 0; x <= W; x += W / 10) ctx.lineTo(x, baseY - Math.abs(Math.sin(x * .02 + G.frame * .02)) * amp);
    ctx.lineTo(W, baseY + amp); ctx.lineTo(0, baseY + amp); ctx.closePath(); ctx.fill();
  }

  /* 岩壁块状质感 */
  function rockTexture(W, H, rockTop, c) {
    const ctx = G.ctx;
    const rows = Math.ceil((H - rockTop) / 34);
    for (let r = 0; r < rows; r++) {
      const y = rockTop + r * 34, cols = Math.ceil(W / 46);
      for (let col = 0; col < cols; col++) {
        const seed = r * 100 + col, x = col * 46 + (r % 2 ? 23 : 0);
        const w = 40 + prand(seed) * 10, h = 28 + prand(seed + 1) * 8, light = prand(seed + 2) > .5;
        ctx.fillStyle = shade(c.rock, light ? 12 : -14); ctx.globalAlpha = .5;
        ctx.beginPath(); ctx.moveTo(x, y + 3); ctx.lineTo(x + w, y); ctx.lineTo(x + w - 2, y + h); ctx.lineTo(x + 2, y + h + 2); ctx.closePath(); ctx.fill();
        if (light) { ctx.strokeStyle = shade(c.rock, 30); ctx.globalAlpha = .4; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y + 3); ctx.lineTo(x + w, y); ctx.stroke(); }
      }
    }
    ctx.globalAlpha = 1;
  }

  /* 义务工小人 */
  function drawCrews(W, H) {
    const gy = H * .84;
    const dig = G.crews[0], wall = G.crews[1], move = G.crews[2], log = G.crews[3];
    for (let i = 0; i < dig.num; i++) worker(30 + i * 26, gy - i * 6, i, 'dig', i >= dig.cap);
    for (let i = 0; i < wall.num; i++) worker(W * .45 + i * 26, gy + 6, i + 2, 'wall', false);
    for (let i = 0; i < move.num; i++) worker(W * .62 + i * 26 + Math.sin(G.frame * .05 + i) * 8, gy + 10, i + 4, 'move', false);
    for (let i = 0; i < log.num; i++) worker(W * .84 + i * 24, gy + 14, i + 6, 'log', false);
  }
  function worker(x, y, phase, type, idle) {
    const ctx = G.ctx, swing = Math.sin(G.frame * .2 + phase * 2);
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = idle ? '#9A9488' : '#2A2419';
    ctx.fillRect(-5, -24, 10, 24);
    ctx.beginPath(); ctx.arc(0, -30, 6, 0, 7); ctx.fill();
    if (type === 'dig' || type === 'wall') { ctx.fillStyle = idle ? '#B8B0A0' : '#C0392B'; ctx.beginPath(); ctx.arc(0, -32, 7, Math.PI, 0); ctx.fill(); }
    ctx.save(); ctx.translate(0, -20);
    ctx.rotate(type === 'dig' ? swing * .7 - .4 : (type === 'move' ? swing * .3 : swing * .2 - .2));
    ctx.fillStyle = idle ? '#9A9488' : '#2A2419'; ctx.fillRect(0, -3, 18, 4);
    if (type === 'dig') { ctx.fillStyle = '#7A5230'; ctx.fillRect(16, -14, 3, 16); }
    if (type === 'move') { ctx.fillStyle = '#7A5230'; ctx.fillRect(14, -8, 12, 10); }
    ctx.restore(); ctx.restore();
  }

  /* 队友技能特效：人物放大+光环 */
  function drawSkillFx(W, H) {
    const ctx = G.ctx, t = G.skillFx.life, cx = W / 2, cy = H * .5;
    const scale = 1 + (40 - t) * .04, alpha = Math.min(1, t / 15);
    ctx.globalAlpha = alpha * .5; ctx.strokeStyle = '#E8C87E'; ctx.lineWidth = 3;
    const rr = 40 + (40 - t) * 6;
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); ctx.stroke();
    ctx.globalAlpha = alpha;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(scale, scale);
    ctx.fillStyle = '#C0392B'; ctx.fillRect(-10, -40, 20, 44);
    ctx.beginPath(); ctx.arc(0, -50, 12, 0, 7); ctx.fill();
    ctx.fillRect(8, -36, 22, 6);
    ctx.restore(); ctx.globalAlpha = 1;
    // 技能名
    ctx.fillStyle = '#F0D68A'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(G.skillFx.name, cx, cy + 60);
  }

  /* ========== 导出 ========== */
  return { init, hit, meal, sell, buyDiesel, sharpen, crew, useMate, blast, quiz, next, restart, close: closeModal, tool: i => { G.tool = i; renderPanels(); } };
})();
