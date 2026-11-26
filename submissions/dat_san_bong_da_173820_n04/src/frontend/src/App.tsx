import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AdminProtectedRoute } from "./features/auth/components/AdminProtectedRoute";
import { ToastContainer } from "./shared/components/Toast/Toast.tsx";

const LandingPage = lazy(() => import("./pages/LandingPage").then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import("./pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() =>
  import("./pages/auth/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import("./pages/auth/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage })),
);
const BookingPage = lazy(() => import("./pages/player/BookingPage.tsx").then((m) => ({ default: m.BookingPage })));
const BookingField = lazy(() => import("./pages/player/BookingField.tsx").then((m) => ({ default: m.BookingField })));
const ProfilePage = lazy(() => import("./pages/player/ProfilePage.tsx").then((m) => ({ default: m.ProfilePage })));
const CheckoutPage = lazy(() => import("./pages/player/CheckoutPage.tsx").then((m) => ({ default: m.CheckoutPage })));
const PaymentResultPage = lazy(() =>
  import("./pages/player/PaymentResultPage.tsx").then((m) => ({ default: m.PaymentResultPage })),
);
const ForbiddenPage = lazy(() => import("./pages/ForbiddenPage").then((m) => ({ default: m.ForbiddenPage })));

const AdminLayout = lazy(() => import("./layouts/admin/AdminLayout.tsx").then((m) => ({ default: m.AdminLayout })));
const AdminDashboardPage = lazy(() =>
  import("./pages/admin/AdminDashboardPage.tsx").then((m) => ({ default: m.AdminDashboardPage })),
);
const FieldSchedulePage = lazy(() =>
  import("./pages/admin/FieldSchedulePage").then((m) => ({ default: m.FieldSchedulePage })),
);
const OrdersPage = lazy(() => import("./pages/admin/OrdersPage.tsx").then((m) => ({ default: m.OrdersPage })));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage").then((m) => ({ default: m.SettingsPage })));

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#005E2E] text-sm font-semibold text-white/90">
      Đang tải trang...
    </div>
  );
}

function App() {
  return (
    <>
      <ToastContainer />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/booking/:fieldId" element={<BookingField />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/booking" element={<BookingPage />} />
          {/* Nhánh 3 (Giải đấu) tạm hoãn trong bản Demo */}
          <Route path="/match" element={<Navigate to="/" replace />} />
          <Route path="/team" element={<Navigate to="/" replace />} />
          <Route path="/leagues" element={<Navigate to="/" replace />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment/vnpay-return" element={<PaymentResultPage />} />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="bookings" element={<Navigate to="/admin/orders" replace />} />
            <Route path="schedule" element={<FieldSchedulePage />} />
            <Route path="teams" element={<Navigate to="/admin" replace />} />
            <Route path="matchmaking" element={<Navigate to="/admin" replace />} />
            <Route path="leagues" element={<Navigate to="/admin" replace />} />
            <Route path="calendar" element={<Navigate to="/admin/schedule" replace />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
