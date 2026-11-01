/**
 * 文件名：js/auth.js
 * 功能描述：石椅答卷网站云端账号系统——邮箱验证码注册、邮箱密码登录、
 *           会话恢复、登录态导航栏显示；个人档案（昵称/政绩值/徽章/
 *           测评结果/集章存档）持久化于 WorkBuddy 云服务数据库，
 *           管理后台读取全站用户政绩榜。游客数据仍保存在本机。
 * 作者：云上党旗飘项目组
 * 创建日期：2026-10-21
 * 版权声明：本代码为项目原创代码，用于软件著作权登记。
 */
window.ShiyiAuth = (function () {
  const cloud = window.ShiyiCloud ? ShiyiCloud.cloud : null;
  // 管理员账号名单（这些邮箱登录即为管理员）
  const ADMINS = ['1491569974@qq.com'];
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let busy = false;
  function setBusy(value) {
    busy = value;
    document.querySelectorAll('#authForm button[type="submit"]').forEach(b => { b.disabled = value; });
    const form = document.getElementById('authForm');
    if (form) form.setAttribute('aria-busy', String(value));
  }

  let me = null;          // 当前登录档案：{ uid, email, nickname, score, badges, quiz, stamps }
  let sessionVersion = 0; // 使账号切换前发出的异步请求失效
  let pendingReg = null;  // 注册第一步暂存：{ email, password, nickname, verificationId, isExistingUser }
  const listeners = [];

  /* 当前登录用户档案或 null（同步读缓存） */
  function current() { return me; }
  function isAdmin() { return !!(me && ADMINS.includes(me.email)); }
  function onChange(fn) { if (typeof fn === 'function') listeners.push(fn); }

  /* 档案变化统一通知：导航区 + 个人页 + 订阅方 */
  function notify() {
    renderNav();
    if (typeof window.ShiyiProfileRefresh === 'function') {
      try { window.ShiyiProfileRefresh(); } catch (e) { /* 忽略渲染异常 */ }
    }
    listeners.forEach(fn => { try { fn(me); } catch (e) { /* 忽略订阅异常 */ } });
  }

  /* ================= 云端档案 ================= */
  /* 读取本人档案；没有则以邮箱前缀为初始昵称建档 */
  async function loadProfile(user) {
    const found = await cloud.database.from('profiles').select('*').eq('owner_id', user.id).maybeSingle();
    if (found.error) throw found.error;
    if (found.data) return found.data;
    const nick = user.name || (user.email ? user.email.split('@')[0] : '接力队员');
    const created = await cloud.database.from('profiles').insert({ nickname: nick }).select();
    if (created.error) throw created.error;
    return created.data && created.data[0] ? created.data[0] : { nickname: nick, score: 0, badges: [], quiz: null, stamps: null };
  }

  /* 登录成功后引导：装载档案并广播 */
  async function bootstrap(session) {
    const user = session && session.user;
    if (!user) return false;
    const version = ++sessionVersion;
    const p = await loadProfile(user);
    if (version !== sessionVersion) return false;
    me = {
      uid: user.id,
      email: user.email || '',
      nickname: p.nickname || user.name || '接力队员',
      score: p.score || 0,
      badges: Array.isArray(p.badges) ? p.badges : [],
      quiz: p.quiz || null,
      stamps: p.stamps && Array.isArray(p.stamps.ids) ? p.stamps : { ids: [], dates: {} },
    };
    notify();
    return true;
  }

  /* 给当前用户加政绩值（云端原子累加） */
  async function addScore(n) {
    if (!me || !cloud) return;
    const profile = me, uid = me.uid;
    try {
      const { data, error } = await cloud.database.rpc('increment_score', { delta: n });
      if (me !== profile || !me || me.uid !== uid) return;
      me.score = (!error && typeof data === 'number') ? data : (me.score || 0) + n;
    } catch (e) {
      if (me !== profile || !me || me.uid !== uid) return;
      me.score = (me.score || 0) + n;
    }
    notify();
  }

  /* 更新本人档案字段（quiz / stamps / badges 等），返回是否成功 */
  async function saveFields(fields) {
    if (!me || !cloud) return false;
    const profile = me, uid = me.uid;
    try {
      const { data, error } = await cloud.database.from('profiles').update(fields).eq('owner_id', uid).select();
      const rows = Array.isArray(data) ? data : [];
      if (error || rows.length === 0) return false;   // 行不存在或非本人（RLS 拦截）
      if (me !== profile || !me || me.uid !== uid) return false;
      Object.assign(me, fields);
      notify();
      return true;
    } catch (e) {
      return false;   // 网络异常不阻断本地体验
    }
  }

  /* ================= 注册 / 登录 / 退出 ================= */
  /* 注册第一步：发送邮箱验证码 */
  async function startRegister(email, password, nickname, msg) {
    if (!password || password.length < 6) { msg('密码至少 6 位'); return; }
    const sent = await cloud.auth.sendOtp({ email });
    if (sent.error) { msg(sent.error.message || '验证码发送失败，请稍后重试'); return; }
    if (sent.data && sent.data.isExistingUser) { msg('该邮箱已注册，请直接登录'); return; }
    pendingReg = {
      email, password, nickname,
      verificationId: sent.data.verificationId,
      isExistingUser: sent.data.isExistingUser,
    };
    const codeWrap = document.getElementById('authCodeWrap');
    const codeInput = document.getElementById('authCode');
    if (codeWrap) codeWrap.hidden = false;
    if (codeInput) codeInput.focus();
    msg('验证码已发送至邮箱，输入后再次点击「注册」完成');
  }

  /* 注册第二步：校验验证码并建档 */
  async function finishRegister(code, msg) {
    if (!code) { msg('请输入邮箱验证码'); return; }
    const done = await cloud.auth.verifyOtp({
      email: pendingReg.email,
      verificationId: pendingReg.verificationId,
      isExistingUser: pendingReg.isExistingUser,
      token: code,
      password: pendingReg.password,
    });
    if (done.error) { msg(done.error.message || '验证码错误，请核对后重试'); return; }
    const nickname = pendingReg.nickname;
    pendingReg = null;
    await bootstrap(done.data);
    if (nickname && me) await saveFields({ nickname });
    hide();
    toast(isAdmin() ? '欢迎回来，管理员' : '注册成功，欢迎加入接力');
  }

  async function submit(mode) {
    if (busy) return;
    if (!cloud) { setMsg('云服务暂不可用，请检查网络后刷新'); return; }
    const acc = (document.getElementById('authAccount').value || '').trim();
    const pwd = document.getElementById('authPwd').value || '';
    const nick = (document.getElementById('authNick') && document.getElementById('authNick').value || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(acc)) { setMsg('请输入有效邮箱'); return; }
    if (!pwd || pwd.length < 6) { setMsg('密码至少 6 位'); return; }
    if (mode === 'reg' && (nick.length < 2 || nick.length > 20)) { setMsg('昵称需为 2—20 个字符'); return; }
    setBusy(true); setMsg('正在处理，请稍候……');
    try {
      if (mode === 'login') {
        const { data, error } = await cloud.auth.signInWithPassword({ email: acc, password: pwd });
        if (error) { setMsg('邮箱或密码错误'); return; }
        pendingReg = null;
        await bootstrap(data);
        hide();
        toast(isAdmin() ? '欢迎回来，管理员' : '登录成功');
      } else if (!pendingReg || pendingReg.email !== acc) {
        await startRegister(acc, pwd, nick, setMsg);
      } else {
        const code = (document.getElementById('authCode').value || '').trim();
        await finishRegister(code, setMsg);
      }
    } catch (e) {
      setMsg('网络异常，请稍后重试');
    } finally { setBusy(false); }
  }

  async function logout() {
    sessionVersion++;
    me = null;
    pendingReg = null;
    notify();
    if (cloud) { try { await cloud.auth.signOut(); } catch (e) { /* 忽略退出异常 */ } }
  }

  /* ================= 会话恢复与初始化 ================= */
  async function init() {
    renderNav();
    if (!cloud) return;
    try {
      const { data: session } = await cloud.auth.getSession();
      if (session) await bootstrap(session);
    } catch (e) { /* 网络异常保持游客态 */ }
    cloud.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') { sessionVersion++; me = null; pendingReg = null; notify(); }
      else if (session && (!me || me.uid !== session.user.id)) {
        bootstrap(session).catch(() => { /* 档案装载失败保持当前态 */ });
      }
    });
  }

  /* ================= 导航栏用户区渲染 ================= */
  function renderNav() {
    const box = document.getElementById('navUser');
    if (!box) return;
    if (!me) {
      box.innerHTML = `<button class="nav-login-btn" onclick="ShiyiAuth.show()">登录 / 注册</button>`;
      return;
    }
    const adminBadge = isAdmin() ? '<span class="nav-role nav-role-admin">管理员</span>' : '<span class="nav-role">队员</span>';
    box.innerHTML = `
      <button class="nav-user nav-user-btn" onclick="ShiyiAuth.showProfile()" title="个人中心" aria-label="打开${esc(me.nickname || me.email)}的个人中心">
        <span class="nav-avatar">${esc((me.nickname || me.email)[0])}</span>
        <span class="nav-name">${esc(me.nickname || me.email)}</span>${adminBadge}
      </button>`;
  }

  /* ================= 登录/注册弹层 ================= */
  function show() {
    const mask = document.getElementById('authMask');
    if (!mask) return;
    if (window.ShiyiUI) ShiyiUI.openLayer(mask); else mask.classList.add('on');
    pendingReg = null; setBusy(false);
    document.getElementById('authAccount').value = '';
    document.getElementById('authPwd').value = '';
    const codeInput = document.getElementById('authCode');
    const codeWrap = document.getElementById('authCodeWrap');
    if (codeInput) codeInput.value = '';
    if (codeWrap) codeWrap.hidden = true;
    document.getElementById('authMsg').textContent = '';
  }
  function hide() { const m = document.getElementById('authMask'); if (window.ShiyiUI) ShiyiUI.closeLayer(m); else if (m) m.classList.remove('on'); }
  function setMsg(t) { const el = document.getElementById('authMsg'); if (el) el.textContent = t; }

  /* 个人中心弹层 */
  function showProfile() {
    if (!me) return;
    const mask = document.getElementById('modalMask');
    const card = document.getElementById('modalCard');
    card.innerHTML = `
      <div class="modal-title" style="text-align:center;">${esc(me.nickname)}</div>
      <div class="modal-text" style="text-align:center;">
        ${isAdmin() ? '<span style="color:var(--red);font-weight:600;">管理员</span>' : '接力队员'} · 政绩值 ${me.score || 0}
      </div>
      ${isAdmin() ? '<button class="btn" style="width:100%;margin-bottom:10px;" onclick="ShiyiAuth.adminPanel()">管理后台</button>' : ''}
      <button class="btn btn-ghost" style="width:100%;" onclick="ShiyiAuth.logout();ShiyiAuth.closeProfile();">退出登录</button>`;
    if (window.ShiyiUI) ShiyiUI.openLayer(mask); else mask.classList.add('on');
  }
  function closeProfile() { const m = document.getElementById('modalMask'); if (window.ShiyiUI) ShiyiUI.closeLayer(m); else m.classList.remove('on'); }

  /* 管理后台：读取云端全站用户政绩榜 */
  async function adminPanel() {
    const card = document.getElementById('modalCard');
    card.innerHTML = '<div class="modal-title">管理后台 · 用户数据</div><div class="modal-text">读取中……</div>';
    let rows = '';
    if (cloud) {
      const { data, error } = await cloud.database
        .from('profiles').select('nickname, score, created_at')
        .order('score', { ascending: false }).limit(100);
      if (error) {
        rows = '<div style="padding:10px 0;font-size:14px;">读取失败，请稍后重试</div>';
      } else {
        rows = (data || []).map(u =>
          `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee;font-size:14px;">
            <span>${esc(u.nickname || '接力队员')}</span><span style="color:var(--gold-deep);">政绩值 ${Number(u.score) || 0}</span>
          </div>`).join('');
      }
    }
    card.innerHTML = `
      <div class="modal-title">管理后台 · 用户数据</div>
      <div class="modal-text" style="max-height:50vh;overflow-y:auto;">${rows || '暂无用户'}</div>
      <button class="btn btn-ghost" style="width:100%;" onclick="ShiyiAuth.closeProfile()">关闭</button>`;
  }

  function toast(t) { if (window.ShiyiUI) ShiyiUI.toast(t); }

  const authForm = document.getElementById('authForm');
  if (authForm) authForm.addEventListener('submit', event => {
    event.preventDefault();
    submit(event.submitter && event.submitter.dataset.mode === 'reg' ? 'reg' : 'login');
  });

  return { init, show, hide, submit, logout, current, isAdmin, addScore, saveFields, showProfile, closeProfile, adminPanel, onChange };
})();
