from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from .vietqr import build_vietqr_payload, generate_qr_base64
from datetime import timedelta

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

from bookings.models import Booking
from bookings.views import has_booking_session_access
from hotels.permissions import (
    get_accessible_hotels,
    has_hotel_access,
)

from .models import Payment


REVIEW_HOURS = 24


@require_POST
def report_paid(request, code):
    """Khách báo đã chuyển khoản hoặc thanh toán tại quầy."""

    with transaction.atomic():
        booking = get_object_or_404(
            Booking.objects.select_for_update().select_related("hotel"),
            code=code,
        )

        if not has_booking_session_access(request, booking.code):
            messages.error(
                request,
                "Bạn cần tra cứu đơn đặt phòng trước khi báo thanh toán.",
            )
            return redirect("lookup")

        if booking.status != Booking.PENDING or not booking.is_holding:
            messages.error(
                request,
                "Đơn này không còn ở trạng thái chờ thanh toán.",
            )
            return redirect("booking_detail", code=code)

        if booking.payments.filter(
            status__in=[Payment.PENDING, Payment.CONFIRMED]
        ).exists():
            messages.warning(
                request,
                "Đơn này đã có giao dịch đang chờ hoặc đã được xác nhận.",
            )
            return redirect("booking_detail", code=code)

        method = request.POST.get("method", Payment.TRANSFER)

        if method not in (Payment.TRANSFER, Payment.CASH):
            method = Payment.TRANSFER

        hotel = booking.hotel

        if method == Payment.TRANSFER and not all([
            hotel.bank_bin,
            hotel.bank_account_number,
            hotel.bank_account_name,
        ]):
            messages.error(
                request,
                "Cơ sở chưa cấu hình đầy đủ thông tin nhận chuyển khoản.",
            )
            return redirect("payment_qr", code=code)

        payment = Payment.objects.create(
            booking=booking,
            amount=booking.total_amount,
            method=method,
            status=Payment.PENDING,
            bank_name=hotel.bank_name if method == Payment.TRANSFER else "",
            bank_bin=hotel.bank_bin if method == Payment.TRANSFER else "",
            bank_account_number=(
                hotel.bank_account_number if method == Payment.TRANSFER else ""
            ),
            bank_account_name=(
                hotel.bank_account_name if method == Payment.TRANSFER else ""
            ),
            transfer_content=booking.code if method == Payment.TRANSFER else "",
            reported_at=timezone.now(),
        )

        # Tạo thời hạn 24 giờ để cơ sở kiểm tra giao dịch.
        booking.hold_expires_at = (
            timezone.now() + timedelta(hours=REVIEW_HOURS)
        )
        booking.save(update_fields=["hold_expires_at"])

    # Gửi email sau khi transaction đã hoàn tất.
    if booking.guest.email:
        send_mail(
            subject=f"Đã ghi nhận thanh toán - {booking.code}",
            message=(
                f"Xin chào {booking.guest.full_name},\n\n"
                f"Cơ sở {booking.hotel.name} đã ghi nhận thông tin "
                f"thanh toán cho đơn {booking.code}.\n"
                f"Số tiền: {payment.amount:,} VNĐ.\n"
                "Đơn đang chờ cơ sở kiểm tra và xác nhận.\n"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[booking.guest.email],
            fail_silently=True,
        )

    messages.success(
        request,
        "Đã ghi nhận thông tin thanh toán. Cơ sở sẽ kiểm tra và xác nhận.",
    )
    return redirect("booking_detail", code=code)

@login_required
@require_POST
def reject_payment(request, pk):
    """OWNER và MANAGER được từ chối giao dịch, STAFF không được phép."""

    accessible_hotels = get_accessible_hotels(request.user)
    reason = request.POST.get("reason", "").strip()

    if not reason:
        messages.error(request, "Vui lòng nhập lý do từ chối.")
        return redirect("manage_bookings")

    with transaction.atomic():
        payment_info = get_object_or_404(
            Payment.objects.filter(
                booking__hotel__in=accessible_hotels
            ).values("booking_id"),
            pk=pk,
        )

        booking = get_object_or_404(
            Booking.objects.select_for_update().select_related(
                "hotel", "guest"
            ),
            pk=payment_info["booking_id"],
            hotel__in=accessible_hotels,
        )

        if not has_hotel_access(
            request.user,
            booking.hotel,
            allowed_roles=["OWNER", "MANAGER"],
        ):
            messages.error(
                request,
                "Bạn không có quyền xử lý thanh toán tại cơ sở này.",
            )
            return redirect("manage_bookings")

        payment = get_object_or_404(
            Payment.objects.select_for_update(),
            pk=pk,
            booking=booking,
        )

        if payment.status != Payment.PENDING:
            messages.error(request, "Giao dịch này đã được xử lý.")

        elif booking.status != Booking.PENDING:
            messages.error(request, "Đơn đặt phòng không còn chờ thanh toán.")

        else:
            now = timezone.now()

            payment.status = Payment.REJECTED
            payment.rejected_by = request.user
            payment.rejected_at = now
            payment.rejection_reason = reason

            payment.save(update_fields=[
                "status",
                "rejected_by",
                "rejected_at",
                "rejection_reason",
            ])

            # Cho khách cơ hội xử lý lại trong 24 giờ.
            booking.hold_expires_at = now + timedelta(hours=REVIEW_HOURS)
            booking.save(update_fields=["hold_expires_at"])

            messages.success(
                request,
                f"Đã từ chối giao dịch của đơn {booking.code}.",
            )

            guest_email = booking.guest.email
            guest_name = booking.guest.full_name
            booking_code = booking.code
            hotel_name = booking.hotel.name
            payment_amount = payment.amount

            # Gửi email sau transaction ở phần bên dưới.
            email_data = (
                guest_email,
                guest_name,
                booking_code,
                hotel_name,
                payment_amount,
                reason,
            )

    if email_data[0]:
        send_mail(
            subject=f"Thông tin thanh toán cần kiểm tra - {email_data[2]}",
            message=(
                f"Xin chào {email_data[1]},\n\n"
                f"Cơ sở {email_data[3]} chưa thể xác nhận thanh toán "
                f"cho đơn {email_data[2]}.\n"
                f"Số tiền: {email_data[4]:,} VNĐ.\n"
                f"Lý do: {email_data[5]}\n\n"
                "Vui lòng kiểm tra lại thông tin chuyển khoản và liên hệ "
                "cơ sở nếu cần hỗ trợ."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email_data[0]],
            fail_silently=True,
        )

    return redirect("manage_bookings")


@login_required
@require_POST
def confirm_payment(request, pk):
    """
    OWNER và MANAGER được xác nhận thanh toán.
    STAFF không được phép xác nhận.

    Thứ tự khóa thống nhất:
    1. Booking
    2. Payment
    """

    accessible_hotels = get_accessible_hotels(request.user)

    with transaction.atomic():

        # Bước 1: Lấy booking_id để biết đơn cần khóa.
        payment_info = get_object_or_404(
            Payment.objects.filter(
                booking__hotel__in=accessible_hotels
            ).values("booking_id"),
            pk=pk
        )

        # Bước 2: Khóa Booking trước.
        booking = get_object_or_404(
            Booking.objects.select_for_update().select_related(
                "hotel", "guest"
            ),
            pk=payment_info["booking_id"],
            hotel__in=accessible_hotels
        )

        # Bước 3: Kiểm tra quyền.
        if not has_hotel_access(
            request.user,
            booking.hotel,
            allowed_roles=["OWNER", "MANAGER"]
        ):
            messages.error(
                request,
                "Bạn không có quyền xác nhận thanh toán tại cơ sở này."
            )
            return redirect("manage_bookings")

        # Bước 4: Khóa Payment sau Booking.
        payment = get_object_or_404(
            Payment.objects.select_for_update(),
            pk=pk,
            booking=booking
        )

        if payment.status != Payment.PENDING:
            messages.error(
                request,
                "Giao dịch này đã được xử lý."
            )

        elif booking.status != Booking.PENDING:
            messages.error(
                request,
                "Đơn không còn ở trạng thái chờ thanh toán."
            )

        elif not booking.is_holding:
            messages.error(
                request,
                "Đơn đã hết hạn giữ chỗ hoặc không còn hợp lệ. "
                "Hãy kiểm tra lại với khách."
            )

        else:
            now = timezone.now()

            # Cập nhật Payment.
            payment.status = Payment.CONFIRMED
            payment.confirmed_by = request.user
            payment.confirmed_at = now

            payment.save(
                update_fields=[
                    "status",
                    "confirmed_by",
                    "confirmed_at"
                ]
            )

            # Cập nhật Booking.
            booking.status = Booking.CONFIRMED
            booking.hold_expires_at = None

            booking.save(
                update_fields=[
                    "status",
                    "hold_expires_at"
                ]
            )

            messages.success(
                request,
                f"Đã xác nhận thanh toán cho đơn {booking.code}."
            )

            # Gửi email sau khi database commit thành công.
            if booking.guest.email:

                guest_email = booking.guest.email
                guest_name = booking.guest.full_name
                booking_code = booking.code
                hotel_name = booking.hotel.name
                payment_amount = payment.amount

                transaction.on_commit(
                    lambda: send_mail(
                        subject=f"Thanh toán thành công - {booking_code}",

                        message=(
                            f"Xin chào {guest_name},\n\n"
                            f"Thanh toán cho đơn đặt phòng "
                            f"{booking_code} tại {hotel_name} "
                            f"đã được xác nhận thành công.\n\n"
                            f"Số tiền: {payment_amount:,} VNĐ.\n\n"
                            "Đơn đặt phòng của bạn đã được xác nhận.\n"
                            "Cảm ơn bạn đã sử dụng dịch vụ!"
                        ),

                        from_email=settings.DEFAULT_FROM_EMAIL,

                        recipient_list=[guest_email],

                        fail_silently=True,
                    )
                )

    return redirect("manage_bookings")


def payment_qr(request, code):
    """Hiển thị QR chuyển khoản cho khách đã có quyền xem đơn."""

    booking = get_object_or_404(
        Booking.objects.select_related("hotel", "guest"),
        code=code,
    )

    if not has_booking_session_access(request, booking.code):
        messages.error(
            request,
            "Bạn cần tra cứu đơn đặt phòng trước khi xem mã QR.",
        )
        return redirect("lookup")

    if booking.status != Booking.PENDING or not booking.is_holding:
        messages.error(
            request,
            "Đơn đặt phòng không còn trong thời gian giữ chỗ.",
        )
        return redirect("booking_detail", code=code)

    hotel = booking.hotel

    if not all([
        hotel.bank_bin,
        hotel.bank_account_number,
        hotel.bank_account_name,
    ]):
        messages.error(
            request,
            "Cơ sở chưa cấu hình đầy đủ thông tin nhận chuyển khoản.",
        )
        return redirect("booking_detail", code=code)

    transfer_content = booking.code

    try:
        payload = build_vietqr_payload(
            bank_bin=hotel.bank_bin,
            account_number=hotel.bank_account_number,
            account_name=hotel.bank_account_name,
            amount=booking.total_amount,
            transfer_content=transfer_content,
        )

        qr_base64 = generate_qr_base64(payload)

    except (ValueError, ImportError) as exc:
        messages.error(request, f"Không thể tạo mã QR: {exc}")
        return redirect("booking_detail", code=code)

    return render(
        request,
        "payments/payment_qr.html",
        {
            "booking": booking,
            "hotel": hotel,
            "qr_base64": qr_base64,
            "transfer_content": transfer_content,
        },
    )