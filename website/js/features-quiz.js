/* ============================================================
   文件名：js/features-quiz.js
   功能描述：情境测评——24 道石椅真实抉择题（DATA.quiz），
            逐题作答、进度条推进，选中 650ms 后自动下一题；
            答完揭晓五维倾向、匹配书记与 24 题史实对照回顾。
   作者：云上党旗飘项目组
   创建日期：2026-10-21
   版权声明：本代码为项目原创代码，用于软件著作权登记。
   ============================================================ */
(function () {
  const D = window.DATA;
  const LS_KEY = 'shiyi_quiz_v1';

  /* ---------- 五维词典 ---------- */
  const DIMS = {
    min:  { name: '初心', full: '初心精神 · 为民造福' },
    gong: { name: '攻坚', full: '攻坚精神 · 自力更生' },
    jie:  { name: '接力', full: '接力精神 · 久久为功' },
    tuo:  { name: '开拓', full: '开拓精神 · 敢破敢立' },
    shou: { name: '和美', full: '和美精神 · 守正共生' },
  };
  const DIM_KEYS = ['min', 'gong', 'jie', 'tuo', 'shou'];

  /* ---------- 测评状态 ---------- */
  let Q = null;   // { idx, answers:[{qid, opt, dim}], dims:{...} }
  let inited = false;

  /* ---------- 打开 / 关闭 ---------- */
  window.openQuiz = function () {
    if (!inited) { buildDom(); inited = true; }
    showIntro();
    document.getElementById('ftQuiz').classList.add('on');
    document.body.style.overflow = 'hidden';
  };
  window.closeQuiz = function () {
    document.getElementById('ftQuiz').classList.remove('on');
    document.body.style.overflow = '';
  };

  /* ---------- 注入弹层 DOM（仅一次） ---------- */
  function buildDom() {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="ft-overlay" id="ftQuiz">
        <div class="ft-head">
          <div>
            <div class="ft-head-title">情境测评</div>
            <div class="ft-head-sub">24 道石椅真实抉择，测测你的政绩观底色</div>
          </div>
          <button class="ft-close" onclick="closeQuiz()" aria-label="关闭">✕</button>
        </div>
        <div class="ft-body" id="quizBody"></div>
      </div>`);
  }

  /* ---------- 开场 ---------- */
  function showIntro() {
    Q = null;
    const last = (() => { try { return JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) { return null; } })();
    document.getElementById('quizBody').innerHTML = `
      <div class="quiz-intro">
        <h2>如果你是石椅村支书</h2>
        <p>24 个抉择瞬间，全部取自石椅村六十四年真实村史。<br>
        没有标准答案，只有政绩观的底色——<br>
        答完为你揭晓五维倾向，并匹配与你最像的一任书记。</p>
        <button class="btn" onclick="startQuiz()">开始作答（24 题）</button>
        ${last ? `<p class="note" style="margin-top:16px;">上次测评：匹配「${last.leaderName}」 · 可重新作答刷新结果</p>` : ''}
      </div>`;
  }

  /* ---------- 答题流程 ---------- */
  window.startQuiz = function () {
    Q = { idx: 0, answers: [], dims: { min: 0, gong: 0, jie: 0, tuo: 0, shou: 0 } };
    renderQuestion();
  };

  function renderQuestion() {
    const q = D.quiz[Q.idx];
    const body = document.getElementById('quizBody');
    body.innerHTML = `
      <div class="quiz-topbar">
        <span class="quiz-prog-num">第 ${Q.idx + 1} / ${D.quiz.length} 题</span>
        <div class="quiz-prog-bar"><i style="width:${(Q.idx / D.quiz.length) * 100}%"></i></div>
      </div>
      <div class="quiz-card">
        <div class="quiz-scene-label">情境 ${q.id}${q.reverse ? ' · 村民视角' : ''}</div>
        <div class="quiz-scene">${q.scene}</div>
        <div class="quiz-opts">
          ${q.options.map((o, i) => `<button class="quiz-opt" onclick="pickOpt(${i}, this)">${o.text}</button>`).join('')}
        </div>
      </div>`;
    // 答完立即把进度条推到当前题位置（动画）
    requestAnimationFrame(() => {
      const bar = body.querySelector('.quiz-prog-bar i');
      if (bar) bar.style.width = ((Q.idx + 1) / D.quiz.length) * 100 + '%';
    });
  }

  window.pickOpt = function (i, el) {
    const q = D.quiz[Q.idx];
    if (!q || el.classList.contains('picked')) return;

    // 选中态 + 锁定本題选项
    el.classList.add('picked');
    el.parentElement.querySelectorAll('.quiz-opt').forEach(b => b.style.pointerEvents = 'none');

    const dim = q.options[i].dim;
    if (Q.dims[dim] !== undefined) Q.dims[dim]++;
    Q.answers.push({ qid: q.id, opt: i, dim });

    // 650ms 后自动进入下一题
    setTimeout(() => {
      Q.idx++;
      if (Q.idx < D.quiz.length) renderQuestion();
      else showResult();
    }, 650);
  };

  /* ---------- 结果 ---------- */
  function norm(v) { const s = v.reduce((a, b) => a + b, 0) || 1; return v.map(x => x / s); }

  function matchLeader() {
    const user = norm(DIM_KEYS.map(k => Q.dims[k]));
    let best = null, bestDist = Infinity;
    D.leaders.forEach(l => {
      const lv = norm(DIM_KEYS.map(k => (l.dims && l.dims[k]) || 0));
      const dist = Math.sqrt(lv.reduce((sum, x, i) => sum + (x - user[i]) * (x - user[i]), 0));
      if (dist < bestDist) { bestDist = dist; best = l; }
    });
    return best;
  }

  function showResult() {
    const leader = matchLeader();
    const maxDim = Math.max(1, ...DIM_KEYS.map(k => Q.dims[k]));

    // 存档
    localStorage.setItem(LS_KEY, JSON.stringify({
      dims: Q.dims, leaderId: leader.id, leaderName: leader.name, ts: Date.now(),
    }));

    // 主导维度（得分最高者，用于一句评语）
    const topKey = DIM_KEYS.reduce((a, b) => Q.dims[a] >= Q.dims[b] ? a : b);

    document.getElementById('quizBody').innerHTML = `
      <div class="quiz-result-head">
        <div class="rh-k">你的政绩观底色 · 最像这位书记</div>
        <div class="rh-name">${leader.name}</div>
        <div class="rh-role">${leader.order}党支部书记 · ${leader.period} · 「${leader.keyword}」</div>
        <div class="rh-word">${leader.title}。你的选择里「${DIMS[topKey].full}」最为鲜明。</div>
      </div>

      <div class="ft-sec-title">五维倾向</div>
      <div class="card">
        <div class="dim-list">
          ${DIM_KEYS.map(k => `
            <div class="dim-row">
              <div class="dim-name">${DIMS[k].name}<small>${DIMS[k].full.split(' · ')[1]}</small></div>
              <div class="dim-bar"><i style="width:0%" data-w="${(Q.dims[k] / maxDim) * 100}"></i></div>
              <div class="dim-val">${Q.dims[k]}</div>
            </div>`).join('')}
        </div>
      </div>

      <div class="quiz-actions">
        <button class="btn" onclick="startQuiz()">再测一次</button>
        <button class="btn btn-gold" onclick="closeQuiz();openPoster();">把金句做成海报</button>
        <button class="btn btn-ghost" onclick="closeQuiz()">回到广场</button>
      </div>

      <div class="ft-sec-title">24 题回顾 · 对照史实</div>
      <div>
        ${D.quiz.map((q, i) => {
          const my = Q.answers[i];
          const myText = my ? q.options[my.opt].text : '—';
          const sceneShort = q.scene.length > 42 ? q.scene.slice(0, 42) + '…' : q.scene;
          return `
          <div class="review-item">
            <div class="review-q"><span class="rn">${String(i + 1).padStart(2, '0')}</span>${sceneShort}</div>
            <div class="review-my">我的选择：<b>${myText}</b></div>
            <div class="review-fact">史实对照：${q.fact}</div>
          </div>`;
        }).join('')}
      </div>`;

    // 五维条动画
    requestAnimationFrame(() => setTimeout(() => {
      document.querySelectorAll('.dim-bar i').forEach(b => b.style.width = b.dataset.w + '%');
    }, 60));
  }
})();
