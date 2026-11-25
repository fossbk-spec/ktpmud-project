from django.urls import path

from . import views

urlpatterns = [
    path('h/<slug:slug>/availability/', views.search_availability, name='availability'),
    path('h/<slug:slug>/book/', views.book, name='book'),
    path('bookings/lookup/', views.lookup, name='lookup'),
    path('bookings/<str:code>/', views.booking_detail, name='booking_detail'),
    path('bookings/<str:code>/cancel/', views.cancel, name='booking_cancel'),
    path('manage/bookings/', views.manage_bookings, name='manage_bookings'),
    path('manage/bookings/<int:pk>/check-in/', views.check_in, name='check_in'),
    path('manage/bookings/<int:pk>/check-out/', views.check_out, name='check_out'),
]
