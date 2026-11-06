import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './middlewares/ProtectedRoute';

// Шаг 1: Главная страница
import LandingPage from './pages/LandingPage';

// Следующие страницы мы будем подключать пошагово по твоей команде «следующая страница»:
import TeacherLoginPage from './pages/TeacherLoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import TeacherRegisterPage from './pages/TeacherRegisterPage';
import StudentLoginPage from './pages/StudentLoginPage';
import StudentRegisterPage from './pages/StudentRegisterPage';
import TeacherDashboardPage from './pages/TeacherDashBoardPage';
import StudentDashboardPage from './pages/StudentDashBoardPage';
import AdminLoginPage from './pages/AdminPage';
// import StudentLoginPage from './pages/StudentLoginPage';
// import TeacherRegisterPage from './pages/TeacherRegisterPage';
// import StudentRegisterPage from './pages/StudentRegisterPage';
// import VerifyOtpPage from './pages/VerifyOtpPage';
// import PasswordResetPage from './pages/PasswordResetPage';
// import TeacherDashboardPage from './pages/TeacherDashboardPage';
// import TeacherCourseDetailsPage from './pages/TeacherCourseDetailsPage';
// import StudentDashboardPage from './pages/StudentDashboardPage';
// import StudentTopicPage from './pages/StudentTopicPage';
// import StudentSubmissionsPage from './pages/StudentSubmissionsPage';
// import ProfileSettingsPage from './pages/ProfileSettingsPage';
// import AdminConsolePage from './pages/AdminConsolePage';

export default function App() {
  return (
    <BrowserRouter>
      {/* Глобальный контейнер уведомлений react-hot-toast */}
      <Toaster position="bottom-right" reverseOrder={false} />

      <Routes>
        {/* ПУБЛИЧНАЯ ГЛАВНАЯ СТРАНИЦА (ШАГ 1) */}
        <Route path="/" element={<LandingPage />} />
        <Route path='/teacher/login' element={<TeacherLoginPage/>}/>
        <Route path='/forgot-password' element={<ForgotPasswordPage/>}/>
        <Route path='/teacher/register' element={<TeacherRegisterPage/>}/>
        <Route path='/student/login' element={<StudentLoginPage/>}/>
        <Route path='/student/register' element={<StudentRegisterPage/>}/>
        <Route path='/teacher/dashboard' element={<TeacherDashboardPage/>}/>
        <Route path='/student/dashboard' element={<StudentDashboardPage/>}/>
        <Route path='/admin/login' element={<AdminLoginPage/>}/>
        {/* Fallback для неизвестных маршрутов */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}