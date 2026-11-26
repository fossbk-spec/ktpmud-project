'use strict';
/* =====================================================================
   host.js - dành cho Chủ nhóm / Chủ sân
   FR-04 tạo kèo (có ghim bản đồ) | FR-05 duyệt / từ chối | FR-06 sửa, đóng, hủy kèo
   ===================================================================== */

const DEFAULT_CENTER = [21.0285, 105.8048];   // Hà Nội
let _mineTab = 'upcoming';
let _mineCourts = [];

/* ---------- Màn hình "Kèo của tôi" ---------- */
App.views.mine = { load: loadMine };

function startMs(c) { return Date.parse(`${c.ngay_choi}T${c.gio_bat_dau}:00+07:00`); }
function canEditCourt(c) {
  const hours = (App.meta && App.meta.chinh_sach.sua_truoc_gio) || 2;
  return c.trang_thai !== 'cancelled' && startMs(c) - Date.now() >= hours * 3600 * 1000;
}
function isPast(c) { return ['finished', 'cancelled'].includes(c.trang_thai_hien_thi); }

async function loadMine() {
  const root = $('#view-mine');
  const u = App.state.user;
  if (!u || u.role !== 'host') return;
  if (!root.dataset.ready) {
    root.dataset.ready = '1';
    root.innerHTML = `
      <div class="page-head row between">
        <div><h1>Kèo của tôi</h1><p class="sub">Đăng kèo, duyệt người chơi và quản lý trạng thái.</p></div>
        <button class="btn primary" id="btn-create" data-action="create-court">${icon('plus', 18)} Tạo kèo mới</button>
      </div>
      <div id="mine-notice"></div>
      <div class="stat-grid" id="mine-stats"></div>
      <div class="tabs" id="mine-tabs">
        <button class="tab" data-action="mine-tab" data-tab="upcoming">Sắp tới &amp; đang mở</button>
        <button class="tab" data-action="mine-tab" data-tab="past">Đã kết thúc / đã hủy</button>
      </div>
      <div class="stack-list" id="mine-list"></div>`;
  }
  $('#mine-notice').innerHTML = u.host_verified ? '' :
    `<div class="notice warn">${icon('shield', 18)}<div>Tài khoản chủ sân của bạn đang <b>chờ Quản trị viên xác thực</b> để tránh lừa đảo. Bạn sẽ tạo được kèo ngay khi được duyệt.</div></div>`;
  $('#btn-create').disabled = !u.host_verified;
  const list = $('#mine-list');
  if (!_mineCourts.length) list.innerHTML = '<div class="skeleton"></div>';
  try {
    const res = await api('/api/host/courts');
    _mineCourts = res.data;
    renderMine();
  } catch (err) { list.innerHTML = `<div class="empty card"><h3>Không tải được dữ liệu</h3><p>${esc(err.message)}</p></div>`; }
}

function renderMineStats() {
  const u = App.state.user;
  const upcoming = _mineCourts.filter(c => !isPast(c));
  const pending = upcoming.reduce((n, c) => n + (c.so_cho_duyet || 0), 0);
  const free = upcoming.filter(c => c.trang_thai_hien_thi === 'open').reduce((n, c) => n + c.slot_trong, 0);
  const tile = (n, t, alert) => `<div class="card stat ${alert ? 'alert' : ''}"><div class="n">${n}</div><div class="t">${esc(t)}</div></div>`;
  $('#mine-stats').innerHTML = tile(upcoming.length, 'Kèo sắp tới') + tile(pending, 'Yêu cầu chờ duyệt', pending > 0) + tile(free, 'Chỗ còn trống')
    + tile(u && u.so_danh_gia > 0 ? Number(u.diem_uy_tin).toFixed(1) + '★' : '—', 'Điểm uy tín của bạn');
}

function renderMine() {
  renderMineStats();
  $$('#mine-tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === _mineTab));
  const courts = _mineCourts.filter(c => (_mineTab === 'past') === isPast(c))
    .sort((a, b) => (_mineTab === 'past' ? startMs(b) - startMs(a) : startMs(a) - startMs(b)));
  const list = $('#mine-list');
  if (!courts.length) {
    list.innerHTML = `<div class="empty card"><h3>${_mineTab === 'past' ? 'Chưa có kèo nào đã kết thúc' : 'Bạn chưa có kèo nào sắp tới'}</h3>
      <p>${_mineTab === 'past' ? '' : 'Tạo kèo đầu tiên để người chơi quanh khu vực của bạn tìm thấy.'}</p>
      ${_mineTab === 'past' || !App.state.user.host_verified ? '' : `<button class="btn primary" data-action="create-court">${icon('plus', 18)} Tạo kèo mới</button>`}</div>`;
    return;
  }
  list.innerHTML = courts.map(mineCard).join('');
}

function mineCard(c) {
  const st = c.trang_thai_hien_thi;
  const editable = canEditCourt(c);
  const actions = [];
  actions.push(`<button class="btn sm primary" data-action="manage-court" data-id="${c.id}">${icon('users', 15)} Yêu cầu tham gia${c.so_cho_duyet ? ` <span class="badge">${c.so_cho_duyet}</span>` : ''}</button>`);
  actions.push(`<button class="btn sm" data-action="dup-court" data-id="${c.id}" title="Tạo kèo mới giống kèo này, dời sang tuần sau">${icon('copy', 15)} Nhân bản</button>`);
  if (st === 'finished') actions.push(`<button class="btn sm" data-action="go-reviews">${icon('star', 15)} Đánh giá người chơi</button>`);
  if (['open', 'full'].includes(st)) {
    actions.push(`<button class="btn sm" data-action="edit-court" data-id="${c.id}" ${editable ? '' : 'disabled'} title="${editable ? '' : 'Chỉ sửa được trước giờ chơi tối thiểu 2 tiếng'}">${icon('edit', 15)} Sửa</button>`);
    actions.push(c.trang_thai === 'closed'
      ? `<button class="btn sm" data-action="reopen-court" data-id="${c.id}">Mở lại kèo</button>`
      : `<button class="btn sm" data-action="close-court" data-id="${c.id}">Đóng kèo (đã đủ người)</button>`);
    actions.push(`<button class="btn sm danger-ghost" data-action="cancel-court" data-id="${c.id}">Hủy kèo</button>`);
  }
  return `
  <article class="card item" data-mine="${c.id}">
    <div class="item-head">
      <div>
        <div class="item-title">${esc(c.ten_san)}</div>
        <div class="kv"><span>${icon('calendar', 14)} ${esc(fmtDay(c.ngay_choi))}</span><span>${icon('clock', 14)} ${esc(c.gio_bat_dau)} – ${esc(c.gio_ket_thuc)}</span><span>${icon('pin', 14)} ${esc(c.khu_vuc || '')}</span></div>
      </div>
      ${pill(st, c.nhan_trang_thai)}
    </div>
    ${slotsHtml(c)}
    <div class="kv"><span>${c.gia_thue > 0 ? vnd(c.gia_thue) + ' / người' : 'Miễn phí'}</span>${c.tien_coc > 0 ? `<span>Cọc ${vnd(c.tien_coc)}</span>` : ''}<span>${esc(c.trinh_do)}</span></div>
    <div class="item-actions">${actions.join('')}</div>
  </article>`;
}

Object.assign(App.actions, {
  'mine-tab': (el) => { _mineTab = el.dataset.tab; renderMine(); },
  'go-reviews': () => { App.state.bookingsTab = 'review'; navigate('bookings'); },
  'create-court': () => openCourtForm(null),
  'dup-court': async (el) => { openCourtForm(await api('/api/courts/' + el.dataset.id), { duplicate: true }); },
  'copy-roster': async () => {
    const r = _reqModal;
    if (!r || !r.court) return;
    const c = r.court;
    const seats = r.approved.reduce((n, q) => n + q.so_luong, 0);
    const lines = r.approved.map((q, i) => `${i + 1}. ${q.player.ho_ten} (${q.player.trinh_do_label})${q.so_luong > 1 ? ` +${q.so_luong - 1}` : ''}`);
    const ok = await copyText(`${c.ten_san}\n${fmtDay(c.ngay_choi)} · ${c.gio_bat_dau}–${c.gio_ket_thuc}\n${c.dia_chi || ''}\nDanh sách đã duyệt (${seats}/${c.tong_slot} chỗ):\n${lines.join('\n')}`);
    toast(ok ? 'Đã sao chép danh sách. Dán vào nhóm Zalo / Messenger của bạn.' : 'Không sao chép được danh sách.', ok ? 'success' : 'error');
  },
  'edit-court': async (el) => { openCourtForm(await api('/api/courts/' + el.dataset.id)); },
  'manage-court': (el) => openRequests(Number(el.dataset.id)),
  'close-court': async (el) => {
    if (!await confirmDialog({ title: 'Đóng kèo', message: 'Kèo sẽ chuyển sang trạng thái "Đã đủ người" và không nhận thêm yêu cầu. Bạn có thể mở lại bất cứ lúc nào.', confirmText: 'Đóng kèo' })) return;
    await api(`/api/courts/${el.dataset.id}/close`, { method: 'POST' });
    toast('Đã đóng kèo.', 'success'); afterCourtChange();
  },
  'reopen-court': async (el) => {
    await api(`/api/courts/${el.dataset.id}/reopen`, { method: 'POST' });
    toast('Đã mở lại kèo.', 'success'); afterCourtChange();
  },
  'cancel-court': async (el) => {
    const reason = await askText({ title: 'Hủy kèo', label: 'Lý do hủy (người chơi sẽ nhận được thông báo)', placeholder: 'vd: Sân bảo trì đột xuất…', confirmText: 'Hủy kèo', danger: true });
    if (reason === null) return;
    const res = await api(`/api/courts/${el.dataset.id}/cancel`, { method: 'POST', body: { ly_do: reason || null } });
    toast(res.thong_bao, 'success'); afterCourtChange();
  },
  'approve-req': (el) => busy(el, async () => {
    const res = await api(`/api/bookings/${el.dataset.id}/approve`, { method: 'POST' });
    toast(res.thong_bao, 'success'); await repaintRequests(); afterCourtChange(true);
  }),
  'reject-req': async (el) => {
    const reason = await askText({ title: 'Từ chối yêu cầu', label: 'Lý do (không bắt buộc, người chơi sẽ nhìn thấy)', confirmText: 'Từ chối', danger: true });
    if (reason === null) return;
    const res = await api(`/api/bookings/${el.dataset.id}/reject`, { method: 'POST', body: { ly_do: reason || null } });
    toast(res.thong_bao, 'success'); await repaintRequests(); afterCourtChange(true);
  },
});

function afterCourtChange(skipClose) {
  if (!skipClose) closeAllModals();
  if (App.state.view === 'mine') loadMine();
  loadCourts();
}

/* ---------- Danh sách yêu cầu tham gia của một kèo (FR-05, US-03) ---------- */
let _reqModal = null;

async function openRequests(courtId) {
  closeAllModals();
  const m = openModal({ title: 'Yêu cầu tham gia', size: 'lg', body: '<div class="skeleton"></div>', onClose: () => { if (_reqModal && _reqModal.modal === m) _reqModal = null; } });
  _reqModal = { id: courtId, modal: m };
  try { await repaintRequests(); } catch (e) { m.close(); throw e; }
}

async function repaintRequests() {
  if (!_reqModal) return;
  const { id, modal } = _reqModal;
  const [court, reqs] = await Promise.all([api('/api/courts/' + id), api(`/api/courts/${id}/requests`)]);
  const approved = reqs.data.filter(r => r.trang_thai === 'approved');
  _reqModal.court = court; _reqModal.approved = approved;
  modal.setTitle(court.ten_san);
  modal.setBody(`
    <div class="row between" style="margin-bottom:12px">
      <div class="kv"><span>${icon('calendar', 14)} ${esc(fmtDay(court.ngay_choi))}</span><span>${icon('clock', 14)} ${esc(court.gio_bat_dau)} – ${esc(court.gio_ket_thuc)}</span><span>${esc(court.trinh_do)}</span></div>
      ${slotsHtml(court)}
    </div>
    ${approved.length ? `<div style="margin-bottom:12px"><button class="btn sm" data-action="copy-roster">${icon('copy', 15)} Sao chép danh sách đã duyệt (${approved.length})</button>
      <span class="hint" style="margin-left:8px">Chỉ gồm tên và trình độ, không kèm số điện thoại.</span></div>` : ''}
    <div class="stack-list">${reqs.data.length ? reqs.data.map(requestCard).join('') : `<div class="empty"><h3>Chưa có yêu cầu nào</h3><p>Khi có người xin tham gia, bạn sẽ nhận được thông báo ngay.</p></div>`}</div>`);
}

App.hooks.onNotification = (n) => { if (_reqModal && n.court_id === _reqModal.id) repaintRequests().catch(() => {}); };

function requestCard(r) {
  const p = r.player;
  return `
  <article class="card item">
    <div class="item-head">
      <button class="host-chip" data-action="open-profile" data-id="${p.id}" aria-label="Xem hồ sơ ${esc(p.ho_ten)}">${avatar(p, 44)}<span class="stack"><span class="nm" style="max-width:240px">${esc(p.ho_ten)}</span>${repBadge(p)}</span></button>
      ${pill(r.trang_thai, r.nhan_trang_thai)}
    </div>
    <div class="kv"><span>${icon('users', 14)} Trình độ: <b>${esc(p.trinh_do_label)}</b></span>${p.khu_vuc_thuong_choi ? `<span>${icon('pin', 14)} ${esc(p.khu_vuc_thuong_choi)}</span>` : ''}<span>${r.so_luong} chỗ</span><span class="muted">${esc(timeAgo(r.created_at))}</span></div>
    ${r.lech_trinh_do ? `<div class="notice warn">${icon('flag', 18)}<div>Trình độ của người này nằm ngoài mức kèo yêu cầu (${esc(r.court.trinh_do)}).</div></div>` : ''}
    ${p.nhan_uy_tin === 'warning' ? `<div class="notice bad">${icon('flag', 18)}<div>Người này từng bị báo bùng kèo ${p.so_bung_keo} lần. Hãy cân nhắc trước khi duyệt.</div></div>` : ''}
    ${r.loi_nhan ? `<div class="req-quote">“${esc(r.loi_nhan)}”</div>` : ''}
    ${r.thanh_toan ? `<div class="kv"><span>${icon('wallet', 14)} ${esc(r.thanh_toan.trang_thai_text)}: ${vnd(r.thanh_toan.so_tien)} · ${esc(r.thanh_toan.phuong_thuc_text)}</span></div>` : ''}
    ${r.trang_thai === 'approved' && p.phone ? `<div class="contact">${icon('phone', 18)}<span>Liên hệ: <a href="tel:${esc(p.phone)}">${esc(p.phone)}</a></span></div>` : ''}
    ${r.trang_thai === 'pending' ? `<div class="item-actions"><button class="btn sm primary" data-action="approve-req" data-id="${r.id}">${icon('check', 15)} Duyệt</button><button class="btn sm danger-ghost" data-action="reject-req" data-id="${r.id}">Từ chối</button></div>` : ''}
  </article>`;
}

/* ---------- Form tạo / sửa kèo (FR-04) ---------- */
async function geocode(query) {
  const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=vn&accept-language=vi&q=' + encodeURIComponent(query);
  let r;
  try { r = await fetch(url, { headers: { Accept: 'application/json' } }); }
  catch (e) { throw new Error('Không kết nối được dịch vụ tìm địa chỉ. Hãy bấm trực tiếp lên bản đồ để ghim vị trí.'); }
  if (!r.ok) throw new Error('Dịch vụ tìm địa chỉ đang bận, hãy thử lại hoặc bấm trực tiếp lên bản đồ.');
  const arr = await r.json();
  if (!arr.length) throw new Error('Không tìm thấy địa chỉ này. Hãy nhập ngắn gọn hơn hoặc bấm trực tiếp lên bản đồ.');
  return { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) };
}

// Ngày của tuần kế tiếp (luôn nằm sau hôm nay) - dùng khi nhân bản kèo chơi cố định hằng tuần
function nextWeekDate(iso) {
  let d = isoAddDays(iso, 7);
  while (d <= todayStr()) d = isoAddDays(d, 7);
  return d;
}

function openCourtForm(court, opts = {}) {
  const duplicate = !!(court && opts.duplicate);
  const editing = !!court && !duplicate;
  const meta = App.meta;
  const m = openModal({
    title: editing ? 'Sửa kèo' : (duplicate ? 'Nhân bản kèo' : 'Tạo kèo ghép sân'), size: 'lg',
    body: `
      ${duplicate ? `<div class="notice good">${icon('copy', 18)}<div>Đã điền sẵn từ kèo cũ và dời sang tuần sau. Hãy kiểm tra lại giờ giấc rồi bấm <b>Đăng kèo</b>.</div></div>` : ''}
      ${editing ? `<div class="notice">${icon('clock', 18)}<div>Bạn chỉ chỉnh sửa được kèo trước giờ chơi tối thiểu ${meta.chinh_sach.sua_truoc_gio} tiếng. Người đã xin tham gia sẽ được thông báo khi có thay đổi.</div></div>` : ''}
      <div class="field"><label for="cf-name">Tên sân</label><input id="cf-name" maxlength="120" placeholder="vd: Sân cầu lông Bách Khoa"></div>
      <div class="field"><label for="cf-addr">Địa chỉ cụ thể</label>
        <div class="row" style="flex-wrap:nowrap"><input id="cf-addr" maxlength="200" placeholder="Số nhà, đường, phường…"><button type="button" class="btn" id="cf-geo">${icon('search', 16)} Tìm</button></div>
        <span class="hint" id="cf-pin">Chưa ghim vị trí. Nhập địa chỉ rồi bấm Tìm, hoặc bấm trực tiếp lên bản đồ.</span></div>
      <div class="mini-map" id="cf-map" style="height:220px"></div>
      <div class="field"><label for="cf-district">Quận / Huyện</label><select id="cf-district">${districtOptions('', 'Chọn quận / huyện')}</select></div>
      <div class="grid-3">
        <div class="field"><label for="cf-date">Ngày chơi</label><input id="cf-date" type="date" min="${todayStr()}"></div>
        <div class="field"><label for="cf-start">Bắt đầu</label><input id="cf-start" type="time"></div>
        <div class="field"><label for="cf-end">Kết thúc</label><input id="cf-end" type="time"></div>
      </div>
      <div class="grid-2">
        <div class="field"><label for="cf-min">Trình độ tối thiểu</label><select id="cf-min">${levelOptions(1)}</select></div>
        <div class="field"><label for="cf-max">Trình độ tối đa</label><select id="cf-max">${levelOptions(5)}</select></div>
      </div>
      <div class="grid-3">
        <div class="field"><label for="cf-slots">Số người cần tuyển</label><input id="cf-slots" type="number" min="1" max="50" inputmode="numeric" placeholder="vd: 4"></div>
        <div class="field"><label for="cf-price">Chi phí / người (đ)</label><input id="cf-price" type="number" min="0" step="1000" inputmode="numeric" placeholder="vd: 60000"></div>
        <div class="field"><label for="cf-deposit">Tiền cọc / chỗ (đ)</label><input id="cf-deposit" type="number" min="0" step="1000" inputmode="numeric" placeholder="0 = không cọc"></div>
      </div>
      <div class="field"><label for="cf-notes">Ghi chú thêm</label><textarea id="cf-notes" maxlength="500" placeholder="Loại cầu sử dụng, quy định riêng của nhóm…"></textarea></div>
      <div class="form-error" id="cf-err" role="alert" hidden></div>`,
    footer: `<button class="btn ghost" data-modal-close>Hủy</button><button class="btn primary" id="cf-submit">${editing ? 'Lưu thay đổi' : 'Đăng kèo'}</button>`,
    onClose: () => { if (m.picker) { m.picker.map.remove(); m.picker = null; } },
  });
  const el = id => $('#' + id, m.el);
  m.pin = null;

  // --- Bản đồ ghim vị trí ---
  const pinHint = () => { el('cf-pin').textContent = m.pin ? `Đã ghim vị trí (${m.pin[0].toFixed(5)}, ${m.pin[1].toFixed(5)}). Kéo ghim để chỉnh lại.` : 'Chưa ghim vị trí. Nhập địa chỉ rồi bấm Tìm, hoặc bấm trực tiếp lên bản đồ.'; };
  if (typeof L === 'undefined') {
    el('cf-map').innerHTML = '<p class="map-fallback">Không tải được bản đồ (cần Internet). Bạn vẫn có thể đăng kèo không có ghim.</p>';
  } else {
    const hasPin = court && court.vi_do != null && court.kinh_do != null;
    const map = L.map(el('cf-map'), { scrollWheelZoom: false }).setView(hasPin ? [court.vi_do, court.kinh_do] : DEFAULT_CENTER, hasPin ? 16 : 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    let marker = null;
    const place = (lat, lng, zoom) => {
      if (marker) marker.setLatLng([lat, lng]);
      else { marker = L.marker([lat, lng], { draggable: true }).addTo(map); marker.on('dragend', () => { const p = marker.getLatLng(); m.pin = [p.lat, p.lng]; pinHint(); }); }
      m.pin = [lat, lng];
      if (zoom) map.setView([lat, lng], zoom);
      pinHint();
    };
    map.on('click', (e) => place(e.latlng.lat, e.latlng.lng));
    if (hasPin) place(court.vi_do, court.kinh_do);
    m.picker = { map, place };
    setTimeout(() => map.invalidateSize(), 160);
  }
  el('cf-geo').addEventListener('click', () => busy(el('cf-geo'), async () => {
    const q = [el('cf-addr').value.trim(), el('cf-district').value, 'Hà Nội'].filter(Boolean).join(', ');
    if (!el('cf-addr').value.trim()) return toast('Hãy nhập địa chỉ trước khi bấm Tìm.', 'error');
    try {
      const r = await geocode(q);
      if (m.picker) m.picker.place(r.lat, r.lng, 16); else m.pin = [r.lat, r.lng];
      pinHint();
    } catch (err) { toast(err.message, 'error', 5500); }
  }));

  // --- Điền sẵn khi sửa hoặc nhân bản ---
  if (court) {
    el('cf-name').value = court.ten_san; el('cf-addr').value = court.dia_chi || ''; el('cf-district').value = court.khu_vuc || '';
    el('cf-date').value = duplicate ? nextWeekDate(court.ngay_choi) : court.ngay_choi; el('cf-start').value = court.gio_bat_dau; el('cf-end').value = court.gio_ket_thuc;
    el('cf-min').value = court.trinh_min; el('cf-max').value = court.trinh_max; el('cf-slots').value = court.tong_slot;
    el('cf-price').value = court.gia_thue; el('cf-deposit').value = court.tien_coc; el('cf-notes').value = court.ghi_chu || '';
  } else {
    el('cf-date').value = addDaysStr(1); el('cf-start').value = '19:00'; el('cf-end').value = '21:00';
    el('cf-slots').value = 4; el('cf-price').value = 60000; el('cf-deposit').value = 0;
    const me = App.state.user;
    if (me && me.khu_vuc_thuong_choi) el('cf-district').value = me.khu_vuc_thuong_choi;
  }
  pinHint();

  // --- Gửi ---
  const submit = el('cf-submit');
  const showErr = (msg) => { const b = el('cf-err'); b.textContent = msg; b.hidden = !msg; if (msg) b.scrollIntoView({ block: 'nearest' }); };
  submit.addEventListener('click', () => busy(submit, async () => {
    showErr('');
    const body = {
      ten_san: el('cf-name').value.trim(), dia_chi: el('cf-addr').value.trim() || null, khu_vuc: el('cf-district').value,
      ngay_choi: el('cf-date').value, gio_bat_dau: el('cf-start').value, gio_ket_thuc: el('cf-end').value,
      trinh_min: Number(el('cf-min').value), trinh_max: Number(el('cf-max').value),
      tong_slot: Number(el('cf-slots').value), gia_thue: Number(el('cf-price').value || 0), tien_coc: Number(el('cf-deposit').value || 0),
      ghi_chu: el('cf-notes').value.trim() || null, vi_do: m.pin ? m.pin[0] : null, kinh_do: m.pin ? m.pin[1] : null,
    };
    if (!body.ten_san) return showErr('Vui lòng nhập tên sân.');
    if (!body.khu_vuc) return showErr('Vui lòng chọn Quận / Huyện.');
    if (!body.ngay_choi || !body.gio_bat_dau || !body.gio_ket_thuc) return showErr('Vui lòng nhập đủ ngày và khung giờ chơi.');
    if (!(body.tong_slot >= 1)) return showErr('Số người cần tuyển phải từ 1 trở lên.');
    if (body.trinh_min > body.trinh_max) return showErr('Trình độ tối thiểu không được cao hơn trình độ tối đa.');
    if (!m.pin && !await confirmDialog({ title: 'Chưa ghim vị trí', message: 'Kèo chưa có vị trí trên bản đồ nên sẽ không hiển thị ở chế độ bản đồ. Bạn vẫn muốn đăng?', confirmText: 'Vẫn đăng' })) return;
    try {
      await api(editing ? '/api/courts/' + court.id : '/api/courts', { method: editing ? 'PUT' : 'POST', body });
      m.close();
      toast(editing ? 'Đã lưu thay đổi.' : 'Đã đăng kèo! Người chơi có thể thấy và xin tham gia ngay.', 'success');
      afterCourtChange(true);
    } catch (err) { showErr(err.message); }
  }));
}
