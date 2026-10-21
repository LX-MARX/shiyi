/**
 * 文件名：js/game.js
 * 功能描述：凿路游戏《凿通大岩路》网页版——五层视差华丽场景（天空日月光晕/双层远山/
 *           流动云雾/块状错缝岩壁/前景地物）、隧道口纵深凿痕、火花碎石爆破粒子系统
 *           （池上限150）、四组义务工精细小人劳作动画、镐击手感（单击/长按蓄力高亮/
 *           八连击号子齐鸣金光）、队友技能人物升起光环特效、电雷管爆破、五章叙事弹窗。
 * 作者：云上党旗飘项目组
 * 创建日期：2026-10-21
 * 版权声明：本代码为项目原创代码，用于软件著作权登记。
 */
window.ShiyiGame = (function () {
  /* ================= 配置 ================= */
  const CHAPTERS = [
    { name: '第一章 · 关门', short: '勘测', end: 300, hard: 1.2,
      rock: '#8D8378', rockDeep: '#575046', rockHi: '#B4AA9C', rockLine: '#6E655A',
      skyTop: '#7E93A4', skyBot: '#D8DFE0', far1: '#93A0AA', far2: '#7C8894',
      sun: '#F2EDE0', sunX: .72, sunY: .14, fog: 'rgba(228,232,232,',
      img: 'images/game/ch1_survey.jpg', card: '腰系麻绳悬在绝壁上，用 50 米皮尺一寸寸量完全线。' },
    { name: '第二章 · 药引子', short: '筹资', end: 800, hard: 1.0,
      rock: '#9C8666', rockDeep: '#63523C', rockHi: '#C4AC84', rockLine: '#77664C',
      skyTop: '#E3B96A', skyBot: '#F8EAC8', far1: '#C7A76E', far2: '#A98F5E',
      sun: '#FFE9B0', sunX: .5, sunY: .2, fog: 'rgba(250,238,214,',
      img: 'images/game/ch2_fund.jpg', card: '邵再贵把 1000 元拍在桌上——约等于两头肥猪的药引子。' },
    { name: '第三章 · 悬崖上的箩筐', short: '破土爆破', end: 1800, hard: 0.6,
      rock: '#6E6760', rockDeep: '#3F3934', rockHi: '#948B80', rockLine: '#514A44',
      skyTop: '#2E333C', skyBot: '#5F6672', far1: '#4A505B', far2: '#3A3F49',
      sun: '#E8E4D2', sunX: .8, sunY: .12, fog: 'rgba(150,158,170,',
      img: 'images/game/ch3_blast.jpg', card: '陈华全坐箩筐吊上绝壁打孔装药，新麻绳打死结、不用活扣。' },
    { name: '第四章 · 唾沫与年夜饭', short: '阻挠坚守', end: 2600, hard: 0.5,
      rock: '#5F584F', rockDeep: '#3B352F', rockHi: '#877D70', rockLine: '#4A443D',
      skyTop: '#4E5766', skyBot: '#878C94', far1: '#6A7078', far2: '#565B64',
      sun: '#E6D9B8', sunX: .3, sunY: .16, fog: 'rgba(188,190,194,',
      img: 'images/game/ch4_hold.jpg', card: '唾沫吐到脸上，他拿袖子一抹，没抹去笑容。' },
    { name: '第五章 · 长虹', short: '贯通', end: 3000, hard: 1.5,
      rock: '#A9987C', rockDeep: '#7A6748', rockHi: '#D3BE94', rockLine: '#8C7A5C',
      skyTop: '#F0D68E', skyBot: '#EBB283', far1: '#D9B47C', far2: '#B99066',
      sun: '#FFEFC0', sunX: .55, sunY: .12, fog: 'rgba(252,240,214,',
      img: 'images/game/ch5_done.jpg', card: '2004 年 6 月 3 日，长虹路贯通，车开进了寨门。' },
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
  const MAX_PARTICLES = 150;   // 粒子池上限
  const H0 = 420;              // 逻辑高度

  let G = null;

  /* ================= 工具函数 ================= */
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 0xff) + amt, b = (n & 0xff) + amt;
    const c = v => Math.max(0, Math.min(255, v));
    return `rgb(${c(r)},${c(g)},${c(b)})`;
  }
  function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 0xff},${n & 0xff},${a})`;
  }
  function prand(s) { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function mix(h1, h2, t) {
    const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
    const r = Math.round((a >> 16) + ((b >> 16) - (a >> 16)) * t);
    const g = Math.round(((a >> 8) & 0xff) + (((b >> 8) & 0xff) - ((a >> 8) & 0xff)) * t);
    const bl = Math.round((a & 0xff) + ((b & 0xff) - (a & 0xff)) * t);
    return `rgb(${r},${g},${bl})`;
  }

  /* ================= 初始化 ================= */
  function init() {
    const cv = document.getElementById('gameCanvas');
    if (!cv) return;
    if (G) { sizeCanvas(); return; }
    G = {
      cv, ctx: cv.getContext('2d'), W: 800, H: H0, dpr: 1,
      mileage: 0, ch: 0, frame: 0,
      vit: 100, vitMax: 100, fund: 0, stone: 0, diesel: 0, blast: 0, heart: 70,
      tool: 0,
      crews: [{ key: 'dig', n: '凿岩', num: 3, cap: 3 }, { key: 'wall', n: '砌坎', num: 2, cap: 99 }, { key: 'move', n: '运输', num: 2, cap: 99 }, { key: 'log', n: '后勤', num: 1, cap: 99 }],
      particles: [], cracks: [], pick: null, floaters: [],
      skillFx: null, haozi: 0, flash: 0, shake: 0,
      charge: false, pressT: 0, px: 0, py: 0,
      freeHits: 0, buffMult: 1, combo: 0, comboLast: 0,
      rockCache: null, won: false,
    };
    sizeCanvas();
    bindInput();
    renderPanels();
    clearInterval(G.tickTimer);
    G.tickTimer = setInterval(tick, 1000);
    requestAnimationFrame(loop);
    updateHUD();
  }

  /* DPR 自适应尺寸 + 岩壁纹理离屏预渲染 */
  function sizeCanvas() {
    const cv = G.cv;
    const cssW = cv.clientWidth || 800;
    G.dpr = Math.min(2, window.devicePixelRatio || 1);
    G.W = cssW; G.H = H0;
    cv.width = Math.round(cssW * G.dpr);
    cv.height = Math.round(H0 * G.dpr);
    buildRockCache();
  }

  /* ================= 岩壁纹理离屏预渲染（华丽核心） ================= */
  function buildRockCache() {
    const c = CHAPTERS[G.ch];
    const off = document.createElement('canvas');
    off.width = Math.round(G.W * G.dpr); off.height = Math.round(G.H * G.dpr);
    const x = off.getContext('2d');
    x.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    const W = G.W, H = G.H, top = H * .40;

    // 岩壁基底垂直渐变（上受光、下压暗）
    const bg = x.createLinearGradient(0, top, 0, H);
    bg.addColorStop(0, shade(c.rock, 10));
    bg.addColorStop(.4, c.rock);
    bg.addColorStop(1, c.rockDeep);
    x.fillStyle = bg; x.fillRect(0, top, W, H - top);

    // 岩层水平理缝（大面积层理）
    x.globalAlpha = .16;
    for (let i = 0; i < 5; i++) {
      const ly = top + (H - top) * (0.14 + i * 0.2) + prand(i + 9) * 12;
      x.fillStyle = i % 2 ? c.rockLine : shade(c.rock, -22);
      x.fillRect(0, ly, W, 2 + prand(i + 3) * 2);
    }
    x.globalAlpha = 1;

    // 块状岩石：错缝拼接、明暗交替、受光高光、裂缝阴影
    const bh = 38, bw = 56;
    const rows = Math.ceil((H - top) / bh) + 1;
    for (let r = 0; r < rows; r++) {
      const y0 = top + r * bh;
      const offX = (r % 2) ? -bw / 2 : 0;
      const cols = Math.ceil(W / bw) + 2;
      for (let col = 0; col < cols; col++) {
        const seed = r * 137 + col * 17 + G.ch * 991;
        const x0 = col * bw + offX + prand(seed) * 8 - 4;
        const w = bw - 6 - prand(seed + 1) * 10;
        const h = bh - 5 - prand(seed + 2) * 7;
        const jx = (prand(seed + 3) - .5) * 6, jy = (prand(seed + 4) - .5) * 5;
        const lum = Math.floor((prand(seed + 5) - .5) * 30);   // 明暗交替
        const base = shade(c.rock, lum);

        // 石块主体（微不规则多边形）
        x.beginPath();
        x.moveTo(x0 + 3 + jx, y0 + 3);
        x.lineTo(x0 + w - 3 + jx, y0 + 1 + jy * .4);
        x.lineTo(x0 + w + jx * .6, y0 + h - 3);
        x.lineTo(x0 + 2, y0 + h + jy);
        x.closePath();
        const sg = x.createLinearGradient(x0, y0, x0 + w, y0 + h);
        sg.addColorStop(0, shade(c.rock, lum + 14));
        sg.addColorStop(.55, base);
        sg.addColorStop(1, shade(c.rock, lum - 18));
        x.fillStyle = sg; x.fill();

        // 受光面高光（上缘+左缘）
        x.strokeStyle = rgba(c.rockHi, .75); x.lineWidth = 1.6;
        x.beginPath();
        x.moveTo(x0 + 3 + jx, y0 + 3);
        x.lineTo(x0 + w - 3 + jx, y0 + 1 + jy * .4);
        x.moveTo(x0 + 3 + jx, y0 + 3);
        x.lineTo(x0 + 2, y0 + h + jy);
        x.stroke();

        // 背光面阴影（下缘+右缘）
        x.strokeStyle = rgba(c.rockDeep, .8); x.lineWidth = 1.8;
        x.beginPath();
        x.moveTo(x0 + w + jx * .6, y0 + h - 3);
        x.lineTo(x0 + 2, y0 + h + jy);
        x.moveTo(x0 + w - 3 + jx, y0 + 1 + jy * .4);
        x.lineTo(x0 + w + jx * .6, y0 + h - 3);
        x.stroke();

        // 块内岩层纹理（2-3 条细理）
        x.strokeStyle = rgba(c.rockLine, .4); x.lineWidth = .8;
        const ln = 2 + Math.floor(prand(seed + 6) * 2);
        for (let k = 0; k < ln; k++) {
          const ty = y0 + 6 + prand(seed + 7 + k) * (h - 10);
          x.beginPath();
          x.moveTo(x0 + 4, ty);
          x.quadraticCurveTo(x0 + w * .5, ty + (prand(seed + 11 + k) - .5) * 5, x0 + w - 4, ty + (prand(seed + 15 + k) - .5) * 4);
          x.stroke();
        }
        // 天然裂缝阴影
        if (prand(seed + 8) > .62) {
          x.strokeStyle = rgba(c.rockDeep, .65); x.lineWidth = 1;
          let cx0 = x0 + 6 + prand(seed + 9) * (w - 14), cy0 = y0 + 4;
          x.beginPath(); x.moveTo(cx0, cy0);
          for (let k = 0; k < 3; k++) {
            cx0 += (prand(seed + 20 + k) - .5) * 10; cy0 += h / 3.4;
            x.lineTo(cx0, cy0);
          }
          x.stroke();
        }
      }
    }

    // 整体光斑与暗角（增强体积感）
    const vg = x.createRadialGradient(W * .3, top + 30, 40, W * .3, top + 30, W * .75);
    vg.addColorStop(0, 'rgba(255,246,224,.14)');
    vg.addColorStop(.6, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.30)');
    x.fillStyle = vg; x.fillRect(0, top, W, H - top);

    G.rockCache = off;
  }

  /* ================= 输入：单击/长按蓄力/连击 ================= */
  function bindInput() {
    const cv = G.cv;
    const pos = e => {
      const r = cv.getBoundingClientRect();
      const t = (e.changedTouches && e.changedTouches[0]) || e;
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    };
    const down = e => {
      if (G.won) return;
      const p = pos(e);
      G.px = p.x; G.py = p.y;
      G.pressT = Date.now(); G.charge = true;
      if (e.cancelable && e.type === 'touchstart') e.preventDefault();
    };
    const up = e => {
      if (!G.charge) return;
      G.charge = false;
      const held = Date.now() - G.pressT;
      const p = pos(e);
      G.px = p.x; G.py = p.y;
      hit(e, held > 400 ? 3 : 1);   // 长按=蓄力重镐3倍
    };
    cv.onmousedown = down;
    cv.onmouseup = up;
    cv.onmouseleave = () => { G.charge = false; };
    cv.ontouchstart = down;
    cv.ontouchend = up;
  }

  /* 画面坐标 → 画布逻辑坐标（校正 DPR 与元素缩放） */
  function toCanvas(e) {
    const r = G.cv.getBoundingClientRect();
    const t = (e.changedTouches && e.changedTouches[0]) || e;
    let x = (t.clientX - r.left) * (G.W / r.width);
    let y = (t.clientY - r.top) * (G.H / r.height);
    // 坐标落在岩壁区外（如 HUD 按钮触发）时，默认打在掌子面
    if (!(y > G.H * .38 && y < G.H * .96 && x >= 0 && x <= G.W)) {
      const f = faceX();
      x = f + 14; y = G.H * .66;
    }
    return { x, y };
  }

  /* 掌子面（隧道推进端点） */
  function faceX() {
    const c = CHAPTERS[G.ch];
    const segStart = G.ch === 0 ? 0 : CHAPTERS[G.ch - 1].end;
    const done = Math.max(0, Math.min(1, (G.mileage - segStart) / (c.end - segStart)));
    return 44 + done * (G.W - 150);
  }

  /* ================= 凿岩 ================= */
  function hit(e, mult) {
    if (G.won || !e) return;
    const dig = G.crews[0];
    const cost = mult === 3 ? 3 : 1;
    const crewCost = Math.floor((dig.num - 1) / 2);
    const total = G.freeHits > 0 ? 0 : cost + crewCost;
    if (G.freeHits <= 0 && G.vit < total) { msg('体力耗尽，吃点背篓饭吧'); return; }
    const tool = TOOLS[G.tool];
    if (tool.diesel && G.diesel <= 0) { msg('柴油用尽，先买柴油'); G.tool = 1; renderPanels(); return; }
    if (tool.diesel) G.diesel--;

    // 连击：800ms 内连续，8 连触发号子齐鸣
    const now = Date.now();
    if (now - G.comboLast < 800) G.combo++; else G.combo = 1;
    G.comboLast = now;
    if (G.combo >= 8) {
      G.combo = 0; G.buffMult = 1.2; G.haozi = 600;
      msg('号子齐鸣！全队效率+20%');
      addFloater('号子齐鸣', G.W / 2, G.H * .3, '#E8C87E', 26);
      setTimeout(() => { if (G.buffMult === 1.2) G.buffMult = 1; }, 10000);
    }

    // 窝工：超作业面效率减半
    const crowdPenalty = dig.num > dig.cap ? 0.5 : 1;
    const crewBonus = 1 + (dig.num - 1) * 0.15 + (G.crews[1].num - 2) * 0.05;
    const gain = CHAPTERS[G.ch].hard * tool.mult * mult * G.buffMult * crowdPenalty * Math.max(0.5, crewBonus);
    G.mileage = Math.min(3000, G.mileage + gain);
    if (G.freeHits > 0) G.freeHits--; else G.vit = Math.max(0, G.vit - total);
    if (Math.random() < 0.5) G.stone += Math.random() < 0.3 ? 2 : 1;

    // 镐击动画 + 金色火花 + 碎石抛物线
    const p = toCanvas(e);
    G.pick = { x: p.x, y: p.y, t: 0, heavy: mult === 3 };
    spawnSparks(p.x, p.y, mult === 3 ? 26 : 12);
    spawnDebris(p.x, p.y, mult === 3 ? 14 : 6);
    if (mult === 3) { G.shake = Math.max(G.shake, 5); ringFlash(p.x, p.y); }
    G.cracks.push({ x: p.x, y: p.y, seed: Math.random() * 999, life: 50 });
    if (G.cracks.length > 14) G.cracks.shift();
    updateHUD(); checkChapter();
  }

  /* ================= 粒子系统（池上限150） ================= */
  function pushP(p) {
    if (G.particles.length >= MAX_PARTICLES) G.particles.shift();
    G.particles.push(p);
  }
  function spawnSparks(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * Math.random(), sp = 2 + Math.random() * 5;
      pushP({ kind: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, life: 18 + Math.random() * 14, max: 32 });
    }
  }
  function spawnDebris(x, y, n) {
    const c = CHAPTERS[G.ch];
    for (let i = 0; i < n; i++) {
      pushP({
        kind: 'debris', x, y, vx: (Math.random() - .5) * 6, vy: -Math.random() * 5 - 2,
        rot: Math.random() * 6.28, vr: (Math.random() - .5) * .3,
        size: 2 + Math.random() * 3.5, life: 40 + Math.random() * 20,
        col: shade(c.rock, Math.floor((Math.random() - .5) * 40)),
      });
    }
  }
  function spawnSmoke(x, y, n) {
    for (let i = 0; i < n; i++) {
      pushP({
        kind: 'smoke', x: x + (Math.random() - .5) * 40, y: y + (Math.random() - .5) * 24,
        vx: (Math.random() - .5) * 1.2, vy: -Math.random() * 1 - .3,
        r: 8 + Math.random() * 12, grow: .5 + Math.random() * .5,
        life: 50 + Math.random() * 30, max: 80,
      });
    }
  }
  function ringFlash(x, y) { pushP({ kind: 'ring', x, y, r: 6, life: 16, max: 16 }); }
  function addFloater(text, x, y, color, size) {
    G.floaters.push({ text, x, y, color: color || '#F0D68A', size: size || 15, life: 70, max: 70 });
  }

  /* ================= 章节 ================= */
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
    G.cracks.length = 0;
    buildRockCache();
    renderPanels(); updateHUD();
  }
  function winGame() {
    G.won = true;
    const s = +(localStorage.getItem('shiyi_score') || 0) + 75;
    localStorage.setItem('shiyi_score', s);
    // 通关政绩值归入登录账号
    if (window.ShiyiAuth && ShiyiAuth.current()) ShiyiAuth.addScore(75);
    showModal(`
      <div class="modal-title" style="text-align:center;">大岩路，凿通了！</div>
      <div class="modal-text" style="text-align:center;">2004 年 6 月 3 日，长虹路贯通。<br>这条路不是你凿的，是一百零六户人凿的。<br><br><b style="color:var(--red);">+75 政绩值</b></div>
      <button class="btn" style="width:100%;" onclick="ShiyiGame.restart()">再走一次</button>`);
  }
  function restart() { closeModal(); G = null; init(); }

  /* ================= 资源操作 ================= */
  function meal() { if (G.won) return; G.vit = Math.min(G.vitMax, G.vit + 10); msg('吃饱了，+10 体力'); updateHUD(); }
  function sell() { if (G.stone < 50) { msg('碎石还不够 50 块'); return; } G.stone -= 50; G.fund += 15; msg('碎石卖给水泥厂，+15 元'); updateHUD(); }
  function buyDiesel() { if (G.fund < 5) { msg('柴油 5 元，资金不足'); return; } G.fund -= 5; G.diesel += 10; msg('+10 柴油'); renderPanels(); updateHUD(); }
  function sharpen() { if (G.fund < 5) { msg('磨砺要 5 元'); return; } G.fund -= 5; msg('工具磨砺如新'); updateHUD(); }

  /* ================= 编组（窝工） ================= */
  function crew(key, d) {
    const c = G.crews.find(x => x.key === key);
    const total = G.crews.reduce((s, x) => s + x.num, 0);
    if (d > 0 && total >= 12) { msg('全村义务工就 12 人'); return; }
    c.num = Math.max(0, Math.min(c.cap, c.num + d));
    if (key === 'dig' && c.num > c.cap) msg('超过作业面，窝工了！效率减半');
    renderPanels(); updateHUD();
  }

  /* ================= 队友技能（消耗+人物升起光环特效） ================= */
  function useMate(id) {
    const m = MATES.find(x => x.id === id);
    if (G.ch < m.unlock) { msg(`${m.name}后续章节加入`); return; }
    if (m.cost.fund && G.fund < m.cost.fund) { msg(`需资金 ${m.cost.fund} 元`); return; }
    if (m.cost.diesel && G.diesel < m.cost.diesel) { msg(`需柴油 ${m.cost.diesel}`); return; }
    if (m.cost.fund) G.fund -= m.cost.fund;
    if (m.cost.diesel) G.diesel -= m.cost.diesel;
    G.skillFx = { t: 0, dur: 62, name: m.name, skill: m.skill };   // 约1秒
    if (id === 'shao') { G.buffMult = 1.5; msg('邵再贵督工：30秒+50%'); setTimeout(() => { if (G.buffMult === 1.5) G.buffMult = 1; }, 30000); }
    else if (id === 'he') { G.vit = G.vitMax; msg('老书记的灯：体力回满'); }
    else if (id === 'chen') { doBlast(true); }
    else if (id === 'wang') { G.freeHits = 20; G.heart = Math.min(100, G.heart + 5); msg('动员会：20镐免体力'); }
    renderPanels(); updateHUD();
  }

  /* ================= 爆破（安全题） ================= */
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
    const f = faceX(), cy = G.H * .66;
    // 全屏闪光 + 震动 + 粒子爆发
    G.flash = 9; G.shake = 12;
    spawnSparks(f + 10, cy, 40);
    spawnDebris(f + 10, cy, 30);
    spawnSmoke(f + 20, cy, 12);
    ringFlash(f + 10, cy);
    addFloater(`轰！推进 ${gain.toFixed(0)} 米`, G.W / 2, G.H * .34, '#FFD98A', 22);
    msg(`轰！推进 ${gain.toFixed(0)} 米`);
    updateHUD(); checkChapter();
  }

  /* ================= 弹层 ================= */
  function showModal(html) { document.getElementById('modalCard').innerHTML = html; document.getElementById('modalMask').classList.add('on'); }
  function closeModal() { document.getElementById('modalMask').classList.remove('on'); }
  function msg(t) { const el = document.getElementById('gameMsg'); if (el) el.textContent = t; }

  /* ================= HUD 与面板 ================= */
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
    const tr = document.getElementById('toolRow');
    if (tr) tr.innerHTML = TOOLS.map(t => `
      <div class="tool ${G.tool === t.id ? 'on' : ''} ${G.ch < t.unlock ? 'locked' : ''}" onclick="ShiyiGame.tool(${t.id})">
        <div class="tool-ic">${t.icon}</div><div class="note">${t.name} ×${t.mult}</div>
      </div>`).join('') +
      `<div class="tool" onclick="ShiyiGame.buyDiesel()"><div class="tool-ic">油</div><div class="note">买柴油 5元</div></div>`;
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
    const mr = document.getElementById('mateRow');
    if (mr) mr.innerHTML = MATES.map(m => `
      <div class="mate ${G.ch < m.unlock ? 'locked' : ''}" onclick="ShiyiGame.useMate('${m.id}')">
        <div class="mate-face">${m.name[0]}</div>
        <div class="note" style="font-weight:600;">${m.name}</div>
        <div class="note" style="color:var(--red-deep);font-size:12px;">${m.skill}</div>
        <div class="note" style="color:var(--gold-deep);font-size:11px;">${m.costText}</div>
      </div>`).join('');
  }

  /* ================= 资源节拍 ================= */
  function tick() { if (G && G.vit < G.vitMax && !G.won) { G.vit++; updateHUD(); } }

  /* ================= 渲染循环 ================= */
  function loop() {
    const pg = document.getElementById('page-game');
    if (G && pg && pg.classList.contains('on')) {
      const cssW = G.cv.clientWidth || G.W;
      if (Math.abs(cssW - G.W) > 2) sizeCanvas();   // 宽度变化时重建
      draw();
    }
    requestAnimationFrame(loop);
  }

  /* ================= 主绘制 ================= */
  function draw() {
    const { ctx, cv } = G; const W = G.W, H = G.H;
    const c = CHAPTERS[G.ch]; G.frame++;
    ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);

    // 屏幕震动（重镐/爆破）
    if (G.shake > 0) {
      ctx.translate((Math.random() - .5) * G.shake * .9, (Math.random() - .5) * G.shake * .7);
      G.shake *= .86; if (G.shake < .3) G.shake = 0;
    }

    /* 层1：天空（章节色调渐变） */
    const sky = ctx.createLinearGradient(0, 0, 0, H * .58);
    sky.addColorStop(0, c.skyTop); sky.addColorStop(1, c.skyBot);
    ctx.fillStyle = sky; ctx.fillRect(-12, -12, W + 24, H + 24);

    /* 太阳/月亮光晕 */
    const sx = W * c.sunX, sy = H * c.sunY;
    const halo = ctx.createRadialGradient(sx, sy, 2, sx, sy, 90);
    halo.addColorStop(0, rgba(c.sun, .95));
    halo.addColorStop(.25, rgba(c.sun, .5));
    halo.addColorStop(1, rgba(c.sun, 0));
    ctx.fillStyle = halo; ctx.fillRect(sx - 95, sy - 95, 190, 190);
    ctx.fillStyle = rgba(c.sun, .9);
    ctx.beginPath(); ctx.arc(sx, sy, 15, 0, 7); ctx.fill();

    /* 层2：双层远山剪影（远淡近深，缓慢平移） */
    ctx.globalAlpha = .55; ctx.fillStyle = c.far1;
    ridge(W, H * .36, H * .15, .012, G.frame * .04, 31);
    ctx.globalAlpha = .8; ctx.fillStyle = c.far2;
    ridge(W, H * .46, H * .17, .02, G.frame * .07, 77);
    ctx.globalAlpha = 1;

    /* 层3：流动云雾 */
    for (let i = 0; i < 4; i++) {
      const sp = 0.25 + i * 0.13;
      const cx = ((G.frame * sp + i * 260) % (W + 320)) - 160;
      const cy = H * (0.26 + i * 0.08) + Math.sin(G.frame * .01 + i) * 6;
      ctx.fillStyle = c.fog + (0.34 - i * 0.05) + ')';
      cloud(ctx, cx, cy, 44 + i * 13);
    }

    /* 层4：岩壁主体（离屏缓存） */
    if (G.rockCache) ctx.drawImage(G.rockCache, 0, 0, W, H);

    /* 隧道口（纵深+凿痕） */
    drawTunnel(W, H, c);

    /* 动态裂缝（镐击点） */
    ctx.lineWidth = 1.6;
    G.cracks = G.cracks.filter(cr => {
      cr.life--;
      ctx.strokeStyle = rgba(c.rockDeep, Math.min(1, cr.life / 40) * .9);
      ctx.beginPath(); ctx.moveTo(cr.x, cr.y);
      let px = cr.x, py = cr.y;
      for (let i = 0; i < 5; i++) {
        px += (prand(cr.seed + i) - .4) * 14;
        py += (prand(cr.seed + i + 9) - .3) * 12;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      return cr.life > 0;
    });

    /* 层5：前景（地面阴影/工具/植被剪影/红旗） */
    drawForeground(W, H, c);

    /* 义务工小人 */
    drawCrews(W, H);

    /* 粒子 */
    drawParticles();

    /* 镐击动画 */
    drawPick();

    /* 长按蓄力指示（镐头高亮） */
    drawCharge();

    /* 飘字 */
    drawFloaters();

    /* 队友技能特效 */
    if (G.skillFx) { drawSkillFx(W, H); G.skillFx.t++; if (G.skillFx.t >= G.skillFx.dur) G.skillFx = null; }

    /* 号子齐鸣全屏金光脉冲 */
    if (G.haozi > 0) {
      G.haozi--;
      const a = .05 + Math.sin(G.frame * .18) * .03;
      ctx.fillStyle = `rgba(232,200,126,${Math.max(0, a)})`;
      ctx.fillRect(0, 0, W, H);
    }

    /* 爆破全屏闪光 */
    if (G.flash > 0) {
      ctx.fillStyle = `rgba(255,244,214,${G.flash / 9 * .85})`;
      ctx.fillRect(0, 0, W, H);
      G.flash--;
    }

    /* 胜利金光普照 */
    if (G.won) {
      const wg = ctx.createLinearGradient(0, 0, 0, H);
      wg.addColorStop(0, 'rgba(255,230,160,.22)'); wg.addColorStop(1, 'rgba(255,200,120,.08)');
      ctx.fillStyle = wg; ctx.fillRect(0, 0, W, H);
    }
  }

  /* 远山山脊 */
  function ridge(W, baseY, amp, k, t, seed) {
    const ctx = G.ctx;
    ctx.beginPath(); ctx.moveTo(-20, baseY + 40);
    for (let x = -20; x <= W + 20; x += 14) {
      const y = baseY - (Math.sin((x + t) * k + seed) * .5 + Math.sin((x + t) * k * 2.7 + seed * 2) * .3 + .5) * amp;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W + 20, baseY + 60); ctx.lineTo(-20, baseY + 60);
    ctx.closePath(); ctx.fill();
  }

  /* 云团 */
  function cloud(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 7);
    ctx.arc(cx + r * .8, cy + r * .15, r * .78, 0, 7);
    ctx.arc(cx - r * .85, cy + r * .2, r * .68, 0, 7);
    ctx.arc(cx + r * .2, cy - r * .35, r * .6, 0, 7);
    ctx.fill();
  }

  /* 隧道口：内壁渐变纵深 + 放射凿痕 + 洞口沿石高光 */
  function drawTunnel(W, H, c) {
    const ctx = G.ctx;
    const tw = faceX();
    if (tw <= 46) return;
    const yT = H * .52, yB = H * .86, yMid = (yT + yB) / 2;

    // 洞体（梯形，近大远小）
    ctx.beginPath();
    ctx.moveTo(-8, yT - 14);
    ctx.lineTo(tw, yT + 8);
    ctx.lineTo(tw, yB - 8);
    ctx.lineTo(-8, yB + 10);
    ctx.closePath();
    const tg = ctx.createLinearGradient(0, yMid, tw, yMid);
    tg.addColorStop(0, '#171209');
    tg.addColorStop(.65, '#241C11');
    tg.addColorStop(1, '#4A3A24');
    ctx.fillStyle = tg; ctx.fill();

    // 内壁顶部暗弧（拱顶感）
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.moveTo(-8, yT - 14); ctx.lineTo(tw, yT + 8); ctx.lineTo(tw, yT + 22); ctx.lineTo(-8, yT + 2);
    ctx.closePath(); ctx.fill();

    // 掌子面受光面（岩壁切面）
    const fg = ctx.createLinearGradient(tw - 26, 0, tw, 0);
    fg.addColorStop(0, rgba(c.rock, 0));
    fg.addColorStop(1, rgba(c.rockHi, .9));
    ctx.fillStyle = fg;
    ctx.fillRect(tw - 26, yT + 6, 26, yB - yT - 12);

    // 掌子面凿痕（放射短线，微微颤动）
    ctx.strokeStyle = 'rgba(20,14,8,.55)'; ctx.lineWidth = 1.1;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + prand(i + G.ch * 7) * .4;
      const rr = 8 + prand(i * 3 + 2) * 20;
      const cx0 = tw - 8, cy0 = yMid;
      ctx.beginPath();
      ctx.moveTo(cx0 + Math.cos(a) * rr * .4, cy0 + Math.sin(a) * rr * .4 * 1.4);
      ctx.lineTo(cx0 + Math.cos(a) * rr, cy0 + Math.sin(a) * rr * 1.4);
      ctx.stroke();
    }

    // 洞口沿石描边（受光）
    ctx.strokeStyle = rgba(c.rockHi, .8); ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(tw, yT + 8); ctx.lineTo(tw, yB - 8); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(tw - 4, yT + 10); ctx.lineTo(tw - 4, yB - 10); ctx.stroke();
  }

  /* 前景：地面、工具杂物、边角植被、红旗 */
  function drawForeground(W, H, c) {
    const ctx = G.ctx;
    const gy = H * .9;
    // 地面
    const gg = ctx.createLinearGradient(0, gy - 8, 0, H);
    gg.addColorStop(0, rgba(c.rockDeep, 0));
    gg.addColorStop(.35, rgba(c.rockDeep, .55));
    gg.addColorStop(1, shade(c.rockDeep, -18));
    ctx.fillStyle = gg; ctx.fillRect(0, gy - 8, W, H - gy + 8);

    // 地面碎石
    for (let i = 0; i < 16; i++) {
      const x = prand(i * 7 + 1) * W, y = gy + 4 + prand(i * 7 + 2) * (H - gy - 8);
      ctx.fillStyle = shade(c.rock, Math.floor((prand(i * 7 + 3) - .5) * 34));
      ctx.globalAlpha = .8;
      ctx.beginPath(); ctx.ellipse(x, y, 2 + prand(i) * 3.5, 1.4 + prand(i + 5) * 2, prand(i + 9), 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 左侧工具堆：立着的钢钎 + 箩筐
    ctx.strokeStyle = '#4E4438'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(22, gy + 12); ctx.lineTo(30, gy - 26); ctx.stroke();
    ctx.strokeStyle = '#8B8B92'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(30, gy - 26); ctx.lineTo(31.5, gy - 33); ctx.stroke();
    basket(ctx, 54, gy + 8, 15);

    // 右下角灌木剪影
    ctx.fillStyle = rgba('#2E3A28', .55);
    for (let i = 0; i < 6; i++) {
      const bx = W - 12 - i * 11, by = H - 2;
      ctx.beginPath();
      ctx.ellipse(bx, by - 6 - prand(i) * 8, 8 + prand(i + 2) * 6, 9 + prand(i + 4) * 7, 0, 0, 7);
      ctx.fill();
    }

    // 红旗（插在掌子面）
    const fx = faceX();
    if (fx > 46) {
      const wave = Math.sin(G.frame * .13) * 4;
      const fy = H * .5;
      ctx.strokeStyle = '#5A4632'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(fx - 1, fy + 26); ctx.lineTo(fx - 1, fy - 12); ctx.stroke();
      const fg2 = ctx.createLinearGradient(fx, fy - 12, fx + 26, fy);
      fg2.addColorStop(0, '#D8443A'); fg2.addColorStop(1, '#A42720');
      ctx.fillStyle = fg2;
      ctx.beginPath();
      ctx.moveTo(fx, fy - 12);
      ctx.quadraticCurveTo(fx + 13, fy - 10 + wave, fx + 26, fy - 7 + wave);
      ctx.quadraticCurveTo(fx + 13, fy - 1 + wave, fx, fy + 1);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#F2C94C';
      ctx.beginPath(); ctx.arc(fx + 6, fy - 7 + wave * .5, 1.8, 0, 7); ctx.fill();
    }
  }
  function basket(ctx, x, y, r) {
    ctx.fillStyle = '#9A7B4F';
    ctx.beginPath();
    ctx.moveTo(x - r, y - r * .7);
    ctx.quadraticCurveTo(x - r * .8, y + r * .8, x, y + r * .9);
    ctx.quadraticCurveTo(x + r * .8, y + r * .8, x + r, y - r * .7);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#6E5636'; ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x - r + i * .4, y - r * .7 + i * r * .42);
      ctx.quadraticCurveTo(x, y - r * .7 + i * r * .42 + 3, x + r - i * .4, y - r * .7 + i * r * .42);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(x, y - r * .7, r, r * .28, 0, 0, 7);
    ctx.fillStyle = '#7A5F3C'; ctx.fill();
  }

  /* ================= 义务工小人（精细版） ================= */
  function drawCrews(W, H) {
    const gy = H * .865;
    const dig = G.crews[0], wall = G.crews[1], move = G.crews[2], log = G.crews[3];
    const glow = G.haozi > 0;   // 号子齐鸣：全队金光

    for (let i = 0; i < dig.num; i++) {
      const idle = i >= dig.cap;
      worker(36 + i * 30, gy - i * 7, i * 1.7, 'dig', idle, glow);
    }
    for (let i = 0; i < wall.num; i++) worker(W * .44 + i * 30, gy + 4, i * 2.3 + 5, 'wall', false, glow);
    for (let i = 0; i < move.num; i++) {
      const walk = Math.sin(G.frame * .06 + i * 2.1);
      worker(W * .6 + i * 30 + walk * 14, gy + 8, i * 3.1 + 9, 'move', false, glow, walk);
    }
    for (let i = 0; i < log.num; i++) worker(W * .85 + i * 26, gy + 12, i * 2.7 + 13, 'log', false, glow);
  }

  function worker(x, y, phase, type, idle, glow, walk) {
    const ctx = G.ctx;
    const t = G.frame;
    const swing = Math.sin(t * .16 + phase);
    const bend = type === 'wall' ? (Math.sin(t * .1 + phase) * .5 + .5) : 0;  // 砌坎弯腰循环
    const skin = idle ? '#A89E8E' : '#D9A86C';
    const cloth = idle ? '#8E877A' : (type === 'dig' ? '#3E4A5C' : type === 'wall' ? '#54462E' : type === 'move' ? '#5C3E3E' : '#3E5240');

    ctx.save();
    ctx.translate(x, y);
    // 号子齐鸣金光描边
    if (glow && !idle) { ctx.shadowColor = 'rgba(240,214,138,.95)'; ctx.shadowBlur = 12; }

    const bob = type === 'move' ? Math.abs(Math.sin(t * .16 + phase)) * 1.6 : Math.sin(t * .08 + phase) * .6;
    ctx.translate(0, -bob);

    // 双腿（运输组走动交替迈步）
    ctx.strokeStyle = idle ? '#7E776A' : '#33291C'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    if (type === 'move') {
      const step = Math.sin(t * .16 + phase) * 4;
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(-3 + step, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(3 - step, 0); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(-3, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(3, 0); ctx.stroke();
    }

    // 身体（弯腰时前倾）
    ctx.save();
    ctx.translate(0, -12);
    ctx.rotate(bend * .55 + (type === 'dig' ? swing * .12 : 0));
    ctx.fillStyle = cloth;
    ctx.beginPath();
    ctx.moveTo(-5.5, 0); ctx.lineTo(-4, -13); ctx.lineTo(4, -13); ctx.lineTo(5.5, 0);
    ctx.closePath(); ctx.fill();
    // 腰带
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-5, -4, 10, 2);

    // 手臂+工具
    ctx.save();
    ctx.translate(2, -11);
    if (type === 'dig') {
      // 抡镐：整体大回环，落点瞬间加速感
      ctx.rotate(swing * .85 - .5);
      ctx.strokeStyle = skin; ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(13, 2); ctx.stroke();
      // 镐
      ctx.strokeStyle = '#7A5230'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(13, 2); ctx.lineTo(21, -6); ctx.stroke();
      ctx.strokeStyle = idle ? '#8E877A' : '#3A332C'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(15, -8); ctx.quadraticCurveTo(23, -11, 27, -5); ctx.stroke();
    } else if (type === 'wall') {
      // 弯腰砌坎：双手前伸放石块
      ctx.rotate(bend * .5 + .3);
      ctx.strokeStyle = skin; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(11, 5); ctx.stroke();
      ctx.fillStyle = '#6E655A';
      ctx.fillRect(10, 3, 6, 5);
    } else if (type === 'move') {
      // 手扶背篓绳
      ctx.rotate(Math.sin(t * .16 + phase) * .12 + .35);
      ctx.strokeStyle = skin; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(9, -3); ctx.stroke();
    } else {
      // 后勤：间歇举饭盒
      const lift = Math.sin(t * .07 + phase) > .55;
      ctx.rotate(lift ? -1.5 : .25);
      ctx.strokeStyle = skin; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(9, lift ? -4 : 3); ctx.stroke();
      ctx.fillStyle = '#B9BEC6';
      ctx.fillRect(8, lift ? -8 : 2, 6, 4);
    }
    ctx.restore();

    // 头
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(0, -18.5, 4.6, 0, 7); ctx.fill();
    // 安全帽（半圆+帽檐+顶棱）
    const helmet = idle ? '#B7AF9E' : '#E8B93B';
    ctx.fillStyle = helmet;
    ctx.beginPath(); ctx.arc(0, -19.5, 5.2, Math.PI, 0); ctx.fill();
    ctx.fillRect(-6.4, -20.2, 12.8, 1.8);
    ctx.fillRect(-1, -24.6, 2, 3);

    // 背篓（运输组背在背上）
    if (type === 'move') {
      ctx.save();
      ctx.translate(-6, -8);
      ctx.rotate(-.15);
      ctx.fillStyle = '#9A7B4F';
      ctx.beginPath();
      ctx.moveTo(-5, -6); ctx.lineTo(5, -6); ctx.lineTo(3.6, 5); ctx.lineTo(-3.6, 5);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#6E5636'; ctx.lineWidth = .8;
      ctx.beginPath(); ctx.moveTo(-4.4, -2); ctx.lineTo(4.4, -2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4, 2); ctx.lineTo(4, 2); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // 超作业面：灰色站立 + 省略号
    if (idle) {
      ctx.fillStyle = 'rgba(240,234,220,.85)';
      ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('…', 0, -32);
    }
    ctx.restore();
  }

  /* ================= 粒子绘制 ================= */
  function drawParticles() {
    const ctx = G.ctx;
    G.particles = G.particles.filter(p => {
      p.life--;
      if (p.life <= 0) return false;
      if (p.kind === 'spark') {
        p.x += p.vx; p.y += p.vy; p.vy += .28;
        const a = Math.min(1, p.life / (p.max || 32));
        ctx.strokeStyle = `rgba(255,${200 + Math.floor(Math.random() * 40)},80,${a})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 1.8, p.y - p.vy * 1.8); ctx.stroke();
        ctx.fillStyle = `rgba(255,236,170,${a})`;
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
      } else if (p.kind === 'debris') {
        p.x += p.vx; p.y += p.vy; p.vy += .34; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, p.life / 30);
        ctx.fillStyle = p.col;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .8);
        ctx.restore(); ctx.globalAlpha = 1;
      } else if (p.kind === 'smoke') {
        p.x += p.vx; p.y += p.vy; p.r += p.grow;
        ctx.fillStyle = `rgba(190,182,168,${Math.min(.3, p.life / (p.max || 80) * .32)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      } else if (p.kind === 'ring') {
        p.r += 4.2;
        const a = p.life / p.max;
        ctx.strokeStyle = `rgba(255,226,150,${a * .9})`;
        ctx.lineWidth = 3 * a + 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.stroke();
      }
      return true;
    });
  }

  /* ================= 镐击动画 ================= */
  function drawPick() {
    const p = G.pick;
    if (!p) return;
    p.t++;
    const life = p.heavy ? 14 : 10;
    if (p.t >= life) { G.pick = null; return; }
    const ctx = G.ctx;
    const k = p.t / life;
    const rot = -1.15 + k * 1.9;   // 抡起→砸下
    ctx.save();
    ctx.translate(p.x, p.y - 6);
    ctx.rotate(rot);
    // 木柄
    const hg = ctx.createLinearGradient(0, -46, 0, 6);
    hg.addColorStop(0, '#9A6B3E'); hg.addColorStop(1, '#6E4526');
    ctx.fillStyle = hg;
    ctx.fillRect(-2.2, -46, 4.4, 50);
    // 镐头（受光金属）
    const pg = ctx.createLinearGradient(-17, -52, 17, -40);
    pg.addColorStop(0, '#5C5348'); pg.addColorStop(.5, '#8D8272'); pg.addColorStop(1, '#4A4238');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.moveTo(-17, -50); ctx.quadraticCurveTo(0, -58, 17, -50);
    ctx.lineTo(12, -41); ctx.quadraticCurveTo(0, -46, -12, -41);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,200,.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-15, -49); ctx.quadraticCurveTo(0, -56, 15, -49); ctx.stroke();
    ctx.restore();
    // 落点冲击十字闪
    if (k > .75) {
      const a = (1 - k) * 4;
      ctx.strokeStyle = `rgba(255,232,160,${a})`; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x - 10, p.y); ctx.lineTo(p.x + 10, p.y);
      ctx.moveTo(p.x, p.y - 10); ctx.lineTo(p.x, p.y + 10);
      ctx.stroke();
    }
  }

  /* ================= 长按蓄力指示（镐头高亮） ================= */
  function drawCharge() {
    if (!G.charge || G.won) return;
    const held = Date.now() - G.pressT;
    if (held < 120) return;
    const ctx = G.ctx;
    const k = Math.min(1, held / 700);   // 蓄力进度
    // 指针在画布内则用指针位置，否则用掌子面
    let x = G.px, y = G.py;
    if (!(y > G.H * .38 && y < G.H * .96)) { x = faceX() + 14; y = G.H * .66; }
    // 蓄力光环（越满越亮越金）
    const rr = 12 + k * 26 + Math.sin(G.frame * .3) * 3;
    const g = ctx.createRadialGradient(x, y, 2, x, y, rr);
    g.addColorStop(0, `rgba(255,236,170,${.35 + k * .5})`);
    g.addColorStop(.6, `rgba(232,200,126,${.18 + k * .3})`);
    g.addColorStop(1, 'rgba(232,200,126,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill();
    // 外环刻度（蓄力进度）
    ctx.strokeStyle = `rgba(255,220,140,${.5 + k * .5})`;
    ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.arc(x, y, rr * .8, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke();
    if (k >= 1) {
      ctx.fillStyle = 'rgba(255,244,214,.95)';
      ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('重镐！', x, y - rr - 6);
    }
  }

  /* ================= 飘字 ================= */
  function drawFloaters() {
    const ctx = G.ctx;
    G.floaters = G.floaters.filter(f => {
      f.life--; f.y -= .55;
      const a = Math.min(1, f.life / (f.max * .4));
      ctx.font = `bold ${f.size}px "STKaiti","KaiTi",serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = `rgba(60,40,16,${a * .8})`; ctx.lineWidth = 3;
      ctx.strokeText(f.text, f.x, f.y);
      const g = ctx.createLinearGradient(f.x, f.y - f.size, f.x, f.y + 4);
      g.addColorStop(0, '#FFF3D0'); g.addColorStop(.55, f.color); g.addColorStop(1, '#B8862E');
      ctx.fillStyle = g;
      ctx.globalAlpha = a;
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
      return f.life > 0;
    });
  }

  /* ================= 队友技能特效：人物升起+光环+鎏金技能名 ================= */
  function drawSkillFx(W, H) {
    const ctx = G.ctx;
    const { t, dur, name, skill } = G.skillFx;
    const k = t / dur;                       // 0→1
    const rise = Math.min(1, t / 18);        // 升起
    const ease = 1 - Math.pow(1 - rise, 3);  // easeOutCubic
    const fade = k > .75 ? 1 - (k - .75) / .25 : 1;
    const cx = W / 2, baseY = H + 30;
    const cy = baseY - ease * (H * .52);
    const scale = .7 + ease * .8;

    ctx.save();
    ctx.globalAlpha = fade;

    // 金色光环三层扩散
    for (let i = 0; i < 3; i++) {
      const rr = 26 + k * (90 + i * 46) + i * 16;
      const a = Math.max(0, (1 - k) * .7 - i * .16);
      ctx.strokeStyle = `rgba(232,200,126,${a})`;
      ctx.lineWidth = 3.4 - i * .9;
      ctx.beginPath(); ctx.arc(cx, cy - 34 * scale, rr, 0, 7); ctx.stroke();
    }
    // 背光圆盘
    const bg = ctx.createRadialGradient(cx, cy - 34 * scale, 4, cx, cy - 34 * scale, 60 * scale);
    bg.addColorStop(0, 'rgba(255,236,170,.5)');
    bg.addColorStop(1, 'rgba(255,236,170,0)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(cx, cy - 34 * scale, 60 * scale, 0, 7); ctx.fill();

    // 人物（大号精细剪影：安全帽+头+身+臂）
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(scale, scale);
    ctx.shadowColor = 'rgba(240,214,138,.9)'; ctx.shadowBlur = 22;
    ctx.fillStyle = '#B3352B';
    ctx.beginPath();   // 身体
    ctx.moveTo(-13, 0); ctx.lineTo(-10, -34); ctx.lineTo(10, -34); ctx.lineTo(13, 0);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#B3352B'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(8, -28); ctx.lineTo(26, -40); ctx.stroke();   // 举起的手臂
    ctx.beginPath(); ctx.moveTo(-8, -28); ctx.lineTo(-18, -12); ctx.stroke();
    ctx.fillStyle = '#D9A86C';
    ctx.beginPath(); ctx.arc(0, -42, 9, 0, 7); ctx.fill();   // 头
    ctx.fillStyle = '#E8B93B';
    ctx.beginPath(); ctx.arc(0, -44, 10, Math.PI, 0); ctx.fill();   // 安全帽
    ctx.fillRect(-12, -45, 24, 3);
    ctx.fillRect(-2, -54, 4, 5);
    ctx.restore();

    // 鎏金技能名（浮现+微上飘）
    const ty = cy + 26 - k * 8;
    ctx.font = 'bold 24px "STKaiti","KaiTi",serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = `rgba(60,40,16,${fade * .85})`; ctx.lineWidth = 4;
    ctx.strokeText(name + ' · ' + skill, cx, ty);
    const tg = ctx.createLinearGradient(cx, ty - 22, cx, ty + 6);
    tg.addColorStop(0, '#FFF6DC'); tg.addColorStop(.5, '#F0D68A'); tg.addColorStop(1, '#B8862E');
    ctx.fillStyle = tg;
    ctx.fillText(name + ' · ' + skill, cx, ty);
    ctx.restore();
  }

  /* ================= 导出 ================= */
  return { init, hit, meal, sell, buyDiesel, sharpen, crew, useMate, blast, quiz, next, restart, close: closeModal, tool: i => { G.tool = i; renderPanels(); } };
})();
