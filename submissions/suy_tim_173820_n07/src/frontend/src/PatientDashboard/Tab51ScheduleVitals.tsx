import React, { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import {
  appendAuditLog,
  AppointmentItem,
  PatientVitalSubmission,
  pushVitalAndAlertToStorage,
  STORAGE_KEYS,
} from '../utils/cadiocareStorage';

interface Tab51Props {
  username: string;
  patientCode: string;
  onFeedback: (msg: string) => void;
  onNewAlertNotification: (title: string) => void;
}

const DEFAULT_APPOINTMENTS: AppointmentItem[] = [
  {
    id: 'APT-01',
    patientCode: 'BN-2026-0891',
    patientName: 'Trần Minh Quân',
    date: '2026-12-05',
    timeSlot: '08:30 - 09:00',
    doctorName: 'BS.CKII Nguyễn Văn An',
    reason: 'Tái khám định kỳ suy tim & đánh giá chức năng thận',
    status: 'Đã xác nhận',
  },
];

const SYMPTOM_CHOICES = [
  'Khó thở khi gắng sức',
  'Khó thở khi nằm',
  'Phù hai chi dưới',
  'Mệt mỏi / giảm vận động',
  'Chóng mặt khi đứng dậy',
];

export default function Tab51ScheduleVitals({
  username,
  patientCode,
  onFeedback,
  onNewAlertNotification,
}: Tab51Props) {
  const [appointments, setAppointments] = useState<AppointmentItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(DEFAULT_APPOINTMENTS));
    return DEFAULT_APPOINTMENTS;
  });

  const [apptDate, setApptDate] = useState('2026-12-12');
  const [apptSlot, setApptSlot] = useState('09:00 - 09:30');
  const [apptReason, setApptReason] = useState('Tái khám đánh giá triệu chứng & đơn thuốc');

  const [weightKg, setWeightKg] = useState('67.2');
  const [systolicBp, setSystolicBp] = useState('130');
  const [diastolicBp, setDiastolicBp] = useState('80');
  const [heartRate, setHeartRate] = useState('82');
  const [edemaLevel, setEdemaLevel] = useState(2);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Khó thở khi gắng sức']);

  const [vitalsHistory, setVitalsHistory] = useState<PatientVitalSubmission[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VITALS);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments]);

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((item) => item !== sym) : [...prev, sym]
    );
  };

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const newAppt: AppointmentItem = {
      id: `APT-${Date.now().toString().slice(-4)}`,
      patientCode,
      patientName: username || 'Bệnh nhân',
      date: apptDate,
      timeSlot: apptSlot,
      doctorName: 'BS.CKII Nguyễn Văn An',
      reason: apptReason,
      status: 'Chờ xác nhận',
    };

    const updated = [newAppt, ...appointments];
    setAppointments(updated);
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));

    appendAuditLog({
      actor: `${username} (${patientCode})`,
      role: 'PATIENT',
      bpcCode: '5.1',
      action: 'Đặt lịch khám ngoại trú',
      detail: `Ngày ${apptDate} (${apptSlot}) • Lý do: ${apptReason}`,
    });

    onFeedback('Đã đặt lịch khám và ghi nhận lên hệ thống (5.1).');
  };

  const handleSubmitVitals = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightKg);
    const sys = parseInt(systolicBp, 10);
    const dia = parseInt(diastolicBp, 10);
    const hr = parseInt(heartRate, 10);

    const prevWeight = vitalsHistory[0]?.weightKg ?? w;
    const diffWeight = Number((w - prevWeight).toFixed(1));

    let alertType: PatientVitalSubmission['alertType'] = 'NONE';
    let alertMessage: string | undefined;

    if (sys < 90 || hr > 120 || selectedSymptoms.includes('Khó thở khi nằm') || edemaLevel >= 4) {
      alertType = 'RED_SOS';
      alertMessage = `Cảnh báo nguy cơ cao (CN ${w} kg, HA ${sys}/${dia} mmHg, Mạch ${hr} bpm)`;
    } else if (diffWeight >= 1.5 || edemaLevel >= 3) {
      alertType = 'RED_FLUID_OVERLOAD';
      alertMessage = `Cảnh báo biến động dịch/cân nặng (${diffWeight >= 0 ? `+${diffWeight}` : diffWeight} kg, Phù độ ${edemaLevel})`;
    } else if (sys >= 140 || selectedSymptoms.length > 0) {
      alertType = 'YELLOW_BP_HIGH';
      alertMessage = `Cần theo dõi thêm (HA ${sys}/${dia} mmHg, ${selectedSymptoms.join(', ') || 'không triệu chứng'})`;
    }

    const submission: PatientVitalSubmission = {
      id: `VIT-${Date.now().toString().slice(-4)}`,
      patientCode,
      patientName: username || 'Bệnh nhân',
      recordedAt: new Date().toLocaleString('vi-VN'),
      weightKg: w,
      systolicBp: sys,
      diastolicBp: dia,
      heartRate: hr,
      edemaLevel,
      symptoms: selectedSymptoms,
      alertType,
      alertMessage,
    };

    pushVitalAndAlertToStorage(submission, `${username} (${patientCode})`);
    setVitalsHistory((prev) => [submission, ...prev]);

    if (alertMessage) {
      onNewAlertNotification(`${alertMessage} — Đã gửi tới Bác sĩ điều trị`);
    }

    onFeedback(
      'Đã gửi chỉ số sức khỏe lên localStorage, đồng bộ sang hàng đợi Bác sĩ và ghi vào Nhật ký hoạt động.'
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <form
        onSubmit={handleSubmitVitals}
        className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm"
      >
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
          5.1 • Ghi nhận chỉ số sức khỏe tại nhà & gửi tới Bác sĩ
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cân nặng (kg)</label>
            <input
              type="number"
              step="0.1"
              required
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">HA tâm thu (mmHg)</label>
            <input
              type="number"
              required
              value={systolicBp}
              onChange={(e) => setSystolicBp(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">HA tâm trương (mmHg)</label>
            <input
              type="number"
              required
              value={diastolicBp}
              onChange={(e) => setDiastolicBp(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nhịp tim (bpm)</label>
            <input
              type="number"
              required
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Mức độ phù (1–5): <strong>Mức {edemaLevel}</strong>
          </label>
          <input
            type="range"
            min={1}
            max={5}
            value={edemaLevel}
            onChange={(e) => setEdemaLevel(parseInt(e.target.value, 10))}
            className="w-full accent-blue-600"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
            Triệu chứng hiện tại
          </label>
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_CHOICES.map((sym) => {
              const active = selectedSymptoms.includes(sym);
              return (
                <button
                  type="button"
                  key={sym}
                  onClick={() => toggleSymptom(sym)}
                  className={`rounded-lg border px-3 py-1.5 text-xs cursor-pointer ${
                    active
                      ? 'border-blue-600 bg-blue-50 font-semibold text-blue-800'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  {sym}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Gửi chỉ số & đồng bộ sang Bác sĩ / Nhật ký</span>
        </button>

        {vitalsHistory.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="text-xs font-bold text-slate-700">Lịch sử đã gửi ({vitalsHistory.length})</div>
            {vitalsHistory.slice(0, 3).map((v) => (
              <div key={v.id} className="rounded-lg bg-slate-50 p-2.5 text-xs border border-slate-200">
                <strong>{v.recordedAt}</strong> • {v.weightKg} kg • HA {v.systolicBp}/{v.diastolicBp} mmHg • Mạch {v.heartRate} bpm
                {v.alertMessage && <div className="text-rose-700 font-medium mt-0.5">{v.alertMessage}</div>}
              </div>
            ))}
          </div>
        )}
      </form>

      <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
          5.1 • Đặt lịch & theo dõi lịch khám
        </h2>

        <form onSubmit={handleBookAppointment} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ngày khám</label>
              <input
                type="date"
                required
                value={apptDate}
                onChange={(e) => setApptDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Khung giờ</label>
              <select
                value={apptSlot}
                onChange={(e) => setApptSlot(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              >
                <option>08:00 - 08:30</option>
                <option>08:30 - 09:00</option>
                <option>09:00 - 09:30</option>
                <option>14:00 - 14:30</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Lý do khám</label>
            <input
              type="text"
              required
              value={apptReason}
              onChange={(e) => setApptReason(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
          >
            Đặt lịch khám
          </button>
        </form>

        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-700">Danh sách lịch khám</div>
          {appointments.map((apt) => (
            <div key={apt.id} className="rounded-xl border border-slate-200 p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  {apt.date} • {apt.timeSlot}
                </span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  {apt.status}
                </span>
              </div>
              <div className="text-slate-600">{apt.doctorName}</div>
              <div className="text-slate-500">{apt.reason}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}