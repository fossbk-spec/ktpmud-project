
from django.urls import path
from django.contrib.auth import views as auth_views

from . import views


urlpatterns = [
    # Đăng ký, đăng nhập, đăng xuất
    path(
        "register/",
        views.owner_register,
        name="owner_register",
    ),

    path(
        "login/",
        auth_views.LoginView.as_view(
            template_name="registration/login.html",
        ),
        name="login",
    ),

    path(
        "logout/",
        auth_views.LogoutView.as_view(),
        name="logout",
    ),

    # Admin duyệt chủ cơ sở
    path(
        "system/owners/",
        views.system_owner_list,
        name="system_owner_list",
    ),

    path(
        "system/owners/<int:owner_id>/review/",
        views.owner_review,
        name="owner_review",
    ),

    # Chủ cơ sở duyệt nhân viên
    path(
        "owner/referrals/",
        views.owner_referral_list,
        name="owner_referral_list",
    ),

    path(
        "owner/referrals/<int:referral_id>/review/",
        views.owner_referral_review,
        name="owner_referral_review",
    ),

    # Cài đặt tài khoản
    path(
        "settings/",
        views.account_settings,
        name="account_settings",
    ),

    # Nhật ký quản trị
    path(
        "system/audit-logs/",
        views.system_audit_list,
        name="system_audit_list",
    ),
]
