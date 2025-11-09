import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Header = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { getTotalItems } = useCart();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="fondo-header header-2 p-3">
      <div className="container">
        <nav className="d-flex justify-content-between align-items-center">
          <Link to="/">
            <img className="logo" src='/images/logoKopa_W.svg' alt="Kopa Logo"></img>
          </Link>
          
          <div className="d-flex align-items-center">
            <Link to="/" className="text-white mx-2 text-decoration-none nav-link-custom">Inicio</Link>
            <Link to="/offers" className="text-white mx-2 text-decoration-none nav-link-custom">Ofertas</Link>
            <Link to="/activities" className="text-white mx-2 text-decoration-none nav-link-custom">Actividades</Link>
            <Link to="/orders" className="text-white mx-2 text-decoration-none nav-link-custom">🛵 Mandados</Link>

            {/* Icono del carrito */}
            <button 
              className="btn btn-header position-relative ms-3"
              onClick={() => navigate('/cart')}
            >
              🛍️ Carrito
              {getTotalItems() > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {getTotalItems()}
                </span>
              )}
            </button>

            {currentUser ? (
              <div className="dropdown ms-3">
                <button className="btn btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  {currentUser.rol === 'administrador' ? '👑 ' : 
                   currentUser.rol === 'oferente' ? '🏢 ' : 
                   currentUser.rol === 'domiciliario' ? '🛵 ' : '👤 '}
                  {currentUser.nombre}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  {/* Panel de Administración - Solo para admins */}
                  {currentUser.rol === 'administrador' && (
                    <>
                      <li>
                        <Link to="/admin" className="dropdown-item text-danger">
                          👑 Panel de Administración
                        </Link>
                      </li>
                      <li><hr className="dropdown-divider"/></li>
                    </>
                  )}
                  
                  {/* Mi Perfil - Para todos los usuarios */}
                  <li>
                    <Link to="/profile" className="dropdown-item">
                      👤 Mi Perfil
                    </Link>
                  </li>
                  
                  {/* Opciones para Oferentes y Administradores */}
                  {(currentUser.rol === 'oferente' || currentUser.rol === 'administrador') && (
                    <>
                      <li>
                        <Link to="/my-offers" className="dropdown-item">
                          🏷️ Mis Ofertas
                        </Link>
                      </li>
                      <li>
                        <Link to="/my-activities" className="dropdown-item">
                          🎯 Mis Actividades
                        </Link>
                      </li>
                      <li><hr className="dropdown-divider"/></li>
                    </>
                  )}
                  
                  {/* Opciones para Domiciliarios */}
                  {currentUser.rol === 'domiciliario' && (
                    <>
                      <li>
                        <Link to="/my-orders" className="dropdown-item">
                          📋 Mis Mandados
                        </Link>
                      </li>
                      <li><hr className="dropdown-divider"/></li>
                    </>
                  )}
                  
                  {/* Opciones para todos los usuarios */}
                  <li>
                    <Link to="/favorites" className="dropdown-item">
                      ❤️ Mis Favoritos
                    </Link>
                  </li>
                  <li>
                    <Link to="/settings" className="dropdown-item">
                      ⚙️ Configuración
                    </Link>
                  </li>
                  
                  <li><hr className="dropdown-divider"/></li>
                  
                  {/* Cerrar Sesión */}
                  <li>
                    <button 
                      className="dropdown-item text-danger" 
                      onClick={handleLogout}
                    >
                      🚪 Cerrar Sesión
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-light ms-3">
                  🔑 Iniciar Sesión
                </Link>
                <Link to="/register" className="btn btn-primary ms-2">
                  📝 Registrarse
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;