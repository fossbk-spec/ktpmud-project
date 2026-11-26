from django.contrib import admin

from .models import Hotel, RoomType, Room, HotelMembership


class RoomTypeInline(admin.TabularInline):
    model = RoomType
    extra = 0


class RoomInline(admin.TabularInline):
    model = Room
    extra = 0


@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "owner",
        "address",
        "is_active",
        "is_booking_open",
        "created_at",
    )

    list_filter = (
        "is_active",
        "is_booking_open",
    )

    search_fields = (
        "name",
        "address",
        "owner__username",
        "owner__email",
    )

    readonly_fields = ("created_at",)

    inlines = [RoomTypeInline]


@admin.register(RoomType)
class RoomTypeAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "hotel",
        "capacity",
        "base_price",
        "is_active",
    )

    list_filter = (
        "hotel",
        "is_active",
    )

    search_fields = (
        "name",
        "hotel__name",
    )

    inlines = [RoomInline]


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = (
        "room_code",
        "room_type",
        "get_hotel",
        "floor",
        "status",
        "is_active",
    )

    list_filter = (
        "status",
        "is_active",
        "room_type__hotel",
    )

    search_fields = (
        "room_code",
        "room_type__name",
        "room_type__hotel__name",
    )

    @admin.display(description="Cơ sở")
    def get_hotel(self, obj):
        return obj.room_type.hotel.name


@admin.register(HotelMembership)
class HotelMembershipAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "hotel",
        "role",
        "is_active",
        "created_at",
    )

    list_filter = (
        "role",
        "is_active",
        "hotel",
    )

    search_fields = (
        "user__username",
        "user__email",
        "hotel__name",
    )

    readonly_fields = ("created_at",)