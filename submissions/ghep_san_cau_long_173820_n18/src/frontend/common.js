'use strict';
/* =====================================================================
   common.js - dùng chung cho index.html và login.html
   ===================================================================== */

// Cấu hình URL máy chủ backend Render (khi web chạy trên Netlify hoặc mở file://)
const DEFAULT_API_BASE = 'https://badminton-backend-xlwc.onrender.com';

const _isLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(location.hostname);
const _isRenderBackend = location.hostname.includes('onrender.com');

// Ưu tiên: biến cấu hình lưu trong trình duyệt -> nếu chạy trên Netlify/file thì trỏ thẳng Render -> nếu không thì cùng origin
let API_BASE = localStorage.getItem('API_BASE') || window.API_BASE || (
  (location.protocol === 'file:' || (!_isLocal && !_isRenderBackend)) ? DEFAULT_API_BASE : ''
);

let _apiBaseReady = null;
function ensureApiBase() {
  if (!_apiBaseReady) {
    _apiBaseReady = (async () => {
      if (API_BASE) return;
      try {
        const r = await fetch('/api/health', { cache: 'no-store' });
        if (!r.ok || (await r.json()).status !== 'ok') throw new Error('không phải máy chủ API');
      } catch (e) {
        API_BASE = _isLocal ? 'http://127.0.0.1:8000' : DEFAULT_API_BASE;
      }
    })();
  }
  return _apiBaseReady;
}

const App = { state: {}, actions: {}, meta: null, hooks: {} };

/* ---------- Đăng nhập: lưu vé thông hành (JWT) ---------- */
const Auth = {
  token() { return localStorage.getItem('access_token'); },
  user() { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { return null; } },
  save(token, user) { localStorage.setItem('access_token', token); if (user) localStorage.setItem('user', JSON.stringify(user)); },
  setUser(user) { localStorage.setItem('user', JSON.stringify(user)); },
  clear() { ['access_token', 'user', 'app_mode'].forEach(k => localStorage.removeItem(k)); },
};

/* ---------- Gọi API ---------- */
class ApiError extends Error {
  constructor(message, status, detail) { super(message); this.status = status; this.detail = detail || null; }
}

let _expiredShown = false;
function onSessionExpired() {
  if (_expiredShown) return;
  _expiredShown = true;
  Auth.clear();
  toast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.', 'error');
  setTimeout(() => { location.href = 'login.html'; }, 1400);
}

async function api(path, opts = {}) {
  await ensureApiBase();
  const { method = 'GET', body, form, auth = true } = opts;
  const headers = {};
  const token = Auth.token();
  if (token && auth) headers['Authorization'] = 'Bearer ' + token;
  let payload;
  if (form) { headers['Content-Type'] = 'application/x-www-form-urlencoded'; payload = new URLSearchParams(form); }
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }

  let res;
  try { res = await fetch(API_BASE + path, { method, headers, body: payload }); }
  catch (e) { throw new ApiError('Không thể kết nối đến máy chủ. Hãy kiểm tra xem uvicorn đã chạy chưa.', 0); }

  let data = null;
  try { data = await res.json(); } catch (e) { /* phản hồi không có JSON */ }
  if (!res.ok) {
    const d = data && data.detail;
    let msg = 'Có lỗi xảy ra, vui lòng thử lại.';
    if (typeof d === 'string') msg = d;
    else if (Array.isArray(d)) msg = 'Dữ liệu chưa hợp lệ, vui lòng kiểm tra lại các ô đã nhập.';
    else if (d && d.message) msg = d.message;
    if (res.status === 401 && token && auth) onSessionExpired();
    throw new ApiError(msg, res.status, d && typeof d === 'object' ? d : null);
  }
  return data;
}

async function loadMeta() {
  if (App.meta) return App.meta;
  try { App.meta = await api('/api/meta', { auth: false }); }
  catch (e) {
    App.meta = {
      trinh_do: [[1, 'Newbie'], [2, 'Trung bình - Yếu'], [3, 'Trung bình'], [4, 'Khá'], [5, 'Giỏi']].map(([ma, ten]) => ({ ma, ten })),
      quan_huyen: [], phuong_thuc_tt: [], ly_do_bao_cao: [], chinh_sach: { sua_truoc_gio: 2, huy_mien_phi_truoc_gio: 2, toi_da_slot_moi_yeu_cau: 4 }, otp_demo: false,
    };
  }
  return App.meta;
}

/* ---------- Tiện ích ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, ch => ENT[ch]); }
function vnd(n) { return Number(n || 0).toLocaleString('vi-VN') + 'đ'; }
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const pad2 = n => String(n).padStart(2, '0');

// Mọi tính toán ngày theo giờ Việt Nam (UTC+7), không phụ thuộc múi giờ trình duyệt
function vnNow() { return new Date(Date.now() + 7 * 3600 * 1000); }
function dateStrFromVn(d) { return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate()); }
function todayStr() { return dateStrFromVn(vnNow()); }
function addDaysStr(n) { return dateStrFromVn(new Date(vnNow().getTime() + n * 86400000)); }
function isoAddDays(iso, n) { const [y, m, d] = iso.split('-').map(Number); return dateStrFromVn(new Date(Date.UTC(y, m - 1, d + n))); }
function weekdayOf(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }
function ddmm(iso) { const p = iso.split('-'); return p[2] + '/' + p[1]; }
function fmtDay(iso) { return WEEKDAYS[weekdayOf(iso)] + ', ' + ddmm(iso); }
function relDay(iso) {
  if (iso === todayStr()) return 'Hôm nay';
  if (iso === addDaysStr(1)) return 'Ngày mai';
  return WEEKDAYS[weekdayOf(iso)] + ' ' + ddmm(iso);
}
function parseServerTime(iso) { return Date.parse(iso && iso.length <= 19 ? iso + '+07:00' : iso); }
function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - parseServerTime(iso)) / 1000);
  if (s < 60) return 'vừa xong';
  if (s < 3600) return Math.floor(s / 60) + ' phút trước';
  if (s < 86400) return Math.floor(s / 3600) + ' giờ trước';
  if (s < 7 * 86400) return Math.floor(s / 86400) + ' ngày trước';
  return new Date(parseServerTime(iso)).toLocaleDateString('vi-VN');
}
function initials(name) {
  const p = String(name || '?').trim().split(/\s+/);
  return (p.length > 1 ? p[0][0] + p[p.length - 1][0] : p[0].slice(0, 2)).toUpperCase();
}
function levelName(n) { const t = (App.meta && App.meta.trinh_do || []).find(x => x.ma === Number(n)); return t ? t.ten : '—'; }
function levelOptions(selected, anyLabel) {
  const list = (App.meta && App.meta.trinh_do) || [];
  return (anyLabel ? `<option value="">${esc(anyLabel)}</option>` : '') +
    list.map(t => `<option value="${t.ma}" ${Number(selected) === t.ma ? 'selected' : ''}>${esc(t.ten)}</option>`).join('');
}
function districtOptions(selected, anyLabel) {
  const list = (App.meta && App.meta.quan_huyen) || [];
  return (anyLabel ? `<option value="">${esc(anyLabel)}</option>` : '') +
    list.map(d => `<option ${d === selected ? 'selected' : ''}>${esc(d)}</option>`).join('');
}

// Sao chép văn bản vào clipboard (có phương án dự phòng khi trang không chạy trên https/localhost)
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* thử cách khác */ }
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  return ok;
}
function downloadFile(filename, mime, content) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---------- Biểu tượng (SVG nội tuyến, không cần tải thêm) ---------- */
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  sliders: '<path d="M4 6h8M18 6h2M4 12h2M12 12h8M4 18h10M20 18h0"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
  wallet: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
  nav: '<path d="m3 11 19-9-9 19-2-8z"/>',
  flag: '<path d="M4 22V4M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  court: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M12 4v16M3 9h18M3 15h18"/>',
  home: '<path d="m3 11 9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  calplus: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  dash: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
};
function icon(name, size = 18) {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

/* ---------- Thông báo nổi (toast) ---------- */
function toast(message, type = 'info', ms = 4000) {
  const root = document.getElementById('toast-root');
  if (!root) { alert(message); return; }
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, ms);
}

/* ---------- Modal (xếp chồng được) ---------- */
const _modalStack = [];
function openModal({ title = '', body = '', footer = '', size = '', onClose } = {}) {
  const root = document.getElementById('modal-root');
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="sheet ${size}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet-head"><h2>${esc(title)}</h2><button class="icon-btn" data-modal-close aria-label="Đóng">${icon('x', 20)}</button></div>
      <div class="sheet-body">${body}</div>
      ${footer ? `<div class="sheet-foot">${footer}</div>` : ''}
    </div>`;
  const prevFocus = document.activeElement;
  const modal = {
    el: overlay,
    body: overlay.querySelector('.sheet-body'),
    foot: overlay.querySelector('.sheet-foot'),
    setTitle(t) { overlay.querySelector('.sheet-head h2').textContent = t; },
    setBody(html) { this.body.innerHTML = html; },
    setFooter(html) {
      let f = overlay.querySelector('.sheet-foot');
      if (!html) { if (f) f.remove(); this.foot = null; return; }
      if (!f) { f = document.createElement('div'); f.className = 'sheet-foot'; overlay.querySelector('.sheet').appendChild(f); }
      f.innerHTML = html; this.foot = f;
    },
    close() {
      const i = _modalStack.indexOf(modal);
      if (i < 0) return;
      _modalStack.splice(i, 1);
      overlay.remove();
      if (!_modalStack.length) document.body.classList.remove('modal-open');
      if (onClose) { try { onClose(); } catch (e) { console.error(e); } }
      if (prevFocus && prevFocus.focus) { try { prevFocus.focus(); } catch (e) { /* bỏ qua */ } }
    },
  };
  overlay._modal = modal;
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) modal.close(); });
  overlay.addEventListener('keydown', (e) => {   // giữ phím Tab xoay vòng bên trong hộp thoại
    if (e.key !== 'Tab') return;
    const items = $$('a[href], button:not([disabled]), input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', overlay)
      .filter(el => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  root.appendChild(overlay);
  _modalStack.push(modal);
  document.body.classList.add('modal-open');
  const first = overlay.querySelector('input:not([type=hidden]), select, textarea') || overlay.querySelector('[data-modal-close]');
  if (first) setTimeout(() => { try { first.focus({ preventScroll: true }); } catch (e) { /* bỏ qua */ } }, 30);
  return modal;
}
function closeTopModal() { const m = _modalStack[_modalStack.length - 1]; if (m) m.close(); }
function closeAllModals() { while (_modalStack.length) closeTopModal(); }
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTopModal(); });
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-modal-close]');
  if (btn) { const ov = btn.closest('.overlay'); if (ov && ov._modal) ov._modal.close(); }
});

function confirmDialog({ title = 'Xác nhận', message = '', confirmText = 'Đồng ý', cancelText = 'Hủy', danger = false } = {}) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    const m = openModal({
      title, size: 'sm', body: `<p class="confirm-msg">${esc(message)}</p>`,
      footer: `<button class="btn ghost" data-r="0">${esc(cancelText)}</button><button class="btn ${danger ? 'danger' : 'primary'}" data-r="1">${esc(confirmText)}</button>`,
      onClose: () => finish(false),
    });
    $$('[data-r]', m.el).forEach(b => b.addEventListener('click', () => { finish(b.dataset.r === '1'); m.close(); }));
  });
}

function askText({ title = '', label = '', placeholder = '', confirmText = 'Gửi', required = false, danger = false } = {}) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    const m = openModal({
      title, size: 'sm',
      body: `<div class="field"><label for="ask-text">${esc(label)}</label><textarea id="ask-text" maxlength="300" placeholder="${esc(placeholder)}"></textarea><div class="form-error" id="ask-err" hidden>Vui lòng nhập nội dung.</div></div>`,
      footer: `<button class="btn ghost" data-r="0">Hủy</button><button class="btn ${danger ? 'danger' : 'primary'}" data-r="1">${esc(confirmText)}</button>`,
      onClose: () => finish(null),
    });
    $$('[data-r]', m.el).forEach(b => b.addEventListener('click', () => {
      if (b.dataset.r === '0') { m.close(); return; }
      const v = $('#ask-text', m.el).value.trim();
      if (required && !v) { $('#ask-err', m.el).hidden = false; return; }
      finish(v); m.close();
    }));
  });
}

/* ---------- Chạy một thao tác bất đồng bộ trên nút (khóa nút để tránh bấm đúp) ---------- */
async function busy(btn, fn) {
  if (btn) { btn.classList.add('is-busy'); btn.setAttribute('aria-busy', 'true'); }
  try { return await fn(); }
  finally { if (btn) { btn.classList.remove('is-busy'); btn.removeAttribute('aria-busy'); } }
}

/* ---------- Thành phần giao diện dùng chung ---------- */
function avatar(u, size = 40) { return `<span class="avatar" style="--s:${size}px">${esc(initials(u.ho_ten || u.username))}</span>`; }

function repBadge(u, withScore = true) {
  const map = { trusted: ['good', 'shield'], warning: ['bad', 'flag'], low: ['warn', 'flag'], new: ['muted', 'user'], normal: ['', 'star'] };
  const [tone, ic] = map[u.nhan_uy_tin] || map.normal;
  const score = withScore && u.so_danh_gia > 0 ? ` <span class="score">${Number(u.diem_uy_tin).toFixed(1)}★ (${u.so_danh_gia})</span>` : '';
  return `<span class="rep ${tone}">${icon(ic, 13)}${esc(u.nhan_uy_tin_text)}${score}</span>`;
}
function pill(code, text) { return `<span class="pill ${esc(code)}">${esc(text)}</span>`; }

function slotsHtml(c) {
  const total = c.tong_slot, free = c.slot_trong, taken = total - free;
  let dots = '';
  if (total <= 12) for (let i = 0; i < total; i++) dots += `<i class="${i < taken ? 'on' : ''}"></i>`;
  const cls = free === 0 ? 'none' : (free <= 2 ? 'low' : '');
  return `<div class="slots" data-slots-of="${c.id}"><span class="dots" aria-hidden="true">${dots}</span><span class="slots-text ${cls}"><b>${free}</b>/${total} chỗ trống</span></div>`;
}

function timeBlock(c, extraClass = '') {
  const dim = ['full', 'ongoing', 'finished', 'cancelled'].includes(c.trang_thai_hien_thi) ? ' dim' : '';
  return `<div class="time-block${dim} ${extraClass}"><div class="tb-top">${esc(relDay(c.ngay_choi))}</div><div class="tb-mid">${esc(c.gio_bat_dau)}</div><div class="tb-bot">đến ${esc(c.gio_ket_thuc)}</div></div>`;
}

function directionsUrl(c) {
  if (c.vi_do != null && c.kinh_do != null) return `https://www.google.com/maps/dir/?api=1&destination=${c.vi_do},${c.kinh_do}`;
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((c.dia_chi || c.ten_san) + ' ' + (c.khu_vuc || '') + ' Hà Nội');
}

// Xử lý lỗi chung cho các hành động bấm nút
function handleError(err) {
  console.error(err);
  toast(err && err.message ? err.message : 'Có lỗi xảy ra, vui lòng thử lại.', 'error');
}

// Ủy quyền sự kiện: mọi phần tử có data-action đều gọi App.actions[tên](phần tử, sự kiện)
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = App.actions[el.dataset.action];
  if (!fn) return;
  if (el.tagName === 'A' && !el.getAttribute('href')) e.preventDefault();
  Promise.resolve().then(() => fn(el, e)).catch(handleError);
});
