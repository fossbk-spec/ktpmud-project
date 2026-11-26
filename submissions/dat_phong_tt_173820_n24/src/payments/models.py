from django.conf import settings
from django.db import models

from bookings.models import Booking


class Payment(models.Model):
    """Giao dịch thanh toán của một đơn đặt phòng."""

    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"

    STATUS_CHOICES = [
        (PENDING, "Chờ xác nhận"),
        (CONFIRMED, "Đã xác nhận"),
        (REJECTED, "Bị từ chối"),
    ]

    TRANSFER = "TRANSFER"
    CASH = "CASH"

    METHOD_CHOICES = [
        (TRANSFER, "Chuyển khoản"),
        (CASH, "Tiền mặt tại quầy"),
    ]

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name="payments",
        verbose_name="Đơn đặt phòng",
    )

    amount = models.PositiveIntegerField("Số tiền (VNĐ)")

    method = models.CharField(
        "Hình thức thanh toán",
        max_length=20,
        choices=METHOD_CHOICES,
        default=TRANSFER,
    )

    status = models.CharField(
        "Trạng thái",
        max_length=20,
        choices=STATUS_CHOICES,
        default=PENDING,
    )

    # Bản chụp thông tin ngân hàng tại thời điểm giao dịch
    bank_name = models.CharField(max_length=100, blank=True)
    bank_bin = models.CharField(max_length=10, blank=True)
    bank_account_number = models.CharField(max_length=30, blank=True)
    bank_account_name = models.CharField(max_length=150, blank=True)
    transfer_content = models.CharField(max_length=100, blank=True)

    reported_at = models.DateTimeField(
        "Thời điểm khách báo đã thanh toán",
        null=True,
        blank=True,
    )

    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="confirmed_payments",
        verbose_name="Người xác nhận",
    )

    confirmed_at = models.DateTimeField(
        "Thời điểm xác nhận",
        null=True,
        blank=True,
    )

    rejected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="rejected_payments",
        verbose_name="Người từ chối",
    )

    rejected_at = models.DateTimeField(
        "Thời điểm từ chối",
        null=True,
        blank=True,
    )

    rejection_reason = models.TextField(
        "Lý do từ chối",
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Thanh toán"
        verbose_name_plural = "Thanh toán"
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.booking.code} – {self.amount} – "
            f"{self.get_status_display()}"
        )