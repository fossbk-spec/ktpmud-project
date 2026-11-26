import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Check,
  Clock,
  Copy,
  CreditCard,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "react-toastify";

import apiClient from "@/shared/api/apiClient";
import { Button } from "@/shared/components/Button";
import { cancelUnpaidBooking } from "@/features/booking/api/bookingApi";
import { getApiErrorMessage } from "@/shared/utils/apiError";

interface CheckoutBookingState {
  bookingId: string;
  bookingCode?: string;
  pitchName?: string;
  venueName?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number | string;
  depositAmount?: number | string;
  expiresAt?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
  transferInstruction?: string | null;
}

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatCurrency = (amount: number): string =>
  `${Math.round(amount).toLocaleString("vi-VN")} VNĐ`;

function formatCountdown(expiresAt: string | null | undefined, nowMs: number): string {
  if (!expiresAt) return "04:00:00 (4 giờ giữ chỗ)";
  const targetMs = new Date(expiresAt).getTime();
  if (!Number.isFinite(targetMs)) return "04:00:00";
  const diffSec = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  if (diffSec === 0) return "Đã hết hạn giữ chỗ";
  const hours = Math.floor(diffSec / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((diffSec % 3600) / 60).toString().padStart(2, "0");
  const seconds = (diffSec % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = (location.state?.bookingData as CheckoutBookingState | undefined) ?? null;

  const totalPrice = toNumber(bookingData?.totalPrice);
  const depositAmount = useMemo(() => {
    const rawDeposit = toNumber(bookingData?.depositAmount);
    return rawDeposit > 0 ? rawDeposit : Math.round(totalPrice * 0.5);
  }, [bookingData?.depositAmount, totalPrice]);

  const [reportedAmount, setReportedAmount] = useState<string>(() =>
    depositAmount > 0 ? String(Math.round(depositAmount)) : "",
  );
  const [clientMessage, setClientMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!bookingData) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-900">
          Không tìm thấy thông tin giữ chỗ đặt sân
        </h2>
        <Button onClick={() => navigate("/booking")}>Quay lại chọn sân</Button>
      </div>
    );
  }

  const bankName = bookingData.bankName || "MB Bank (Ngân hàng TMCP Quân đội)";
  const accountNumber = bookingData.accountNumber || "0389999888";
  const accountHolder = bookingData.accountHolder || "CHU SAN DEMO SOCCER BOOKER";
  const transferContent =
    bookingData.transferInstruction ||
    `COC ${bookingData.bookingCode || bookingData.bookingId}`;
  const countdownText = formatCountdown(bookingData.expiresAt, nowMs);

  const handleCopy = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      toast.info(`Nội dung: ${value}`);
    }
  };

  const handleCancelHold = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const ids = String(bookingData.bookingId)
        .split("-")
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => Number.isFinite(id) && id > 0);
      await Promise.all(ids.map((id) => cancelUnpaidBooking(id)));
      toast.success("Đã hủy giữ chỗ đặt sân.");
      navigate("/booking");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể hủy giữ chỗ."));
      setIsSubmitting(false);
    }
  };

  const handleSubmitDepositReport = async () => {
    const parsedAmount = Number(reportedAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Vui lòng nhập số tiền cọc hợp lệ đã chuyển khoản.");
      return;
    }

    setIsSubmitting(true);
    try {
      const ids = String(bookingData.bookingId)
        .split("-")
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => Number.isFinite(id) && id > 0);

      const perBookingAmount =
        ids.length > 1 ? Math.round(parsedAmount / ids.length) : parsedAmount;

      await Promise.all(
        ids.map((id) =>
          apiClient.post(`/bookings/${id}/deposit-reports`, {
            reportedAmount: perBookingAmount,
            clientMessage:
              clientMessage.trim() ||
              `Đã chuyển khoản cọc theo nội dung ${transferContent}`,
          }),
        ),
      );

      toast.success(
        "Đã gửi xác nhận chuyển cọc thành công! Chủ sân sẽ kiểm tra và duyệt đơn của bạn.",
      );
      navigate("/profile", { state: { tab: "history" } });
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể gửi báo cáo chuyển cọc. Vui lòng thử lại.",
        ),
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto mt-8 max-w-2xl px-4 pb-16">
      <button
        type="button"
        onClick={() => navigate("/profile", { state: { tab: "history" } })}
        disabled={isSubmitting}
        className="mb-5 flex items-center text-sm font-medium text-gray-600 transition hover:text-gray-900 disabled:opacity-50"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Xem lịch sử đặt sân
      </button>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
        <div className="mb-5 border-b border-gray-100 pb-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5" />
            Đang giữ chỗ 4 giờ • Còn lại: {countdownText}
          </span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Chuyển Khoản Đặt Cọc Giữ Sân
          </h1>
          {bookingData.bookingCode ? (
            <p className="mt-1 text-sm font-mono font-semibold text-emerald-700">
              Mã đơn: {bookingData.bookingCode}
            </p>
          ) : null}
        </div>

        {/* Booking summary */}
        <div className="mb-6 space-y-2.5 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
          {bookingData.venueName ? (
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Cụm sân:</span>
              <span className="font-semibold text-right text-gray-900">
                {bookingData.venueName}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Sân bóng:</span>
            <span className="font-semibold text-right text-gray-900">
              {bookingData.pitchName || "Sân bóng"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Ngày đá &amp; Khung giờ:</span>
            <span className="font-semibold text-right text-gray-900">
              {bookingData.bookingDate} • {bookingData.startTime} -{" "}
              {bookingData.endTime}
            </span>
          </div>
          <div className="flex justify-between gap-4 border-t border-gray-200 pt-2">
            <span className="text-gray-600">Tổng giá thuê sân:</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(totalPrice)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-bold text-emerald-800">Tiền cọc cần chuyển:</span>
            <span className="text-lg font-bold text-emerald-700">
              {formatCurrency(depositAmount)}
            </span>
          </div>
          <div className="flex justify-between gap-4 text-xs text-gray-500">
            <span>Phần còn lại thanh toán tại sân sau khi đá:</span>
            <span>{formatCurrency(Math.max(0, totalPrice - depositAmount))}</span>
          </div>
        </div>

        {/* Owner Bank Transfer Info */}
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-900">
            <Building2 className="h-4 w-4 text-emerald-700" />
            Thông tin tài khoản nhận cọc của Chủ sân
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-600">Ngân hàng:</span>
              <span className="font-semibold text-gray-900">{bankName}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-600">Số tài khoản:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-emerald-800">
                  {accountNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy("accountNumber", accountNumber)}
                  className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-white px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  {copiedField === "accountNumber" ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Đã chép
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Sao chép
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-600">Chủ tài khoản:</span>
              <span className="font-semibold text-gray-900">{accountHolder}</span>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-emerald-200/70 pt-2">
              <span className="text-gray-600">Nội dung CK:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-gray-900">
                  {transferContent}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy("transfer", transferContent)}
                  className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-white px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  {copiedField === "transfer" ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Đã chép
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Sao chép
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Deposit report input form */}
        <div className="mb-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">
              Số tiền đã chuyển khoản (VNĐ)
            </span>
            <input
              type="number"
              min={1000}
              step={1000}
              value={reportedAmount}
              onChange={(e) => setReportedAmount(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-600"
              placeholder="Ví dụ: 350000"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">
              Ghi chú / Mã giao dịch (tùy chọn)
            </span>
            <input
              type="text"
              value={clientMessage}
              onChange={(e) => setClientMessage(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-emerald-600"
              placeholder={`VD: Đã chuyển khoản ${formatCurrency(depositAmount)} (${transferContent})`}
            />
          </label>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleSubmitDepositReport}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 py-3 text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang gửi xác nhận cọc...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Xác nhận đã chuyển khoản cọc
              </>
            )}
          </Button>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => navigate("/profile", { state: { tab: "history" } })}
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <CreditCard className="h-4 w-4" />
              Chuyển sau (Giữ 4h)
            </button>
            <button
              type="button"
              onClick={handleCancelHold}
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
            >
              Hủy giữ chỗ này
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
