/**
 * 文件名：js/game.js
 * 功能描述：凿路游戏《凿通大岩路》网页版——五层视差华丽场景（天空飞鸟日月光晕/羌寨碉楼
 *           远山剪影/流动云雾/鎏金裂纹块状岩壁/前景地物里程牌）、隧道口纵深凿痕暖光马灯、
 *           镐击岩壁崩落 crater 与火花碎石粒子（池上限150）、派工经营系统（召集工人花工钱、
 *           四组义务工各有实际产出、每30秒发工钱、欠薪怠工效率减半）、四位队友高辨识度
 *           立绘华丽登场（专属配色光环/鎏金技能名/口头禅/冷却）、电雷管爆破、五章叙事弹窗。
 * 作者：云上党旗飘项目组
 * 创建日期：2026-10-21
 * 版权声明：本代码为项目原创代码，用于软件著作权登记。
 */
window.ShiyiGame = (function () {
  /* ================= 配置 ================= */
  const CHAPTERS = [
    { name: '第一章 · 关门', short: '勘测', end: 300, hard: 1.2,
      rock: '#94826F', rockDeep: '#4C4238', rockHi: '#C0AE98', rockLine: '#6E6050',
      skyTop: '#74879C', skyBot: '#DED8C8', far1: '#8E9AA6', far2: '#707C88',
      sun: '#F6EFDC', sunX: .72, sunY: .14, fog: 'rgba(232,230,220,',
      img: 'images/game/ch1_survey.jpg', card: '腰系麻绳悬在绝壁上，用 50 米皮尺一寸寸量完全线。' },
    { name: '第二章 · 药引子', short: '筹资', end: 800, hard: 1.0,
      rock: '#A08255', rockDeep: '#584528', rockHi: '#D2B273', rockLine: '#77603A',
      skyTop: '#E8AC4E', skyBot: '#FBE9BE', far1: '#C89F5C', far2: '#A5824C',
      sun: '#FFDF96', sunX: .5, sunY: .2, fog: 'rgba(252,238,200,',
      img: 'images/game/ch2_fund.jpg', card: '邵再贵把 1000 元拍在桌上——约等于两头肥猪的药引子。' },
    { name: '第三章 · 悬崖上的箩筐', short: '破土爆破', end: 1800, hard: 0.6,
      rock: '#6E6258', rockDeep: '#332C26', rockHi: '#9C8E7E', rockLine: '#4C443C',
      skyTop: '#262B34', skyBot: '#5A6270', far1: '#444B56', far2: '#333842',
      sun: '#EAE4CC', sunX: .8, sunY: .12, fog: 'rgba(150,158,170,',
      img: 'images/game/ch3_blast.jpg', card: '陈华全坐箩筐吊上绝壁打孔装药，新麻绳打死结、不用活扣。' },
    { name: '第四章 · 唾沫与年夜饭', short: '阻挠坚守', end: 2600, hard: 0.5,
      rock: '#665C4E', rockDeep: '#322C24', rockHi: '#91826C', rockLine: '#463F34',
      skyTop: '#465064', skyBot: '#848894', far1: '#626A76', far2: '#4C525E',
      sun: '#EED9A8', sunX: .3, sunY: .16, fog: 'rgba(190,192,196,',
      img: 'images/game/ch4_hold.jpg', card: '唾沫吐到脸上，他拿袖子一抹，没抹去笑容。' },
    { name: '第五章 · 长虹', short: '贯通', end: 3000, hard: 1.5,
      rock: '#B2945F', rockDeep: '#715830', rockHi: '#E2C485', rockLine: '#8A6F42',
      skyTop: '#F2C96A', skyBot: '#F0A870', far1: '#DCA868', far2: '#B08050',
      sun: '#FFE9A8', sunX: .55, sunY: .12, fog: 'rgba(254,240,200,',
      img: 'images/game/ch5_done.jpg', card: '2004 年 6 月 3 日，长虹路贯通，车开进了寨门。' },
  ];
  const TOOLS = [
    { id: 0, name: '钢钎', icon: '钎', mult: 1, unlock: 0 },
    { id: 1, name: '八磅锤', icon: '锤', mult: 2, unlock: 1 },
    { id: 2, name: '钻孔机', icon: '钻', mult: 4, unlock: 2, diesel: true },
  ];
  const MATES = [
    { id: 'shao', name: '邵再贵', skill: '督工巡视', desc: '30秒进度+50%', unlock: 0,
      cost: { fund: 10 }, costText: '资金10', cd: 30,
      color: '#E9B94E', quote: '人在，路就在！', title: '红衣举锤 · 领头人' },
    { id: 'he', name: '何国发', skill: '老书记的灯', desc: '体力全恢复', unlock: 1,
      cost: {}, costText: '恩情无耗', cd: 45,
      color: '#F0A44E', quote: '灯不灭，人心不散。', title: '拄灯老者 · 主心骨' },
    { id: 'chen', name: '陈华全', skill: '精准爆破', desc: '免费起爆+20%', unlock: 2,
      cost: { diesel: 5 }, costText: '柴油5', cd: 40,
      color: '#E8743C', quote: '一炮一个准！', title: '背雷管 · 爆破手' },
    { id: 'wang', name: '王庆保', skill: '动员会', desc: '20镐免体力', unlock: 2,
      cost: { fund: 5 }, costText: '资金5', cd: 25,
      color: '#6FA870', quote: '乡亲们，加把劲哟——', title: '拿喇叭 · 宣传员' },
  ];
  const SAFE_QUIZ = [
    { q: '起爆前清点现场，最重要的是确认什么？', options: ['人员全部撤到安全距离', '炸药品牌是否响亮', '天气是否晴朗'], answer: 0 },
    { q: '箩筐吊人上绝壁，邵再贵亲自检查的是什么？', options: ['麻绳是否打死结', '箩筐是否刷红漆', '是否带了干粮'], answer: 0 },
    { q: '发现哑炮（没响的炮），正确处理是？', options: ['设警戒由专业人员处理', '马上凑近查看', '再点一把火'], answer: 0 },
  ];
  const MAX_PARTICLES = 150;   // 粒子池上限
  const H0 = 420;              // 逻辑高度
  const ROSTER_CAP = [5, 7, 9, 11, 12];  // 各章召集上限（第一章5人，之后每章+2，封顶12）
  const HIRE_COST = 8;         // 召集一人工钱
  const WAGE_MS = 30000;       // 工钱周期
  const CREW_FX = {            // 四组职责说明（面板展示）
    dig:  '凿岩组 · 每镐进度 +15%/人',
    wall: '砌坎组 · 爆破推进 +8%/人',
    move: '运输组 · 掉率+5% 卖价+2元/人',
    log:  '后勤组 · 回体加快 背篓饭+2/人',
  };

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
      roster: 2,                       // 在册工人（开局只有2人，需花工钱慢慢召集）
      crews: [
        { key: 'dig',  n: '凿岩', num: 2, cap: 3 },
        { key: 'wall', n: '砌坎', num: 0, cap: 99 },
        { key: 'move', n: '运输', num: 0, cap: 99 },
        { key: 'log',  n: '后勤', num: 0, cap: 99 },
      ],
      vitAcc: 0, wageAcc: 0, slacking: false,
      cds: {},                         // 队友技能冷却截止时间戳
      particles: [], cracks: [], spalls: [], pick: null, floaters: [],
      birds: [{ x: .1, y: .10, sp: .45, ph: 0 }, { x: .5, y: .16, sp: .6, ph: 2 }, { x: .8, y: .07, sp: .5, ph: 4 }],
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
    msg('点岩壁开凿攒碎石换钱；花 8 元召集工人派到四组，每 30 秒按在册人数发工钱。');
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

    // 岩壁基底垂直渐变（上受光、下压暗，更浓郁的明暗跨度）
    const bg = x.createLinearGradient(0, top, 0, H);
    bg.addColorStop(0, shade(c.rock, 16));
    bg.addColorStop(.4, c.rock);
    bg.addColorStop(1, shade(c.rockDeep, -8));
    x.fillStyle = bg; x.fillRect(0, top, W, H - top);

    // 岩层水平理缝（大面积层理）
    x.globalAlpha = .18;
    for (let i = 0; i < 5; i++) {
      const ly = top + (H - top) * (0.14 + i * 0.2) + prand(i + 9) * 12;
      x.fillStyle = i % 2 ? c.rockLine : shade(c.rock, -24);
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
        const lum = Math.floor((prand(seed + 5) - .5) * 34);   // 明暗交替（更浓郁）
        const base = shade(c.rock, lum);

        // 石块主体（微不规则多边形）
        x.beginPath();
        x.moveTo(x0 + 3 + jx, y0 + 3);
        x.lineTo(x0 + w - 3 + jx, y0 + 1 + jy * .4);
        x.lineTo(x0 + w + jx * .6, y0 + h - 3);
        x.lineTo(x0 + 2, y0 + h + jy);
        x.closePath();
        const sg = x.createLinearGradient(x0, y0, x0 + w, y0 + h);
        sg.addColorStop(0, shade(c.rock, lum + 16));
        sg.addColorStop(.55, base);
        sg.addColorStop(1, shade(c.rock, lum - 20));
        x.fillStyle = sg; x.fill();

        // 受光面高光（上缘+左缘）
        x.strokeStyle = rgba(c.rockHi, .8); x.lineWidth = 1.6;
        x.beginPath();
        x.moveTo(x0 + 3 + jx, y0 + 3);
        x.lineTo(x0 + w - 3 + jx, y0 + 1 + jy * .4);
        x.moveTo(x0 + 3 + jx, y0 + 3);
        x.lineTo(x0 + 2, y0 + h + jy);
        x.stroke();

        // 背光面阴影（下缘+右缘）
        x.strokeStyle = rgba(c.rockDeep, .85); x.lineWidth = 1.8;
        x.beginPath();
        x.moveTo(x0 + w + jx * .6, y0 + h - 3);
        x.lineTo(x0 + 2, y0 + h + jy);
        x.moveTo(x0 + w - 3 + jx, y0 + 1 + jy * .4);
        x.lineTo(x0 + w + jx * .6, y0 + h - 3);
        x.stroke();

        // 块内岩层纹理（2-3 条细理）
        x.strokeStyle = rgba(c.rockLine, .42); x.lineWidth = .8;
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
          x.strokeStyle = rgba(c.rockDeep, .68); x.lineWidth = 1;
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

    // 鎏金裂纹勾边（矿脉金线，版画描金质感）
    x.save();
    x.shadowColor = 'rgba(240,208,130,.85)'; x.shadowBlur = 3;
    for (let i = 0; i < 9; i++) {
      const s = i * 31 + G.ch * 7;
      let vx = prand(s) * W, vy = top + prand(s + 1) * (H - top) * .9;
      x.strokeStyle = `rgba(228,192,106,${.26 + prand(s + 2) * .22})`;
      x.lineWidth = 1 + prand(s + 12) * .7;
      x.beginPath(); x.moveTo(vx, vy);
      for (let k = 0; k < 5; k++) {
        vx += (prand(s + 3 + k) - .45) * 36; vy += prand(s + 8 + k) * 15;
        x.lineTo(vx, vy);
      }
      x.stroke();
    }
    x.restore();

    // 版画斜排线（极淡，增强纸版刻痕感）
    x.strokeStyle = 'rgba(30,22,14,.05)'; x.lineWidth = 1;
    for (let i = 0; i < 22; i++) {
      const hy = top + (H - top) * i / 22;
      x.beginPath(); x.moveTo(0, hy + 14); x.lineTo(W, hy - W * .045); x.stroke();
    }

    // 整体光斑与暗角（增强体积感）
    const vg = x.createRadialGradient(W * .3, top + 30, 40, W * .3, top + 30, W * .75);
    vg.addColorStop(0, 'rgba(255,246,224,.16)');
    vg.addColorStop(.6, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.34)');
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

  /* 怠工时工人效率折半 */
  function crewEff() { return G.slacking ? 0.5 : 1; }

  /* ================= 凿岩 ================= */
  function hit(e, mult) {
    if (G.won || !e) return;
    mult = mult === 3 ? 3 : 1;   // 按钮调用不传 mult，默认单镐
    const dig = G.crews[0], move = G.crews[2];
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

    // 凿岩组产出：每镐进度 = 基础 × (1 + 凿岩×15%)，窝工超作业面减半，怠工再减半
    const eff = crewEff();
    const crowdPenalty = dig.num > dig.cap ? 0.5 : 1;
    const digBonus = 1 + dig.num * 0.15 * eff;
    const gain = CHAPTERS[G.ch].hard * tool.mult * mult * G.buffMult * crowdPenalty * digBonus;
    G.mileage = Math.min(3000, G.mileage + gain);
    if (G.freeHits > 0) G.freeHits--; else G.vit = Math.max(0, G.vit - total);

    // 运输组产出：碎石掉落率 +运输×5%（怠工减半）
    const dropRate = Math.min(0.95, 0.5 + move.num * 0.05 * eff);
    if (Math.random() < dropRate) G.stone += Math.random() < 0.3 ? 2 : 1;

    // 镐击动画 + 金色火花 + 碎石抛物线 + 岩壁崩落
    const p = toCanvas(e);
    G.pick = { x: p.x, y: p.y, t: 0, heavy: mult === 3 };
    spawnSparks(p.x, p.y, mult === 3 ? 26 : 12);
    spawnDebris(p.x, p.y, mult === 3 ? 14 : 6);
    spawnChunks(p.x, p.y, mult === 3 ? 6 : 3);
    G.spalls.push({ x: p.x, y: p.y, seed: Math.random() * 999, life: mult === 3 ? 70 : 48, r: mult === 3 ? 15 : 10 });
    if (G.spalls.length > 10) G.spalls.shift();
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
  /* 崩落大块岩石（崩落感更强：更大、更重、翻跟头） */
  function spawnChunks(x, y, n) {
    const c = CHAPTERS[G.ch];
    for (let i = 0; i < n; i++) {
      pushP({
        kind: 'chunk', x: x + (Math.random() - .5) * 10, y: y + (Math.random() - .5) * 8,
        vx: (Math.random() - .5) * 4.5, vy: -Math.random() * 3 - .5,
        rot: Math.random() * 6.28, vr: (Math.random() - .5) * .5,
        size: 5 + Math.random() * 6, life: 55 + Math.random() * 20,
        col: shade(c.rock, Math.floor((Math.random() - .5) * 46)),
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
      <div class="modal-text" style="color:var(--gold-deep);font-size:13px;">下一章召集上限提升至 ${ROSTER_CAP[G.ch + 1]} 人</div>
      <button class="btn" onclick="ShiyiGame.next()">进入下一章</button>`);
  }
  function next() {
    G.ch++; closeModal();
    G.blast = G.ch >= 2 ? 3 : 0;
    G.cracks.length = 0; G.spalls.length = 0;
    buildRockCache();
    renderPanels(); updateHUD();
    msg(`进入${CHAPTERS[G.ch].name}，召集上限 ${ROSTER_CAP[G.ch]} 人`);
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
  /* 背篓饭：基础 +10，后勤每人再 +2 */
  function meal() {
    if (G.won) return;
    const add = 10 + G.crews[3].num * 2;
    G.vit = Math.min(G.vitMax, G.vit + add);
    msg(`吃饱了，+${add} 体力`);
    updateHUD();
  }
  /* 卖碎石：50 块 = 15 + 运输×2 元 */
  function sell() {
    if (G.stone < 50) { msg('碎石还不够 50 块'); return; }
    const price = 15 + G.crews[2].num * 2;
    G.stone -= 50; G.fund += price;
    msg(`碎石卖给水泥厂，+${price} 元`);
    updateHUD();
  }
  function buyDiesel() { if (G.fund < 5) { msg('柴油 5 元，资金不足'); return; } G.fund -= 5; G.diesel += 10; msg('+10 柴油'); renderPanels(); updateHUD(); }
  function sharpen() { if (G.fund < 5) { msg('磨砺要 5 元'); return; } G.fund -= 5; msg('工具磨砺如新'); updateHUD(); }

  /* ================= 派工系统（召集 + 分派 + 工钱） ================= */
  /* 召集：8 元/人，章节上限 5/7/9/11/12 */
  function recruit() {
    if (G.won) return;
    const cap = ROSTER_CAP[G.ch];
    if (G.roster >= cap) { msg(`本章最多召集 ${cap} 人，下一章再加`); return; }
    if (G.fund < HIRE_COST) { msg(`召集一人要 ${HIRE_COST} 元工钱，资金不足`); return; }
    G.fund -= HIRE_COST; G.roster++;
    msg(`又来一名壮劳力！在册 ${G.roster} 人（每 30 秒工钱 ${G.roster} 元）`);
    addFloater('+1 壮劳力', G.W / 2, G.H * .44, '#FFD98A', 20);
    renderPanels(); updateHUD();
  }
  /* 分派：从空闲池调入/调出四组（crew(key, d)，d=±1） */
  function crew(key, d) {
    const c = G.crews.find(x => x.key === key);
    if (!c || G.won) return;
    const assigned = G.crews.reduce((s, x) => s + x.num, 0);
    if (d > 0) {
      if (assigned >= G.roster) { msg(`没有闲着的工人了，先花 ${HIRE_COST} 元召集`); return; }
      c.num++;
      if (key === 'dig' && c.num > c.cap) msg('超过作业面，窝工了！效率减半');
    } else {
      c.num = Math.max(0, c.num - 1);
    }
    renderPanels(); updateHUD();
  }

  /* ================= 队友技能（消耗+冷却+人物华丽登场） ================= */
  function useMate(id) {
    const m = MATES.find(x => x.id === id);
    if (G.ch < m.unlock) { msg(`${m.name}后续章节加入`); return; }
    const now = Date.now();
    const left = Math.ceil(((G.cds[id] || 0) - now) / 1000);
    if (left > 0) { msg(`${m.name}技能冷却中，还需 ${left} 秒`); return; }
    if (m.cost.fund && G.fund < m.cost.fund) { msg(`需资金 ${m.cost.fund} 元`); return; }
    if (m.cost.diesel && G.diesel < m.cost.diesel) { msg(`需柴油 ${m.cost.diesel}`); return; }
    if (m.cost.fund) G.fund -= m.cost.fund;
    if (m.cost.diesel) G.diesel -= m.cost.diesel;
    G.cds[id] = now + m.cd * 1000;
    G.skillFx = { t: 0, dur: 84, id, name: m.name, skill: m.skill, color: m.color, quote: m.quote };
    spawnSparks(G.W / 2, G.H * .4, 16);
    if (id === 'shao') { G.buffMult = 1.5; msg('邵再贵督工：30秒+50%'); setTimeout(() => { if (G.buffMult === 1.5) G.buffMult = 1; }, 30000); }
    else if (id === 'he') { G.vit = G.vitMax; msg('老书记的灯：体力回满'); }
    else if (id === 'chen') { doBlast(true, 1.2); }
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
    if (i === window._quizAns) { closeModal(); doBlast(false, 1); }
    else { showModal(`<div class="modal-title">装药封存</div><div class="modal-text">安全题答错。爆破是专业活，先把规程记牢。</div><button class="btn" onclick="ShiyiGame.close()">继续</button>`); }
  }
  /* 砌坎组产出：爆破推进 = 基础 × (1 + 砌坎×8%) */
  function doBlast(free, boost) {
    if (!free) { if (G.blast <= 0) return; G.blast--; G.fund -= 20; }
    const wallBonus = 1 + G.crews[1].num * 0.08 * crewEff();
    const gain = (15 + Math.random() * 3) * (G.ch >= 2 ? 1.2 : 1) * wallBonus * (boost || 1);
    G.mileage = Math.min(3000, G.mileage + gain);
    const f = faceX(), cy = G.H * .66;
    // 全屏闪光 + 震动 + 粒子爆发
    G.flash = 9; G.shake = 12;
    spawnSparks(f + 10, cy, 40);
    spawnDebris(f + 10, cy, 30);
    spawnChunks(f + 10, cy, 10);
    spawnSmoke(f + 20, cy, 12);
    ringFlash(f + 10, cy);
    G.spalls.push({ x: f + 10, y: cy, seed: Math.random() * 999, life: 90, r: 24 });
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
    if (cr) {
      const cap = ROSTER_CAP[G.ch];
      const assigned = G.crews.reduce((s, x) => s + x.num, 0);
      const idle = G.roster - assigned;
      cr.innerHTML = G.crews.map(c => `
      <div class="crew">
        <div class="note" style="font-weight:700;">${c.n}组${c.key === 'dig' ? '(作业面≤' + c.cap + ')' : ''}</div>
        <div class="note" style="font-size:10.5px;color:var(--gold-deep);line-height:1.3;">${CREW_FX[c.key]}</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px;">
          <button class="crew-btn" onclick="ShiyiGame.crew('${c.key}',-1)">−</button>
          <span class="crew-num" style="color:${c.key === 'dig' && c.num > c.cap ? 'var(--red)' : 'inherit'}">${c.num}</span>
          <button class="crew-btn" onclick="ShiyiGame.crew('${c.key}',1)">＋</button>
        </div>
      </div>`).join('') +
      `<div class="crew" onclick="ShiyiGame.recruit()" style="border-color:rgba(192,57,43,.45);background:linear-gradient(180deg,#FDF3E4,#F9E8CE);">
        <div class="note" style="font-weight:700;color:var(--red);">召集工人</div>
        <div class="note" style="font-size:10.5px;">工钱 ${HIRE_COST} 元/人</div>
        <div class="crew-num">${G.roster}<span style="font-size:13px;color:#8A7A5E;">/${cap}</span></div>
        <div class="note" style="font-size:10.5px;line-height:1.35;">空闲 <b>${idle}</b> 人可分派<br>每30秒工钱 ${G.roster} 元${G.slacking ? '<br><b style="color:var(--red);">怠工中！快攒钱发工钱</b>' : ''}</div>
      </div>`;
    }

    const mr = document.getElementById('mateRow');
    if (mr) {
      const now = Date.now();
      mr.innerHTML = MATES.map(m => {
        const left = Math.ceil(((G.cds[m.id] || 0) - now) / 1000);
        const locked = G.ch < m.unlock;
        return `
      <div class="mate ${locked ? 'locked' : ''}" style="${left > 0 ? 'opacity:.55;' : ''}" onclick="ShiyiGame.useMate('${m.id}')">
        ${mateSVG(m.id, locked)}
        <div class="note" style="font-weight:700;margin-top:2px;">${m.name}</div>
        <div class="note" style="font-size:10px;color:#8A7A5E;">${m.title}</div>
        <div class="note" style="color:var(--red-deep);font-size:12px;font-weight:600;">${m.skill}</div>
        <div class="note" style="color:var(--gold-deep);font-size:11px;">${m.costText} · 冷却${m.cd}s${left > 0 ? ` <b style="color:var(--red);">剩${left}s</b>` : ''}</div>
      </div>`;
      }).join('');
    }
  }

  /* 队友立绘小像（SVG，高辨识度：红衣举锤/拄灯老者/背雷管/拿喇叭） */
  function mateSVG(id, locked) {
    const aura = { shao: '#E9B94E', he: '#F0A44E', chen: '#E8743C', wang: '#6FA870' }[id];
    const skin = '#E0A874';
    const FIG = {
      // 邵再贵：红衣，右手高举八磅锤
      shao: `
        <rect x="21" y="33" width="22" height="30" rx="5" fill="#C0392B"/>
        <rect x="23" y="33" width="18" height="5" rx="2" fill="#F2E3C6"/>
        <rect x="21" y="46" width="22" height="3.4" fill="#7A1F16"/>
        <line x1="25" y1="63" x2="23" y2="70" stroke="#33291C" stroke-width="4" stroke-linecap="round"/>
        <line x1="39" y1="63" x2="41" y2="70" stroke="#33291C" stroke-width="4" stroke-linecap="round"/>
        <line x1="41" y1="38" x2="54" y2="18" stroke="${skin}" stroke-width="5" stroke-linecap="round"/>
        <line x1="54" y1="18" x2="59" y2="7" stroke="#7A5230" stroke-width="3.2"/>
        <rect x="52" y="2" width="13" height="7" rx="2" fill="#4A4A52" transform="rotate(38 58 6)"/>
        <circle cx="32" cy="25" r="8.2" fill="${skin}"/>
        <path d="M24 21 a8.2 8.2 0 0 1 16 0 z" fill="#2E2A24"/>
        <rect x="24" y="20" width="16" height="2.4" fill="#2E2A24"/>`,
      // 何国发：驼背老者拄灯，白须斗笠
      he: `
        <path d="M20 64 q-3 -18 5 -25 q9 -7 15 0 q6 8 4 25 z" fill="#465064"/>
        <path d="M20 64 h24 v3 h-24 z" fill="#384050"/>
        <ellipse cx="32" cy="17" rx="13" ry="4" fill="#B89A5E"/>
        <path d="M22 17 q10 -12 20 0 z" fill="#CBA96A"/>
        <circle cx="32" cy="24" r="7" fill="${skin}"/>
        <path d="M28 29 q4 10 8 0 q-2 7 -4 12 q-2 -5 -4 -12 z" fill="#E8E2D2"/>
        <line x1="47" y1="16" x2="47" y2="66" stroke="#6E5636" stroke-width="3" stroke-linecap="round"/>
        <line x1="47" y1="16" x2="55" y2="16" stroke="#6E5636" stroke-width="2.4"/>
        <circle cx="55" cy="23" r="7" fill="#FFD98A" opacity=".55"/>
        <rect x="52" y="18" width="6.4" height="9.6" rx="2" fill="#C0392B"/>
        <rect x="53.6" y="16.4" width="3.2" height="2" fill="#6E5636"/>`,
      // 陈华全：赭衣，背雷管捆，手持起爆器
      chen: `
        <rect x="13" y="27" width="4.4" height="17" rx="1.6" fill="#B3352B"/>
        <rect x="18.4" y="25" width="4.4" height="19" rx="1.6" fill="#C0392B"/>
        <rect x="23.8" y="27" width="4.4" height="17" rx="1.6" fill="#B3352B"/>
        <path d="M15 27 q-3 -8 3 -13" stroke="#4A3A24" stroke-width="1.4" fill="none"/>
        <rect x="21" y="33" width="22" height="30" rx="5" fill="#8A5A2E"/>
        <path d="M21 40 l22 -5 v5 l-22 5 z" fill="#5C3E1E"/>
        <line x1="25" y1="63" x2="23" y2="70" stroke="#33291C" stroke-width="4" stroke-linecap="round"/>
        <line x1="39" y1="63" x2="41" y2="70" stroke="#33291C" stroke-width="4" stroke-linecap="round"/>
        <line x1="41" y1="40" x2="52" y2="44" stroke="${skin}" stroke-width="5" stroke-linecap="round"/>
        <rect x="50" y="40" width="9" height="7" rx="1.6" fill="#3E4A5C"/>
        <line x1="54.5" y1="40" x2="54.5" y2="34" stroke="#3E4A5C" stroke-width="1.6"/>
        <circle cx="32" cy="25" r="8.2" fill="${skin}"/>
        <path d="M24 21 a8.2 8.2 0 0 1 16 0 z" fill="#2E2A24"/>`,
      // 王庆保：绿衣，高举铁皮喇叭
      wang: `
        <rect x="21" y="33" width="22" height="30" rx="5" fill="#3E6B4F"/>
        <rect x="23" y="33" width="18" height="5" rx="2" fill="#E8E2D2"/>
        <line x1="25" y1="63" x2="23" y2="70" stroke="#33291C" stroke-width="4" stroke-linecap="round"/>
        <line x1="39" y1="63" x2="41" y2="70" stroke="#33291C" stroke-width="4" stroke-linecap="round"/>
        <line x1="41" y1="38" x2="52" y2="24" stroke="${skin}" stroke-width="5" stroke-linecap="round"/>
        <path d="M49 20 l13 -6 l0 17 l-13 -5 z" fill="#F2E9D2"/>
        <rect x="60" y="12" width="3.6" height="20" rx="1.4" fill="#C0392B"/>
        <circle cx="32" cy="25" r="8.2" fill="${skin}"/>
        <path d="M23 22 a9 9 0 0 1 18 0 l0 2.4 l-18 0 z" fill="#2E4A38"/>
        <rect x="21" y="23" width="22" height="2.2" rx="1" fill="#2E4A38"/>`,
    }[id];
    return `<svg width="58" height="68" viewBox="0 0 64 76" style="${locked ? 'filter:grayscale(1);' : ''}">
      <circle cx="32" cy="38" r="29" fill="${aura}" opacity=".24"/>
      <circle cx="32" cy="38" r="29" fill="none" stroke="${aura}" stroke-width="2"/>
      <circle cx="32" cy="38" r="25" fill="none" stroke="${aura}" stroke-width=".8" opacity=".6"/>
      ${FIG}</svg>`;
  }

  /* ================= 资源节拍：体力回复 + 工钱 + 冷却刷新 ================= */
  function tick() {
    if (!G || G.won) return;
    const logN = G.crews[3].num;
    const eff = crewEff();
    // 后勤组产出：体力恢复间隔随后勤人数缩短（1秒→最短0.35秒）
    const interval = Math.max(350, 1000 - logN * 130 * eff);
    G.vitAcc += 1000;
    while (G.vitAcc >= interval && G.vit < G.vitMax) { G.vit++; G.vitAcc -= interval; }
    if (G.vitAcc > interval) G.vitAcc = interval;
    // 工钱：每 30 秒按在册人数扣资金；发不出则怠工（效率减半）
    G.wageAcc += 1000;
    if (G.wageAcc >= WAGE_MS) {
      G.wageAcc = 0;
      const due = G.roster;
      if (due > 0) {
        if (G.fund >= due) {
          G.fund -= due;
          if (G.slacking) { G.slacking = false; msg('工钱补上了，工人们干劲回来了！'); renderPanels(); }
        } else if (!G.slacking) {
          G.slacking = true;
          msg('工钱发不出，工人怠工了！效率减半，快卖碎石发工钱');
          addFloater('怠工！', G.W / 2, G.H * .4, '#D8544A', 22);
          renderPanels();
        }
      }
    }
    // 有冷却中的技能时每秒刷新面板倒计时
    const now = Date.now();
    if (MATES.some(m => (G.cds[m.id] || 0) > now)) renderPanels();
    updateHUD();
  }

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
    const { ctx } = G; const W = G.W, H = G.H;
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

    /* 天空飞鸟（雁阵横过） */
    drawBirds(W, H);

    /* 层2：双层远山剪影（远淡近深，缓慢平移） + 羌寨碉楼 */
    ctx.globalAlpha = .55; ctx.fillStyle = c.far1;
    ridge(W, H * .36, H * .15, .012, G.frame * .04, 31);
    ctx.globalAlpha = 1;
    drawTowers(W, H, c, G.frame * .04);   // 与远山同速，贴在脊线上
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

    /* 隧道口（纵深+凿痕+暖光马灯） */
    drawTunnel(W, H, c);

    /* 镐击点岩壁崩落（ crater 凹坑，缓缓淡出） */
    drawSpalls(c);

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

    /* 层5：前景（地面阴影/工具/植被剪影/红旗/里程牌） */
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

    /* 队友技能华丽登场 */
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

  /* 天空飞鸟：三只简笔雁，翅膀扇动 */
  function drawBirds(W, H) {
    const ctx = G.ctx;
    ctx.strokeStyle = 'rgba(44,38,30,.55)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    for (const b of G.birds) {
      b.x += b.sp / W * 60 / 60;   // 每帧微移
      if (b.x > 1.08) { b.x = -0.08; b.y = 0.05 + Math.random() * 0.16; }
      const bx = b.x * W, by = b.y * H;
      const flap = Math.sin(G.frame * .18 + b.ph) * 3.2;
      ctx.beginPath();
      ctx.moveTo(bx - 6, by);
      ctx.quadraticCurveTo(bx - 2.5, by - 3 - flap, bx, by);
      ctx.quadraticCurveTo(bx + 2.5, by - 3 - flap, bx + 6, by);
      ctx.stroke();
    }
  }

  /* 远山山脊（返回脊线高度供碉楼贴附） */
  function ridgeY(x, baseY, amp, k, t, seed) {
    return baseY - (Math.sin((x + t) * k + seed) * .5 + Math.sin((x + t) * k * 2.7 + seed * 2) * .3 + .5) * amp;
  }
  function ridge(W, baseY, amp, k, t, seed) {
    const ctx = G.ctx;
    ctx.beginPath(); ctx.moveTo(-20, baseY + 40);
    for (let x = -20; x <= W + 20; x += 14) ctx.lineTo(x, ridgeY(x, baseY, amp, k, t, seed));
    ctx.lineTo(W + 20, baseY + 60); ctx.lineTo(-20, baseY + 60);
    ctx.closePath(); ctx.fill();
  }

  /* 羌寨碉楼剪影：贴在远山脊线上（梯形碉楼+小寨屋+窗眼） */
  function drawTowers(W, H, c, t) {
    const ctx = G.ctx;
    const baseY = H * .36, amp = H * .15, k = .012, seed = 31;
    const col = rgba(c.far2, .9);
    const spots = [0.10, 0.30, 0.52, 0.71, 0.88];
    ctx.fillStyle = col;
    for (let i = 0; i < spots.length; i++) {
      const tx = W * spots[i];
      const ty = ridgeY(tx, baseY, amp, k, t, seed) + 3;
      const th = 24 + prand(i * 13 + 5) * 16;      // 碉楼高
      const tw = 9 + prand(i * 7 + 2) * 4;         // 碉楼宽
      // 楼身（微收分梯形）
      ctx.beginPath();
      ctx.moveTo(tx - tw / 2, ty);
      ctx.lineTo(tx - tw / 2 + 1.6, ty - th);
      ctx.lineTo(tx + tw / 2 - 1.6, ty - th);
      ctx.lineTo(tx + tw / 2, ty);
      ctx.closePath(); ctx.fill();
      // 梯形檐顶（四角微耸）
      ctx.beginPath();
      ctx.moveTo(tx - tw / 2 - 2.4, ty - th - .5);
      ctx.lineTo(tx - tw / 2 + 1, ty - th - 5);
      ctx.lineTo(tx + tw / 2 - 1, ty - th - 5);
      ctx.lineTo(tx + tw / 2 + 2.4, ty - th - .5);
      ctx.closePath(); ctx.fill();
      // 窗眼（挖亮）
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = .35;
      for (let wI = 0; wI < 2 + (i % 2); wI++) {
        ctx.fillRect(tx - 1.2, ty - th + 5 + wI * 7, 2.4, 3.4);
      }
      ctx.restore();
      // 旁边小寨屋（坡顶）
      if (i % 2 === 0) {
        const hx = tx + tw + 7, hy = ridgeY(hx, baseY, amp, k, t, seed) + 3;
        ctx.fillRect(hx - 5, hy - 7, 10, 7);
        ctx.beginPath();
        ctx.moveTo(hx - 6.5, hy - 7); ctx.lineTo(hx, hy - 12.5); ctx.lineTo(hx + 6.5, hy - 7);
        ctx.closePath(); ctx.fill();
      }
    }
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

  /* 隧道口：内壁渐变纵深 + 放射凿痕 + 洞口沿石高光 + 暖光马灯 */
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

    // 暖光马灯（沿洞深悬挂，光晕随火苗摇晃）
    const lampXs = tw > 260 ? [tw * .3, tw * .62] : [tw * .42];
    for (let i = 0; i < lampXs.length; i++) {
      const lx = lampXs[i];
      const roofY = yT - 14 + (yT + 8 - (yT - 14)) * (lx / tw);   // 洞顶线性内插
      const ly = roofY + 16 + Math.sin(G.frame * .04 + i * 2) * 1.2;
      // 挂绳
      ctx.strokeStyle = '#2A2118'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(lx, roofY); ctx.lineTo(lx, ly - 6); ctx.stroke();
      // 光晕（火光闪烁）
      const fl = 1 + Math.sin(G.frame * .21 + i * 3.1) * .12 + Math.sin(G.frame * .53 + i) * .06;
      const lg = ctx.createRadialGradient(lx, ly, 1, lx, ly, 30 * fl);
      lg.addColorStop(0, 'rgba(255,196,110,.55)');
      lg.addColorStop(.45, 'rgba(255,168,80,.22)');
      lg.addColorStop(1, 'rgba(255,160,70,0)');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.arc(lx, ly, 30 * fl, 0, 7); ctx.fill();
      // 灯身（玻璃罩+铁架+提环）
      ctx.strokeStyle = '#3A2E1E'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(lx, ly - 7.5, 2.2, Math.PI, 0); ctx.stroke();  // 提环
      ctx.fillStyle = '#F7B95E';
      ctx.beginPath(); ctx.ellipse(lx, ly, 3.4, 4.6, 0, 0, 7); ctx.fill();    // 玻璃罩火
      ctx.fillStyle = '#FFEBB8';
      ctx.beginPath(); ctx.ellipse(lx, ly + .6, 1.5, 2.4, 0, 0, 7); ctx.fill(); // 灯芯亮核
      ctx.strokeStyle = '#4A3A24';
      ctx.beginPath(); ctx.moveTo(lx - 4.4, ly - 4.5); ctx.lineTo(lx + 4.4, ly - 4.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lx - 4.4, ly + 4.5); ctx.lineTo(lx + 4.4, ly + 4.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lx - 4.4, ly - 4.5); ctx.lineTo(lx - 4.4, ly + 4.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lx + 4.4, ly - 4.5); ctx.lineTo(lx + 4.4, ly + 4.5); ctx.stroke();
    }

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

  /* 镐击点崩落凹坑（crater：深色凿臼+金边裂纹+淤积碎石） */
  function drawSpalls(c) {
    const ctx = G.ctx;
    G.spalls = G.spalls.filter(s => {
      s.life--;
      if (s.life <= 0) return false;
      const a = Math.min(1, s.life / 50);
      // 凿臼（不规则深色多边形）
      ctx.fillStyle = rgba(c.rockDeep, .55 * a);
      ctx.beginPath();
      for (let i = 0; i < 7; i++) {
        const ang = (i / 7) * Math.PI * 2;
        const rr = s.r * (0.7 + prand(s.seed + i) * .5);
        const px = s.x + Math.cos(ang) * rr, py = s.y + Math.sin(ang) * rr * .8;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      // 坑内亮金新茬（刚凿开的岩芯反光）
      ctx.fillStyle = `rgba(238,206,132,${.3 * a})`;
      ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r * .45, s.r * .3, 0, 0, 7); ctx.fill();
      // 放射金边细裂
      ctx.strokeStyle = `rgba(228,192,106,${.5 * a})`; ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const ang = prand(s.seed + 40 + i) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + Math.cos(ang) * s.r * 1.7, s.y + Math.sin(ang) * s.r * 1.3);
        ctx.stroke();
      }
      return true;
    });
  }

  /* 前景：地面、工具杂物、边角植被、红旗、里程牌 */
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

      // 里程牌（红旗旁：双柱木牌「已凿 XXX m」）
      const bx = Math.max(10, Math.min(W - 102, fx - 108));
      const by = gy + 2;
      ctx.strokeStyle = '#5A4632'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(bx + 8, by); ctx.lineTo(bx + 8, by - 22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + 76, by); ctx.lineTo(bx + 76, by - 22); ctx.stroke();
      const bd = ctx.createLinearGradient(bx, by - 40, bx, by - 18);
      bd.addColorStop(0, '#8A6A42'); bd.addColorStop(1, '#6E5230');
      ctx.fillStyle = bd;
      ctx.fillRect(bx, by - 40, 84, 20);
      ctx.strokeStyle = '#E8C87E'; ctx.lineWidth = 1.2;
      ctx.strokeRect(bx + 1.5, by - 38.5, 81, 17);
      ctx.font = 'bold 11.5px "STKaiti","KaiTi",serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#F6E3B0';
      ctx.fillText(`已凿 ${Math.round(G.mileage)} m`, bx + 42, by - 26);
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

    // 怠工告示（欠薪时画面提示）
    if (G.slacking) {
      const ctx = G.ctx;
      ctx.font = 'bold 13px "STKaiti","KaiTi",serif'; ctx.textAlign = 'center';
      const a = .6 + Math.sin(G.frame * .12) * .25;
      ctx.fillStyle = `rgba(216,84,74,${a})`;
      ctx.fillText('拖欠工钱，怠工中……', W / 2, H * .47);
    }
  }

  function worker(x, y, phase, type, idle, glow, walk) {
    const ctx = G.ctx;
    const t = G.frame;
    const slack = G.slacking;
    const rate = slack ? .5 : 1;      // 怠工：动作放慢
    const swing = Math.sin(t * .16 * rate + phase);
    const bend = type === 'wall' ? (Math.sin(t * .1 * rate + phase) * .5 + .5) : 0;  // 砌坎弯腰循环
    const dim = idle || slack;
    const skin = dim ? '#A89E8E' : '#D9A86C';
    const cloth = dim ? '#8E877A' : (type === 'dig' ? '#3E4A5C' : type === 'wall' ? '#54462E' : type === 'move' ? '#5C3E3E' : '#3E5240');

    ctx.save();
    ctx.translate(x, y);
    if (slack && !idle) ctx.globalAlpha = .8;
    // 号子齐鸣金光描边
    if (glow && !dim) { ctx.shadowColor = 'rgba(240,214,138,.95)'; ctx.shadowBlur = 12; }

    const bob = type === 'move' ? Math.abs(Math.sin(t * .16 * rate + phase)) * 1.6 : Math.sin(t * .08 * rate + phase) * .6;
    ctx.translate(0, -bob);

    // 双腿（运输组走动交替迈步）
    ctx.strokeStyle = dim ? '#7E776A' : '#33291C'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    if (type === 'move') {
      const step = Math.sin(t * .16 * rate + phase) * 4;
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
      ctx.strokeStyle = dim ? '#8E877A' : '#3A332C'; ctx.lineWidth = 2.6;
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
      ctx.rotate(Math.sin(t * .16 * rate + phase) * .12 + .35);
      ctx.strokeStyle = skin; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(9, -3); ctx.stroke();
    } else {
      // 后勤：间歇举饭盒
      const lift = Math.sin(t * .07 * rate + phase) > .55;
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
    const helmet = dim ? '#B7AF9E' : '#E8B93B';
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
      } else if (p.kind === 'debris' || p.kind === 'chunk') {
        p.x += p.vx; p.y += p.vy; p.vy += p.kind === 'chunk' ? .42 : .34; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, p.life / 30);
        ctx.fillStyle = p.col;
        if (p.kind === 'chunk') {
          // 崩落大块：多边形岩块带棱线
          ctx.beginPath();
          ctx.moveTo(-p.size / 2, -p.size / 3);
          ctx.lineTo(p.size / 2, -p.size / 2);
          ctx.lineTo(p.size / 2.4, p.size / 2);
          ctx.lineTo(-p.size / 2.6, p.size / 2.4);
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1; ctx.stroke();
          ctx.strokeStyle = 'rgba(255,240,200,.35)';
          ctx.beginPath(); ctx.moveTo(-p.size / 2, -p.size / 3); ctx.lineTo(p.size / 2, -p.size / 2); ctx.stroke();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .8);
        }
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

  /* ================= 队友立绘（canvas 大图，高辨识度） ================= */
  function drawMateFigure(ctx, id) {
    const skin = '#E0A874';
    ctx.lineCap = 'round';
    if (id === 'shao') {
      // 邵再贵：红衣举锤（领头人，腰板笔直）
      ctx.strokeStyle = '#33291C'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-8, -26); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(8, -26); ctx.stroke();
      // 红衣躯干
      const bd = ctx.createLinearGradient(0, -64, 0, -22);
      bd.addColorStop(0, '#D8443A'); bd.addColorStop(1, '#8E241C');
      ctx.fillStyle = bd;
      ctx.beginPath();
      ctx.moveTo(-14, -22); ctx.lineTo(-11, -62); ctx.lineTo(11, -62); ctx.lineTo(14, -22);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#F2E3C6'; ctx.fillRect(-11, -62, 22, 6);   // 白领口
      ctx.fillStyle = '#6E1A12'; ctx.fillRect(-14, -38, 28, 4);   // 腰带
      // 左臂垂落
      ctx.strokeStyle = '#B3352B'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(-10, -56); ctx.lineTo(-20, -34); ctx.stroke();
      // 右臂高举 + 八磅锤
      ctx.strokeStyle = skin; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(10, -56); ctx.lineTo(30, -84); ctx.stroke();
      ctx.strokeStyle = '#7A5230'; ctx.lineWidth = 4.6;
      ctx.beginPath(); ctx.moveTo(30, -84); ctx.lineTo(42, -106); ctx.stroke();
      ctx.save();
      ctx.translate(44, -108); ctx.rotate(.66);
      const hg = ctx.createLinearGradient(-12, 0, 12, 0);
      hg.addColorStop(0, '#5C5348'); hg.addColorStop(.5, '#9A9080'); hg.addColorStop(1, '#3E382E');
      ctx.fillStyle = hg; ctx.fillRect(-13, -5.5, 26, 11);
      ctx.restore();
      // 头 + 平头黑发
      ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0, -72, 10, 0, 7); ctx.fill();
      ctx.fillStyle = '#2E2A24';
      ctx.beginPath(); ctx.arc(0, -74, 10.4, Math.PI, 0); ctx.fill();
      ctx.fillRect(-10.4, -75, 20.8, 3);
    } else if (id === 'he') {
      // 何国发：驼背老者拄灯（斗笠白须）
      ctx.strokeStyle = '#2A241C'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-7, -20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(7, -20); ctx.stroke();
      // 深袍（驼背弧线）
      const rd = ctx.createLinearGradient(0, -54, 0, -18);
      rd.addColorStop(0, '#55617A'); rd.addColorStop(1, '#333C4E');
      ctx.fillStyle = rd;
      ctx.beginPath();
      ctx.moveTo(-14, -18);
      ctx.quadraticCurveTo(-16, -44, -2, -52);
      ctx.quadraticCurveTo(12, -56, 14, -40);
      ctx.quadraticCurveTo(15, -28, 13, -18);
      ctx.closePath(); ctx.fill();
      // 头（微低）+ 白须
      ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(2, -56, 8.6, 0, 7); ctx.fill();
      ctx.fillStyle = '#EAE4D4';
      ctx.beginPath();
      ctx.moveTo(-4, -52); ctx.quadraticCurveTo(2, -36, 8, -52);
      ctx.quadraticCurveTo(4, -42, 2, -34); ctx.quadraticCurveTo(0, -42, -4, -52);
      ctx.fill();
      // 斗笠
      ctx.fillStyle = '#CBA96A';
      ctx.beginPath(); ctx.moveTo(-12, -62); ctx.lineTo(2, -74); ctx.lineTo(16, -62); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#A9884E'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-12, -62); ctx.lineTo(16, -62); ctx.stroke();
      // 拄杖 + 马灯
      ctx.strokeStyle = '#6E5636'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(26, -66); ctx.lineTo(26, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(26, -66); ctx.lineTo(38, -66); ctx.stroke();
      const lgl = ctx.createRadialGradient(38, -54, 1, 38, -54, 22);
      lgl.addColorStop(0, 'rgba(255,214,140,.85)'); lgl.addColorStop(1, 'rgba(255,190,100,0)');
      ctx.fillStyle = lgl; ctx.beginPath(); ctx.arc(38, -54, 22, 0, 7); ctx.fill();
      ctx.fillStyle = '#C0392B'; ctx.fillRect(35, -60, 7, 11);
      ctx.fillStyle = '#FFD98A'; ctx.fillRect(36.6, -57.6, 3.4, 6);
    } else if (id === 'chen') {
      // 陈华全：背雷管捆的爆破手
      ctx.strokeStyle = '#33291C'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-8, -24); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(8, -24); ctx.stroke();
      // 背后雷管捆（三根红管+引线）
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i % 2 ? '#C0392B' : '#A82E22';
        ctx.fillRect(-26 + i * 7, -72 - (i % 2) * 4, 6, 34 + (i % 2) * 4);
        ctx.fillStyle = '#7A1F16'; ctx.fillRect(-26 + i * 7, -72 - (i % 2) * 4, 6, 3);
      }
      ctx.strokeStyle = '#4A3A24'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-23, -74); ctx.quadraticCurveTo(-30, -84, -22, -90); ctx.stroke();
      // 赭衣躯干
      const bd = ctx.createLinearGradient(0, -62, 0, -20);
      bd.addColorStop(0, '#9A6A36'); bd.addColorStop(1, '#6E4820');
      ctx.fillStyle = bd;
      ctx.beginPath();
      ctx.moveTo(-14, -20); ctx.lineTo(-11, -60); ctx.lineTo(11, -60); ctx.lineTo(14, -20);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4A3010'; ctx.fillRect(-14, -44, 28, 5);   // 背带
      // 双臂前伸捧起爆器
      ctx.strokeStyle = skin; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(-9, -52); ctx.lineTo(10, -40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(9, -54); ctx.lineTo(24, -46); ctx.stroke();
      ctx.fillStyle = '#3E4A5C'; ctx.fillRect(12, -50, 14, 10);
      ctx.strokeStyle = '#3E4A5C'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(19, -50); ctx.lineTo(19, -58); ctx.stroke();
      // 头
      ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0, -70, 10, 0, 7); ctx.fill();
      ctx.fillStyle = '#2E2A24';
      ctx.beginPath(); ctx.arc(0, -72, 10.4, Math.PI, 0); ctx.fill();
    } else {
      // 王庆保：举喇叭的宣传员
      ctx.strokeStyle = '#33291C'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-8, -26); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(8, -26); ctx.stroke();
      // 绿衣躯干
      const bd = ctx.createLinearGradient(0, -62, 0, -22);
      bd.addColorStop(0, '#4A7A5C'); bd.addColorStop(1, '#2E523C');
      ctx.fillStyle = bd;
      ctx.beginPath();
      ctx.moveTo(-14, -22); ctx.lineTo(-11, -60); ctx.lineTo(11, -60); ctx.lineTo(14, -22);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#E8E2D2'; ctx.fillRect(-11, -60, 22, 5);
      // 左臂叉腰
      ctx.strokeStyle = '#3E6B4F'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(-10, -54); ctx.lineTo(-20, -36); ctx.stroke();
      // 右臂高举铁皮喇叭
      ctx.strokeStyle = skin; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(10, -54); ctx.lineTo(26, -78); ctx.stroke();
      const hg2 = ctx.createLinearGradient(24, -88, 48, -70);
      hg2.addColorStop(0, '#F6EFDC'); hg2.addColorStop(1, '#C9BFA8');
      ctx.fillStyle = hg2;
      ctx.beginPath();
      ctx.moveTo(24, -82); ctx.lineTo(48, -94); ctx.lineTo(48, -66); ctx.lineTo(24, -76);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#C0392B'; ctx.fillRect(46, -95, 4.4, 30);
      // 音波（喇叭出声弧线）
      ctx.strokeStyle = 'rgba(240,214,138,.9)'; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.arc(54, -80, 8 + i * 7, -.9, .9); ctx.stroke();
      }
      // 头 + 干部帽
      ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0, -70, 10, 0, 7); ctx.fill();
      ctx.fillStyle = '#2E4A38';
      ctx.beginPath(); ctx.arc(0, -72, 10.6, Math.PI, 0); ctx.fill();
      ctx.fillRect(-11.6, -73.4, 23.2, 2.8);
    }
  }

  /* ================= 队友技能华丽登场：升起+放大+专属光环+鎏金技能名+口头禅 ================= */
  function drawSkillFx(W, H) {
    const ctx = G.ctx;
    const { t, dur, id, name, skill, color, quote } = G.skillFx;
    const k = t / dur;                       // 0→1
    const rise = Math.min(1, t / 20);        // 升起
    const ease = 1 - Math.pow(1 - rise, 3);  // easeOutCubic
    const fade = k > .78 ? 1 - (k - .78) / .22 : 1;
    const cx = W / 2, baseY = H + 40;
    const cy = baseY - ease * (H * .56);
    const scale = .75 + ease * .9;
    const fc = rgba(color, 1);

    ctx.save();
    ctx.globalAlpha = fade;

    // 专属配色光环三层扩散
    for (let i = 0; i < 3; i++) {
      const rr = 30 + k * (100 + i * 52) + i * 18;
      const a = Math.max(0, (1 - k) * .75 - i * .16);
      ctx.strokeStyle = rgba(color, a);
      ctx.lineWidth = 4 - i * 1;
      ctx.beginPath(); ctx.arc(cx, cy - 46 * scale, rr, 0, 7); ctx.stroke();
    }
    // 旋转光射线（华丽背光）
    ctx.save();
    ctx.translate(cx, cy - 46 * scale);
    ctx.rotate(t * .02);
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      const rg = ctx.createLinearGradient(0, 0, 0, -120 * scale);
      rg.addColorStop(0, rgba(color, .30 * fade)); rg.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.moveTo(-6 * scale, 0); ctx.lineTo(6 * scale, 0); ctx.lineTo(2 * scale, -118 * scale); ctx.lineTo(-2 * scale, -118 * scale);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // 背光圆盘
    const bg = ctx.createRadialGradient(cx, cy - 46 * scale, 4, cx, cy - 46 * scale, 74 * scale);
    bg.addColorStop(0, rgba(color, .55));
    bg.addColorStop(.6, rgba(color, .18));
    bg.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(cx, cy - 46 * scale, 74 * scale, 0, 7); ctx.fill();

    // 人物立绘（专属造型）
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(scale, scale);
    ctx.shadowColor = rgba(color, .95); ctx.shadowBlur = 26;
    drawMateFigure(ctx, id);
    ctx.restore();

    // 鎏金技能名（浮现+微上飘）
    const ty = cy + 30 - k * 8;
    ctx.font = 'bold 25px "STKaiti","KaiTi",serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = rgba(color, .8); ctx.shadowBlur = 12;
    ctx.strokeStyle = `rgba(60,40,16,${fade * .85})`; ctx.lineWidth = 4.5;
    ctx.strokeText(name + ' · ' + skill, cx, ty);
    const tg = ctx.createLinearGradient(cx, ty - 23, cx, ty + 6);
    tg.addColorStop(0, '#FFF6DC'); tg.addColorStop(.5, '#F0D68A'); tg.addColorStop(1, '#B8862E');
    ctx.fillStyle = tg;
    ctx.fillText(name + ' · ' + skill, cx, ty);
    ctx.shadowBlur = 0;

    // 口头禅（延迟浮现的气泡念白）
    if (t > 14) {
      const qa = Math.min(1, (t - 14) / 10) * fade;
      const qy = ty + 30;
      ctx.font = 'bold 15px "STKaiti","KaiTi",serif';
      const tw2 = ctx.measureText ? ctx.measureText(quote).width : quote.length * 15;
      ctx.fillStyle = `rgba(255,250,236,${qa * .92})`;
      roundRect(ctx, cx - tw2 / 2 - 14, qy - 18, tw2 + 28, 26, 13);
      ctx.fill();
      ctx.strokeStyle = rgba(color, qa * .9); ctx.lineWidth = 1.6;
      roundRect(ctx, cx - tw2 / 2 - 14, qy - 18, tw2 + 28, 26, 13);
      ctx.stroke();
      // 气泡小尾巴
      ctx.fillStyle = `rgba(255,250,236,${qa * .92})`;
      ctx.beginPath(); ctx.moveTo(cx - 6, qy + 7); ctx.lineTo(cx + 6, qy + 7); ctx.lineTo(cx, qy + 15); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(122,82,32,${qa})`;
      ctx.fillText(quote, cx, qy);
    }
    ctx.restore();
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ================= 导出 ================= */
  return { init, hit, meal, sell, buyDiesel, sharpen, crew, recruit, useMate, blast, quiz, next, restart, close: closeModal, tool: i => { G.tool = i; renderPanels(); } };
})();
