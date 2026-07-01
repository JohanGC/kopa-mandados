import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';


const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: 'usuario',
    empresa: '',
    telefono: '',
    direccion: ''
  });
  const [showOferenteFields, setShowOferenteFields] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Mostrar/ocultar campos de oferente
    if (name === 'rol') {
      setShowOferenteFields(value === 'oferente');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    // Validaciones para oferentes
    if (formData.rol === 'oferente') {
      if (!formData.telefono || !formData.empresa || !formData.direccion) {
        setError('Los campos teléfono, empresa y dirección son requeridos para oferentes');
        setLoading(false);
        return;
      }
    }

    try {
      // Preparar datos para enviar
      const userData = {
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        rol: formData.rol,
        telefono: formData.telefono || '',
        direccion: formData.direccion || ''
      };

      // Agregar empresa solo si es oferente
      if (formData.rol === 'oferente') {
        userData.empresa = formData.empresa;
      }

      const result = await register(userData);
      
      if (result.success) {
        addNotification(`¡Cuenta creada con éxito, ${result.user.nombre}!`, 'success');
        navigate('/');
      } else {
        setError(result.message);
        addNotification(result.message, 'error');
      }
      
    } catch (error) {
      setError(error.message);
      addNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (rol) => {
    switch (rol) {
      case 'usuario': return '👤';
      case 'oferente': return '🏢';
      case 'domiciliario': return '🛵';
      default: return '👤';
    }
  };

  const getRoleDescription = (rol) => {
    switch (rol) {
      case 'usuario': return 'Podrás participar en ofertas y actividades';
      case 'oferente': return 'Podrás publicar ofertas y actividades para otros usuarios';
      case 'domiciliario': return 'Podrás aceptar y ejecutar mandados';
      default: return '';
    }
  };

  return (
    <div className="register-modern">
      <div className="register-container">
        <div className="register-card">
          {/* Header con gradiente */}
          <div className="register-header">
            <div className="register-icon">🚀</div>
            <h1 className="register-title">Crear Cuenta</h1>
            <p className="register-subtitle">Únete a nuestra comunidad y descubre experiencias únicas</p>
          </div>

          <div className="register-content">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="nombre" className="form-label">
                    <span className="label-icon">👤</span>
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Tu nombre completo"
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    <span className="label-icon">📧</span>
                    Correo Electrónico *
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
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength="6"
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    <span className="label-icon">✅</span>
                    Confirmar Contraseña *
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repite tu contraseña"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="rol" className="form-label">
                  <span className="label-icon">🎯</span>
                  Tipo de Cuenta *
                </label>
                <div className="role-selector">
                  <select
                    className="role-select"
                    id="rol"
                    name="rol"
                    value={formData.rol}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="usuario">👤 Usuario Natural</option>
                    <option value="oferente">🏢 Oferente/Empresa</option>
                    <option value="domiciliario">🛵 Domiciliario</option>
                  </select>
                  <div className="role-description">
                    {getRoleDescription(formData.rol)}
                  </div>
                </div>
              </div>

              {/* Campos específicos para oferentes */}
              {showOferenteFields && (
                <div className="role-section oferente">
                  <div className="section-header">
                    <span className="section-icon">🏢</span>
                    <h3>Información de Empresa</h3>
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="empresa" className="form-label">
                        Nombre de la Empresa *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        id="empresa"
                        name="empresa"
                        value={formData.empresa}
                        onChange={handleChange}
                        placeholder="Nombre de tu empresa"
                        required={showOferenteFields}
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="telefono" className="form-label">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        className="form-input"
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="+57 300 123 4567"
                        required={showOferenteFields}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="direccion" className="form-label">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      id="direccion"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleChange}
                      placeholder="Dirección completa de la empresa"
                      required={showOferenteFields}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Campos para domiciliarios y usuarios */}
              {(formData.rol === 'usuario' || formData.rol === 'domiciliario') && (
                <div className={`role-section ${formData.rol}`}>
                  <div className="section-header">
                    <span className="section-icon">
                      {formData.rol === 'usuario' ? '👤' : '🛵'}
                    </span>
                    <h3>
                      {formData.rol === 'usuario' ? 'Información de Contacto' : 'Información para Domiciliarios'}
                    </h3>
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="telefono" className="form-label">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        className="form-input"
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="+57 300 123 4567"
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="direccion" className="form-label">
                        Dirección *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        id="direccion"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleChange}
                        placeholder="Tu dirección completa"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="register-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="button-spinner"></span>
                    Registrando...
                  </>
                ) : (
                  <>
                    <span className="button-icon">{getRoleIcon(formData.rol)}</span>
                    {formData.rol === 'oferente' ? 'Crear Cuenta de Oferente' : 
                     formData.rol === 'domiciliario' ? 'Crear Cuenta de Domiciliario' : 
                     'Crear Cuenta de Usuario'}
                  </>
                )}
              </button>
            </form>

            <div className="register-divider">
              <span className="divider-text">¿Ya eres miembro?</span>
            </div>
            
            <div className="login-section">
              <p className="login-text">Accede a tu cuenta existente</p>
              <Link to="/login" className="login-button">
                <span className="button-icon">🔐</span>
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;