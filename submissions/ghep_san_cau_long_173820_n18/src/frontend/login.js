'use strict';
/* login.js - đăng nhập / đăng ký / xác thực OTP (FR-01) */
(function () {
  const params = new URLSearchParams(location.search);
  const next = /^[\w./-]+\.html$/.test(params.get('next') || '') ? params.get('next') : 'index.html';

  // Đã có vé thông hành còn hạn thì vào thẳng ứng dụng (không dùng api() để tránh vòng lặp khi vé đã hết hạn)
  if (Auth.token()) {
    ensureApiBase()
      .then(() => fetch(API_BASE + '/api/users/me', { headers: { Authorization: 'Bearer ' + Auth.token() } }))
      .then(r => { if (r.ok) location.replace(next); else Auth.clear(); })
      .catch(() => { /* máy chủ chưa bật: cứ hiện form */ });
  }

  const errBox = $('#form-error');
  const otpErr = $('#otp-error');
  let role = 'player';
  let pendingUser = null;
  let cooldownTimer = null;

  function showError(msg) { errBox.textContent = msg || ''; errBox.hidden = !msg; }
  function showOtpError(msg) { otpErr.textContent = msg || ''; otpErr.hidden = !msg; }

  function setTab(name) {
    const isLogin = name === 'login';
    $('#tab-login').classList.toggle('active', isLogin);
    $('#tab-register').classList.toggle('active', !isLogin);
    $('#tab-login').setAttribute('aria-selected', String(isLogin));
    $('#tab-register').setAttribute('aria-selected', String(!isLogin));
    $('#login-form').hidden = !isLogin;
    $('#register-form').hidden = isLogin;
    showError('');
  }
  $('#tab-login').addEventListener('click', () => setTab('login'));
  $('#tab-register').addEventListener('click', () => setTab('register'));
  if (params.get('tab') === 'register') setTab('register');

  // Chọn vai trò khi đăng ký
  const ROLE_HINT = {
    player: 'Tìm kèo, xin ghép sân và đánh giá sau trận.',
    host: 'Đăng kèo ghép sân và duyệt người chơi. Tài khoản chủ sân cần được Quản trị viên xác thực trước khi tạo kèo.',
  };
  $$('#reg-role button').forEach(btn => btn.addEventListener('click', () => {
    role = btn.dataset.role;
    $$('#reg-role button').forEach(b => b.classList.toggle('active', b === btn));
    $('#role-hint').textContent = ROLE_HINT[role];
  }));

  function finishLogin(data) {
    Auth.save(data.access_token, data.user);
    location.href = next;
  }

  /* ----- Bước OTP ----- */
  function startCooldown(sec) {
    const btn = $('#otp-resend');
    clearInterval(cooldownTimer);
    let left = sec;
    btn.disabled = true;
    const tick = () => {
      if (left <= 0) { clearInterval(cooldownTimer); btn.disabled = false; btn.textContent = 'Gửi lại mã'; return; }
      btn.textContent = `Gửi lại mã (${left}s)`;
      left -= 1;
    };
    tick();
    cooldownTimer = setInterval(tick, 1000);
  }

  function showOtpStep(username, info, note) {
    pendingUser = username;
    $('#step-auth').hidden = true;
    $('#step-otp').hidden = false;
    $('#otp-target').textContent = info ? info.dinh_danh_masked : 'số điện thoại / email bạn đã đăng ký';
    const demo = $('#otp-demo');
    demo.hidden = !(info && info.otp_demo);
    if (info && info.otp_demo) $('#otp-demo-code').textContent = info.otp_demo;
    showOtpError(note || '');
    $('#otp-input').value = '';
    startCooldown(30);
    setTimeout(() => $('#otp-input').focus(), 50);
  }

  $('#otp-fill').addEventListener('click', () => { $('#otp-input').value = $('#otp-demo-code').textContent; $('#otp-input').focus(); });
  $('#otp-back').addEventListener('click', () => {
    clearInterval(cooldownTimer);
    $('#step-otp').hidden = true;
    $('#step-auth').hidden = false;
  });
  $('#otp-resend').addEventListener('click', (e) => busy(e.currentTarget, async () => {
    try {
      const info = await api('/api/auth/resend-otp', { method: 'POST', body: { username: pendingUser }, auth: false });
      showOtpStep(pendingUser, info, '');
      toast('Đã gửi lại mã OTP.', 'success');
    } catch (err) { showOtpError(err.message); }
  }));

  $('#otp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    showOtpError('');
    const code = $('#otp-input').value.replace(/\D/g, '');
    if (code.length !== 6) return showOtpError('Mã OTP gồm đúng 6 chữ số.');
    await busy(e.submitter, async () => {
      try {
        const data = await api('/api/auth/verify-otp', { method: 'POST', body: { username: pendingUser, otp: code }, auth: false });
        finishLogin(data);
      } catch (err) { showOtpError(err.message); }
    });
  });

  /* ----- Đăng nhập ----- */
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    const id = $('#login-id').value.trim();
    const pw = $('#login-pass').value;
    if (!id || !pw) return showError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
    await busy(e.submitter, async () => {
      try {
        finishLogin(await api('/api/login', { method: 'POST', form: { username: id, password: pw }, auth: false }));
      } catch (err) {
        if (err.detail && err.detail.code === 'OTP_REQUIRED') {
          // Tài khoản đăng ký nhưng chưa xác thực: cấp lại OTP rồi chuyển sang bước nhập mã
          const username = err.detail.username;
          try { showOtpStep(username, await api('/api/auth/resend-otp', { method: 'POST', body: { username }, auth: false }), ''); }
          catch (e2) { showOtpStep(username, null, e2.message); }
        } else {
          showError(err.message);
        }
      }
    });
  });

  /* ----- Đăng ký ----- */
  $('#register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    const contact = $('#reg-contact').value.trim();
    const body = {
      username: $('#reg-user').value.trim(), password: $('#reg-pass').value, role,
      ho_ten: $('#reg-name').value.trim() || null,
      email: contact.includes('@') ? contact : null,
      phone: contact && !contact.includes('@') ? contact : null,
    };
    if (!body.username || !body.password) return showError('Vui lòng nhập tên đăng nhập và mật khẩu!');
    if (!contact) return showError('Vui lòng nhập Email hoặc Số điện thoại để nhận mã OTP!');
    await busy(e.submitter, async () => {
      try {
        const info = await api('/api/register', { method: 'POST', body, auth: false });
        showOtpStep(info.username, info, '');
      } catch (err) { showError(err.message); }
    });
  });

  /* ----- Quên mật khẩu (OTP) ----- */
  let forgotUser = null;
  const fgErr = $('#fg-error');
  const showFgError = (msg) => { fgErr.textContent = msg || ''; fgErr.hidden = !msg; };

  $('#link-forgot').addEventListener('click', () => {
    $('#step-auth').hidden = true; $('#step-forgot').hidden = false;
    $('#fg-form-1').hidden = false; $('#fg-form-2').hidden = true; $('#fg-resend').hidden = true;
    $('#fg-sub').textContent = 'Nhập tên đăng nhập, Email hoặc Số điện thoại. Chúng tôi sẽ gửi mã OTP để bạn đặt lại mật khẩu.';
    showFgError('');
    $('#fg-id').value = $('#login-id').value;
    setTimeout(() => $('#fg-id').focus(), 50);
  });
  $('#fg-back').addEventListener('click', () => { $('#step-forgot').hidden = true; $('#step-auth').hidden = false; setTab('login'); });

  async function sendForgot(identifier) {
    const info = await api('/api/auth/forgot-password', { method: 'POST', body: { identifier }, auth: false });
    forgotUser = info.username;
    $('#fg-form-1').hidden = true; $('#fg-form-2').hidden = false; $('#fg-resend').hidden = false;
    $('#fg-sub').textContent = `Mã OTP đã được gửi tới ${info.dinh_danh_masked}. Nhập mã và mật khẩu mới của bạn.`;
    $('#fg-demo').hidden = !info.otp_demo;
    if (info.otp_demo) $('#fg-demo-code').textContent = info.otp_demo;
    $('#fg-otp').value = '';
    setTimeout(() => $('#fg-otp').focus(), 50);
  }
  $('#fg-form-1').addEventListener('submit', async (e) => {
    e.preventDefault(); showFgError('');
    const id = $('#fg-id').value.trim();
    if (!id) return showFgError('Vui lòng nhập tên đăng nhập, Email hoặc Số điện thoại.');
    await busy(e.submitter, async () => { try { await sendForgot(id); } catch (err) { showFgError(err.message); } });
  });
  $('#fg-resend').addEventListener('click', (e) => busy(e.currentTarget, async () => {
    try { await sendForgot(forgotUser); toast('Đã gửi lại mã OTP.', 'success'); } catch (err) { showFgError(err.message); }
  }));
  $('#fg-fill').addEventListener('click', () => { $('#fg-otp').value = $('#fg-demo-code').textContent; $('#fg-pass').focus(); });
  $('#fg-form-2').addEventListener('submit', async (e) => {
    e.preventDefault(); showFgError('');
    const otp = $('#fg-otp').value.replace(/\D/g, ''), p1 = $('#fg-pass').value, p2 = $('#fg-pass2').value;
    if (otp.length !== 6) return showFgError('Mã OTP gồm đúng 6 chữ số.');
    if (p1.length < 6) return showFgError('Mật khẩu mới phải có ít nhất 6 ký tự.');
    if (p1 !== p2) return showFgError('Hai lần nhập mật khẩu mới chưa khớp.');
    await busy(e.submitter, async () => {
      try {
        const res = await api('/api/auth/reset-password', { method: 'POST', body: { username: forgotUser, otp, new_password: p1 }, auth: false });
        $('#step-forgot').hidden = true; $('#step-auth').hidden = false; setTab('login');
        $('#login-id').value = forgotUser; $('#login-pass').value = '';
        $('#login-pass').focus();
        toast(res.thong_bao, 'success', 5000);
      } catch (err) { showFgError(err.message); }
    });
  });

  /* ----- Tài khoản demo (chỉ khi máy chủ chạy chế độ phát triển) ----- */
  loadMeta().then((meta) => {
    if (!meta.otp_demo) return;
    $('#demo-box').hidden = false;
    $$('[data-demo]').forEach(btn => btn.addEventListener('click', () => {
      const [u, p] = btn.dataset.demo.split('|');
      setTab('login');
      $('#login-id').value = u;
      $('#login-pass').value = p;
      $('#login-form').requestSubmit();
    }));
  });
})();
