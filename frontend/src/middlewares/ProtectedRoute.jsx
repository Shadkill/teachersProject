import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// Безопасное чтение payload из JWT токена
export function parseJwtPayload(token) {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();
  const token = localStorage.getItem('abitsherpa_token');
  const userPayload = parseJwtPayload(token);

  // 1. Если токена нет или он поврежден
  if (!token || !userPayload) {
    localStorage.removeItem('abitsherpa_token');
    const loginPath = allowedRoles.includes('STUDENT')
      ? '/student/login'
      : '/teacher/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // 2. Проверяем, не истёк ли срок действия токена
  if (userPayload.exp && userPayload.exp * 1000 < Date.now()) {
    localStorage.removeItem('abitsherpa_token');
    return <Navigate to="/teacher/login" replace />;
  }

  // 3. Проверяем роль (TEACHER / STUDENT / ADMIN)
  if (allowedRoles.length > 0 && !allowedRoles.includes(userPayload.role)) {
    const redirectHome =
      userPayload.role === 'STUDENT' ? '/student/dashboard' : '/teacher/dashboard';
    return <Navigate to={redirectHome} replace />;
  }

  return children;
}