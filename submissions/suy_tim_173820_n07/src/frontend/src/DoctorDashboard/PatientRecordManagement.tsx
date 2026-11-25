import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  X,
  Stethoscope,
  Calendar,
  Clock
} from 'lucide-react';
import {
  appendAuditLog,
  PatientVitalSubmission,
  STORAGE_KEYS,
} from '../utils/cadiocareStorage';

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
export type HeartFailureType = 'HFrEF' | 'HFmrEF' | 'HFpEF';
export type NYHALevel = 'I' | 'II' | 'III' | 'IV';
export type VisitStatus = 'Chờ khám' | 'Đang khám' | 'Đã hoàn tất' | 'Cấp cứu';

export interface PatientRecord {
  id: string;
  patientCode: string;
  fullName: string;
  age: number;
  gender: 'Nam' | 'Nữ';
  cccd: string;
  hfType: HeartFailureType;
  lvefValue: number; // %
  nyha: NYHALevel;
  status: VisitStatus;
  doctorInCharge: string;
  lastUpdated: string;
  appointmentTime?: string; // Khung giờ hẹn (Bổ sung phục vụ Tiểu mục 1.2)
  latestVitals?: string; // Đồng bộ sinh hiệu từ Portal Bệnh nhân
}

// --- DỮ LIỆU MẪU (MOCK DATA) ---
const INITIAL_PATIENTS: PatientRecord[] = [
  {
    id: 'p-1',
    patientCode: 'BN-2026-0891',
    fullName: 'Trần Văn Mạnh',
    age: 72,
    gender: 'Nam',
    cccd: '001054002341',
    hfType: 'HFrEF',
    lvefValue: 32,
    nyha: 'III',
    status: 'Đang khám',
    doctorInCharge: 'BS.CKII Nguyễn Văn An',
    lastUpdated: 'Hôm nay, 08:15',
    appointmentTime: '08:30 - Lịch hẹn hôm nay',
  },
  {
    id: 'p-2',
    patientCode: 'BN-2026-0642',
    fullName: 'Lê Thị Hòa',
    age: 68,
    gender: 'Nữ',
    cccd: '001158004123',
    hfType: 'HFpEF',
    lvefValue: 54,
    nyha: 'II',
    status: 'Chờ khám',
    doctorInCharge: 'ThS.BS Trần Thị Mai',
    lastUpdated: 'Hôm qua, 14:30',
    appointmentTime: '09:45 - Lịch hẹn hôm nay',
  },
  {
    id: 'p-3',
    patientCode: 'BN-2026-0115',
    fullName: 'Nguyễn Đình Phúc',
    age: 65,
    gender: 'Nam',
    cccd: '001061009876',
    hfType: 'HFmrEF',
    lvefValue: 44,
    nyha: 'I',
    status: 'Đã hoàn tất',
    doctorInCharge: 'BS.CKI Lê Hoàng Nam',
    lastUpdated: '28/10/2026',
    appointmentTime: '14:00 - Đã khám xong',
  },
];

interface Props {
  onOpenDoctorDashboard: (patientCode: string) => void;
}

export default function PatientRecordManagement({ onOpenDoctorDashboard }: Props) {
  const [patients, setPatients] = useState<PatientRecord[]>(INITIAL_PATIENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [appointmentFilterOnly, setAppointmentFilterOnly] = useState<boolean>(false); // Bộ lọc Lịch hẹn hôm nay (1.2)

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newGender, setNewGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [newCccd, setNewCccd] = useState('');
  const [newHfType, setNewHfType] = useState<HeartFailureType>('HFrEF');
  const [newLvef, setNewLvef] = useState('');
  const [newNyha, setNewNyha] = useState<NYHALevel>('II');

  // Hàm đồng bộ dữ liệu sinh hiệu từ kho chung cadiocare_5_1_vitals (và tương thích patient_latest_vitals)
  const loadPatientVitals = () => {
    try {
      const sharedVitalsRaw = localStorage.getItem(STORAGE_KEYS.VITALS);
      if (sharedVitalsRaw) {
        const sharedVitals: PatientVitalSubmission[] = JSON.parse(sharedVitalsRaw);
        if (Array.isArray(sharedVitals) && sharedVitals.length > 0) {
          const latestByCode = new Map<string, PatientVitalSubmission>();
          sharedVitals.forEach((item) => {
            if (!latestByCode.has(item.patientCode)) {
              latestByCode.set(item.patientCode, item);
            }
          });

          setPatients((prev) =>
            prev.map((p) => {
              const matched = latestByCode.get(p.patientCode);
              if (!matched) return p;
              const symptomText =
                matched.symptoms && matched.symptoms.length > 0
                  ? matched.symptoms.join(', ')
                  : `Phù mức ${matched.edemaLevel}/5`;
              return {
                ...p,
                lastUpdated: matched.recordedAt,
                latestVitals: `Cân nặng: ${matched.weightKg} kg, HA: ${matched.systolicBp}/${matched.diastolicBp} mmHg | ${symptomText}`,
              };
            })
          );
          return;
        }
      }

      // Fallback nếu có dữ liệu cũ ở khóa patient_latest_vitals
      const savedVitals = localStorage.getItem('patient_latest_vitals');
      if (savedVitals) {
        const vitalsList = JSON.parse(savedVitals);
        if (vitalsList && vitalsList.length > 0) {
          const latest = vitalsList[0];
          setPatients((prev) =>
            prev.map((p) => {
              if (p.patientCode === latest.patientCode) {
                return {
                  ...p,
                  lastUpdated: latest.date,
                  latestVitals: `Cân nặng: ${latest.weight}, HA: ${latest.bloodPressure} (${latest.dyspnea})`,
                };
              }
              return p;
            })
          );
        }
      }
    } catch (err) {
      console.error('Lỗi đồng bộ sinh hiệu:', err);
    }
  };

  useEffect(() => {
    loadPatientVitals();
    window.addEventListener('cadiocare-storage-updated', loadPatientVitals);
    window.addEventListener('storage', loadPatientVitals);
    return () => {
      window.removeEventListener('cadiocare-storage-updated', loadPatientVitals);
      window.removeEventListener('storage', loadPatientVitals);
    };
  }, []);

  const filteredPatients = patients.filter((p) => {
    const matchSearch =
      p.patientCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cccd.includes(searchTerm);
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchAppointment =
      !appointmentFilterOnly ||
      (p.appointmentTime && p.appointmentTime.includes('Lịch hẹn hôm nay'));
    return matchSearch && matchStatus && matchAppointment;
  });

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newAge || !newCccd) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    const generatedCode = `BN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRecord: PatientRecord = {
      id: `p-${Date.now()}`,
      patientCode: generatedCode,
      fullName: newFullName,
      age: parseInt(newAge, 10),
      gender: newGender,
      cccd: newCccd,
      hfType: newHfType,
      lvefValue: parseInt(newLvef, 10) || 50,
      nyha: newNyha,
      status: 'Chờ khám',
      doctorInCharge: 'BS.CKII Nguyễn Văn An',
      lastUpdated: 'Vừa tạo',
      appointmentTime: '10:15 - Lịch hẹn mới',
    };

    setPatients([newRecord, ...patients]);
    appendAuditLog({
      actor: 'BS.CKII Nguyễn Văn An',
      role: 'DOCTOR',
      bpcCode: '1.1',
      action: 'Tạo hồ sơ bệnh án mới',
      detail: `${newRecord.patientCode} - ${newRecord.fullName} (${newRecord.hfType}, LVEF ${newRecord.lvefValue}%, NYHA ${newRecord.nyha})`,
    });

    setIsModalOpen(false);
    setNewFullName('');
    setNewAge('');
    setNewCccd('');
    setNewLvef('');
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 antialiased">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-xs">
              01
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Quản lý Hồ sơ Bệnh án & Lượt Khám
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Tra cứu thông tin hành chính, theo dõi chỉ số phân loại suy tim và mở lượt khám lâm sàng tại Bệnh viện Hữu Nghị.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          + Tạo hồ sơ bệnh án mới
        </button>
      </div>

      {/* THANH TÌM KIẾM VÀ BỘ LỌC (ĐÃ TÍCH HỢP NÚT LỊCH HẸN 1.2) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo Mã BN, Họ tên hoặc CCCD..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            {/* Nút bộ lọc Lịch hẹn khám hôm nay (Đáp ứng Tiểu mục 1.2) */}
            <button
              onClick={() => setAppointmentFilterOnly(!appointmentFilterOnly)}
              className={`inline-flex items-center space-x-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer border ${
                appointmentFilterOnly
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Lịch hẹn hôm nay (1.2)</span>
            </button>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái khám</option>
              <option value="Chờ khám">Chờ khám</option>
              <option value="Đang khám">Đang khám</option>
              <option value="Đã hoàn tất">Đã hoàn tất</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Danh sách bệnh nhân suy tim ({filteredPatients.length} hồ sơ)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Khoa Tim mạch Can thiệp</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/70 text-xs font-bold uppercase text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Mã BN & Họ Tên</th>
                <th className="px-4 py-3.5">Tuổi / Giới</th>
                <th
                  className="px-4 py-3.5"
                  title="HFrEF: Suy tim phân suất tống máu giảm (≤40%) | HFpEF: Suy tim phân suất tống máu bảo tồn (≥50%)"
                >
                  Phân loại Suy tim <span className="text-[10px] text-blue-600 lowercase">(?)</span>
                </th>
                <th
                  className="px-4 py-3.5"
                  title="Phân suất tống máu thất trái (LVEF Bình thường: 50-70%)"
                >
                  Chỉ số LVEF <span className="text-[10px] text-blue-600 lowercase">(?)</span>
                </th>
                <th
                  className="px-4 py-3.5"
                  title="Phân độ triệu chứng suy tim theo Hiệp hội Tim mạch New York (NYHA I đến IV)"
                >
                  Phân độ NYHA <span className="text-[10px] text-blue-600 lowercase">(?)</span>
                </th>
                <th className="px-4 py-3.5">Khung giờ hẹn (1.2)</th>
                <th className="px-4 py-3.5 text-center">Trạng thái khám</th>
                <th className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không tìm thấy bệnh nhân nào phù hợp với điều kiện tra cứu hoặc lịch hẹn.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{patient.fullName}</div>
                      <div className="font-mono text-blue-600 font-semibold mt-0.5">
                        {patient.patientCode}
                      </div>
                      <div className="text-[10px] text-slate-400">CCCD: {patient.cccd}</div>
                      {patient.latestVitals && (
                        <div className="mt-1.5 inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold shadow-sm animate-pulse">
                          🚨 Sinh hiệu mới: {patient.latestVitals}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-700">
                      {patient.age} tuổi • {patient.gender}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                          patient.hfType === 'HFrEF'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : patient.hfType === 'HFpEF'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}
                        title={`Kiểu hình suy tim: ${patient.hfType}`}
                      >
                        {patient.hfType}
                      </span>
                    </td>
                    {/* Chỉ số LVEF có nhãn tooltip nổi bật */}
                    <td className="px-4 py-4 font-mono font-bold text-slate-800">
                      <span
                        className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200"
                        title="Chỉ số phân suất tống máu thất trái (LVEF)"
                      >
                        {patient.lvefValue}%
                      </span>
                    </td>
                    {/* Phân độ NYHA có nhãn tooltip nổi bật */}
                    <td className="px-4 py-4">
                      <span
                        className="font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200"
                        title={`Phân độ suy tim NYHA ${patient.nyha}`}
                      >
                        NYHA {patient.nyha}
                      </span>
                    </td>
                    {/* Cột hiển thị khung giờ hẹn (1.2) */}
                    <td className="px-4 py-4 text-slate-600 font-medium">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-purple-600 flex-shrink-0" />
                        <span className="text-[11px]">
                          {patient.appointmentTime || 'Chưa đặt lịch'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          patient.status === 'Đang khám'
                            ? 'bg-purple-100 text-purple-700 animate-pulse'
                            : patient.status === 'Chờ khám'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => onOpenDoctorDashboard(patient.patientCode)}
                        className="inline-flex items-center rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        <Stethoscope className="mr-1 h-3.5 w-3.5" />
                        <span>Mở lượt khám</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Tạo Hồ Sơ Bệnh Án Mới</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Họ và Tên Bệnh Nhân <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tuổi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    placeholder="70"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as 'Nam' | 'Nữ')}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Số CCCD / Định danh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCccd}
                  onChange={(e) => setNewCccd(e.target.value)}
                  placeholder="001054xxxxxx"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kiểu hình EF</label>
                  <select
                    value={newHfType}
                    onChange={(e) => setNewHfType(e.target.value as HeartFailureType)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="HFrEF">HFrEF</option>
                    <option value="HFmrEF">HFmrEF</option>
                    <option value="HFpEF">HFpEF</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chỉ số LVEF (%)</label>
                  <input
                    type="number"
                    value={newLvef}
                    onChange={(e) => setNewLvef(e.target.value)}
                    placeholder="35"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phân độ NYHA</label>
                  <select
                    value={newNyha}
                    onChange={(e) => setNewNyha(e.target.value as NYHALevel)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="I">I</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 cursor-pointer"
                >
                  Lưu & Cấp Mã Bệnh Án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}