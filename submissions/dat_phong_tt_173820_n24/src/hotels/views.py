from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db import transaction
from django.utils.text import slugify
from django.views.decorators.http import require_POST

from bookings.forms import SearchForm
from accounts.models import OwnerAccount

from .models import Hotel, RoomType, Room, HotelMembership
from .forms import (
    HotelCreateForm,
    RoomTypeForm,
    RoomForm,
    HotelMembershipForm,
    BulkRoomCreateForm,
    HotelBankSettingsForm,
)
from .permissions import get_accessible_hotels, has_hotel_access


@login_required
def home(request):
    # Chỉ Admin hệ thống được truy cập trang chủ /
    if not request.user.is_superuser:
        return redirect("dashboard")

    hotels = Hotel.objects.filter(
        is_active=True,
        is_booking_open=True,
    )

    return render(
        request,
        "hotels/home.html",
        {"hotels": hotels},
    )



def hotel_detail(request, slug):
    hotel = get_object_or_404(
        Hotel,
        slug=slug,
        is_active=True,
        is_booking_open=True,
    )

    room_types = hotel.room_types.filter(
        is_active=True,
    ).prefetch_related("rooms")

    return render(
        request,
        "hotels/hotel_detail.html",
        {
            "hotel": hotel,
            "room_types": room_types,
            "form": SearchForm(),
        },
    )


def _get_manageable_hotel(request, hotel_id):
    hotel = get_object_or_404(
        get_accessible_hotels(request.user),
        pk=hotel_id,
    )

    if not has_hotel_access(
        request.user,
        hotel,
        allowed_roles=["OWNER", "MANAGER"],
    ):
        messages.error(
            request,
            "Bạn không có quyền quản lý cơ sở này.",
        )
        return None

    return hotel


def _get_owner_hotel(request, hotel_id):
    hotel = get_object_or_404(
        get_accessible_hotels(request.user),
        pk=hotel_id,
    )

    if not has_hotel_access(
        request.user,
        hotel,
        allowed_roles=["OWNER"],
    ):
        messages.error(
            request,
            "Chỉ chủ cơ sở mới được thực hiện thao tác này.",
        )
        return None

    return hotel


@login_required
def dashboard(request):
    hotels = get_accessible_hotels(request.user)

    is_approved_owner = OwnerAccount.objects.filter(
        user=request.user,
        status=OwnerAccount.ACTIVE,
    ).exists()

    return render(
        request,
        "hotels/dashboard.html",
        {
            "hotels": hotels,
            "can_create_hotel": (
                is_approved_owner or request.user.is_superuser
            ),
        },
    )


@login_required
def hotel_create(request):
    is_approved_owner = OwnerAccount.objects.filter(
        user=request.user,
        status=OwnerAccount.ACTIVE,
    ).exists()

    if not is_approved_owner and not request.user.is_superuser:
        messages.error(
            request,
            "Tài khoản chủ cơ sở phải được Admin phê duyệt trước.",
        )
        return redirect("dashboard")

    if request.method == "POST":
        form = HotelCreateForm(request.POST)

        if form.is_valid():
            with transaction.atomic():
                hotel = form.save(commit=False)
                hotel.owner = request.user

                base_slug = slugify(hotel.name) or "co-so"
                slug = base_slug
                counter = 1

                while Hotel.objects.filter(slug=slug).exists():
                    slug = f"{base_slug}-{counter}"
                    counter += 1

                hotel.slug = slug
                hotel.is_active = True
                hotel.is_booking_open = True
                hotel.save()

            messages.success(
                request,
                "Tạo cơ sở thành công.",
            )
            return redirect("dashboard")
    else:
        form = HotelCreateForm()

    return render(
        request,
        "hotels/form.html",
        {
            "form": form,
            "page_title": "Thêm cơ sở mới",
            "cancel_url": "dashboard",
        },
    )


@login_required
def hotel_manage(request, hotel_id):
    hotel = _get_manageable_hotel(request, hotel_id)

    if hotel is None:
        return redirect("dashboard")

    room_types = hotel.room_types.all().prefetch_related("rooms")
    memberships = hotel.memberships.select_related("user").all()

    return render(
        request,
        "hotels/manage.html",
        {
            "hotel": hotel,
            "room_types": room_types,
            "memberships": memberships,
            "can_manage_staff": has_hotel_access(
                request.user,
                hotel,
                allowed_roles=["OWNER"],
            ),
        },
    )


@login_required
def hotel_update(request, hotel_id):
    hotel = _get_manageable_hotel(request, hotel_id)

    if hotel is None:
        return redirect("dashboard")

    if request.method == "POST":
        form = HotelCreateForm(
            request.POST,
            instance=hotel,
        )

        if form.is_valid():
            form.save()

            messages.success(
                request,
                "Cập nhật thông tin cơ sở thành công.",
            )
            return redirect(
                "hotel_manage",
                hotel_id=hotel.id,
            )
    else:
        form = HotelCreateForm(instance=hotel)

    return render(
        request,
        "hotels/form.html",
        {
            "form": form,
            "page_title": "Chỉnh sửa cơ sở",
            "cancel_url": "hotel_manage",
            "cancel_id": hotel.id,
        },
    )

@login_required
def hotel_bank_settings(request, hotel_id):
    # Chỉ OWNER của cơ sở được chỉnh sửa tài khoản ngân hàng.
    hotel = _get_owner_hotel(request, hotel_id)

    if hotel is None:
        return redirect("dashboard")

    if request.method == "POST":
        form = HotelBankSettingsForm(
            request.POST,
            instance=hotel,
        )

        if form.is_valid():
            form.save()

            messages.success(
                request,
                "Đã cập nhật thông tin tài khoản ngân hàng."
            )

            return redirect(
                "hotel_bank_settings",
                hotel_id=hotel.id,
            )
    else:
        form = HotelBankSettingsForm(instance=hotel)

    return render(
        request,
        "hotels/bank_settings.html",
        {
            "hotel": hotel,
            "form": form,
        },
    )

@login_required
@require_POST
def hotel_toggle_booking(request, hotel_id):
    hotel = _get_manageable_hotel(request, hotel_id)

    if hotel is None:
        return redirect("dashboard")

    if not hotel.is_active:
        messages.error(
            request,
            "Cơ sở đã ngừng hoạt động, không thể mở nhận đặt phòng.",
        )
        return redirect("hotel_manage", hotel_id=hotel.id)

    hotel.is_booking_open = not hotel.is_booking_open
    hotel.save(update_fields=["is_booking_open"])

    messages.success(
        request,
        "Đã cập nhật trạng thái nhận đặt phòng.",
    )

    return redirect(
        "hotel_manage",
        hotel_id=hotel.id,
    )


@login_required
@require_POST
def hotel_toggle_active(request, hotel_id):
    hotel = _get_owner_hotel(request, hotel_id)

    if hotel is None:
        return redirect("dashboard")

    hotel.is_active = not hotel.is_active

    if not hotel.is_active:
        hotel.is_booking_open = False

    hotel.save(
        update_fields=["is_active", "is_booking_open"]
    )

    messages.success(
        request,
        "Đã cập nhật trạng thái hoạt động của cơ sở.",
    )

    return redirect("dashboard")


@login_required
def room_type_create(request, hotel_id):
    hotel = _get_manageable_hotel(request, hotel_id)

    if hotel is None:
        return redirect("dashboard")

    if request.method == "POST":
        form = RoomTypeForm(
            request.POST,
            request.FILES,
        )

        if form.is_valid():
            room_type = form.save(commit=False)
            room_type.hotel = hotel
            room_type.save()

            messages.success(
                request,
                "Đã tạo loại phòng.",
            )
            return redirect(
                "hotel_manage",
                hotel_id=hotel.id,
            )
    else:
        form = RoomTypeForm()

    return render(
        request,
        "hotels/form.html",
        {
            "form": form,
            "page_title": f"Thêm loại phòng - {hotel.name}",
            "cancel_url": "hotel_manage",
            "cancel_id": hotel.id,
        },
    )


@login_required
def room_type_update(request, hotel_id, room_type_id):
    hotel = _get_manageable_hotel(request, hotel_id)

    if hotel is None:
        return redirect("dashboard")

    room_type = get_object_or_404(
        RoomType,
        pk=room_type_id,
        hotel=hotel,
    )

    if request.method == "POST":
        form = RoomTypeForm(
            request.POST,
            request.FILES,
            instance=room_type,
        )

        if form.is_valid():
            form.save()

            messages.success(
                request,
                "Đã cập nhật loại phòng.",
            )
            return redirect(
                "hotel_manage",
                hotel_id=hotel.id,
            )
    else:
        form = RoomTypeForm(instance=room_type)

    return render(
        request,
        "hotels/form.html",
        {
            "form": form,
            "page_title": f"Chỉnh sửa loại phòng - {room_type.name}",
            "cancel_url": "hotel_manage",
            "cancel_id": hotel.id,
        },
    )


@login_required
@require_POST
def room_type_toggle(request, hotel_id, room_type_id):
    hotel = _get_manageable_hotel(request, hotel_id)

    if hotel is None:
        return redirect("dashboard")

    room_type = get_object_or_404(
        RoomType,
        pk=room_type_id,
        hotel=hotel,
    )

    room_type.is_active = not room_type.is_active
    room_type.save(update_fields=["is_active"])

    messages.success(
        request,
        "Đã cập nhật trạng thái loại phòng.",
    )

    return redirect(
        "hotel_manage",
        hotel_id=hotel.id,
    )


@login_required
def room_create(request, hotel_id, room_type_id):
    hotel = _get_manageable_hotel(request, hotel_id)

    if hotel is None:
        return redirect("dashboard")

    room_type = get_object_or_404(
        RoomType,
        pk=room_type_id,
        hotel=hotel,
    )

    if request.method == "POST":
        form = RoomForm(request.POST)

        if form.is_valid():
            room = form.save(commit=False)
            room.room_type = room_type
            room.status = Room.AVAILABLE
            room.save()

            messages.success(
                request,
                "Đã thêm phòng.",
            )
            return redirect(
                "hotel_manage",
                hotel_id=hotel.id,
            )
    else:
        form = RoomForm()

    return render(
        request,
        "hotels/form.html",
        {
            "form": form,
            "page_title": f"Thêm phòng cho loại {room_type.name}",
            "cancel_url": "hotel_manage",
            "cancel_id": hotel.id,
        },
    )

@login_required
def room_bulk_create(request, hotel_id, room_type_id):
    hotel = _get_manageable_hotel(request, hotel_id)

    if hotel is None:
        return redirect("dashboard")

    if not hotel.is_active:
        messages.error(
            request,
            "Cơ sở đã ngừng hoạt động, không thể thêm phòng."
        )
        return redirect("hotel_manage", hotel_id=hotel.id)

    room_type = get_object_or_404(
        RoomType,
        pk=room_type_id,
        hotel=hotel,
    )

    if not room_type.is_active:
        messages.error(
            request,
            "Loại phòng đã ngừng kinh doanh, không thể thêm phòng."
        )
        return redirect("hotel_manage", hotel_id=hotel.id)

    if request.method == "POST":
        form = BulkRoomCreateForm(request.POST)

        if form.is_valid():
            start = form.cleaned_data["start_number"]
            end = form.cleaned_data["end_number"]
            floor = form.cleaned_data["floor"]

            room_codes = [
                str(number)
                for number in range(start, end + 1)
            ]

            with transaction.atomic():
                existing_codes = set(
                    Room.objects.filter(
                        room_type=room_type,
                        room_code__in=room_codes,
                    ).values_list("room_code", flat=True)
                )

                missing_codes = [
                    code
                    for code in room_codes
                    if code not in existing_codes
                ]

                if missing_codes:
                    rooms = [
                        Room(
                            room_type=room_type,
                            room_code=code,
                            floor=floor,
                            status=Room.AVAILABLE,
                            is_active=True,
                        )
                        for code in missing_codes
                    ]

                    # Bỏ qua mã trùng nếu có phát sinh đồng thời
                    # từ một thao tác tạo phòng khác.
                    Room.objects.bulk_create(
                        rooms,
                        ignore_conflicts=True,
                    )

                # Đếm số phòng thực sự được tạo.
                created_count = Room.objects.filter(
                    room_type=room_type,
                    room_code__in=missing_codes,
                ).count()

                skipped_count = len(room_codes) - created_count

            messages.success(
                request,
                (
                    f"Hoàn tất tạo phòng: đã có {created_count} phòng "
                    f"mới, bỏ qua {skipped_count} mã phòng đã tồn tại."
                ),
            )

            return redirect(
                "hotel_manage",
                hotel_id=hotel.id,
            )
    else:
        form = BulkRoomCreateForm()

    return render(
        request,
        "hotels/room_bulk_create.html",
        {
            "form": form,
            "hotel": hotel,
            "room_type": room_type,
        },
    )

@login_required
def room_update(request, hotel_id, room_id):
    hotel = _get_manageable_hotel(request, hotel_id)

    if hotel is None:
        return redirect("dashboard")

    room = get_object_or_404(
        Room,
        pk=room_id,
        room_type__hotel=hotel,
    )

    if request.method == "POST":
        form = RoomForm(
            request.POST,
            instance=room,
        )

        if form.is_valid():
            form.save()

            messages.success(
                request,
                "Đã cập nhật thông tin phòng.",
            )
            return redirect(
                "hotel_manage",
                hotel_id=hotel.id,
            )
    else:
        form = RoomForm(instance=room)

    return render(
        request,
        "hotels/form.html",
        {
            "form": form,
            "page_title": f"Chỉnh sửa phòng {room.room_code}",
            "cancel_url": "hotel_manage",
            "cancel_id": hotel.id,
        },
    )


@login_required
@require_POST
def room_toggle(request, hotel_id, room_id):
    hotel = _get_manageable_hotel(request, hotel_id)

    if hotel is None:
        return redirect("dashboard")

    room = get_object_or_404(
        Room,
        pk=room_id,
        room_type__hotel=hotel,
    )

    if room.is_active and room.status in [
        Room.OCCUPIED,
        Room.CLEANING,
    ]:
        messages.error(
            request,
            "Không thể ngừng kinh doanh phòng đang có khách "
            "hoặc đang dọn.",
        )
        return redirect(
            "hotel_manage",
            hotel_id=hotel.id,
        )

    room.is_active = not room.is_active
    room.save(update_fields=["is_active"])

    messages.success(
        request,
        "Đã cập nhật trạng thái kinh doanh của phòng.",
    )

    return redirect(
        "hotel_manage",
        hotel_id=hotel.id,
    )


@login_required
def membership_create(request, hotel_id):
    hotel = _get_owner_hotel(request, hotel_id)

    if hotel is None:
        return redirect("dashboard")

    if request.method == "POST":
        form = HotelMembershipForm(
            request.POST,
            hotel=hotel,
        )

        if form.is_valid():
            membership = form.save(commit=False)
            membership.hotel = hotel
            membership.is_active = True
            membership.save()

            messages.success(
                request,
                "Đã thêm nhân viên vào cơ sở.",
            )
            return redirect(
                "hotel_manage",
                hotel_id=hotel.id,
            )
    else:
        form = HotelMembershipForm(hotel=hotel)

    return render(
        request,
        "hotels/form.html",
        {
            "form": form,
            "page_title": f"Thêm nhân viên - {hotel.name}",
            "cancel_url": "hotel_manage",
            "cancel_id": hotel.id,
        },
    )


@login_required
@require_POST
def membership_toggle(request, hotel_id, membership_id):
    hotel = _get_owner_hotel(request, hotel_id)

    if hotel is None:
        return redirect("dashboard")

    membership = get_object_or_404(
        HotelMembership,
        pk=membership_id,
        hotel=hotel,
    )

    membership.is_active = not membership.is_active
    membership.save(update_fields=["is_active"])

    messages.success(
        request,
        "Đã cập nhật quyền làm việc của nhân viên.",
    )

    return redirect(
        "hotel_manage",
        hotel_id=hotel.id,
    )