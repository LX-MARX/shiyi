/* 金句海报生成器：语录、模板、Canvas 预览与 PNG 下载 */
(function () {
  'use strict';
  const D = window.DATA, UI = window.ShiyiUI;
  const esc = UI ? UI.esc : String;
  const TPLS = [
    { id: 1, name: '羌红绸', top: '#D94A38', bot: '#96271C', ink: '#FFF8EC', sub: '#FFF0DD', accent: '#F0D68A', band: 'rgba(240,214,138,.85)' },
    { id: 2, name: '鎏金笺', top: '#F7EEDC', bot: '#E2C998', ink: '#2A2419', sub: '#6B5A34', accent: '#C0392B', band: 'rgba(166,124,46,.8)' },
    { id: 3, name: '云海寨', top: '#8FB6D4', bot: '#4A6B8A', ink: '#FFFDF7', sub: '#F3F0E8', accent: '#F0D68A', band: 'rgba(255,253,247,.65)' },
    { id: 4, name: '丹崖路', top: '#E88A4B', bot: '#A84A1F', ink: '#FFF8EC', sub: '#FFF0DD', accent: '#FFE9B8', band: 'rgba(255,233,184,.75)' },
    { id: 5, name: '苔茶园', top: '#7FA98C', bot: '#3A5D47', ink: '#F7F2E8', sub: '#E8EEE4', accent: '#F0D68A', band: 'rgba(240,214,138,.7)' }
  ];
  const P = { quoteId: D.quotes[0].id, tplId: 1, tag: '全部', inited: false };
  function openLayer(el) { if (UI) UI.openLayer(el); else el.classList.add('on'); }
  function closeLayer(el) { if (UI) UI.closeLayer(el); else el.classList.remove('on'); }
  window.openPoster = function () {
    if (!P.inited) { buildDom(); P.inited = true; }
    renderQuoteList(); renderTplRow(); drawPoster(); openLayer(document.getElementById('ftPoster'));
  };
  window.closePoster = function () { closeLayer(document.getElementById('ftPoster')); };
  function buildDom() {
    const tags = ['全部'].concat([...new Set(D.quotes.map(q => q.tag))]);
    document.body.insertAdjacentHTML('beforeend', `
      <section class="ft-overlay" id="ftPoster" role="dialog" aria-modal="true" aria-labelledby="posterTitle">
        <div class="ft-head"><div><div class="ft-head-title" id="posterTitle">金句海报生成器</div><div class="ft-head-sub">选一句石椅金句，生成你的专属海报</div></div>
          <button class="ft-close" onclick="closePoster()" aria-label="关闭海报生成器">✕</button></div>
        <div class="ft-body"><div class="poster-layout"><div>
          <div class="ft-sec-title">第一步 · 选一句金句</div><div class="hud-row" id="posterTagRow" role="group" aria-label="按主题筛选">
            ${tags.map(t => `<button class="res-chip" data-tag="${esc(t)}" onclick="posterTag('${esc(t)}')">${esc(t)}</button>`).join('')}</div>
          <div class="quote-list" id="quoteList"></div><div class="ft-sec-title">第二步 · 选一款模板</div><div class="tpl-row" id="tplRow"></div>
        </div><div class="poster-stage"><div class="ft-sec-title">第三步 · 预览与下载</div>
          <div class="poster-canvas-wrap"><canvas id="posterCanvas" width="750" height="1000" role="img" aria-label="所选金句海报预览">当前浏览器不支持海报预览。</canvas></div>
          <div class="poster-actions"><button class="btn" id="posterDownload" onclick="downloadPoster()">下载 PNG 海报</button><button class="btn btn-ghost" onclick="posterRandom()">换一句</button></div>
          <p class="note" style="margin-top:10px;">竖版 750×1000。手机若未自动下载，可长按预览图保存。</p>
        </div></div></div>
      </section>`);
  }
  window.posterTag = function (tag) { P.tag = tag; const list = D.quotes.filter(q => tag === '全部' || q.tag === tag); if (!list.some(q => q.id === P.quoteId)) P.quoteId = list[0].id; renderQuoteList(); drawPoster(); };
  function renderQuoteList() {
    document.querySelectorAll('#posterTagRow .res-chip').forEach(c => { const on = c.dataset.tag === P.tag; c.classList.toggle('on', on); c.setAttribute('aria-pressed', String(on)); });
    const list = P.tag === '全部' ? D.quotes : D.quotes.filter(q => q.tag === P.tag);
    document.getElementById('quoteList').innerHTML = list.map(q => `<button class="quote-item ${q.id === P.quoteId ? 'on' : ''}" onclick="posterPick(${q.id})" aria-pressed="${q.id === P.quoteId}"><span class="quote-text">${esc(q.text)}</span><span class="quote-meta"><span>${esc(q.who)} · ${esc(q.role)}</span><span class="quote-tag">${esc(q.tag)}</span></span></button>`).join('');
  }
  window.posterPick = function (id) { if (!D.quotes.some(q => q.id === id)) return; P.quoteId = id; renderQuoteList(); drawPoster(); };
  window.posterRandom = function () { const pool = P.tag === '全部' ? D.quotes : D.quotes.filter(q => q.tag === P.tag); let next = P.quoteId; while (pool.length > 1 && next === P.quoteId) next = pool[Math.floor(Math.random() * pool.length)].id; P.quoteId = next; renderQuoteList(); drawPoster(); };
  function renderTplRow() { document.getElementById('tplRow').innerHTML = TPLS.map(t => `<button class="tpl-card tpl-${t.id} ${t.id === P.tplId ? 'on' : ''}" onclick="posterTpl(${t.id})" aria-pressed="${t.id === P.tplId}" aria-label="${t.name}模板"><span class="tpl-preview"><span>石椅</span></span><span class="tpl-name">${t.name}</span></button>`).join(''); }
  window.posterTpl = function (id) { if (!TPLS.some(t => t.id === id)) return; P.tplId = id; renderTplRow(); drawPoster(); };
  function wrapText(ctx, text, maxW) { const lines = []; let line = ''; for (const ch of text) { if (ctx.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch; } else line += ch; } if (line) lines.push(line); return lines; }
  function fitQuote(ctx, text, maxW, maxLines) { for (let size = 60; size >= 30; size -= 2) { ctx.font = `700 ${size}px "PingFang SC","Microsoft YaHei",serif`; const lines = wrapText(ctx, text, maxW); if (lines.length <= maxLines) return { size, lines }; } return { size: 30, lines: wrapText(ctx, text, maxW) }; }
  function drawBand(ctx, x, y, len, size, color, down) { ctx.fillStyle = color; const n = Math.floor(len / (size * 1.4)); for (let i = 0; i < n; i++) { const bx = x + i * size * 1.4; ctx.beginPath(); ctx.moveTo(bx, down ? y : y + size); ctx.lineTo(bx + size * 1.4, down ? y : y + size); ctx.lineTo(bx + size * .7, down ? y + size : y); ctx.closePath(); ctx.fill(); } }
  function drawDiamond(ctx, cx, cy, r, color) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4); ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.strokeRect(-r, -r, r * 2, r * 2); ctx.restore(); }
  function drawPoster() {
    const cv = document.getElementById('posterCanvas'), ctx = cv && cv.getContext('2d'); if (!ctx) return;
    const W = cv.width, H = cv.height, tpl = TPLS.find(t => t.id === P.tplId), quote = D.quotes.find(q => q.id === P.quoteId);
    const g = ctx.createLinearGradient(0, 0, W * .3, H); g.addColorStop(0, tpl.top); g.addColorStop(1, tpl.bot); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = tpl.id === 2 ? 'rgba(122,91,30,.05)' : 'rgba(255,255,255,.05)'; for (let y = 30; y < H; y += 42) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    drawBand(ctx, 56, 54, W - 112, 12, tpl.band, true); drawBand(ctx, 56, H - 66, W - 112, 12, tpl.band, false);
    [[56,60],[W-56,60],[56,H-60],[W-56,H-60]].forEach(p => drawDiamond(ctx,p[0],p[1],10,tpl.band));
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = tpl.accent; ctx.font = '600 26px "Microsoft YaHei",serif'; ctx.fillText('石　椅　金　句', W / 2, 118);
    ctx.strokeStyle = tpl.band; ctx.beginPath(); ctx.moveTo(W/2-150,148); ctx.lineTo(W/2+150,148); ctx.stroke();
    ctx.font = '700 110px "SimSun",serif'; ctx.fillText('「', W/2-210,268); ctx.fillText('」', W/2+210,780);
    const fitted = fitQuote(ctx, quote.text, W - 190, 7); ctx.fillStyle = tpl.ink; ctx.font = `700 ${fitted.size}px "Microsoft YaHei",serif`;
    const lh = fitted.size * 1.75; let ty = H / 2 - fitted.lines.length * lh / 2 + 30; fitted.lines.forEach(line => { ctx.fillText(line, W/2, ty); ty += lh; });
    ctx.fillStyle = tpl.sub; ctx.font = '500 24px "Microsoft YaHei",serif'; ctx.fillText('—— ' + quote.who, W/2, ty+34); ctx.font = '400 19px "Microsoft YaHei",serif'; ctx.fillText(quote.role, W/2, ty+70);
    ctx.strokeStyle = tpl.band; ctx.beginPath(); ctx.moveTo(W/2-190,H-156); ctx.lineTo(W/2+190,H-156); ctx.stroke();
    ctx.fillStyle = tpl.accent; ctx.font = '700 24px "Microsoft YaHei",serif'; ctx.fillText('石椅答卷 · 政绩观好样本',W/2,H-120); ctx.fillStyle = tpl.sub; ctx.font = '400 17px "Microsoft YaHei",serif'; ctx.fillText('为人民出政绩 · 以实干出政绩',W/2,H-90);
  }
  window.downloadPoster = function () {
    const button = document.getElementById('posterDownload'); if (button.disabled) return; button.disabled = true;
    try { const cv = document.getElementById('posterCanvas'), a = document.createElement('a'), quote = D.quotes.find(q => q.id === P.quoteId); a.href = cv.toDataURL('image/png'); a.download = `石椅金句_${quote.who}_${Date.now()}.png`; document.body.appendChild(a); a.click(); a.remove(); if (UI) UI.toast('海报已生成，请在下载记录中查看'); }
    catch (_) { if (UI) UI.toast('海报导出失败，请截图或长按预览图保存'); }
    finally { setTimeout(() => { button.disabled = false; }, 600); }
  };
})();
