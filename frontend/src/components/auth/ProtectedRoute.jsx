// src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Verificación de rol: Si no existe el rol o no es admin, fuera
  const rol = (user.rol || user.Rol || '').toLowerCase();
  const isAdmin = rol === 'admin' || rol === 'administrador';

  if (!token || !isAdmin) {
    // Si no está logueado o no es admin, lo mandamos al login o al inicio
    return <Navigate to="/login" />;
  }

  return children;
}