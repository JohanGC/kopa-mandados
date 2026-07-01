import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      addNotification(`¡Bienvenido de nuevo, ${result.user.nombre}!`, 'success');
      navigate('/');
    } else {
      setError(result.message);
      addNotification(result.message, 'error');
    }
    
    setLoading(false);
  };

  // Función para login rápido de prueba
  const handleQuickLogin = (testEmail, testPassword) => {
    setFormData({
      email: testEmail,
      password: testPassword
    });
  };

  return (
    <div className="login-modern">
      <div className="login-container">
        <div className="login-card">
          {/* Header con gradiente */}
          <div className="login-header">
            <div className="login-icon">🔐</div>
            <h1 className="login-title">Iniciar Sesión</h1>
            <p className="login-subtitle">Accede a tu cuenta para descubrir experiencias únicas</p>
          </div>

          <div className="login-content">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}
            
            {/* Botones de prueba rápido */}
            <div className="quick-login-section">
              <p className="quick-login-label">Acceso rápido para pruebas:</p>
              <div className="quick-login-grid">
                <button 
                  type="button" 
                  className="quick-login-btn admin"
                  onClick={() => handleQuickLogin('admin@kopamandados.com', '123456')}
                  disabled={loading}
                >
                  <span className="btn-icon">👑</span>
                  <span className="btn-text">Admin</span>
                </button>
                <button 
                  type="button" 
                  className="quick-login-btn user"
                  onClick={() => handleQuickLogin('carlos@usuario.com', '123456')}
                  disabled={loading}
                >
                  <span className="btn-icon">👤</span>
                  <span className="btn-text">Usuario</span>
                </button>
                <button 
                  type="button" 
                  className="quick-login-btn oferente"
                  onClick={() => handleQuickLogin('juan@empresa.com', '123456')}
                  disabled={loading}
                >
                  <span className="btn-icon">🏢</span>
                  <span className="btn-text">Oferente</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <span className="label-icon">📧</span>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  className="form-input"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  <span className="label-icon">🔒</span>
                  Contraseña
                </label>
                <input
                  type="password"
                  className="form-input"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Tu contraseña"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-options">
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    className="checkbox-input" 
                    id="remember" 
                    disabled={loading}
                  />
                  <span className="checkbox-checkmark"></span>
                  <span className="checkbox-label">Recordar sesión</span>
                </label>
                <a href="#!" className="forgot-password">¿Olvidaste tu contraseña?</a>
              </div>

              <button 
                type="submit" 
                className="login-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="button-spinner"></span>
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <span className="button-icon">🚀</span>
                    Iniciar Sesión
                  </>
                )}
              </button>
            </form>

            <div className="login-divider">
              <span className="divider-text">¿Primera vez aquí?</span>
            </div>
            
            <div className="register-section">
              <p className="register-text">Únete a nuestra comunidad</p>
              <Link to="/register" className="register-button">
                <span className="button-icon">🌟</span>
                Crear Cuenta Nueva
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;