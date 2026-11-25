
from django.contrib import admin

from .models import (
    OwnerAccount,
    OwnerReferral,
    AdminAuditLog,
)


@admin.register(OwnerAccount)
class OwnerAccountAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "owner_number",
        "referral_code",
        "status",
        "reviewed_by",
        "reviewed_at",
        "created_at",
    )

    list_filter = (
        "status",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__email",
        "referral_code",
    )

    readonly_fields = (
        "owner_number",
        "referral_code",
        "created_at",
        "updated_at",
    )

    ordering = ("-created_at",)


@admin.register(OwnerReferral)
class OwnerReferralAdmin(admin.ModelAdmin):
    list_display = (
        "referred_user",
        "owner",
        "referral_code_used",
        "status",
        "created_at",
        "reviewed_at",
    )

    list_filter = (
        "status",
        "created_at",
    )

    search_fields = (
        "referred_user__username",
        "referred_user__email",
        "owner__user__username",
        "referral_code_used",
    )

    readonly_fields = (
        "owner",
        "referred_user",
        "referral_code_used",
        "created_at",
        "reviewed_at",
    )


@admin.register(AdminAuditLog)
class AdminAuditLogAdmin(admin.ModelAdmin):
    list_display = (
        "actor",
        "action",
        "target_user",
        "created_at",
    )

    list_filter = (
        "action",
        "created_at",
    )

    search_fields = (
        "actor__username",
        "target_user__username",
        "reason",
    )

    readonly_fields = (
        "actor",
        "action",
        "target_user",
        "reason",
        "ip_address",
        "created_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
