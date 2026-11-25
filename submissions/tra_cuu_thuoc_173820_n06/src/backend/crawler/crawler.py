
import argparse
import json
import os
import re
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse, urlunparse

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from crawler.parser import parse_drug_page, post_process_drug


BASE_URL = "https://thuocbietduoc.com.vn"
LIST_URL = f"{BASE_URL}/thuoc/drgsearch.aspx"

BACKEND_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BACKEND_DIR / "data" / "raw"

OUTPUT_FILE = DATA_DIR / "drugs.json"
URL_FILE = DATA_DIR / "drug_urls.txt"
STATE_FILE = DATA_DIR / "crawl_state.json"
ERROR_FILE = DATA_DIR / "crawl_errors.json"

BATCH_SIZE = 25
WRITE_RETRIES = 5


def now_string():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def create_session():
    session = requests.Session()

    retry = Retry(
        total=4,
        connect=4,
        read=3,
        backoff_factor=2,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset({"GET"}),
        respect_retry_after_header=True,
    )

    adapter = HTTPAdapter(
        max_retries=retry,
        pool_connections=10,
        pool_maxsize=10,
    )

    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 Chrome/131.0 Safari/537.36"
        )
    })

    return session


def safe_write_text(path, content):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)

    temp_path = path.with_name(
        f"{path.name}.{os.getpid()}.{time.time_ns()}.tmp"
    )

    try:
        with open(temp_path, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
            f.flush()
            os.fsync(f.fileno())

        last_error = None

        for attempt in range(WRITE_RETRIES):
            try:
                os.replace(temp_path, path)
                return
            except PermissionError as exc:
                last_error = exc
                time.sleep(0.5 * (attempt + 1))

        raise PermissionError(
            f"Không thể thay {path} bằng file tạm. "
            "Hãy kiểm tra file có đang bị chương trình khác khóa không."
        ) from last_error

    finally:
        try:
            if temp_path.exists():
                temp_path.unlink()
        except OSError:
            pass


def atomic_write_json(path, data):
    content = json.dumps(
        data,
        ensure_ascii=False,
        indent=2,
    )
    safe_write_text(path, content)


def load_json(path, default):
    path = Path(path)

    if not path.exists():
        return default

    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as exc:
        raise RuntimeError(
            f"Không đọc được JSON {path}: {exc}"
        ) from exc


def create_backup(path):
    path = Path(path)

    if not path.exists():
        return

    backup = path.with_name(f"{path.stem}.backup{path.suffix}")

    if backup.exists():
        return

    safe_write_text(backup, path.read_text(encoding="utf-8"))


def canonical_drug_url(href):
    if not href:
        return None

    url = urljoin(BASE_URL, href)
    parsed = urlparse(url)

    if parsed.netloc.lower() not in {
        "thuocbietduoc.com.vn",
        "www.thuocbietduoc.com.vn",
    }:
        return None

    if not re.fullmatch(
        r"/thuoc-\d+/[^/]+\.aspx",
        parsed.path,
        flags=re.I,
    ):
        return None

    return urlunparse((
        "https",
        "thuocbietduoc.com.vn",
        parsed.path,
        "",
        "",
        "",
    ))


def get_drug_urls(html):
    soup = BeautifulSoup(html, "html.parser")
    urls = []

    for link in soup.find_all("a", href=True):
        url = canonical_drug_url(link["href"])

        if url:
            urls.append(url)

    return list(dict.fromkeys(urls))


def fetch_page(session, url):
    response = session.get(url, timeout=(15, 45))
    response.raise_for_status()

    if not response.encoding or response.encoding.lower() == "iso-8859-1":
        response.encoding = response.apparent_encoding or "utf-8"

    return response.text


def list_page_url(page_number):
    if page_number <= 1:
        return LIST_URL

    return f"{LIST_URL}?page={page_number}"


def load_lines(path):
    path = Path(path)

    if not path.exists():
        return []

    return [
        line.strip()
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]


def save_urls(urls):
    safe_write_text(URL_FILE, "\n".join(urls) + ("\n" if urls else ""))


def load_records():
    records = load_json(OUTPUT_FILE, [])

    if not isinstance(records, list):
        raise RuntimeError(
            f"{OUTPUT_FILE} phải chứa một JSON array."
        )

    return records


def load_errors():
    errors = load_json(ERROR_FILE, [])

    if isinstance(errors, dict):
        errors = list(errors.values())

    if not isinstance(errors, list):
        raise RuntimeError(
            f"{ERROR_FILE} phải chứa một JSON array."
        )

    return {
        item["url"]: item
        for item in errors
        if isinstance(item, dict) and item.get("url")
    }


def save_errors(errors):
    ordered = sorted(
        errors.values(),
        key=lambda item: item.get("url", ""),
    )
    atomic_write_json(ERROR_FILE, ordered)


def load_state(urls, existing_records):
    state = load_json(STATE_FILE, None)

    if isinstance(state, dict) and isinstance(
        state.get("completed_urls"), list
    ):
        return set(state["completed_urls"])

    # Chỉ dùng cách suy luận cũ nếu checkpoint chưa tồn tại.
    # Không dùng khi checkpoint hiện tại đã có.
    completed = set(urls[:min(len(urls), len(existing_records))])

    save_state(completed)
    return completed


def save_state(completed):
    atomic_write_json(
        STATE_FILE,
        {"completed_urls": sorted(completed)},
    )


def discover_urls(session, target, delay, max_pages=None):
    urls = load_lines(URL_FILE)
    urls = list(dict.fromkeys(
        url for url in (canonical_drug_url(u) for u in urls) if url
    ))

    if len(urls) >= target:
        print(f"Đã có {len(urls)} URL; không cần khám phá thêm.")
        return urls

    seen = set(urls)
    page_number = max(1, len(urls) // 20 + 1)
    empty_pages = 0
    pages_scanned = 0
    last_signature = None

    print(f"Bắt đầu khám phá URL. Đã có {len(urls)}/{target} URL.")

    while len(urls) < target:
        if max_pages is not None and pages_scanned >= max_pages:
            print("Đã đạt giới hạn --max-pages.")
            break

        page_url = list_page_url(page_number)

        try:
            html = fetch_page(session, page_url)
        except Exception as exc:
            print(f"[LIST ERROR] Trang {page_number}: {exc}")
            break

        pages_scanned += 1
        page_urls = get_drug_urls(html)
        signature = tuple(page_urls)

        if signature and signature == last_signature:
            print("Phát hiện trang danh sách lặp; dừng khám phá.")
            break

        last_signature = signature
        added = 0

        for url in page_urls:
            if url in seen:
                continue

            seen.add(url)
            urls.append(url)
            added += 1

            if len(urls) >= target:
                break

        save_urls(urls)

        print(
            f"[LIST] Trang {page_number}: "
            f"+{added} URL | Tổng {len(urls)}/{target}"
        )

        if added == 0:
            empty_pages += 1
        else:
            empty_pages = 0

        if empty_pages >= 2:
            print("Hai trang liên tiếp không có URL mới; dừng khám phá.")
            break

        page_number += 1
        time.sleep(delay)

    save_urls(urls)
    print(f"Khám phá hoàn tất: {len(urls)} URL.")
    return urls


def flush_batch(records, completed, pending_completed, errors):
    if not pending_completed:
        return

    # Lưu dữ liệu trước, checkpoint sau.
    # Nếu lưu JSON thất bại thì không đánh dấu URL hoàn tất.
    atomic_write_json(OUTPUT_FILE, records)

    completed.update(pending_completed)
    save_state(completed)

    for url in pending_completed:
        errors.pop(url, None)

    save_errors(errors)
    pending_completed.clear()


def crawl_details(session, urls, delay, skip_errors=False):
    records = load_records()
    completed = load_state(urls, records)
    errors = load_errors()

    error_urls = set(errors)
    pending = [
        url for url in urls
        if url not in completed
        and not (skip_errors and url in error_urls)
    ]

    print(f"Bản ghi hiện có: {len(records)}")
    print(f"URL đã hoàn tất: {len(completed)}")
    print(f"URL lỗi đang lưu: {len(errors)}")
    print(f"URL sẽ xử lý: {len(pending)}")
    print(f"Bỏ qua URL lỗi: {'Có' if skip_errors else 'Không'}")

    pending_completed = []
    success_count = 0
    error_count = 0

    try:
        for index, url in enumerate(pending, 1):
            try:
                html = fetch_page(session, url)
                data = post_process_drug(parse_drug_page(html))

                drug = data.get("drug", {})

                if not isinstance(drug, dict) or not drug.get("name"):
                    raise ValueError("Parser không trả về tên thuốc hợp lệ.")

                # Giữ nguyên schema do parser tạo ra.
                records.append(data)
                pending_completed.append(url)
                success_count += 1

                print(
                    f"[OK] {index}/{len(pending)} "
                    f"{drug.get('name', '')}"
                )

                if len(pending_completed) >= BATCH_SIZE:
                    flush_batch(
                        records,
                        completed,
                        pending_completed,
                        errors,
                    )
                    print(f"[SAVE] Đã lưu {len(records)} bản ghi.")

            except Exception as exc:
                error_count += 1
                errors[url] = {
                    "url": url,
                    "error": str(exc),
                    "time": now_string(),
                }

                print(f"[ERROR] {url}: {exc}")
                save_errors(errors)

                # Không tiếp tục crawl nếu lỗi là ghi file.
                if isinstance(exc, (PermissionError, OSError)):
                    message = str(exc).lower()

                    if (
                        "drugs.json" in message
                        or "no space left" in message
                        or "winerror 5" in message
                        or getattr(exc, "winerror", None) == 5
                        or getattr(exc, "errno", None) == 28
                    ):
                        raise RuntimeError(
                            "Dừng crawl để bảo vệ dữ liệu do lỗi ghi file."
                        ) from exc

            time.sleep(delay)

    except Exception:
        # Lưu các bản ghi đã xử lý thành công trước đó nếu có.
        # Nếu thao tác ghi file thất bại, không cố ghi đè trực tiếp.
        if pending_completed:
            flush_batch(
                records,
                completed,
                pending_completed,
                errors,
            )
        raise

    flush_batch(
        records,
        completed,
        pending_completed,
        errors,
    )

    print("\n========== KẾT QUẢ ==========")
    print(f"URL trong danh sách: {len(urls)}")
    print(f"Bản ghi trong JSON: {len(records)}")
    print(f"URL hoàn tất: {len(completed)}")
    print(f"URL lỗi còn lại: {len(errors)}")
    print(f"Thành công trong lượt này: {success_count}")
    print(f"Lỗi trong lượt này: {error_count}")
    print(f"JSON: {OUTPUT_FILE}")
    print(f"Checkpoint: {STATE_FILE}")
    print(f"Lỗi: {ERROR_FILE}")


def main():
    parser = argparse.ArgumentParser(
        description="Thu thập dữ liệu thuốc từ ThuocBietDuoc."
    )

    parser.add_argument(
        "--target",
        type=int,
        default=100,
        help="Tổng số URL mục tiêu.",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.5,
        help="Thời gian nghỉ giữa các request, tối thiểu 1 giây.",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=None,
        help="Giới hạn số trang danh sách cần quét.",
    )
    parser.add_argument(
        "--discover-only",
        action="store_true",
        help="Chỉ khám phá và lưu URL, không crawl chi tiết.",
    )
    parser.add_argument(
        "--skip-errors",
        action="store_true",
        help="Bỏ qua URL đã có trong crawl_errors.json.",
    )

    args = parser.parse_args()

    if args.target < 1:
        parser.error("--target phải >= 1")

    if args.delay < 1.0:
        parser.error("--delay phải >= 1.0 giây")

    if args.max_pages is not None and args.max_pages < 1:
        parser.error("--max-pages phải >= 1")

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Chỉ tạo backup nếu chưa tồn tại.
    for path in (OUTPUT_FILE, STATE_FILE, URL_FILE, ERROR_FILE):
        create_backup(path)

    session = create_session()

    try:
        urls = discover_urls(
            session,
            target=args.target,
            delay=args.delay,
            max_pages=args.max_pages,
        )

        if not args.discover_only:
            crawl_details(
                session,
                urls,
                delay=args.delay,
                skip_errors=args.skip_errors,
            )
    finally:
        session.close()


if __name__ == "__main__":
    main()
