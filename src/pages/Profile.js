import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  if (!currentUser) {
    return (
      <div className="modern-container">
        <div className="error-state">
          <div className="error-icon">🔒</div>
          <h2>Acceso requerido</h2>
          <p>Debes iniciar sesión para ver tu perfil</p>
          <button 
            className="btn-modern primary"
            onClick={() => navigate('/login')}
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  const getRoleConfig = (rol) => {
    const roles = {
      administrador: { label: 'Administrador', color: 'danger', icon: '👑' },
      oferente: { label: 'Oferente', color: 'warning', icon: '🏢' },
      domiciliario: { label: 'Domiciliario', color: 'success', icon: '🛵' },
      usuario: { label: 'Usuario', color: 'info', icon: '👤' }
    };
    return roles[rol] || roles.usuario;
  };

  const roleConfig = getRoleConfig(currentUser.rol);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="main-content">
      <div className="modern-container">
        <div className="profile-layout">
          {/* Sidebar */}
          <div className="profile-sidebar">
            <div className="user-card">
              <div className="user-avatar">
                {getInitials(currentUser.nombre)}
              </div>
              <div className="user-info">
                <h2>{currentUser.nombre}</h2>
                <div className={`role-badge ${roleConfig.color}`}>
                  <span className="role-icon">{roleConfig.icon}</span>
                  {roleConfig.label}
                </div>
                <p className="user-email">{currentUser.email}</p>
              </div>
            </div>

            <nav className="profile-nav">
              <button 
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <span className="nav-icon">👤</span>
                Información Personal
              </button>
              <button 
                className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <span className="nav-icon">🔐</span>
                Seguridad
              </button>
              <button 
                className={`nav-item ${activeTab === 'preferences' ? 'active' : ''}`}
                onClick={() => setActiveTab('preferences')}
              >
                <span className="nav-icon">⚙️</span>
                Preferencias
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="profile-content">
            {activeTab === 'profile' && (
              <div className="content-section">
                <div className="section-header">
                  <h1>Información Personal</h1>
                  <p>Gestiona tu información de perfil y preferencias</p>
                </div>

                <div className="info-grid">
                  <div className="info-group">
                    <label className="info-label">Nombre Completo</label>
                    <div className="info-value">{currentUser.nombre}</div>
                  </div>

                  <div className="info-group">
                    <label className="info-label">Correo Electrónico</label>
                    <div className="info-value">{currentUser.email}</div>
                  </div>

                  {currentUser.empresa && (
                    <div className="info-group">
                      <label className="info-label">Empresa</label>
                      <div className="info-value">{currentUser.empresa}</div>
                    </div>
                  )}

                  {currentUser.telefono && (
                    <div className="info-group">
                      <label className="info-label">Teléfono</label>
                      <div className="info-value">
                        <a href={`tel:${currentUser.telefono}`} className="contact-link">
                          {currentUser.telefono}
                        </a>
                      </div>
                    </div>
                  )}

                  {currentUser.direccion && (
                    <div className="info-group">
                      <label className="info-label">Dirección</label>
                      <div className="info-value">{currentUser.direccion}</div>
                    </div>
                  )}

                  <div className="info-group">
                    <label className="info-label">Fecha de Registro</label>
                    <div className="info-value">{formatDate(currentUser.fechaRegistro)}</div>
                  </div>

                  <div className="info-group">
                    <label className="info-label">ID de Usuario</label>
                    <div className="info-value user-id">{currentUser._id}</div>
                  </div>
                </div>

                <div className="action-buttons">
                  <button className="btn-modern primary">
                    <span className="btn-icon">✏️</span>
                    Editar Perfil
                  </button>
                  <button className="btn-modern outline">
                    <span className="btn-icon">📧</span>
                    Actualizar Email
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="content-section">
                <div className="section-header">
                  <h1>Seguridad</h1>
                  <p>Gestiona la seguridad de tu cuenta y contraseñas</p>
                </div>

                <div className="security-cards">
                  <div className="security-card">
                    
                    <div className="security-content">
                      <h3>Contraseña</h3>
                      <p>Actualiza tu contraseña regularmente para mantener tu cuenta segura</p>
                      <button className="btn-modern warning">
                        Cambiar Contraseña
                      </button>
                    </div>
                  </div>

                  <div className="security-card">
                    
                    <div className="security-content">
                      <h3>Autenticación de Dos Factores</h3>
                      <p>Protege tu cuenta con una capa adicional de seguridad</p>
                      <button className="btn-modern outline">
                        Configurar 2FA
                      </button>
                    </div>
                  </div>

                  <div className="security-card">
                    
                    <div className="security-content">
                      <h3>Sesiones Activas</h3>
                      <p>Gestiona y revisa tus sesiones activas en otros dispositivos</p>
                      <button className="btn-modern outline">
                        Ver Sesiones
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="content-section">
                <div className="section-header">
                  <h1>Preferencias</h1>
                  <p>Personaliza tu experiencia en la plataforma</p>
                </div>

                <div className="preferences-grid">
                  <div className="preference-item">
                    <div className="preference-info">
                      <h4>Notificaciones por Email</h4>
                      <p>Recibe notificaciones sobre tus actividades y ofertas</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="preference-item">
                    <div className="preference-info">
                      <h4>Notificaciones Push</h4>
                      <p>Permite notificaciones en tiempo real desde el navegador</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="preference-item">
                    <div className="preference-info">
                      <h4>Modo Oscuro</h4>
                      <p>Cambia la apariencia de la plataforma a modo oscuro</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="preference-item">
                    <div className="preference-info">
                      <h4>Idioma</h4>
                      <p>Selecciona tu idioma preferido</p>
                    </div>
                    <select className="select-modern">
                      <option>Español</option>
                      <option>English</option>
                      <option>Português</option>
                    </select>
                  </div>
                </div>

                <div className="action-buttons">
                  <button className="btn-modern primary">
                    Guardar Preferencias
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;