"""Kiểm thử tích hợp API (tuần 12 trong kế hoạch báo cáo).

Chạy:  pip install -r requirements.txt  &&  pytest -q
Mỗi bài test tự tạo người dùng/kèo riêng (tên duy nhất) nên có thể chạy theo thứ tự bất kỳ.
"""
import itertools
import threading
from datetime import time, timedelta

import pytest

pytest.importorskip("fastapi", reason="cần: pip install -r requirements.txt")
pytest.importorskip("httpx", reason="cần: pip install -r requirements.txt")

from fastapi import HTTPException  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import rules
from database import SessionLocal
from main import app
import models
import services

_counter = itertools.count(1)


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:   # chạy lifespan: tạo bảng + tài khoản admin
        yield c


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def register(client, role="player", verified_host=False, level=None):
    """Đăng ký + xác thực OTP (mã demo được API trả về), trả về (token, user)."""
    n = next(_counter)
    username = f"user{n}_{role}"
    r = client.post("/api/register", json={"username": username, "password": "secret1", "role": role,
                                           "ho_ten": f"Người {n}", "phone": f"09{n:08d}"})
    assert r.status_code == 200, r.text
    r = client.post("/api/auth/verify-otp", json={"username": username, "otp": r.json()["otp_demo"]})
    assert r.status_code == 200, r.text
    token, user = r.json()["access_token"], r.json()["user"]
    if verified_host:
        admin_verify_host(client, user["id"])
    if level:
        r = client.put("/api/users/me", json={"trinh_do": level}, headers=auth(token))
        assert r.status_code == 200, r.text
    return token, user


def admin_token(client):
    r = client.post("/api/login", data={"username": "admin", "password": "admin123"})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def admin_verify_host(client, user_id):
    r = client.post(f"/api/admin/users/{user_id}/verify-host", headers=auth(admin_token(client)))
    assert r.status_code == 200, r.text


def new_host(client):
    return register(client, "host", verified_host=True)


def court_payload(**over):
    day = rules.now_vn().date() + timedelta(days=1)
    data = {"ten_san": f"Sân thử {next(_counter)}", "dia_chi": "1 Đường Thử", "khu_vuc": "Cầu Giấy",
            "ngay_choi": day.isoformat(), "gio_bat_dau": "19:00", "gio_ket_thuc": "21:00", "trinh_min": 1, "trinh_max": 5,
            "tong_slot": 4, "gia_thue": 60000, "tien_coc": 0, "ghi_chu": "Cầu nhựa"}
    data.update(over)
    return data


def create_court(client, host_token, **over):
    r = client.post("/api/courts", json=court_payload(**over), headers=auth(host_token))
    assert r.status_code == 200, r.text
    return r.json()


def join(client, token, court_id, **body):
    payload = {"court_id": court_id, "so_luong_slot": 1}
    payload.update(body)
    return client.post("/api/bookings", json=payload, headers=auth(token))


def get_court(client, court_id, token=None):
    r = client.get(f"/api/courts/{court_id}", headers=auth(token) if token else {})
    assert r.status_code == 200, r.text
    return r.json()


def insert_court_direct(host_id, start_dt, end_dt, slots=4, taken=0, deposit=0.0):
    """Tạo kèo thẳng vào DB (kể cả kèo trong quá khứ mà API không cho tạo)."""
    with SessionLocal() as db:
        c = models.Court(host_id=host_id, ten_san=f"Sân trực tiếp {next(_counter)}", khu_vuc="Cầu Giấy",
                         ngay_choi=start_dt.date(), gio_bat_dau=start_dt.time(), gio_ket_thuc=end_dt.time(),
                         tong_slot=slots, slot_trong=slots - taken, gia_thue=50000, tien_coc=deposit)
        db.add(c)
        db.commit()
        return c.id


def insert_booking_direct(user_id, court_id, status="approved"):
    with SessionLocal() as db:
        b = models.Booking(user_id=user_id, court_id=court_id, so_luong=1, trang_thai=status)
        db.add(b)
        db.commit()
        return b.id


# ---------------------------------------------------------------- FR-01: đăng ký + OTP
def test_health_meta_and_websocket(client):
    assert client.get("/api/health").json()["status"] == "ok"
    meta = client.get("/api/meta").json()
    assert [t["ten"] for t in meta["trinh_do"]] == ["Newbie", "Trung bình - Yếu", "Trung bình", "Khá", "Giỏi"]
    assert "Đống Đa" in meta["quan_huyen"]
    with client.websocket_connect("/ws") as ws:
        assert ws.receive_json()["type"] == "hello"


def test_register_validation(client):
    base = {"username": "valid_name", "password": "secret1", "phone": "0911111111"}
    assert client.post("/api/register", json={**base, "phone": None}).status_code == 400            # thiếu email/SĐT
    assert client.post("/api/register", json={**base, "password": "123"}).status_code == 400        # mật khẩu ngắn
    assert client.post("/api/register", json={**base, "username": "1abc"}).status_code == 400       # tên không hợp lệ
    assert client.post("/api/register", json={**base, "phone": "12345"}).status_code == 400         # SĐT sai
    assert client.post("/api/register", json={**base, "role": "admin"}).status_code == 400          # không tự đăng ký admin


def test_otp_flow_and_login_gate(client):
    n = next(_counter)
    body = {"username": f"otpuser{n}", "password": "secret1", "email": f"otp{n}@example.com"}
    r = client.post("/api/register", json=body)
    assert r.status_code == 200
    otp = r.json()["otp_demo"]
    assert len(otp) == 6 and r.json()["kenh"] == "email"

    # chưa xác thực thì không đăng nhập được và được hướng sang bước OTP
    r = client.post("/api/login", data={"username": body["username"], "password": "secret1"})
    assert r.status_code == 403 and r.json()["detail"]["code"] == "OTP_REQUIRED"

    wrong = "000000" if otp != "000000" else "111111"
    assert client.post("/api/auth/verify-otp", json={"username": body["username"], "otp": wrong}).status_code == 400
    r = client.post("/api/auth/verify-otp", json={"username": body["username"], "otp": otp})
    assert r.status_code == 200 and r.json()["access_token"]

    # đăng nhập được bằng cả tên đăng nhập lẫn email
    for ident in (body["username"], body["email"]):
        assert client.post("/api/login", data={"username": ident, "password": "secret1"}).status_code == 200
    assert client.post("/api/login", data={"username": body["username"], "password": "sai"}).status_code == 400


def test_duplicate_username_phone_rejected(client):
    _, user = register(client)
    r = client.post("/api/register", json={"username": user["username"], "password": "secret1", "phone": "0988888888"})
    assert r.status_code == 400
    r = client.post("/api/register", json={"username": "someone_else", "password": "secret1", "phone": user["phone"]})
    assert r.status_code == 400


# ---------------------------------------------------------------- FR-02: hồ sơ, NFR-04: bảo mật liên hệ
def test_profile_update_and_privacy(client):
    token, user = register(client)
    r = client.put("/api/users/me", json={"ho_ten": "Nguyễn Văn Mới", "khu_vuc_thuong_choi": "Đống Đa", "trinh_do": 4},
                   headers=auth(token))
    assert r.status_code == 200 and r.json()["trinh_do_label"] == "Khá"
    assert client.put("/api/users/me", json={"trinh_do": 9}, headers=auth(token)).status_code == 400

    other_token, _ = register(client)
    pub = client.get(f"/api/users/{user['id']}", headers=auth(other_token)).json()
    assert pub["ho_ten"] == "Nguyễn Văn Mới"
    assert "phone" not in pub and "email" not in pub        # hồ sơ công khai không có thông tin liên hệ
    assert client.get(f"/api/users/{user['id']}").status_code == 401   # khách chưa đăng nhập không xem được


# ---------------------------------------------------------------- FR-04 / UC-02: tạo kèo
def test_unverified_host_cannot_create_court(client):
    token, user = register(client, "host")
    r = client.post("/api/courts", json=court_payload(), headers=auth(token))
    assert r.status_code == 403 and "xác thực" in r.json()["detail"]
    admin_verify_host(client, user["id"])
    assert client.post("/api/courts", json=court_payload(), headers=auth(token)).status_code == 200


def test_player_cannot_create_court(client):
    token, _ = register(client, "player")
    assert client.post("/api/courts", json=court_payload(), headers=auth(token)).status_code == 403


def test_create_court_validation(client):
    token, _ = new_host(client)
    yesterday = (rules.now_vn().date() - timedelta(days=1)).isoformat()
    r = client.post("/api/courts", json=court_payload(ngay_choi=yesterday), headers=auth(token))
    assert r.status_code == 400 and "quá khứ" in r.json()["detail"]        # ngoại lệ UC-02
    assert client.post("/api/courts", json=court_payload(gio_ket_thuc="18:00"), headers=auth(token)).status_code == 400
    assert client.post("/api/courts", json=court_payload(trinh_min=4, trinh_max=2), headers=auth(token)).status_code == 400
    assert client.post("/api/courts", json=court_payload(tien_coc=70000), headers=auth(token)).status_code == 400
    assert client.post("/api/courts", json=court_payload(tong_slot=0), headers=auth(token)).status_code == 400
    assert client.post("/api/courts", json=court_payload(vi_do=21.0), headers=auth(token)).status_code == 400   # thiếu kinh độ
    assert client.post("/api/courts", json=court_payload(ngay_choi="25/10/2026"), headers=auth(token)).status_code == 400


# ---------------------------------------------------------------- FR-07: tìm kiếm & lọc
def test_search_and_filters(client):
    token, _ = new_host(client)
    tag = f"Zeta{next(_counter)}"
    day2 = (rules.now_vn().date() + timedelta(days=2)).isoformat()
    a = create_court(client, token, ten_san=f"{tag} Đống Đa", khu_vuc="Đống Đa", gio_bat_dau="18:00", gio_ket_thuc="20:00",
                     trinh_min=1, trinh_max=2, gia_thue=40000)
    b = create_court(client, token, ten_san=f"{tag} Hà Đông", khu_vuc="Hà Đông", gio_bat_dau="20:00", gio_ket_thuc="22:00",
                     trinh_min=4, trinh_max=5, gia_thue=90000, ngay_choi=day2)

    def ids(**params):
        params.setdefault("q", tag)
        return {c["id"] for c in client.get("/api/courts", params=params).json()["data"]}

    assert ids() == {a["id"], b["id"]}
    assert ids(q=tag.lower()) == {a["id"], b["id"]}                      # không phân biệt hoa thường
    assert ids(q=f"{tag} dong da") == {a["id"]}                          # không phân biệt dấu
    assert ids(district="Hà Đông") == {b["id"]}
    assert ids(date=day2) == {b["id"]}
    assert ids(from_time="19:00") == {b["id"]}                           # kèo phải bắt đầu từ 19:00
    assert ids(to_time="21:00") == {a["id"]}                             # kèo phải kết thúc trước 21:00
    assert ids(skill="1") == {a["id"]} and ids(skill="5") == {b["id"]}   # trình độ nằm trong khoảng Min-Max
    assert ids(skill="Giỏi") == {b["id"]}
    assert ids(max_price="50000") == {a["id"]}
    assert client.get("/api/courts", params={"date": "hôm nay"}).status_code == 400


# ---------------------------------------------------------------- UC-01 / FR-05 / FR-08: ghép sân, duyệt, bảo mật số điện thoại
def test_booking_approve_flow_and_phone_privacy(client):
    host_token, host = new_host(client)
    player_token, player = register(client, "player")
    court = create_court(client, host_token, tong_slot=3)

    r = join(client, player_token, court["id"], loi_nhan="Cho mình xin 1 chỗ")
    assert r.status_code == 200, r.text
    assert r.json()["trang_thai"] == "pending" and r.json()["slot_con_lai"] == 2
    booking_id = r.json()["booking_id"]
    assert get_court(client, court["id"])["slot_trong"] == 2                                  # slot được giữ ngay

    # Host thấy yêu cầu kèm hồ sơ; số điện thoại người chơi chưa lộ
    reqs = client.get(f"/api/courts/{court['id']}/requests", headers=auth(host_token)).json()["data"]
    assert len(reqs) == 1 and reqs[0]["player"]["id"] == player["id"] and reqs[0]["player"]["phone"] is None
    assert reqs[0]["loi_nhan"] == "Cho mình xin 1 chỗ" and "nhan_uy_tin" in reqs[0]["player"]
    # Người chơi chưa thấy số điện thoại chủ nhóm
    assert get_court(client, court["id"], player_token)["host_phone"] is None
    mine = client.get("/api/my-bookings", headers=auth(player_token)).json()["danh_sach"][0]
    assert mine["trang_thai"] == "pending" and mine["host_phone"] is None

    # Chỉ chủ kèo mới được duyệt
    assert client.post(f"/api/bookings/{booking_id}/approve", headers=auth(player_token)).status_code == 403
    r = client.post(f"/api/bookings/{booking_id}/approve", headers=auth(host_token))
    assert r.status_code == 200 and r.json()["request"]["player"]["phone"] == player["phone"]
    assert client.post(f"/api/bookings/{booking_id}/approve", headers=auth(host_token)).status_code == 409   # đã xử lý

    # Sau khi duyệt: lộ số điện thoại hai chiều
    assert get_court(client, court["id"], player_token)["host_phone"] == host["phone"]
    mine = client.get("/api/my-bookings", headers=auth(player_token)).json()["danh_sach"][0]
    assert mine["trang_thai"] == "approved" and mine["host_phone"] == host["phone"]
    # Khách vãng lai không bao giờ thấy số điện thoại
    assert get_court(client, court["id"])["host_phone"] is None

    notes = client.get("/api/notifications", headers=auth(player_token)).json()
    assert any(n["loai"] == "approved" for n in notes["data"]) and notes["unread"] >= 1


def test_reject_restores_slot_and_refunds_deposit(client):
    host_token, _ = new_host(client)
    player_token, _ = register(client)
    court = create_court(client, host_token, tong_slot=2, gia_thue=60000, tien_coc=20000)

    assert join(client, player_token, court["id"]).status_code == 400            # kèo có cọc mà chưa chọn phương thức
    r = join(client, player_token, court["id"], phuong_thuc="momo")
    assert r.status_code == 200 and r.json()["thanh_toan"]["so_tien"] == 20000 and r.json()["thanh_toan"]["trang_thai"] == "paid"
    assert get_court(client, court["id"])["slot_trong"] == 1

    r = client.post(f"/api/bookings/{r.json()['booking_id']}/reject", json={"ly_do": "Đủ người"}, headers=auth(host_token))
    assert r.status_code == 200
    assert get_court(client, court["id"])["slot_trong"] == 2                       # trả lại slot
    mine = client.get("/api/my-bookings", headers=auth(player_token)).json()["danh_sach"][0]
    assert mine["trang_thai"] == "rejected" and mine["thanh_toan"]["trang_thai"] == "refunded"
    assert join(client, player_token, court["id"], phuong_thuc="momo").status_code == 409    # bị từ chối thì không xin lại


def test_player_cancel_restores_slot_and_refunds(client):
    host_token, _ = new_host(client)
    player_token, _ = register(client)
    court = create_court(client, host_token, tong_slot=2, tien_coc=10000)
    bid = join(client, player_token, court["id"], phuong_thuc="bank").json()["booking_id"]
    assert get_court(client, court["id"])["slot_trong"] == 1
    r = client.delete(f"/api/bookings/{bid}", headers=auth(player_token))
    assert r.status_code == 200 and "hoàn" in r.json()["thong_bao"]
    assert get_court(client, court["id"])["slot_trong"] == 2
    mine = client.get("/api/my-bookings", headers=auth(player_token)).json()["danh_sach"][0]
    assert mine["trang_thai"] == "cancelled" and mine["thanh_toan"]["trang_thai"] == "refunded"
    assert client.delete(f"/api/bookings/{bid}", headers=auth(player_token)).status_code == 400   # hủy 2 lần
    assert join(client, player_token, court["id"], phuong_thuc="bank").status_code == 200          # hủy rồi thì xin lại được


def test_booking_rules(client):
    host_token, _ = new_host(client)
    player_token, _ = register(client)
    other_token, _ = register(client)
    court = create_court(client, host_token, tong_slot=2)
    assert join(client, host_token, court["id"]).status_code == 400                  # chủ kèo không tự xin vào kèo của mình
    assert join(client, player_token, 99999).status_code == 404
    assert join(client, player_token, court["id"], so_luong_slot=0).status_code == 400
    assert join(client, player_token, court["id"]).status_code == 200
    assert join(client, player_token, court["id"]).status_code == 409                # không gửi trùng
    assert join(client, other_token, court["id"], so_luong_slot=2).status_code == 409   # chỉ còn 1 chỗ
    assert client.post("/api/bookings", json={"court_id": court["id"]}).status_code == 401   # phải đăng nhập
    admin = admin_token(client)
    assert join(client, admin, court["id"]).status_code == 403                       # admin không ghép sân


def test_level_mismatch_is_flagged_but_allowed(client):
    host_token, _ = new_host(client)
    player_token, _ = register(client, level=1)
    court = create_court(client, host_token, trinh_min=4, trinh_max=5)
    r = join(client, player_token, court["id"])
    assert r.status_code == 200 and r.json()["lech_trinh_do"] is True
    req = client.get(f"/api/courts/{court['id']}/requests", headers=auth(host_token)).json()["data"][0]
    assert req["lech_trinh_do"] is True


# ---------------------------------------------------------------- NFR-03: chống overbooking
def test_no_overbooking_under_concurrency(client):
    """12 người cùng xin 3 slot cuối: đúng 3 người thành công, 9 người nhận 'Đã kín chỗ', slot không bao giờ âm."""
    host_token, _ = new_host(client)
    court = create_court(client, host_token, tong_slot=3)
    players = [register(client)[1]["id"] for _ in range(12)]
    results, barrier = [], threading.Barrier(len(players))

    def worker(uid):
        with SessionLocal() as db:
            user = db.query(models.User).filter(models.User.id == uid).first()
            barrier.wait()
            try:
                services.create_booking(db, user, court["id"], 1, None, None)
                results.append("ok")
            except HTTPException as e:
                results.append(e.status_code)

    threads = [threading.Thread(target=worker, args=(uid,)) for uid in players]
    [t.start() for t in threads]
    [t.join() for t in threads]

    assert results.count("ok") == 3, results
    assert results.count(409) == 9, results
    after = get_court(client, court["id"])
    assert after["slot_trong"] == 0 and after["trang_thai_hien_thi"] == "full"
    reqs = client.get(f"/api/courts/{court['id']}/requests", headers=auth(host_token)).json()["data"]
    assert len(reqs) == 3


# ---------------------------------------------------------------- FR-06: sửa / đóng / hủy kèo
def test_close_reopen_and_cancel_court(client):
    host_token, _ = new_host(client)
    player_token, _ = register(client)
    court = create_court(client, host_token, tong_slot=3, tien_coc=10000)

    closed = client.post(f"/api/courts/{court['id']}/close", headers=auth(host_token)).json()
    assert closed["trang_thai_hien_thi"] == "full" and closed["slot_trong"] == 3          # đóng kèo: hiển thị "Đã đủ người"
    assert join(client, player_token, court["id"], phuong_thuc="momo").status_code == 409
    assert client.post(f"/api/courts/{court['id']}/close", headers=auth(player_token)).status_code == 403
    assert client.post(f"/api/courts/{court['id']}/reopen", headers=auth(host_token)).json()["trang_thai_hien_thi"] == "open"

    bid = join(client, player_token, court["id"], phuong_thuc="momo").json()["booking_id"]
    assert client.post(f"/api/courts/{court['id']}/cancel", json={"ly_do": "Sân bảo trì"}, headers=auth(host_token)).status_code == 200
    mine = next(b for b in client.get("/api/my-bookings", headers=auth(player_token)).json()["danh_sach"] if b["ma_don_hang"] == bid)
    assert mine["trang_thai"] == "cancelled" and mine["thanh_toan"]["trang_thai"] == "refunded"
    notes = client.get("/api/notifications", headers=auth(player_token)).json()["data"]
    assert any(n["loai"] == "court_cancelled" for n in notes)
    assert join(client, register(client)[0], court["id"], phuong_thuc="momo").status_code == 400   # kèo đã hủy


def test_edit_court_rules(client):
    host_token, _ = new_host(client)
    player_token, _ = register(client)
    court = create_court(client, host_token, tong_slot=4)
    join(client, player_token, court["id"])                                           # đã có 1 người giữ chỗ

    body = court_payload(ten_san="Tên mới", tong_slot=6, gia_thue=70000, ngay_choi=court["ngay_choi"])
    r = client.put(f"/api/courts/{court['id']}", json=body, headers=auth(host_token))
    assert r.status_code == 200, r.text
    assert r.json()["ten_san"] == "Tên mới" and r.json()["tong_slot"] == 6 and r.json()["slot_trong"] == 5   # +2 slot, vẫn giữ chỗ người đã đăng ký

    r = client.put(f"/api/courts/{court['id']}", json={**body, "tong_slot": 0}, headers=auth(host_token))
    assert r.status_code == 400
    assert client.put(f"/api/courts/{court['id']}", json=body, headers=auth(player_token)).status_code == 403
    notes = client.get("/api/notifications", headers=auth(player_token)).json()["data"]
    assert any(n["loai"] == "court_updated" for n in notes)                         # người giữ chỗ được báo khi kèo thay đổi


def test_edit_blocked_within_two_hours(client):
    soon = rules.now_vn() + timedelta(minutes=45)
    if soon.hour >= 22 or soon.date() != rules.now_vn().date():
        pytest.skip("Bài test này cần khung giờ trong cùng ngày")
    host_token, _ = new_host(client)
    body = court_payload(ngay_choi=soon.date().isoformat(), gio_bat_dau=soon.strftime("%H:%M"),
                         gio_ket_thuc=(soon + timedelta(hours=1)).strftime("%H:%M"))
    court = client.post("/api/courts", json=body, headers=auth(host_token)).json()
    r = client.put(f"/api/courts/{court['id']}", json=body, headers=auth(host_token))
    assert r.status_code == 400 and "2 tiếng" in r.json()["detail"]                 # FR-06


# ---------------------------------------------------------------- FR-10 / FR-11: đánh giá chéo và điểm uy tín
def make_finished_match(host_id, player_id):
    start = rules.now_vn() - timedelta(days=1)
    start = start.replace(hour=19, minute=0, second=0, microsecond=0)
    cid = insert_court_direct(host_id, start, start + timedelta(hours=2), slots=4, taken=1)
    return cid, insert_booking_direct(player_id, cid, "approved")


def test_cross_review_and_reputation(client):
    host_token, host = new_host(client)
    p_tokens = [register(client) for _ in range(3)]
    for token, user in p_tokens:
        _, bid = make_finished_match(host["id"], user["id"])
        # người chơi chấm chủ nhóm
        tasks = client.get("/api/reviews/pending", headers=auth(token)).json()["data"]
        task = next(t for t in tasks if t["booking_id"] == bid)
        assert task["loai"] == "player_to_host" and len(task["tieu_chi"]) == 3
        assert client.post("/api/reviews", json={"booking_id": bid, "chat_luong_san": 5}, headers=auth(token)).status_code == 400   # thiếu tiêu chí
        r = client.post("/api/reviews", json={"booking_id": bid, "chat_luong_san": 5, "nhiet_tinh": 5, "minh_bach_chi_phi": 4},
                        headers=auth(token))
        assert r.status_code == 200 and r.json()["diem"] == 4.67
        assert client.post("/api/reviews", json={"booking_id": bid, "chat_luong_san": 5, "nhiet_tinh": 5, "minh_bach_chi_phi": 4},
                           headers=auth(token)).status_code == 409                    # mỗi lượt chỉ đánh giá 1 lần
        # chủ nhóm chấm người chơi
        assert client.post("/api/reviews", json={"booking_id": bid, "thai_do": 5, "trinh_do_thuc_te": 5, "binh_luan": "Tốt"},
                           headers=auth(host_token)).status_code == 200

    me = client.get("/api/users/me", headers=auth(host_token)).json()
    assert me["so_danh_gia"] == 3 and me["diem_uy_tin"] == 4.67
    assert me["nhan_uy_tin"] == "trusted" and me["nhan_uy_tin_text"] == "Uy tín"          # FR-11


def test_no_show_marks_player_with_warning(client):
    host_token, host = new_host(client)
    player_token, player = register(client)
    for _ in range(2):
        _, bid = make_finished_match(host["id"], player["id"])
        r = client.post("/api/reviews", json={"booking_id": bid, "bung_keo": True}, headers=auth(host_token))
        assert r.status_code == 200 and r.json()["diem"] == 1.0
    prof = client.get(f"/api/users/{player['id']}", headers=auth(host_token)).json()
    assert prof["so_bung_keo"] == 2 and prof["nhan_uy_tin"] == "warning"
    assert "bùng kèo" in prof["nhan_uy_tin_text"]
    # người bị báo bùng kèo vẫn không thể tự đánh dấu bùng kèo cho host (cờ bị bỏ qua) nhưng phải chấm đủ tiêu chí
    _, bid = make_finished_match(host["id"], player["id"])
    assert client.post("/api/reviews", json={"booking_id": bid, "bung_keo": True}, headers=auth(player_token)).status_code == 400


def test_review_locked_until_match_ends_and_only_for_participants(client):
    host_token, host = new_host(client)
    player_token, player = register(client)
    stranger_token, _ = register(client)
    court = create_court(client, host_token)
    bid = insert_booking_direct(player["id"], court["id"], "approved")
    body = {"booking_id": bid, "chat_luong_san": 5, "nhiet_tinh": 5, "minh_bach_chi_phi": 5}
    r = client.post("/api/reviews", json=body, headers=auth(player_token))
    assert r.status_code == 400 and "kết thúc" in r.json()["detail"]                 # chưa hết trận thì bị khóa
    _, finished_bid = make_finished_match(host["id"], player["id"])
    body["booking_id"] = finished_bid
    assert client.post("/api/reviews", json=body, headers=auth(stranger_token)).status_code == 403


# ---------------------------------------------------------------- Thông báo, nhắc nhở
def test_host_is_notified_of_new_request(client):
    host_token, _ = new_host(client)
    player_token, _ = register(client)
    court = create_court(client, host_token)
    join(client, player_token, court["id"])
    data = client.get("/api/notifications", headers=auth(host_token)).json()
    note = next(n for n in data["data"] if n["loai"] == "request")
    assert data["unread"] >= 1 and note["court_id"] == court["id"]
    assert client.post(f"/api/notifications/{note['id']}/read", headers=auth(host_token)).status_code == 200
    assert client.post("/api/notifications/read-all", headers=auth(host_token)).status_code == 200
    assert client.get("/api/notifications", headers=auth(host_token)).json()["unread"] == 0


def test_scheduler_sends_reminder_once(client):
    start = rules.now_vn() + timedelta(minutes=60)
    if start.date() != (start + timedelta(hours=1)).date():
        pytest.skip("Bài test này cần khung giờ trong cùng ngày")
    host_token, host = new_host(client)
    player_token, player = register(client)
    cid = insert_court_direct(host["id"], start, start + timedelta(hours=1))
    insert_booking_direct(player["id"], cid, "approved")
    with SessionLocal() as db:
        first = services.run_scheduled_jobs(db)
    with SessionLocal() as db:
        second = services.run_scheduled_jobs(db)
    assert first["reminded"] >= 2 and second["reminded"] == 0                          # nhắc cho người chơi + chủ nhóm, đúng 1 lần
    notes = client.get("/api/notifications", headers=auth(player_token)).json()["data"]
    assert sum(1 for n in notes if n["loai"] == "reminder") == 1


def test_finished_match_unlocks_review_prompt(client):
    host_token, host = new_host(client)
    player_token, player = register(client)
    make_finished_match(host["id"], player["id"])
    with SessionLocal() as db:
        services.run_scheduled_jobs(db)
    assert any(n["loai"] == "review" for n in client.get("/api/notifications", headers=auth(player_token)).json()["data"])
    assert any(n["loai"] == "review" for n in client.get("/api/notifications", headers=auth(host_token)).json()["data"])


# ---------------------------------------------------------------- Quản trị viên, báo cáo vi phạm
def test_admin_lock_and_unlock_user(client):
    admin = admin_token(client)
    token, user = register(client)
    assert client.get("/api/admin/stats", headers=auth(token)).status_code == 403     # người thường không vào được trang quản trị
    r = client.post(f"/api/admin/users/{user['id']}/lock", json={"ly_do": "Bùng kèo nhiều lần"}, headers=auth(admin))
    assert r.status_code == 200 and r.json()["user"]["is_active"] is False
    assert client.get("/api/users/me", headers=auth(token)).status_code == 403         # token cũ cũng bị chặn
    r = client.post("/api/login", data={"username": user["username"], "password": "secret1"})
    assert r.status_code == 403 and "Bùng kèo" in r.json()["detail"]
    assert client.post(f"/api/admin/users/{user['id']}/unlock", headers=auth(admin)).status_code == 200
    assert client.get("/api/users/me", headers=auth(token)).status_code == 200


def test_cannot_lock_admin(client):
    admin = admin_token(client)
    me = client.get("/api/users/me", headers=auth(admin)).json()
    assert client.post(f"/api/admin/users/{me['id']}/lock", headers=auth(admin)).status_code == 400


def test_report_and_resolution_flow(client):
    admin = admin_token(client)
    reporter_token, _ = register(client)
    host_token, host = new_host(client)
    court = create_court(client, host_token)

    assert client.post("/api/reports", json={"target_user_id": host["id"], "ly_do": "khong_co"}, headers=auth(reporter_token)).status_code == 400
    r = client.post("/api/reports", json={"court_id": court["id"], "ly_do": "lua_dao", "mo_ta": "Yêu cầu chuyển khoản trước"},
                    headers=auth(reporter_token))
    assert r.status_code == 200, r.text
    report_id = r.json()["id"]
    assert client.post("/api/reports", json={"court_id": court["id"], "ly_do": "lua_dao"}, headers=auth(reporter_token)).status_code == 409   # báo trùng
    assert client.post("/api/reports", json={"target_user_id": host["id"], "ly_do": "khac"}, headers=auth(host_token)).status_code == 400   # tự báo cáo mình

    listing = client.get("/api/admin/reports", headers=auth(admin)).json()["data"]
    assert any(x["id"] == report_id and x["target_user"]["id"] == host["id"] for x in listing)
    r = client.post(f"/api/admin/reports/{report_id}/resolve",
                    json={"quyet_dinh": "resolved", "ghi_chu_admin": "Đã xác minh", "khoa_nguoi_bi_bao_cao": True, "huy_keo": True},
                    headers=auth(admin))
    assert r.status_code == 200 and set(r.json()["hanh_dong"]) == {"hủy kèo", "khóa tài khoản"}
    assert get_court(client, court["id"])["trang_thai_hien_thi"] == "cancelled"
    assert client.get("/api/users/me", headers=auth(host_token)).status_code == 403
    assert client.post(f"/api/admin/reports/{report_id}/resolve", json={"quyet_dinh": "dismissed"}, headers=auth(admin)).status_code == 409
    assert any(n["loai"] == "report_result" for n in client.get("/api/notifications", headers=auth(reporter_token)).json()["data"])


def test_player_can_request_host_role_and_admin_verifies(client):
    admin = admin_token(client)
    token, user = register(client, "player")
    r = client.post("/api/users/me/request-host", headers=auth(token))
    assert r.status_code == 200 and r.json()["user"]["role"] == "host" and r.json()["user"]["host_verified"] is False
    assert client.post("/api/courts", json=court_payload(), headers=auth(token)).status_code == 403
    assert client.post(f"/api/admin/users/{user['id']}/verify-host", headers=auth(admin)).status_code == 200
    assert client.post("/api/courts", json=court_payload(), headers=auth(token)).status_code == 200
    stats = client.get("/api/admin/stats", headers=auth(admin)).json()
    assert stats["nguoi_dung"]["tong"] >= 2 and "tien_coc_dang_giu" in stats


# ---------------------------------------------------------------- Chống dò mật khẩu, quên / đổi mật khẩu
def test_login_rate_limit_blocks_after_five_failures(client):
    token, user = register(client)
    for _ in range(5):
        assert client.post("/api/login", data={"username": user["username"], "password": "sai"}).status_code == 400
    r = client.post("/api/login", data={"username": user["username"], "password": "sai"})
    assert r.status_code == 429 and "phút" in r.json()["detail"]
    # đang bị khóa thì đúng mật khẩu cũng chưa vào được; tài khoản khác không bị ảnh hưởng
    assert client.post("/api/login", data={"username": user["username"], "password": "secret1"}).status_code == 429
    other_token, other = register(client)
    assert client.post("/api/login", data={"username": other["username"], "password": "secret1"}).status_code == 200


def test_forgot_and_reset_password_flow(client):
    _, user = register(client)
    r = client.post("/api/auth/forgot-password", json={"identifier": user["username"]})
    assert r.status_code == 200 and len(r.json()["otp_demo"]) == 6
    otp = r.json()["otp_demo"]
    assert client.post("/api/auth/forgot-password", json={"identifier": user["username"]}).status_code == 429   # xin mã quá nhanh
    wrong = "000000" if otp != "000000" else "111111"
    body = {"username": user["username"], "otp": otp, "new_password": "matkhaumoi"}
    assert client.post("/api/auth/reset-password", json={**body, "new_password": "123"}).status_code == 400    # mật khẩu quá ngắn
    assert client.post("/api/auth/reset-password", json={**body, "otp": wrong}).status_code == 400             # OTP sai
    assert client.post("/api/auth/reset-password", json=body).status_code == 200
    assert client.post("/api/auth/reset-password", json=body).status_code == 400                               # OTP chỉ dùng một lần
    assert client.post("/api/login", data={"username": user["username"], "password": "matkhaumoi"}).status_code == 200
    assert client.post("/api/login", data={"username": user["username"], "password": "secret1"}).status_code == 400


def test_forgot_password_edge_cases(client):
    assert client.post("/api/auth/forgot-password", json={"identifier": "khong_ton_tai_123"}).status_code == 404
    n = next(_counter)
    client.post("/api/register", json={"username": f"chua_otp{n}", "password": "secret1", "phone": f"08{n:08d}"})
    r = client.post("/api/auth/forgot-password", json={"identifier": f"chua_otp{n}"})
    assert r.status_code == 400 and "kích hoạt" in r.json()["detail"]          # chưa xác thực OTP đăng ký
    admin = admin_token(client)
    token, user = register(client)
    client.post(f"/api/admin/users/{user['id']}/lock", json={"ly_do": "test"}, headers=auth(admin))
    assert client.post("/api/auth/forgot-password", json={"identifier": user["username"]}).status_code == 403


def test_change_password(client):
    token, user = register(client)
    url = "/api/users/me/change-password"
    assert client.post(url, json={"old_password": "sai", "new_password": "matkhaumoi"}, headers=auth(token)).status_code == 400
    assert client.post(url, json={"old_password": "secret1", "new_password": "123"}, headers=auth(token)).status_code == 400
    assert client.post(url, json={"old_password": "secret1", "new_password": "secret1"}, headers=auth(token)).status_code == 400
    assert client.post(url, json={"old_password": "secret1", "new_password": "matkhaumoi"}).status_code == 401    # phải đăng nhập
    assert client.post(url, json={"old_password": "secret1", "new_password": "matkhaumoi"}, headers=auth(token)).status_code == 200
    assert client.post("/api/login", data={"username": user["username"], "password": "matkhaumoi"}).status_code == 200
