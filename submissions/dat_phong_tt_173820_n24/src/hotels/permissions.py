
from django.db.models import Q

from accounts.models import OwnerAccount
from .models import Hotel, HotelMembership


def get_accessible_hotels(user):
    """
    Quyền truy cập cơ sở:

    SYSTEM ADMIN:
        Truy cập tất cả cơ sở.

    OWNER:
        Truy cập cơ sở do mình sở hữu nếu tài khoản ACTIVE.

    MANAGER / STAFF:
        Truy cập cơ sở được phân công qua membership đang hoạt động.

    Một tài khoản có thể đồng thời là OWNER và MANAGER/STAFF.
    """

    if not user.is_authenticated or not user.is_active:
        return Hotel.objects.none()

    # Admin hệ thống.
    if user.is_superuser:
        return Hotel.objects.all()

    # Lấy các cơ sở được phân công.
    membership_hotel_ids = HotelMembership.objects.filter(
        user_id=user.pk,
        is_active=True,
    ).values_list("hotel_id", flat=True)

    # Kiểm tra quyền Owner.
    is_active_owner = OwnerAccount.objects.filter(
        user_id=user.pk,
        status=OwnerAccount.ACTIVE,
    ).exists()

    if is_active_owner:
        return Hotel.objects.filter(
            Q(owner_id=user.pk) |
            Q(id__in=membership_hotel_ids)
        ).distinct()

    # Manager / Staff.
    return Hotel.objects.filter(
        id__in=membership_hotel_ids
    ).distinct()


def get_hotel_role(user, hotel):
    """
    Xác định vai trò của user tại một cơ sở cụ thể.
    """

    if not user.is_authenticated or not user.is_active:
        return None

    if user.is_superuser:
        return "SYSTEM_ADMIN"

    # Chủ sở hữu cơ sở.
    if hotel.owner_id == user.pk:
        is_active_owner = OwnerAccount.objects.filter(
            user_id=user.pk,
            status=OwnerAccount.ACTIVE,
        ).exists()

        if is_active_owner:
            return "OWNER"

        return None

    # Nhân viên được phân công.
    membership = HotelMembership.objects.filter(
        user_id=user.pk,
        hotel_id=hotel.pk,
        is_active=True,
    ).first()

    if membership:
        return membership.role

    return None



def has_hotel_access(user, hotel, roles=None, allowed_roles=None):
    """
    Kiểm tra user có quyền truy cập cơ sở hay không.

    Hỗ trợ cả:
        roles=[...]
        allowed_roles=[...]

    Để tương thích với các view cũ.
    """

    role = get_hotel_role(user, hotel)

    if role is None:
        return False

    # Ưu tiên allowed_roles nếu được truyền vào.
    if allowed_roles is not None:
        roles = allowed_roles

    if roles is None:
        return True

    return role in roles


def can_manage_hotel(user, hotel):
    """
    OWNER và MANAGER được quản lý thông tin vận hành cơ sở.
    """

    return has_hotel_access(
        user,
        hotel,
        roles=["SYSTEM_ADMIN", "OWNER", "MANAGER"],
    )


def can_manage_hotel_staff(user, hotel):
    """
    Chỉ Admin hệ thống và OWNER được quản lý nhân viên.
    """

    return has_hotel_access(
        user,
        hotel,
        roles=["SYSTEM_ADMIN", "OWNER"],
    )


def can_operate_hotel(user, hotel):
    """
    OWNER, MANAGER, STAFF được thao tác nghiệp vụ.
    """

    return has_hotel_access(
        user,
        hotel,
        roles=["SYSTEM_ADMIN", "OWNER", "MANAGER", "STAFF"],
    )
