from django.contrib import admin

from .models import Booking, BookingRoom, Guest


class BookingRoomInline(admin.TabularInline):
    model = BookingRoom
    extra = 0


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('code', 'hotel', 'guest', 'check_in_date', 'check_out_date', 'status', 'total_amount')
    list_filter = ('hotel', 'status', 'source')
    search_fields = ('code', 'guest__full_name', 'guest__phone')
    inlines = [BookingRoomInline]


@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone', 'email')
    search_fields = ('full_name', 'phone')
