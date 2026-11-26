from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from hotels.models import Hotel, Room, RoomType
from payments.models import Payment

from .models import Booking
from .services import RoomUnavailable, availability, create_booking, expire_overdue_holds

GUEST = {'full_name': 'Nguyen Van A', 'phone': '0900000000', 'email': 'a@example.com'}


class BookingServiceTests(TestCase):
    def setUp(self):
        self.hotel = Hotel.objects.create(name='H', slug='h', address='x')
        self.rt = RoomType.objects.create(hotel=self.hotel, name='Std', capacity=2, base_price=500000)
        self.r1 = Room.objects.create(room_type=self.rt, room_code='101')
        self.r2 = Room.objects.create(room_type=self.rt, room_code='102')
        self.ci = date.today() + timedelta(days=5)
        self.co = self.ci + timedelta(days=2)

    def book(self, **kw):
        return create_booking(self.hotel, self.rt, kw.get('ci', self.ci), kw.get('co', self.co), 2, dict(GUEST))

    def test_total_amount(self):
        self.assertEqual(self.book().total_amount, 2 * 500000)

    def test_holding_blocks_room_and_is_shown_as_held(self):
        self.book()
        self.assertEqual(availability(self.rt, self.ci, self.co), (1, 1))

    def test_no_double_booking(self):
        self.book(); self.book()
        with self.assertRaises(RoomUnavailable):
            self.book()
        self.assertEqual(Booking.objects.count(), 2)

    def test_adjacent_dates_do_not_conflict(self):
        self.book(); self.book()
        # Đặt ngay sau ngày trả phòng của đơn trước thì vẫn được
        b = self.book(ci=self.co, co=self.co + timedelta(days=1))
        self.assertEqual(b.nights, 1)

    def test_maintenance_room_not_offered(self):
        self.r1.status = Room.MAINTENANCE; self.r1.save()
        self.assertEqual(availability(self.rt, self.ci, self.co), (1, 0))

    def test_expired_hold_releases_room(self):
        b = self.book()
        Booking.objects.filter(pk=b.pk).update(hold_expires_at=timezone.now() - timedelta(minutes=1))
        # Hết hạn là phòng trống lại ngay, kể cả khi lệnh dọn dẹp chưa chạy
        self.assertEqual(availability(self.rt, self.ci, self.co), (2, 0))
        self.assertEqual(expire_overdue_holds(), 1)
        b.refresh_from_db()
        self.assertEqual(b.status, Booking.EXPIRED)
        self.assertFalse(b.booking_rooms.first().is_active)


class BookingFlowTests(TestCase):
    def setUp(self):
        self.hotel = Hotel.objects.create(name='H', slug='h', address='x', bank_info='ABC')
        self.rt = RoomType.objects.create(hotel=self.hotel, name='Std', capacity=2, base_price=500000)
        Room.objects.create(room_type=self.rt, room_code='101')
        self.ci = date.today() + timedelta(days=5)
        self.co = self.ci + timedelta(days=1)
        self.q = f'check_in={self.ci}&check_out={self.co}&guests=2'

    def test_public_pages(self):
        self.assertEqual(self.client.get('/').status_code, 200)
        self.assertEqual(self.client.get('/h/h/').status_code, 200)
        r = self.client.get(f'/h/h/availability/?{self.q}')
        self.assertContains(r, 'Còn 1 phòng')
        self.assertEqual(self.client.get('/bookings/lookup/').status_code, 200)

    def test_full_flow_book_pay_confirm_checkin_checkout(self):
        r = self.client.post(f'/h/h/book/?{self.q}', {
            'room_type': self.rt.id, 'check_in': self.ci, 'check_out': self.co, 'guests': 2, **GUEST})
        booking = Booking.objects.get()
        self.assertRedirects(r, f'/bookings/{booking.code}/')
        self.assertContains(self.client.get(f'/bookings/{booking.code}/'), 'Đang giữ chỗ')
        # Khách khác thấy "đang giữ chỗ"
        self.assertContains(self.client.get(f'/h/h/availability/?{self.q}'), 'đang có khách giữ chỗ')
        # Khách báo đã thanh toán
        self.client.post(f'/bookings/{booking.code}/pay/', {'method': 'TRANSFER'})
        pay = Payment.objects.get()
        # Chưa đăng nhập thì không xác nhận được
        self.client.post(f'/manage/payments/{pay.pk}/confirm/')
        pay.refresh_from_db(); self.assertEqual(pay.status, Payment.PENDING)
        # Lễ tân xác nhận
        User = get_user_model()
        User.objects.create_user('lt', password='pw', is_staff=True)
        self.client.login(username='lt', password='pw')
        self.client.post(f'/manage/payments/{pay.pk}/confirm/')
        booking.refresh_from_db(); self.assertEqual(booking.status, Booking.CONFIRMED)
        self.client.post(f'/manage/bookings/{booking.pk}/check-in/')
        booking.refresh_from_db(); self.assertEqual(booking.status, Booking.CHECKED_IN)
        self.client.post(f'/manage/bookings/{booking.pk}/check-out/')
        booking.refresh_from_db(); self.assertEqual(booking.status, Booking.CHECKED_OUT)
        self.assertEqual(Room.objects.get().status, Room.CLEANING)

    def test_manage_requires_staff_login(self):
        r = self.client.get('/manage/bookings/')
        self.assertEqual(r.status_code, 302)
        self.assertIn('/accounts/login/', r['Location'])

    def test_cancel_releases_room(self):
        self.client.post(f'/h/h/book/?{self.q}', {
            'room_type': self.rt.id, 'check_in': self.ci, 'check_out': self.co, 'guests': 2, **GUEST})
        booking = Booking.objects.get()
        self.client.post(f'/bookings/{booking.code}/cancel/')
        booking.refresh_from_db(); self.assertEqual(booking.status, Booking.CANCELLED)
        self.assertContains(self.client.get(f'/h/h/availability/?{self.q}'), 'Còn 1 phòng')

    def test_lookup_needs_matching_phone(self):
        self.client.post(f'/h/h/book/?{self.q}', {
            'room_type': self.rt.id, 'check_in': self.ci, 'check_out': self.co, 'guests': 2, **GUEST})
        code = Booking.objects.get().code
        r = self.client.post('/bookings/lookup/', {'code': code, 'phone': '0911111111'})
        self.assertContains(r, 'Không tìm thấy')
        r = self.client.post('/bookings/lookup/', {'code': code, 'phone': GUEST['phone']})
        self.assertRedirects(r, f'/bookings/{code}/')
