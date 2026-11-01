/* 情境测评：24 题、五维倾向、史实回顾与可恢复进度 */
(function () {
  'use strict';
  const D = window.DATA, UI = window.ShiyiUI, esc = UI ? UI.esc : String;
  const DIMS = { min: { name: '初心', full: '初心精神 · 为民造福' }, gong: { name: '攻坚', full: '攻坚精神 · 自力更生' }, jie: { name: '接力', full: '接力精神 · 久久为功' }, tuo: { name: '开拓', full: '开拓精神 · 敢破敢立' }, shou: { name: '和美', full: '和美精神 · 守正共生' } };
  const DIM_KEYS = Object.keys(DIMS);
  /* 选择质量与风格倾向分离：合理替代方案同样得分，失责、逐利和敷衍不得匹配书记。 */
  const QUALITY = [
    [100,20],[100,35],[100,20,85],[90,40],[95,30],[95,35],
    [95,75],[90,40],[85,90,65],[100,15],[95,35],[100,30],
    [95,35],[85,90,35],[85,55],[90,35],[95,40],[80,90,45],
    [100,0],[100,10],[100,0],[85,35],[100,25],[95,15]
  ];
  const MATCH_SCORE = 60;
  let Q = null, viewOwner = null, inited = false, advanceTimer = 0, resultTimer = 0;
  function currentOwner() { const me = window.ShiyiAuth && ShiyiAuth.current(); return me ? me.uid : 'guest'; }
  function key(kind, ownerId) { return 'shiyi_quiz_' + kind + '_' + (ownerId || currentOwner()); }
  function load(kind) { return UI ? UI.safeJSON(key(kind), null) : JSON.parse(localStorage.getItem(key(kind)) || 'null'); }
  function save(kind, value, ownerId) {
    const id = ownerId || (value && value.owner) || currentOwner();
    if (UI) UI.safeStore(key(kind, id), value); else localStorage.setItem(key(kind, id), JSON.stringify(value));
  }
  function clearTimers() { clearTimeout(advanceTimer); clearTimeout(resultTimer); advanceTimer = resultTimer = 0; }
  function normalizeProgress(raw) {
    if (!raw || !Number.isInteger(raw.idx) || !Array.isArray(raw.answers)) return null;
    const answers = [];
    for (const answer of raw.answers) {
      const question = D.quiz[answers.length];
      if (!question || !answer || answer.qid !== question.id || !question.options[answer.opt]) break;
      answers.push({ qid: question.id, opt: answer.opt, dim: question.options[answer.opt].dim });
    }
    if (answers.length >= D.quiz.length) return null;
    return { owner: currentOwner(), idx: answers.length, answers, dims: calcDims(answers) };
  }
  function optionQuality(answer) {
    const q = D.quiz.find(item => item.id === (answer && answer.qid));
    return q && QUALITY[q.id - 1] ? QUALITY[q.id - 1][answer.opt] || 0 : 0;
  }
  function calcScore(answers) {
    if (!answers || !answers.length) return 0;
    return Math.round(answers.reduce((sum, answer) => sum + optionQuality(answer), 0) / answers.length);
  }
  function calcDims(answers) {
    const dims = Object.fromEntries(DIM_KEYS.map(k => [k, 0]));
    answers.forEach(a => { if (optionQuality(a) >= 60 && dims[a.dim] !== undefined) dims[a.dim]++; });
    return dims;
  }
  function openLayer(el) { if (UI) UI.openLayer(el); else el.classList.add('on'); }
  function closeLayer(el) { if (UI) UI.closeLayer(el); else el.classList.remove('on'); }
  window.openQuiz = function () { if (!inited) { buildDom(); inited = true; } clearTimers(); showIntro(); openLayer(document.getElementById('ftQuiz')); };
  window.closeQuiz = function () { clearTimers(); if (Q && Q.answers.length && Q.answers.length < D.quiz.length) save('progress', Q, Q.owner); closeLayer(document.getElementById('ftQuiz')); };
  function buildDom() { document.body.insertAdjacentHTML('beforeend', `<section class="ft-overlay" id="ftQuiz" role="dialog" aria-modal="true" aria-labelledby="quizTitle"><div class="ft-head"><div><div class="ft-head-title" id="quizTitle">情境测评</div><div class="ft-head-sub">24 道石椅真实抉择，测测你的政绩观底色</div></div><button class="ft-close" onclick="closeQuiz()" aria-label="关闭测评">✕</button></div><div class="ft-body" id="quizBody"></div></section>`); }
  function showIntro() {
    clearTimers(); Q = null; viewOwner = currentOwner();
    const me = window.ShiyiAuth && ShiyiAuth.current();
    const last = me && me.quiz ? me.quiz : load('result'), progress = normalizeProgress(load('progress'));
    document.getElementById('quizBody').innerHTML = `<div class="quiz-intro"><h2>如果你是石椅村支书</h2><p>24 个抉择瞬间，全部取自石椅村六十四年真实村史。<br>情境可以有多种合理选择，但失责、逐利与敷衍会降低政绩观契合度。<br>答题时不提前揭晓评价，完成后统一评分与回顾。</p>
      ${progress && progress.answers.length ? `<button class="btn btn-gold" onclick="resumeQuiz()">继续上次 · 已完成 ${progress.answers.length} 题</button> ` : ''}<button class="btn" onclick="startQuiz()">${progress ? '重新开始' : '开始作答（24 题）'}</button>
      ${last ? `<p class="note" style="margin-top:16px;">上次测评：契合度 ${Number(last.score) || 0} 分${last.leaderId ? ' · 匹配「' + esc(last.leaderName || '石椅书记') + '」' : ' · 暂不匹配书记'} · 可重新作答刷新结果</p>` : ''}</div>`;
  }
  window.startQuiz = function () { clearTimers(); Q = { owner: currentOwner(), idx: 0, answers: [], dims: Object.fromEntries(DIM_KEYS.map(k => [k, 0])) }; save('progress', Q); renderQuestion(); };
  window.resumeQuiz = function () { Q = normalizeProgress(load('progress')); if (!Q) { window.startQuiz(); return; } renderQuestion(); };
  function renderQuestion() {
    if (!Q) return;
    const q = D.quiz[Q.idx], previous = Q.answers[Q.idx];
    document.getElementById('quizBody').innerHTML = `<div class="quiz-topbar"><span class="quiz-prog-num">第 ${Q.idx+1} / ${D.quiz.length} 题</span><div class="quiz-prog-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${D.quiz.length}" aria-valuenow="${Q.idx}"><i style="width:${Q.idx/D.quiz.length*100}%"></i></div></div>
      <div class="quiz-card"><div class="quiz-scene-label">情境 ${q.id}${q.reverse ? ' · 村民视角' : ''}</div><div class="quiz-scene" id="quizScene" tabindex="-1">${esc(q.scene)}</div><div class="quiz-opts">${q.options.map((o,i) => `<button class="quiz-opt ${previous && previous.opt === i ? 'picked' : ''}" onclick="pickOpt(${i},this)">${esc(o.text)}</button>`).join('')}</div>
      <div class="quiz-nav"><button class="btn btn-ghost" onclick="prevQuestion()" ${Q.idx === 0 ? 'disabled' : ''}>上一题</button><button class="text-btn" onclick="closeQuiz()">保存并稍后继续</button></div></div>`;
    const body = document.getElementById('quizBody'); requestAnimationFrame(() => { const bar = body.querySelector('.quiz-prog-bar i'); if (bar && Q) bar.style.width = (Q.idx+1)/D.quiz.length*100+'%'; const scene = document.getElementById('quizScene'); if (scene) scene.focus({preventScroll:true}); });
  }
  window.pickOpt = function (i, el) {
    if (!Q || advanceTimer || !D.quiz[Q.idx] || !D.quiz[Q.idx].options[i]) return;
    const q = D.quiz[Q.idx]; el.parentElement.querySelectorAll('.quiz-opt').forEach(b => { b.disabled = true; b.classList.toggle('picked', b === el); });
    Q.answers[Q.idx] = { qid: q.id, opt: i, dim: q.options[i].dim }; Q.dims = calcDims(Q.answers); save('progress', Q);
    advanceTimer = setTimeout(() => { advanceTimer = 0; if (!Q || !document.getElementById('ftQuiz').classList.contains('on')) return; if (Q.idx+1 < D.quiz.length) { Q.idx++; save('progress',Q); renderQuestion(); } else showResult(); }, UI && UI.reduced ? 100 : 450);
  };
  window.prevQuestion = function () { if (!Q || Q.idx === 0) return; clearTimers(); Q.idx = Math.max(0,Q.idx-1); Q.answers.length = Q.idx; Q.dims = calcDims(Q.answers); save('progress',Q); renderQuestion(); };
  function norm(v) { const s = v.reduce((a,b)=>a+b,0)||1; return v.map(x=>x/s); }
  function matchLeader() { const user = norm(DIM_KEYS.map(k=>Q.dims[k])); let best=D.leaders[0], dist=Infinity; D.leaders.forEach(l => { const lv=norm(DIM_KEYS.map(k=>(l.dims&&l.dims[k])||0)); const d=Math.sqrt(lv.reduce((s,x,i)=>s+(x-user[i])**2,0)); if(d<dist){dist=d;best=l;} }); return best; }
  function showResult() {
    if (!Q) return;
    clearTimers();
    const score = calcScore(Q.answers), matched = score >= MATCH_SCORE;
    const leader = matched ? matchLeader() : null;
    const maxDim = Math.max(1, ...DIM_KEYS.map(k => Q.dims[k]));
    const dimTotal = DIM_KEYS.reduce((sum, k) => sum + Q.dims[k], 0);
    const topKey = dimTotal ? DIM_KEYS.reduce((a, b) => Q.dims[a] >= Q.dims[b] ? a : b) : null;
    const grade = score >= 85 ? '好样子答卷' : score >= 70 ? '为民底色鲜明' : score >= MATCH_SCORE ? '政绩观基本契合' : score >= 40 ? '政绩观仍需校准' : '需要重新作答';
    const advice = score >= 85 ? '你在多数情境中把群众利益、长期发展与纪律责任放在了前面。' : score >= MATCH_SCORE ? '你已具备基本的为民与实干意识，仍可回顾低分选择，减少急功近利和消极等待。' : '本次结果暂不匹配任何书记。请重点回顾标为「需要改进」的选择：群众利益不能让位于私利，安全、生态与纪律红线不能突破，合理试点与依法申报同样值得肯定。';
    const result = { dims: Q.dims, score, grade, leaderId: leader ? leader.id : null, leaderName: leader ? leader.name : null, ts: Date.now() };
    const resultOwner = Q.owner;
    save('result', result, resultOwner); save('progress', null, resultOwner);
    const me = window.ShiyiAuth && ShiyiAuth.current();
    if (me && me.uid === resultOwner) ShiyiAuth.saveFields({ quiz: result });
    if (window.ShiyiProfileRefresh) ShiyiProfileRefresh();
    const leaderBlock = leader ? `<div class="rh-k">你的治理风格 · 最接近这位书记</div><div class="rh-name">${esc(leader.name)}</div><div class="rh-role">${esc(leader.order)}党支部书记 · ${esc(leader.period)} · 「${esc(leader.keyword)}」</div><div class="rh-word">${esc(leader.title)}。你的有效选择里「${DIMS[topKey].full}」最为鲜明。</div>` : `<div class="rh-k">本次不生成书记匹配</div><div class="rh-name">${esc(grade)}</div><div class="rh-word">低契合度不是另一种“风格”。先校准价值排序，再来认识七任书记的接力答卷。</div>`;
    document.getElementById('quizBody').innerHTML = `<section class="quiz-score-panel ${matched ? 'matched' : 'needs-work'}"><div class="quiz-score-ring"><b>${score}</b><small>契合度 / 100</small></div><div><span class="quiz-grade">${esc(grade)}</span><p>${esc(advice)}</p></div></section>
      <div class="quiz-result-head">${leaderBlock}</div>
      <div class="ft-sec-title">五维倾向 <small class="score-explain">仅统计合理选择，不是答得越多就越高</small></div><div class="card"><div class="dim-list">${DIM_KEYS.map(k => `<div class="dim-row"><div class="dim-name">${DIMS[k].name}<small>${DIMS[k].full.split(' · ')[1]}</small></div><div class="dim-bar"><i style="width:0%" data-w="${Q.dims[k] / maxDim * 100}"></i></div><div class="dim-val">${Q.dims[k]}</div></div>`).join('')}</div>${!dimTotal ? '<p class="note dim-empty">当前没有足够合理的选择用于判断治理风格。</p>' : ''}</div>
      <div class="quiz-actions"><button class="btn" onclick="startQuiz()">重新作答</button>${leader ? '<button class="btn btn-gold" onclick="closeQuiz();openPoster();">把金句做成海报</button>' : ''}<button class="btn btn-ghost" onclick="closeQuiz()">回到广场</button></div>
      <div class="ft-sec-title">24 题回顾 · 选择质量与史实</div><div>${D.quiz.map((q, i) => { const my = Q.answers[i], myText = my ? q.options[my.opt].text : '—', quality = my ? optionQuality(my) : 0; return `<div class="review-item ${quality < 60 ? 'review-needs-work' : ''}"><div class="review-q"><span class="rn">${String(i + 1).padStart(2, '0')}</span>${esc(q.scene)}</div><div class="review-my">我的选择：<b>${esc(myText)}</b><span class="choice-quality">${quality < 60 ? '需要改进' : quality < 85 ? '合理选择' : '为民实干'}</span></div><div class="review-fact">史实对照：${esc(q.fact)}</div></div>`; }).join('')}</div>`;
    resultTimer = setTimeout(() => document.querySelectorAll('.dim-bar i').forEach(b => b.style.width = b.dataset.w + '%'), UI && UI.reduced ? 0 : 60);
  }
  if (window.ShiyiAuth && typeof ShiyiAuth.onChange === 'function') {
    ShiyiAuth.onChange(() => {
      const nextOwner = currentOwner();
      if (Q && Q.owner !== nextOwner) {
        if (Q.answers.length && Q.answers.length < D.quiz.length) save('progress', Q, Q.owner);
        clearTimers(); Q = null;
      }
      if (inited && viewOwner !== nextOwner && document.getElementById('ftQuiz').classList.contains('on')) showIntro();
    });
  }
})();
