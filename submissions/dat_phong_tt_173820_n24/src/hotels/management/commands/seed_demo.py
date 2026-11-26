from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from hotels.models import Hotel, Room, RoomType


class Command(BaseCommand):
    help = 'Tạo dữ liệu mẫu: 1 cơ sở, 3 loại phòng, các phòng và 2 tài khoản thử nghiệm.'

    def handle(self, *args, **options):
        User = get_user_model()
        admin, created = User.objects.get_or_create(username='admin', defaults={'is_staff': True, 'is_superuser': True})
        if created:
            admin.set_password('admin12345')
            admin.save()
        letan, created = User.objects.get_or_create(username='letan', defaults={'is_staff': True})
        if created:
            letan.set_password('letan12345')
            letan.save()

        hotel, _ = Hotel.objects.get_or_create(
            slug='hoa-sua',
            defaults=dict(
                owner=admin, name='Homestay Hoa Sữa', address='12 Phố Cổ, Hoàn Kiếm, Hà Nội',
                description='Homestay nhỏ xinh giữa phố cổ, gần hồ Hoàn Kiếm, có bếp chung và sân thượng.',
                cancel_policy='Hủy trước 24 giờ được hoàn tiền.',
                bank_info='Ngân hàng: ABC Bank\nSố tài khoản: 0123456789\nChủ tài khoản: NGUYEN VAN A',
            ))
        data = [
            ('Phòng Standard', 2, 450000, 'Giường đôi, điều hòa, wifi', ['101', '102', '103']),
            ('Phòng Deluxe', 3, 700000, 'Giường đôi + giường đơn, ban công, bồn tắm', ['201', '202']),
            ('Phòng Gia đình', 5, 1100000, '2 giường đôi, bếp nhỏ, cửa sổ lớn', ['301']),
        ]
        for name, cap, price, amenities, codes in data:
            rt, _ = RoomType.objects.get_or_create(hotel=hotel, name=name,
                                                   defaults=dict(capacity=cap, base_price=price, amenities=amenities))
            for i, code in enumerate(codes):
                Room.objects.get_or_create(room_type=rt, room_code=code, defaults={'floor': int(code[0])})
        self.stdout.write(self.style.SUCCESS('Đã tạo dữ liệu mẫu.'))
        self.stdout.write('Tài khoản thử: admin / admin12345 (quản trị), letan / letan12345 (nhân viên). Chỉ dùng khi phát triển.')
        self.stdout.write('Mở http://127.0.0.1:8000/h/hoa-sua/ để xem trang đặt phòng.')
