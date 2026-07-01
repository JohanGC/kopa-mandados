// Header.js - VERSIÓN CORREGIDA SIN DEPENDENCIA DE BOOTSTRAP JS
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { getTotalItems } = useCart();
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Efecto para detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getApiUrl = () => {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  };

  useEffect(() => {
    if (currentUser && currentUser._id) {
      fetchFavoritesCountOptimized();
    } else {
      setFavoritesCount(0);
    }
  }, [currentUser]);

  const fetchFavoritesCountOptimized = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !currentUser) {
        setFavoritesCount(0);
        return;
      }

      const API_BASE = getApiUrl();
      try {
        const countResponse = await axios.get(`${API_BASE}/api/favorites/user/count`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        });
        setFavoritesCount(countResponse.data.count || 0);
        return;
      } catch (countError) {
        if (countError.response?.status === 404) {
          await fetchFavoritesCount();
        } else {
          throw countError;
        }
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavoritesCount(0);
    }
  };

  const fetchFavoritesCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !currentUser) return;

      const API_BASE = getApiUrl();
      const response = await axios.get(`${API_BASE}/api/favorites/user`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 8000
      });
      
      let count = 0;
      if (Array.isArray(response.data)) {
        count = response.data.length;
      } else if (response.data?.count !== undefined) {
        count = response.data.count;
      } else if (response.data?.favorites) {
        count = response.data.favorites.length;
      }
      
      setFavoritesCount(count);
    } catch (error) {
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
    return () => window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    setFavoritesCount(0);
    setIsDropdownOpen(false);
    navigate('/');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const userRole = currentUser?.rol || '';
  const userName = currentUser?.nombre || 'Usuario';

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <header className={`modern-header-black ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <nav className="nav-container">
          {/* Logo */}
          <Link to="/" className="logo-container">
            <img className="logo" src='/images/logoKopa_w.png' alt="Kopa Logo" />
          </Link>
          
          {/* Navegación Principal */}
          <div className="main-nav">
            <Link 
              to="/" 
              className={`nav-link ${isActiveLink('/') ? 'active' : ''}`}
            >
              Inicio
            </Link>
            <Link 
              to="/offers" 
              className={`nav-link ${isActiveLink('/offers') ? 'active' : ''}`}
            >
              Ofertas
            </Link>
            <Link 
              to="/activities" 
              className={`nav-link ${isActiveLink('/activities') ? 'active' : ''}`}
            >
              Actividades
            </Link>
            <Link 
              to="/orders" 
              className={`nav-link ${isActiveLink('/orders') ? 'active' : ''}`}
            >
              Mandados
            </Link>

            {userRole === 'domiciliario' && (
              <Link 
                to="/domiciliario" 
                className={`nav-link ${isActiveLink('/domiciliario') ? 'active' : ''}`}
              >
                Panel Domiciliario
              </Link>
            )}
          </div>

          {/* Acciones del Usuario */}
          <div className="user-actions">
            {/* Carrito */}
            <button 
              className="cart-btn-modern"
              onClick={() => navigate('/cart')}
              title="Carrito"
            >
              <span className="cart-icon-modern">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.4 5.2 16.4H17M17 13V16.4M9 19C9 19.6 8.6 20 8 20C7.4 20 7 19.6 7 19C7 18.4 7.4 18 8 18C8.6 18 9 18.4 9 19ZM17 19C17 19.6 16.6 20 16 20C15.4 20 15 19.6 15 19C15 18.4 15.4 18 16 18C16.6 18 17 18.4 17 19Z" 
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {getTotalItems() > 0 && (
                  <span className="cart-badge-modern">{getTotalItems()}</span>
                )}
              </span>
              <span className="cart-text">Carrito</span>
            </button>

            {currentUser ? (
              <div className="dropdown-modern" ref={dropdownRef}>
                <button 
                  className={`dropdown-toggle-modern ${isDropdownOpen ? 'open' : ''}`}
                  onClick={toggleDropdown}
                  type="button"
                >
                  <div className="user-info">
                    <div className="user-avatar-modern">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <span className="user-name-modern">{userName}</span>
                      <span className="user-role">
                        {userRole === 'administrador' ? 'Administrador' :
                         userRole === 'oferente' ? 'Oferente' :
                         userRole === 'domiciliario' ? 'Domiciliario' : 'Usuario'}
                      </span>
                    </div>
                    <svg 
                      className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor"
                    >
                      <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>
                {isDropdownOpen && (
                  <ul className="dropdown-menu-modern">
                    {/* Panel de Administración */}
                    {userRole === 'administrador' && (
                      <>
                        <li>
                          <Link 
                            to="/admin" 
                            className="dropdown-item-modern admin-item"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <span className="dropdown-icon">👑</span>
                            Panel de Administración
                          </Link>
                        </li>
                        <li><hr className="dropdown-divider-modern"/></li>
                      </>
                    )}
                    
                    {/* Mi Perfil */}
                    <li>
                      <Link 
                        to="/profile" 
                        className="dropdown-item-modern"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="dropdown-icon">👤</span>
                        Mi Perfil
                      </Link>
                    </li>
                    
                    {/* Opciones para Oferentes y Administradores */}
                    {(userRole === 'oferente' || userRole === 'administrador') && (
                      <>
                        <li>
                          <Link 
                            to="/my-offers" 
                            className="dropdown-item-modern"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <span className="dropdown-icon">🏷️</span>
                            Mis Ofertas
                          </Link>
                        </li>
                        <li>
                          <Link 
                            to="/my-activities" 
                            className="dropdown-item-modern"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <span className="dropdown-icon">🎯</span>
                            Mis Actividades
                          </Link>
                        </li>
                        <li><hr className="dropdown-divider-modern"/></li>
                      </>
                    )}
                    
                    {/* Opciones para Domiciliarios */}
                    {userRole === 'domiciliario' && (
                      <>
                        <li>
                          <Link 
                            to="/domiciliario" 
                            className="dropdown-item-modern"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <span className="dropdown-icon">🛵</span>
                            Panel de Domiciliario
                          </Link>
                        </li>
                        <li>
                          <Link 
                            to="/my-orders" 
                            className="dropdown-item-modern"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <span className="dropdown-icon">📋</span>
                            Mis Mandados
                          </Link>
                        </li>
                        <li><hr className="dropdown-divider-modern"/></li>
                      </>
                    )}

                    {/* Mis Mandados para todos los usuarios */}
                    {userRole !== 'domiciliario' && (
                      <li>
                        <Link 
                          to="/my-orders" 
                          className="dropdown-item-modern"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <span className="dropdown-icon">📦</span>
                          Mis Mandados
                        </Link>
                      </li>
                    )}
                    
                    {/* Favoritos */}
                    <li>
                      <Link 
                        to="/favorites" 
                        className="dropdown-item-modern"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="dropdown-icon">❤️</span>
                        Mis Favoritos
                        {favoritesCount > 0 && (
                          <span className="favorites-badge-modern">{favoritesCount}</span>
                        )}
                      </Link>
                    </li>

                    {/* Configuración */}
                    <li>
                      <Link 
                        to="/settings" 
                        className="dropdown-item-modern"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="dropdown-icon">⚙️</span>
                        Configuración
                      </Link>
                    </li>
                    
                    <li><hr className="dropdown-divider-modern"/></li>
                    
                    {/* Cerrar Sesión */}
                    <li>
                      <button 
                        className="dropdown-item-modern logout-item" 
                        onClick={handleLogout}
                      >
                        <span className="dropdown-icon">🚪</span>
                        Cerrar Sesión
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            ) : (
              <div className="auth-buttons-modern">
                <Link to="/login" className="auth-btn-modern login-btn-modern">
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="auth-btn-modern register-btn-modern">
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;