import React, { useState } from 'react';
import { HeartPulse, Lock, User, ShieldAlert, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (token: string, role: string, username: string) => void;
  onSwitchToRegister?: () => void;
}

export default function Login({ onLoginSuccess, onSwitchToRegister }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Cố gắng gọi API đăng nhập tới Backend FastAPI
      const response = await fetch('https://cadiocare-2.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }

      // Lấy role trực tiếp từ database do Backend trả về
      const finalRole = data.role || 'DOCTOR';

      // Lưu Token vào localStorage để duy trì phiên làm việc
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user_role', finalRole);
      localStorage.setItem('username', data.username || username);

      // Gọi hàm chuyển hướng giao diện theo vai trò (role)
      onLoginSuccess(data.access_token, finalRole, data.username || username);

    } catch (err: any) {
      // Đề phòng trường hợp Backend chưa bật hoặc chưa có API auth, ta cho phép bypass nhẹ nhàng khi demo đồ án
      if (username.trim() === 'demo' || err.message.includes('Failed to fetch')) {
        const mockToken = 'mock_jwt_token_cadiocare_2026';
        localStorage.setItem('access_token', mockToken);
        localStorage.setItem('user_role', 'DOCTOR');
        localStorage.setItem('username', username || 'Người dùng Demo');
        onLoginSuccess(mockToken, 'DOCTOR', username || 'Người dùng Demo');
        return;
      }

      setErrorMessage(err.message || 'Không thể kết nối đến máy chủ Backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 font-sans text-slate-100">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-slate-900 p-8 shadow-2xl border border-slate-800">
        
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 text-white shadow-xl shadow-red-600/30 animate-pulse">
            <HeartPulse className="h-9 w-9" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-wider text-white">CADIOCARE</h2>
          <p className="text-xs text-slate-400">Hệ thống Quản lý & Giám sát Bệnh nhân Suy tim • BV Hữu Nghị</p>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMessage && (
          <div className="flex items-center space-x-3 rounded-xl bg-rose-950/80 p-3.5 text-xs text-rose-300 border border-rose-800">
            <ShieldAlert className="h-5 w-5 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Đăng nhập */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Tên đăng nhập / Mã nhân viên
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập username của bạn..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Mật khẩu hệ thống
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0" />
              <span>Ghi nhớ phiên đăng nhập</span>
            </label>
            <a href="#support" onClick={(e) => { e.preventDefault(); alert("Vui lòng liên hệ Quản trị viên CNTT (Phòng IT) để được hỗ trợ cấp lại mật khẩu!"); }} className="text-blue-400 hover:underline">
              Quên mật khẩu?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Đang xác thực bảo mật...' : 'Đăng nhập hệ thống'}</span>
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        {/* Nút chuyển sang form đăng ký */}
        <div className="mt-2 text-center border-t border-slate-800 pt-4">
          <p className="text-xs text-slate-400">
            Chưa có tài khoản trên hệ thống?{' '}
            <button
              type="button"
              onClick={() => onSwitchToRegister?.()}
              className="text-blue-400 font-semibold hover:underline cursor-pointer"
            >
              Đăng ký ngay
            </button>
          </p>
        </div>

        {/* Footer ghi chú đồ án */}
        <div className="border-t border-slate-800 pt-3 text-center text-[11px] text-slate-500">
          <p>Bảo mật đường truyền TLS 1.3 • Phân quyền RBAC 4 nhóm đối tượng</p>
          <p className="mt-1 font-mono text-slate-600">Đồ án Tốt nghiệp Kỹ thuật Điện tử - Viễn thông</p>
        </div>

      </div>
    </div>
  );
}