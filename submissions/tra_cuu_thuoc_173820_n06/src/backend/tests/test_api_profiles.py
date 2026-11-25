"""Kiểm thử API hồ sơ bằng FastAPI TestClient trên CSDL tạm (cần fastapi, sqlalchemy, httpx)."""
import importlib
import sys

import pytest

pytest.importorskip("fastapi")
pytest.importorskip("sqlalchemy")
pytest.importorskip("httpx")


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("SQLITE_DB_PATH", str(tmp_path / "test.db"))
    monkeypatch.delenv("REQUIRE_EXISTING_DB", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    for name in [m for m in sys.modules if m in ("main",) or m.startswith(("database", "api."))]:
        del sys.modules[name]
    from fastapi.testclient import TestClient

    main = importlib.import_module("main")
    return TestClient(main.app)


def test_profile_lifecycle(client):
    created = client.post("/api/v1/profiles", json={"name": "Bố"})
    assert created.status_code == 201
    pid = created.json()["id"]

    assert [p["name"] for p in client.get("/api/v1/profiles").json()] == ["Bố"]
    assert client.get(f"/api/v1/profiles/{pid}").json()["prescriptions"] == []

    check = client.get(f"/api/v1/profiles/{pid}/interaction-check", params={"explain": "false"}).json()
    assert check["status"] == "not_enough_prescriptions"

    assert client.delete(f"/api/v1/profiles/{pid}").json()["success"] is True
    assert client.get(f"/api/v1/profiles/{pid}").status_code == 404


def test_scan_with_unknown_profile_is_rejected(client):
    response = client.post(
        "/api/v1/ocr/scan",
        files={"file": ("a.jpg", b"\xff\xd8fake", "image/jpeg")},
        data={"profile_id": "999"},
    )
    assert response.status_code == 404
