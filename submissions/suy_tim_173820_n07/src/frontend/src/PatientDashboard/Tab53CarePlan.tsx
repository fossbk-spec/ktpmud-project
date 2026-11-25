import React, { useState } from 'react';
import { appendAuditLog, STORAGE_KEYS } from '../utils/cadiocareStorage';

interface Tab53Props {
  username: string;
  patientCode: string;
  onFeedback: (msg: string) => void;
}

const DEFAULT_CARE_PLAN = {
  updatedAt: '10/11/2026',
  medications: [
    { name: 'Furosemide 40mg', dosage: '1 viên/ngày (07:00)', note: 'Theo dõi cân nặng và lượng nước tiểu' },
    { name: 'Empagliflozin 10mg', dosage: '1 viên/ngày (07:30)', note: 'Uống buổi sáng, giữ đủ nước theo hướng dẫn' },
    { name: 'Bisoprolol 2.5mg', dosage: '1 viên/ngày (20:00)', note: 'Theo dõi mạch và huyết áp tư thế' },
  ],
  guidance: [
    'Cân nặng mỗi sáng sau khi đi vệ sinh và trước khi ăn sáng.',
    'Báo ngay cho bác sĩ nếu tăng cân ≥ 1.5–2 kg trong 2–3 ngày hoặc khó thở tăng lên.',
    'Không tự ý ngừng thuốc khi chưa có trao đổi với bác sĩ điều trị.',
  ],
};

export default function Tab53CarePlan({ username, patientCode, onFeedback }: Tab53Props) {
  const [carePlan] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CARE_PLAN);
    return saved ? JSON.parse(saved) : DEFAULT_CARE_PLAN;
  });
  const [medTakenMap, setMedTakenMap] = useState<Record<string, boolean>>({});

  const handleConfirmMed = (medName: string) => {
    setMedTakenMap((prev) => ({ ...prev, [medName]: true }));
    appendAuditLog({
      actor: `${username} (${patientCode})`,
      role: 'PATIENT',
      bpcCode: '5.4',
      action: 'Xác nhận uống thuốc theo kế hoạch',
      detail: `Đã xác nhận dùng thuốc: ${medName}`,
    });
    onFeedback(`Đã ghi nhận xác nhận uống thuốc "${medName}" vào Nhật ký (5.4).`);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h2 className="text-sm font-bold text-slate-900">
          5.3 • Kế hoạch điều trị, đơn thuốc & hướng dẫn chăm sóc
        </h2>
        <span className="text-[11px] text-slate-500">Cập nhật: {carePlan.updatedAt}</span>
      </div>

      <div className="space-y-2.5">
        <div className="text-xs font-bold text-slate-700">Danh mục thuốc đang áp dụng</div>
        {carePlan.medications.map((m: any) => (
          <div
            key={m.name}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3.5 text-xs"
          >
            <div>
              <div className="font-bold text-slate-900">{m.name}</div>
              <div className="text-slate-600">
                {m.dosage} • {m.note}
              </div>
            </div>
            <button
              onClick={() => handleConfirmMed(m.name)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                medTakenMap[m.name]
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {medTakenMap[m.name] ? 'Đã xác nhận uống ✓' : 'Xác nhận uống thuốc'}
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4 space-y-1.5 text-xs">
        <div className="font-bold text-blue-900">Hướng dẫn theo dõi & chăm sóc ngoại trú</div>
        <ul className="list-disc pl-5 space-y-1 text-slate-700">
          {carePlan.guidance.map((g: string) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}