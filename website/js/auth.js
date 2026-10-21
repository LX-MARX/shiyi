/**
 * 文件名：js/auth.js
 * 功能描述：石椅答卷网站本地账号系统——注册/登录/退出、用户与管理员角色区分、
 *           登录态导航栏显示、个人政绩值与徽章归属账号。数据存 localStorage。
 * 作者：云上党旗飘项目组
 * 创建日期：2026-10-21
 * 版权声明：本代码为项目原创代码，用于软件著作权登记。
 */
window.ShiyiAuth = (function () {
  const KEY_USERS = 'shiyi_users';      // 账号库
  const KEY_SESSION = 'shiyi_session';  // 当前登录账号
  // 管理员账号名单（这些账号登录即为管理员）
  const ADMINS = ['admin', '1491569974@qq.com'];

  function loadUsers() { try { return JSON.parse(localStorage.getItem(KEY_USERS)) || {}; } catch (e) { return {}; } }
  function saveUsers(u) { localStorage.setItem(KEY_USERS, JSON.stringify(u)); }
  function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; } return 'h' + Math.abs(h); }

  /* 当前登录用户对象或 null */
  function current() {
    const acc = localStorage.getItem(KEY_SESSION);
    if (!acc) return null;
    const u = loadUsers()[acc];
    return u ? { account: acc, ...u } : null;
  }
  function isAdmin() { const c = current(); return c ? ADMINS.includes(c.account) || c.role === 'admin' : false; }

  /* 注册 */
  function register(account, password, nickname) {
    account = (account || '').trim();
    if (!account || !password) return { ok: false, msg: '账号和密码不能为空' };
    if (password.length < 6) return { ok: false, msg: '密码至少 6 位' };
    const users = loadUsers();
    if (users[account]) return { ok: false, msg: '该账号已注册' };
    users[account] = {
      nickname: nickname || account,
      pwd: hash(password),
      role: ADMINS.includes(account) ? 'admin' : 'user',
      score: 0, badges: [], created: Date.now(),
    };
    saveUsers(users);
    localStorage.setItem(KEY_SESSION, account);
    return { ok: true };
  }

  /* 登录 */
  function login(account, password) {
    account = (account || '').trim();
    const u = loadUsers()[account];
    if (!u) return { ok: false, msg: '账号不存在' };
    if (u.pwd !== hash(password)) return { ok: false, msg: '密码错误' };
    localStorage.setItem(KEY_SESSION, account);
    return { ok: true };
  }

  function logout() { localStorage.removeItem(KEY_SESSION); renderNav(); }

  /* 给当前用户加政绩值 */
  function addScore(n) {
    const c = current();
    if (!c) return;
    const users = loadUsers();
    users[c.account].score = (users[c.account].score || 0) + n;
    saveUsers(users);
  }

  /* ================= 导航栏用户区渲染 ================= */
  function renderNav() {
    const box = document.getElementById('navUser');
    if (!box) return;
    const c = current();
    if (!c) {
      box.innerHTML = `<button class="nav-login-btn" onclick="ShiyiAuth.show()">登录 / 注册</button>`;
      return;
    }
    const adminBadge = isAdmin() ? '<span class="nav-role nav-role-admin">管理员</span>' : '<span class="nav-role">队员</span>';
    box.innerHTML = `
      <span class="nav-user" onclick="ShiyiAuth.showProfile()" title="个人中心">
        <span class="nav-avatar">${(c.nickname || c.account)[0]}</span>
        <span class="nav-name">${c.nickname || c.account}</span>${adminBadge}
      </span>`;
  }

  /* ================= 登录/注册弹层 ================= */
  function show() {
    const mask = document.getElementById('authMask');
    if (!mask) return;
    mask.classList.add('on');
    document.getElementById('authAccount').value = '';
    document.getElementById('authPwd').value = '';
    document.getElementById('authMsg').textContent = '';
  }
  function hide() { const m = document.getElementById('authMask'); if (m) m.classList.remove('on'); }

  function submit(mode) {
    const acc = document.getElementById('authAccount').value;
    const pwd = document.getElementById('authPwd').value;
    const nick = document.getElementById('authNick') ? document.getElementById('authNick').value : '';
    const r = mode === 'reg' ? register(acc, pwd, nick) : login(acc, pwd);
    const msgEl = document.getElementById('authMsg');
    if (r.ok) {
      hide(); renderNav();
      if (window.ShiyiGame) { /* 登录后政绩值归入账号 */ }
      toast(isAdmin() ? '欢迎回来，管理员' : '登录成功');
    } else {
      msgEl.textContent = r.msg;
    }
  }

  /* 个人中心弹层 */
  function showProfile() {
    const c = current();
    if (!c) return;
    const mask = document.getElementById('modalMask');
    const card = document.getElementById('modalCard');
    card.innerHTML = `
      <div class="modal-title" style="text-align:center;">${c.nickname}</div>
      <div class="modal-text" style="text-align:center;">
        ${isAdmin() ? '<span style="color:var(--red);font-weight:600;">管理员</span>' : '接力队员'} · 政绩值 ${c.score || 0}
      </div>
      ${isAdmin() ? '<button class="btn" style="width:100%;margin-bottom:10px;" onclick="ShiyiAuth.adminPanel()">管理后台</button>' : ''}
      <button class="btn btn-ghost" style="width:100%;" onclick="ShiyiAuth.logout();ShiyiAuth.closeProfile();">退出登录</button>`;
    mask.classList.add('on');
  }
  function closeProfile() { document.getElementById('modalMask').classList.remove('on'); }

  /* 管理后台（简易） */
  function adminPanel() {
    const users = loadUsers();
    const rows = Object.entries(users).map(([acc, u]) =>
      `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee;font-size:14px;">
        <span>${u.nickname}${ADMINS.includes(acc) ? '（管理员）' : ''}</span><span style="color:var(--gold-deep);">政绩值 ${u.score || 0}</span>
      </div>`).join('');
    const card = document.getElementById('modalCard');
    card.innerHTML = `
      <div class="modal-title">管理后台 · 用户数据</div>
      <div class="modal-text" style="max-height:50vh;overflow-y:auto;">${rows || '暂无用户'}</div>
      <button class="btn btn-ghost" style="width:100%;" onclick="ShiyiAuth.closeProfile()">关闭</button>`;
  }

  function toast(t) { const el = document.getElementById('gameMsg') || null; if (el) { el.textContent = t; } }

  /* 初始化：渲染导航用户区 */
  function init() { renderNav(); }

  return { init, show, hide, submit, logout, current, isAdmin, addScore, showProfile, closeProfile, adminPanel };
})();
