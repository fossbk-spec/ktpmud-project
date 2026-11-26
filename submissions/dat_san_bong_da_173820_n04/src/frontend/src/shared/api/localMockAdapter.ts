import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { AxiosError, AxiosHeaders } from "axios";
import { getTokenFromStorage } from "@/shared/utils/tokenStorage";

const DB_STORAGE_KEY = "soccer_booker_static_db_v1";
const DB_VERSION = 1;

interface StoredUser {
  id: number;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: "CLIENT" | "PITCH_OWNER";
  createdAt: string;
}

interface StoredVenue {
  id: number;
  ownerUserId: number;
  name: string;
  address: string;
  district: string;
  province: string;
  description: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  openTime: string;
  closeTime: string;
  isActive: boolean;
}

interface SlotPriceConfig {
  slotNumber: number;
  weekdayPrice: number;
  weekendPrice: number;
}

interface StoredPitch {
  id: number;
  venueId: number;
  name: string;
  pitchType: "SAN_5" | "SAN_7" | "SAN_11";
  isActive: boolean;
  depositAmount: number;
  slotPrices: SlotPriceConfig[];
}

interface StoredTimeSlot {
  timeSlotId: number;
  slotNumber: number;
  slotName: string;
  startTime: string;
  endTime: string;
}

interface StoredBooking {
  id: number;
  bookingCode: string;
  userId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pitchId: number;
  bookingDate: string;
  timeSlotId: number;
  totalPrice: number;
  depositAmount: number;
  status: string;
  expiresAt: string | null;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  transferInstruction: string;
  reportedAmount: number | null;
  depositReportStatus: string | null;
  clientMessage: string | null;
  adminNote: string | null;
  reviewed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StoredReview {
  review_id: number;
  booking_id: number;
  pitch_id: number;
  client_user_id: number;
  client_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface StoredComment {
  comment_id: number;
  target_type: string;
  target_id: number;
  author_user_id: number;
  author_name: string;
  content: string;
  created_at: string;
}

interface StoredService {
  id: number;
  venueId: number;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  status: "ACTIVE" | "INACTIVE";
}

interface StoredActivityLog {
  id: number;
  userId: number | null;
  userName: string;
  actionType: string;
  targetType: string;
  targetId: string;
  description: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

interface StoredNotification {
  id: number;
  userId: number | null;
  type: string;
  title: string;
  message: string;
  targetType: string | null;
  targetId: string | null;
  read: boolean;
  createdAt: string;
  readAt: string | null;
}

interface StoredSlotBlock {
  pitchId: number;
  blockDate: string;
  timeSlotId: number;
  reason: string;
}

interface StaticDatabase {
  version: number;
  seq: {
    user: number;
    venue: number;
    pitch: number;
    booking: number;
    review: number;
    comment: number;
    service: number;
    log: number;
    notification: number;
  };
  users: StoredUser[];
  timeSlots: StoredTimeSlot[];
  venues: StoredVenue[];
  pitches: StoredPitch[];
  bookings: StoredBooking[];
  reviews: StoredReview[];
  comments: StoredComment[];
  services: StoredService[];
  slotBlocks: StoredSlotBlock[];
  activityLogs: StoredActivityLog[];
  notifications: StoredNotification[];
}

const DEFAULT_TIME_SLOTS: StoredTimeSlot[] = [
  { timeSlotId: 1, slotNumber: 1, slotName: "Ca Sáng 1", startTime: "06:00", endTime: "07:30" },
  { timeSlotId: 2, slotNumber: 2, slotName: "Ca Sáng 2", startTime: "07:30", endTime: "09:00" },
  { timeSlotId: 3, slotNumber: 3, slotName: "Ca Chiều", startTime: "16:00", endTime: "17:30" },
  { timeSlotId: 4, slotNumber: 4, slotName: "Ca Vàng 1", startTime: "17:30", endTime: "19:00" },
  { timeSlotId: 5, slotNumber: 5, slotName: "Ca Vàng 2", startTime: "19:00", endTime: "20:30" },
  { timeSlotId: 6, slotNumber: 6, slotName: "Ca Tối Muộn", startTime: "20:30", endTime: "22:00" },
];

function makeSlotPrices(base5Or7: "5" | "7" | "11"): SlotPriceConfig[] {
  if (base5Or7 === "11") {
    return [
      { slotNumber: 1, weekdayPrice: 900000, weekendPrice: 1100000 },
      { slotNumber: 2, weekdayPrice: 1000000, weekendPrice: 1200000 },
      { slotNumber: 3, weekdayPrice: 1400000, weekendPrice: 1600000 },
      { slotNumber: 4, weekdayPrice: 1800000, weekendPrice: 2000000 },
      { slotNumber: 5, weekdayPrice: 1800000, weekendPrice: 2000000 },
      { slotNumber: 6, weekdayPrice: 1300000, weekendPrice: 1500000 },
    ];
  }
  if (base5Or7 === "5") {
    return [
      { slotNumber: 1, weekdayPrice: 250000, weekendPrice: 300000 },
      { slotNumber: 2, weekdayPrice: 280000, weekendPrice: 350000 },
      { slotNumber: 3, weekdayPrice: 400000, weekendPrice: 450000 },
      { slotNumber: 4, weekdayPrice: 550000, weekendPrice: 650000 },
      { slotNumber: 5, weekdayPrice: 550000, weekendPrice: 650000 },
      { slotNumber: 6, weekdayPrice: 350000, weekendPrice: 400000 },
    ];
  }
  return [
    { slotNumber: 1, weekdayPrice: 300000, weekendPrice: 380000 },
    { slotNumber: 2, weekdayPrice: 350000, weekendPrice: 420000 },
    { slotNumber: 3, weekdayPrice: 550000, weekendPrice: 650000 },
    { slotNumber: 4, weekdayPrice: 750000, weekendPrice: 850000 },
    { slotNumber: 5, weekdayPrice: 750000, weekendPrice: 850000 },
    { slotNumber: 6, weekdayPrice: 450000, weekendPrice: 550000 },
  ];
}

function createInitialDb(): StaticDatabase {
  const today = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();
  const fourHoursLater = new Date(Date.now() + 4 * 3600 * 1000).toISOString();

  const venues: StoredVenue[] = [
    { id: 1, ownerUserId: 1, name: "Cụm Sân Bóng Đá Bách Khoa", address: "Số 1 Đại Cồ Việt, Bách Khoa, Hai Bà Trưng, Hà Nội", district: "Hai Bà Trưng", province: "Hà Nội", description: "Sân cỏ nhân tạo đạt chuẩn FIFA Quality, gần ký túc xá Bách Khoa.", latitude: 21.0052, longitude: 105.8431, imageUrl: "./Old_Trafford.jpg", openTime: "06:00", closeTime: "22:00", isActive: true },
    { id: 2, ownerUserId: 1, name: "Cụm Sân Thể Thao Mỹ Đình", address: "Đường Lê Đức Thọ, Mỹ Đình 2, Nam Từ Liêm, Hà Nội", district: "Nam Từ Liêm", province: "Hà Nội", description: "Khu phức hợp sân bóng rộng rãi, bãi đỗ ô tô miễn phí.", latitude: 21.0285, longitude: 105.7642, imageUrl: "./Old_Trafford.jpg", openTime: "06:00", closeTime: "22:00", isActive: true },
    { id: 3, ownerUserId: 1, name: "Sân Bóng Thành Phát", address: "Số 2 Hoàng Minh Giám, Trung Hòa, Cầu Giấy, Hà Nội", district: "Cầu Giấy", province: "Hà Nội", description: "Đối diện THPT Hà Nội - Amsterdam, hệ thống đèn LED chống chói.", latitude: 21.0044, longitude: 105.8005, imageUrl: "./Old_Trafford.jpg", openTime: "06:00", closeTime: "22:00", isActive: true },
    { id: 4, ownerUserId: 1, name: "Sân Bóng Đông Đô", address: "Lô D33 Trần Thái Tông, Dịch Vọng Hậu, Cầu Giấy, Hà Nội", district: "Cầu Giấy", province: "Hà Nội", description: "Mặt cỏ mới thay, có căng tin nước giải khát và phòng thay đồ.", latitude: 21.0319, longitude: 105.7889, imageUrl: "./Old_Trafford.jpg", openTime: "06:00", closeTime: "22:00", isActive: true },
    { id: 5, ownerUserId: 1, name: "Sân Bóng Đại học Thủy Lợi", address: "Ngõ 95 phố Chùa Bộc, Trung Liệt, Đống Đa, Hà Nội", district: "Đống Đa", province: "Hà Nội", description: "Sân truyền thống sinh viên Đống Đa, hỗ trợ ghép sân 11v11.", latitude: 21.0074, longitude: 105.8245, imageUrl: "./Old_Trafford.jpg", openTime: "06:00", closeTime: "22:00", isActive: true },
    { id: 6, ownerUserId: 1, name: "Sân Bóng 69 Hoàng Cầu", address: "Số 69 phố Hoàng Cầu mới, Ô Chợ Dừa, Đống Đa, Hà Nội", district: "Đống Đa", province: "Hà Nội", description: "Ngay cạnh hồ Hoàng Cầu, đi lại thuận tiện từ ga Cát Linh.", latitude: 21.0168, longitude: 105.8233, imageUrl: "./Old_Trafford.jpg", openTime: "06:00", closeTime: "22:00", isActive: true },
    { id: 7, ownerUserId: 1, name: "Sân Bóng Phòng Không - Không Quân", address: "Số 3 Lê Trọng Tấn, Khương Mai, Thanh Xuân, Hà Nội", district: "Thanh Xuân", province: "Hà Nội", description: "Khu liên hợp thể thao quân đội thoáng mát, thoát nước tốt.", latitude: 20.9965, longitude: 105.8295, imageUrl: "./Old_Trafford.jpg", openTime: "06:00", closeTime: "22:00", isActive: true },
    { id: 8, ownerUserId: 1, name: "Sân Bóng 99 Định Công Hạ", address: "Ngõ 99 Định Công Hạ, Định Công, Hoàng Mai, Hà Nội", district: "Hoàng Mai", province: "Hà Nội", description: "Giá sinh viên khu vực Hoàng Mai, cỏ êm, lưới cao.", latitude: 20.9802, longitude: 105.8338, imageUrl: "./Old_Trafford.jpg", openTime: "06:00", closeTime: "22:00", isActive: true },
    { id: 9, ownerUserId: 1, name: "Sân Bóng Phú Viên Long Biên", address: "Số 138 Phú Viên, Bồ Đề, Long Biên, Hà Nội", district: "Long Biên", province: "Hà Nội", description: "Gần cầu Chương Dương, không gian yên tĩnh, rộng rãi.", latitude: 21.0384, longitude: 105.8698, imageUrl: "./Old_Trafford.jpg", openTime: "06:00", closeTime: "22:00", isActive: true },
    { id: 10, ownerUserId: 1, name: "Sân Bóng C500 - Học viện An Ninh", address: "Đường 19/5, KĐT Văn Quán, Văn Quán, Hà Đông, Hà Nội", district: "Hà Đông", province: "Hà Nội", description: "Sân lớn khu vực Hà Đông, có khán đài và bãi gửi xe.", latitude: 20.9792, longitude: 105.7897, imageUrl: "./Old_Trafford.jpg", openTime: "06:00", closeTime: "22:00", isActive: true },
  ];

  const pitches: StoredPitch[] = [
    { id: 1, venueId: 1, name: "Sân 7A - Cỏ FIFA", pitchType: "SAN_7", isActive: true, depositAmount: 300000, slotPrices: makeSlotPrices("7") },
    { id: 2, venueId: 1, name: "Sân 5A - Mini", pitchType: "SAN_5", isActive: true, depositAmount: 200000, slotPrices: makeSlotPrices("5") },
    { id: 3, venueId: 2, name: "Sân 7B - Mỹ Đình", pitchType: "SAN_7", isActive: true, depositAmount: 350000, slotPrices: makeSlotPrices("7") },
    { id: 4, venueId: 3, name: "Sân 7 Thành Phát 01", pitchType: "SAN_7", isActive: true, depositAmount: 300000, slotPrices: makeSlotPrices("7") },
    { id: 5, venueId: 3, name: "Sân 7 Thành Phát 02", pitchType: "SAN_7", isActive: true, depositAmount: 300000, slotPrices: makeSlotPrices("7") },
    { id: 6, venueId: 4, name: "Sân 7 Đông Đô A", pitchType: "SAN_7", isActive: true, depositAmount: 300000, slotPrices: makeSlotPrices("7") },
    { id: 7, venueId: 4, name: "Sân 5 Đông Đô B", pitchType: "SAN_5", isActive: true, depositAmount: 200000, slotPrices: makeSlotPrices("5") },
    { id: 8, venueId: 5, name: "Sân 7 Thủy Lợi 1", pitchType: "SAN_7", isActive: true, depositAmount: 300000, slotPrices: makeSlotPrices("7") },
    { id: 9, venueId: 5, name: "Sân 11 Thủy Lợi (Gộp)", pitchType: "SAN_11", isActive: true, depositAmount: 700000, slotPrices: makeSlotPrices("11") },
    { id: 10, venueId: 6, name: "Sân 7 Hoàng Cầu 1", pitchType: "SAN_7", isActive: true, depositAmount: 300000, slotPrices: makeSlotPrices("7") },
    { id: 11, venueId: 7, name: "Sân 7 PKKQ - Số 1", pitchType: "SAN_7", isActive: true, depositAmount: 300000, slotPrices: makeSlotPrices("7") },
    { id: 12, venueId: 7, name: "Sân 5 PKKQ - Số 2", pitchType: "SAN_5", isActive: true, depositAmount: 200000, slotPrices: makeSlotPrices("5") },
    { id: 13, venueId: 8, name: "Sân 7 Định Công 1", pitchType: "SAN_7", isActive: true, depositAmount: 250000, slotPrices: makeSlotPrices("7") },
    { id: 14, venueId: 9, name: "Sân 7 Phú Viên 01", pitchType: "SAN_7", isActive: true, depositAmount: 250000, slotPrices: makeSlotPrices("7") },
    { id: 15, venueId: 10, name: "Sân 7 C500 - Sân Chính", pitchType: "SAN_7", isActive: true, depositAmount: 300000, slotPrices: makeSlotPrices("7") },
  ];

  return {
    version: DB_VERSION,
    seq: { user: 3, venue: 11, pitch: 16, booking: 4, review: 3, comment: 3, service: 4, log: 4, notification: 3 },
    users: [
      { id: 1, username: "Chủ sân Demo Bách Khoa", email: "owner@soccerbooker.vn", phoneNumber: "0912345678", password: "Demo@123", role: "PITCH_OWNER", createdAt: "2026-10-01T08:00:00.000Z" },
      { id: 2, username: "Khách hàng Demo", email: "client@soccerbooker.vn", phoneNumber: "0987654321", password: "Demo@123", role: "CLIENT", createdAt: "2026-10-05T09:30:00.000Z" },
    ],
    timeSlots: DEFAULT_TIME_SLOTS,
    venues,
    pitches,
    bookings: [
      {
        id: 1,
        bookingCode: "SB-DEMO-0001",
        userId: 2,
        customerName: "Khách hàng Demo",
        customerPhone: "0987654321",
        customerEmail: "client@soccerbooker.vn",
        pitchId: 1,
        bookingDate: today,
        timeSlotId: 4,
        totalPrice: 750000,
        depositAmount: 300000,
        status: "CONFIRMED",
        expiresAt: null,
        bankName: "MB Bank",
        accountNumber: "0389999888",
        accountHolder: "CHU SAN DEMO SOCCER BOOKER",
        transferInstruction: "COC SB-DEMO-0001",
        reportedAmount: 300000,
        depositReportStatus: "CONFIRMED",
        clientMessage: "Đã chuyển khoản cọc qua Vietcombank",
        adminNote: "Đã nhận đủ tiền cọc",
        reviewed: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 2,
        bookingCode: "SB-DEMO-0002",
        userId: 2,
        customerName: "Khách hàng Demo",
        customerPhone: "0987654321",
        customerEmail: "client@soccerbooker.vn",
        pitchId: 4,
        bookingDate: today,
        timeSlotId: 5,
        totalPrice: 750000,
        depositAmount: 300000,
        status: "WAITING_FOR_DEPOSIT",
        expiresAt: fourHoursLater,
        bankName: "MB Bank",
        accountNumber: "0389999888",
        accountHolder: "CHU SAN DEMO SOCCER BOOKER",
        transferInstruction: "COC SB-DEMO-0002",
        reportedAmount: 300000,
        depositReportStatus: "REPORTED",
        clientMessage: "Đã chuyển khoản giữ ca 19:00",
        adminNote: null,
        reviewed: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 3,
        bookingCode: "SB-DEMO-0003",
        userId: 2,
        customerName: "Khách hàng Demo",
        customerPhone: "0987654321",
        customerEmail: "client@soccerbooker.vn",
        pitchId: 1,
        bookingDate: "2026-11-20",
        timeSlotId: 3,
        totalPrice: 550000,
        depositAmount: 300000,
        status: "COMPLETED",
        expiresAt: null,
        bankName: "MB Bank",
        accountNumber: "0389999888",
        accountHolder: "CHU SAN DEMO SOCCER BOOKER",
        transferInstruction: "COC SB-DEMO-0003",
        reportedAmount: 300000,
        depositReportStatus: "CONFIRMED",
        clientMessage: null,
        adminNote: "Đã thanh toán đủ tại sân",
        reviewed: true,
        createdAt: "2026-11-20T10:00:00.000Z",
        updatedAt: "2026-11-20T18:00:00.000Z",
      },
    ],
    reviews: [
      {
        review_id: 1,
        booking_id: 3,
        pitch_id: 1,
        client_user_id: 2,
        client_name: "Khách hàng Demo",
        rating: 5,
        comment: "Mặt cỏ FIFA rất êm, đèn sáng rõ, giữ chỗ nhanh.",
        created_at: "2026-11-20T19:30:00.000Z",
      },
      {
        review_id: 2,
        booking_id: 3,
        pitch_id: 4,
        client_user_id: 2,
        client_name: "Đội FC Sinh Viên",
        rating: 5,
        comment: "Sân Thành Phát đẹp, có nước mát và chỗ gửi xe thoải mái.",
        created_at: "2026-11-21T20:15:00.000Z",
      },
    ],
    comments: [
      {
        comment_id: 1,
        target_type: "PITCH",
        target_id: 1,
        author_user_id: 2,
        author_name: "Khách hàng Demo",
        content: "Sân Bách Khoa tối thứ 6 còn trống khung 19:00 không ạ?",
        created_at: "2026-11-24T09:00:00.000Z",
      },
      {
        comment_id: 2,
        target_type: "PITCH",
        target_id: 1,
        author_user_id: 1,
        author_name: "Chủ sân Demo Bách Khoa",
        content: "Bạn xem trực tiếp bảng giờ phía trên nhé, chọn ô Trống là đặt giữ chỗ 4 tiếng được ngay.",
        created_at: "2026-11-24T09:10:00.000Z",
      },
    ],
    services: [
      { id: 1, venueId: 1, name: "Nước suối / Trà đá (Bình)", description: "Thùng nước lạnh phục vụ tại sân", price: 30000, unit: "Bình", status: "ACTIVE" },
      { id: 2, venueId: 1, name: "Thuê áo pít + bóng thi đấu", description: "Bộ 14 áo chia đội và bóng số 5", price: 50000, unit: "Lượt", status: "ACTIVE" },
      { id: 3, venueId: 1, name: "Thuê trọng tài bắt trận", description: "Trọng tài điều hành 90 phút", price: 150000, unit: "Trận", status: "ACTIVE" },
    ],
    slotBlocks: [],
    activityLogs: [
      {
        id: 1,
        userId: 2,
        userName: "Khách hàng Demo",
        actionType: "CREATE_BOOKING",
        targetType: "BOOKING",
        targetId: "2",
        description: "Đặt giữ chỗ 4 giờ đơn SB-DEMO-0002",
        oldValue: null,
        newValue: "WAITING_FOR_DEPOSIT",
        createdAt: nowIso,
      },
      {
        id: 2,
        userId: 1,
        userName: "Chủ sân Demo Bách Khoa",
        actionType: "CONFIRM_DEPOSIT",
        targetType: "BOOKING",
        targetId: "1",
        description: "Xác nhận cọc đơn SB-DEMO-0001",
        oldValue: "WAITING_FOR_DEPOSIT",
        newValue: "CONFIRMED",
        createdAt: nowIso,
      },
      {
        id: 3,
        userId: 1,
        userName: "Chủ sân Demo Bách Khoa",
        actionType: "SETTLE_BOOKING",
        targetType: "BOOKING",
        targetId: "3",
        description: "Chốt hóa đơn hoàn tất đơn SB-DEMO-0003",
        oldValue: "CONFIRMED",
        newValue: "COMPLETED",
        createdAt: "2026-11-20T18:00:00.000Z",
      },
    ],
    notifications: [
      {
        id: 1,
        userId: 1,
        type: "DEPOSIT_REPORTED",
        title: "Khách báo đã chuyển khoản cọc",
        message: "Đơn SB-DEMO-0002 vừa gửi báo cáo chuyển cọc 300.000đ. Vui lòng kiểm tra và xác nhận.",
        targetType: "BOOKING",
        targetId: "2",
        read: false,
        createdAt: nowIso,
        readAt: null,
      },
      {
        id: 2,
        userId: 2,
        type: "BOOKING_CONFIRMED",
        title: "Đặt sân đã được xác nhận",
        message: "Đơn SB-DEMO-0001 tại Cụm Sân Bóng Đá Bách Khoa đã được chủ sân xác nhận cọc.",
        targetType: "BOOKING",
        targetId: "1",
        read: false,
        createdAt: nowIso,
        readAt: null,
      },
    ],
  };
}

function loadDb(): StaticDatabase {
  try {
    const raw = window.localStorage.getItem(DB_STORAGE_KEY);
    if (!raw) {
      const initial = createInitialDb();
      saveDb(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as StaticDatabase;
    if (!parsed || parsed.version !== DB_VERSION || !Array.isArray(parsed.venues)) {
      const initial = createInitialDb();
      saveDb(initial);
      return initial;
    }
    expireHoldsInPlace(parsed);
    return parsed;
  } catch {
    return createInitialDb();
  }
}

function saveDb(db: StaticDatabase): void {
  try {
    window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
  } catch {
    // ignore quota errors in private mode
  }
}

function expireHoldsInPlace(db: StaticDatabase): void {
  const nowMs = Date.now();
  let changed = false;
  for (const b of db.bookings) {
    if ((b.status === "WAITING_FOR_DEPOSIT" || b.status === "PENDING") && b.expiresAt) {
      if (new Date(b.expiresAt).getTime() < nowMs) {
        b.status = "EXPIRED";
        b.updatedAt = new Date().toISOString();
        changed = true;
      }
    }
  }
  if (changed) {
    saveDb(db);
  }
}

function parseBody(config: InternalAxiosRequestConfig): Record<string, unknown> {
  if (!config.data) return {};
  if (typeof config.data === "string") {
    try {
      return JSON.parse(config.data) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (config.data instanceof FormData) {
    const obj: Record<string, unknown> = {};
    config.data.forEach((value, key) => {
      if (typeof value === "string") {
        if (key === "venue" || key === "data") {
          try {
            Object.assign(obj, JSON.parse(value));
          } catch {
            obj[key] = value;
          }
        } else {
          obj[key] = value;
        }
      }
    });
    return obj;
  }
  return config.data as Record<string, unknown>;
}

function makeResponse<T>(config: InternalAxiosRequestConfig, data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status === 201 ? "Created" : "OK",
    headers: new AxiosHeaders(),
    config,
  };
}

function makeError(config: InternalAxiosRequestConfig, status: number, message: string): never {
  const response: AxiosResponse = {
    data: { success: false, message },
    status,
    statusText: "Error",
    headers: new AxiosHeaders(),
    config,
  };
  throw new AxiosError(message, String(status), config, undefined, response);
}

function getCurrentUser(db: StaticDatabase, config: InternalAxiosRequestConfig): StoredUser | null {
  const authHeader =
    (config.headers?.Authorization as string | undefined) ||
    (config.headers?.authorization as string | undefined) ||
    (getTokenFromStorage() ? `Bearer ${getTokenFromStorage()}` : undefined);

  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const match = token.match(/^sb-local-(\d+)$/);
  if (match) {
    const id = Number(match[1]);
    return db.users.find((u) => u.id === id) ?? null;
  }
  const email = window.localStorage.getItem("userEmail");
  if (email) {
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  }
  return null;
}

function getSlotPriceForDate(pitch: StoredPitch, slotNumber: number, dateStr: string): number {
  const cfg = pitch.slotPrices.find((s) => s.slotNumber === slotNumber);
  const dt = new Date(`${dateStr}T00:00:00Z`);
  const day = dt.getUTCDay();
  const isWeekend = day === 0 || day === 6;
  if (!cfg) return 400000;
  return isWeekend ? cfg.weekendPrice : cfg.weekdayPrice;
}

export function resetStaticDemoDatabase(): void {
  const fresh = createInitialDb();
  saveDb(fresh);
}

export const localMockAdapter: AxiosAdapter = async (config) => {
  const db = loadDb();
  const method = (config.method || "get").toUpperCase();
  const rawUrl = config.url || "/";
  const cleanUrl = rawUrl.replace(/^https?:\/\/[^/]+/i, "").replace(/^\/api\/v1/, "");
  const [pathname, queryStr = ""] = cleanUrl.split("?");
  const params = new URLSearchParams(queryStr);
  if (config.params && typeof config.params === "object") {
    for (const [k, v] of Object.entries(config.params as Record<string, unknown>)) {
      if (v !== undefined && v !== null) params.set(k, String(v));
    }
  }
  const body = parseBody(config);
  const currentUser = getCurrentUser(db, config);

  // ==================== 1. AUTH ====================
  if (method === "POST" && pathname === "/auth/login") {
    const identifier = String(body.email || body.identifier || "").trim().toLowerCase();
    const password = String(body.password || "");
    const requestedRole = String(body.role || "PLAYER").toUpperCase();

    const user = db.users.find(
      (u) => u.email.toLowerCase() === identifier || u.phoneNumber === identifier,
    );
    if (!user || user.password !== password) {
      makeError(config, 401, "Email/SĐT hoặc mật khẩu không chính xác.");
    }
    if ((requestedRole === "ADMIN" || requestedRole === "OWNER") && user.role !== "PITCH_OWNER") {
      makeError(config, 403, "Tài khoản này không có quyền Chủ sân.");
    }

    return makeResponse(config, {
      token: `sb-local-${user.id}`,
      type: "Bearer",
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  }

  if (method === "POST" && pathname === "/auth/register") {
    const email = String(body.email || "").trim();
    const phone = String(body.phone || body.phoneNumber || "").trim();
    const username = String(body.username || body.fullName || email.split("@")[0]).trim();
    const password = String(body.password || "");
    const asOwner = Boolean(body.asPitchOwner) || String(body.role || "").toUpperCase().includes("OWNER");

    if (!email || !password || password.length < 6) {
      makeError(config, 400, "Vui lòng nhập đầy đủ email và mật khẩu tối thiểu 6 ký tự.");
    }
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      makeError(config, 409, "Email này đã được đăng ký.");
    }

    const created: StoredUser = {
      id: db.seq.user++,
      username,
      email,
      phoneNumber: phone || "0900000000",
      password,
      role: asOwner ? "PITCH_OWNER" : "CLIENT",
      createdAt: new Date().toISOString(),
    };
    db.users.push(created);
    saveDb(db);

    return makeResponse(
      config,
      {
        token: `sb-local-${created.id}`,
        type: "Bearer",
        id: created.id,
        username: created.username,
        email: created.email,
        role: created.role,
      },
      201,
    );
  }

  if (method === "POST" && pathname === "/auth/refresh-token") {
    if (!currentUser) makeError(config, 401, "Phiên đăng nhập hết hạn.");
    return makeResponse(config, {
      token: `sb-local-${currentUser.id}`,
      type: "Bearer",
      id: currentUser.id,
      username: currentUser.username,
      email: currentUser.email,
      role: currentUser.role,
    });
  }

  if (method === "POST" && (pathname === "/auth/logout" || pathname === "/auth/forgot-password" || pathname === "/auth/reset-password")) {
    return makeResponse(config, { success: true, message: "Thành công (chế độ GitHub Static Demo)." });
  }

  // ==================== 2. USERS ====================
  if (method === "GET" && pathname === "/users/me") {
    if (!currentUser) makeError(config, 401, "Vui lòng đăng nhập.");
    return makeResponse(config, {
      id: currentUser.id,
      username: currentUser.username,
      email: currentUser.email,
      phoneNumber: currentUser.phoneNumber,
      role: currentUser.role,
      avatarUrl: null,
      teamId: null,
      membershipPoints: 120,
      walletBalance: 0,
      createdAt: currentUser.createdAt,
    });
  }

  if (method === "PATCH" && pathname === "/users/me") {
    if (!currentUser) makeError(config, 401, "Vui lòng đăng nhập.");
    if (body.username) currentUser.username = String(body.username).trim();
    if (body.phoneNumber !== undefined) currentUser.phoneNumber = String(body.phoneNumber).trim();
    saveDb(db);
    return makeResponse(config, {
      id: currentUser.id,
      username: currentUser.username,
      email: currentUser.email,
      phoneNumber: currentUser.phoneNumber,
      role: currentUser.role,
    });
  }

  if (method === "PATCH" && pathname === "/users/me/password") {
    if (!currentUser) makeError(config, 401, "Vui lòng đăng nhập.");
    if (String(body.currentPassword || "") !== currentUser.password) {
      makeError(config, 400, "Mật khẩu hiện tại không đúng.");
    }
    currentUser.password = String(body.newPassword || currentUser.password);
    saveDb(db);
    return makeResponse(config, { success: true });
  }

  // ==================== 3. PLAYER VENUES & AVAILABILITY ====================
  if (method === "GET" && pathname === "/player/venues") {
    const content = db.venues
      .filter((v) => v.isActive)
      .map((v) => {
        const venuePitches = db.pitches.filter((p) => p.venueId === v.id && p.isActive);
        const allPrices = venuePitches.flatMap((p) => p.slotPrices.map((s) => s.weekdayPrice));
        const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 300000;
        const venueReviews = db.reviews.filter((r) => venuePitches.some((p) => p.id === r.pitch_id));
        const avg =
          venueReviews.length > 0
            ? Number((venueReviews.reduce((s, r) => s + r.rating, 0) / venueReviews.length).toFixed(1))
            : 5.0;
        return {
          id: v.id,
          name: v.name,
          address: v.address,
          district: v.district,
          province: v.province,
          latitude: v.latitude,
          longitude: v.longitude,
          imageUrl: v.imageUrl,
          minPrice,
          averageRating: avg,
          reviewCount: venueReviews.length,
        };
      });
    return makeResponse(config, { content, totalPages: 1, totalElements: content.length });
  }

  const availMatch = pathname.match(/^\/player\/venues\/(\d+)\/availability$/);
  if (method === "GET" && availMatch) {
    const venueId = Number(availMatch[1]);
    const dateStr = params.get("date") || new Date().toISOString().slice(0, 10);
    const venue = db.venues.find((v) => v.id === venueId);
    if (!venue) makeError(config, 404, "Không tìm thấy cụm sân.");

    const activeStatuses = new Set(["PENDING", "WAITING_FOR_DEPOSIT", "CONFIRMED", "COMPLETED", "NO_SHOW"]);
    const venuePitches = db.pitches.filter((p) => p.venueId === venueId && p.isActive);
    const pitches = venuePitches.map((p) => ({
      pitchId: p.id,
      pitchName: p.name,
      pitchType: p.pitchType,
      slots: db.timeSlots.map((ts) => {
        const blocked = db.slotBlocks.some(
          (blk) => blk.pitchId === p.id && blk.blockDate === dateStr && blk.timeSlotId === ts.timeSlotId,
        );
        const booking = db.bookings.find(
          (b) =>
            b.pitchId === p.id &&
            b.bookingDate === dateStr &&
            b.timeSlotId === ts.timeSlotId &&
            activeStatuses.has(b.status),
        );
        let status: "AVAILABLE" | "BOOKED" | "PENDING" = "AVAILABLE";
        if (blocked) status = "BOOKED";
        else if (booking) {
          status = booking.status === "WAITING_FOR_DEPOSIT" || booking.status === "PENDING" ? "PENDING" : "BOOKED";
        }
        return {
          timeSlotId: ts.timeSlotId,
          slotNumber: ts.slotNumber,
          startTime: ts.startTime,
          endTime: ts.endTime,
          price: getSlotPriceForDate(p, ts.slotNumber, dateStr),
          status,
        };
      }),
    }));

    return makeResponse(config, { venueId: venue.id, venueName: venue.name, date: dateStr, pitches });
  }

  const playerServicesMatch = pathname.match(/^\/player\/venues\/(\d+)\/services$/);
  if (method === "GET" && playerServicesMatch) {
    return makeResponse(config, []);
  }

  // ==================== 4. PLAYER BOOKINGS & DEPOSIT REPORTS ====================
  if (method === "POST" && pathname === "/player/bookings") {
    if (!currentUser) makeError(config, 401, "Vui lòng đăng nhập để đặt sân.");
    const pitchId = Number(body.pitchId);
    const bookingDate = String(body.bookingDate);
    const timeSlotId = Number(body.timeSlotId);

    const pitch = db.pitches.find((p) => p.id === pitchId && p.isActive);
    if (!pitch) makeError(config, 404, "Không tìm thấy sân bóng.");
    const venue = db.venues.find((v) => v.id === pitch.venueId);
    const ts = db.timeSlots.find((s) => s.timeSlotId === timeSlotId);
    if (!ts) makeError(config, 400, "Khung giờ không hợp lệ.");

    const activeStatuses = new Set(["PENDING", "WAITING_FOR_DEPOSIT", "CONFIRMED", "COMPLETED", "NO_SHOW"]);
    const conflict = db.bookings.find(
      (b) =>
        b.pitchId === pitchId &&
        b.bookingDate === bookingDate &&
        b.timeSlotId === timeSlotId &&
        activeStatuses.has(b.status),
    );
    if (conflict) makeError(config, 409, "Khung giờ này vừa có người khác đặt giữ chỗ.");

    const totalPrice = getSlotPriceForDate(pitch, ts.slotNumber, bookingDate);
    const depositAmount = Math.min(pitch.depositAmount || Math.round(totalPrice * 0.5), totalPrice);
    const id = db.seq.booking++;
    const bookingCode = `SB-${bookingDate.replace(/-/g, "")}-${String(id).padStart(4, "0")}`;
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 4 * 3600 * 1000).toISOString();

    const created: StoredBooking = {
      id,
      bookingCode,
      userId: currentUser.id,
      customerName: currentUser.username,
      customerPhone: currentUser.phoneNumber,
      customerEmail: currentUser.email,
      pitchId,
      bookingDate,
      timeSlotId,
      totalPrice,
      depositAmount,
      status: "WAITING_FOR_DEPOSIT",
      expiresAt,
      bankName: "MB Bank",
      accountNumber: "0389999888",
      accountHolder: "CHU SAN DEMO SOCCER BOOKER",
      transferInstruction: `COC ${bookingCode}`,
      reportedAmount: null,
      depositReportStatus: null,
      clientMessage: null,
      adminNote: null,
      reviewed: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    db.bookings.unshift(created);
    db.activityLogs.unshift({
      id: db.seq.log++,
      userId: currentUser.id,
      userName: currentUser.username,
      actionType: "CREATE_BOOKING",
      targetType: "BOOKING",
      targetId: String(id),
      description: `Tạo đơn ${bookingCode} giữ chỗ 4 giờ`,
      oldValue: null,
      newValue: "WAITING_FOR_DEPOSIT",
      createdAt: nowIso,
    });
    saveDb(db);

    return makeResponse(
      config,
      {
        id,
        bookingId: id,
        bookingCode,
        pitchId,
        pitchName: pitch.name,
        venueName: venue?.name ?? "",
        bookingDate,
        startTime: ts.startTime,
        endTime: ts.endTime,
        totalPrice,
        depositAmount,
        status: created.status,
        expiresAt,
        bankName: created.bankName,
        accountNumber: created.accountNumber,
        accountHolder: created.accountHolder,
        transferInstruction: created.transferInstruction,
      },
      201,
    );
  }

  if (method === "GET" && pathname === "/player/bookings") {
    if (!currentUser) makeError(config, 401, "Vui lòng đăng nhập.");
    const content = db.bookings
      .filter((b) => b.userId === currentUser.id)
      .map((b) => {
        const pitch = db.pitches.find((p) => p.id === b.pitchId);
        const venue = pitch ? db.venues.find((v) => v.id === pitch.venueId) : undefined;
        const ts = db.timeSlots.find((s) => s.timeSlotId === b.timeSlotId);
        return {
          id: b.id,
          bookingCode: b.bookingCode,
          pitchId: b.pitchId,
          pitchName: pitch?.name ?? `Sân #${b.pitchId}`,
          venueName: venue?.name ?? "",
          bookingDate: b.bookingDate,
          startTime: ts?.startTime ?? "17:30",
          endTime: ts?.endTime ?? "19:00",
          totalPrice: b.totalPrice,
          depositAmount: b.depositAmount,
          status: b.status,
          expiresAt: b.expiresAt,
          bankName: b.bankName,
          accountNumber: b.accountNumber,
          accountHolder: b.accountHolder,
          transferInstruction: b.transferInstruction,
          reviewed: b.reviewed,
          depositReported: b.depositReportStatus !== null,
        };
      });
    return makeResponse(config, { content, totalPages: 1, totalElements: content.length });
  }

  const cancelMatch = pathname.match(/^\/player\/bookings\/(\d+)\/(?:cancel|cancel-unpaid)$/);
  if ((method === "PATCH" || method === "POST") && cancelMatch) {
    if (!currentUser) makeError(config, 401, "Vui lòng đăng nhập.");
    const bookingId = Number(cancelMatch[1]);
    const booking = db.bookings.find((b) => b.id === bookingId);
    if (!booking) makeError(config, 404, "Không tìm thấy đơn.");
    if (booking.userId !== currentUser.id) makeError(config, 403, "Không có quyền hủy đơn khác.");
    const oldStatus = booking.status;
    booking.status = "CANCELLED";
    booking.expiresAt = null;
    booking.updatedAt = new Date().toISOString();
    db.activityLogs.unshift({
      id: db.seq.log++,
      userId: currentUser.id,
      userName: currentUser.username,
      actionType: "CANCEL_BOOKING",
      targetType: "BOOKING",
      targetId: String(bookingId),
      description: `Khách hủy đơn ${booking.bookingCode}`,
      oldValue: oldStatus,
      newValue: "CANCELLED",
      createdAt: booking.updatedAt,
    });
    saveDb(db);
    return makeResponse(config, { success: true });
  }

  const reschedMatch = pathname.match(/^\/player\/bookings\/(\d+)\/reschedule$/);
  if (method === "PATCH" && reschedMatch) {
    if (!currentUser) makeError(config, 401, "Vui lòng đăng nhập.");
    const bookingId = Number(reschedMatch[1]);
    const booking = db.bookings.find((b) => b.id === bookingId);
    if (!booking) makeError(config, 404, "Không tìm thấy đơn.");
    const nextDate = String(body.bookingDate || booking.bookingDate);
    const nextSlotId = Number(body.timeSlotId || booking.timeSlotId);
    const activeStatuses = new Set(["PENDING", "WAITING_FOR_DEPOSIT", "CONFIRMED", "COMPLETED", "NO_SHOW"]);
    const conflict = db.bookings.find(
      (b) =>
        b.id !== bookingId &&
        b.pitchId === booking.pitchId &&
        b.bookingDate === nextDate &&
        b.timeSlotId === nextSlotId &&
        activeStatuses.has(b.status),
    );
    if (conflict) makeError(config, 409, "Khung giờ mới đã có người đặt.");
    const pitch = db.pitches.find((p) => p.id === booking.pitchId);
    const ts = db.timeSlots.find((s) => s.timeSlotId === nextSlotId);
    if (!pitch || !ts) makeError(config, 400, "Ca mới không hợp lệ.");

    booking.bookingDate = nextDate;
    booking.timeSlotId = nextSlotId;
    booking.totalPrice = getSlotPriceForDate(pitch, ts.slotNumber, nextDate);
    booking.updatedAt = new Date().toISOString();
    saveDb(db);
    return makeResponse(config, {
      id: booking.id,
      pitchId: booking.pitchId,
      pitchName: pitch.name,
      bookingDate: booking.bookingDate,
      startTime: ts.startTime,
      endTime: ts.endTime,
      totalPrice: booking.totalPrice,
      depositAmount: booking.depositAmount,
      status: booking.status,
    });
  }

  const depositReportMatch = pathname.match(/^\/bookings\/(\d+)\/deposit-reports$/);
  if (method === "POST" && depositReportMatch) {
    if (!currentUser) makeError(config, 401, "Vui lòng đăng nhập.");
    const bookingId = Number(depositReportMatch[1]);
    const booking = db.bookings.find((b) => b.id === bookingId);
    if (!booking) makeError(config, 404, "Không tìm thấy đơn.");
    if (booking.userId !== currentUser.id) makeError(config, 403, "Không có quyền báo cọc đơn này.");

    const amount = Number(body.reportedAmount || booking.depositAmount);
    const msg = String(body.clientMessage || "");
    booking.reportedAmount = amount;
    booking.depositReportStatus = "REPORTED";
    booking.clientMessage = msg;
    booking.updatedAt = new Date().toISOString();

    db.notifications.unshift({
      id: db.seq.notification++,
      userId: 1,
      type: "DEPOSIT_REPORTED",
      title: "Khách báo đã chuyển khoản cọc",
      message: `${currentUser.username} vừa báo CK ${amount.toLocaleString("vi-VN")}đ cho đơn ${booking.bookingCode}.`,
      targetType: "BOOKING",
      targetId: String(bookingId),
      read: false,
      createdAt: booking.updatedAt,
      readAt: null,
    });
    db.activityLogs.unshift({
      id: db.seq.log++,
      userId: currentUser.id,
      userName: currentUser.username,
      actionType: "REPORT_DEPOSIT",
      targetType: "BOOKING",
      targetId: String(bookingId),
      description: `Khách báo chuyển khoản ${amount.toLocaleString("vi-VN")}đ (${booking.bookingCode})`,
      oldValue: null,
      newValue: "REPORTED",
      createdAt: booking.updatedAt,
    });
    saveDb(db);
    return makeResponse(config, { success: true, data: booking }, 201);
  }

  // ==================== 5. REVIEWS & COMMENTS ====================
  if (method === "POST" && pathname === "/player/reviews") {
    if (!currentUser) makeError(config, 401, "Vui lòng đăng nhập.");
    const bookingId = Number(body.bookingId);
    const booking = db.bookings.find((b) => b.id === bookingId);
    if (!booking) makeError(config, 404, "Không tìm thấy đơn.");
    const created: StoredReview = {
      review_id: db.seq.review++,
      booking_id: bookingId,
      pitch_id: booking.pitchId,
      client_user_id: currentUser.id,
      client_name: currentUser.username,
      rating: Number(body.rating || 5),
      comment: String(body.content || ""),
      created_at: new Date().toISOString(),
    };
    db.reviews.unshift(created);
    booking.reviewed = true;
    saveDb(db);
    return makeResponse(config, created, 201);
  }

  const pitchReviewsMatch = pathname.match(/^\/pitches\/(\d+)\/reviews$/);
  if (method === "GET" && pitchReviewsMatch) {
    const pitchId = Number(pitchReviewsMatch[1]);
    return makeResponse(config, {
      success: true,
      data: db.reviews.filter((r) => r.pitch_id === pitchId),
    });
  }

  const pitchCommentsMatch = pathname.match(/^\/pitches\/(\d+)\/comments$/);
  if (method === "GET" && pitchCommentsMatch) {
    const pitchId = Number(pitchCommentsMatch[1]);
    return makeResponse(config, {
      success: true,
      data: db.comments.filter((c) => c.target_type === "PITCH" && c.target_id === pitchId),
    });
  }

  if (method === "POST" && pathname === "/comments") {
    if (!currentUser) makeError(config, 401, "Vui lòng đăng nhập để bình luận.");
    const created: StoredComment = {
      comment_id: db.seq.comment++,
      target_type: String(body.targetType || "PITCH"),
      target_id: Number(body.targetId),
      author_user_id: currentUser.id,
      author_name: currentUser.username,
      content: String(body.content || ""),
      created_at: new Date().toISOString(),
    };
    db.comments.unshift(created);
    saveDb(db);
    return makeResponse(config, { success: true, data: created }, 201);
  }

  // ==================== 6. ADMIN / OWNER VENUES & PITCHES ====================
  if (method === "GET" && pathname === "/admin/venues") {
    const content = db.venues
      .filter((v) => v.isActive)
      .map((v) => ({
        id: String(v.id),
        name: v.name,
        address: v.address,
        phone: "0912345678",
        email: "owner@soccerbooker.vn",
      }));
    return makeResponse(config, { content, totalPages: 1, totalElements: content.length });
  }

  if (method === "POST" && pathname === "/admin/venues") {
    const created: StoredVenue = {
      id: db.seq.venue++,
      ownerUserId: currentUser?.id ?? 1,
      name: String(body.name || "Cụm sân mới"),
      address: String(body.address || "Hà Nội"),
      district: "Hà Nội",
      province: "Hà Nội",
      description: String(body.description || ""),
      latitude: 21.0285,
      longitude: 105.8542,
      imageUrl: "./Old_Trafford.jpg",
      openTime: "06:00",
      closeTime: "22:00",
      isActive: true,
    };
    db.venues.push(created);
    saveDb(db);
    return makeResponse(
      config,
      { id: created.id, name: created.name, address: created.address, imageUrl: created.imageUrl, revenue: 0, totalPitches: 0 },
      201,
    );
  }

  const adminVenueUpdateMatch = pathname.match(/^\/admin\/venues\/(\d+)$/);
  if (method === "PUT" && adminVenueUpdateMatch) {
    const venueId = Number(adminVenueUpdateMatch[1]);
    const venue = db.venues.find((v) => v.id === venueId);
    if (!venue) makeError(config, 404, "Không tìm thấy cụm sân.");
    if (body.name) venue.name = String(body.name);
    if (body.address) venue.address = String(body.address);
    saveDb(db);
    return makeResponse(config, {
      id: venue.id,
      name: venue.name,
      address: venue.address,
      imageUrl: venue.imageUrl,
      revenue: 0,
      totalPitches: db.pitches.filter((p) => p.venueId === venue.id && p.isActive).length,
    });
  }

  if (method === "DELETE" && adminVenueUpdateMatch) {
    const venueId = Number(adminVenueUpdateMatch[1]);
    const venue = db.venues.find((v) => v.id === venueId);
    if (venue) venue.isActive = false;
    saveDb(db);
    return makeResponse(config, { success: true });
  }

  const adminVenuePitchesMatch = pathname.match(/^\/admin\/venues\/(\d+)\/pitches$/);
  if (method === "GET" && adminVenuePitchesMatch) {
    const venueId = Number(adminVenuePitchesMatch[1]);
    const venue = db.venues.find((v) => v.id === venueId);
    const content = db.pitches
      .filter((p) => p.venueId === venueId && p.isActive)
      .map((p) => ({
        id: p.id,
        name: p.name,
        pitchType: p.pitchType === "SAN_5" ? "5" : p.pitchType === "SAN_11" ? "11" : "7",
        isActive: p.isActive,
        venueId: p.venueId,
        venueName: venue?.name ?? "",
        basePrice: p.slotPrices[0]?.weekdayPrice ?? 300000,
        slotPrices: p.slotPrices,
      }));
    return makeResponse(config, { content, totalPages: 1, totalElements: content.length });
  }

  if (method === "POST" && adminVenuePitchesMatch) {
    const venueId = Number(adminVenuePitchesMatch[1]);
    const venue = db.venues.find((v) => v.id === venueId);
    const pTypeRaw = String(body.pitchType || "SAN_7");
    const pitchType: "SAN_5" | "SAN_7" | "SAN_11" =
      pTypeRaw.includes("5") ? "SAN_5" : pTypeRaw.includes("11") ? "SAN_11" : "SAN_7";
    const incomingPrices = Array.isArray(body.slotPrices)
      ? (body.slotPrices as SlotPriceConfig[])
      : makeSlotPrices(pitchType === "SAN_5" ? "5" : pitchType === "SAN_11" ? "11" : "7");
    const created: StoredPitch = {
      id: db.seq.pitch++,
      venueId,
      name: String(body.name || "Sân mới"),
      pitchType,
      isActive: body.isActive !== false,
      depositAmount: 300000,
      slotPrices: incomingPrices,
    };
    db.pitches.push(created);
    saveDb(db);
    return makeResponse(
      config,
      {
        id: created.id,
        name: created.name,
        pitchType: pitchType === "SAN_5" ? "5" : pitchType === "SAN_11" ? "11" : "7",
        isActive: created.isActive,
        venueId,
        venueName: venue?.name ?? "",
        basePrice: created.slotPrices[0]?.weekdayPrice ?? 300000,
        slotPrices: created.slotPrices,
      },
      201,
    );
  }

  const adminPitchMatch = pathname.match(/^\/admin\/pitches\/(\d+)$/);
  if (method === "PUT" && adminPitchMatch) {
    const pitchId = Number(adminPitchMatch[1]);
    const pitch = db.pitches.find((p) => p.id === pitchId);
    if (!pitch) makeError(config, 404, "Không tìm thấy sân con.");
    if (body.name) pitch.name = String(body.name);
    if (body.pitchType) {
      const t = String(body.pitchType);
      pitch.pitchType = t.includes("5") ? "SAN_5" : t.includes("11") ? "SAN_11" : "SAN_7";
    }
    if (body.isActive !== undefined) pitch.isActive = Boolean(body.isActive);
    if (Array.isArray(body.slotPrices)) pitch.slotPrices = body.slotPrices as SlotPriceConfig[];
    saveDb(db);
    return makeResponse(config, {
      id: pitch.id,
      name: pitch.name,
      pitchType: pitch.pitchType === "SAN_5" ? "5" : pitch.pitchType === "SAN_11" ? "11" : "7",
      isActive: pitch.isActive,
      venueId: pitch.venueId,
      slotPrices: pitch.slotPrices,
    });
  }

  if (method === "DELETE" && adminPitchMatch) {
    const pitchId = Number(adminPitchMatch[1]);
    const pitch = db.pitches.find((p) => p.id === pitchId);
    if (pitch) pitch.isActive = false;
    saveDb(db);
    return makeResponse(config, { success: true });
  }

  const adminServicesMatch = pathname.match(/^\/admin\/venues\/(\d+)\/services$/);
  if (method === "GET" && adminServicesMatch) {
    const venueId = Number(adminServicesMatch[1]);
    return makeResponse(config, db.services.filter((s) => s.venueId === venueId || s.venueId === 1));
  }
  if (method === "POST" && adminServicesMatch) {
    const venueId = Number(adminServicesMatch[1]);
    const item: StoredService = {
      id: db.seq.service++,
      venueId,
      name: String(body.name || "Dịch vụ mới"),
      description: body.description ? String(body.description) : null,
      price: Number(body.price || 20000),
      unit: String(body.unit || "Lượt"),
      status: "ACTIVE",
    };
    db.services.push(item);
    saveDb(db);
    return makeResponse(config, item, 201);
  }

  // ==================== 7. ADMIN BOOKINGS, SCHEDULES & STATS ====================
  if (method === "GET" && pathname === "/admin/bookings") {
    const venueIdParam = params.get("venueId");
    const filterVenueId = venueIdParam && venueIdParam !== "all" ? Number(venueIdParam) : null;
    const content = db.bookings
      .filter((b) => {
        if (!filterVenueId) return true;
        const p = db.pitches.find((x) => x.id === b.pitchId);
        return p?.venueId === filterVenueId;
      })
      .map((b) => {
        const p = db.pitches.find((x) => x.id === b.pitchId);
        const v = p ? db.venues.find((x) => x.id === p.venueId) : undefined;
        const ts = db.timeSlots.find((s) => s.timeSlotId === b.timeSlotId);
        return {
          id: b.id,
          bookingCode: b.bookingCode,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          venueName: v?.name ?? "",
          pitchName: p?.name ?? "",
          bookingDate: b.bookingDate,
          startTime: ts?.startTime ?? "17:30",
          endTime: ts?.endTime ?? "19:00",
          totalPrice: b.totalPrice,
          depositAmount: b.depositAmount,
          status: b.status,
          depositReportStatus: b.depositReportStatus,
          reportedAmount: b.reportedAmount,
        };
      });
    return makeResponse(config, { content, totalPages: 1, totalElements: content.length });
  }

  if (method === "GET" && pathname === "/admin/bookings/schedules") {
    const dateStr = params.get("date") || new Date().toISOString().slice(0, 10);
    const venueIdParam = params.get("venueId");
    const filterVenueId = venueIdParam && venueIdParam !== "ALL" && venueIdParam !== "all" ? Number(venueIdParam) : null;
    const activeStatuses = new Set(["PENDING", "WAITING_FOR_DEPOSIT", "CONFIRMED", "COMPLETED", "NO_SHOW"]);

    const schedules = db.pitches
      .filter((p) => p.isActive && (!filterVenueId || p.venueId === filterVenueId))
      .map((p) => {
        const v = db.venues.find((x) => x.id === p.venueId);
        return {
          pitchId: p.id,
          pitchName: p.name,
          venueName: v?.name ?? "",
          slots: db.timeSlots.map((ts) => {
            const blk = db.slotBlocks.find(
              (b) => b.pitchId === p.id && b.blockDate === dateStr && b.timeSlotId === ts.timeSlotId,
            );
            const booking = db.bookings.find(
              (b) =>
                b.pitchId === p.id &&
                b.bookingDate === dateStr &&
                b.timeSlotId === ts.timeSlotId &&
                activeStatuses.has(b.status),
            );
            let status: "AVAILABLE" | "BOOKED" | "MAINTENANCE" = "AVAILABLE";
            if (blk) status = "MAINTENANCE";
            else if (booking) status = "BOOKED";
            return {
              timeSlotId: ts.timeSlotId,
              slotNumber: ts.slotNumber,
              startTime: ts.startTime,
              endTime: ts.endTime,
              status,
              customerName: booking?.customerName ?? (blk ? blk.reason : null),
              customerPhone: booking?.customerPhone ?? null,
              depositAmount: booking?.depositAmount ?? 0,
              price: getSlotPriceForDate(p, ts.slotNumber, dateStr),
            };
          }),
        };
      });
    return makeResponse(config, schedules);
  }

  const adminStatusMatch = pathname.match(/^\/admin\/bookings\/(\d+)\/status$/);
  if (method === "PATCH" && adminStatusMatch) {
    const bookingId = Number(adminStatusMatch[1]);
    const booking = db.bookings.find((b) => b.id === bookingId);
    if (!booking) makeError(config, 404, "Không tìm thấy đơn.");
    const raw = String(body.status || "").toUpperCase();
    const oldStatus = booking.status;
    booking.status =
      raw === "BOOKED" || raw === "CONFIRMED"
        ? "CONFIRMED"
        : raw === "COMPLETED"
        ? "COMPLETED"
        : raw === "NO_SHOW"
        ? "NO_SHOW"
        : "CANCELLED";
    if (booking.status === "CONFIRMED") {
      booking.depositReportStatus = "CONFIRMED";
      booking.expiresAt = null;
    }
    booking.adminNote = String(body.adminNote || booking.adminNote || "");
    booking.updatedAt = new Date().toISOString();

    db.activityLogs.unshift({
      id: db.seq.log++,
      userId: currentUser?.id ?? 1,
      userName: currentUser?.username ?? "Chủ sân",
      actionType: `STATUS_${booking.status}`,
      targetType: "BOOKING",
      targetId: String(bookingId),
      description: booking.adminNote || `Chuyển đơn ${booking.bookingCode} sang ${booking.status}`,
      oldValue: oldStatus,
      newValue: booking.status,
      createdAt: booking.updatedAt,
    });
    saveDb(db);
    return makeResponse(config, { success: true });
  }

  const adminBookingDetailMatch = pathname.match(/^\/admin\/bookings\/(\d+)$/);
  if (method === "GET" && adminBookingDetailMatch) {
    const bookingId = Number(adminBookingDetailMatch[1]);
    const b = db.bookings.find((x) => x.id === bookingId);
    if (!b) makeError(config, 404, "Không tìm thấy đơn.");
    const p = db.pitches.find((x) => x.id === b.pitchId);
    const v = p ? db.venues.find((x) => x.id === p.venueId) : undefined;
    const ts = db.timeSlots.find((s) => s.timeSlotId === b.timeSlotId);
    return makeResponse(config, {
      id: b.id,
      venueId: v?.id ?? 1,
      venueName: v?.name ?? "",
      pitchName: p?.name ?? "",
      bookingDate: b.bookingDate,
      startTime: ts?.startTime ?? "17:30",
      endTime: ts?.endTime ?? "19:00",
      status: b.status,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      customerEmail: b.customerEmail,
      totalPrice: b.totalPrice,
      depositAmount: b.depositAmount,
      paymentStatus: b.depositReportStatus ?? "PENDING",
      adminNote: b.adminNote,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      addOns: [],
    });
  }

  const availSvcMatch = pathname.match(/^\/admin\/bookings\/(\d+)\/available-services$/);
  if (method === "GET" && availSvcMatch) {
    return makeResponse(config, db.services.filter((s) => s.status === "ACTIVE"));
  }

  const settleMatch = pathname.match(/^\/admin\/bookings\/(\d+)\/settle$/);
  if (method === "POST" && settleMatch) {
    const bookingId = Number(settleMatch[1]);
    const b = db.bookings.find((x) => x.id === bookingId);
    if (!b) makeError(config, 404, "Không tìm thấy đơn.");
    const addOnTotal = Array.isArray(body.services)
      ? (body.services as Array<{ serviceId: number; quantity: number }>).reduce((sum, item) => {
          const svc = db.services.find((s) => s.id === Number(item.serviceId));
          return sum + (svc ? svc.price * Number(item.quantity || 0) : 0);
        }, 0)
      : 0;
    const oldStatus = b.status;
    b.totalPrice += addOnTotal;
    b.status = "COMPLETED";
    b.adminNote = String(body.adminNote || "Đã chốt hóa đơn hoàn tất");
    b.updatedAt = new Date().toISOString();
    db.activityLogs.unshift({
      id: db.seq.log++,
      userId: currentUser?.id ?? 1,
      userName: currentUser?.username ?? "Chủ sân",
      actionType: "SETTLE_BOOKING",
      targetType: "BOOKING",
      targetId: String(bookingId),
      description: `Chốt hóa đơn ${b.bookingCode} (${b.totalPrice.toLocaleString("vi-VN")}đ)`,
      oldValue: oldStatus,
      newValue: "COMPLETED",
      createdAt: b.updatedAt,
    });
    saveDb(db);
    return makeResponse(config, {
      id: b.id,
      status: b.status,
      totalPrice: b.totalPrice,
      depositAmount: b.depositAmount,
      adminNote: b.adminNote,
    });
  }

  const invoiceMatch = pathname.match(/^\/(?:admin|player)\/bookings\/(\d+)\/invoice\.pdf$/);
  if (method === "GET" && invoiceMatch) {
    const bookingId = Number(invoiceMatch[1]);
    const b = db.bookings.find((x) => x.id === bookingId);
    const text = `SOCCER BOOKER INVOICE\nCode: ${b?.bookingCode ?? bookingId}\nCustomer: ${b?.customerName ?? "Demo"}\nDate: ${b?.bookingDate ?? ""}\nTotal: ${b?.totalPrice ?? 0} VND\nDeposit: ${b?.depositAmount ?? 0} VND\nStatus: ${b?.status ?? ""}\n`;
    return makeResponse(config, new Blob([text], { type: "application/pdf" }));
  }

  if (method === "GET" && pathname === "/admin/dashboard/stats") {
    const facilityIdParam = params.get("facilityId");
    const filterVenueId =
      facilityIdParam && facilityIdParam !== "ALL" && facilityIdParam !== "all"
        ? Number(facilityIdParam)
        : null;
    const relevantPitches = db.pitches.filter(
      (p) => p.isActive && (!filterVenueId || p.venueId === filterVenueId),
    );
    const pitchIds = new Set(relevantPitches.map((p) => p.id));
    const relevantBookings = db.bookings.filter((b) => pitchIds.has(b.pitchId));
    const totalRevenue = relevantBookings
      .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
      .reduce((s, b) => s + b.totalPrice, 0);
    const canceledBookings = relevantBookings.filter((b) =>
      ["CANCELLED", "REJECTED", "EXPIRED"].includes(b.status),
    ).length;
    const uniqueCustomers = new Set(relevantBookings.map((b) => b.userId)).size;
    const totalSlots = Math.max(relevantPitches.length * 6, 1);
    const occupancyRate = Math.min(100, Math.round((relevantBookings.length / totalSlots) * 100));

    const pitchPerformances = relevantPitches
      .map((p) => {
        const list = relevantBookings.filter((b) => b.pitchId === p.id);
        return {
          pitchId: p.id,
          pitchName: p.name,
          bookingCount: list.filter((b) => ["CONFIRMED", "COMPLETED", "WAITING_FOR_DEPOSIT"].includes(b.status)).length,
          revenue: list
            .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
            .reduce((s, b) => s + b.totalPrice, 0),
        };
      })
      .sort((a, b) => b.bookingCount - a.bookingCount);

    return makeResponse(config, {
      totalRevenue,
      totalBookings: relevantBookings.length,
      canceledBookings,
      uniqueCustomers,
      occupancyRate,
      pitchPerformances,
    });
  }

  if (method === "GET" && pathname === "/admin/dashboard/recent-orders") {
    const recent = db.bookings.slice(0, 8).map((b) => {
      const p = db.pitches.find((x) => x.id === b.pitchId);
      const ts = db.timeSlots.find((s) => s.timeSlotId === b.timeSlotId);
      return {
        id: b.bookingCode || `#${b.id}`,
        customerName: b.customerName,
        fieldName: p?.name ?? `Sân #${b.pitchId}`,
        bookingTime: `${b.bookingDate} ${ts?.startTime ?? "17:30"}`,
        price: b.totalPrice,
        status: b.status,
      };
    });
    return makeResponse(config, recent);
  }

  if (method === "GET" && pathname === "/admin/activity-logs") {
    const size = Number(params.get("size") || 10);
    const page = Number(params.get("page") || 0);
    const slice = db.activityLogs.slice(page * size, page * size + size);
    return makeResponse(config, {
      content: slice,
      totalPages: Math.max(1, Math.ceil(db.activityLogs.length / size)),
      totalElements: db.activityLogs.length,
      size,
      number: page,
    });
  }

  // ==================== 8. NOTIFICATIONS ====================
  if (method === "GET" && pathname === "/notifications") {
    const userId = currentUser?.id;
    const list = db.notifications.filter((n) => !userId || !n.userId || n.userId === userId);
    return makeResponse(config, { content: list.slice(0, 12), totalElements: list.length, totalPages: 1, size: 12, number: 0 });
  }
  if (method === "GET" && pathname === "/notifications/unread-count") {
    const userId = currentUser?.id;
    const unreadCount = db.notifications.filter((n) => (!userId || !n.userId || n.userId === userId) && !n.read).length;
    return makeResponse(config, { unreadCount });
  }
  const notifReadMatch = pathname.match(/^\/notifications\/(\d+)\/read$/);
  if (method === "PATCH" && notifReadMatch) {
    const id = Number(notifReadMatch[1]);
    const item = db.notifications.find((n) => n.id === id);
    if (item) {
      item.read = true;
      item.readAt = new Date().toISOString();
      saveDb(db);
    }
    return makeResponse(config, item ?? {});
  }
  if (method === "PATCH" && pathname === "/notifications/read-all") {
    const nowIso = new Date().toISOString();
    for (const n of db.notifications) {
      n.read = true;
      n.readAt = nowIso;
    }
    saveDb(db);
    return makeResponse(config, { success: true });
  }

  // Default fallback for unhandled endpoints in demo mode
  return makeResponse(config, {});
};
