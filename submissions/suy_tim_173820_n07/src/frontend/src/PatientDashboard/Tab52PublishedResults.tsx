import React, { useState } from 'react';
import { STORAGE_KEYS } from '../utils/cadiocareStorage';

const DEFAULT_PUBLISHED_RESULTS = [
  {
    id: 'RES-2026-11',
    publishedAt: '10/11/2026',
    visitCode: 'LK-20261110-02',
    status: 'PUBLISHED',
    conclusion: 'Tình trạng sung huyết cải thiện, huyết áp ổn định hơn so với đợt trước.',
    doctorNote: 'Tiếp tục theo dõi cân nặng mỗi sáng và duy trì thuốc đúng lịch.',
  },
];

export default function Tab52PublishedResults() {
  const [publishedResults] = useState<any[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PUBLISHED_RESULTS);
    const list = saved ? JSON.parse(saved) : DEFAULT_PUBLISHED_RESULTS;
    return Array.isArray(list)
      ? list.filter((item) => !item.status || item.status === 'PUBLISHED')
      : DEFAULT_PUBLISHED_RESULTS;
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
      <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
        5.2 • Kết quả khám đã được Bác sĩ phê duyệt công bố
      </h2>
      {publishedResults.map((item) => (
        <div key={item.id} className="rounded-xl border border-slate-200 p-4 text-xs space-y-1.5">
          <div className="font-bold text-blue-900">
            Lần khám {item.visitCode} • Công bố ngày {item.publishedAt}
          </div>
          <div className="text-slate-800">
            <strong>Kết luận:</strong> {item.conclusion}
          </div>
          <div className="text-slate-600">
            <strong>Lời dặn:</strong> {item.doctorNote}
          </div>
        </div>
      ))}
    </div>
  );
}