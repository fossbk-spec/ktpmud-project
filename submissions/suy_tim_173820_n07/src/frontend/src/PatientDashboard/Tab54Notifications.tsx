import React, { useEffect } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { appendAuditLog, STORAGE_KEYS } from '../utils/cadiocareStorage';

export interface PatientNotificationItem {
  id: string;
  category: 'NHẮC LỊCH' | 'NHẮC THUỐC' | 'CẢNH BÁO';
  title: string;
  read: boolean;
}

interface Tab54Props {
  username: string;
  patientCode: string;
  notifications: PatientNotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<PatientNotificationItem[]>>;
}

export default function Tab54Notifications({
  username,
  patientCode,
  notifications,
  setNotifications,
}: Tab54Props) {
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  const handleMarkNotificationRead = (id: string, title: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    appendAuditLog({
      actor: `${username} (${patientCode})`,
      role: 'PATIENT',
      bpcCode: '5.4',
      action: 'Xem & xác nhận thông báo/nhắc nhở',
      detail: title,
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
      <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
        5.4 • Thông báo, nhắc lịch tái khám & nhắc uống thuốc
      </h2>
      {notifications.map((ntf) => (
        <div
          key={ntf.id}
          className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-xs ${
            ntf.read ? 'border-slate-200 bg-slate-50/50' : 'border-blue-200 bg-blue-50/40'
          }`}
        >
          <div className="space-y-0.5">
            <span className="inline-block rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white">
              {ntf.category}
            </span>
            <div className="font-semibold text-slate-800 pt-1">{ntf.title}</div>
          </div>
          {!ntf.read ? (
            <button
              onClick={() => handleMarkNotificationRead(ntf.id, ntf.title)}
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              <span>Đã xem</span>
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-emerald-700">Đã đọc</span>
          )}
        </div>
      ))}
    </div>
  );
}