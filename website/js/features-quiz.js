/* 情境测评：24 题、五维倾向、史实回顾与可恢复进度 */
(function () {
  'use strict';
  const D = window.DATA, UI = window.ShiyiUI, esc = UI ? UI.esc : String;
  const DIMS = { min: { name: '初心', full: '初心精神 · 为民造福' }, gong: { name: '攻坚', full: '攻坚精神 · 自力更生' }, jie: { name: '接力', full: '接力精神 · 久久为功' }, tuo: { name: '开拓', full: '开拓精神 · 敢破敢立' }, shou: { name: '和美', full: '和美精神 · 守正共生' } };
  const DIM_KEYS = Object.keys(DIMS);
  let Q = null, inited = false, advanceTimer = 0, resultTimer = 0;
  function key(kind) { const me = window.ShiyiAuth && ShiyiAuth.current(); return 'shiyi_quiz_' + kind + '_' + (me ? me.uid : 'guest'); }
  function load(kind) { return UI ? UI.safeJSON(key(kind), null) : JSON.parse(localStorage.getItem(key(kind)) || 'null'); }
  function save(kind, value) { if (UI) UI.safeStore(key(kind), value); else localStorage.setItem(key(kind), JSON.stringify(value)); }
  function clearTimers() { clearTimeout(advanceTimer); clearTimeout(resultTimer); advanceTimer = resultTimer = 0; }
  function normalizeProgress(raw) {
    if (!raw || !Number.isInteger(raw.idx) || !Array.isArray(raw.answers)) return null;
    const answers = raw.answers.filter((a, i) => a && a.qid === D.quiz[i].id && D.quiz[i].options[a.opt]).map((a, i) => ({ qid: D.quiz[i].id, opt: a.opt, dim: D.quiz[i].options[a.opt].dim }));
    return { idx: Math.max(0, Math.min(D.quiz.length - 1, answers.length)), answers, dims: calcDims(answers) };
  }
  function calcDims(answers) { const dims = Object.fromEntries(DIM_KEYS.map(k => [k, 0])); answers.forEach(a => { if (dims[a.dim] !== undefined) dims[a.dim]++; }); return dims; }
  function openLayer(el) { if (UI) UI.openLayer(el); else el.classList.add('on'); }
  function closeLayer(el) { if (UI) UI.closeLayer(el); else el.classList.remove('on'); }
  window.openQuiz = function () { if (!inited) { buildDom(); inited = true; } clearTimers(); showIntro(); openLayer(document.getElementById('ftQuiz')); };
  window.closeQuiz = function () { clearTimers(); if (Q && Q.answers.length && Q.answers.length < D.quiz.length) save('progress', Q); closeLayer(document.getElementById('ftQuiz')); };
  function buildDom() { document.body.insertAdjacentHTML('beforeend', `<section class="ft-overlay" id="ftQuiz" role="dialog" aria-modal="true" aria-labelledby="quizTitle"><div class="ft-head"><div><div class="ft-head-title" id="quizTitle">情境测评</div><div class="ft-head-sub">24 道石椅真实抉择，测测你的政绩观底色</div></div><button class="ft-close" onclick="closeQuiz()" aria-label="关闭测评">✕</button></div><div class="ft-body" id="quizBody"></div></section>`); }
  function showIntro() {
    clearTimers(); Q = null;
    const me = window.ShiyiAuth && ShiyiAuth.current();
    const last = me && me.quiz ? me.quiz : load('result'), progress = normalizeProgress(load('progress'));
    document.getElementById('quizBody').innerHTML = `<div class="quiz-intro"><h2>如果你是石椅村支书</h2><p>24 个抉择瞬间，全部取自石椅村六十四年真实村史。<br>没有标准答案，只有政绩观的底色。<br>答题时不会提前揭晓史实，完成后统一回顾。</p>
      ${progress && progress.answers.length ? `<button class="btn btn-gold" onclick="resumeQuiz()">继续上次 · 已完成 ${progress.answers.length} 题</button> ` : ''}<button class="btn" onclick="startQuiz()">${progress ? '重新开始' : '开始作答（24 题）'}</button>
      ${last ? `<p class="note" style="margin-top:16px;">上次测评：匹配「${esc(last.leaderName || '石椅书记')}」 · 可重新作答刷新结果</p>` : ''}</div>`;
  }
  window.startQuiz = function () { clearTimers(); Q = { idx: 0, answers: [], dims: Object.fromEntries(DIM_KEYS.map(k => [k, 0])) }; save('progress', Q); renderQuestion(); };
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
    if (!Q) return; clearTimers(); const leader=matchLeader(), maxDim=Math.max(1,...DIM_KEYS.map(k=>Q.dims[k]));
    const result={dims:Q.dims,leaderId:leader.id,leaderName:leader.name,ts:Date.now()}; save('result',result); save('progress',null);
    if(window.ShiyiAuth&&ShiyiAuth.current())ShiyiAuth.saveFields({quiz:result}); if(window.ShiyiProfileRefresh)ShiyiProfileRefresh();
    const topKey=DIM_KEYS.reduce((a,b)=>Q.dims[a]>=Q.dims[b]?a:b);
    document.getElementById('quizBody').innerHTML=`<div class="quiz-result-head"><div class="rh-k">你的政绩观底色 · 最像这位书记</div><div class="rh-name">${esc(leader.name)}</div><div class="rh-role">${esc(leader.order)}党支部书记 · ${esc(leader.period)} · 「${esc(leader.keyword)}」</div><div class="rh-word">${esc(leader.title)}。你的选择里「${DIMS[topKey].full}」最为鲜明。</div></div>
      <div class="ft-sec-title">五维倾向</div><div class="card"><div class="dim-list">${DIM_KEYS.map(k=>`<div class="dim-row"><div class="dim-name">${DIMS[k].name}<small>${DIMS[k].full.split(' · ')[1]}</small></div><div class="dim-bar"><i style="width:0%" data-w="${Q.dims[k]/maxDim*100}"></i></div><div class="dim-val">${Q.dims[k]}</div></div>`).join('')}</div></div>
      <div class="quiz-actions"><button class="btn" onclick="startQuiz()">再测一次</button><button class="btn btn-gold" onclick="closeQuiz();openPoster();">把金句做成海报</button><button class="btn btn-ghost" onclick="closeQuiz()">回到广场</button></div>
      <div class="ft-sec-title">24 题回顾 · 对照史实</div><div>${D.quiz.map((q,i)=>{const my=Q.answers[i],myText=my?q.options[my.opt].text:'—';return `<div class="review-item"><div class="review-q"><span class="rn">${String(i+1).padStart(2,'0')}</span>${esc(q.scene)}</div><div class="review-my">我的选择：<b>${esc(myText)}</b></div><div class="review-fact">史实对照：${esc(q.fact)}</div></div>`;}).join('')}</div>`;
    resultTimer=setTimeout(()=>document.querySelectorAll('.dim-bar i').forEach(b=>b.style.width=b.dataset.w+'%'),UI&&UI.reduced?0:60);
  }
})();
