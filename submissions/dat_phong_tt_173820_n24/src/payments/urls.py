from django.urls import path

from . import views

urlpatterns = [
    path(
        "bookings/<str:code>/qr/",
        views.payment_qr,
        name="payment_qr",
    ),

    path(
        "bookings/<str:code>/pay/",
        views.report_paid,
        name="report_paid",
    ),

    path(
        "manage/payments/<int:pk>/confirm/",
        views.confirm_payment,
        name="confirm_payment",
    ),

    path(
        "manage/payments/<int:pk>/reject/",
        views.reject_payment,
        name="reject_payment",
    ),
]
