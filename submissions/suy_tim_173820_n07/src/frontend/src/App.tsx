import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import AppLayout from './DoctorDashboard/AppLayout';
import PatientPortal from './PatientDashboard/PatientPortal'; // Import giao diện dành cho Bệnh nhân
import AdminPortal from './AdminDashboard/AdminPortal'; // Import giao diện dành cho Quản trị viên (Admin)

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, []);

  const handleLoginSuccess = (token: string, role: string, username: string) => {
    // Lưu thông tin phiên làm việc vào localStorage
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_role', role);
    localStorage.setItem('username', username);
    
    setIsAuthenticated(true);
    setUserRole(role);
  };

  // Nếu đã đăng nhập thành công -> Phân quyền giao diện theo vai trò (RBAC)
  if (isAuthenticated) {
    // Chuẩn hóa role về chữ hoa để tránh lỗi lệch định dạng (patient -> PATIENT)
    const normalizedRole = userRole ? userRole.toUpperCase() : '';
    const currentUsername = localStorage.getItem('username') || 'Bệnh nhân Ngoại trú';

    return (
      <div className="App">
        {normalizedRole === 'PATIENT' ? (
          <PatientPortal username={currentUsername} />
        ) : normalizedRole === 'ADMIN' ? (
          <AdminPortal />
        ) : (
          <AppLayout />
        )}
      </div>
    );
  }

  // Nếu chọn màn hình Đăng ký tài khoản mới
  if (currentView === 'register') {
    return (
      <Register 
        onRegisterSuccess={() => setCurrentView('login')} 
        onSwitchToLogin={() => setCurrentView('login')} 
      />
    );
  }

  // Mặc định hiển thị màn hình Đăng nhập
  return (
    <Login 
      onLoginSuccess={handleLoginSuccess} 
      onSwitchToRegister={() => setCurrentView('register')} 
    />
  );
}