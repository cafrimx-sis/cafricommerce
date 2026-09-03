import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const token = localStorage.getItem('token');
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}') || {};
  } catch {
    user = {};
  }

  const rol = String(user.rol || user.Rol || '').toLowerCase();
  const isAdmin = rol === 'admin' || rol === 'administrador';

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}