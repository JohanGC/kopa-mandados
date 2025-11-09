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
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body p-5">
              <h2 className="card-title text-center mb-4">Iniciar Sesión</h2>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              {/* Botones de prueba rápido */}
              <div className="mb-3">
                <small className="text-muted">Login rápido para pruebas:</small>
                <div className="btn-group w-100 mt-1">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => handleQuickLogin('admin@kopamandados.com', '123456')}
                    disabled={loading}
                  >
                    👑 Admin
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-info btn-sm"
                    onClick={() => handleQuickLogin('carlos@usuario.com', '123456')}
                    disabled={loading}
                  >
                    👤 Usuario
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-warning btn-sm"
                    onClick={() => handleQuickLogin('juan@empresa.com', '123456')}
                    disabled={loading}
                  >
                    🏢 Oferente
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Tu contraseña"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="mb-3 form-check">
                  <input 
                    type="checkbox" 
                    className="form-check-input" 
                    id="remember" 
                    disabled={loading}
                  />
                  <label className="form-check-label" htmlFor="remember">
                    Recordarme
                  </label>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </button>

                <div className="text-center">
                  <a href="#!" className="text-decoration-none">¿Olvidaste tu contraseña?</a>
                </div>
              </form>

              <hr className="my-4" />
              
              <div className="text-center">
                <p>¿No tienes cuenta? 
                  <Link to="/register" className="btn btn-link p-0 ms-1">
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;