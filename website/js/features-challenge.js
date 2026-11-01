/* 好样子答题闯关：三大篇章、九关、六十题，连击/生命/道具/星级/解锁 */
(function () {
  'use strict';
  const D = window.DATA, UI = window.ShiyiUI;
  const esc = UI.esc;
  const TRACKS = {
    village: { name: '羌寨寻根', sub: '认识云朵上的石椅村', icon: '寨', color: '#B83A2E' },
    road: { name: '绝壁凿路', sub: '重走三公里大岩路', icon: '凿', color: '#9A6534' },
    theory: { name: '好样子答卷', sub: '读懂正确政绩观', icon: '答', color: '#455D78' },
  };
  const LEVEL_NAMES = ['初入石椅', '进阶考验', '先锋对决'];
  const STAGES = [];
  Object.keys(TRACKS).forEach(track => [1, 2, 3].forEach(level => {
    STAGES.push({ id: STAGES.length + 1, track, level, name: LEVEL_NAMES[level - 1], questions: D.challenge.filter(q => q.track === track && q.level === level) });
  }));
  let meta, metaOwner = null, run = null, timer = 0, audio = null, inited = false;

  function owner() { const me = window.ShiyiAuth && ShiyiAuth.current(); return me ? me.uid : 'guest'; }
  function key(ownerId) { return 'shiyi_challenge_v1_' + (ownerId || owner()); }
  function runKey(ownerId) { return key(ownerId) + '_run'; }
  function blank() { return { unlocked: 1, stars: {}, best: {}, clears: {}, sound: true }; }
  function saveRun() {
    if (!run) return;
    UI.safeStore(runKey(run.owner || metaOwner), {
      version: 1, stage: run.stage.id,
      order: run.questions.map(q => ({ q: q.q, options: q.options.map(o => o.text) })),
      idx: run.idx, lives: run.lives, score: run.score, combo: run.combo, maxCombo: run.maxCombo,
      correct: run.correct, time: run.time, items: run.items, shield: run.shield,
      locked: run.locked, selected: run.selected, removed: run.removed,
    });
  }
  function clearRun(ownerId) { try { localStorage.removeItem(runKey(ownerId)); } catch (_) { /* 存储不可用时仅保留内存状态 */ } }
  function loadRun() {
    const raw = UI.safeJSON(runKey(), null);
    if (!raw || raw.version !== 1 || !Array.isArray(raw.order)) return null;
    const stage = STAGES.find(s => s.id === Number(raw.stage));
    if (!stage || stage.id > meta.unlocked || raw.order.length !== stage.questions.length) return null;
    const questions = [], seen = new Set();
    for (const entry of raw.order) {
      const original = stage.questions.find(q => q.q === (entry && entry.q));
      if (!original || seen.has(original.q) || !Array.isArray(entry.options) || entry.options.length !== original.options.length) return null;
      seen.add(original.q);
      const used = new Set(), options = [];
      for (const text of entry.options) {
        const index = original.options.findIndex((option, i) => option === text && !used.has(i));
        if (index < 0) return null;
        used.add(index); options.push({ text: original.options[index], correct: index === original.answer });
      }
      questions.push({ ...original, options });
    }
    const integer = (value, fallback, min, max) => Number.isInteger(value) ? Math.max(min, Math.min(max, value)) : fallback;
    const idx = integer(raw.idx, 0, 0, questions.length - 1);
    const items = { cut: raw.items && raw.items.cut === 0 ? 0 : 1, time: raw.items && raw.items.time === 0 ? 0 : 1, shield: raw.items && raw.items.shield === 0 ? 0 : 1 };
    const locked = raw.locked === true;
    if (locked && (!Number.isInteger(raw.selected) || raw.selected < -1 || raw.selected >= questions[idx].options.length)) return null;
    const removed = Array.isArray(raw.removed) ? [...new Set(raw.removed.filter(i => Number.isInteger(i) && i >= 0 && i < questions[idx].options.length && !questions[idx].options[i].correct))].slice(0, 2) : [];
    return {
      owner: metaOwner, stage, questions, idx,
      lives: integer(raw.lives, 3, 0, 3), score: integer(raw.score, 0, 0, 10000000),
      combo: integer(raw.combo, 0, 0, questions.length), maxCombo: integer(raw.maxCombo, 0, 0, questions.length),
      correct: integer(raw.correct, 0, 0, questions.length), time: integer(raw.time, 20, locked ? 0 : 1, 30),
      items, shield: raw.shield === true && items.shield === 0,
      locked, selected: locked ? raw.selected : null, removed,
    };
  }
  function load() {
    const raw = UI.safeJSON(key(), {}), clean = blank();
    clean.unlocked = Math.max(1, Math.min(STAGES.length, Number.isInteger(raw.unlocked) ? raw.unlocked : 1));
    clean.sound = raw.sound !== false;
    ['stars', 'best', 'clears'].forEach(kind => {
      if (!raw[kind] || typeof raw[kind] !== 'object' || Array.isArray(raw[kind])) return;
      STAGES.forEach(s => {
        const value = Number(raw[kind][s.id]);
        if (!Number.isFinite(value)) return;
        clean[kind][s.id] = kind === 'stars' ? Math.max(0, Math.min(3, Math.floor(value))) : Math.max(0, Math.floor(value));
      });
    });
    return clean;
  }
  function save() { UI.safeStore(key(), meta); }
  function totalStars() { return Object.values(meta.stars).reduce((a, b) => a + b, 0); }
  function layer() { return document.getElementById('ftChallenge'); }
  function open() {
    if (!inited) {
      document.body.insertAdjacentHTML('beforeend', `<section class="ft-overlay challenge-overlay" id="ftChallenge" role="dialog" aria-modal="true" aria-labelledby="challengeTitle"><div class="ft-head challenge-head"><div><div class="ft-head-title" id="challengeTitle">好样子 · 答题闯关</div><div class="ft-head-sub">三大篇章 · 九道关卡 · 六十道村史与政绩观考题</div></div><button class="challenge-sound" onclick="challengeSound()" aria-label="切换音效">音效 开</button><button class="ft-close" onclick="closeChallenge()" aria-label="关闭答题闯关">✕</button></div><div class="ft-body challenge-body" id="challengeBody"></div></section>`);
      inited = true;
    }
    if (run) saveRun();
    clearInterval(timer); timer = 0; run = null; metaOwner = owner(); meta = load(); showMap(); UI.openLayer(layer()); syncSound();
  }
  function close() { if (run) saveRun(); clearInterval(timer); timer = 0; run = null; UI.closeLayer(layer()); }
  function syncSound() { const b = layer().querySelector('.challenge-sound'); if (b) { b.textContent = meta.sound ? '音效 开' : '音效 关'; b.setAttribute('aria-pressed', String(meta.sound)); } }
  function toggleSound() { meta.sound = !meta.sound; save(); syncSound(); if (meta.sound) tone(660, .08); }
  function tone(freq, duration) {
    if (!meta || !meta.sound) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = 'sine'; osc.frequency.value = freq; gain.gain.setValueAtTime(.055, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
      osc.connect(gain); gain.connect(audio.destination); osc.start(); osc.stop(audio.currentTime + duration);
    } catch (_) { /* 无音频设备不影响答题 */ }
  }
  function showMap() {
    if (run) saveRun();
    clearInterval(timer); timer = 0; run = null;
    const saved = loadRun();
    const stars = totalStars(), completed = Object.keys(meta.clears).filter(id => meta.clears[id]).length;
    document.getElementById('challengeBody').innerHTML = `<section class="challenge-hero"><div class="challenge-hero-copy"><span class="challenge-eyebrow">SHIYI KNOWLEDGE EXPEDITION</span><h1>一题一阶，登上羌山</h1><p>从村史细节到凿路精神，再到政绩观实践。答对连击加分，答错消耗生命；每关最多斩获三星。</p><div class="challenge-metrics"><span><b>${stars}</b><small>累计星星 / 27</small></span><span><b>${completed}</b><small>已通关 / 9</small></span><span><b>${meta.unlocked}</b><small>当前解锁</small></span></div></div><div class="challenge-guide" aria-hidden="true"><span class="guide-halo"></span><span class="guide-hat"></span><span class="guide-face"></span><span class="guide-body">好</span><span class="guide-book">卷</span></div></section>
      <div class="challenge-rules"><span>连击加成</span><span>每关 3 点生命</span><span>答题计时</span><span>三种道具</span><span>60% 正确率通关</span></div>
      ${saved ? `<div class="challenge-resume"><div><b>第 ${saved.stage.id} 关 · 未完待续</b><small>已答 ${saved.idx + (saved.locked ? 1 : 0)} / ${saved.questions.length} 题 · ${saved.lives} 点生命 · ${saved.score} 分</small></div><button class="btn btn-gold" onclick="resumeChallenge()">继续本关 →</button><button class="challenge-resume-discard" onclick="discardChallengeRun()">放弃本次进度</button></div>` : ''}
      <div class="challenge-map">${Object.keys(TRACKS).map(track => {
        const t = TRACKS[track];
        return `<section class="challenge-chapter" style="--chapter:${t.color}"><div class="challenge-chapter-head"><span class="challenge-chapter-icon">${t.icon}</span><div><h2>${t.name}</h2><p>${t.sub}</p></div></div><div class="stage-path">${STAGES.filter(s => s.track === track).map(s => {
          const locked = s.id > meta.unlocked, star = meta.stars[s.id] || 0;
          return `<button class="stage-node ${locked ? 'locked' : ''} ${star ? 'cleared' : ''}" onclick="startChallenge(${s.id})" ${locked ? 'disabled' : ''} aria-label="第${s.id}关 ${s.name}，${locked ? '未解锁' : star + '星'}"><span class="stage-ring"><b>${locked ? '锁' : s.id}</b></span><span class="stage-name">${s.level} · ${s.name}</span><span class="stage-stars" aria-hidden="true">${[1,2,3].map(n => `<i class="${n <= star ? 'on' : ''}">★</i>`).join('')}</span><small>${s.questions.length} 题${meta.best[s.id] ? ' · 最高 ' + meta.best[s.id] : ''}</small></button>`;
        }).join('')}</div></section>`;
      }).join('')}</div><p class="challenge-footnote">每关答对至少 60% 即可解锁下一关；80% 获二星，全部答对获三星。进度按游客或登录账号分别保存。</p>`;
  }
  function shuffledQuestion(q) {
    const options = q.options.map((text, index) => ({ text, correct: index === q.answer }));
    for (let i = options.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [options[i], options[j]] = [options[j], options[i]]; }
    return { ...q, options };
  }
  function start(id) {
    const stage = STAGES.find(s => s.id === Number(id));
    if (!stage || stage.id > meta.unlocked) return;
    const questions = stage.questions.map(shuffledQuestion);
    run = { owner: metaOwner, stage, questions, idx: 0, lives: 3, score: 0, combo: 0, maxCombo: 0, correct: 0, time: 20, items: { cut: 1, time: 1, shield: 1 }, shield: false, locked: false, selected: null, removed: [] };
    renderQuestion(); startTimer(); saveRun(); tone(520, .08);
  }
  function resume() {
    const saved = loadRun();
    if (!saved) { clearRun(); showMap(); return; }
    run = saved; renderQuestion();
    if (run.locked) paintAnswer(run.selected); else startTimer();
  }
  function discardRun() { clearRun(); showMap(); UI.toast('已放弃本次闯关，历史星级与最高分保留'); }
  function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
      if (!run || run.locked || !layer().classList.contains('on') || document.hidden) return;
      run.time--;
      saveRun();
      const t = document.getElementById('challengeTime'); if (t) t.textContent = run.time;
      const clock = document.querySelector('.challenge-clock'); if (clock) clock.classList.toggle('urgent', run.time <= 5);
      if (run.time <= 0) answer(-1);
    }, 1000);
  }
  function renderQuestion() {
    if (!run) return;
    const q = run.questions[run.idx], r = run;
    document.getElementById('challengeBody').innerHTML = `<div class="play-top"><button class="challenge-back" onclick="challengeMap()">← 关卡地图</button><span>第 ${r.stage.id} 关 · ${TRACKS[r.stage.track].name}</span><button class="challenge-exit" onclick="closeChallenge()">保存本关并退出</button></div>
      <section class="challenge-play"><div class="play-hud"><div class="play-lives" aria-label="剩余${r.lives}点生命">${[1,2,3].map(n => `<span class="${n <= r.lives ? 'on' : ''}">♥</span>`).join('')}</div><div class="play-score"><small>本关得分</small><b id="challengeScore">${r.score}</b></div><div class="challenge-clock ${r.time <= 5 ? 'urgent' : ''}"><small>本题倒计时</small><b><span id="challengeTime">${r.time}</span>s</b></div></div>
      <div class="play-progress"><i style="width:${r.idx / r.questions.length * 100}%"></i></div><div class="play-caption"><span>QUESTION ${String(r.idx + 1).padStart(2, '0')} / ${String(r.questions.length).padStart(2, '0')}</span><span id="challengeCombo">${r.combo >= 2 ? `${r.combo} 连击` : '连续答对可触发连击加分'}</span></div>
      <article class="challenge-question"><span class="question-seal">问</span><h1>${esc(q.q)}</h1><div class="challenge-options">${q.options.map((o, i) => `<button class="challenge-option ${r.removed.includes(i) ? 'removed' : ''}" data-option="${i}" onclick="challengeAnswer(${i})" ${r.removed.includes(i) ? 'disabled' : ''}><span class="option-letter">${'ABCD'[i]}</span><span>${esc(o.text)}</span><span class="option-mark"></span></button>`).join('')}</div><div id="challengeFeedback" aria-live="polite"></div></article>
      <div class="challenge-tools"><button onclick="challengeUse('cut')" ${!r.items.cut ? 'disabled' : ''}><b>去掉两项</b><small>${r.items.cut ? '本题可用 · 1 次' : '已使用'}</small></button><button onclick="challengeUse('time')" ${!r.items.time ? 'disabled' : ''}><b>时光加成</b><small>${r.items.time ? '本题 +10 秒 · 1 次' : '已使用'}</small></button><button onclick="challengeUse('shield')" ${!r.items.shield ? 'disabled' : ''} class="${r.shield ? 'active' : ''}"><b>同心护盾</b><small>${r.shield ? '已开启 · 抵挡一次失误' : r.items.shield ? '抵挡一次失误 · 1 次' : '已使用'}</small></button></div></section>`;
    const first = document.querySelector('.challenge-option:not([disabled])'); if (first) first.focus({ preventScroll: true });
  }
  function answer(index) {
    if (!run || run.locked) return;
    const r = run, q = r.questions[r.idx], selected = q.options[index];
    if (index >= 0 && (!selected || r.removed.includes(index))) return;
    r.locked = true; r.selected = index; clearInterval(timer); timer = 0;
    const correct = !!(selected && selected.correct);
    if (correct) {
      r.correct++; r.combo++; r.maxCombo = Math.max(r.maxCombo, r.combo);
      const gain = 100 + r.time * 5 + Math.max(0, r.combo - 1) * 25; r.score += gain; tone(760 + Math.min(r.combo, 5) * 40, .12);
    } else {
      r.combo = 0;
      if (r.shield) { r.shield = false; UI.toast('同心护盾生效，本次不扣生命'); }
      else r.lives = Math.max(0, r.lives - 1);
      tone(180, .18); if (navigator.vibrate) navigator.vibrate(35);
    }
    paintAnswer(index); saveRun();
  }
  function paintAnswer(index) {
    if (!run) return;
    const r = run, q = r.questions[r.idx], selected = q.options[index], correct = !!(selected && selected.correct);
    document.querySelectorAll('.challenge-option').forEach((button, i) => {
      button.disabled = true;
      if (q.options[i].correct) button.classList.add('correct');
      if (i === index && !correct) button.classList.add('wrong');
      const mark = button.querySelector('.option-mark'); if (q.options[i].correct) mark.textContent = '✓'; else if (i === index) mark.textContent = '×';
    });
    const score = document.getElementById('challengeScore'); if (score) score.textContent = r.score;
    document.querySelectorAll('.play-lives span').forEach((heart, i) => heart.classList.toggle('on', i < r.lives));
    const lives = document.querySelector('.play-lives'); if (lives) lives.setAttribute('aria-label', `剩余${r.lives}点生命`);
    const shieldButton = document.querySelectorAll('.challenge-tools button')[2];
    if (shieldButton && !r.items.shield && !r.shield) {
      shieldButton.disabled = true; shieldButton.classList.remove('active');
      shieldButton.querySelector('small').textContent = '已使用';
    }
    const combo = document.getElementById('challengeCombo'); if (combo) combo.textContent = r.combo >= 2 ? `${r.combo} 连击` : correct ? '答对了！继续连击' : '连击中断，稳住节奏';
    const feedback = document.getElementById('challengeFeedback');
    feedback.innerHTML = `<div class="answer-feedback ${correct ? 'good' : 'bad'}"><div><b>${correct ? `回答正确 · +${100 + r.time * 5 + Math.max(0, r.combo - 1) * 25} 分` : index < 0 ? '时间到 · 本题未作答' : '回答有误 · 查看解析'}</b><p>${esc(q.analysis)}</p></div><button class="btn ${correct ? 'btn-gold' : ''}" onclick="challengeNext()">${r.lives <= 0 ? '查看本关结果' : r.idx + 1 >= r.questions.length ? '完成本关' : '下一题 →'}</button></div>`;
    const next = feedback.querySelector('button'); if (next) next.focus({ preventScroll: true });
  }
  function next() {
    if (!run || !run.locked) return;
    if (run.lives <= 0) { finish(false); return; }
    if (run.idx + 1 >= run.questions.length) { finish(run.correct / run.questions.length >= .6); return; }
    run.idx++; run.time = 20; run.locked = false; run.selected = null; run.removed = []; renderQuestion(); startTimer(); saveRun();
  }
  function use(item) {
    if (!run || run.locked || !run.items[item]) return;
    if (item === 'cut') {
      const q = run.questions[run.idx], wrong = q.options.map((o, i) => o.correct ? -1 : i).filter(i => i >= 0 && !run.removed.includes(i));
      wrong.slice(0, 2).forEach(i => { run.removed.push(i); const b = document.querySelector(`[data-option="${i}"]`); if (b) { b.disabled = true; b.classList.add('removed'); } });
    } else if (item === 'time') { run.time += 10; const t = document.getElementById('challengeTime'); if (t) t.textContent = run.time; }
    else if (item === 'shield') run.shield = true;
    run.items[item] = 0;
    const buttons = document.querySelectorAll('.challenge-tools button'), index = { cut: 0, time: 1, shield: 2 }[item];
    if (buttons[index]) { buttons[index].disabled = item !== 'shield'; buttons[index].classList.toggle('active', item === 'shield'); buttons[index].querySelector('small').textContent = item === 'shield' ? '已开启 · 抵挡一次失误' : '已使用'; }
    tone(600, .08); saveRun();
  }
  function award(points) {
    const me = window.ShiyiAuth && ShiyiAuth.current();
    if (me) ShiyiAuth.addScore(points);
    else { const score = Number(UI.safeJSON('shiyi_score', 0)) || 0; UI.safeStore('shiyi_score', score + points); }
  }
  function finish(passed) {
    const r = run;
    clearInterval(timer); timer = 0; clearRun(r.owner);
    const ratio = r.correct / r.questions.length;
    let stars = 0;
    if (passed) {
      stars = ratio >= 1 ? 3 : ratio >= .8 ? 2 : 1;
      const first = !meta.clears[r.stage.id];
      meta.clears[r.stage.id] = 1; meta.stars[r.stage.id] = Math.max(meta.stars[r.stage.id] || 0, stars); meta.best[r.stage.id] = Math.max(meta.best[r.stage.id] || 0, r.score);
      if (r.stage.id < STAGES.length) meta.unlocked = Math.max(meta.unlocked, r.stage.id + 1);
      save(); if (first) award(stars * 5); tone(880, .22);
    }
    const allDone = STAGES.every(s => meta.clears[s.id]);
    document.getElementById('challengeBody').innerHTML = `<section class="challenge-result ${passed ? 'passed' : 'failed'}"><div class="result-burst" aria-hidden="true">${passed ? '答' : '练'}</div><span class="challenge-eyebrow">${TRACKS[r.stage.track].name} · 第 ${r.stage.id} 关</span><h1>${passed ? stars === 3 ? '满分通关，漂亮！' : '闯关成功！' : '暂差一步，再来一次'}</h1><div class="result-stars">${[1,2,3].map(n => `<span class="${n <= stars ? 'on' : ''}">★</span>`).join('')}</div><p>${passed ? `答对 ${r.correct} / ${r.questions.length} 题，最高 ${r.maxCombo} 连击。${firstRewardText(r, stars)}` : `${r.lives <= 0 ? '生命已用完。' : '正确率未达到 60%。'}答对 ${r.correct} 题，复习解析后再挑战，题目与选项会重新排列。`}</p><div class="result-score"><small>本关得分</small><b>${r.score}</b></div>${allDone && passed ? '<div class="all-clear">九关全部贯通 · 获得「好样子答题达人」徽章</div>' : ''}<div class="challenge-result-actions"><button class="btn btn-gold" onclick="startChallenge(${r.stage.id})">再闯一次</button>${passed && r.stage.id < STAGES.length ? `<button class="btn" onclick="startChallenge(${r.stage.id + 1})">下一关 →</button>` : ''}<button class="btn btn-ghost" onclick="challengeMap()">返回关卡地图</button></div></section>`;
    if (window.ShiyiProfileRefresh) ShiyiProfileRefresh();
    run = null;
  }
  function firstRewardText(r, stars) { return ` 本关最佳 ${meta.best[r.stage.id]} 分，累计 ${totalStars()} 星。`; }
  document.addEventListener('keydown', e => {
    if (!run || run.locked || !layer() || !layer().classList.contains('on')) return;
    const n = Number(e.key); if (n >= 1 && n <= 4) { e.preventDefault(); answer(n - 1); }
  });
  if (window.ShiyiAuth && typeof ShiyiAuth.onChange === 'function') {
    ShiyiAuth.onChange(() => {
      const nextOwner = owner();
      if (run && run.owner !== nextOwner) {
        saveRun();
        clearInterval(timer); timer = 0; run = null;
      }
      if (inited && metaOwner !== nextOwner && layer().classList.contains('on')) {
        metaOwner = nextOwner; meta = load(); showMap();
      }
    });
  }
  window.openChallenge = open; window.closeChallenge = close; window.challengeMap = showMap; window.startChallenge = start;
  window.resumeChallenge = resume; window.discardChallengeRun = discardRun;
  window.challengeAnswer = answer; window.challengeNext = next; window.challengeUse = use; window.challengeSound = toggleSound;
})();
