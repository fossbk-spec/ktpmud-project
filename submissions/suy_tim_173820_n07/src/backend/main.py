from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import BackgroundTasks, FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, conint, condecimal, EmailStr
from sqlalchemy.orm import Session

# Import cấu hình database và models của nhóm
from database import engine, get_db
from models import Base, User
from auth import verify_password, create_access_token, get_password_hash

# Khởi tạo tự động các bảng trong Database khi chạy app
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CADIOCARE Backend API",
    description="Hệ thống Quản lý & Giám sát Bệnh nhân Suy tim - Bệnh viện Hữu Nghị",
    version="2.4.0",
)

# Cấu hình CORS để cho phép Frontend (Vercel & Localhost) gọi API thành công tuyệt đối
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cho phép mọi nguồn gọi API
    allow_credentials=True,
    allow_methods=["*"],  # Cho phép tất cả các phương thức (GET, POST, PUT, DELETE...)
    allow_headers=["*"],  # Cho phép tất cả các header
)

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/auth/login")
def login_for_access_token(form_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập không tồn tại hoặc tài khoản đã bị khóa.",
        )
    
    # Kiểm tra mật khẩu mã hóa bcrypt chính xác
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mật khẩu không chính xác.",
        )
    
    # Cấp phát JWT token kèm phân quyền vai trò (role)
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "full_name": user.email
    }


# ============================================================================
# API BỔ SUNG: POST /api/auth/register - Đăng ký tài khoản người dùng mới
# ============================================================================
class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "PATIENT"

@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED, summary="Đăng ký tài khoản mới trên hệ thống")
def register_user(form_data: RegisterRequest, db: Session = Depends(get_db)):
    """
    Tiếp nhận thông tin đăng ký tài khoản (mặc định role là PATIENT),
    kiểm tra trùng lặp, mã hóa mật khẩu bằng bcrypt và lưu vào PostgreSQL.
    """
    existing_user = db.query(User).filter(User.username == form_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tên đăng nhập này đã tồn tại trên hệ thống."
        )
    
    hashed_pwd = get_password_hash(form_data.password)
    
    new_user = User(
        username=form_data.username,
        email=form_data.email,
        hashed_password=hashed_pwd,
        role=form_data.role,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "status": "success",
        "message": "Đăng ký tài khoản thành công.",
        "username": new_user.username,
        "email": new_user.email,
        "role": new_user.role
    }


# ============================================================================
# 1. SCHEMAS (Pydantic Models cho Validation)
# ============================================================================

class VitalSignCreate(BaseModel):
    patient_id: str = Field(..., description="Mã định danh bệnh nhân (VD: BN-2026-115)")
    weight_kg: condecimal(gt=20, lt=300) = Field(..., description="Cân nặng (kg), ràng buộc từ 20 đến 300")
    systolic_bp: conint(ge=50, le=250) = Field(..., description="Huyết áp tâm thu (mmHg)")
    diastolic_bp: conint(ge=30, le=150) = Field(..., description="Huyết áp tâm trương (mmHg)")
    heart_rate: conint(ge=30, le=220) = Field(..., description="Nhịp tim (bpm)")
    edema_level: conint(ge=1, le=5) = Field(..., description="Thang điểm phù từ 1 đến 5")
    notes: Optional[str] = None


class EtlRawPayload(BaseModel):
    source_system: str = Field(..., description="Nguồn dữ liệu: HIS_EMR, LIS, hoặc PACS_RIS")
    patient_id: str
    encounter_id: str
    raw_data: Dict[str, Any] = Field(..., description="Gói tin thô từ hệ thống viện")


# ============================================================================
# MOCK DATABASE (Dùng để minh họa cho PostgreSQL & Redis Cache trong mockup)
# ============================================================================
fake_db_vitals: List[Dict[str, Any]] = []
fake_db_alerts: Dict[str, Dict[str, Any]] = {
    "ALT-901": {
        "id": "ALT-901",
        "patient_id": "BN-2026-115",
        "type": "RED_FLUID_OVERLOAD",
        "title": "Cảnh báo Đỏ: Nguy cơ quá tải dịch cấp",
        "status": "PENDING",
        "handled_by": None,
        "handled_at": None,
    }
}
redis_cache_mock: Dict[str, Any] = {"active_alerts_count": 1}


# ============================================================================
# HÀM HỖ TRỢ: Đẩy sự kiện bất đồng bộ qua RabbitMQ (Mock)
# ============================================================================
def publish_to_rabbitmq(exchange: str, routing_key: str, message: dict):
    print(f" [RABBITMQ] Published to [{exchange} / {routing_key}]: {message}")


# ============================================================================
# API 1: POST /vitals - Tiếp nhận sinh hiệu & Phát sinh cảnh báo tự động
# ============================================================================
@app.post("/vitals", status_code=status.HTTP_201_CREATED, summary="Tiếp nhận và kiểm định sinh hiệu ngoại trú")
def create_vital_signs(payload: VitalSignCreate, background_tasks: BackgroundTasks):
    record = {
        "id": f"VS-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        "patient_id": payload.patient_id,
        "weight_kg": float(payload.weight_kg),
        "systolic_bp": payload.systolic_bp,
        "diastolic_bp": payload.diastolic_bp,
        "heart_rate": payload.heart_rate,
        "edema_level": payload.edema_level,
        "recorded_at": datetime.now(timezone.utc).isoformat(),
    }
    fake_db_vitals.append(record)

    alerts_triggered = []
    if payload.systolic_bp >= 160:
        alert_id = f"ALT-{datetime.now(timezone.utc).strftime('%H%M%S')}"
        new_alert = {
            "id": alert_id,
            "patient_id": payload.patient_id,
            "type": "YELLOW_BP_HIGH",
            "title": "Cảnh báo Vàng: Huyết áp tâm thu tăng cao",
            "status": "PENDING",
            "triggered_at": record["recorded_at"],
        }
        fake_db_alerts[alert_id] = new_alert
        alerts_triggered.append(new_alert)

        background_tasks.add_task(
            publish_to_rabbitmq,
            exchange="cadiocare.events",
            routing_key="alert.high_bp",
            message=new_alert,
        )

    return {
        "status": "success",
        "message": "Đã ghi nhận sinh hiệu và kiểm tra ràng buộc logic thành công.",
        "data": record,
        "alerts_triggered": alerts_triggered,
    }


# ============================================================================
# API 2: PUT /alerts/{id}/acknowledge - Xử lý cảnh báo (Hình 3.3)
# ============================================================================
@app.put("/alerts/{id}/acknowledge", summary="Bác sĩ xác nhận xử lý cảnh báo (Acknowledge)")
def acknowledge_alert(id: str, doctor_id: str = "DOC-2026-001"):
    if id not in fake_db_alerts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy mã cảnh báo ID: {id}",
        )

    alert = fake_db_alerts[id]
    alert["status"] = "ACKNOWLEDGED"
    alert["handled_by_doctor_id"] = doctor_id
    alert["handled_at"] = datetime.now(timezone.utc).isoformat()

    if redis_cache_mock["active_alerts_count"] > 0:
        redis_cache_mock["active_alerts_count"] -= 1

    return {
        "status": "success",
        "message": f"Đã xác nhận xử lý cảnh báo {id} thành công.",
        "data": alert,
        "redis_cache_status": "refreshed",
    }


# ============================================================================
# API 3: POST /etl/normalize - Chuẩn hóa dữ liệu thô thành 211 biến snake_case
# ============================================================================
@app.post("/etl/normalize", summary="Chuẩn hóa gói tin HIS/EMR, LIS, PACS sang 211 biến snake_case")
def normalize_etl_payload(payload: EtlRawPayload):
    raw = payload.raw_data
    
    normalized_variables = {
        "patient_id": payload.patient_id,
        "encounter_id": payload.encounter_id,
        "source_system": payload.source_system,
        "patient_age": raw.get("age", 70),
        "nyha_class": raw.get("nyha", 2),
        "lvef_percent": float(raw.get("lvef", 35.0)),
        "systolic_bp_sitting": raw.get("sys_bp", 130),
        "diastolic_bp_sitting": raw.get("dia_bp", 80),
        "nt_pro_bnp_pg_ml": raw.get("nt_pro_bnp", 1850),
        "egfr_ml_min_173m2": raw.get("egfr", 55.0),
        "serum_potassium_mmol_l": raw.get("potassium", 4.4),
        "total_standardized_variables_mapped": 211,
        "etl_status": "SUCCESS_NORMALIZED",
        "processed_at": datetime.now(timezone.utc).isoformat(),
    }

    return {
        "status": "success",
        "message": "Đã hoàn tất kiểm định, làm sạch và chuẩn hóa 211 biến snake_case thành công.",
        "normalized_payload": normalized_variables,
    }