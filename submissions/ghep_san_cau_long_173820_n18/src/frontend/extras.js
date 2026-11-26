'use strict';
/* =====================================================================
   extras.js - Lịch chơi (FR-09) | Đánh giá chéo (FR-10) | Thông báo | Cá nhân (FR-02) | Quản trị viên
   ===================================================================== */

/* ---------------------------------------------------------------------
   LỊCH CHƠI
   --------------------------------------------------------------------- */
let _bk = { bookings: [], tasks: [] };
App.state.bookingsTab = 'active';

App.views.bookings = { load: loadBookings };

async function loadBookings() {
  const root = $('#view-bookings');
  if (!App.state.user) return;
  if (!root.dataset.ready) {
    root.dataset.ready = '1';
    root.innerHTML = `
      <div class="page-head"><h1>Lịch chơi của tôi</h1><p class="sub">Theo dõi trạng thái các yêu cầu tham gia và đánh giá sau trận.</p></div>
      <div class="tabs" id="bk-tabs"></div>
      <div class="stack-list" id="bk-list"><div class="skeleton"></div></div>`;
  }
  try {
    const [b, r] = await Promise.all([api('/api/my-bookings'), api('/api/reviews/pending')]);
    _bk = { bookings: b.danh_sach, tasks: r.data };
    renderBookings();
  } catch (err) { $('#bk-list').innerHTML = `<div class="empty card"><h3>Không tải được lịch chơi</h3><p>${esc(err.message)}</p></div>`; }
}

function splitBookings() {
  const isActive = b => ['pending', 'approved'].includes(b.trang_thai) && !['finished', 'cancelled'].includes(b.trang_thai_keo);
  return { active: _bk.bookings.filter(isActive), history: _bk.bookings.filter(b => !isActive(b)) };
}

function renderBookings() {
  const { active, history } = splitBookings();
  const tab = App.state.bookingsTab;
  $('#bk-tabs').innerHTML = `
    <button class="tab ${tab === 'active' ? 'active' : ''}" data-action="bk-tab" data-tab="active">Sắp tới <span class="badge" ${active.length ? '' : 'hidden'}>${active.length}</span></button>
    <button class="tab ${tab === 'review' ? 'active' : ''}" data-action="bk-tab" data-tab="review">Cần đánh giá <span class="badge" ${_bk.tasks.length ? '' : 'hidden'}>${_bk.tasks.length}</span></button>
    <button class="tab ${tab === 'history' ? 'active' : ''}" data-action="bk-tab" data-tab="history">Lịch sử</button>`;
  const list = $('#bk-list');
  if (tab === 'review') {
    list.innerHTML = _bk.tasks.length ? _bk.tasks.map(reviewTaskCard).join('')
      : `<div class="empty card"><h3>Không có lượt nào cần đánh giá</h3><p>Sau khi trận kết thúc, bạn có thể đánh giá chủ nhóm / người chơi tại đây.</p></div>`;
  } else {
    const items = tab === 'history' ? history : active;
    list.innerHTML = items.length ? items.map(bookingCard).join('')
      : `<div class="empty card"><h3>${tab === 'history' ? 'Chưa có lịch sử' : 'Bạn chưa có lịch chơi sắp tới'}</h3>
          <p>${tab === 'history' ? '' : 'Tìm một kèo phù hợp và gửi yêu cầu tham gia.'}</p>
          ${tab === 'history' ? '' : '<button class="btn primary" data-action="nav" data-view="courts">Tìm kèo ngay</button>'}</div>`;
  }
}

// "Bắt đầu sau 5 giờ 20 phút" cho các lịch sắp tới
function countdownText(b) {
  if (!['pending', 'approved'].includes(b.trang_thai) || ['finished', 'cancelled'].includes(b.trang_thai_keo)) return '';
  const ms = Date.parse(`${b.ngay_choi}T${b.gio_bat_dau}:00+07:00`) - Date.now();
  if (ms <= 0) return 'Đang diễn ra';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `Bắt đầu sau ${mins} phút`;
  if (mins < 24 * 60) return `Bắt đầu sau ${Math.floor(mins / 60)} giờ${mins % 60 ? ' ' + (mins % 60) + ' phút' : ''}`;
  return `Bắt đầu sau ${Math.floor(mins / 1440)} ngày`;
}

// Tạo file lịch .ics (có nhắc trước 2 giờ) để thêm vào Google Calendar / Lịch iPhone - nhắc nhở ngay cả khi không mở ứng dụng
const icsEscape = t => String(t || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const icsStamp = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
function buildIcs(b) {
  const at = (date, time) => icsStamp(new Date(Date.parse(`${date}T${time}:00+07:00`)));
  const desc = [`Chủ nhóm: ${b.host.ho_ten}`, b.host_phone ? `Liên hệ: ${b.host_phone}` : '', `Số chỗ: ${b.so_luong_slot_da_dat}`,
    b.tong_tien_tam_tinh ? `Chi phí dự kiến: ${vnd(b.tong_tien_tam_tinh)}` : ''].filter(Boolean).join('\n');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Badminton Connect//VI', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:booking-${b.ma_don_hang}@badminton-connect`, `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${at(b.ngay_choi, b.gio_bat_dau)}`, `DTEND:${at(b.ngay_choi, b.gio_ket_thuc)}`,
    `SUMMARY:${icsEscape('Cầu lông – ' + b.ten_san)}`, `LOCATION:${icsEscape(b.dia_chi || b.khu_vuc || '')}`, `DESCRIPTION:${icsEscape(desc)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Sắp đến giờ chơi cầu lông', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n') + '\r\n';
}

function bookingCard(b) {
  const pay = b.thanh_toan;
  const countdown = countdownText(b);
  const tone = { pending: 'warn', approved: 'good', rejected: 'bad', cancelled: 'muted' }[b.trang_thai];
  const hint = {
    pending: 'Đang chờ chủ nhóm duyệt. Bạn sẽ nhận thông báo ngay khi có phản hồi.',
    approved: 'Bạn đã được duyệt. Hãy đến đúng giờ nhé!',
    rejected: 'Chủ nhóm chưa nhận yêu cầu này. Slot và tiền cọc (nếu có) đã được hoàn lại.',
    cancelled: 'Yêu cầu đã được hủy.',
  }[b.trang_thai];
  return `
  <article class="card item">
    <div class="item-head">
      <div>
        <div class="item-title">${esc(b.ten_san)}</div>
        <div class="kv"><span>${icon('calendar', 14)} ${esc(fmtDay(b.ngay_choi))}</span><span>${icon('clock', 14)} ${esc(b.gio_bat_dau)} – ${esc(b.gio_ket_thuc)}</span><span>${icon('pin', 14)} ${esc(b.dia_chi || b.khu_vuc || '')}</span></div>
      </div>
      ${pill(b.trang_thai, b.nhan_trang_thai)}
    </div>
    <div class="notice ${tone === 'muted' ? '' : tone}"><div>${esc(hint)}${b.trang_thai_keo === 'cancelled' && b.trang_thai !== 'cancelled' ? ' Kèo này đã bị chủ nhóm hủy.' : ''}</div></div>
    ${countdown ? `<div><span class="tag shuttle">${icon('clock', 13)} ${esc(countdown)}</span></div>` : ''}
    <div class="kv"><span>${b.so_luong_slot_da_dat} chỗ</span><span>Tạm tính ${vnd(b.tong_tien_tam_tinh)}</span>${pay ? `<span>${icon('wallet', 14)} ${esc(pay.trang_thai_text)}: ${vnd(pay.so_tien)} (${esc(pay.phuong_thuc_text)})</span>` : ''}</div>
    ${b.loi_nhan ? `<div class="req-quote">“${esc(b.loi_nhan)}”</div>` : ''}
    <div class="person" style="padding:0"><button class="host-chip" data-action="open-profile" data-id="${b.host.id}">${avatar(b.host, 36)}<span class="stack"><span class="nm">Chủ nhóm: ${esc(b.host.ho_ten)}</span>${repBadge(b.host)}</span></button></div>
    ${b.trang_thai === 'approved' && b.host_phone ? `<div class="contact">${icon('phone', 18)}<span>Liên hệ chủ nhóm: <a href="tel:${esc(b.host_phone)}">${esc(b.host_phone)}</a></span></div>` : ''}
    <div class="item-actions">
      <button class="btn sm" data-action="open-court" data-id="${b.court_id}">Xem kèo</button>
      ${b.trang_thai === 'approved' && !['finished', 'cancelled'].includes(b.trang_thai_keo) ? `<button class="btn sm" data-action="add-cal" data-id="${b.ma_don_hang}">${icon('calplus', 15)} Thêm vào lịch</button>` : ''}
      ${b.co_the_huy ? `<button class="btn sm danger-ghost" data-action="cancel-booking" data-id="${b.ma_don_hang}" data-refund="${b.se_duoc_hoan_coc ? '1' : '0'}" data-deposit="${pay && pay.trang_thai === 'paid' ? '1' : '0'}">Hủy tham gia</button>` : ''}
      ${b.co_the_danh_gia ? `<button class="btn sm primary" data-action="bk-tab" data-tab="review">${icon('star', 15)} Đánh giá</button>` : ''}
      ${b.da_danh_gia ? '<span class="tag">Đã đánh giá</span>' : ''}
    </div>
  </article>`;
}

function reviewTaskCard(t) {
  const toHost = t.loai === 'player_to_host';
  return `
  <article class="card item">
    <div class="item-head">
      <div><div class="item-title">${esc(t.court.ten_san)}</div>
        <div class="kv"><span>${icon('calendar', 14)} ${esc(fmtDay(t.court.ngay_choi))}</span><span>${icon('clock', 14)} ${esc(t.court.gio_bat_dau)} – ${esc(t.court.gio_ket_thuc)}</span></div></div>
      <span class="tag shuttle">${toHost ? 'Đánh giá chủ nhóm' : 'Đánh giá người chơi'}</span>
    </div>
    <div class="person" style="padding:0">${avatar(t.doi_tuong, 40)}<div class="grow"><div class="nm">${esc(t.doi_tuong.ho_ten)}</div>${repBadge(t.doi_tuong)}</div>
      <button class="btn primary sm" data-action="open-review" data-id="${t.booking_id}">${icon('star', 15)} Đánh giá</button></div>
  </article>`;
}

Object.assign(App.actions, {
  'add-cal': (el) => {
    const b = _bk.bookings.find(x => x.ma_don_hang === Number(el.dataset.id));
    if (!b) return;
    downloadFile(`keo-cau-long-${b.ngay_choi}.ics`, 'text/calendar;charset=utf-8', buildIcs(b));
    toast('Đã tạo file lịch. Mở file để thêm vào Google Calendar / Lịch iPhone (có nhắc trước 2 giờ).', 'success', 5500);
  },
  'bk-tab': (el) => { App.state.bookingsTab = el.dataset.tab; if (App.state.view !== 'bookings') navigate('bookings'); else renderBookings(); closeAllModals(); },
  'cancel-booking': async (el) => {
    const d = el.dataset;
    const policy = d.deposit === '1'
      ? (d.refund === '1' ? 'Tiền cọc sẽ được hoàn lại đầy đủ.' : 'Do hủy sát giờ chơi, tiền cọc sẽ KHÔNG được hoàn lại.')
      : '';
    if (!await confirmDialog({ title: 'Hủy tham gia', message: `Bạn có chắc chắn muốn hủy lượt ghép sân này?\n${policy}`.trim(), confirmText: 'Hủy tham gia', cancelText: 'Giữ lại', danger: true })) return;
    const res = await api('/api/bookings/' + d.id, { method: 'DELETE' });
    toast(res.thong_bao, 'success', 5500);
    loadBookings(); loadCourts();
  },
  'open-review': (el) => openReview(_bk.tasks.find(t => t.booking_id === Number(el.dataset.id))),
});

/* ---------- Đánh giá chéo sau trận (FR-10) ---------- */
function openReview(task) {
  if (!task) return;
  const toHost = task.loai === 'player_to_host';
  const values = {};
  const rows = task.tieu_chi.map(c => `
    <div class="rate-row" data-crit="${esc(c.ma)}"><span>${esc(c.ten)}</span>
      <span class="stars" role="radiogroup" aria-label="${esc(c.ten)}">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-star="${n}" role="radio" aria-checked="false" aria-label="${n} sao">${icon('star', 24)}</button>`).join('')}</span></div>`).join('');
  const m = openModal({
    title: toHost ? 'Đánh giá chủ nhóm' : 'Đánh giá người chơi', size: 'sm',
    body: `
      <div class="person" style="padding-top:0">${avatar(task.doi_tuong, 44)}<div class="grow"><div class="nm">${esc(task.doi_tuong.ho_ten)}</div><div class="muted small">${esc(task.court.ten_san)} · ${esc(fmtDay(task.court.ngay_choi))}</div></div></div>
      ${task.cho_phep_bung_keo ? `<label class="check" style="margin:6px 0 10px"><input type="checkbox" id="rv-noshow"> Người này đã bùng kèo (không đến)</label>` : ''}
      <div id="rv-rows">${rows}</div>
      <div class="field mt"><label for="rv-comment">Nhận xét (không bắt buộc)</label><textarea id="rv-comment" maxlength="500" placeholder="Chia sẻ trải nghiệm của bạn…"></textarea></div>
      <div class="form-error" id="rv-err" role="alert" hidden></div>`,
    footer: '<button class="btn ghost" data-modal-close>Để sau</button><button class="btn primary" id="rv-send">Gửi đánh giá</button>',
  });
  $$('.rate-row', m.el).forEach(row => {
    const stars = $$('[data-star]', row);
    stars.forEach(btn => btn.addEventListener('click', () => {
      values[row.dataset.crit] = Number(btn.dataset.star);
      stars.forEach(b => { const on = Number(b.dataset.star) <= values[row.dataset.crit]; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(Number(b.dataset.star) === values[row.dataset.crit])); });
    }));
  });
  const noShow = $('#rv-noshow', m.el);
  if (noShow) noShow.addEventListener('change', () => { $('#rv-rows', m.el).style.opacity = noShow.checked ? .4 : 1; $('#rv-rows', m.el).style.pointerEvents = noShow.checked ? 'none' : ''; });
  const send = $('#rv-send', m.el);
  send.addEventListener('click', () => busy(send, async () => {
    const err = $('#rv-err', m.el);
    const bung = !!(noShow && noShow.checked);
    if (!bung && task.tieu_chi.some(c => !values[c.ma])) { err.textContent = 'Vui lòng chấm đủ số sao cho tất cả tiêu chí.'; err.hidden = false; return; }
    try {
      const res = await api('/api/reviews', { method: 'POST', body: { booking_id: task.booking_id, ...values, bung_keo: bung, binh_luan: $('#rv-comment', m.el).value.trim() || null } });
      m.close(); toast(res.thong_bao, 'success'); loadBookings();
    } catch (e) { err.textContent = e.message; err.hidden = false; }
  }));
}

/* ---------------------------------------------------------------------
   THÔNG BÁO
   --------------------------------------------------------------------- */
App.views.notifications = { load: loadNotifications };

async function loadNotifications() {
  const root = $('#view-notifications');
  if (!App.state.user) return;
  if (!root.dataset.ready) {
    root.dataset.ready = '1';
    root.innerHTML = `
      <div class="page-head row between"><div><h1>Thông báo</h1><p class="sub">Yêu cầu mới, kết quả duyệt, nhắc nhở trước giờ chơi…</p></div>
        <button class="btn sm" data-action="read-all">Đánh dấu đã đọc tất cả</button></div>
      <div id="nt-perm"></div>
      <div class="stack-list" id="nt-list"><div class="skeleton"></div></div>`;
  }
  renderNotifPerm();
  try {
    const res = await api('/api/notifications?limit=60');
    setUnread(res.unread);
    $('#nt-list').innerHTML = res.data.length ? res.data.map(notiCard).join('')
      : `<div class="empty card"><h3>Chưa có thông báo nào</h3><p>Thông báo sẽ xuất hiện tại đây và hiện ngay khi bạn đang mở ứng dụng.</p></div>`;
  } catch (err) { $('#nt-list').innerHTML = `<div class="empty card"><h3>Không tải được thông báo</h3><p>${esc(err.message)}</p></div>`; }
}

function renderNotifPerm() {
  const box = $('#nt-perm');
  if (!box) return;
  if (!('Notification' in window) || Notification.permission !== 'default') { box.innerHTML = ''; return; }
  box.innerHTML = `<div class="notice" style="margin:0 0 12px">${icon('bell', 18)}<div style="flex:1">Bật thông báo của trình duyệt để nhận tin cả khi bạn đang ở tab khác (cần để sẵn trang này mở).
    <div style="margin-top:8px"><button class="btn sm secondary" data-action="enable-notif">Bật thông báo</button></div></div></div>`;
}

function notiCard(n) {
  return `
  <article class="card item ${n.da_doc ? '' : 'unread'}" data-action="open-noti" data-id="${n.id}" data-type="${esc(n.loai)}" data-court="${n.court_id || ''}" style="cursor:pointer">
    <div class="item-head"><div class="item-title">${esc(n.tieu_de)}</div><span class="muted small nowrap">${esc(timeAgo(n.created_at))}</span></div>
    ${n.noi_dung ? `<div class="muted">${esc(n.noi_dung)}</div>` : ''}
  </article>`;
}

Object.assign(App.actions, {
  'enable-notif': async () => {
    const p = await Notification.requestPermission();
    toast(p === 'granted' ? 'Đã bật thông báo trình duyệt.' : 'Bạn chưa cho phép thông báo.', p === 'granted' ? 'success' : 'info');
    renderNotifPerm();
  },
  'read-all': async () => { await api('/api/notifications/read-all', { method: 'POST' }); setUnread(0); loadNotifications(); },
  'open-noti': async (el) => {
    const d = el.dataset;
    if (el.classList.contains('unread')) {
      el.classList.remove('unread');
      api('/api/notifications/' + d.id + '/read', { method: 'POST' }).then(() => setUnread(App.state.unread - 1)).catch(() => {});
    }
    const type = d.type, court = Number(d.court) || null;
    if (type === 'request' && court) return openRequests(court);
    if (type === 'review') { App.state.bookingsTab = 'review'; return navigate('bookings'); }
    if (['approved', 'rejected', 'cancelled', 'court_cancelled', 'expired', 'reminder'].includes(type) && App.state.user.role !== 'host') { App.state.bookingsTab = 'active'; return navigate('bookings'); }
    if (court) return openCourtDetail(court);
  },
});

/* ---------------------------------------------------------------------
   CÁ NHÂN (FR-02)
   --------------------------------------------------------------------- */
App.views.profile = { load: loadProfile };

async function loadProfile() {
  const root = $('#view-profile');
  if (!App.state.user) return;
  let u;
  try { u = await api('/api/users/me'); Auth.setUser(u); App.state.user = u; }
  catch (err) { root.innerHTML = `<div class="empty card"><h3>Không tải được hồ sơ</h3><p>${esc(err.message)}</p></div>`; return; }
  const roleText = u.role === 'admin' ? 'Quản trị viên' : (u.role === 'host' ? 'Chủ nhóm / Chủ sân' : 'Người chơi');
  root.innerHTML = `
    <div class="page-head"><h1>Cá nhân</h1><p class="sub">Hồ sơ giúp chủ nhóm yên tâm khi duyệt bạn vào kèo.</p></div>
    <div class="card profile-card">
      <div class="profile-top">${avatar(u, 64)}<div><div class="item-title" style="font-size:20px">${esc(u.ho_ten || u.username)}</div>
        <div class="muted">@${esc(u.username)} · ${roleText}${u.role === 'host' ? (u.host_verified ? ' · đã xác thực' : ' · chờ xác thực') : ''}</div></div></div>
      <div class="rep-box">
        <div class="rep-score">${u.so_danh_gia > 0 ? Number(u.diem_uy_tin).toFixed(1) : '—'}</div>
        <div>${repBadge(u, false)}</div>
        <div class="muted small">${u.so_danh_gia} đánh giá · ${u.so_bung_keo} lần bùng kèo</div>
      </div>
      ${u.role === 'host' && !u.host_verified ? `<div class="notice warn">${icon('shield', 18)}<div>Tài khoản chủ sân đang chờ Quản trị viên xác thực. Bạn sẽ tạo được kèo ngay khi được duyệt.</div></div>` : ''}
      <form id="pf-form" novalidate>
        <div class="field"><label for="pf-name">Họ và tên</label><input id="pf-name" maxlength="60" value="${esc(u.ho_ten || '')}"></div>
        <div class="grid-2">
          <div class="field"><label for="pf-phone">Số điện thoại</label><input id="pf-phone" inputmode="tel" value="${esc(u.phone || '')}" placeholder="0912345678"></div>
          <div class="field"><label for="pf-email">Email</label><input id="pf-email" inputmode="email" value="${esc(u.email || '')}" placeholder="ban@gmail.com"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label for="pf-area">Khu vực thường chơi</label><select id="pf-area">${districtOptions(u.khu_vuc_thuong_choi, 'Chưa chọn')}</select></div>
          <div class="field"><label for="pf-level">Trình độ tự đánh giá</label><select id="pf-level">${levelOptions(u.trinh_do)}</select></div>
        </div>
        <p class="hint" style="margin:-4px 0 12px">Số điện thoại chỉ hiển thị cho người còn lại sau khi yêu cầu tham gia được duyệt.</p>
        <div class="form-error" id="pf-err" role="alert" hidden></div>
        <button class="btn primary block" type="submit">Lưu hồ sơ</button>
      </form>
      ${u.role === 'player' ? `<div class="notice good">${icon('court', 18)}<div style="flex:1">Bạn muốn tự đăng kèo ghép sân? Đăng ký làm Chủ nhóm / Chủ sân (cần Quản trị viên xác thực).<div style="margin-top:8px"><button class="btn sm secondary" data-action="request-host">Đăng ký làm chủ sân</button></div></div></div>` : ''}
      <details class="demo-box" style="margin:0"><summary>${icon('lock', 15)} Đổi mật khẩu</summary>
        <form id="pw-form" novalidate style="margin-top:12px">
          <div class="field"><label for="pw-old">Mật khẩu hiện tại</label><input id="pw-old" type="password" autocomplete="current-password"></div>
          <div class="grid-2">
            <div class="field"><label for="pw-new">Mật khẩu mới</label><input id="pw-new" type="password" autocomplete="new-password" placeholder="Ít nhất 6 ký tự"></div>
            <div class="field"><label for="pw-new2">Nhập lại mật khẩu mới</label><input id="pw-new2" type="password" autocomplete="new-password"></div>
          </div>
          <div class="form-error" id="pw-err" role="alert" hidden></div>
          <button class="btn block" type="submit">Cập nhật mật khẩu</button>
        </form></details>
      <button class="btn danger-ghost block" data-action="logout">${icon('logout', 16)} Đăng xuất</button>
    </div>`;
  $('#pw-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#pw-err'); err.hidden = true;
    const oldPw = $('#pw-old').value, newPw = $('#pw-new').value;
    if (!oldPw || !newPw) { err.textContent = 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.'; err.hidden = false; return; }
    if (newPw !== $('#pw-new2').value) { err.textContent = 'Hai lần nhập mật khẩu mới chưa khớp.'; err.hidden = false; return; }
    await busy(e.submitter, async () => {
      try {
        const res = await api('/api/users/me/change-password', { method: 'POST', body: { old_password: oldPw, new_password: newPw } });
        toast(res.thong_bao, 'success'); e.target.reset();
      } catch (ex) { err.textContent = ex.message; err.hidden = false; }
    });
  });
  $('#pf-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#pf-err'); err.hidden = true;
    await busy(e.submitter, async () => {
      try {
        const me = await api('/api/users/me', { method: 'PUT', body: {
          ho_ten: $('#pf-name').value, phone: $('#pf-phone').value, email: $('#pf-email').value,
          khu_vuc_thuong_choi: $('#pf-area').value, trinh_do: Number($('#pf-level').value) } });
        Auth.setUser(me); App.state.user = me; renderChrome();
        toast('Đã lưu hồ sơ.', 'success');
      } catch (ex) { err.textContent = ex.message; err.hidden = false; }
    });
  });
}

App.actions['request-host'] = async () => {
  if (!await confirmDialog({ title: 'Đăng ký làm chủ sân', message: 'Yêu cầu của bạn sẽ được gửi tới Quản trị viên để xác thực. Sau khi được duyệt, bạn có thể tạo kèo ghép sân.', confirmText: 'Gửi yêu cầu' })) return;
  const res = await api('/api/users/me/request-host', { method: 'POST' });
  Auth.setUser(res.user); App.state.user = res.user;
  toast(res.thong_bao, 'success', 5500);
  renderChrome(); loadProfile();
};

/* ---------------------------------------------------------------------
   QUẢN TRỊ VIÊN
   --------------------------------------------------------------------- */
App.views.admin = { load: loadAdmin };
let _adminTab = 'overview';

async function loadAdmin() {
  const root = $('#view-admin');
  const u = App.state.user;
  if (!u || u.role !== 'admin') return;
  if (!root.dataset.ready) {
    root.dataset.ready = '1';
    root.innerHTML = `
      <div class="page-head"><h1>Quản trị hệ thống</h1><p class="sub">Xác thực chủ sân, xử lý báo cáo vi phạm và kiểm duyệt kèo.</p></div>
      <div class="tabs" id="ad-tabs"></div><div id="ad-body"></div>`;
  }
  renderAdminTabs();
  const body = $('#ad-body');
  body.innerHTML = '<div class="skeleton"></div>';
  try {
    if (_adminTab === 'overview') await adminOverview(body);
    else if (_adminTab === 'users') await adminUsers(body);
    else if (_adminTab === 'reports') await adminReports(body);
    else await adminCourts(body);
  } catch (err) { body.innerHTML = `<div class="empty card"><h3>Không tải được dữ liệu</h3><p>${esc(err.message)}</p></div>`; }
}

function renderAdminTabs() {
  const tabs = [['overview', 'Tổng quan'], ['users', 'Người dùng'], ['reports', 'Báo cáo vi phạm'], ['courts', 'Kèo']];
  $('#ad-tabs').innerHTML = tabs.map(([id, label]) => `<button class="tab ${_adminTab === id ? 'active' : ''}" data-action="ad-tab" data-tab="${id}">${esc(label)}</button>`).join('');
}
App.actions['ad-tab'] = (el) => { _adminTab = el.dataset.tab; loadAdmin(); };

async function adminOverview(body) {
  const s = await api('/api/admin/stats');
  const tile = (n, t, alert) => `<div class="card stat ${alert ? 'alert' : ''}"><div class="n">${n}</div><div class="t">${esc(t)}</div></div>`;
  body.innerHTML = `
    <div class="stat-grid">
      ${tile(s.nguoi_dung.tong, 'Người dùng')}
      ${tile(s.nguoi_dung.host_cho_xac_thuc, 'Chủ sân chờ xác thực', s.nguoi_dung.host_cho_xac_thuc > 0)}
      ${tile(s.bao_cao_dang_cho, 'Báo cáo chờ xử lý', s.bao_cao_dang_cho > 0)}
      ${tile(s.nguoi_dung.bi_khoa, 'Tài khoản bị khóa')}
      ${tile(s.keo.dang_mo, 'Kèo đang mở')}
      ${tile(s.booking.pending, 'Yêu cầu chờ duyệt')}
      ${tile(s.booking.approved, 'Lượt tham gia đã duyệt')}
      ${tile(s.luot_bung_keo, 'Lượt bùng kèo ghi nhận')}
      ${tile(s.danh_gia, 'Lượt đánh giá')}
      ${tile(vnd(s.tien_coc_dang_giu), 'Tiền cọc đang giữ (giả lập)')}
    </div>`;
}

async function adminUsers(body, filter) {
  const f = filter || { q: '', status: '' };
  const res = await api('/api/admin/users?' + new URLSearchParams({ q: f.q, status: f.status }));
  body.innerHTML = `
    <div class="toolbar">
      <input id="au-q" type="search" placeholder="Tìm theo tên, email, số điện thoại…" value="${esc(f.q)}">
      <select id="au-status"><option value="">Tất cả</option><option value="pending_host" ${f.status === 'pending_host' ? 'selected' : ''}>Chủ sân chờ xác thực</option><option value="locked" ${f.status === 'locked' ? 'selected' : ''}>Đang bị khóa</option><option value="no_show" ${f.status === 'no_show' ? 'selected' : ''}>Từng bùng kèo</option></select>
    </div>
    <div class="stack-list">${res.data.map(adminUserCard).join('') || '<div class="empty card"><h3>Không có người dùng phù hợp</h3></div>'}</div>`;
  const redo = () => adminUsers(body, { q: $('#au-q').value.trim(), status: $('#au-status').value });
  $('#au-status').addEventListener('change', redo);
  $('#au-q').addEventListener('keydown', (e) => { if (e.key === 'Enter') redo(); });
}

function adminUserCard(u) {
  const roleText = { admin: 'Quản trị viên', host: 'Chủ sân', player: 'Người chơi' }[u.role];
  return `
  <article class="card item">
    <div class="item-head">
      <button class="host-chip" data-action="open-profile" data-id="${u.id}">${avatar(u, 42)}<span class="stack"><span class="nm" style="max-width:240px">${esc(u.ho_ten)} <span class="muted">@${esc(u.username)}</span></span>${repBadge(u)}</span></button>
      <span class="row" style="gap:6px">${pill(u.is_active ? 'open' : 'cancelled', u.is_active ? roleText : 'Bị khóa')}${u.role === 'host' ? pill(u.host_verified ? 'approved' : 'pending', u.host_verified ? 'Đã xác thực' : 'Chờ xác thực') : ''}</span>
    </div>
    <div class="kv"><span>${icon('phone', 14)} ${esc(u.phone || '—')}</span><span>${esc(u.email || '—')}</span><span>Tham gia ${esc(timeAgo(u.created_at))}</span></div>
    ${u.lock_reason ? `<div class="notice bad"><div>Lý do khóa: ${esc(u.lock_reason)}</div></div>` : ''}
    ${u.role === 'admin' ? '' : `<div class="item-actions">
      ${u.role === 'host' ? (u.host_verified ? `<button class="btn sm" data-action="ad-user" data-op="revoke-host" data-id="${u.id}">Thu hồi xác thực</button>` : `<button class="btn sm primary" data-action="ad-user" data-op="verify-host" data-id="${u.id}">${icon('shield', 15)} Xác thực chủ sân</button>`) : ''}
      ${u.is_active ? `<button class="btn sm danger-ghost" data-action="ad-lock" data-id="${u.id}" data-name="${esc(u.username)}">Khóa tài khoản</button>` : `<button class="btn sm" data-action="ad-user" data-op="unlock" data-id="${u.id}">Mở khóa</button>`}
    </div>`}
  </article>`;
}

Object.assign(App.actions, {
  'ad-user': (el) => busy(el, async () => {
    const res = await api(`/api/admin/users/${el.dataset.id}/${el.dataset.op}`, { method: 'POST' });
    toast(res.thong_bao, 'success'); loadAdmin();
  }),
  'ad-lock': async (el) => {
    const reason = await askText({ title: `Khóa tài khoản @${el.dataset.name}`, label: 'Lý do khóa (người dùng sẽ nhìn thấy khi đăng nhập)', confirmText: 'Khóa tài khoản', danger: true });
    if (reason === null) return;
    const res = await api(`/api/admin/users/${el.dataset.id}/lock`, { method: 'POST', body: { ly_do: reason || null } });
    toast(res.thong_bao, 'success'); loadAdmin();
  },
});

async function adminReports(body, status) {
  const st = status || 'open';
  const res = await api('/api/admin/reports?status=' + st);
  body.innerHTML = `
    <div class="toolbar"><select id="ar-status"><option value="open" ${st === 'open' ? 'selected' : ''}>Đang chờ xử lý</option><option value="resolved" ${st === 'resolved' ? 'selected' : ''}>Đã xác nhận vi phạm</option><option value="dismissed" ${st === 'dismissed' ? 'selected' : ''}>Đã bác bỏ</option><option value="all" ${st === 'all' ? 'selected' : ''}>Tất cả</option></select></div>
    <div class="stack-list">${res.data.map(reportCard).join('') || '<div class="empty card"><h3>Không có báo cáo nào</h3></div>'}</div>`;
  $('#ar-status').addEventListener('change', (e) => adminReports(body, e.target.value));
  App.state.reports = res.data;
}

function reportCard(r) {
  const tone = { open: 'pending', resolved: 'approved', dismissed: 'muted' }[r.trang_thai];
  const label = { open: 'Chờ xử lý', resolved: 'Đã xác nhận', dismissed: 'Đã bác bỏ' }[r.trang_thai];
  return `
  <article class="card item">
    <div class="item-head"><div><div class="item-title">${esc(r.ly_do_text)}</div><div class="muted small">${esc(timeAgo(r.created_at))}</div></div>${pill(tone, label)}</div>
    <div class="kv"><span>Người báo cáo: <b>${esc(r.reporter.ho_ten)}</b></span>${r.target_user ? `<span>Bị báo cáo: <b>${esc(r.target_user.ho_ten)}</b> ${repBadge(r.target_user, false)}</span>` : ''}</div>
    ${r.court ? `<div class="kv"><span>${icon('court', 14)} Kèo: ${esc(r.court.ten_san)} · ${esc(fmtDay(r.court.ngay_choi))} · ${esc(r.court.nhan_trang_thai)}</span></div>` : ''}
    ${r.mo_ta ? `<div class="req-quote">“${esc(r.mo_ta)}”</div>` : ''}
    ${r.ghi_chu_admin ? `<div class="notice"><div>Ghi chú xử lý: ${esc(r.ghi_chu_admin)}</div></div>` : ''}
    ${r.trang_thai === 'open' ? `<div class="item-actions"><button class="btn sm primary" data-action="ad-resolve" data-id="${r.id}">Xử lý báo cáo</button></div>` : ''}
  </article>`;
}

App.actions['ad-resolve'] = (el) => {
  const r = (App.state.reports || []).find(x => x.id === Number(el.dataset.id));
  if (!r) return;
  const m = openModal({
    title: 'Xử lý báo cáo', size: 'sm',
    body: `<p class="muted" style="margin-bottom:10px">${esc(r.ly_do_text)} · ${esc(r.reporter.ho_ten)} báo cáo ${esc(r.target_user ? r.target_user.ho_ten : '')}</p>
      <div class="field"><label for="rs-note">Ghi chú xử lý (người báo cáo sẽ nhận được)</label><textarea id="rs-note" maxlength="500"></textarea></div>
      ${r.target_user ? '<label class="check" style="margin-bottom:10px"><input type="checkbox" id="rs-lock"> Khóa tài khoản người bị báo cáo</label>' : ''}
      ${r.court && !['cancelled', 'finished'].includes(r.court.trang_thai_hien_thi) ? '<label class="check"><input type="checkbox" id="rs-cancel"> Hủy kèo vi phạm (hoàn cọc cho người chơi)</label>' : ''}
      <div class="form-error mt" id="rs-err" role="alert" hidden></div>`,
    footer: '<button class="btn ghost" id="rs-dismiss">Bác bỏ</button><button class="btn danger" id="rs-confirm">Xác nhận vi phạm</button>',
  });
  const act = (quyet) => (e) => busy(e.currentTarget, async () => {
    try {
      const lock = $('#rs-lock', m.el), cancel = $('#rs-cancel', m.el);
      const res = await api(`/api/admin/reports/${r.id}/resolve`, { method: 'POST', body: {
        quyet_dinh: quyet, ghi_chu_admin: $('#rs-note', m.el).value.trim() || null,
        khoa_nguoi_bi_bao_cao: quyet === 'resolved' && !!(lock && lock.checked), huy_keo: quyet === 'resolved' && !!(cancel && cancel.checked) } });
      m.close(); toast(res.thong_bao, 'success'); loadAdmin();
    } catch (err) { const b = $('#rs-err', m.el); b.textContent = err.message; b.hidden = false; }
  });
  $('#rs-dismiss', m.el).addEventListener('click', act('dismissed'));
  $('#rs-confirm', m.el).addEventListener('click', act('resolved'));
};

async function adminCourts(body, f) {
  const filt = f || { q: '', status: 'upcoming' };
  const res = await api('/api/admin/courts?' + new URLSearchParams(filt));
  body.innerHTML = `
    <div class="toolbar"><input id="ac-q" type="search" placeholder="Tìm theo tên sân, chủ nhóm…" value="${esc(filt.q)}">
      <select id="ac-status"><option value="upcoming" ${filt.status === 'upcoming' ? 'selected' : ''}>Sắp tới</option><option value="cancelled" ${filt.status === 'cancelled' ? 'selected' : ''}>Đã hủy</option><option value="" ${filt.status === '' ? 'selected' : ''}>Tất cả</option></select></div>
    <div class="stack-list">${res.data.map(c => `
      <article class="card item">
        <div class="item-head"><div><div class="item-title">${esc(c.ten_san)}</div>
          <div class="kv"><span>${icon('calendar', 14)} ${esc(fmtDay(c.ngay_choi))} · ${esc(c.gio_bat_dau)}–${esc(c.gio_ket_thuc)}</span><span>${icon('pin', 14)} ${esc(c.khu_vuc || '')}</span><span>Chủ nhóm: <b>${esc(c.host.ho_ten)}</b></span></div></div>${pill(c.trang_thai_hien_thi, c.nhan_trang_thai)}</div>
        ${slotsHtml(c)}
        <div class="item-actions"><button class="btn sm" data-action="open-court" data-id="${c.id}">Xem</button>
          ${['open', 'full'].includes(c.trang_thai_hien_thi) ? `<button class="btn sm danger-ghost" data-action="ad-cancel-court" data-id="${c.id}">Hủy kèo vi phạm</button>` : ''}</div>
      </article>`).join('') || '<div class="empty card"><h3>Không có kèo nào</h3></div>'}</div>`;
  const redo = () => adminCourts(body, { q: $('#ac-q').value.trim(), status: $('#ac-status').value });
  $('#ac-status').addEventListener('change', redo);
  $('#ac-q').addEventListener('keydown', (e) => { if (e.key === 'Enter') redo(); });
}

App.actions['ad-cancel-court'] = async (el) => {
  const reason = await askText({ title: 'Hủy kèo vi phạm', label: 'Lý do (người chơi sẽ nhận được thông báo và hoàn cọc)', confirmText: 'Hủy kèo', danger: true });
  if (reason === null) return;
  const res = await api(`/api/courts/${el.dataset.id}/cancel`, { method: 'POST', body: { ly_do: reason || null } });
  toast(res.thong_bao, 'success'); loadAdmin();
};
