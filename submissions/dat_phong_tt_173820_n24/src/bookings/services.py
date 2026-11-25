
"""
Logic nghiệp vụ đặt phòng:
- Kiểm tra điều kiện đặt phòng.
- Tìm phòng trống.
- Giữ chỗ.
- Hết hạn giữ chỗ.

Mọi thao tác tạo booking phải đi qua create_booking().
"""
from datetime import timedelta
from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from hotels.models import Hotel, Room, RoomType

from .models import Booking, BookingRoom, Guest


class RoomUnavailable(Exception):
    pass
    """Không còn phòng trống trong khoảng ngày đã chọn."""


class BookingValidationError(Exception):
    pass
    """Dữ liệu hoặc điều kiện đặt phòng không hợp lệ."""


def blocking_booking_rooms(check_in, check_out):
    """
    Các phòng đang bị chiếm trong khoảng ngày:
    - Đã xác nhận.
    - Đã nhận phòng.
    - Đang chờ thanh toán và còn hạn giữ chỗ.
    """

    now = timezone.now()

    still_valid = (
        Q(booking__status__in=[
            Booking.CONFIRMED,
            Booking.CHECKED_IN,
        ])
        | Q(
            booking__status=Booking.PENDING,
            booking__hold_expires_at__gt=now,
        )
    )

    return BookingRoom.objects.filter(
        still_valid,
        is_active=True,
        check_in_date__lt=check_out,
        check_out_date__gt=check_in,
    )


def free_rooms(room_type, check_in, check_out):
    """
    Phòng không bị trùng lịch và không đang bảo trì/dọn dẹp.

    OCCUPIED không bị loại toàn bộ vì phòng đang có khách
    hôm nay vẫn có thể được đặt cho một ngày tương lai.
    """

    busy_ids = blocking_booking_rooms(
        check_in,
        check_out
    ).values_list("room_id", flat=True)

    return (
        Room.objects.filter(room_type=room_type)
        .exclude(
            status__in=[
                Room.MAINTENANCE,
                Room.CLEANING,
            ]
        )
        .exclude(pk__in=busy_ids)
        .order_by("room_code")
    )


def held_rooms_count(room_type, check_in, check_out):
    """Số phòng đang được giữ bởi đơn chờ thanh toán."""

    now = timezone.now()

    return (
        blocking_booking_rooms(check_in, check_out)
        .filter(
            room__room_type=room_type,
            booking__status=Booking.PENDING,
            booking__hold_expires_at__gt=now,
        )
        .values("room_id")
        .distinct()
        .count()
    )


def availability(room_type, check_in, check_out):
    """Trả về (số phòng trống, số phòng đang giữ chỗ)."""

    return (
        free_rooms(room_type, check_in, check_out).count(),
        held_rooms_count(room_type, check_in, check_out),
    )


@transaction.atomic
def create_booking(
    hotel,
    room_type,
    check_in,
    check_out,
    num_guests,
    guest_data,
    source=Booking.ONLINE,
    user=None,
):
    """
    Tạo đơn và giữ một phòng.

    Khóa các dòng phòng đủ điều kiện trước, sau đó kiểm tra
    lại lịch đặt trong transaction để giảm nguy cơ đặt trùng
    khi sử dụng PostgreSQL.
    """

    # Kiểm tra cơ sở.
    if not Hotel.objects.filter(
        pk=hotel.pk,
        is_booking_open=True,
    ).exists():
        raise BookingValidationError(
            "Cơ sở hiện không nhận đặt phòng."
        )

    # Kiểm tra loại phòng thuộc đúng cơ sở.
    if room_type.hotel_id != hotel.pk:
        raise BookingValidationError(
            "Loại phòng không thuộc cơ sở này."
        )

    if not room_type.is_active:
        raise BookingValidationError(
            "Loại phòng hiện không còn được kinh doanh."
        )

    # Kiểm tra ngày.
    today = timezone.localdate()

    if check_in < today:
        raise BookingValidationError(
            "Ngày nhận phòng không được ở quá khứ."
        )

    if check_out <= check_in:
        raise BookingValidationError(
            "Ngày trả phòng phải sau ngày nhận phòng."
        )

    # Kiểm tra sức chứa.
    if num_guests < 1 or num_guests > room_type.capacity:
        raise BookingValidationError(
            "Số khách vượt quá sức chứa của loại phòng."
        )

    # Kiểm tra nguồn đặt phòng.
    if source not in (Booking.ONLINE, Booking.COUNTER):
        raise BookingValidationError(
            "Nguồn đặt phòng không hợp lệ."
        )

    # Khóa các phòng không bảo trì/dọn dẹp thuộc loại phòng.
    # Không lọc theo lịch đặt ở bước khóa này.
    # Sau khi lấy khóa, truy vấn lịch đặt lại ở câu lệnh tiếp theo.
    candidate_ids = list(
        Room.objects.filter(room_type=room_type)
        .exclude(
            status__in=[
                Room.MAINTENANCE,
                Room.CLEANING,
            ]
        )
        .select_for_update()
        .order_by("room_code")
        .values_list("pk", flat=True)
    )

    if not candidate_ids:
        raise RoomUnavailable()

    # Kiểm tra lại lịch đặt sau khi đã lấy khóa.
    room = (
        free_rooms(room_type, check_in, check_out)
        .filter(pk__in=candidate_ids)
        .first()
    )

    if room is None:
        raise RoomUnavailable()

    nights = (check_out - check_in).days

    guest = Guest.objects.create(**guest_data)

    booking = Booking.objects.create(
        hotel=hotel,
        guest=guest,
        check_in_date=check_in,
        check_out_date=check_out,
        num_guests=num_guests,
        total_amount=nights * room_type.base_price,
        source=source,
        created_by=user,
        hold_expires_at=(
            timezone.now()
            + timezone.timedelta(
                minutes=settings.HOLD_MINUTES
            )
        ),
    )

    BookingRoom.objects.create(
        booking=booking,
        room=room,
        check_in_date=check_in,
        check_out_date=check_out,
        price_per_night=room_type.base_price,
    )

    return booking


@transaction.atomic
def expire_overdue_holds():
    """
    Hết hạn các đơn chờ thanh toán.

    Khóa booking trước, sau đó giải phóng BookingRoom
    và cập nhật trạng thái trong cùng transaction.
    """

    now = timezone.now()

    overdue_bookings = list(
        Booking.objects.select_for_update().filter(
            status=Booking.PENDING,
            hold_expires_at__lte=now,
        )
    )

    if not overdue_bookings:
        return 0

    booking_ids = [
        booking.pk for booking in overdue_bookings
    ]

    BookingRoom.objects.filter(
        booking_id__in=booking_ids,
        is_active=True,
    ).update(
        is_active=False
    )

    Booking.objects.filter(
        pk__in=booking_ids,
        status=Booking.PENDING,
    ).update(
        status=Booking.EXPIRED
    )

    return len(booking_ids)
