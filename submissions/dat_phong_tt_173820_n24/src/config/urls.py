from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),
    path('', include('hotels.urls')),
    path('', include('bookings.urls')),
    path('', include('payments.urls')),
]

# Khi phát triển, Django phục vụ luôn ảnh người dùng tải lên
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
