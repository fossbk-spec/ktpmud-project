import secrets
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

from hotels.models import Hotel, Room


class Guest(models.Model):
    """Thông tin khách đặt phòng."""
    full_name = models.CharField('Họ và tên', max_length=100)
    phone = models.CharField('Số điện thoại', max_length=20)
    email = models.EmailField('Email', blank=True)
    id_number = models.CharField('Số giấy tờ', max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Khách'
        verbose_name_plural = 'Khách'

    def __str__(self):
        return f'{self.full_name} ({self.phone})'


def new_booking_code():
    """Mã đặt phòng ngẫu nhiên, ví dụ BK7F3K9Q."""
    alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return 'BK' + ''.join(secrets.choice(alphabet) for _ in range(6))


class Booking(models.Model):
    PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED, EXPIRED = (
        'PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'EXPIRED')
    STATUS_CHOICES = [
        (PENDING, 'Chờ thanh toán (đang giữ chỗ)'),
        (CONFIRMED, 'Đã xác nhận'),
        (CHECKED_IN, 'Đã nhận phòng'),
        (CHECKED_OUT, 'Đã trả phòng'),
        (CANCELLED, 'Đã hủy'),
        (EXPIRED, 'Hết hạn giữ chỗ'),
    ]
    ONLINE, COUNTER = 'ONLINE', 'COUNTER'
    SOURCE_CHOICES = [(ONLINE, 'Đặt online'), (COUNTER, 'Đặt tại quầy')]

    code = models.CharField('Mã đặt phòng', max_length=12, unique=True, default=new_booking_code)
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='bookings', verbose_name='Cơ sở')
    guest = models.ForeignKey(Guest, on_delete=models.PROTECT, related_name='bookings', verbose_name='Khách')
    check_in_date = models.DateField('Ngày nhận phòng')
    check_out_date = models.DateField('Ngày trả phòng')
    num_guests = models.PositiveSmallIntegerField('Số khách', default=1)
    status = models.CharField('Trạng thái', max_length=20, choices=STATUS_CHOICES, default=PENDING)
    source = models.CharField('Nguồn', max_length=10, choices=SOURCE_CHOICES, default=ONLINE)
    total_amount = models.PositiveIntegerField('Tổng tiền (VNĐ)', default=0)
    hold_expires_at = models.DateTimeField('Hết hạn giữ chỗ lúc', null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                                   on_delete=models.SET_NULL, verbose_name='Nhân viên tạo')
    created_at = models.DateTimeField(auto_now_add=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Đơn đặt phòng'
        verbose_name_plural = 'Đơn đặt phòng'
        ordering = ['-created_at']

    def __str__(self):
        return self.code

    @property
    def nights(self):
        return (self.check_out_date - self.check_in_date).days

    @property
    def is_holding(self):
        """Đang giữ chỗ: chờ thanh toán và chưa quá hạn."""
        return (self.status == self.PENDING and self.hold_expires_at is not None
                and self.hold_expires_at > timezone.now())

    @property
    def seconds_left(self):
        if not self.is_holding:
            return 0
        return int((self.hold_expires_at - timezone.now()).total_seconds())

    def start_hold(self):
        self.hold_expires_at = timezone.now() + timedelta(minutes=settings.HOLD_MINUTES)


class BookingRoom(models.Model):
    """Phòng được gán cho đơn, theo khoảng ngày."""
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='booking_rooms')
    room = models.ForeignKey(Room, on_delete=models.PROTECT, related_name='booking_rooms')
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    price_per_night = models.PositiveIntegerField()
    is_active = models.BooleanField('Còn hiệu lực', default=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_out_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Phòng của đơn'
        verbose_name_plural = 'Phòng của đơn'

    def __str__(self):
        return f'{self.booking.code} – {self.room}'
