export interface AppointmentItem {
  id: string;
  patientCode: string;
  patientName: string;
  date: string;
  timeSlot: string;
  doctorName: string;
  reason: string;
  status: 'Chờ xác nhận' | 'Đã xác nhận' | 'Hoàn tất' | 'Đã hủy';
}

export interface PatientVitalSubmission {
  id: string;
  patientCode: string;
  patientName: string;
  recordedAt: string;
  weightKg: number;
  systolicBp: number;
  diastolicBp: number;
  heartRate: number;
  edemaLevel: number;
  symptoms: string[];
  alertType: 'NONE' | 'YELLOW_BP_HIGH' | 'RED_FLUID_OVERLOAD' | 'RED_SOS';
  alertMessage?: string;
}

export interface SharedAlertItem {
  id: string;
  patient_code: string;
  patient_name: string;
  recorded_at: string;
  alert_type: 'YELLOW_BP_HIGH' | 'RED_FLUID_OVERLOAD' | 'RED_SOS';
  severity: 'RED' | 'YELLOW';
  status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED';
  summary: string;
  symptoms: string[];
  alert_message?: string;
  handled_by_doctor?: string;
  handled_at?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'STAFF';
  bpcCode: string;
  action: string;
  detail: string;
}

export const STORAGE_KEYS = {
  APPOINTMENTS: 'cadiocare_5_1_appointments',
  VITALS: 'cadiocare_5_1_vitals',
  ALERTS: 'cadiocare_shared_alerts',
  PUBLISHED_RESULTS: 'cadiocare_5_2_published_results',
  CARE_PLAN: 'cadiocare_5_3_care_plan',
  NOTIFICATIONS: 'cadiocare_5_4_notifications',
  AUDIT_LOGS: 'cadiocare_audit_logs',
};

export function notifyStorageUpdated() {
  try {
    window.dispatchEvent(new Event('cadiocare-storage-updated'));
  } catch (err) {
    console.error('Lỗi phát sự kiện cập nhật storage:', err);
  }
}

export function appendAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    const current: AuditLogEntry[] = raw ? JSON.parse(raw) : [];
    const newItem: AuditLogEntry = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      ...entry,
    };
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([newItem, ...current]));
    notifyStorageUpdated();
  } catch (err) {
    console.error('Lỗi ghi Audit Log:', err);
  }
}

export function pushVitalAndAlertToStorage(
  submission: PatientVitalSubmission,
  actorLabel: string
) {
  try {
    // 1. Lưu lịch sử sinh hiệu (BPC 5.1)
    const rawVitals = localStorage.getItem(STORAGE_KEYS.VITALS);
    const currentVitals: PatientVitalSubmission[] = rawVitals ? JSON.parse(rawVitals) : [];
    localStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify([submission, ...currentVitals]));

    // 2. Nếu có cảnh báo -> đẩy vào kho cảnh báo chung cho Bác sĩ
    if (submission.alertType !== 'NONE') {
      const rawAlerts = localStorage.getItem(STORAGE_KEYS.ALERTS);
      const currentAlerts: SharedAlertItem[] = rawAlerts ? JSON.parse(rawAlerts) : [];
      const newAlert: SharedAlertItem = {
        id: `ALT-${Date.now()}`,
        patient_code: submission.patientCode,
        patient_name: submission.patientName,
        recorded_at: submission.recordedAt,
        alert_type: submission.alertType,
        severity: submission.alertType.startsWith('RED') ? 'RED' : 'YELLOW',
        status: 'PENDING',
        summary: `${submission.weightKg} kg • HA ${submission.systolicBp}/${submission.diastolicBp} mmHg • Mạch ${submission.heartRate} bpm`,
        symptoms: submission.symptoms,
        alert_message: submission.alertMessage,
      };
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify([newAlert, ...currentAlerts]));
    }

    // 3. Ghi vào Nhật ký hoạt động
    appendAuditLog({
      actor: actorLabel,
      role: 'PATIENT',
      bpcCode: '5.1',
      action: 'Gửi chỉ số theo dõi & triệu chứng ngoại trú',
      detail: `${submission.patientCode} • Cân nặng: ${submission.weightKg} kg, HA: ${submission.systolicBp}/${submission.diastolicBp} mmHg, Mạch: ${submission.heartRate} bpm${
        submission.alertMessage ? ` [${submission.alertMessage}]` : ''
      }`,
    });

    notifyStorageUpdated();
  } catch (err) {
    console.error('Lỗi lưu sinh hiệu & cảnh báo:', err);
  }
}

export function acknowledgeAlertInStorage(alertId: string, doctorName: string) {
  try {
    const rawAlerts = localStorage.getItem(STORAGE_KEYS.ALERTS);
    const currentAlerts: SharedAlertItem[] = rawAlerts ? JSON.parse(rawAlerts) : [];
    const handledAt = new Date().toLocaleString('vi-VN');
    let targetAlert: SharedAlertItem | undefined;

    const updated = currentAlerts.map((item) => {
      if (item.id === alertId) {
        targetAlert = {
          ...item,
          status: 'ACKNOWLEDGED',
          handled_by_doctor: doctorName,
          handled_at: handledAt,
        };
        return targetAlert;
      }
      return item;
    });

    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(updated));

    if (targetAlert) {
      appendAuditLog({
        actor: doctorName,
        role: 'DOCTOR',
        bpcCode: '3.5 / 4.1',
        action: 'Tiếp nhận & xác nhận cảnh báo bệnh nhân',
        detail: `${targetAlert.patient_code} (${targetAlert.patient_name}) • ${targetAlert.summary}`,
      });
    }

    notifyStorageUpdated();
  } catch (err) {
    console.error('Lỗi xác nhận cảnh báo:', err);
  }
}