import { Link } from "react-router-dom";
import heroImg from "../assets/images/Old_Trafford.jpg";
import { PlayerNavBar } from "../layouts/player/PlayerNavBar";
import { 
  Calendar, 
  Users, 
  MapPin, 
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Phone,
  Mail
} from "lucide-react";

export function LandingPage() {
  const stats = [
    { value: "10+", label: "Cụm sân Hà Nội", description: "Bách Khoa, Cầu Giấy, Mỹ Đình, Đống Đa, Hà Đông" },
    { value: "15+", label: "Sân con hoạt động", description: "Đầy đủ loại sân 5v5, 7v7, 11v11" },
    { value: "0%", label: "Trùng lịch giờ vàng", description: "Kiểm soát xung đột khung giờ & giữ chỗ 4h tức thì" },
    { value: "4 giờ", label: "Giữ chỗ đặt cọc", description: "Tự động giải phóng slot quá hạn" },
  ];

  const features = [
    {
      icon: <Calendar className="h-8 w-8 text-emerald-300" />,
      title: "Đặt sân Online siêu tốc",
      description: "Xem sơ đồ khung giờ trống theo ngày & loại sân. Giữ chỗ 4 giờ và gửi xác nhận chuyển khoản cọc minh bạch.",
    },
    {
      icon: <MapPin className="h-8 w-8 text-emerald-300" />,
      title: "Tìm sân GPS toàn Hà Nội",
      description: "Tra cứu cụm sân theo quận/huyện, bán kính vị trí thực tế trên bản đồ trực quan với bảng giá từng khung giờ.",
    },
    {
      icon: <Users className="h-8 w-8 text-emerald-300" />,
      title: "Quản lý tài khoản & Đánh giá",
      description: "Đăng nhập an toàn chuẩn JWT RBAC, theo dõi lịch sử đặt sân, đánh giá chất lượng sân 1–5 sao & bình luận.",
    },
    {
      icon: <ShieldCheck className="h-8 w-8 text-emerald-300" />,
      title: "Vận hành sân cho Chủ sân",
      description: "Cấu hình giá theo thứ & khung giờ, khóa sân đột xuất, duyệt tiền cọc và thống kê doanh thu tự động.",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Tìm kiếm sân bóng",
      description: "Lọc theo quận Hà Nội, khoảng cách GPS, khung giờ và loại sân (5, 7, 11 người) phù hợp nhất.",
    },
    {
      step: "02",
      title: "Chọn khung giờ & Giữ chỗ 4h",
      description: "Khóa khung giờ trống mong muốn với cơ chế giữ chỗ 4 giờ và gửi thông tin chuyển khoản cho chủ sân.",
    },
    {
      step: "03",
      title: "Xác nhận cọc & Ra sân",
      description: "Chủ sân đối soát xác nhận cọc ngay trên hệ thống, lưu sổ cái doanh thu và sẵn sàng ra sân.",
    },
  ];

  const devTeam = [
    { name: "Thành viên 202414021", mssv: "202414021", role: "Nhóm trưởng · Kiến trúc & Storage Engine", initials: "TĐ" },
    { name: "Thành viên 20233605", mssv: "20233605", role: "Frontend React/Vite & Bản đồ GPS", initials: "MQ" },
    { name: "Thành viên 202414018", mssv: "202414018", role: "Business Analyst · SQA & Kiểm thử", initials: "TĐ" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#005E2E] to-[#29721D] text-white">
      {/* Khởi chạy thanh điều hướng */}
      <PlayerNavBar />

      {/* Hero Section */}
      <section className="relative h-[85vh] min-h-[600px] w-full overflow-hidden">
        <img
          src={heroImg}
          alt="Soccer Booker hero"
          loading="eager"
          className="h-full w-full object-cover object-center scale-105"
        />
        {/* Gradient overlay to soften the image edges */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#03150c]/90 via-[#03150c]/55 to-transparent" />

        <div className="absolute inset-0 flex items-center px-6 sm:px-12 lg:px-20">
          <div className="max-w-[700px] flex flex-col items-start gap-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-emerald-300" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">Nhóm 04 KTPMUD · Đặt sân bóng đá trực tuyến</span>
            </div>

            <h1 className="text-4xl font-extrabold uppercase leading-[1.1] text-white md:text-6xl lg:text-7xl tracking-tight">
              CHÁY CÙNG
              <br />
              <span className="text-emerald-300 drop-shadow-[0_0_15px_rgba(110,231,183,0.3)]">
                NIỀM ĐAM MÊ
              </span>
              <br />
              BÓNG ĐÁ!
            </h1>

            <p className="text-base text-white/80 md:text-lg max-w-[500px] leading-relaxed">
              Nền tảng tìm kiếm, đặt sân bóng đá trực tuyến khu vực Hà Nội và quản lý vận hành cụm sân chuyên nghiệp.
            </p>

            <div className="mt-4 flex flex-wrap gap-4">
              <Link
                to="/booking"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-8 py-4 text-lg font-bold text-[#03150c] transition duration-200 hover:scale-105 hover:bg-emerald-200 shadow-lg"
              >
                Đặt sân ngay
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                to="/match"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/20 bg-white/5 px-8 py-4 text-lg font-bold text-white transition duration-200 hover:scale-105 hover:bg-white/10 hover:border-white/40 backdrop-blur-md"
              >
                Tìm đối ghép kèo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Bar */}
      <section className="relative z-10 mt-16 mx-auto w-full max-w-[1200px] px-4">
        <div className="rounded-2xl border border-white/15 bg-white/10 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
          <div className="grid gap-6 grid-cols-2 lg:grid-cols-4 divide-y divide-white/10 lg:divide-y-0 lg:divide-x divide-solid">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-3 lg:px-6">
                <span className="text-3xl md:text-4xl font-extrabold text-emerald-300 tracking-tight">{stat.value}</span>
                <span className="mt-1.5 text-sm font-bold text-white">{stat.label}</span>
                <span className="mt-1 text-xs text-white/70 leading-normal hidden sm:inline-block">{stat.description}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <main className="mx-auto w-full max-w-[1280px] px-6 py-16 sm:py-24 space-y-24 sm:space-y-32">
        
        {/* Core Features */}
        <section className="space-y-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="text-emerald-300 text-xs font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10">
              Hệ thống vận hành
            </span>
            <h2 className="text-3xl font-extrabold uppercase text-white sm:text-4xl">
              Tính năng nổi bật
            </h2>
            <div className="h-[3px] w-[80px] bg-emerald-300 rounded-full" />
            <p className="text-sm md:text-base text-white/80 max-w-[600px]">
              Soccer Booker cung cấp các công cụ kết nối trực tiếp, tối ưu hóa quá trình đặt sân và quản trị cụm sân bóng đá phong trào.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feat, idx) => (
              <div 
                key={idx}
                className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 backdrop-blur-md shadow-xl transition-all duration-300 hover:-translate-y-2 hover:bg-white/10 hover:border-emerald-300/40"
              >
                <div className="space-y-5">
                  <div className="inline-flex rounded-xl bg-white/5 p-3 group-hover:bg-emerald-300/10 transition-colors">
                    {feat.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">{feat.title}</h3>
                  <p className="text-sm text-white/70 leading-relaxed">{feat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="space-y-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="text-emerald-300 text-xs font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10">
              Quy trình dễ dàng
            </span>
            <h2 className="text-3xl font-extrabold uppercase text-white sm:text-4xl">
              Quy trình đặt sân 3 bước
            </h2>
            <div className="h-[3px] w-[80px] bg-emerald-300 rounded-full" />
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, idx) => (
              <div 
                key={idx}
                className="relative rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-xl flex flex-col items-start gap-4 transition-all duration-300 hover:bg-white/10"
              >
                <div className="absolute right-6 top-6 text-5xl font-black text-white/5 select-none">
                  {step.step}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-300 font-bold text-[#03150c]">
                  {idx + 1}
                </div>
                <h3 className="text-xl font-bold text-white">{step.title}</h3>
                <p className="text-sm text-white/70 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Development Team */}
        <section className="space-y-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="text-emerald-300 text-xs font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10">
              Đứng sau hệ thống
            </span>
            <h2 className="text-3xl font-extrabold uppercase text-white sm:text-4xl">
              Đội ngũ phát triển
            </h2>
            <div className="h-[3px] w-[80px] bg-emerald-300 rounded-full" />
            <p className="text-sm md:text-base text-white/80 max-w-[600px]">
              Các thành viên Nhóm 04 – Học phần Kỹ thuật Phần mềm Ứng dụng (ET3260), Đại học Bách Khoa Hà Nội trực tiếp thiết kế và phát triển nền tảng Soccer Booker.
            </p>
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-3 justify-center max-w-[920px] mx-auto">
            {devTeam.map((dev, idx) => (
              <div 
                key={idx}
                className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl text-center flex flex-col items-center gap-4 transition-all duration-300 hover:-translate-y-2 hover:bg-white/10 hover:border-emerald-300/40"
              >
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-300/40 bg-gradient-to-br from-emerald-400/30 to-[#005E2E] text-2xl font-extrabold text-emerald-200 shadow-inner group-hover:scale-105 transition-transform duration-300">
                  {dev.initials}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">{dev.name}</h4>
                  <p className="text-xs text-emerald-300/90 mt-1 font-semibold">MSSV: {dev.mssv}</p>
                  <p className="text-xs text-white/70 mt-1">{dev.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Footer Section */}
      <footer className="border-t border-white/10 bg-black/40 text-white/70 py-16 px-6 backdrop-blur-md">
        <div className="mx-auto max-w-[1280px] grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-widest text-white" style={{ fontFamily: '"Jersey 10", sans-serif' }}>
              SOCCER BOOKER
            </h2>
            <p className="text-xs leading-relaxed text-white/60">
              Soccer Booker - Hệ thống đặt sân bóng đá trực tuyến và quản lý cụm sân tại Hà Nội. Hỗ trợ tìm sân GPS, giữ chỗ 4 giờ chống trùng lịch và quản lý doanh thu cho chủ sân.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Tính năng chính</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/booking" className="hover:text-emerald-300 transition">Tìm kiếm & Đặt sân GPS</Link></li>
              <li><Link to="/profile" className="hover:text-emerald-300 transition">Quản lý đơn & Giữ chỗ 4h</Link></li>
              <li><Link to="/admin" className="hover:text-emerald-300 transition">Cổng quản lý Chủ sân</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Hỗ trợ khách hàng</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/profile" className="hover:text-emerald-300 transition">Hướng dẫn sử dụng</Link></li>
              <li><Link to="/profile" className="hover:text-emerald-300 transition">Chính sách đặt cọc 4 giờ</Link></li>
              <li><Link to="/profile" className="hover:text-emerald-300 transition">Điều khoản dịch vụ</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Liên hệ Nhóm 04</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-300" />
                <span>+84 912 345 678</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-300" />
                <span>support@soccerbooker.vn</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-300" />
                <span>Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mx-auto max-w-[1280px] mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>© 2026 Soccer Booker. Phát triển bởi Nhóm 04 – KTPMUD (ĐHBK Hà Nội).</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition">Facebook</a>
            <a href="#" className="hover:text-white transition">Instagram</a>
            <a href="#" className="hover:text-white transition">YouTube</a>
          </div>
        </div>
      </footer>
    </div>
  );
}