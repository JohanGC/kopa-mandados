import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning text-center">
          <h4>Debes iniciar sesión para ver tu perfil</h4>
          <button 
            className="btn btn-primary mt-3"
            onClick={() => navigate('/login')}
          >
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-8 mx-auto">
          <div className="card shadow">
            <div className="card-body p-5">
              <h2 className="card-title text-center mb-4">Mi Perfil</h2>
              
              <div className="text-center mb-4">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" 
                     style={{width: '80px', height: '80px', fontSize: '2rem'}}>
                  {currentUser.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U'}
                </div>
                <h4 className="mt-3">{currentUser.nombre}</h4>
                <span className={`badge ${
                  currentUser.rol === 'administrador' ? 'bg-danger' :
                  currentUser.rol === 'oferente' ? 'bg-warning' :
                  currentUser.rol === 'domiciliario' ? 'bg-success' : 'bg-info'
                }`}>
                  {currentUser.rol === 'administrador' ? '👑 Administrador' :
                   currentUser.rol === 'oferente' ? '🏢 Oferente' :
                   currentUser.rol === 'domiciliario' ? '🛵 Domiciliario' : '👤 Usuario'}
                </span>
              </div>
              
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Nombre Completo:</label>
                    <p className="fs-5">{currentUser.nombre}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Email:</label>
                    <p className="fs-5">{currentUser.email}</p>
                  </div>
                </div>
              </div>

              {currentUser.empresa && (
                <div className="mb-3">
                  <label className="form-label fw-bold">Empresa:</label>
                  <p className="fs-5">{currentUser.empresa}</p>
                </div>
              )}

              {currentUser.telefono && (
                <div className="mb-3">
                  <label className="form-label fw-bold">Teléfono:</label>
                  <p className="fs-5">{currentUser.telefono}</p>
                </div>
              )}

              {currentUser.direccion && (
                <div className="mb-3">
                  <label className="form-label fw-bold">Dirección:</label>
                  <p className="fs-5">{currentUser.direccion}</p>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-bold">Fecha de Registro:</label>
                <p className="fs-5">
                  {currentUser.fechaRegistro ? 
                    new Date(currentUser.fechaRegistro).toLocaleDateString('es-ES') : 
                    'No disponible'
                  }
                </p>
              </div>

              <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                <button className="btn btn-primary me-2">
                  ✏️ Editar Perfil
                </button>
                <button className="btn btn-warning">
                  🔐 Cambiar Contraseña
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;