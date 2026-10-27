import { Navigate } from 'react-router-dom';

function rolCoincide(rolUsuario, rolesPermitidos) {
  const actual = String(rolUsuario || '').toLowerCase();
  return rolesPermitidos.some((rol) => {
    const requerido = String(rol).toLowerCase();
    if (requerido === 'admin' || requerido === 'administrador') {
      return actual === 'admin' || actual === 'administrador';
    }
    return actual === requerido;
  });
}

export default function ProtectedRoute({ children, requireAdmin = false, allowedRoles }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const rol = user.rol || user.Rol || '';

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const roles = allowedRoles?.length
    ? allowedRoles
    : (requireAdmin ? ['Administrador'] : []);

  if (roles.length && !rolCoincide(rol, roles)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
