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

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-body p-5">
              <h2 className="card-title text-center mb-4">Crear Cuenta</h2>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="nombre" className="form-label">Nombre Completo *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Tu nombre completo"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Correo Electrónico *</label>
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
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">Contraseña *</label>
                      <input
                        type="password"
                        className="form-control"
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
                  </div>
                  
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="confirmPassword" className="form-label">Confirmar Contraseña *</label>
                      <input
                        type="password"
                        className="form-control"
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
                </div>

                <div className="mb-3">
                  <label htmlFor="rol" className="form-label">Tipo de Cuenta *</label>
                  <select
                    className="form-select"
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
                  <div className="form-text">
                    {formData.rol === 'usuario' 
                      ? 'Podrás participar en ofertas y actividades' 
                      : formData.rol === 'oferente'
                      ? 'Podrás publicar ofertas y actividades para otros usuarios'
                      : 'Podrás aceptar y ejecutar mandados'
                    }
                  </div>
                </div>

                {/* Campos específicos para oferentes */}
                {showOferenteFields && (
                  <div className="border p-3 rounded bg-light mb-3">
                    <h6 className="mb-3">🏢 Información de Empresa</h6>
                    
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="empresa" className="form-label">Nombre de la Empresa *</label>
                          <input
                            type="text"
                            className="form-control"
                            id="empresa"
                            name="empresa"
                            value={formData.empresa}
                            onChange={handleChange}
                            placeholder="Nombre de tu empresa"
                            required={showOferenteFields}
                            disabled={loading}
                          />
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="telefono" className="form-label">Teléfono *</label>
                          <input
                            type="tel"
                            className="form-control"
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
                    </div>

                    <div className="mb-3">
                      <label htmlFor="direccion" className="form-label">Dirección *</label>
                      <input
                        type="text"
                        className="form-control"
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
                  <div className="border p-3 rounded bg-light mb-3">
                    <h6 className="mb-3">📞 Información de Contacto</h6>
                    
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="telefono" className="form-label">Teléfono *</label>
                          <input
                            type="tel"
                            className="form-control"
                            id="telefono"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            placeholder="+57 300 123 4567"
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="direccion" className="form-label">Dirección *</label>
                          <input
                            type="text"
                            className="form-control"
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
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Registrando...
                    </>
                  ) : (
                    formData.rol === 'oferente' ? '🏢 Crear Cuenta de Oferente' : 
                    formData.rol === 'domiciliario' ? '🛵 Crear Cuenta de Domiciliario' : 
                    '👤 Crear Cuenta de Usuario'
                  )}
                </button>
              </form>

              <hr className="my-4" />
              
              <div className="text-center">
                <p>¿Ya tienes cuenta? 
                  <Link to="/login" className="btn btn-link p-0 ms-1">
                    Inicia sesión aquí
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

export default Register;