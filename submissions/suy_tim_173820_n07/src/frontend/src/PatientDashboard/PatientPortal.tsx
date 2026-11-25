import React, { useState } from 'react';
import { Bell, Calendar, CheckCircle2, FileText, HeartPulse, Pill } from 'lucide-react';
import { STORAGE_KEYS } from '../utils/cadiocareStorage';
import Tab51ScheduleVitals from './Tab51ScheduleVitals';
import Tab52PublishedResults from './Tab52PublishedResults';
import Tab53CarePlan from './Tab53CarePlan';
import Tab54Notifications, { PatientNotificationItem } from './Tab54Notifications';

interface PatientPortalProps {
  username: string;
  patientCode?: string;
  onLogout?: () => void;
}

type Bpc5Tab = '5.1' | '5.2' | '5.3' | '5.4';

export default function PatientPortal({
  username,
  patientCode = 'BN-2026-0891',
  onLogout,
}: PatientPortalProps) {
  const [activeTab, setActiveTab] = useState<Bpc5Tab>('5.1');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<PatientNotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (saved) return JSON.parse(saved);
    const init: PatientNotificationItem[] = [
      {
        id: 'NTF-1',
        category: 'NHẮC LỊCH',
        title: 'Lịch tái khám sắp tới: 05/12/2026 (08:30 - 09:00)',
        read: false,
      },
      {
        id: 'NTF-2',
        category: 'NHẮC THUỐC',
        title: 'Đừng quên uống thuốc buổi sáng và ghi nhận cân nặng hôm nay',
        read: false,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(init));
    return init;
  });

  const handleNewAlertNotification = (title: string) => {
    setNotifications((prev) => {
      const next: PatientNotificationItem[] = [
        { id: `NTF-${Date.now()}`, category: 'CẢNH BÁO', title, read: false },
        ...prev,
      ];
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(next));
      return next;
    });
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('username');
    localStorage.removeItem('patient_code');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">
                CADIOCARE • Cổng Bệnh nhân Ngoại trú (Phân hệ 05)
              </h1>
              <p className="text-xs text-slate-500">
                Mã BN: <strong>{patientCode}</strong> • Tài khoản: <strong>{username}</strong> • BV Hữu Nghị
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogoutClick}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            { code: '5.1' as const, label: '5.1 Lịch khám & Theo dõi chỉ số', icon: Calendar },
            { code: '5.2' as const, label: '5.2 Kết quả đã công bố', icon: FileText },
            { code: '5.3' as const, label: '5.3 Kế hoạch & Hướng dẫn', icon: Pill },
            { code: '5.4' as const, label: '5.4 Thông báo & Nhắc nhở', icon: Bell },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.code;
            return (
              <button
                key={t.code}
                onClick={() => setActiveTab(t.code)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-left text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {feedbackMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {activeTab === '5.1' && (
          <Tab51ScheduleVitals
            username={username}
            patientCode={patientCode}
            onFeedback={setFeedbackMsg}
            onNewAlertNotification={handleNewAlertNotification}
          />
        )}
        {activeTab === '5.2' && <Tab52PublishedResults />}
        {activeTab === '5.3' && (
          <Tab53CarePlan
            username={username}
            patientCode={patientCode}
            onFeedback={setFeedbackMsg}
          />
        )}
        {activeTab === '5.4' && (
          <Tab54Notifications
            username={username}
            patientCode={patientCode}
            notifications={notifications}
            setNotifications={setNotifications}
          />
        )}
      </main>
    </div>
  );
}