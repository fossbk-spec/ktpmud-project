
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.http import require_POST

from hotels.permissions import (
    get_accessible_hotels,
    has_hotel_access,
)
from hotels.models import Hotel, Room, RoomType

from .forms import GuestForm, LookupForm, SearchForm
from .models import Booking, BookingRoom
from .services import (
    RoomUnavailable,
    BookingValidationError,
    availability,
    create_booking,
)


def grant_booking_session_access(request, booking_code):
    """Ghi nhận các đơn khách đã xác minh trong session."""

    codes = request.session.get(
        "authorized_booking_codes",
        []
    )

    if not isinstance(codes, list):
        codes = []

    if booking_code not in codes:
        codes.append(booking_code)

    request.session["authorized_booking_codes"] = codes[-20:]
    request.session.modified = True


def has_booking_session_access(request, booking_code):
    """Kiểm tra khách đã xác minh đơn trong session chưa."""

    codes = request.session.get(
        "authorized_booking_codes",
        []
    )

    return (
        isinstance(codes, list)
        and booking_code in codes
    )


def has_staff_booking_access(user, booking):
    """Kiểm tra tài khoản có quyền truy cập cơ sở chứa đơn."""

    if not user.is_authenticated or not user.is_active:
        return False

    return get_accessible_hotels(user).filter(
        pk=booking.hotel_id
    ).exists()


def search_availability(request, slug):
    """Tìm phòng trống theo ngày và số khách."""

    hotel = get_object_or_404(
        Hotel,
        slug=slug,
        is_booking_open=True,
    )

    form = SearchForm(request.GET)
    results = []
    context = {}

    if form.is_valid():
        ci = form.cleaned_data["check_in"]
        co = form.cleaned_data["check_out"]
        guests = form.cleaned_data["guests"]

        nights = (co - ci).days

        room_types = hotel.room_types.filter(
            is_active=True,
            capacity__gte=guests,
        )

        for room_type in room_types:
            free, held = availability(
                room_type,
                ci,
                co,
            )

            results.append({
                "room_type": room_type,
                "free": free,
                "held": held,
                "total": nights * room_type.base_price,
            })

        context = {
            "nights": nights,
            "check_in": ci,
            "check_out": co,
            "guests": guests,
        }

    return render(
        request,
        "bookings/availability.html",
        {
            "hotel": hotel,
            "form": form,
            "results": results,
            **context,
        },
    )


def book(request, slug):
    """Form nhập thông tin khách và tạo đơn."""

    hotel = get_object_or_404(
        Hotel,
        slug=slug,
        is_booking_open=True,
    )

    data = (
        request.POST
        if request.method == "POST"
        else request.GET
    )

    search = SearchForm(data)

    if not search.is_valid():
        messages.error(
            request,
            "Ngày hoặc số khách không hợp lệ, vui lòng chọn lại."
        )
        return redirect("hotel_detail", slug=slug)

    ci = search.cleaned_data["check_in"]
    co = search.cleaned_data["check_out"]
    guests = search.cleaned_data["guests"]

    room_type = get_object_or_404(
        RoomType,
        pk=data.get("room_type"),
        hotel=hotel,
        is_active=True,
    )

    if guests > room_type.capacity:
        messages.error(
            request,
            "Số khách vượt quá sức chứa của loại phòng."
        )

        url = reverse("availability", args=[slug])

        return redirect(
            f"{url}?check_in={ci}&check_out={co}&guests={guests}"
        )

    if request.method == "POST":
        guest_form = GuestForm(request.POST)

        if guest_form.is_valid():
            try:
                booking = create_booking(
                    hotel=hotel,
                    room_type=room_type,
                    check_in=ci,
                    check_out=co,
                    num_guests=guests,
                    guest_data=guest_form.cleaned_data,
                )

            except RoomUnavailable:
                messages.error(
                    request,
                    "Phòng vừa được đặt, vui lòng chọn phòng khác."
                )

                url = reverse(
                    "availability",
                    args=[slug],
                )

                return redirect(
                    f"{url}?check_in={ci}&check_out={co}&guests={guests}"
                )

            except BookingValidationError as exc:
                messages.error(request, str(exc))
                return redirect("hotel_detail", slug=slug)

            grant_booking_session_access(
                request,
                booking.code,
            )

            return redirect(
                "booking_detail",
                code=booking.code,
            )

    else:
        guest_form = GuestForm()

    nights = (co - ci).days

    return render(
        request,
        "bookings/book.html",
        {
            "hotel": hotel,
            "room_type": room_type,
            "guest_form": guest_form,
            "check_in": ci,
            "check_out": co,
            "guests": guests,
            "nights": nights,
            "total": nights * room_type.base_price,
        },
    )


def booking_detail(request, code):
    """Khách đã xác minh hoặc nhân viên có quyền mới được xem đơn."""

    booking = get_object_or_404(
        Booking.objects.select_related("hotel", "guest"),
        code=code,
    )

    guest_access = has_booking_session_access(
        request,
        booking.code,
    )

    staff_access = has_staff_booking_access(
        request.user,
        booking,
    )

    if not guest_access and not staff_access:
        messages.error(
            request,
            "Bạn cần tra cứu đơn bằng mã đặt phòng và số điện thoại."
        )
        return redirect("lookup")

    return render(
        request,
        "bookings/booking_detail.html",
        {
            "booking": booking,
            "booking_rooms": booking.booking_rooms.select_related(
                "room__room_type"
            ),
            "payments": booking.payments.all(),
        },
    )


def lookup(request):
    """Khách tra cứu đơn bằng mã và số điện thoại."""

    form = LookupForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
        booking = Booking.objects.filter(
            code=form.cleaned_data["code"].strip().upper(),
            guest__phone=form.cleaned_data["phone"].strip(),
        ).first()

        if booking:
            grant_booking_session_access(
                request,
                booking.code,
            )

            return redirect(
                "booking_detail",
                code=booking.code,
            )

        messages.error(
            request,
            "Không tìm thấy đơn với mã và số điện thoại này."
        )

    return render(
        request,
        "bookings/lookup.html",
        {"form": form},
    )


@require_POST
def cancel(request, code):
    """Khách đã xác minh hoặc nhân viên tại cơ sở được hủy đơn."""

    with transaction.atomic():
        booking = get_object_or_404(
            Booking.objects.select_for_update(),
            code=code,
        )

        guest_access = has_booking_session_access(
            request,
            booking.code,
        )

        staff_access = has_staff_booking_access(
            request.user,
            booking,
        )

        if not guest_access and not staff_access:
            messages.error(
                request,
                "Bạn không có quyền hủy đơn này."
            )
            return redirect("lookup")

        if booking.status not in (
            Booking.PENDING,
            Booking.CONFIRMED,
        ):
            messages.error(
                request,
                "Đơn này không thể hủy."
            )
            return redirect(
                "booking_detail",
                code=booking.code,
            )

        booking.status = Booking.CANCELLED
        booking.cancelled_at = timezone.now()

        booking.save(
            update_fields=[
                "status",
                "cancelled_at",
            ]
        )

        booking.booking_rooms.filter(
            is_active=True
        ).update(
            is_active=False
        )

    messages.success(
        request,
        "Đã hủy đơn đặt phòng."
    )

    return redirect(
        "booking_detail",
        code=booking.code,
    )


# ----------------------------- Khu vực nhân viên -----------------------------


@login_required
def manage_bookings(request):
    """Danh sách đơn thuộc các cơ sở người dùng được quyền quản lý."""

    accessible_hotels = get_accessible_hotels(request.user)

    base_bookings = (
        Booking.objects.filter(
            hotel__in=accessible_hotels
        )
        .select_related("hotel", "guest")
        .prefetch_related(
            "payments",
            "booking_rooms__room",
        )
    )

    search_code = request.GET.get("code", "").strip().upper()
    highlighted_booking = None

    # Tìm chính xác mã đơn trong phạm vi cơ sở được phép truy cập.
    if search_code:
        highlighted_booking = base_bookings.filter(
            code__iexact=search_code
        ).first()

    # Nếu tìm thấy, đưa đơn đó lên đầu danh sách.
    if highlighted_booking:
        other_bookings = (
            base_bookings
            .exclude(pk=highlighted_booking.pk)
            .order_by("-created_at")[:99]
        )

        bookings = [highlighted_booking, *other_bookings]
    else:
        bookings = list(
            base_bookings.order_by("-created_at")[:100]
        )

    return render(
        request,
        "bookings/manage_list.html",
        {
            "bookings": bookings,
            "search_code": search_code,
            "highlighted_booking_id": (
                highlighted_booking.pk
                if highlighted_booking
                else None
            ),
        },
    )


@login_required
@require_POST
def check_in(request, pk):
    """OWNER, MANAGER và STAFF có quyền tại cơ sở được check-in."""

    with transaction.atomic():
        booking = get_object_or_404(
            Booking.objects.select_for_update(),
            pk=pk,
            hotel__in=get_accessible_hotels(request.user),
        )

        if not has_hotel_access(
            request.user,
            booking.hotel,
            allowed_roles=["OWNER", "MANAGER", "STAFF"],
        ):
            messages.error(
                request,
                "Bạn không có quyền thao tác tại cơ sở này."
            )
            return redirect("manage_bookings")

        if booking.status != Booking.CONFIRMED:
            messages.error(
                request,
                "Chỉ check-in được đơn đã xác nhận."
            )
            return redirect("manage_bookings")

        if booking.check_in_date > timezone.localdate():
            messages.error(
                request,
                "Chưa đến ngày nhận phòng của đơn này."
            )
            return redirect("manage_bookings")

        booking_rooms = list(
            BookingRoom.objects.select_for_update()
            .filter(
                booking=booking,
                is_active=True,
                room__room_type__hotel_id=booking.hotel_id,
            )
            .select_related("room")
        )

        if not booking_rooms:
            messages.error(
                request,
                "Đơn không có phòng còn hiệu lực để nhận."
            )
            return redirect("manage_bookings")

        room_ids = [br.room_id for br in booking_rooms]

        rooms = {
            room.pk: room
            for room in Room.objects.select_for_update().filter(
                pk__in=room_ids
            )
        }

        if len(rooms) != len(room_ids):
            messages.error(
                request,
                "Không tìm thấy đầy đủ phòng thuộc đơn."
            )
            return redirect("manage_bookings")

        if any(
            rooms[br.room_id].status in (
                Room.CLEANING,
                Room.MAINTENANCE,
            )
            for br in booking_rooms
        ):
            messages.error(
                request,
                "Có phòng đang dọn hoặc bảo trì, không thể check-in."
            )
            return redirect("manage_bookings")

        now = timezone.now()

        for br in booking_rooms:
            br.checked_in_at = now
            br.save(update_fields=["checked_in_at"])

            room = rooms[br.room_id]
            room.status = Room.OCCUPIED
            room.save(update_fields=["status"])

        booking.status = Booking.CHECKED_IN
        booking.save(update_fields=["status"])

    messages.success(
        request,
        f"Đã check-in đơn {booking.code}."
    )

    return redirect("manage_bookings")


@login_required
@require_POST
def check_out(request, pk):
    """OWNER, MANAGER và STAFF có quyền tại cơ sở được check-out."""

    with transaction.atomic():
        booking = get_object_or_404(
            Booking.objects.select_for_update(),
            pk=pk,
            hotel__in=get_accessible_hotels(request.user),
        )

        if not has_hotel_access(
            request.user,
            booking.hotel,
            allowed_roles=["OWNER", "MANAGER", "STAFF"],
        ):
            messages.error(
                request,
                "Bạn không có quyền thao tác tại cơ sở này."
            )
            return redirect("manage_bookings")

        if booking.status != Booking.CHECKED_IN:
            messages.error(
                request,
                "Chỉ check-out được đơn đã nhận phòng."
            )
            return redirect("manage_bookings")

        booking_rooms = list(
            BookingRoom.objects.select_for_update()
            .filter(
                booking=booking,
                is_active=True,
                room__room_type__hotel_id=booking.hotel_id,
            )
            .select_related("room")
        )

        if not booking_rooms:
            messages.error(
                request,
                "Không tìm thấy phòng còn hiệu lực của đơn."
            )
            return redirect("manage_bookings")

        room_ids = [br.room_id for br in booking_rooms]

        rooms = {
            room.pk: room
            for room in Room.objects.select_for_update().filter(
                pk__in=room_ids
            )
        }

        if len(rooms) != len(room_ids):
            messages.error(
                request,
                "Không tìm thấy đầy đủ phòng thuộc đơn."
            )
            return redirect("manage_bookings")

        now = timezone.now()

        for br in booking_rooms:
            br.checked_out_at = now
            br.is_active = False

            br.save(
                update_fields=[
                    "checked_out_at",
                    "is_active",
                ]
            )

            room = rooms[br.room_id]
            room.status = Room.CLEANING
            room.save(update_fields=["status"])

        booking.status = Booking.CHECKED_OUT
        booking.save(update_fields=["status"])

    messages.success(
        request,
        f'Đã check-out đơn {booking.code}; phòng chuyển sang "Đang dọn".'
    )

    return redirect("manage_bookings")
