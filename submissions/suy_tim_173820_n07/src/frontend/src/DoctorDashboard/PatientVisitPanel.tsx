import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  HeartPulse,
  UserCheck,
} from 'lucide-react';
import {
  acknowledgeAlertInStorage,
  appendAuditLog,
  PatientVitalSubmission,
  SharedAlertItem,
  STORAGE_KEYS,
} from '../utils/cadiocareStorage';

export interface SelectedVisitPatient {
  patientCode: string;
  fullName: string;
  age: number;
  gender: string;
  efType: string;
  lvef: number;
  nyha: string;
  appointmentSlot: string;
  visitStatus: string;
}

interface PatientVisitPanelProps {
  patient: SelectedVisitPatient;
  doctorName?: string;
  onBack: () => void;
}

export default function PatientVisitPanel({
  patient,
  doctorName = 'BS.CKII Nguyễn Văn An',
  onBack,
}: PatientVisitPanelProps) {
  const [vitals, setVitals] = useState<PatientVitalSubmission[]>([]);
  const [alerts, setAlerts] = useState<SharedAlertItem[]>([]);
  const [clinicalNote, setClinicalNote] = useState('');
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  const loadSharedData = () => {
    try {
      const rawVitals = localStorage.getItem(STORAGE_KEYS.VITALS);
      const allVitals: PatientVitalSubmission[] = rawVitals ? JSON.parse(rawVitals) : [];
      setVitals(allVitals.filter((v) => v.patientCode === patient.patientCode));

      const rawAlerts = localStorage.getItem(STORAGE_KEYS.ALERTS);
      const allAlerts: SharedAlertItem[] = rawAlerts ? JSON.parse(rawAlerts) : [];
      setAlerts(allAlerts.filter((a) => a.patient_code === patient.patientCode));
    } catch (err) {
      console.error('Lỗi đọc dữ liệu từ cadiocareStorage:', err);
    }
  };

  useEffect(() => {
    loadSharedData();
    appendAuditLog({
      actor: doctorName,
      role: 'DOCTOR',
      bpcCode: '1.3 / 1.4',
      action: 'Mở lượt khám lâm sàng',
      detail: `Bệnh nhân ${patient.fullName} (${patient.patientCode}) • ${patient.efType} (LVEF ${patient.lvef}%) • ${patient.nyha}`,
    });

    window.addEventListener('cadiocare-storage-updated', loadSharedData);
    return () => window.removeEventListener('cadiocare-storage-updated', loadSharedData);
  }, [patient.patientCode]);

  const handleAcknowledgeAlert = (alertId: string) => {
    acknowledgeAlertInStorage(alertId, doctorName);
    loadSharedData();
    setSavedBanner('Đã xác nhận tiếp nhận cảnh báo và ghi vào Nhật ký hoạt động.');
  };

  const handleSaveClinicalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicalNote.trim()) return;

    appendAuditLog({
      actor: doctorName,
      role: 'DOCTOR',
      bpcCode: '1.4 / 4.1',
      action: 'Ghi nhận nhận định khám & hướng xử trí',
      detail: `${patient.patientCode}: ${clinicalNote.trim()}`,
    });

    setClinicalNote('');
    setSavedBanner('Đã lưu ghi chú lâm sàng vào lượt khám và Nhật ký hoạt động.');
  };

  return (
    <div className="space-y-5">
      {/* Thanh điều hướng quay lại */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại danh sách</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Lượt khám: {patient.fullName} ({patient.patientCode})
              </h2>
              <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                {patient.efType} • LVEF {patient.lvef}%
              </span>
              <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 border border-purple-200">
                {patient.nyha}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {patient.age} tuổi • {patient.gender} • Khung giờ: {patient.appointmentSlot} • Trạng thái: {patient.visitStatus}
            </p>
          </div>
        </div>
      </div>

      {savedBanner && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{savedBanner}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Cột trái: Cảnh báo & Sinh hiệu bệnh nhân gửi từ Cổng Ngoại trú (5.1) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Cảnh báo từ bệnh nhân */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>Cảnh báo từ theo dõi ngoại trú ({alerts.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400">Nguồn: cadiocare_shared_alerts</span>
            </div>

            {alerts.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">
                Chưa có cảnh báo bất thường nào được gửi từ tài khoản bệnh nhân {patient.patientCode}.
              </p>
            ) : (
              <div className="space-y-2.5">
                {alerts.map((alt) => (
                  <div
                    key={alt.id}
                    className={`rounded-xl border p-3.5 text-xs space-y-2 ${
                      alt.severity === 'RED'
                        ? 'border-rose-200 bg-rose-50/70'
                        : 'border-amber-200 bg-amber-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{alt.recorded_at}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          alt.status === 'PENDING'
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {alt.status === 'PENDING' ? 'Chờ bác sĩ xử lý' : 'Đã tiếp nhận'}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800">{alt.summary}</div>
                    {alt.alert_message && <div className="text-rose-700 font-medium">{alt.alert_message}</div>}
                    {alt.status === 'PENDING' ? (
                      <button
                        type="button"
                        onClick={() => handleAcknowledgeAlert(alt.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Đã nhận / Xử lý cảnh báo</span>
                      </button>
                    ) : (
                      <div className="text-[11px] text-emerald-700">
                        Xử lý bởi {alt.handled_by_doctor} lúc {alt.handled_at}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lịch sử chỉ số sinh hiệu bệnh nhân gửi lên */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Activity className="h-4 w-4 text-blue-600" />
                <span>Dữ liệu sinh hiệu bệnh nhân tự đo tại nhà ({vitals.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400">Nguồn: cadiocare_5_1_vitals</span>
            </div>

            {vitals.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">
                Chưa có bản ghi sinh hiệu nào mới từ cổng bệnh nhân. Hãy thử gửi ở tài khoản bệnh nhân mã {patient.patientCode}.
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {vitals.map((v) => (
                  <div key={v.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Clock className="h-3.5 w-3.5" /> {v.recordedAt}
                      </span>
                      <span>Phù mức {v.edemaLevel}/5</span>
                    </div>
                    <div className="font-bold text-slate-900">
                      Cân nặng: {v.weightKg} kg • Huyết áp: {v.systolicBp}/{v.diastolicBp} mmHg • Mạch: {v.heartRate} bpm
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

        {/* Cột phải: Ghi nhận thông tin khám & nhận định của Bác sĩ (1.4 & 4.1) */}
        <form
          onSubmit={handleSaveClinicalNote}
          className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 h-fit"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <HeartPulse className="h-4 w-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Ghi nhận thông tin khám & kết luận (1.4 / 4.1)
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Đánh giá lâm sàng, diễn biến suy tim & chỉ định xử trí
            </label>
            <textarea
              rows={5}
              required
              value={clinicalNote}
              onChange={(e) => setClinicalNote(e.target.value)}
              placeholder="Nhập nhận định lâm sàng, đánh giá sung huyết, chỉnh liều thuốc hoặc chỉ định cận lâm sàng..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
          >
            Lưu ghi nhận lượt khám & cập nhật Nhật ký
          </button>
        </form>
      </div>
    </div>
  );
}