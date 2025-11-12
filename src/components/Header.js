// Header.js - VERSIÓN COMPLETAMENTE CORREGIDA
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const Header = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { getTotalItems } = useCart();
  const [favoritesCount, setFavoritesCount] = useState(0);

  // ✅ CORREGIDO: Función simplificada y corregida
  const getApiUrl = () => {
    // En desarrollo, usar directamente la URL del backend
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  };

  useEffect(() => {
    if (currentUser && currentUser._id) {
      fetchFavoritesCountOptimized();
    } else {
      setFavoritesCount(0);
    }
  }, [currentUser]);

  // ✅ CORREGIDO: Función principal mejorada
  const fetchFavoritesCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !currentUser) {
        setFavoritesCount(0);
        return;
      }

      const API_BASE = getApiUrl();
      // ✅ CORREGIDO: URL correcta - solo una vez /api
      const url = `${API_BASE}/api/favorites/user`;
      
      console.log('🔍 Fetching favorites from:', url);
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 8000
      });
      
      // ✅ CORREGIDO: Manejo seguro de la respuesta
      let count = 0;
      if (Array.isArray(response.data)) {
        count = response.data.length;
      } else if (response.data && response.data.count !== undefined) {
        count = response.data.count;
      } else if (response.data && response.data.favorites) {
        count = response.data.favorites.length;
      }
      
      console.log(`✅ Favorites count: ${count}`);
      setFavoritesCount(count);
    } catch (error) {
      console.error('❌ Error fetching favorites count:', error);
      
      // ✅ CORREGIDO: Manejo específico de errores
      if (error.response?.status === 404) {
        console.log('⚠️ Ruta de favoritos no implementada aún');
        setFavoritesCount(0);
      } else if (error.response?.status === 401) {
        console.log('🔐 No autorizado - token inválido');
        setFavoritesCount(0);
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        console.log('🌐 Error de red - servidor no disponible');
        setFavoritesCount(0);
      } else {
        setFavoritesCount(0);
      }
    }
  };

  // ✅ CORREGIDO: Función optimizada con estructura mejorada
  const fetchFavoritesCountOptimized = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !currentUser) {
        setFavoritesCount(0);
        return;
      }

      const API_BASE = getApiUrl();
      
      // ✅ PRIMERO intentar con la nueva ruta de contador
      try {
        const countResponse = await axios.get(`${API_BASE}/api/favorites/user/count`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        });
        
        console.log('✅ Contador obtenido via /count:', countResponse.data.count);
        setFavoritesCount(countResponse.data.count || 0);
        return;
        
      } catch (countError) {
        // Si falla /count, intentar con la ruta original
        if (countError.response?.status === 404) {
          console.log('🔄 Ruta /count no disponible, usando ruta original...');
          await fetchFavoritesCount();
        } else {
          throw countError;
        }
      }
      
    } catch (error) {
      console.error('❌ Error en fetch optimizado:', error);
      setFavoritesCount(0);
    }
  };

  useEffect(() => {
    const handleFavoritesUpdate = () => {
      if (currentUser) {
        fetchFavoritesCountOptimized();
      }
    };

    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    
    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
    };
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    setFavoritesCount(0);
    navigate('/');
  };

  // ✅ CORREGIDO: Renderizado seguro
  const userRole = currentUser?.rol || '';
  const userName = currentUser?.nombre || 'Usuario';

  return (
    <header className="fondo-header header-2 p-3">
      <div className="container">
        <nav className="d-flex justify-content-between align-items-center">
          <Link to="/">
            <img className="logo" src='/images/logoKopa_w.png' alt="Kopa Logo" />
          </Link>
          
          <div className="d-flex align-items-center">
            <Link to="/" className="text-white mx-2 text-decoration-none nav-link-custom">Inicio</Link>
            <Link to="/offers" className="text-white mx-2 text-decoration-none nav-link-custom">Ofertas</Link>
            <Link to="/activities" className="text-white mx-2 text-decoration-none nav-link-custom">Actividades</Link>
            <Link to="/orders" className="text-white mx-2 text-decoration-none nav-link-custom">🛵 Mandados</Link>

            {/* Enlace directo al Panel de Domiciliario */}
            {userRole === 'domiciliario' && (
              <Link to="/domiciliario" className="text-white mx-2 text-decoration-none nav-link-custom">
                📊 Panel Domiciliario
              </Link>
            )}

            {/* Icono del carrito */}
            <button 
              className="btn btn-header position-relative ms-3"
              onClick={() => navigate('/cart')}
              title="Ver carrito"
            >
              🛒 Carrito
              {getTotalItems() > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {getTotalItems()}
                </span>
              )}
            </button>

            {currentUser ? (
              <div className="dropdown ms-3">
                <button className="btn btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  {userRole === 'administrador' ? '👑 ' : 
                   userRole === 'oferente' ? '🏢 ' : 
                   userRole === 'domiciliario' ? '🛵 ' : '👤 '}
                  {userName}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  {/* Panel de Administración - Solo para admins */}
                  {userRole === 'administrador' && (
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
                  {(userRole === 'oferente' || userRole === 'administrador') && (
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
                  {userRole === 'domiciliario' && (
                    <>
                      <li>
                        <Link to="/domiciliario" className="dropdown-item">
                          🛵 Panel de Domiciliario
                        </Link>
                      </li>
                      <li>
                        <Link to="/my-orders" className="dropdown-item">
                          📋 Mis Mandados
                        </Link>
                      </li>
                      <li><hr className="dropdown-divider"/></li>
                    </>
                  )}
                  
                  {/* Favoritos con contador */}
                  <li>
                    <Link to="/favorites" className="dropdown-item position-relative">
                      ❤️ Mis Favoritos
                      {favoritesCount > 0 && (
                        <span className="position-absolute top-50 end-0 translate-middle-y badge rounded-pill bg-danger me-2">
                          {favoritesCount}
                        </span>
                      )}
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