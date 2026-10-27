import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import './Login.css';

export default function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const loadingScreenTimer = useRef(null);
  const navigate = useNavigate();

  useEffect(() => () => window.clearTimeout(loadingScreenTimer.current), []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const email = formData.email.trim().toLowerCase();
    if (!email || !formData.password) {
      setError('Ingresa tu correo electrónico y contraseña.');
      return;
    }

    setLoading(true);
    setError('');
    loadingScreenTimer.current = window.setTimeout(() => setShowLoadingScreen(true), 700);
    try {
      const response = await api.post('/auth/login', { email, password: formData.password });
      const { token, usuario } = response.data || {};
      if (!token || !usuario) {
        throw new Error('El servidor no devolvió los datos necesarios para iniciar sesión.');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(usuario));
      onLoginSuccess(usuario);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
        err.message ||
        'No se pudo iniciar sesión. Revisa tus datos e inténtalo de nuevo.'
      );
    } finally {
      window.clearTimeout(loadingScreenTimer.current);
      loadingScreenTimer.current = null;
      setShowLoadingScreen(false);
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {showLoadingScreen && (
        <div className="login-loading-overlay" role="status" aria-live="polite">
          <span className="login-loading-spinner" aria-hidden="true" />
          <strong>Iniciando sesión</strong>
          <span>Estamos verificando tus datos...</span>
        </div>
      )}

      <div className="login-wrapper">
        <div className="login-form-side">
          <div className="login-form-content">
            <span className="login-eyebrow">CAFRI · HVACR</span>
            <h1>Bienvenido</h1>
            <p className="login-subtitle">Ingresa tus credenciales para acceder a tu cuenta y continuar con tu compra.</p>

            <form onSubmit={handleSubmit} aria-busy={loading}>
              <label htmlFor="login-email">Correo electrónico</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                value={formData.email}
                onChange={handleChange}
                className="login-input"
                placeholder="usuario@ejemplo.com"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'login-error' : undefined}
                required
              />

              <label htmlFor="login-password">Contraseña</label>
              <div className="login-password-field">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="login-input"
                  placeholder="Ingresa tu contraseña"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error' : undefined}
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              {error && (
                <p id="login-error" className="login-error" role="alert">
                  {error}
                </p>
              )}

              <div style={{ textAlign: 'right', marginBottom: '14px' }}>
                <Link to="/olvide-password" className="login-link">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button type="submit" disabled={loading} className="login-submit">
                {loading && <span className="login-spinner" aria-hidden="true" />}
                {loading ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
            </form>

            <p className="login-register">
              ¿No tienes cuenta? <Link to="/registro" className="login-link">Regístrate aquí</Link>
            </p>
          </div>
        </div>

        <div className="login-image-side" aria-label="Identidad visual CAFRI para equipos HVACR">
          <div className="login-orbit" aria-hidden="true">❄</div>
          <div className="login-visual-copy">
            <span>Confort · Control · Confianza</span>
            <h2>Soluciones para cada clima.</h2>
            <p>Encuentra equipos y componentes HVACR para tus proyectos, con una experiencia de compra sencilla y clara.</p>
          </div>
        </div>
      </div>
    </div>
  );
}