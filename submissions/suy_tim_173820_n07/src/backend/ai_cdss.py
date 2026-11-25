from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

# ==============================================================================
# ĐỊNH NGHĨA CẤU TRÚC DỮ LIỆU ĐẦU VÀO & ĐẦU RA CHO 4 MÔ HÌNH AI-CDSS
# ==============================================================================

@dataclass
class PatientClinicalData:
    patient_id: str
    age: int
    gender: str
    weight_kg: float
    systolic_bp: int
    diastolic_bp: int
    heart_rate: int
    lvef: float  # Phân suất tống máu (%)
    nyha_class: str  # 'I', 'II', 'III', 'IV'
    nt_pro_bnp: float  # pg/mL
    egfr: float  # mL/min/1.73m²
    potassium: float  # mmol/L
    frailty_score: int  # Thang điểm lão suy (1-9)
    symptoms: List[str] = field(default_factory=list)
    comorbidities: List[str] = field(default_factory=list)
    current_medications: List[str] = field(default_factory=list)


# ==============================================================================
# MODEL 1: AI DIAGNOSIS – HỖ TRỢ CHẨN ĐOÁN & PHÂN TẦNG
# ==============================================================================
class AIDiagnosisModel:
    """
    Model 1: Nhận đầu vào (84 biến đặc trưng lâm sàng/cận lâm sàng),
    phân tầng Stage A-D, kiểu hình HFrEF/HFmrEF/HFpEF và cảnh báo nguy cơ cấp cứu.
    """
    def evaluate(self, data: PatientClinicalData) -> Dict[str, Any]:
        # 1. Phân loại kiểu hình EF theo Guideline ESC
        if data.lvef <= 40:
            phenotype = "HFrEF (Suy tim EF giảm)"
        elif 41 <= data.lvef <= 49:
            phenotype = "HFmrEF (Suy tim EF giảm nhẹ)"
        else:
            phenotype = "HFpEF (Suy tim EF bảo tồn)"

        # 2. Phân tầng giai đoạn AHA/ACC
        if data.nyha_class in ['I', 'II', 'III', 'IV']:
            stage = "Stage C (Suy tim có triệu chứng rõ rệt)"
        elif data.egfr < 60 or data.systolic_bp >= 140:
            stage = "Stage B (Tiền suy tim - Có tổn thương cấu trúc nhưng chưa có triệu chứng)"
        else:
            stage = "Stage A (Nguy cơ cao mắc suy tim)"

        # 3. Phát hiện cảnh báo cấp cứu (Worsening / Decompensated HF)
        emergency_alerts = []
        if data.systolic_bp < 90:
            emergency_alerts.append("CẢNH BÁO ĐỎ: Tụt huyết áp / Nguy cơ sốc tim!")
        if data.nt_pro_bnp > 5000:
            emergency_alerts.append("CẢNH BÁO: NT-proBNP rất cao, nguy cơ quá tải dịch nặng / Phù phổi cấp.")

        return {
            "model": "Model 1: AI Diagnosis",
            "aha_stage": stage,
            "ef_phenotype": phenotype,
            "nyha_class": data.nyha_class,
            "emergency_alerts": emergency_alerts,
            "risk_assessment": "Nguy cơ tái nhập viện cao trong 30 ngày" if data.nt_pro_bnp > 3000 else "Ổn định"
        }


# ==============================================================================
# MODEL 2: AI LAB/TEST – GỢI Ý XÉT NGHIỆM & CẬN LÂM SÀNG
# ==============================================================================
class AILabTestModel:
    """
    Model 2: Đề xuất chỉ định xét nghiệm/CLS (NT-proBNP, eGFR, điện giải đồ, siêu âm tim)
    và phân loại mức độ ưu tiên theo tình trạng bệnh nhân.
    """
    def recommend_tests(self, data: PatientClinicalData, diagnosis_result: dict) -> Dict[str, Any]:
        recommended_tests = []
        priority = "Định kỳ"

        # Đề xuất dựa trên biểu hiện cấp tính hoặc eGFR thấp
        if data.egfr < 60:
            recommended_tests.append({
                "test_name": "Định lượng Creatinine & eGFR máu",
                "reason": "Theo dõi chức năng thận do eGFR giảm (< 60 mL/min)",
                "urgency": "Trong 24 giờ"
            })
            priority = "Cấp bách"

        if data.potassium < 3.5 or data.potassium > 5.0:
            recommended_tests.append({
                "test_name": "Điện giải đồ (Na+, K+, Cl-)",
                "reason": "Hiệu chỉnh điện giải trước khi tối ưu hóa thuốc MRA / RAASi",
                "urgency": "Cấp cứu / Trong ngày"
            })
            priority = "Cấp bách"

        # Xét nghiệm cơ bản định kỳ cho suy tim
        recommended_tests.extend([
            {"test_name": "NT-proBNP hoặc BNP", "reason": "Đánh giá mức độ sung huyết và đáp ứng điều trị", "urgency": "Định kỳ mỗi đợt tái khám"},
            {"test_name": "Siêu âm tim Doppler màu", "reason": "Đánh giá lại phân suất tống máu LVEF và áp lực động mạch phổi", "urgency": "Mỗi 3-6 tháng"}
        ])

        return {
            "model": "Model 2: AI Lab/Test",
            "priority_level": priority,
            "recommended_tests": recommended_tests,
            "differential_diagnosis_note": "Loại trừ giả suy tim do bệnh thận mạn hoặc COPD đồng mắc."
        }


# ==============================================================================
# MODEL 3: AI TREATMENT – PHÁC ĐỒ 4 TRỤ CỘT CÁ THỂ HÓA (GUIDELINE BYT)
# ==============================================================================
class AITreatmentModel:
    """
    Model 3: Đề xuất phác đồ 4 trụ cột (ARNI/ACEi/ARB, Chẹn beta, MRA, SGLT2i)
    cá thể hóa theo độ lọc cầu thận (eGFR), huyết áp và hội chứng lão suy (Frailty).
    """
    def suggest_treatment(self, data: PatientClinicalData) -> Dict[str, Any]:
        regimen = []

        # 1. Trụ cột 1: ARNI / ACEi / ARB (Ưu tiên Sacubitril/Valsartan nếu HFrEF và HA cho phép)
        if data.systolic_bp >= 100:
            regimen.append({
                "pillar": "Trụ cột 1: Ức chế hệ RAAS (Ưu tiên ARNI - Entresto)",
                "suggestion": "Khởi liều 49/51mg x 2 lần/ngày (hoặc 24/26mg nếu người cao tuổi / HA thấp)",
                "monitoring": "Theo dõi huyết áp, chức năng thận và kali máu sau 1-2 tuần"
            })
        else:
            regimen.append({
                "pillar": "Trụ cột 1: Ức chế hệ RAAS",
                "suggestion": "Thận trọng do huyết áp tâm thu thấp (< 100 mmHg). Cân nhắc giảm liều hoặc tạm hoãn.",
                "monitoring": "Đo huyết áp tư thế"
            })

        # 2. Trụ cột 2: Chẹn beta giao cảm (Bisoprolol, Carvedilol, Metoprolol succinate)
        regimen.append({
            "pillar": "Trụ cột 2: Chẹn beta giao cảm",
            "suggestion": "Bisoprolol 2.5mg/ngày hoặc Carvedilol 3.125mg x 2 lần/ngày. Tăng liều từ từ mỗi 2 tuần.",
            "monitoring": "Theo dõi nhịp tim (mục tiêu 55-60 bpm) và dấu hiệu sung huyết nặng lên."
        })

        # 3. Trụ cột 3: Kháng Aldosterone (MRA - Spironolactone / Eplerenone)
        if data.egfr >= 30 and data.potassium < 5.0:
            regimen.append({
                "pillar": "Trụ cột 3: Kháng thụ thể Mineralocorticoid (MRA)",
                "suggestion": "Spironolactone 12.5mg hoặc 25mg x 1 lần/ngày.",
                "monitoring": "Kiểm tra định kỳ Kali máu và Creatinine (Tránh tăng K+ > 5.5 mmol/L)."
            })
        else:
            regimen.append({
                "pillar": "Trụ cột 3: Kháng thụ thể Mineralocorticoid (MRA)",
                "suggestion": "CHỐNG CHỈ ĐỊNH / THẬN TRỌNG: Do eGFR < 30 hoặc Kali máu >= 5.0 mmol/L.",
                "monitoring": "Không khởi trị MRA lúc này."
            })

        # 4. Trụ cột 4: Ức chế SGLT2 (Dapagliflozin / Empagliflozin)
        regimen.append({
            "pillar": "Trụ cột 4: Ức chế SGLT2i",
            "suggestion": "Dapagliflozin 10mg x 1 lần/ngày (hoặc Empagliflozin 10mg/ngày) cho mọi bệnh nhân HFrEF/HFpEF nếu eGFR >= 20.",
            "monitoring": "Theo dõi thể tích tuần hoàn và vệ sinh sinh dục."
        })

        # Cá thể hóa theo Frailty (Lão suy)
        frailty_warning = ""
        if data.frailty_score >= 5:
            frailty_warning = "LƯU Ý LÃO KHOA: Bệnh nhân có hội chứng lão suy nặng (Frailty >= 5). Ưu tiên khởi liều thấp nhất, tăng liều chậm và tối giản hóa số lượng thuốc uống."

        return {
            "model": "Model 3: AI Treatment",
            "core_pillars_regimen": regimen,
            "frailty_personalization": frailty_warning
        }


# ==============================================================================
# MODEL 4: AI MEDSAFETY – RÀ SOÁT AN TOÀN THUỐC & HUMAN-IN-THE-LOOP
# ==============================================================================
class AIMedSafetyModel:
    """
    Model 4: Rà soát tương tác thuốc, chống chỉ định (tuyệt đối tránh NSAIDs ở bệnh nhân suy tim)
    và áp dụng cơ chế Human-in-the-Loop (Bác sĩ bắt buộc phải Accept hoặc nhập Override Reason).
    """
    def check_safety(self, data: PatientClinicalData, proposed_meds: List[str]) -> Dict[str, Any]:
        alerts = []

        # Kiểm tra chống chỉ định tuyệt đối: NSAIDs
        for med in data.current_medications:
            if "nsaid" in med.lower() or "ibuprofen" in med.lower() or "meloxicam" in med.lower() or "diclofenac" in med.lower():
                alerts.append({
                    "severity": "NGHIÊM TRỌNG (CRITICAL)",
                    "warning": f"Phát hiện thuốc kháng viêm không steroid ({med}). NSAIDs gây giữ muối nước, làm nặng suy tim và suy thận!",
                    "action_required": "NGỪNG NGAY LẬP TỨC."
                })

        # Kiểm tra nguy cơ tăng Kali máu khi kết hợp RAASi + MRA
        if "Spironolactone" in str(proposed_meds) and data.potassium >= 4.8:
            alerts.append({
                "severity": "QUAN TRỌNG (WARNING)",
                "warning": f"Kali máu hiện tại là {data.potassium} mmol/L. Nguy cơ tăng kali máu đe dọa tính mạng khi dùng MRA.",
                "action_required": "Giảm liều hoặc theo dõi sát điện giải đồ sau 72 giờ."
            })

        return {
            "model": "Model 4: AI MedSafety",
            "safety_alerts": alerts,
            "human_in_the_loop_protocol": (
                "BẮT BUỘC: AI không tự động thay đổi hoặc ngừng thuốc. "
                "Bác sĩ điều trị phải thực hiện thao tác [Đồng ý - Accept] hoặc [Từ chối/Điều chỉnh - Override] "
                "kèm theo việc bắt buộc nhập lý do (Override Reason) để lưu vết vào Audit Log."
            )
        }


# ==============================================================================
# KIỂM THỬ TÍCH HỢP HỆ THỐNG 4 MÔ HÌNH (CADIOCARE PIPELINE)
# ==============================================================================
if __name__ == "__main__":
    # Khởi tạo dữ liệu giả lập một bệnh nhân suy tim cao tuổi (Theo ca bệnh thực tế)
    patient_sample = PatientClinicalData(
        patient_id="BN-2026-115",
        age=78,
        gender="Nam",
        weight_kg=66.4,
        systolic_bp=135,
        diastolic_bp=82,
        heart_rate=88,
        lvef=32.0,  # HFrEF
        nyha_class="III",
        nt_pro_bnp=3450.0,
        egfr=42.0,  # Suy thận mạn độ 3b
        potassium=4.9,
        frailty_score=6,  # Lão suy mức độ vừa/nặng
        current_medications=["Furosemide 40mg", "Meloxicam 7.5mg", "Digoxin 0.25mg"]
    )

    print("=== CHẠY CHUỖI 4 MÔ HÌNH AI-CDSS CHO BỆNH NHÂN: {} ===".format(patient_sample.patient_id))

    # Chạy Model 1
    m1 = AIDiagnosisModel()
    res1 = m1.evaluate(patient_sample)
    print("\n[Model 1 - Diagnosis]:", res1)

    # Chạy Model 2
    m2 = AILabTestModel()
    res2 = m2.recommend_tests(patient_sample, res1)
    print("\n[Model 2 - Lab/Test]:", res2)

    # Chạy Model 3
    m3 = AITreatmentModel()
    res3 = m3.suggest_treatment(patient_sample)
    print("\n[Model 3 - Treatment]:", res3)

    # Chạy Model 4
    m4 = AIMedSafetyModel()
    res4 = m4.check_safety(patient_sample, ["Entresto", "Bisoprolol", "Spironolactone", "Dapagliflozin"])
    print("\n[Model 4 - MedSafety]:", res4)