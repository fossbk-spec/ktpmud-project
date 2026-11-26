
from django.conf import settings
from django.db import models


class OwnerAccount(models.Model):
    """
    Hồ sơ chủ cơ sở và trạng thái xét duyệt.

    owner_number:
        Số định danh do hệ thống cấp sau khi Admin duyệt.

    referral_suffix:
        Phần hậu tố do chủ cơ sở tùy chỉnh.

    referral_code:
        Mã giới thiệu đầy đủ, ví dụ OWNER_1_HOTEL.
    """

    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    REJECTED = "REJECTED"
    LOCKED = "LOCKED"

    STATUS_CHOICES = [
        (PENDING, "Chờ duyệt"),
        (ACTIVE, "Đã kích hoạt"),
        (REJECTED, "Bị từ chối"),
        (LOCKED, "Đã khóa"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owner_account",
        verbose_name="Tài khoản",
    )

    status = models.CharField(
        "Trạng thái",
        max_length=20,
        choices=STATUS_CHOICES,
        default=PENDING,
    )

    # Số chủ cơ sở do hệ thống cấp, không cho chủ tự thay đổi.
    owner_number = models.PositiveIntegerField(
        "Mã số chủ cơ sở",
        unique=True,
        null=True,
        blank=True,
    )

    # Hậu tố do chủ cơ sở tùy chỉnh.
    referral_suffix = models.CharField(
        "Hậu tố mã giới thiệu",
        max_length=40,
        blank=True,
    )

    # Mã giới thiệu đầy đủ, được hệ thống tạo.
    referral_code = models.CharField(
        "Mã giới thiệu",
        max_length=100,
        unique=True,
        null=True,
        blank=True,
    )

    reason = models.TextField(
        "Lý do xử lý",
        blank=True,
    )

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_owner_accounts",
        verbose_name="Admin xét duyệt",
    )

    reviewed_at = models.DateTimeField(
        "Thời gian xét duyệt",
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        "Ngày đăng ký",
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        "Ngày cập nhật",
        auto_now=True,
    )

    class Meta:
        verbose_name = "Tài khoản chủ cơ sở"
        verbose_name_plural = "Tài khoản chủ cơ sở"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.get_status_display()}"



class OwnerReferral(models.Model):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

    STATUS_CHOICES = [
        (PENDING, "Chờ duyệt"),
        (APPROVED, "Đã duyệt"),
        (REJECTED, "Đã từ chối"),
    ]

    owner = models.ForeignKey(
        OwnerAccount,
        on_delete=models.PROTECT,
        related_name="referrals"
    )

    referred_user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owner_referral"
    )

    referral_code_used = models.CharField(max_length=100)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=PENDING
    )

    reviewed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.referred_user.username} - "
            f"{self.owner.user.username} - {self.status}"
        )


class AdminAuditLog(models.Model):
    """
    Nhật ký các thao tác quản trị hệ thống.
    """

    ACTION_CHOICES = [
        ("APPROVE_OWNER", "Duyệt chủ cơ sở"),
        ("REJECT_OWNER", "Từ chối chủ cơ sở"),
        ("LOCK_OWNER", "Khóa chủ cơ sở"),
        ("UNLOCK_OWNER", "Mở khóa chủ cơ sở"),
        ("PRIVATE_ACCESS", "Yêu cầu truy cập dữ liệu riêng tư"),
        ("CHANGE_REFERRAL_CODE", "Thay đổi mã giới thiệu"),
        ("CHANGE_EMAIL", "Thay đổi email"),
        ("CHANGE_PASSWORD", "Thay đổi mật khẩu"),
        ("ASSIGN_REFERRAL_USER", "Phân công nhân viên được giới thiệu"),
    ]

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="admin_audit_actions",
        verbose_name="Người thực hiện",
    )

    action = models.CharField(
        "Hành động",
        max_length=40,
        choices=ACTION_CHOICES,
    )

    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admin_audit_targets",
        verbose_name="Tài khoản liên quan",
    )

    reason = models.TextField(
        "Lý do",
    )

    ip_address = models.GenericIPAddressField(
        "Địa chỉ IP",
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        "Thời gian",
        auto_now_add=True,
    )

    class Meta:
        verbose_name = "Nhật ký quản trị"
        verbose_name_plural = "Nhật ký quản trị"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_action_display()} - {self.created_at}"
