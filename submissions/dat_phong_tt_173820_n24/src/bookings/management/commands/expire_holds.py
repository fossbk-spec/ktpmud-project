from django.core.management.base import BaseCommand

from bookings.services import expire_overdue_holds


class Command(BaseCommand):
    help = 'Giải phóng các đơn chờ thanh toán đã quá hạn giữ chỗ (chạy mỗi phút bằng cron/Task Scheduler).'

    def handle(self, *args, **options):
        n = expire_overdue_holds()
        self.stdout.write(self.style.SUCCESS(f'Đã giải phóng {n} đơn hết hạn giữ chỗ.'))
