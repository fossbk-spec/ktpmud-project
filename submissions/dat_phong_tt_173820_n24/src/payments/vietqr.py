
import base64
from io import BytesIO


def crc16_ccitt(data):
    """Tính CRC16-CCITT-FALSE."""
    crc = 0xFFFF

    for byte in data.encode("utf-8"):
        crc ^= byte << 8

        for _ in range(8):
            if crc & 0x8000:
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF
            else:
                crc = (crc << 1) & 0xFFFF

    return f"{crc:04X}"


def tlv(tag, value):
    """Tạo trường EMVCo theo định dạng ID + Length + Value."""
    value = str(value)
    length = len(value.encode("utf-8"))

    if length > 99:
        raise ValueError(f"Trường {tag} vượt quá 99 byte.")

    return f"{tag}{length:02d}{value}"


def build_vietqr_payload(
    bank_bin,
    account_number,
    account_name,
    amount,
    transfer_content,
):
    """Tạo nội dung VietQR chuyển khoản theo cấu trúc NAPAS."""

    bank_bin = str(bank_bin).strip()
    account_number = str(account_number).strip()
    account_name = str(account_name).strip()
    transfer_content = str(transfer_content).strip()

    if not bank_bin or not account_number or not account_name:
        raise ValueError("Thiếu thông tin tài khoản ngân hàng.")

    if not bank_bin.isdigit() or len(bank_bin) != 6:
        raise ValueError("Mã BIN ngân hàng phải gồm 6 chữ số.")

    if not account_number or len(account_number) > 19:
        raise ValueError("Số tài khoản không hợp lệ.")

    if not str(amount).isdigit() or int(amount) <= 0:
        raise ValueError("Số tiền thanh toán không hợp lệ.")

    if not transfer_content or len(transfer_content.encode("utf-8")) > 25:
        raise ValueError("Nội dung chuyển khoản không hợp lệ.")

    # Bước 1: Thông tin ngân hàng và tài khoản thụ hưởng.
    beneficiary = (
        tlv("00", bank_bin)
        + tlv("01", account_number)
    )

    # Bước 2: Cấu trúc tài khoản theo chuẩn NAPAS.
    merchant_account = (
        tlv("00", "A000000727")
        + tlv("01", beneficiary)
        + tlv("02", "QRIBFTTA")
    )

    # Bước 3: Tạo payload VietQR.
    payload = (
        tlv("00", "01")
        + tlv("01", "12")
        + tlv("38", merchant_account)
        + tlv("53", "704")
        + tlv("54", int(amount))
        + tlv("58", "VN")
        + tlv("62", tlv("08", transfer_content))
        + "6304"
    )

    # Bước 4: Tính CRC.
    payload += crc16_ccitt(payload)

    return payload


def generate_qr_base64(payload):
    """Tạo ảnh QR PNG và chuyển thành chuỗi Base64."""

    import qrcode

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )

    qr.add_data(payload)
    qr.make(fit=True)

    image = qr.make_image(
        fill_color="black",
        back_color="white",
    )

    buffer = BytesIO()
    image.save(buffer, format="PNG")

    return base64.b64encode(buffer.getvalue()).decode("ascii")
