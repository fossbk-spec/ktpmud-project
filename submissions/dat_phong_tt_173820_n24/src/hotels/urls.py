from django.urls import path

from . import views


urlpatterns = [
    # Trang công khai
    path("", views.home, name="home"),
    path("h/<slug:slug>/", views.hotel_detail, name="hotel_detail"),

    # Dashboard
    path("dashboard/", views.dashboard, name="dashboard"),

    # Cơ sở
    path(
        "dashboard/hotels/create/",
        views.hotel_create,
        name="hotel_create",
    ),
    path(
        "dashboard/hotels/<int:hotel_id>/",
        views.hotel_manage,
        name="hotel_manage",
    ),
    path(
        "dashboard/hotels/<int:hotel_id>/update/",
        views.hotel_update,
        name="hotel_update",
    ),
    path(
        "dashboard/hotels/<int:hotel_id>/toggle-booking/",
        views.hotel_toggle_booking,
        name="hotel_toggle_booking",
    ),
    path(
        "dashboard/hotels/<int:hotel_id>/toggle-active/",
        views.hotel_toggle_active,
        name="hotel_toggle_active",
    ),
    path(
        "dashboard/hotels/<int:hotel_id>/room-types/<int:room_type_id>/rooms/bulk-create/",
        views.room_bulk_create,
        name="room_bulk_create",
    ),
    # Loại phòng
    path(
        "dashboard/hotels/<int:hotel_id>/room-types/create/",
        views.room_type_create,
        name="room_type_create",
    ),
    path(
        "dashboard/hotels/<int:hotel_id>/room-types/<int:room_type_id>/update/",
        views.room_type_update,
        name="room_type_update",
    ),
    path(
        "dashboard/hotels/<int:hotel_id>/room-types/<int:room_type_id>/toggle/",
        views.room_type_toggle,
        name="room_type_toggle",
    ),

    # Phòng
    path(
        "dashboard/hotels/<int:hotel_id>/room-types/<int:room_type_id>/rooms/create/",
        views.room_create,
        name="room_create",
    ),
    path(
        "dashboard/hotels/<int:hotel_id>/rooms/<int:room_id>/update/",
        views.room_update,
        name="room_update",
    ),
    path(
        "dashboard/hotels/<int:hotel_id>/rooms/<int:room_id>/toggle/",
        views.room_toggle,
        name="room_toggle",
    ),

    # Nhân sự
    path(
        "dashboard/hotels/<int:hotel_id>/members/create/",
        views.membership_create,
        name="membership_create",
    ),
    path(
        "dashboard/hotels/<int:hotel_id>/members/<int:membership_id>/toggle/",
        views.membership_toggle,
        name="membership_toggle",
    ),
    # Thanh toán 
    path(
        "dashboard/hotels/<int:hotel_id>/bank-settings/",
        views.hotel_bank_settings,
        name="hotel_bank_settings",
    ),
]