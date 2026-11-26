'use strict';
/* =====================================================================
   main.js - khung ứng dụng, tìm kèo (FR-07), bản đồ, chi tiết kèo,
   xin ghép sân (FR-08 / UC-01) và cập nhật thời gian thực (NFR-01)
   ===================================================================== */

App.views = {};   // mỗi màn hình đăng ký { load() }; host.js và extras.js bổ sung thêm
App.state = {
  user: null, view: 'courts', courts: [], courtsTotal: 0, unread: 0, detail: null,
  filters: { q: '', district: '', date: '', from: '', to: '', skill: '', maxPrice: '', onlyAvail: false, sort: 'soonest' },
  myLoc: null,
};
const COURT_STATUS_TEXT = { open: 'Đang mở', full: 'Đã đủ người', ongoing: 'Đang diễn ra', finished: 'Đã kết thúc', cancelled: 'Đã hủy' };

/* ---------------------------------------------------------------------
   Khởi động
   --------------------------------------------------------------------- */
App.boot = async function () {
  const s = App.state;
  s.user = Auth.user();
  await loadMeta();
  fillFilterControls();
  bindCourtsUI();
  initMap();
  renderChrome();
  window.addEventListener('hashchange', routeFromHash);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshCurrent(); });
  if (Auth.token()) {
    try { const me = await api('/api/users/me'); Auth.setUser(me); s.user = me; renderChrome(); }
    catch (e) { /* hết hạn đăng nhập đã được api() xử lý; lỗi mạng thì dùng dữ liệu đã lưu */ }
    refreshUnread();
  }
  connectWS();
  routeFromHash();
  // Dự phòng khi WebSocket không khả dụng (thiếu thư viện websockets, mạng chặn...): làm mới danh sách mỗi 30 giây
  setInterval(() => {
    const live = App.ws && App.ws.readyState === 1;
    if (!document.hidden && !live && App.state.view === 'courts') loadCourts();
  }, 30000);
};

/* ---------------------------------------------------------------------
   Điều hướng
   --------------------------------------------------------------------- */
function navItems() {
  const u = App.state.user;
  const items = [{ id: 'courts', label: 'Tìm sân', icon: 'search' }];
  if (!u) return items;
  if (u.role === 'admin') items.unshift({ id: 'admin', label: 'Quản trị', icon: 'dash' });
  if (u.role === 'host') items.push({ id: 'mine', label: 'Kèo của tôi', icon: 'court' });
  if (u.role !== 'admin') items.push({ id: 'bookings', label: 'Lịch chơi', icon: 'calendar' });
  items.push({ id: 'notifications', label: 'Thông báo', icon: 'bell', badge: true });
  items.push({ id: 'profile', label: 'Cá nhân', icon: 'user' });
  return items;
}

function renderChrome() {
  const u = App.state.user;
  const items = navItems();
  const unread = App.state.unread;
  const badge = it => (it.badge && unread > 0 ? `<span class="badge">${unread > 99 ? '99+' : unread}</span>` : '');
  $('#side-nav').innerHTML = items.map(it =>
    `<button class="nav-item" id="sn-${it.id}" data-action="nav" data-view="${it.id}">${icon(it.icon, 20)}<span>${esc(it.label)}</span>${badge(it)}</button>`).join('');
  $('#bottom-nav').innerHTML = items.map(it =>
    `<button id="bn-${it.id}" data-action="nav" data-view="${it.id}">${icon(it.icon, 22)}<span>${esc(it.label)}</span>${badge(it)}</button>`).join('');
  if (u) {
    const roleText = u.role === 'admin' ? 'Quản trị viên' : (u.role === 'host' ? 'Chủ nhóm / Chủ sân' : 'Người chơi');
    $('#side-foot').innerHTML = `
      <div class="person" style="padding:0 6px">${avatar(u, 38)}<div class="grow" style="min-width:0"><div class="nm" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(u.ho_ten || u.username)}</div><div class="muted small">${roleText}</div></div></div>
      <button class="btn ghost block" data-action="logout">${icon('logout', 16)} Đăng xuất</button>`;
    $('#top-actions').innerHTML = `<button class="icon-btn" data-action="nav" data-view="profile" aria-label="Cá nhân">${avatar(u, 34)}</button>`;
  } else {
    $('#side-foot').innerHTML = `<button class="btn primary block" data-action="login">Đăng nhập</button><button class="btn ghost block" data-action="register">Tạo tài khoản</button>`;
    $('#top-actions').innerHTML = `<button class="btn primary sm" data-action="login">Đăng nhập</button>`;
  }
  renderNavActive();
}
function renderNavActive() {
  const v = App.state.view;
  $$('#side-nav .nav-item, #bottom-nav button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
}
function allowedView(name) { return navItems().some(i => i.id === name); }
function navigate(name) { if (location.hash === '#' + name) showView(name); else location.hash = name; }

function routeFromHash() {
  const u = App.state.user;
  const fallback = u && u.role === 'admin' ? 'admin' : 'courts';
  const hash = (location.hash || '').replace('#', '');
  const deep = /^court=(\d+)$/.exec(hash);      // liên kết chia sẻ: index.html#court=12 mở thẳng chi tiết kèo
  if (deep) { showView('courts'); openCourtDetail(Number(deep[1])).catch(handleError); return; }
  showView(hash.split('?')[0] || fallback);
}

function showView(name) {
  const u = App.state.user;
  if (!allowedView(name)) {
    if (!u && ['bookings', 'notifications', 'profile', 'mine', 'admin'].includes(name)) { location.href = 'login.html'; return; }
    name = 'courts';
  }
  App.state.view = name;
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
  renderNavActive();
  const view = App.views[name];
  if (view && view.load) view.load();
}
function refreshCurrent() { const v = App.views[App.state.view]; if (v && v.load) v.load(); }

Object.assign(App.actions, {
  nav: (el) => navigate(el.dataset.view),
  login: () => { location.href = 'login.html'; },
  register: () => { location.href = 'login.html?tab=register'; },
  logout: async () => {
    if (await confirmDialog({ title: 'Đăng xuất', message: 'Bạn có chắc chắn muốn đăng xuất?', confirmText: 'Đăng xuất' })) {
      Auth.clear(); location.href = 'login.html';
    }
  },
});

function setUnread(n) { App.state.unread = Math.max(0, n); renderChrome(); }
async function refreshUnread() {
  if (!Auth.token()) return;
  try { const r = await api('/api/notifications?limit=1'); setUnread(r.unread); } catch (e) { /* bỏ qua */ }
}

/* ---------------------------------------------------------------------
   Tìm kiếm & bộ lọc (FR-07)
   --------------------------------------------------------------------- */
function fillFilterControls() {
  $('#f-district').innerHTML = districtOptions('', 'Tất cả quận / huyện');
  $('#f-skill').innerHTML = levelOptions('', 'Mọi trình độ');
  $('#f-date').min = todayStr();
}

function readFilters() {
  const f = App.state.filters;
  f.q = $('#f-q').value; f.district = $('#f-district').value; f.date = $('#f-date').value;
  f.from = $('#f-from').value; f.to = $('#f-to').value; f.skill = $('#f-skill').value;
  f.maxPrice = $('#f-price').value; f.onlyAvail = $('#f-avail').checked; f.sort = $('#f-sort').value;
}
function writeFilters() {
  const f = App.state.filters;
  $('#f-q').value = f.q; $('#f-district').value = f.district; $('#f-date').value = f.date;
  $('#f-from').value = f.from; $('#f-to').value = f.to; $('#f-skill').value = f.skill;
  $('#f-price').value = f.maxPrice; $('#f-avail').checked = f.onlyAvail; $('#f-sort').value = f.sort;
  renderChips();
  const n = [f.district, f.date, f.from, f.to, f.skill, f.maxPrice].filter(Boolean).length + (f.onlyAvail ? 1 : 0) + (f.sort !== 'soonest' ? 1 : 0);
  const b = $('#filter-count');
  b.textContent = n; b.hidden = n === 0;
}

const QUICK_CHIPS = [
  { id: 'evening', label: 'Tối 18–22h', on: f => f.from === '18:00' && f.to === '22:00',
    toggle: f => { const on = f.from === '18:00' && f.to === '22:00'; f.from = on ? '' : '18:00'; f.to = on ? '' : '22:00'; } },
  { id: 'avail', label: 'Còn chỗ', on: f => f.onlyAvail, toggle: f => { f.onlyAvail = !f.onlyAvail; } },
  { id: 'myarea', label: 'Khu vực của tôi', needArea: true,
    on: f => !!f.district && !!App.state.user && f.district === App.state.user.khu_vuc_thuong_choi,
    toggle: f => { const a = App.state.user.khu_vuc_thuong_choi; f.district = f.district === a ? '' : a; } },
  { id: 'mylevel', label: 'Hợp trình độ của tôi', needPlayer: true,
    on: f => !!f.skill && !!App.state.user && String(f.skill) === String(App.state.user.trinh_do),
    toggle: f => { const lv = String(App.state.user.trinh_do); f.skill = String(f.skill) === lv ? '' : lv; } },
];
function renderChips() {
  const f = App.state.filters, u = App.state.user;
  $('#quick-chips').innerHTML = QUICK_CHIPS
    .filter(c => (!c.needPlayer || (u && u.role !== 'admin')) && (!c.needArea || (u && u.khu_vuc_thuong_choi)))
    .map(c => `<button type="button" class="chip ${c.on(f) ? 'on' : ''}" data-action="chip" data-chip="${c.id}" aria-pressed="${c.on(f)}">${esc(c.label)}</button>`).join('');
  renderDateStrip();
}

// Dải chọn ngày: 1 chạm để xem kèo của hôm nay, ngày mai... (8 ngày tới)
function renderDateStrip() {
  const f = App.state.filters;
  const all = `<button type="button" class="day all ${f.date ? '' : 'on'}" data-action="day" data-date="" aria-pressed="${!f.date}"><span class="dow">Mọi</span><span class="num">ngày</span></button>`;
  const days = Array.from({ length: 8 }, (_, i) => {
    const d = addDaysStr(i);
    const label = i === 0 ? 'Hôm nay' : (i === 1 ? 'Ngày mai' : WEEKDAYS[weekdayOf(d)]);
    return `<button type="button" class="day ${f.date === d ? 'on' : ''}" data-action="day" data-date="${d}" aria-pressed="${f.date === d}"><span class="dow">${label}</span><span class="num">${d.slice(8)}/${d.slice(5, 7)}</span></button>`;
  }).join('');
  $('#date-strip').innerHTML = all + days;
}

const loadCourtsSoon = debounce(() => loadCourts(), 280);

function bindCourtsUI() {
  $('#f-q').addEventListener('input', () => { readFilters(); writeFilters(); loadCourtsSoon(); });
  $$('#filters-panel select, #filters-panel input').forEach(el => el.addEventListener('change', () => { readFilters(); writeFilters(); loadCourts(); }));
  const panel = $('#filters-panel'), btn = $('#btn-filters');
  panel.hidden = true; btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', () => { panel.hidden = !panel.hidden; btn.setAttribute('aria-expanded', String(!panel.hidden)); });
  $$('#view-toggle button').forEach(b => b.addEventListener('click', () => setMapMode(b.dataset.mode)));
  writeFilters();
}

Object.assign(App.actions, {
  chip: (el) => { const c = QUICK_CHIPS.find(x => x.id === el.dataset.chip); c.toggle(App.state.filters); writeFilters(); loadCourts(); },
  'clear-filters': () => {
    App.state.filters = { q: '', district: '', date: '', from: '', to: '', skill: '', maxPrice: '', onlyAvail: false, sort: 'soonest' };
    writeFilters(); loadCourts();
  },
  'retry-courts': () => loadCourts(),
  day: (el) => { App.state.filters.date = el.dataset.date; writeFilters(); loadCourts(); },
  'more-courts': (el) => busy(el, () => loadMoreCourts()),
});
$('#btn-clear').addEventListener('click', () => App.actions['clear-filters']());

const COURTS_PAGE = 24;
function courtQuery(offset = 0) {
  const f = App.state.filters, p = new URLSearchParams();
  if (f.q.trim()) p.set('q', f.q.trim());
  if (f.district) p.set('district', f.district);
  if (f.date) p.set('date', f.date);
  if (f.from) p.set('from_time', f.from);
  if (f.to) p.set('to_time', f.to);
  if (f.skill) p.set('skill', f.skill);
  if (f.maxPrice) p.set('max_price', f.maxPrice);
  if (f.onlyAvail) p.set('only_available', 'true');
  if (f.sort && f.sort !== 'near') p.set('sort', f.sort);
  p.set('limit', f.sort === 'near' ? 200 : COURTS_PAGE);   // "Gần tôi" cần đủ dữ liệu để sắp xếp theo khoảng cách
  if (offset) p.set('offset', offset);
  return p.toString();
}

let _courtsReq = 0;
async function loadCourts() {
  const my = ++_courtsReq;
  const list = $('#court-list');
  if (!App.state.courts.length) list.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
  try {
    const res = await api('/api/courts?' + courtQuery());
    if (my !== _courtsReq) return;   // đã có yêu cầu mới hơn
    App.state.courts = res.data;
    App.state.courtsTotal = res.tong;
    renderCourtList();
    updateMap();
  } catch (err) {
    if (my !== _courtsReq) return;
    list.innerHTML = `<div class="empty card"><h3>Không tải được danh sách</h3><p>${esc(err.message)}</p><button class="btn" data-action="retry-courts">Thử lại</button></div>`;
    $('#result-count').textContent = 'Lỗi kết nối';
  }
}
async function loadMoreCourts() {
  const s = App.state;
  const res = await api('/api/courts?' + courtQuery(s.courts.length));
  const have = new Set(s.courts.map(c => c.id));
  res.data.forEach(c => { if (!have.has(c.id)) s.courts.push(c); });
  s.courtsTotal = res.tong;
  renderCourtList();
  updateMap();
}
App.views.courts = { load() { loadCourts(); if (App.map) setTimeout(() => App.map.invalidateSize(), 60); } };

function haversine(a, b) {
  const R = 6371, rad = x => x * Math.PI / 180;
  const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function renderCourtList() {
  const s = App.state, list = $('#court-list');
  const courts = s.courts.slice();
  if (s.myLoc) courts.forEach(c => { c._dist = (c.vi_do != null && c.kinh_do != null) ? haversine(s.myLoc, [c.vi_do, c.kinh_do]) : null; });
  if (s.filters.sort === 'near' && s.myLoc) courts.sort((a, b) => (a._dist == null ? 1e9 : a._dist) - (b._dist == null ? 1e9 : b._dist));
  const total = Math.max(s.courtsTotal || 0, courts.length);
  $('#result-count').textContent = courts.length ? `${total} kèo phù hợp` : 'Không có kèo nào';
  list.innerHTML = courts.length ? courts.map(courtCard).join('') +
      (total > courts.length ? `<button class="btn block" data-action="more-courts">Xem thêm ${total - courts.length} kèo</button>` : '')
    : `<div class="empty card"><h3>Không tìm thấy kèo phù hợp</h3><p>Thử nới lỏng bộ lọc hoặc chọn ngày khác.</p><button class="btn" data-action="clear-filters">Xóa bộ lọc</button></div>`;
}

// Nút hành động chính của một kèo, tùy theo vai trò và trạng thái yêu cầu của người đang xem
function courtCta(c, big) {
  const cls = 'btn' + (big ? ' lg' : '');
  if (c.is_owner) return `<button class="${cls} secondary" data-action="manage-court" data-id="${c.id}">Quản lý kèo${c.so_cho_duyet ? ` (${c.so_cho_duyet})` : ''}</button>`;
  const mb = c.my_booking;
  if (mb) {
    const tone = { pending: 'warn', approved: 'good', rejected: 'bad' }[mb.trang_thai] || 'muted';
    return `<span class="state-chip ${tone}">${esc(mb.nhan)}</span>`;
  }
  if (c.trang_thai_hien_thi === 'open') return `<button class="${cls} primary" data-action="join" data-id="${c.id}">Xin ghép sân</button>`;
  return `<button class="${cls}" disabled>${esc(c.nhan_trang_thai)}</button>`;
}

function courtCard(c) {
  const free = !(c.gia_thue > 0);
  const dist = c._dist != null ? ` · cách ${c._dist.toFixed(1).replace('.', ',')} km` : '';
  return `
  <article class="card court" data-action="open-court" data-id="${c.id}" data-court-id="${c.id}">
    ${timeBlock(c)}
    <div class="court-main">
      <div class="court-head">
        <h3 class="court-title">${esc(c.ten_san)}</h3>
        ${pill(c.trang_thai_hien_thi, c.nhan_trang_thai)}
      </div>
      <p class="court-addr">${icon('pin', 15)}<span>${esc(c.dia_chi || c.khu_vuc || 'Chưa cập nhật địa chỉ')}${dist}</span></p>
      <div class="court-meta">
        <span class="price">${free ? 'Miễn phí' : vnd(c.gia_thue)}${free ? '' : '<small> / người</small>'}</span>
        ${c.tien_coc > 0 ? `<span class="tag shuttle">${icon('wallet', 13)}Cọc ${vnd(c.tien_coc)}</span>` : ''}
        <span class="tag">${icon('users', 13)}${esc(c.trinh_do)}</span>
      </div>
      ${slotsHtml(c)}
      <div class="court-foot">
        <button class="host-chip" data-action="open-profile" data-id="${c.host.id}" aria-label="Xem hồ sơ chủ nhóm ${esc(c.host.ho_ten)}">
          ${avatar(c.host, 32)}<span class="stack"><span class="nm">${esc(c.host.ho_ten)}</span>${repBadge(c.host)}</span>
        </button>
        ${courtCta(c)}
      </div>
    </div>
  </article>`;
}

/* ---------------------------------------------------------------------
   Bản đồ (Leaflet + OpenStreetMap)
   --------------------------------------------------------------------- */
function initMap() {
  const el = $('#map');
  if (typeof L === 'undefined') { el.innerHTML = '<p class="map-fallback">Không tải được bản đồ. Hãy kiểm tra kết nối Internet.</p>'; $('#btn-locate').hidden = true; return; }
  App.map = L.map(el).setView([21.0285, 105.8048], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(App.map);
  App.markers = L.layerGroup().addTo(App.map);
  $('#btn-locate').addEventListener('click', (e) => App.actions.locate(e.currentTarget));
}

function updateMap() {
  if (!App.map) return;
  App.markers.clearLayers();
  const pts = [];
  App.state.courts.forEach((c) => {
    if (c.vi_do == null || c.kinh_do == null) return;   // kèo chưa ghim vị trí thì không vẽ lên bản đồ
    const ic = L.divIcon({ className: 'pin-wrap', iconSize: [0, 0], iconAnchor: [0, 0],
      html: `<div class="map-pin ${esc(c.trang_thai_hien_thi)}">${esc(c.gio_bat_dau)}</div>` });
    const mk = L.marker([c.vi_do, c.kinh_do], { icon: ic, title: c.ten_san }).addTo(App.markers);
    mk.bindPopup(`<b>${esc(c.ten_san)}</b><br>${esc(fmtDay(c.ngay_choi))} · ${esc(c.gio_bat_dau)}–${esc(c.gio_ket_thuc)}<br>${c.gia_thue > 0 ? vnd(c.gia_thue) : 'Miễn phí'} · còn ${c.slot_trong} chỗ<br><button class="link-btn" data-action="open-court" data-id="${c.id}">Xem chi tiết</button>`);
    pts.push([c.vi_do, c.kinh_do]);
  });
  if (pts.length && !App.state.myLoc) App.map.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
}

function setMapMode(mode) {
  $('#courts-layout').classList.toggle('show-map', mode === 'map');
  $$('#view-toggle button').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  if (mode === 'map' && App.map) setTimeout(() => { App.map.invalidateSize(); updateMap(); }, 60);
}

App.actions.locate = (el) => busy(el, () => new Promise((resolve) => {
  if (!navigator.geolocation) { toast('Trình duyệt không hỗ trợ định vị.', 'error'); return resolve(); }
  navigator.geolocation.getCurrentPosition((pos) => {
    const loc = [pos.coords.latitude, pos.coords.longitude];
    App.state.myLoc = loc;
    if (App.map) {
      if (App.meMarker) App.map.removeLayer(App.meMarker);
      App.meMarker = L.marker(loc, { icon: L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }) }).addTo(App.map);
      App.map.setView(loc, 14);
    }
    const opt = $('#f-sort option[value="near"]');
    opt.disabled = false; opt.textContent = 'Gần tôi nhất';
    toast('Đã xác định vị trí. Bạn có thể sắp xếp theo "Gần tôi nhất".', 'success');
    renderCourtList();
    resolve();
  }, () => { toast('Không lấy được vị trí. Hãy cho phép trình duyệt truy cập vị trí của bạn.', 'error'); resolve(); },
  { timeout: 8000 });
}));

/* ---------------------------------------------------------------------
   Chi tiết kèo
   --------------------------------------------------------------------- */
App.actions['open-court'] = (el) => openCourtDetail(Number(el.dataset.id));
App.actions['open-profile'] = (el) => openUserProfile(Number(el.dataset.id));
App.actions.join = (el) => openJoinDialog(Number(el.dataset.id));
App.actions['report-user'] = (el) => openReport({ userId: Number(el.dataset.id), name: el.dataset.name });
App.actions['report-court'] = (el) => openReport({ userId: Number(el.dataset.user), courtId: Number(el.dataset.id), name: el.dataset.name });

async function openCourtDetail(id) {
  closeAllModals();
  const m = openModal({
    title: 'Chi tiết kèo', size: 'lg', body: '<div class="skeleton"></div>',
    onClose: () => {
      if (m.miniMap) { m.miniMap.remove(); m.miniMap = null; }
      if (App.state.detail && App.state.detail.modal === m) App.state.detail = null;
      if (/^#court=/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search + '#courts');   // đóng liên kết chia sẻ
    },
  });
  let c;
  try { c = await api('/api/courts/' + id); } catch (e) { m.close(); throw e; }
  App.state.detail = { id, modal: m, court: c };
  paintCourtDetail(m, c);
}

// Chia sẻ kèo: dùng hộp thoại chia sẻ của điện thoại (Zalo, Messenger...) hoặc sao chép liên kết
function shareText(c) {
  return `${c.ten_san} · ${fmtDay(c.ngay_choi)} ${c.gio_bat_dau}–${c.gio_ket_thuc} · ${c.gia_thue > 0 ? vnd(c.gia_thue) + '/người' : 'miễn phí'} · còn ${c.slot_trong}/${c.tong_slot} chỗ`;
}
App.actions['share-court'] = async () => {
  const c = App.state.detail && App.state.detail.court;
  if (!c) return;
  const url = location.href.split('#')[0] + '#court=' + c.id;
  if (navigator.share) {
    try { await navigator.share({ title: 'Kèo cầu lông: ' + c.ten_san, text: shareText(c), url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  const ok = await copyText(shareText(c) + '\n' + url);
  toast(ok ? 'Đã sao chép liên kết kèo. Dán vào Zalo / Messenger để rủ bạn bè!' : 'Không sao chép được. Hãy copy liên kết: ' + url, ok ? 'success' : 'error', 5000);
};

function paintCourtDetail(m, c) {
  const phone = c.host_phone ? `<a href="tel:${esc(c.host_phone)}">${esc(c.host_phone)}</a>` : null;
  m.setBody(`
    <div class="detail-hero">
      ${timeBlock(c)}
      <div class="grow">
        <div class="row" style="gap:8px">${pill(c.trang_thai_hien_thi, c.nhan_trang_thai)}<span class="muted small">${esc(fmtDay(c.ngay_choi))}</span></div>
        <h3 class="detail-title">${esc(c.ten_san)}</h3>
        <p class="court-addr">${icon('pin', 15)}<span>${esc(c.dia_chi || 'Chưa cập nhật địa chỉ')}${c.khu_vuc ? ' · ' + esc(c.khu_vuc) : ''}</span></p>
        <p class="row" style="margin-top:6px;gap:16px"><a class="link-btn" href="${esc(directionsUrl(c))}" target="_blank" rel="noopener">${icon('nav', 14)} Chỉ đường</a>
          <button class="link-btn" data-action="share-court">${icon('share', 14)} Chia sẻ</button></p>
      </div>
    </div>
    <div class="facts">
      <div class="fact"><div class="k">Chi phí dự kiến</div><div class="v">${c.gia_thue > 0 ? vnd(c.gia_thue) + ' / người' : 'Miễn phí'}</div></div>
      <div class="fact"><div class="k">Tiền cọc</div><div class="v">${c.tien_coc > 0 ? vnd(c.tien_coc) + ' / chỗ' : 'Không cần cọc'}</div></div>
      <div class="fact"><div class="k">Trình độ yêu cầu</div><div class="v">${esc(c.trinh_do)}</div></div>
      <div class="fact" data-live-slots="${c.id}"><div class="k">Chỗ trống</div><div class="v">${c.slot_trong} / ${c.tong_slot}</div></div>
      ${c.ghi_chu ? `<div class="fact wide"><div class="k">Ghi chú của chủ nhóm</div><div class="v" style="font-weight:500;white-space:pre-line">${esc(c.ghi_chu)}</div></div>` : ''}
    </div>
    ${c.vi_do != null && c.kinh_do != null ? '<div class="mini-map" id="mini-map"></div>' : ''}
    <div class="person card" style="padding:12px 14px">
      ${avatar(c.host, 44)}
      <div class="grow"><div class="nm">${esc(c.host.ho_ten)}</div>${repBadge(c.host)}</div>
      <button class="btn sm" data-action="open-profile" data-id="${c.host.id}">Xem hồ sơ</button>
    </div>
    ${phone ? `<div class="contact mt">${icon('phone', 18)}<span>Liên hệ chủ nhóm: ${phone}</span></div>`
      : (c.is_owner ? '' : `<div class="notice">${icon('shield', 18)}<div>Số điện thoại chủ nhóm sẽ hiển thị sau khi yêu cầu của bạn được duyệt, để bảo vệ thông tin cá nhân của cả hai bên.</div></div>`)}
    ${c.my_booking && c.my_booking.trang_thai === 'rejected' ? `<div class="notice bad">${icon('x', 18)}<div>Chủ nhóm đã từ chối yêu cầu của bạn cho kèo này.</div></div>` : ''}
  `);
  const owner = c.is_owner;
  m.setFooter(owner
    ? `<button class="btn" data-modal-close>Đóng</button>${courtCta(c, true)}`
    : `<button class="btn ghost" data-action="report-court" data-id="${c.id}" data-user="${c.host.id}" data-name="${esc(c.ten_san)}">${icon('flag', 16)} Báo cáo</button>${courtCta(c, true)}`);
  if (c.vi_do != null && c.kinh_do != null && typeof L !== 'undefined') {
    if (m.miniMap) m.miniMap.remove();
    m.miniMap = L.map('mini-map', { scrollWheelZoom: false, attributionControl: false }).setView([c.vi_do, c.kinh_do], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(m.miniMap);
    L.marker([c.vi_do, c.kinh_do]).addTo(m.miniMap);
    setTimeout(() => { if (m.miniMap) m.miniMap.invalidateSize(); }, 120);
  }
}

/* ---------------------------------------------------------------------
   Xin ghép sân (UC-01 / FR-08): chọn số chỗ, đặt cọc (giả lập) rồi gửi yêu cầu - tối đa 3 chạm
   --------------------------------------------------------------------- */
// Tìm lịch đang giữ chỗ của người chơi bị trùng giờ với kèo c
function findOverlap(c, mine) {
  if (!mine || !mine.danh_sach) return null;
  const at = (d, t) => Date.parse(`${d}T${t}:00+07:00`);
  const s = at(c.ngay_choi, c.gio_bat_dau), e = at(c.ngay_choi, c.gio_ket_thuc);
  return mine.danh_sach.find(b => ['pending', 'approved'].includes(b.trang_thai) && !['finished', 'cancelled'].includes(b.trang_thai_keo)
    && b.court_id !== c.id && at(b.ngay_choi, b.gio_bat_dau) < e && at(b.ngay_choi, b.gio_ket_thuc) > s) || null;
}

async function openJoinDialog(id) {
  const user = App.state.user;
  if (!user) { toast('Bạn cần đăng nhập để xin ghép sân.', 'info'); setTimeout(() => { location.href = 'login.html'; }, 700); return; }
  if (user.role === 'admin') { toast('Quản trị viên không tham gia ghép sân.', 'info'); return; }
  const [c, meta, mine] = await Promise.all([api('/api/courts/' + id), loadMeta(), api('/api/my-bookings').catch(() => null)]);
  if (c.trang_thai_hien_thi !== 'open') { toast(`Kèo này hiện ${c.nhan_trang_thai.toLowerCase()}, không nhận thêm đăng ký.`, 'error'); mergeCourt(c); return; }
  if (c.my_booking) { toast('Bạn đã gửi yêu cầu cho kèo này rồi.', 'info'); return; }

  const maxQty = Math.max(1, Math.min(c.slot_trong, meta.chinh_sach.toi_da_slot_moi_yeu_cau));
  const mismatch = user.trinh_do < c.trinh_min || user.trinh_do > c.trinh_max;
  const deposit = Number(c.tien_coc || 0);
  const clash = findOverlap(c, mine);
  const payHtml = deposit > 0 ? `
    <div class="field"><span class="label">Thanh toán tiền cọc</span>
      <div class="pay-methods">${meta.phuong_thuc_tt.map((p, i) =>
        `<label class="pay-opt"><input type="radio" name="pm" value="${esc(p.ma)}" ${i === 0 ? 'checked' : ''}>${esc(p.ten)}</label>`).join('')}</div>
      <span class="hint">Cổng thanh toán đang ở chế độ giả lập (sandbox), không trừ tiền thật.</span></div>` : '';

  const m = openModal({
    title: 'Xin ghép sân', size: 'sm',
    body: `
      <div class="detail-hero" style="margin-bottom:10px">${timeBlock(c)}
        <div class="grow"><div class="item-title">${esc(c.ten_san)}</div>
          <p class="court-addr">${icon('pin', 15)}<span>${esc(c.dia_chi || c.khu_vuc || '')}</span></p>
          <p class="muted small" style="margin-top:4px">${esc(fmtDay(c.ngay_choi))} · ${esc(c.gio_bat_dau)} – ${esc(c.gio_ket_thuc)}</p></div></div>
      ${clash ? `<div class="notice warn">${icon('clock', 18)}<div>Bạn đã có lịch <b>${esc(clash.ten_san)}</b> (${esc(clash.gio_bat_dau)} – ${esc(clash.gio_ket_thuc)}) trùng giờ với kèo này.</div></div>` : ''}
      ${mismatch ? `<div class="notice warn">${icon('flag', 18)}<div>Trình độ của bạn (<b>${esc(levelName(user.trinh_do))}</b>) nằm ngoài mức kèo yêu cầu (${esc(c.trinh_do)}). Chủ nhóm sẽ cân nhắc khi duyệt.</div></div>` : ''}
      <div class="field"><span class="label">Số chỗ muốn xin</span>
        <div class="row"><div class="stepper"><button type="button" data-step="-1" aria-label="Giảm">−</button><output id="j-qty">1</output><button type="button" data-step="1" aria-label="Tăng">+</button></div>
          <span class="hint">Còn ${c.slot_trong} chỗ</span></div></div>
      <div class="field"><label for="j-msg">Lời nhắn cho chủ nhóm (không bắt buộc)</label>
        <textarea id="j-msg" maxlength="300" placeholder="vd: Mình chơi được 2 năm, hay đánh đôi nam…"></textarea></div>
      ${payHtml}
      <div class="total-line"><span>${deposit > 0 ? 'Tiền cọc cần thanh toán' : 'Phí đặt chỗ'}</span><span class="amt" id="j-total"></span></div>
      <p class="hint">Chủ nhóm sẽ duyệt yêu cầu. Nếu bị từ chối, chỗ và tiền cọc (nếu có) được hoàn lại tự động.</p>
      <div class="form-error mt" id="j-err" role="alert" hidden></div>`,
    footer: `<button class="btn ghost" data-modal-close>Để sau</button><button class="btn primary" id="j-submit"></button>`,
  });
  const qtyEl = $('#j-qty', m.el), totalEl = $('#j-total', m.el), submit = $('#j-submit', m.el);
  const refresh = () => {
    const q = Number(qtyEl.textContent);
    totalEl.textContent = deposit > 0 ? vnd(deposit * q) : 'Miễn phí';
    submit.textContent = deposit > 0 ? `Gửi yêu cầu · Cọc ${vnd(deposit * q)}` : 'Gửi yêu cầu tham gia';
  };
  refresh();
  $$('[data-step]', m.el).forEach(b => b.addEventListener('click', () => {
    qtyEl.textContent = Math.min(maxQty, Math.max(1, Number(qtyEl.textContent) + Number(b.dataset.step)));
    refresh();
  }));
  submit.addEventListener('click', () => busy(submit, async () => {
    const pm = $('input[name="pm"]:checked', m.el);
    try {
      const res = await api('/api/bookings', { method: 'POST', body: {
        court_id: c.id, so_luong_slot: Number(qtyEl.textContent),
        loi_nhan: $('#j-msg', m.el).value.trim() || null, phuong_thuc: pm ? pm.value : null } });
      m.close();
      closeAllModals();
      toast(res.thong_bao, 'success', 5500);
      loadCourts();
    } catch (err) {
      const box = $('#j-err', m.el);
      box.textContent = err.message; box.hidden = false;
      if (err.status === 409) loadCourts();   // ví dụ "Đã kín chỗ": cập nhật lại số slot ngay
    }
  }));
}

/* ---------------------------------------------------------------------
   Hồ sơ công khai & báo cáo vi phạm
   --------------------------------------------------------------------- */
async function openUserProfile(id) {
  const me = App.state.user;
  if (!me) { toast('Hãy đăng nhập để xem hồ sơ và điểm uy tín của người dùng.', 'info'); return; }
  const m = openModal({ title: 'Hồ sơ', size: 'sm', body: '<div class="skeleton"></div>' });
  let u;
  try { u = await api('/api/users/' + id); } catch (e) { m.close(); throw e; }
  const reviews = (u.danh_gia_gan_day || []).map(r => `
    <div class="review-item">
      <div class="row between"><b>${r.bung_keo ? 'Bị báo bùng kèo' : Number(r.diem).toFixed(1) + ' ★'}</b><span class="muted small">${esc(timeAgo(r.created_at))}</span></div>
      <div class="muted small">${r.loai === 'host_to_player' ? 'Chủ nhóm' : 'Người chơi'} ${esc(r.nguoi_danh_gia)} đánh giá</div>
      ${r.binh_luan ? `<div style="margin-top:2px">“${esc(r.binh_luan)}”</div>` : ''}
    </div>`).join('');
  m.setBody(`
    <div class="profile-top" style="margin-bottom:14px">${avatar(u, 56)}
      <div><div class="item-title">${esc(u.ho_ten)}</div>
        <div class="muted small">${u.role === 'host' ? 'Chủ nhóm / Chủ sân' : (u.role === 'admin' ? 'Quản trị viên' : 'Người chơi')}${u.role === 'host' && u.host_verified ? ' · đã xác thực' : ''}</div></div></div>
    <div class="rep-box">
      <div class="rep-score">${u.so_danh_gia > 0 ? Number(u.diem_uy_tin).toFixed(1) : '—'}</div>
      <div>${repBadge(u, false)}</div>
      <div class="muted small">${u.so_danh_gia} đánh giá · ${u.so_bung_keo} lần bùng kèo</div>
    </div>
    <div class="facts">
      <div class="fact"><div class="k">Trình độ tự đánh giá</div><div class="v">${esc(u.trinh_do_label)}</div></div>
      <div class="fact"><div class="k">Khu vực thường chơi</div><div class="v">${esc(u.khu_vuc_thuong_choi || 'Chưa cập nhật')}</div></div>
    </div>
    <h4 style="margin:6px 0 2px">Đánh giá gần đây</h4>
    ${reviews || '<p class="muted small" style="margin-top:6px">Chưa có đánh giá nào.</p>'}`);
  if (me.id !== u.id && me.role !== 'admin') {
    m.setFooter(`<button class="btn ghost" data-action="report-user" data-id="${u.id}" data-name="${esc(u.ho_ten)}">${icon('flag', 16)} Báo cáo người dùng</button>`);
  }
}

function openReport({ userId = null, courtId = null, name = '' }) {
  if (!App.state.user) { toast('Bạn cần đăng nhập để gửi báo cáo.', 'info'); return; }
  const reasons = App.meta.ly_do_bao_cao || [];
  const m = openModal({
    title: 'Báo cáo vi phạm', size: 'sm',
    body: `<p class="muted" style="margin-bottom:12px">Bạn đang báo cáo: <b>${esc(name)}</b></p>
      <div class="field"><label for="r-reason">Lý do</label><select id="r-reason">${reasons.map(r => `<option value="${esc(r.ma)}">${esc(r.ten)}</option>`).join('')}</select></div>
      <div class="field"><label for="r-desc">Mô tả chi tiết</label><textarea id="r-desc" maxlength="1000" placeholder="Điều gì đã xảy ra? Khi nào?"></textarea></div>
      <div class="form-error" id="r-err" role="alert" hidden></div>`,
    footer: '<button class="btn ghost" data-modal-close>Hủy</button><button class="btn danger" id="r-send">Gửi báo cáo</button>',
  });
  const send = $('#r-send', m.el);
  send.addEventListener('click', () => busy(send, async () => {
    try {
      const res = await api('/api/reports', { method: 'POST', body: {
        target_user_id: userId, court_id: courtId, ly_do: $('#r-reason', m.el).value, mo_ta: $('#r-desc', m.el).value.trim() || null } });
      m.close(); toast(res.thong_bao, 'success');
    } catch (err) { const box = $('#r-err', m.el); box.textContent = err.message; box.hidden = false; }
  }));
}

/* ---------------------------------------------------------------------
   Thời gian thực (NFR-01): WebSocket - slot trống tự cập nhật, không cần tải lại trang
   --------------------------------------------------------------------- */
function setLive(on) { const d = $('#live-dot'); if (d) d.classList.toggle('on', on); }

async function connectWS() {
  if (App.ws && App.ws.readyState <= 1) return;
  await ensureApiBase();
  if (App.ws && App.ws.readyState <= 1) return;
  let ws;
  try {
    const base = (API_BASE || location.origin).replace(/^http/, 'ws');
    ws = new WebSocket(base + '/ws' + (Auth.token() ? '?token=' + encodeURIComponent(Auth.token()) : ''));
  } catch (e) { return; }
  App.ws = ws;
  let ping;
  ws.onopen = () => { App.wsRetry = 0; setLive(true); ping = setInterval(() => { if (ws.readyState === 1) ws.send('ping'); }, 25000); };
  ws.onmessage = (ev) => { try { handleWsMessage(JSON.parse(ev.data)); } catch (e) { console.error(e); } };
  ws.onclose = () => {
    clearInterval(ping); setLive(false);
    App.wsRetry = (App.wsRetry || 0) + 1;
    setTimeout(connectWS, Math.min(30000, 1000 * 2 ** App.wsRetry));
  };
  ws.onerror = () => { try { ws.close(); } catch (e) { /* bỏ qua */ } };
}

function mergeCourt(partial) {
  const s = App.state;
  const cur = s.courts.find(c => c.id === partial.id);
  if (!cur) return;
  Object.assign(cur, partial);
  if (partial.trang_thai_hien_thi) cur.nhan_trang_thai = COURT_STATUS_TEXT[partial.trang_thai_hien_thi] || cur.nhan_trang_thai;
  const el = document.querySelector(`[data-court-id="${cur.id}"]`);
  if (el) {
    const tmp = document.createElement('div');
    tmp.innerHTML = courtCard(cur);
    const fresh = tmp.firstElementChild;
    el.replaceWith(fresh);
    fresh.classList.add('flash');
  }
}

// Khi đang mở trang ở tab khác, hiện thông báo của trình duyệt (cần người dùng đã cho phép ở tab Thông báo)
function showSystemNotification(n) {
  if (!document.hidden || !('Notification' in window) || Notification.permission !== 'granted') return;
  try { new Notification(n.tieu_de, { body: n.noi_dung || '', tag: 'bc-' + n.id }); } catch (e) { /* bỏ qua */ }
}

function handleWsMessage(msg) {
  const s = App.state;
  if (msg.type === 'court_update') {
    mergeCourt(msg.court);
    const d = s.detail;
    if (d && d.id === msg.court.id) {
      const box = d.modal.el.querySelector('[data-live-slots] .v');
      if (box) box.textContent = `${msg.court.slot_trong} / ${msg.court.tong_slot}`;
    }
    if (s.view === 'mine' && App.views.mine) App.views.mine.load();
  } else if (msg.type === 'court_new') {
    if (s.view === 'courts') loadCourtsSoon();
  } else if (msg.type === 'notification') {
    showSystemNotification(msg.notification);
    setUnread(s.unread + 1);
    toast(msg.notification.tieu_de, 'info');
    if (App.hooks.onNotification) App.hooks.onNotification(msg.notification);
    if (s.view === 'notifications' && App.views.notifications) App.views.notifications.load();
    if (s.view === 'bookings' && App.views.bookings) App.views.bookings.load();
    if (s.view === 'mine' && App.views.mine) App.views.mine.load();
  }
}
