
import secrets

from django.contrib import messages
from django.contrib.auth import (
    login,
    update_session_auth_hash,
)
from django.contrib.auth.decorators import (
    login_required,
    user_passes_test,
)
from django.db import transaction
from django.db.models import Max
from django.shortcuts import (
    get_object_or_404,
    render,
    redirect,
)
from django.utils import timezone
from django.views.decorators.http import require_POST

from hotels.models import Hotel, HotelMembership

from .forms import (
    OwnerRegisterForm,
    AccountEmailForm,
    ReferralSuffixForm,
    AccountPasswordChangeForm,
)
from .models import (
    OwnerAccount,
    OwnerReferral,
    AdminAuditLog,
)


# =====================================================
# HÀM HỖ TRỢ
# =====================================================

def get_client_ip(request):
    return request.META.get("REMOTE_ADDR")


def write_audit_log(actor, action, target_user, reason, request):
    AdminAuditLog.objects.create(
        actor=actor,
        action=action,
        target_user=target_user,
        reason=reason,
        ip_address=get_client_ip(request),
    )


def generate_referral_code(owner_number):
    """
    Tạo mã giới thiệu có hậu tố ngẫu nhiên.
    Ví dụ: OWNER_1_A1B2C3
    """
    while True:
        suffix = secrets.token_hex(3).upper()
        code = f"OWNER_{owner_number}_{suffix}"

        if not OwnerAccount.objects.filter(
            referral_code__iexact=code
        ).exists():
            return suffix, code


# =====================================================
# ĐĂNG KÝ TÀI KHOẢN
# =====================================================

def owner_register(request):
    if request.user.is_authenticated:
        return redirect("dashboard")

    if request.method == "POST":
        form = OwnerRegisterForm(request.POST)

        if form.is_valid():
            is_employee = bool(
                form.cleaned_data.get("referral_code")
            )

            form.save()

            if is_employee:
                messages.success(
                    request,
                    "Đăng ký thành công. Tài khoản đang chờ "
                    "chủ cơ sở xét duyệt."
                )
            else:
                messages.success(
                    request,
                    "Đăng ký chủ cơ sở thành công. "
                    "Tài khoản đang chờ Admin xét duyệt."
                )

            return redirect("login")
    else:
        form = OwnerRegisterForm()

    return render(
        request,
        "accounts/register.html",
        {"form": form},
    )


# =====================================================
# ADMIN HỆ THỐNG
# =====================================================

def is_system_admin(user):
    return user.is_authenticated and user.is_superuser


@login_required
@user_passes_test(is_system_admin)
def system_owner_list(request):
    owners = OwnerAccount.objects.select_related(
        "user",
        "reviewed_by",
    ).all()

    return render(
        request,
        "accounts/system/owner_list.html",
        {"owners": owners},
    )


@login_required
@user_passes_test(is_system_admin)
@require_POST
def owner_review(request, owner_id):
    action = request.POST.get("action", "").strip()
    reason = request.POST.get("reason", "").strip()

    if not reason:
        messages.error(request, "Bạn phải nhập lý do xử lý.")
        return redirect("system_owner_list")

    with transaction.atomic():
        owner = get_object_or_404(
            OwnerAccount.objects.select_for_update().select_related("user"),
            pk=owner_id,
        )

        if action == "APPROVE_OWNER":
            if owner.status != OwnerAccount.PENDING:
                messages.error(request, "Tài khoản này không còn chờ duyệt.")
                return redirect("system_owner_list")

            if owner.owner_number is None:
                max_number = OwnerAccount.objects.aggregate(
                    max_number=Max("owner_number")
                )["max_number"]

                owner.owner_number = (max_number or 0) + 1

            if not owner.referral_code:
                suffix, code = generate_referral_code(
                    owner.owner_number
                )
                owner.referral_suffix = suffix
                owner.referral_code = code

            owner.status = OwnerAccount.ACTIVE
            owner.user.is_active = True

        elif action == "REJECT_OWNER":
            if owner.status != OwnerAccount.PENDING:
                messages.error(request, "Chỉ được từ chối tài khoản đang chờ duyệt.")
                return redirect("system_owner_list")

            owner.status = OwnerAccount.REJECTED
            owner.user.is_active = False

        elif action == "LOCK_OWNER":
            if owner.status != OwnerAccount.ACTIVE:
                messages.error(request, "Chỉ được khóa chủ cơ sở đang hoạt động.")
                return redirect("system_owner_list")

            owner.status = OwnerAccount.LOCKED

            # Không vô hiệu hóa tài khoản User toàn cục ở đây.
            # Việc khóa OwnerAccount đã đủ để chặn quyền OWNER.

        elif action == "UNLOCK_OWNER":
            if owner.status != OwnerAccount.LOCKED:
                messages.error(request, "Tài khoản này không ở trạng thái bị khóa.")
                return redirect("system_owner_list")

            owner.status = OwnerAccount.ACTIVE
            owner.user.is_active = True

        else:
            messages.error(request, "Thao tác không hợp lệ.")
            return redirect("system_owner_list")

        owner.reason = reason
        owner.reviewed_by = request.user
        owner.reviewed_at = timezone.now()

        owner.user.save(update_fields=["is_active"])

        owner.save(update_fields=[
            "status",
            "owner_number",
            "referral_suffix",
            "referral_code",
            "reason",
            "reviewed_by",
            "reviewed_at",
            "updated_at",
        ])

        write_audit_log(
            actor=request.user,
            action=action,
            target_user=owner.user,
            reason=reason,
            request=request,
        )

    messages.success(request, "Đã xử lý tài khoản chủ cơ sở.")
    return redirect("system_owner_list")


# =====================================================
# CHỦ CƠ SỞ - DANH SÁCH NHÂN VIÊN ĐƯỢC GIỚI THIỆU
# =====================================================

@login_required
def owner_referral_list(request):
    owner = get_object_or_404(
        OwnerAccount,
        user=request.user,
        status=OwnerAccount.ACTIVE,
    )

    referrals = OwnerReferral.objects.filter(
        owner=owner,
    ).select_related(
        "referred_user",
    ).order_by("-created_at")

    hotels = Hotel.objects.filter(
        owner=request.user,
        is_active=True,
    ).order_by("name")

    context = {
        "owner": owner,
        "referrals": referrals,
        "hotels": hotels,
        "pending_count": referrals.filter(
            status=OwnerReferral.PENDING
        ).count(),
        "approved_count": referrals.filter(
            status=OwnerReferral.APPROVED
        ).count(),
    }

    return render(
        request,
        "accounts/owner/referral_list.html",
        context,
    )


# =====================================================
# CHỦ CƠ SỞ - DUYỆT NHÂN VIÊN
# =====================================================

@login_required
@require_POST
def owner_referral_review(request, referral_id):
    owner = get_object_or_404(
        OwnerAccount,
        user=request.user,
        status=OwnerAccount.ACTIVE,
    )

    action = request.POST.get("action", "").strip()
    reason = request.POST.get("reason", "").strip()

    with transaction.atomic():
        referral = get_object_or_404(
            OwnerReferral.objects.select_for_update().select_related(
                "referred_user",
            ),
            pk=referral_id,
            owner=owner,
            status=OwnerReferral.PENDING,
        )

        if action == "APPROVE":
            hotel_id = request.POST.get("hotel")
            role = request.POST.get("role")

            if role not in (
                HotelMembership.MANAGER,
                HotelMembership.STAFF,
            ):
                messages.error(request, "Vai trò không hợp lệ.")
                return redirect("owner_referral_list")

            hotel = get_object_or_404(
                Hotel,
                pk=hotel_id,
                owner=request.user,
                is_active=True,
            )

            # Một nhân viên được gán một vai trò tại cơ sở này.
            HotelMembership.objects.update_or_create(
                hotel=hotel,
                user=referral.referred_user,
                defaults={
                    "role": role,
                    "is_active": True,
                },
            )

            referral.status = OwnerReferral.APPROVED
            referral.reviewed_at = timezone.now()
            referral.reason = reason or (
                f"Được phân công tại {hotel.name} với vai trò {role}."
            )

            referral.referred_user.is_active = True
            referral.referred_user.save(update_fields=["is_active"])

            referral.save(update_fields=[
                "status",
                "reviewed_at",
                "reason",
            ])

            write_audit_log(
                actor=request.user,
                action="ASSIGN_REFERRAL_USER",
                target_user=referral.referred_user,
                reason=referral.reason,
                request=request,
            )

            messages.success(
                request,
                "Đã duyệt và phân công nhân viên thành công.",
            )

        elif action == "REJECT":
            referral.status = OwnerReferral.REJECTED
            referral.reviewed_at = timezone.now()
            referral.reason = reason or "Chủ cơ sở từ chối đăng ký."

            referral.save(update_fields=[
                "status",
                "reviewed_at",
                "reason",
            ])

            messages.success(request, "Đã từ chối tài khoản đăng ký.")

        else:
            messages.error(request, "Thao tác không hợp lệ.")

    return redirect("owner_referral_list")


# =====================================================
# CÀI ĐẶT TÀI KHOẢN
# =====================================================


@login_required
def account_settings(request):
    owner = OwnerAccount.objects.filter(
        user=request.user,
        status=OwnerAccount.ACTIVE,
    ).first()

    # Tự bổ sung mã giới thiệu nếu chủ cơ sở ACTIVE
    # nhưng trước đó chưa được cấp owner_number hoặc referral_code.
    if owner and (
        owner.owner_number is None or not owner.referral_code
    ):
        with transaction.atomic():
            owner = OwnerAccount.objects.select_for_update().get(
                pk=owner.pk,
                status=OwnerAccount.ACTIVE,
            )

            if owner.owner_number is None:
                max_number = OwnerAccount.objects.aggregate(
                    max_number=Max("owner_number")
                )["max_number"]

                owner.owner_number = (max_number or 0) + 1

            if not owner.referral_code:
                suffix, code = generate_referral_code(
                    owner.owner_number
                )
                owner.referral_suffix = suffix
                owner.referral_code = code

            owner.save(update_fields=[
                "owner_number",
                "referral_suffix",
                "referral_code",
                "updated_at",
            ])

    email_form = AccountEmailForm(
        user=request.user,
        prefix="email",
    )

    password_form = AccountPasswordChangeForm(
        user=request.user,
        prefix="password",
    )

    suffix_form = None

    if owner:
        suffix_form = ReferralSuffixForm(
            initial={"suffix": owner.referral_suffix},
            prefix="suffix",
        )

    if request.method == "POST":
        action = request.POST.get("action", "")

        if action == "change_email":
            email_form = AccountEmailForm(
                request.POST,
                user=request.user,
                prefix="email",
            )

            if email_form.is_valid():
                new_email = email_form.cleaned_data["email"]

                request.user.email = new_email
                request.user.save(update_fields=["email"])

                write_audit_log(
                    actor=request.user,
                    action="CHANGE_EMAIL",
                    target_user=request.user,
                    reason="Người dùng tự thay đổi email.",
                    request=request,
                )

                messages.success(request, "Đã cập nhật email.")
                return redirect("account_settings")

        elif action == "change_password":
            password_form = AccountPasswordChangeForm(
                user=request.user,
                data=request.POST,
                prefix="password",
            )

            if password_form.is_valid():
                user = password_form.save()
                update_session_auth_hash(request, user)

                write_audit_log(
                    actor=request.user,
                    action="CHANGE_PASSWORD",
                    target_user=request.user,
                    reason="Người dùng tự thay đổi mật khẩu.",
                    request=request,
                )

                messages.success(request, "Đã đổi mật khẩu.")
                return redirect("account_settings")

        elif action == "change_suffix":
            if not owner or owner.owner_number is None:
                messages.error(
                    request,
                    "Bạn không có quyền thay đổi mã giới thiệu.",
                )
                return redirect("account_settings")

            suffix_form = ReferralSuffixForm(
                request.POST,
                prefix="suffix",
            )

            if suffix_form.is_valid():
                suffix = suffix_form.cleaned_data["suffix"]
                new_code = f"OWNER_{owner.owner_number}_{suffix}"

                duplicate = OwnerAccount.objects.filter(
                    referral_code__iexact=new_code
                ).exclude(pk=owner.pk).exists()

                if duplicate:
                    suffix_form.add_error(
                        "suffix",
                        "Mã giới thiệu này đã được sử dụng.",
                    )
                else:
                    with transaction.atomic():
                        owner = OwnerAccount.objects.select_for_update().get(
                            pk=owner.pk,
                            status=OwnerAccount.ACTIVE,
                        )

                        old_code = owner.referral_code

                        owner.referral_suffix = suffix
                        owner.referral_code = new_code
                        owner.save(update_fields=[
                            "referral_suffix",
                            "referral_code",
                            "updated_at",
                        ])

                        write_audit_log(
                            actor=request.user,
                            action="CHANGE_REFERRAL_CODE",
                            target_user=request.user,
                            reason=(
                                f"Đổi mã giới thiệu từ {old_code} "
                                f"sang {new_code}."
                            ),
                            request=request,
                        )

                    messages.success(
                        request,
                        "Đã thay đổi mã giới thiệu.",
                    )
                    return redirect("account_settings")

        else:
            messages.error(request, "Thao tác không hợp lệ.")

    return render(
        request,
        "accounts/settings.html",
        {
            "email_form": email_form,
            "password_form": password_form,
            "suffix_form": suffix_form,
            "owner": owner,
        },
    )



# =====================================================
# NHẬT KÝ QUẢN TRỊ
# =====================================================

@login_required
@user_passes_test(is_system_admin)
def system_audit_list(request):
    logs = AdminAuditLog.objects.select_related(
        "actor",
        "target_user",
    ).all()

    return render(
        request,
        "accounts/system/audit_list.html",
        {"logs": logs},
    )
