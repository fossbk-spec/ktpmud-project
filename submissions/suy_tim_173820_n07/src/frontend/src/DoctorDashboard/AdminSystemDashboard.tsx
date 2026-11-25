import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  KeyRound, 
  FileText, 
  Lock, 
  Unlock, 
  Search, 
  Filter, 
  History, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  UserPlus,
  Database,
  Download, // Đã đổi chuẩn xác từ CloudArrowDown sang Download
  Check
} from 'lucide-react';

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
export type RoleType = 'DOCTOR' | 'NURSE' | 'PATIENT' | 'ADMIN';

export interface SystemUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: RoleType;
  department?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: RoleType;
  actionType: 'OVERRIDE_AI' | 'ACCEPT_AI' | 'OPEN_VISIT' | 'UPDATE_VITALS' | 'LOCK_USER' | 'LOGIN';
  description: string;
  ipAddress: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
}

// --- DỮ LIỆU MẪU (MOCK DATA) ---
const INITIAL_USERS: SystemUser[] = [
  {
    id: 'u-01',
    username: 'bs.an.nv',
    fullName: 'BS.CKII Nguyễn Văn An',
    email: 'an.nguyen@benhvienhuunghi.vn',
    phone: '0982.112.428',
    role: 'DOCTOR',
    department: 'Khoa Tim Mạch Can Thiệp',
    isActive: true,
    createdAt: '15/01/2026',
    lastLogin: 'Hôm nay, 08:12',
  },
  {
    id: 'u-02',
    username: 'dd.mai.tt',
    fullName: 'ĐD. Trần Thị Mai',
    email: 'mai.tran@benhvienhuunghi.vn',
    phone: '0973.445.678',
    role: 'NURSE',
    department: 'Quầy Tiếp Đón & Quản Lý Lượt Khám',
    isActive: true,
    createdAt: '20/02/2026',
    lastLogin: 'Hôm nay, 07:25',
  },
  {
    id: 'u-03',
    username: 'bn.manh.tv',
    fullName: 'Trần Văn Mạnh (BN-2026-0891)',
    email: 'manh.tran54@gmail.com',
    phone: '0912.345.678',
    role: 'PATIENT',
    department: 'Ngoại trú Suy tim',
    isActive: true,
    createdAt: '10/03/2026',
    lastLogin: 'Hôm nay, 08:15',
  },
  {
    id: 'u-04',
    username: 'admin.quantri',
    fullName: 'Kỹ sư Hệ thống Quản trị',
    email: 'admin.it@benhvienhuunghi.vn',
    phone: '0904.999.888',
    role: 'ADMIN',
    department: 'Phòng Công Nghệ Thông Tin',
    isActive: true,
    createdAt: '01/01/2026',
    lastLogin: 'Hôm nay, 09:30',
  },
  {
    id: 'u-05',
    username: 'bs.hoang.lv',
    fullName: 'BS. Lê Văn Hoàng',
    email: 'hoang.le@benhvienhuunghi.vn',
    phone: '0915.667.889',
    role: 'DOCTOR',
    department: 'Hồi sức Tim mạch Cấp cứu',
    isActive: false, // Tài khoản đang bị khóa
    createdAt: '12/04/2026',
    lastLogin: '18/10/2026',
  }
];

const INITIAL_LOGS: AuditLogItem[] = [
  {
    id: 'log-101',
    timestamp: '28/10/2026 10:30:15',
    actorName: 'BS.CKII Nguyễn Văn An',
    actorRole: 'DOCTOR',
    actionType: 'OVERRIDE_AI',
    description: 'Từ chối khuyến cáo khởi trị Sacubitril/Valsartan cho BN-2026-0891 (Lý do: eGFR tụt nhanh < 30 mL/min)',
    ipAddress: '192.168.1.104 (Máy trạm P204)',
    severity: 'WARN',
  },
  {
    id: 'log-102',
    timestamp: '28/10/2026 09:45:20',
    actorName: 'BS.CKII Nguyễn Văn An',
    actorRole: 'DOCTOR',
    actionType: 'ACCEPT_AI',
    description: 'Phê duyệt phác đồ GDMT 4 trụ cột và đồng bộ dữ liệu vào HIS/EMR cho BN-2026-0642',
    ipAddress: '192.168.1.104',
    severity: 'INFO',
  },
  {
    id: 'log-103',
    timestamp: '28/10/2026 08:35:10',
    actorName: 'Trần Văn Mạnh (Mobile App)',
    actorRole: 'PATIENT',
    actionType: 'UPDATE_VITALS',
    description: 'Cập nhật sinh hiệu vượt ngưỡng: Cân nặng tăng +2.3kg, Huyết áp 155/95 mmHg -> Kích hoạt Cảnh báo Đỏ',
    ipAddress: '14.232.118.45 (4G Client)',
    severity: 'CRITICAL',
  },
  {
    id: 'log-104',
    timestamp: '28/10/2026 08:10:05',
    actorName: 'ĐD. Trần Thị Mai',
    actorRole: 'NURSE',
    actionType: 'OPEN_VISIT',
    description: 'Tiếp nhận và mở lượt khám số LK-2026-442 cho bệnh nhân Lê Thị Hòa',
    ipAddress: '192.168.1.20 (Quầy tiếp đón)',
    severity: 'INFO',
  },
  {
    id: 'log-105',
    timestamp: '28/10/2026 07:15:00',
    actorName: 'Kỹ sư Hệ thống Quản trị',
    actorRole: 'ADMIN',
    actionType: 'LOCK_USER',
    description: 'Khóa tài khoản bs.hoang.lv do đăng nhập sai mật khẩu quá 5 lần',
    ipAddress: '192.168.1.5',
    severity: 'WARN',
  }
];

// Ma trận phân quyền RBAC mô phỏng
const RBAC_MATRIX = [
  { module: 'Quản lý tài khoản & Phân quyền hệ thống', doctor: false, nurse: false, patient: false, admin: true, note: 'Chỉ Admin được thao tác' },
  { module: 'Tra cứu & Xem hồ sơ bệnh án chi tiết', doctor: true, nurse: true, patient: false, admin: false, note: 'Nhân viên y tế và Bác sĩ' },
  { module: 'Tiếp đón & Mở lượt khám ban đầu', doctor: true, nurse: true, patient: false, admin: false, note: 'Nghiệp vụ quầy tiếp tân và y bác sĩ' },
  { module: 'Xem gợi ý chẩn đoán & phác đồ AI-CDSS', doctor: true, nurse: false, patient: false, admin: false, note: 'Chỉ bác sĩ chuyên khoa có thẩm quyền' },
  { module: 'Phê duyệt / Ghi đè (Override) khuyến nghị AI', doctor: true, nurse: false, patient: false, admin: false, note: 'Bắt buộc lưu vết vào Audit Logs' },
  { module: 'Nhập sinh hiệu hàng ngày tại nhà', doctor: false, nurse: false, patient: true, admin: false, note: 'Thao tác qua Mobile App' },
  { module: 'Xem nhật ký kiểm toán hệ thống (Audit Logs)', doctor: false, nurse: false, patient: false, admin: true, note: 'Quản trị viên giám sát an toàn vận hành' },
];

// Danh sách mẫu bệnh án (Tiểu mục 6.3)
const MEDICAL_TEMPLATES = [
  { id: 'tpl-01', code: 'HF-OUTPATIENT-V2', name: 'Mẫu Bệnh Án Ngoại Trú Suy Tim Chuyên Sâu', version: 'v2.4', updated: '15/10/2026', status: 'Đang áp dụng' },
  { id: 'tpl-02', code: 'HF-DISCHARGE-SUMMARY', name: 'Mẫu Tóm Tắt Hồ Sơ Ra Viện & Hướng Dẫn Điều Trị', version: 'v1.8', updated: '10/09/2026', status: 'Đang áp dụng' },
  { id: 'tpl-03', code: 'AI-CDSS-REC-FORM', name: 'Mẫu Ghi Nhận Quyết Định Phê Duyệt / Ghi Đè AI', version: 'v3.0', updated: '20/10/2026', status: 'Bản nháp' },
];

export default function AdminSystemDashboard() {
  const [activeTab, setActiveTab] = useState<'users' | 'rbac' | 'audit' | 'templates' | 'backup'>('users');
  const [users, setUsers] = useState<SystemUser[]>(INITIAL_USERS);
  const [logs] = useState<AuditLogItem[]>(INITIAL_LOGS);
  
  // Bộ lọc tìm kiếm
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [logSeverityFilter, setLogSeverityFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle Khóa / Mở khóa tài khoản người dùng
  const handleToggleLockUser = (userId: string) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        const nextState = !u.isActive;
        showToast(`Đã ${nextState ? 'mở khóa' : 'khóa'} thành công tài khoản: ${u.username}`);
        return { ...u, isActive: nextState };
      }
      return u;
    }));
  };

  // Lọc người dùng
  const filteredUsers = users.filter(u => {
    const matchQuery = u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
                       u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                       u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchQuery && matchRole;
  });

  // Lọc Audit Logs
  const filteredLogs = logs.filter(l => {
    return logSeverityFilter === 'ALL' || l.severity === logSeverityFilter;
  });

  return (
    <div className="space-y-6 font-sans text-slate-800 antialiased">
      
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm text-white shadow-2xl border border-slate-700">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TIÊU ĐỀ PHÂN HỆ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs">
              06
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Quản Trị Hệ Thống & Dữ Liệu Dùng Chung
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý tài khoản, phân quyền RBAC, mẫu bệnh án chuẩn, nhật ký kiểm toán y tế (Audit Logs) và cơ chế backup tự động.
          </p>
        </div>
      </div>

      {/* 2. THANH CHUYỂN ĐỔI TABS CHÍNH (Đã nâng cấp lên 5 tabs khớp 100% sơ đồ phân cấp 6.1 đến 6.5) */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold transition-all rounded-xl cursor-pointer ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>6.1 Người Dùng ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold transition-all rounded-xl cursor-pointer ${
            activeTab === 'rbac'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>6.2 Phân Quyền RBAC</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold transition-all rounded-xl cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>6.3 Mẫu Bệnh Án</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold transition-all rounded-xl cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <History className="h-4 w-4" />
          <span>6.4 Nhật Ký Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold transition-all rounded-xl cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>6.5 Sao Lưu / Backup</span>
        </button>
      </div>

      {/* ================= TAB 1: QUẢN LÝ NGƯỜI DÙNG (6.1) ================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row justify-between gap-3 items-center">
            
            <div className="relative w-full md:w-96">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Tìm kiếm tài khoản, họ tên, email..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="DOCTOR">Bác sĩ (Doctor)</option>
                <option value="NURSE">Y tá / Tiếp đón (Nurse)</option>
                <option value="PATIENT">Bệnh nhân (Patient)</option>
                <option value="ADMIN">Quản trị viên (Admin)</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/70 text-xs font-bold uppercase text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Tài Khoản & Họ Tên</th>
                  <th className="px-4 py-3.5">Vai Trò (Role)</th>
                  <th className="px-4 py-3.5">Khoa / Đơn Vị</th>
                  <th className="px-4 py-3.5 text-center">Trạng Thái</th>
                  <th className="px-6 py-3.5 text-right">Khóa / Mở Khóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{u.fullName}</div>
                      <div className="font-mono text-indigo-600 font-medium mt-0.5">{u.username} • <span className="text-slate-400">{u.email}</span></div>
                    </td>
                    <td className="px-4 py-4 font-semibold">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'DOCTOR' ? 'bg-blue-100 text-blue-700' :
                        u.role === 'NURSE' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600 font-medium">{u.department || 'N/A'}</td>
                    <td className="px-4 py-4 text-center">
                      {u.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                          Đã khóa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleLockUser(u.id)}
                        className={`inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer ${
                          u.isActive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {u.isActive ? <Lock className="mr-1.5 h-3.5 w-3.5" /> : <Unlock className="mr-1.5 h-3.5 w-3.5" />}
                        <span>{u.isActive ? 'Khóa tài khoản' : 'Mở khóa'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: PHÂN QUYỀN RBAC (6.2) ================= */}
      {activeTab === 'rbac' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Ma Trận Phân Quyền Truy Cập (RBAC Matrix)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Xác định rõ quyền hạn thao tác của từng nhóm người dùng trên các phân hệ hệ thống.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Chức Năng / Phân Hệ Hệ Thống</th>
                  <th className="p-3.5 text-center">Bác Sĩ</th>
                  <th className="p-3.5 text-center">Y Tế</th>
                  <th className="p-3.5 text-center">Bệnh Nhân</th>
                  <th className="p-3.5 text-center">Quản Trị Viên</th>
                  <th className="p-3.5">Ghi Chú Nghiệp Vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {RBAC_MATRIX.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3.5 font-semibold text-slate-900">{item.module}</td>
                    <td className="p-3.5 text-center">
                      {item.doctor ? <span className="text-emerald-600 font-bold text-base">✓</span> : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="p-3.5 text-center">
                      {item.nurse ? <span className="text-emerald-600 font-bold text-base">✓</span> : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="p-3.5 text-center">
                      {item.patient ? <span className="text-emerald-600 font-bold text-base">✓</span> : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="p-3.5 text-center">
                      {item.admin ? <span className="text-emerald-600 font-bold text-base">✓</span> : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="p-3.5 text-slate-500 italic">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: QUẢN LÝ MẪU BỆNH ÁN (6.3) ================= */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Quản Lý Các Mẫu Bệnh Án Chuẩn (Medical Record Templates)</h3>
              <p className="text-xs text-slate-500">Cấu hình form nhập liệu chuyên khoa suy tim chuẩn hóa theo Bộ Y tế và định dạng AI-CDSS.</p>
            </div>
            <button 
              onClick={() => showToast('Đang mở form tạo mẫu bệnh án mới...')}
              className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 cursor-pointer"
            >
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Tạo mẫu mới
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/70 text-xs font-bold uppercase text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Mã Mẫu & Tên Biểu Mẫu</th>
                  <th className="px-4 py-3.5">Phiên Bản</th>
                  <th className="px-4 py-3.5">Cập Nhật Gần Nhất</th>
                  <th className="px-4 py-3.5 text-center">Trạng Thái</th>
                  <th className="px-6 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {MEDICAL_TEMPLATES.map((tpl) => (
                  <tr key={tpl.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{tpl.name}</div>
                      <div className="font-mono text-indigo-600 font-medium mt-0.5">{tpl.code}</div>
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-slate-700">{tpl.version}</td>
                    <td className="px-4 py-4 text-slate-600">{tpl.updated}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        {tpl.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => showToast(`Đang tải cấu hình mẫu ${tpl.code} để chỉnh sửa...`)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Cấu hình
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 4: NHẬT KÝ KIỂM TOÁN / AUDIT LOGS (6.4) ================= */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Nhật Ký Kiểm Toán Y Tế (Audit Logs)</h3>
              <p className="text-xs text-slate-500">Lưu vết 100% các thao tác quan trọng nhằm đảm bảo tính pháp lý và an toàn thông tin.</p>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={logSeverityFilter}
                onChange={(e) => setLogSeverityFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Mọi mức độ cảnh báo</option>
                <option value="INFO">INFO (Thông tin)</option>
                <option value="WARN">WARN (Cảnh báo chỉnh sửa)</option>
                <option value="CRITICAL">CRITICAL (Khẩn cấp)</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/70 text-xs font-bold uppercase text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Thời Gian & IP</th>
                  <th className="px-4 py-3.5">Người Thực Hiện</th>
                  <th className="px-4 py-3.5">Hành Động</th>
                  <th className="px-6 py-3.5">Mô Tả Chi Tiết Thao Tác</th>
                  <th className="px-4 py-3.5 text-center">Mức Độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 font-mono">
                      <div className="font-bold text-slate-900">{log.timestamp}</div>
                      <div className="text-[10px] text-slate-400">{log.ipAddress}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{log.actorName}</div>
                      <span className="text-[10px] text-indigo-600 font-bold">{log.actorRole}</span>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-700">
                      {log.actionType}
                    </td>
                    <td className="px-6 py-3.5 text-slate-800 font-medium max-w-md">
                      {log.description}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        log.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 animate-pulse' :
                        log.severity === 'WARN' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 5: SAO LƯU / BACKUP HỆ THỐNG (6.5) ================= */}
      {activeTab === 'backup' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Quản Lý Sao Lưu & Phục Hồi Dữ Liệu (Backup & Restore)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Cơ chế backup tự động định kỳ cơ sở dữ liệu bệnh án suy tim và lịch sử AI-CDSS tại Bệnh viện Hữu Nghị.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="text-xs text-slate-500 font-bold uppercase">Trạng thái tự động</span>
                <div className="text-base font-bold text-emerald-600 flex items-center">
                  <Check className="w-5 h-5 mr-1.5" /> Đang hoạt động (Cron Job)
                </div>
                <p className="text-[11px] text-slate-400">Lịch trình: Tự động backup toàn bộ DB lúc 02:00 AM hàng ngày.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="text-xs text-slate-500 font-bold uppercase">Dung lượng bản backup</span>
                <div className="text-base font-bold text-slate-800">4.8 GB / 50 GB Storage</div>
                <p className="text-[11px] text-slate-400">Lưu trữ an toàn trên Cloud Server mã hóa AES-256.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase">Thao tác thủ công</span>
                <button
                  onClick={() => showToast('Đang tiến hành tạo bản sao lưu thủ công (Full Backup)...')}
                  className="mt-2 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 cursor-pointer"
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  Tạo bản Backup Ngay
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Lịch sử các bản Backup gần đây</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="font-bold text-slate-800">Cadiocare_Full_Backup_20261028_0200.sql.gz</span>
                    <span className="block text-[10px] text-slate-400">Hôm nay, 02:00 AM • Tự động hóa hệ thống</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-700">Thành công (4.8 GB)</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="font-bold text-slate-800">Cadiocare_Full_Backup_20261027_0200.sql.gz</span>
                    <span className="block text-[10px] text-slate-400">Hôm qua, 02:00 AM • Tự động hóa hệ thống</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-700">Thành công (4.7 GB)</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}