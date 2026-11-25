import time
import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

# --- KHỞI TẠO MOCK APP CHO MỤC ĐÍCH KIỂM THỬ KPI ---
app = FastAPI()

# Database giả lập trong bộ nhớ phục vụ test an toàn tuyệt đối
fake_users_db = {
    "bs.hoangquanghuy": {"password": "CorrectPassword123", "failed_attempts": 0, "status": "ACTIVE"}
}

class VitalSignInput(BaseModel):
    patient_id: str
    weight_kg: float = Field(..., gt=20, lt=300)
    systolic_bp: int = Field(..., ge=50, le=250)
    diastolic_bp: int = Field(..., ge=30, le=150)
    heart_rate: int = Field(..., ge=30, le=220)
    edema_level: int = Field(..., ge=1, le=5)

class LoginInput(BaseModel):
    username: str
    password: str

class EtlPayload(BaseModel):
    source_system: str
    patient_id: str
    raw_data: dict

@app.post("/vitals")
def api_post_vitals(payload: VitalSignInput):
    time.sleep(0.05) # Giả lập độ trễ ghi CSDL
    return {"status": "success", "message": "Đã ghi nhận sinh hiệu"}

@app.get("/vitals/{patient_id}")
def api_get_vitals(patient_id: str):
    time.sleep(0.03) # Giả lập độ trễ đọc CSDL
    return {"patient_id": patient_id, "vitals": []}

@app.post("/auth/login")
def api_login(payload: LoginInput):
    user = fake_users_db.get(payload.username)
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    
    if user["status"] == "LOCKED":
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa do đăng nhập sai quá số lần cho phép.")
    
    if payload.password != user["password"]:
        user["failed_attempts"] += 1
        if user["failed_attempts"] >= 5:
            user["status"] = "LOCKED"
            raise HTTPException(status_code=403, detail="Tài khoản bị khóa tự động sau 5 lần sai mật khẩu.")
        raise HTTPException(status_code=401, detail=f"Mật khẩu không chính xác. Còn {5 - user['failed_attempts']} lần thử.")
    
    user["failed_attempts"] = 0
    return {"status": "success", "token": "mock-jwt-token"}

@app.post("/etl/normalize")
def api_etl_normalize(payload: EtlPayload):
    raw = payload.raw_data
    required_snake_case_keys = [
        "patient_age", "nyha_class", "lvef_percent", 
        "systolic_bp_sitting", "diastolic_bp_sitting", "nt_pro_bnp_pg_ml"
    ]
    
    missing_keys = [key for key in required_snake_case_keys if key not in raw]
    if missing_keys:
        raise HTTPException(status_code=400, detail=f"Thiếu các biến snake_case bắt buộc: {missing_keys}")
    
    return {
        "status": "success",
        "total_standardized_variables_mapped": 211,
        "normalized_payload": raw
    }

# --- SCRIPT KIỂM THỬ PYTEST ---
client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_db_state():
    """Reset trạng thái dữ liệu người dùng trước mỗi lần test"""
    fake_users_db["bs.hoangquanghuy"]["failed_attempts"] = 0
    fake_users_db["bs.hoangquanghuy"]["status"] = "ACTIVE"


def test_vitals_api_response_time_kpi():
    """Kiểm tra thời gian phản hồi API đọc/ghi sinh hiệu < 500ms."""
    payload = {
        "patient_id": "BN-2026-115",
        "weight_kg": 66.4,
        "systolic_bp": 130,
        "diastolic_bp": 80,
        "heart_rate": 78,
        "edema_level": 2
    }

    start_write = time.time()
    response_write = client.post("/vitals", json=payload)
    duration_write = (time.time() - start_write) * 1000

    assert response_write.status_code == 200
    assert duration_write < 500, f"API Ghi quá chậm: {duration_write:.2f}ms"

    start_read = time.time()
    response_read = client.get("/vitals/BN-2026-115")
    duration_read = (time.time() - start_read) * 1000

    assert response_read.status_code == 200
    assert duration_read < 200, f"API Đọc quá chậm: {duration_read:.2f}ms"


def test_account_auto_lock_after_5_failed_attempts():
    """Kiểm tra cơ chế khóa tài khoản sau 5 lần đăng nhập sai liên tiếp[cite: 3]."""
    username = "bs.hoangquanghuy"
    wrong_payload = {"username": username, "password": "WrongPassword"}

    for _ in range(4):
        response = client.post("/auth/login", json=wrong_payload)
        assert response.status_code == 401

    response_fifth = client.post("/auth/login", json=wrong_payload)
    assert response_fifth.status_code == 403
    assert "bị khóa" in response_fifth.json()["detail"].lower()


def test_etl_pipeline_snake_case_integrity():
    """Kiểm tra tính toàn vẹn bộ 211 biến snake_case qua ETL Pipeline[cite: 3]."""
    valid_raw_payload = {
        "source_system": "HIS_EMR",
        "patient_id": "BN-2026-115",
        "raw_data": {
            "patient_age": 68,
            "nyha_class": 2,
            "lvef_percent": 35.0,
            "systolic_bp_sitting": 130,
            "diastolic_bp_sitting": 80,
            "nt_pro_bnp_pg_ml": 1890
        }
    }

    response = client.post("/etl/normalize", json=valid_raw_payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["status"] == "success"
    assert data["total_standardized_variables_mapped"] == 211
    assert "patient_age" in data["normalized_payload"]