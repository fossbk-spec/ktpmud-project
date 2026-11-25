import React, { useState } from 'react';
import { 
  Database, 
  Server, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Search, 
  Filter, 
  Layers, 
  Check, 
  ArrowRightLeft, 
  Clock,
  ShieldCheck
} from 'lucide-react';

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
export type DataSourceType = 'HIS/EMR' | 'LIS' | 'PACS/RIS';
export type ConnectionStatus = 'Connected' | 'Syncing' | 'Error';
export type StandardizationStatus = 'STANDARDIZED' | 'MISSING_DATA' | 'DUPLICATE';

export interface HospitalSourceSystem {
  id: string;
  name: DataSourceType;
  fullName: string;
  endpoint: string;
  standard: string; // HL7 v2.5, FHIR R4, DICOMweb
  status: ConnectionStatus;
  lastSync: string;
  latencyMs: number;
  totalPackets24h: number;
}

export interface IngestionPacket {
  id: string;
  source: DataSourceType;
  patientCode: string;
  patientName: string;
  dataType: 'SINH_HIEU' | 'XET_NGHIEM' | 'CHAN_DOAN_HINH_ANH' | 'DON_THUOC';
  dataSummary: string;
  rawFormat: string; // HL7 ORU_R01, FHIR Observation, DICOM SR
  receivedAt: string;
  status: StandardizationStatus;
  errorMessage?: string;
}

// --- DỮ LIỆU MẪU (MOCK DATA) THEO NGỮ CẢNH BỆNH VIỆN HỮU NGHỊ ---
const INITIAL_SOURCES: HospitalSourceSystem[] = [
  {
    id: 'src-01',
    name: 'HIS/EMR',
    fullName: 'Hệ thống Quản lý Bệnh viện & Bệnh án Điện tử',
    endpoint: 'https://his.benhvienhuunghi.vn/api/fhir/v1',
    standard: 'HL7 / FHIR R4',
    status: 'Connected',
    lastSync: 'Vừa xong (10s trước)',
    latencyMs: 42,
    totalPackets24h: 1420,
  },
  {
    id: 'src-02',
    name: 'LIS',
    fullName: 'Hệ thống Thông tin Phòng Xét nghiệm (Sinh hóa)',
    endpoint: 'mllp://lis-gw.benhvienhuunghi.vn:2575',
    standard: 'HL7 v2.5 (ORU^R01)',
    status: 'Syncing',
    lastSync: 'Đang lắng nghe gói mới...',
    latencyMs: 78,
    totalPackets24h: 3890,
  },
  {
    id: 'src-03',
    name: 'PACS/RIS',
    fullName: 'Hệ thống Lưu trữ & Truyền nhận Hình ảnh Y tế',
    endpoint: 'https://pacs.benhvienhuunghi.vn/dicom-web',
    standard: 'DICOMweb / WADO-RS',
    status: 'Connected',
    lastSync: '2 phút trước',
    latencyMs: 125,
    totalPackets24h: 640,
  },
];

const INITIAL_PACKETS: IngestionPacket[] = [
  {
    id: 'PKT-9041',
    source: 'LIS',
    patientCode: 'BN-2026-0891',
    patientName: 'Trần Văn Mạnh',
    dataType: 'XET_NGHIEM',
    dataSummary: 'NT-proBNP: 1850 pg/mL, Creatinine: 142 umol/L, K+: 4.8 mmol/L',
    rawFormat: 'HL7 ORU_R01 (MLLP)',
    receivedAt: '10:45:12',
    status: 'STANDARDIZED',
  },
  {
    id: 'PKT-9042',
    source: 'PACS/RIS',
    patientCode: 'BN-2026-0891',
    patientName: 'Trần Văn Mạnh',
    dataType: 'CHAN_DOAN_HINH_ANH',
    dataSummary: 'Siêu âm tim màu: LVEF Simpson 32%, Giãn thất trái LVDd 62mm',
    rawFormat: 'DICOM SR Structured',
    receivedAt: '10:44:05',
    status: 'STANDARDIZED',
  },
  {
    id: 'PKT-9043',
    source: 'LIS',
    patientCode: 'BN-2026-0642',
    patientName: 'Lê Thị Hòa',
    dataType: 'XET_NGHIEM',
    dataSummary: 'NT-proBNP: 420 pg/mL, Khuyết thiếu chỉ số điện giải K+ & Na+',
    rawFormat: 'HL7 ORU_R01 (MLLP)',
    receivedAt: '10:30:20',
    status: 'MISSING_DATA',
    errorMessage: 'Thiếu trường điện giải K+ / Na+ cần thiết cho Model 4 MedSafety',
  },
  {
    id: 'PKT-9044',
    source: 'HIS/EMR',
    patientCode: 'BN-2026-0115',
    patientName: 'Nguyễn Đình Phúc',
    dataType: 'SINH_HIEU',
    dataSummary: 'Trùng lặp 2 bản ghi sinh hiệu lúc 09:15 cùng mã lượt khám LK-442',
    rawFormat: 'FHIR Observation JSON',
    receivedAt: '09:16:02',
    status: 'DUPLICATE',
    errorMessage: 'Trùng khóa (patient_id, recorded_at). Cần hợp nhất bản ghi mới nhất.',
  },
];

export default function HospitalDataIntegration() {
  const [sources, setSources] = useState<HospitalSourceSystem[]>(INITIAL_SOURCES);
  const [packets, setPackets] = useState<IngestionPacket[]>(INITIAL_PACKETS);
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleReprocessPacket = (packetId: string) => {
    setPackets((prev) =>
      prev.map((pkt) => {
        if (pkt.id === packetId) {
          return {
            ...pkt,
            status: 'STANDARDIZED',
            errorMessage: undefined,
            dataSummary: pkt.dataSummary.replace('Khuyết thiếu chỉ số', 'Đã bổ sung') + ' [Đã chuẩn hóa snake_case]',
          };
        }
        return pkt;
      })
    );
    showToast(`Đã đối chiếu, làm sạch và chuẩn hóa lại gói ${packetId} thành công!`);
  };

  const filteredPackets = packets.filter((pkt) => {
    const matchSearch =
      pkt.patientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkt.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSrc = filterSource === 'ALL' || pkt.source === filterSource;
    const matchSts = filterStatus === 'ALL' || pkt.status === filterStatus;
    return matchSearch && matchSrc && matchSts;
  });

  return (
    <div className="space-y-6 font-sans text-slate-800 antialiased">
      
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm text-white shadow-2xl border border-slate-700">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-800 font-bold text-xs">
              02
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Tích Hợp và Tiền Xử Lý Dữ Liệu (ETL Pipeline)
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Giám sát luồng trao đổi dữ liệu chuẩn HL7/FHIR từ HIS, LIS, PACS và chuẩn hóa bộ 211 biến snake_case phục vụ AI-CDSS.
          </p>
        </div>

        <button
          onClick={() => showToast('Đang làm mới trạng thái kết nối Socket với các hệ thống viện...')}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <RefreshCw className="mr-2 h-3.5 w-3.5 text-slate-500" />
          Làm mới kết nối
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {sources.map((src) => (
          <div
            key={src.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-teal-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {src.name}
                </span>
                {src.status === 'Connected' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                    Connected
                  </span>
                )}
                {src.status === 'Syncing' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin text-blue-600" />
                    Syncing
                  </span>
                )}
              </div>

              <h3 className="mt-3 text-sm font-bold text-slate-900 leading-snug">{src.fullName}</h3>
              <p className="mt-1 font-mono text-[11px] text-slate-400 truncate">{src.endpoint}</p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
                <div>
                  <span className="text-slate-400 block text-[10px]">Chuẩn giao thức</span>
                  <span className="font-semibold text-slate-700">{src.standard}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Độ trễ (Latency)</span>
                  <span className="font-semibold text-slate-700">{src.latencyMs} ms</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-medium">Gói 24h: <b>{src.totalPackets24h.toLocaleString()}</b></span>
              <span className="text-slate-400">{src.lastSync}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
        
        <div className="flex flex-col md:flex-row justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-teal-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Nhật Ký Tiếp Nhận Dữ Liệu (Ingestion Log)
              </h2>
              <p className="text-xs text-slate-500">Giám sát các gói tin truyền về kèm định dạng HL7 v2.5, FHIR R4, DICOMweb</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm Mã BN, Tên hoặc Mã gói..."
                className="rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>

            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Mọi nguồn viện</option>
              <option value="HIS/EMR">HIS/EMR</option>
              <option value="LIS">LIS (Xét nghiệm)</option>
              <option value="PACS/RIS">PACS/RIS (Hình ảnh)</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Mọi trạng thái</option>
              <option value="STANDARDIZED">Đã chuẩn hóa (211 biến)</option>
              <option value="MISSING_DATA">Thiếu dữ liệu</option>
              <option value="DUPLICATE">Trùng lặp bản ghi</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/70 text-xs font-bold uppercase text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Mã Gói & Thời Gian</th>
                <th className="px-4 py-3">Nguồn Dữ Liệu</th>
                <th className="px-4 py-3">Bệnh Nhân</th>
                <th className="px-6 py-3">Nội Dung Gói Tin & Định Dạng</th>
                <th className="px-4 py-3 text-center">Trạng Thái Chuẩn Hóa</th>
                <th className="px-4 py-3 text-right">Thao Tác Xử Lý Lỗi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPackets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Không tìm thấy bản ghi gói tin nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredPackets.map((pkt) => (
                  <tr key={pkt.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-slate-900">{pkt.id}</div>
                      <div className="text-[11px] text-slate-400 flex items-center mt-0.5">
                        <Clock className="w-3 h-3 mr-1" />
                        {pkt.receivedAt}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-800">{pkt.source}</span>
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                        {pkt.rawFormat}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{pkt.patientName}</div>
                      <div className="font-mono text-[11px] text-teal-700">{pkt.patientCode}</div>
                    </td>

                    <td className="px-6 py-3.5 max-w-md">
                      <p className="text-slate-800 font-medium">{pkt.dataSummary}</p>
                      {pkt.errorMessage && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                          {pkt.errorMessage}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {pkt.status === 'STANDARDIZED' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 mr-1 text-emerald-600" />
                          Đã chuẩn hóa (211 biến snake_case)
                        </span>
                      )}
                      {pkt.status === 'MISSING_DATA' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                          Thiếu dữ liệu
                        </span>
                      )}
                      {pkt.status === 'DUPLICATE' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
                          <ArrowRightLeft className="w-3 h-3 mr-1 text-purple-600" />
                          Trùng lặp bản ghi
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {pkt.status === 'STANDARDIZED' ? (
                        <span className="text-[11px] text-slate-400 font-medium">Hoàn tất</span>
                      ) : (
                        <button
                          onClick={() => handleReprocessPacket(pkt.id)}
                          className="inline-flex items-center rounded-xl bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="mr-1.5 h-3 w-3" />
                          Chuẩn hóa lại
                        </button>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}