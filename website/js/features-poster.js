/* ============================================================
   文件名：js/features-poster.js
   功能描述：金句海报生成器——选语录、选模板（5 款纯 CSS 渐变
            华丽模板），Canvas 绘制 750×1000 竖版海报（渐变底、
            羌纹角饰、语录大字自适应换行、落款、底部品牌），
            支持一键下载 PNG。
   作者：云上党旗飘项目组
   创建日期：2026-10-21
   版权声明：本代码为项目原创代码，用于软件著作权登记。
   ============================================================ */
(function () {
  const D = window.DATA;

  /* ---------- 五款模板（与 css/features.css 预览渐变一致） ---------- */
  const TPLS = [
    { id: 1, name: '羌红绸', top: '#D94A38', bot: '#96271C', ink: '#FFF8EC', sub: 'rgba(255,248,236,.88)', accent: '#F0D68A', band: 'rgba(240,214,138,.85)', sealBg: 'rgba(0,0,0,.18)' },
    { id: 2, name: '鎏金笺', top: '#F7EEDC', bot: '#E2C998', ink: '#2A2419', sub: '#6B5A34', accent: '#C0392B', band: 'rgba(166,124,46,.8)', sealBg: 'rgba(255,255,255,.4)' },
    { id: 3, name: '云海寨', top: '#8FB6D4', bot: '#4A6B8A', ink: '#FFFDF7', sub: 'rgba(255,253,247,.88)', accent: '#F0D68A', band: 'rgba(255,253,247,.65)', sealBg: 'rgba(0,0,0,.14)' },
    { id: 4, name: '丹崖路', top: '#E88A4B', bot: '#A84A1F', ink: '#FFF8EC', sub: 'rgba(255,248,236,.88)', accent: '#FFE9B8', band: 'rgba(255,233,184,.75)', sealBg: 'rgba(0,0,0,.14)' },
    { id: 5, name: '苔茶园', top: '#7FA98C', bot: '#3A5D47', ink: '#F7F2E8', sub: 'rgba(247,242,232,.88)', accent: '#F0D68A', band: 'rgba(240,214,138,.7)', sealBg: 'rgba(0,0,0,.14)' },
  ];

  /* ---------- 模块状态 ---------- */
  const P = { quoteId: D.quotes[0].id, tplId: 1, tag: '全部', inited: false };

  /* ---------- 打开 / 关闭 ---------- */
  window.openPoster = function () {
    if (!P.inited) { buildDom(); P.inited = true; }
    renderQuoteList(); renderTplRow(); drawPoster();
    document.getElementById('ftPoster').classList.add('on');
    document.body.style.overflow = 'hidden';
  };
  window.closePoster = function () {
    document.getElementById('ftPoster').classList.remove('on');
    document.body.style.overflow = '';
  };

  /* ---------- 注入弹层 DOM（仅一次） ---------- */
  function buildDom() {
    const tags = ['全部'].concat([...new Set(D.quotes.map(q => q.tag))]);
    document.body.insertAdjacentHTML('beforeend', `
      <div class="ft-overlay" id="ftPoster">
        <div class="ft-head">
          <div>
            <div class="ft-head-title">金句海报生成器</div>
            <div class="ft-head-sub">选一句石椅金句，生成你的专属海报</div>
          </div>
          <button class="ft-close" onclick="closePoster()" aria-label="关闭">✕</button>
        </div>
        <div class="ft-body">
          <div class="poster-layout">
            <div>
              <div class="ft-sec-title">第一步 · 选一句金句</div>
              <div class="hud-row" id="posterTagRow" style="margin-bottom:12px;">
                ${tags.map(t => `<span class="res-chip" data-tag="${t}" onclick="posterTag('${t}')" style="cursor:pointer;">${t}</span>`).join('')}
              </div>
              <div class="quote-list" id="quoteList"></div>
              <div class="ft-sec-title">第二步 · 选一款模板</div>
              <div class="tpl-row" id="tplRow"></div>
            </div>
            <div class="poster-stage">
              <div class="ft-sec-title">第三步 · 预览与下载</div>
              <div class="poster-canvas-wrap"><canvas id="posterCanvas" width="750" height="1000"></canvas></div>
              <div class="poster-actions">
                <button class="btn" onclick="downloadPoster()">下载 PNG 海报</button>
                <button class="btn btn-ghost" onclick="posterRandom()">换一句</button>
              </div>
              <p class="note" style="margin-top:10px;">竖版 750×1000，适合手机壁纸与朋友圈分享。</p>
            </div>
          </div>
        </div>
      </div>`);
  }

  /* ---------- 语录列表 ---------- */
  window.posterTag = function (t) { P.tag = t; renderQuoteList(); };
  function renderQuoteList() {
    document.querySelectorAll('#posterTagRow .res-chip').forEach(c => {
      const on = c.dataset.tag === P.tag;
      c.style.background = on ? 'var(--red)' : '';
      c.style.color = on ? '#FFF' : '';
      c.style.borderColor = on ? 'var(--red)' : '';
    });
    const list = P.tag === '全部' ? D.quotes : D.quotes.filter(q => q.tag === P.tag);
    document.getElementById('quoteList').innerHTML = list.map(q => `
      <div class="quote-item ${q.id === P.quoteId ? 'on' : ''}" onclick="posterPick(${q.id})">
        <div class="quote-text">${q.text}</div>
        <div class="quote-meta"><span>${q.who} · ${q.role}</span><span class="quote-tag">${q.tag}</span></div>
      </div>`).join('');
  }
  window.posterPick = function (id) { P.quoteId = id; renderQuoteList(); drawPoster(); };
  window.posterRandom = function () {
    const pool = P.tag === '全部' ? D.quotes : D.quotes.filter(q => q.tag === P.tag);
    let next = P.quoteId;
    while (pool.length > 1 && next === P.quoteId) next = pool[Math.floor(Math.random() * pool.length)].id;
    P.quoteId = next; renderQuoteList(); drawPoster();
  };

  /* ---------- 模板选择 ---------- */
  function renderTplRow() {
    document.getElementById('tplRow').innerHTML = TPLS.map(t => `
      <div class="tpl-card tpl-${t.id} ${t.id === P.tplId ? 'on' : ''}" onclick="posterTpl(${t.id})">
        <div class="tpl-preview"><span>石椅</span></div>
        <div class="tpl-name">${t.name}</div>
      </div>`).join('');
  }
  window.posterTpl = function (id) { P.tplId = id; renderTplRow(); drawPoster(); };

  /* ---------- Canvas 绘制 ---------- */
  // 逐字换行
  function wrapText(ctx, text, maxW) {
    const lines = []; let line = '';
    for (const ch of text) {
      if (ctx.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch; }
      else line += ch;
    }
    if (line) lines.push(line);
    return lines;
  }
  // 字号自适应：从大到小试，直到行数可容纳
  function fitQuote(ctx, text, maxW, maxLines) {
    for (let size = 60; size >= 34; size -= 2) {
      ctx.font = `700 ${size}px "PingFang SC","Microsoft YaHei","Source Han Serif SC",serif`;
      const lines = wrapText(ctx, text, maxW);
      if (lines.length <= maxLines) return { size, lines };
    }
    ctx.font = `700 32px "PingFang SC","Microsoft YaHei",serif`;
    return { size: 32, lines: wrapText(ctx, text, maxW) };
  }
  // 羌纹锯齿带（连续三角纹，horizontal=true 横向排列）
  function drawBand(ctx, x, y, len, size, color, horizontal, pointDown) {
    ctx.fillStyle = color;
    const n = Math.floor(len / (size * 1.4));
    for (let i = 0; i < n; i++) {
      const bx = horizontal ? x + i * size * 1.4 : x;
      const by = horizontal ? y : y + i * size * 1.4;
      ctx.beginPath();
      if (horizontal) {
        if (pointDown) { ctx.moveTo(bx, y); ctx.lineTo(bx + size * 1.4, y); ctx.lineTo(bx + size * .7, y + size); }
        else { ctx.moveTo(bx, y + size); ctx.lineTo(bx + size * 1.4, y + size); ctx.lineTo(bx + size * .7, y); }
      } else {
        ctx.moveTo(x, by); ctx.lineTo(x, by + size * 1.4); ctx.lineTo(x + size, by + size * .7);
      }
      ctx.closePath(); ctx.fill();
    }
  }
  // 羌绣菱形饰
  function drawDiamond(ctx, cx, cy, r, color) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.strokeRect(-r, -r, r * 2, r * 2);
    ctx.lineWidth = 1.5; ctx.strokeRect(-r * .55, -r * .55, r * 1.1, r * 1.1);
    ctx.restore();
  }

  function drawPoster() {
    const cv = document.getElementById('posterCanvas');
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const tpl = TPLS.find(t => t.id === P.tplId);
    const quote = D.quotes.find(q => q.id === P.quoteId);

    // 1. 渐变底
    const g = ctx.createLinearGradient(0, 0, W * .3, H);
    g.addColorStop(0, tpl.top); g.addColorStop(1, tpl.bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // 2. 细腻纸纹（低透明横线）
    ctx.strokeStyle = tpl.id === 2 ? 'rgba(122,91,30,.05)' : 'rgba(255,255,255,.05)';
    ctx.lineWidth = 1;
    for (let y = 30; y < H; y += 42) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // 3. 羌纹角饰：上下锯齿带 + 四角菱形
    drawBand(ctx, 56, 54, W - 112, 12, tpl.band, true, true);   // 顶带（三角朝下）
    drawBand(ctx, 56, H - 66, W - 112, 12, tpl.band, true, false); // 底带（三角朝上）
    drawDiamond(ctx, 56, 60, 10, tpl.band);
    drawDiamond(ctx, W - 56, 60, 10, tpl.band);
    drawDiamond(ctx, 56, H - 60, 10, tpl.band);
    drawDiamond(ctx, W - 56, H - 60, 10, tpl.band);

    // 4. 顶部栏题：石椅金句
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = tpl.accent;
    ctx.font = '600 26px "PingFang SC","Microsoft YaHei",serif';
    ctx.fillText('石　椅　金　句', W / 2, 118);
    ctx.strokeStyle = tpl.band; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(W / 2 - 150, 148); ctx.lineTo(W / 2 + 150, 148); ctx.stroke();

    // 5. 大引号
    ctx.fillStyle = tpl.accent;
    ctx.font = '700 110px "Source Han Serif SC","SimSun",serif';
    ctx.fillText('「', W / 2 - 210, 268);
    ctx.fillText('」', W / 2 + 210, 780);

    // 6. 语录正文（自适应换行，居中）
    const { size, lines } = fitQuote(ctx, quote.text, W - 190, 7);
    ctx.fillStyle = tpl.ink;
    ctx.font = `700 ${size}px "PingFang SC","Microsoft YaHei","Source Han Serif SC",serif`;
    const lh = size * 1.75;
    const blockH = lines.length * lh;
    let ty = H / 2 - blockH / 2 + 30;
    lines.forEach(line => { ctx.fillText(line, W / 2, ty); ty += lh; });

    // 7. 落款
    ctx.fillStyle = tpl.sub;
    ctx.font = '500 24px "PingFang SC","Microsoft YaHei",serif';
    ctx.fillText('—— ' + quote.who, W / 2, ty + 34);
    ctx.font = '400 19px "PingFang SC","Microsoft YaHei",serif';
    ctx.fillText(quote.role, W / 2, ty + 70);

    // 8. 底部品牌
    ctx.strokeStyle = tpl.band; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(W / 2 - 190, H - 156); ctx.lineTo(W / 2 + 190, H - 156); ctx.stroke();
    ctx.fillStyle = tpl.accent;
    ctx.font = '700 24px "PingFang SC","Microsoft YaHei",serif';
    ctx.fillText('石椅答卷 · 政绩观好样本', W / 2, H - 120);
    ctx.fillStyle = tpl.sub;
    ctx.font = '400 17px "PingFang SC","Microsoft YaHei",serif';
    ctx.fillText('为人民出政绩 · 以实干出政绩', W / 2, H - 90);
  }

  /* ---------- 下载 PNG ---------- */
  window.downloadPoster = function () {
    const cv = document.getElementById('posterCanvas');
    const a = document.createElement('a');
    const quote = D.quotes.find(q => q.id === P.quoteId);
    a.href = cv.toDataURL('image/png');
    a.download = `石椅金句_${quote.who}_${Date.now()}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  };
})();
