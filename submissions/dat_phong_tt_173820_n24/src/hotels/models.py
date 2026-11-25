from django.conf import settings
from django.db import models


class Hotel(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="hotels",
        verbose_name="Chủ cơ sở",
    )

    name = models.CharField("Tên cơ sở", max_length=150)
    slug = models.SlugField(
        "Tên đường dẫn",
        unique=True,
    )
    address = models.CharField("Địa chỉ", max_length=255)
    description = models.TextField("Mô tả", blank=True)

    check_in_time = models.TimeField(
        "Giờ nhận phòng",
        default="14:00",
    )
    check_out_time = models.TimeField(
        "Giờ trả phòng",
        default="12:00",
    )

    cancel_policy = models.TextField(
        "Chính sách hủy",
        blank=True,
    )
        # Thông tin tài khoản nhận thanh toán
    bank_info = models.TextField(
        "Thông tin nhận thanh toán",
        blank=True,
    )

    bank_name = models.CharField(
        "Tên ngân hàng",
        max_length=100,
        blank=True,
    )

    bank_bin = models.CharField(
        "Mã BIN ngân hàng",
        max_length=10,
        blank=True,
    )

    bank_account_number = models.CharField(
        "Số tài khoản ngân hàng",
        max_length=30,
        blank=True,
    )

    bank_account_name = models.CharField(
        "Tên chủ tài khoản",
        max_length=150,
        blank=True,
    )
    is_active = models.BooleanField(
        "Đang hoạt động",
        default=True,
    )
    is_booking_open = models.BooleanField(
        "Đang nhận đặt phòng",
        default=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Cơ sở"
        verbose_name_plural = "Cơ sở"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class RoomType(models.Model):
    hotel = models.ForeignKey(
        Hotel,
        on_delete=models.CASCADE,
        related_name="room_types",
        verbose_name="Cơ sở",
    )

    name = models.CharField("Tên loại phòng", max_length=100)
    capacity = models.PositiveSmallIntegerField(
        "Sức chứa (số khách)",
        default=2,
    )
    base_price = models.PositiveIntegerField(
        "Giá mỗi đêm (VNĐ)",
    )
    amenities = models.TextField("Tiện nghi", blank=True)
    image = models.ImageField(
        "Ảnh",
        upload_to="room_types/",
        blank=True,
    )
    is_active = models.BooleanField(
        "Còn bán",
        default=True,
    )

    class Meta:
        verbose_name = "Loại phòng"
        verbose_name_plural = "Loại phòng"
        ordering = ["name"]

    def __str__(self):
        return f"{self.hotel.name} – {self.name}"


class Room(models.Model):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    CLEANING = "CLEANING"
    MAINTENANCE = "MAINTENANCE"

    STATUS_CHOICES = [
        (AVAILABLE, "Sẵn sàng"),
        (OCCUPIED, "Đang sử dụng"),
        (CLEANING, "Đang dọn"),
        (MAINTENANCE, "Bảo trì"),
    ]

    room_type = models.ForeignKey(
        RoomType,
        on_delete=models.CASCADE,
        related_name="rooms",
        verbose_name="Loại phòng",
    )

    room_code = models.CharField(
        "Mã/số phòng",
        max_length=20,
    )
    floor = models.PositiveSmallIntegerField(
        "Tầng",
        null=True,
        blank=True,
    )
    status = models.CharField(
        "Tình trạng phòng",
        max_length=20,
        choices=STATUS_CHOICES,
        default=AVAILABLE,
    )
    note = models.CharField(
        "Ghi chú",
        max_length=255,
        blank=True,
    )
    is_active = models.BooleanField(
        "Đang kinh doanh",
        default=True,
    )

    class Meta:
        verbose_name = "Phòng"
        verbose_name_plural = "Phòng"
        ordering = ["room_code"]
        constraints = [
            models.UniqueConstraint(
                fields=["room_type", "room_code"],
                name="unique_room_code_per_room_type",
            )
        ]

    def __str__(self):
        return f"{self.room_code} ({self.room_type.name})"


class HotelMembership(models.Model):
    MANAGER = "MANAGER"
    STAFF = "STAFF"

    ROLE_CHOICES = [
        (MANAGER, "Quản lý"),
        (STAFF, "Nhân viên"),
    ]

    hotel = models.ForeignKey(
        Hotel,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="hotel_memberships",
    )
    role = models.CharField(
        "Vai trò",
        max_length=20,
        choices=ROLE_CHOICES,
    )
    is_active = models.BooleanField(
        "Đang hoạt động",
        default=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Nhân sự cơ sở"
        verbose_name_plural = "Nhân sự cơ sở"
        constraints = [
            models.UniqueConstraint(
                fields=["hotel", "user"],
                name="unique_hotel_membership",
            )
        ]

    def __str__(self):
        return f"{self.user.username} - {self.hotel.name} - {self.role}"