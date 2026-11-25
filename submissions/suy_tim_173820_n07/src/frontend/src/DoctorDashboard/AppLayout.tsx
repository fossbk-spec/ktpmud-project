import React, { useState, useEffect } from 'react';
import {
  Users,
  Database,
  Bell,
  Menu,
  X,
  HeartPulse,
  ChevronDown,
  LogOut,
  Stethoscope,
  ArrowLeft,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  Heart
} from 'lucide-react';

// Import chính xác các phân hệ chức năng
import PatientRecordManagement from './PatientRecordManagement';
import HospitalDataIntegration from './HospitalDataIntegration';
import {
  acknowledgeAlertInStorage,
  appendAuditLog,
  PatientVitalSubmission,
  SharedAlertItem,
  STORAGE_KEYS,
} from '../utils/cadiocareStorage';

type TabId = 'reception' | 'integration' | 'admin';

interface NavItem {
  id: TabId;
  name: string;
  numberTag: string;
  icon: React.ElementType;
  description: string;
}

interface DoctorVisitDetailViewProps {
  patientCode: string;
  doctorName: string;
  onBack: () => void;
}

function DoctorVisitDetailView({
  patientCode,
  doctorName,
  onBack,
}: DoctorVisitDetailViewProps) {
  const [vitals, setVitals] = useState<PatientVitalSubmission[]>([]);
  const [alerts, setAlerts] = useState<SharedAlertItem[]>([]);
  const [clinicalNote, setClinicalNote] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadPatientSharedData = () => {
    try {
      const rawVitals = localStorage.getItem(STORAGE_KEYS.VITALS);
      const allVitals: PatientVitalSubmission[] = rawVitals ? JSON.parse(rawVitals) : [];
      setVitals(allVitals.filter((v) => v.patientCode === patientCode));

      const rawAlerts = localStorage.getItem(STORAGE_KEYS.ALERTS);
      const allAlerts: SharedAlertItem[] = rawAlerts ? JSON.parse(rawAlerts) : [];
      setAlerts(allAlerts.filter((a) => a.patient_code === patientCode));
    } catch (err) {
      console.error('Lỗi đọc dữ liệu lượt khám:', err);
    }
  };

  useEffect(() => {
    loadPatientSharedData();
    appendAuditLog({
      actor: doctorName,
      role: 'DOCTOR',
      bpcCode: '1.3 / 1.4',
      action: 'Mở Doctor Dashboard chi tiết lượt khám',
      detail: `Mã bệnh nhân: ${patientCode}`,
    });

    window.addEventListener('cadiocare-storage-updated', loadPatientSharedData);
    window.addEventListener('storage', loadPatientSharedData);
    return () => {
      window.removeEventListener('cadiocare-storage-updated', loadPatientSharedData);
      window.removeEventListener('storage', loadPatientSharedData);
    };
  }, [patientCode]);

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlertInStorage(alertId, doctorName);
    loadPatientSharedData();
    setStatusMessage('Đã xác nhận tiếp nhận cảnh báo và ghi nhận vào Nhật ký hoạt động.');
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicalNote.trim()) return;

    appendAuditLog({
      actor: doctorName,
      role: 'DOCTOR',
      bpcCode: '1.4 / 4.1',
      action: 'Ghi nhận nhận định khám & kế hoạch xử trí',
      detail: `${patientCode}: ${clinicalNote.trim()}`,
    });

    setClinicalNote('');
    setStatusMessage('Đã lưu nhận định khám và đồng bộ vào Nhật ký hoạt động.');
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 antialiased">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại danh sách</span>
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-xs">
                1.3
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Doctor Dashboard Chi Tiết — Bệnh nhân {patientCode}
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Theo dõi sinh hiệu ngoại trú, tiếp nhận cảnh báo và ghi nhận thông tin khám lâm sàng (1.3 – 1.5).
            </p>
          </div>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
          Bác sĩ phụ trách: {doctorName}
        </span>
      </div>

      {statusMessage && (
        <div className="flex items-center space-x-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          {/* Cảnh báo từ bệnh nhân */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="flex items-center space-x-2 text-sm font-bold text-slate-900">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>Cảnh báo sinh hiệu & triệu chứng ({alerts.length})</span>
              </h2>
              <span className="text-[11px] text-slate-400">cadiocare_shared_alerts</span>
            </div>

            {alerts.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">
                Hiện chưa có cảnh báo nào được ghi nhận cho mã bệnh nhân {patientCode}.
              </p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alt) => (
                  <div
                    key={alt.id}
                    className={`rounded-xl border p-4 text-xs space-y-2 ${
                      alt.severity === 'RED'
                        ? 'border-rose-200 bg-rose-50/70'
                        : 'border-amber-200 bg-amber-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{alt.recorded_at}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          alt.status === 'PENDING'
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {alt.status === 'PENDING' ? 'Chờ bác sĩ xử lý' : 'Đã tiếp nhận'}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800">{alt.summary}</div>
                    {alt.alert_message && (
                      <div className="font-medium text-rose-700">{alt.alert_message}</div>
                    )}
                    {alt.status === 'PENDING' ? (
                      <button
                        type="button"
                        onClick={() => handleAcknowledge(alt.id)}
                        className="inline-flex items-center space-x-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Đã nhận / Xử lý cảnh báo</span>
                      </button>
                    ) : (
                      <div className="text-[11px] font-medium text-emerald-700">
                        Đã xác nhận bởi {alt.handled_by_doctor} ({alt.handled_at})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lịch sử chỉ số sinh hiệu bệnh nhân gửi */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="flex items-center space-x-2 text-sm font-bold text-slate-900">
                <Activity className="h-4 w-4 text-blue-600" />
                <span>Chỉ số sinh hiệu bệnh nhân tự ghi nhận ({vitals.length})</span>
              </h2>
              <span className="text-[11px] text-slate-400">cadiocare_5_1_vitals</span>
            </div>

            {vitals.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">
                Chưa có bản ghi sinh hiệu nào mới cho bệnh nhân {patientCode}.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {vitals.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="inline-flex items-center space-x-1 font-semibold text-slate-700">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{v.recordedAt}</span>
                      </span>
                      <span>Phù mức {v.edemaLevel}/5</span>
                    </div>
                    <div className="font-bold text-slate-900">
                      Cân nặng: {v.weightKg} kg • HA: {v.systolicBp}/{v.diastolicBp} mmHg • Mạch: {v.heartRate} bpm
                    </div>
                    {v.symptoms.length > 0 && (
                      <div className="text-slate-600">Triệu chứng: {v.symptoms.join(', ')}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ghi nhận thông tin khám lâm sàng */}
        <form
          onSubmit={handleSaveNote}
          className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 h-fit"
        >
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Heart className="h-4 w-4 text-rose-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Ghi nhận & cập nhật thông tin khám (1.4)
            </h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nhận định lâm sàng, đánh giá triệu chứng & chỉ định xử trí
            </label>
            <textarea
              rows={5}
              required
              value={clinicalNote}
              onChange={(e) => setClinicalNote(e.target.value)}
              placeholder="Nhập nhận định lâm sàng, đánh giá sung huyết, chỉnh liều thuốc hoặc kế hoạch theo dõi..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Lưu ghi nhận lượt khám
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabId>('reception');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedVisitPatientCode, setSelectedVisitPatientCode] = useState<string | null>(null);

  const navItems: NavItem[] = [
    {
      id: 'reception',
      name: 'Quản lý hồ sơ bệnh án & lượt khám',
      numberTag: '01',
      icon: Users,
      description: 'Tiếp đón, tra cứu hồ sơ và theo dõi lâm sàng'
    },
    {
      id: 'integration',
      name: 'Tích hợp và tiền xử lý dữ liệu',
      numberTag: '02',
      icon: Database,
      description: 'ETL Pipeline, đồng bộ HIS/EMR, LIS, PACS'
    },
  ];

  const handleOpenDoctorDashboard = (patientCode: string) => {
    setActiveTab('reception');
    setSelectedVisitPatientCode(patientCode);
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">

      {/* 1. SIDEBAR BÊN TRÁI */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-slate-100 shadow-xl
        transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/30">
              <HeartPulse className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <span className="text-base font-bold tracking-wider text-white block leading-tight">CADIOCARE</span>
              <span className="text-[11px] text-slate-400 font-medium">BV Hữu Nghị • Quản lý Suy tim</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Trạng thái HL7/FHIR Gateway */}
        <div className="mx-4 my-4 rounded-xl bg-slate-800/60 p-3.5 border border-slate-700/60 flex items-center justify-between text-xs shadow-inner">
          <div className="flex items-center space-x-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-200 font-semibold">HL7/FHIR Gateway</span>
          </div>
          <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800">
            Online
          </span>
        </div>

        {/* Menu Điều hướng */}
        <nav className="flex-1 space-y-3 px-4 py-2 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Phân hệ chuyên môn</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSelectedVisitPatientCode(null);
                  setSidebarOpen(false);
                }}
                className={`
                  group flex w-full items-center space-x-3 rounded-2xl px-4 py-3.5 text-left transition-all cursor-pointer
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'}
                `}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-blue-400 group-hover:bg-slate-700'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs leading-snug font-bold truncate">{item.name}</span>
                    <span className={`ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.numberTag}
                    </span>
                  </div>
                  <div className={`text-[10px] mt-1 truncate ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bổ sung Widget Nhắc nhở / Hỗ trợ lâm sàng ở khoảng trống dưới Sidebar */}
        <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-blue-950/60 to-slate-900 p-4 border border-blue-900/40 text-xs space-y-2">
          <div className="flex items-center space-x-2 text-blue-400 font-bold">
            <Stethoscope className="h-4 w-4" />
            <span>AI-CDSS Trực tuyến</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Hệ thống hỗ trợ ra quyết định lâm sàng 4 trụ cột GDMT đang hoạt động ổn định.
          </p>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-800 p-4 bg-slate-950/60 text-xs text-slate-400">
          <div className="flex justify-between items-center">
            <span>Khoa: <strong className="text-slate-200">Tim mạch</strong></span>
            <span className="text-[10px] bg-blue-950 text-blue-400 px-2 py-0.5 rounded-full font-bold border border-blue-900">Trực chính</span>
          </div>
        </div>
      </aside>

      {/* 2. KHU VỰC CHÍNH BÊN PHẢI (TOPBAR + MAIN CONTENT) */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm z-30">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Hệ thống Quản lý Suy tim</span>
              <h2 className="text-sm font-bold text-slate-800">Bệnh viện Hữu Nghị • Phòng khám Chuyên khoa</h2>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Nút chuông thông báo */}
            <button
              onClick={() => alert('Trung tâm cảnh báo: Có 2 ca Cảnh báo Đỏ quá tải dịch và 1 ca Cảnh báo Vàng.')}
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow ring-2 ring-white animate-bounce">
                3
              </span>
            </button>

            <div className="h-8 w-px bg-slate-200" />

            {/* Khu vực tên bác sĩ & đăng xuất */}
            <div className="relative">
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3 cursor-pointer group p-1.5 rounded-xl hover:bg-slate-100 transition-all"
              >
                <img
                  className="h-10 w-10 rounded-xl object-cover ring-2 ring-blue-500/20"
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=256&auto=format&fit=crop"
                  alt="Avatar Bác sĩ"
                />
                <div className="hidden text-left md:block">
                  <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    BS.CKII Nguyễn Văn An
                  </p>
                  <p className="text-xs text-slate-500">Mã NV: BS-0428 • Khoa Tim Mạch</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>

              {/* Menu thả xuống đăng xuất */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="text-xs text-slate-400">Phiên làm việc</p>
                    <p className="text-sm font-semibold text-white">Đang hoạt động</p>
                  </div>

                  <button
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Đăng xuất hệ thống</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 3. VÙNG RENDER NỘI DUNG */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
          {activeTab === 'reception' && (
            selectedVisitPatientCode ? (
              <DoctorVisitDetailView
                patientCode={selectedVisitPatientCode}
                doctorName="BS.CKII Nguyễn Văn An"
                onBack={() => setSelectedVisitPatientCode(null)}
              />
            ) : (
              <PatientRecordManagement onOpenDoctorDashboard={handleOpenDoctorDashboard} />
            )
          )}

          {activeTab === 'integration' && (
            <HospitalDataIntegration />
          )}
        </main>

      </div>
    </div>
  );
}