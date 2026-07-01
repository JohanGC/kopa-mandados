import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import axios from 'axios';

const Favorites = () => {
  const { currentUser, API_URL } = useAuth();
  const { addNotification } = useNotification();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchFavorites();
    }
  }, [currentUser]);

  const fetchFavorites = async () => {
    try {
      const response = await axios.get(`${API_URL}/favorites/user`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setFavorites(response.data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      addNotification('Error al cargar favoritos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId, itemId, tipo) => {
    try {
      await axios.delete(`${API_URL}/favorites`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        data: {
          itemId,
          tipo
        }
      });
      
      setFavorites(prev => prev.filter(fav => fav._id !== favoriteId));
      addNotification('Eliminado de favoritos', 'success');
    } catch (error) {
      console.error('Error removing favorite:', error);
      addNotification('Error al eliminar de favoritos', 'error');
    }
  };

  const filteredFavorites = favorites.filter(favorite => {
    if (activeTab === 'all') return true;
    return favorite.tipo === activeTab;
  });

  const getItemDetails = (favorite) => {
    if (favorite.itemId) {
      return favorite.itemId;
    }
    return {
      _id: favorite.itemId?._id || favorite._id,
      titulo: favorite.itemId?.titulo || 'Título no disponible',
      descripcion: favorite.itemId?.descripcion || 'Descripción no disponible',
      precioDescuento: favorite.itemId?.precioDescuento,
      precioOriginal: favorite.itemId?.precioOriginal,
      descuento: favorite.itemId?.descuento,
      imagen: favorite.itemId?.imagen,
      categoria: favorite.itemId?.categoria,
      fecha: favorite.itemId?.fecha,
      hora: favorite.itemId?.hora,
      ubicacion: favorite.itemId?.ubicacion,
      creador: favorite.itemId?.creador
    };
  };

  const getItemLink = (favorite) => {
    const item = getItemDetails(favorite);
    if (favorite.tipo === 'offer') {
      return `/offer/${item._id}`;
    } else if (favorite.tipo === 'activity') {
      return `/activity/${item._id}`;
    }
    return '#';
  };

  const getItemTypeConfig = (tipo) => {
    const config = {
      offer: { label: 'Oferta', icon: '🏷️', color: 'success', gradient: 'linear-gradient(135deg, #48bb78, #38a169)' },
      activity: { label: 'Actividad', icon: '🎯', color: 'warning', gradient: 'linear-gradient(135deg, #ed8936, #dd6b20)' }
    };
    return config[tipo] || config.offer;
  };

  const getCategoryIcon = (categoria) => {
    const icons = {
      documentos: '📄',
      comida: '🍕',
      farmacia: '💊',
      mercado: '🛒',
      deporte: '⚽',
      cultural: '🎭',
      educativa: '📚',
      social: '👥',
      recreativa: '🎮',
      otros: '📦'
    };
    return icons[categoria] || '📦';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  if (!currentUser) {
    return (
      <div className="modern-container">
        <div className="error-state">
          <div className="error-icon">🔒</div>
          <h2>Acceso requerido</h2>
          <p>Inicia sesión para acceder a tu lista de favoritos.</p>
          <Link to="/login" className="btn-modern primary">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="modern-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Cargando tus favoritos...</p>
        </div>
      </div>
    );
  }

  const offersCount = favorites.filter(f => f.tipo === 'offer').length;
  const activitiesCount = favorites.filter(f => f.tipo === 'activity').length;

  return (
    <div className="main-content">
      <div className="modern-container">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>Mis Favoritos</h1>
            <p>Gestiona y organiza tus ofertas y actividades favoritas</p>
          </div>
          <div className="favorites-stats">
            <div className="stat-badge">
              <span className="stat-number">{favorites.length}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="filters-section">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span className="tab-icon">❤️</span>
              Todos ({favorites.length})
            </button>
            <button
              className={`filter-tab ${activeTab === 'offer' ? 'active' : ''}`}
              onClick={() => setActiveTab('offer')}
            >
              <span className="tab-icon">🏷️</span>
              Ofertas ({offersCount})
            </button>
            <button
              className={`filter-tab ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              <span className="tab-icon">🎯</span>
              Actividades ({activitiesCount})
            </button>
          </div>
        </div>

        {/* Grid de Favoritos */}
        {filteredFavorites.length > 0 ? (
          <div className="favorites-grid">
            {filteredFavorites.map((favorite, index) => {
              const item = getItemDetails(favorite);
              const typeConfig = getItemTypeConfig(favorite.tipo);
              const isHovered = hoveredCard === favorite._id;
              
              return (
                <div 
                  key={favorite._id}
                  className="favorite-card"
                  onMouseEnter={() => setHoveredCard(favorite._id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Header con tipo y acciones */}
                  <div className="card-header">
                    <div className="type-badge" style={{ background: typeConfig.gradient }}>
                      <span className="type-icon">{typeConfig.icon}</span>
                      <span className="type-label">{typeConfig.label}</span>
                    </div>
                    <button
                      className={`remove-btn ${isHovered ? 'visible' : ''}`}
                      onClick={() => handleRemoveFavorite(favorite._id, item._id, favorite.tipo)}
                      title="Eliminar de favoritos"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </button>
                  </div>

                  {/* Imagen */}
                  <div className="card-image">
                    <img 
                      src={item.imagen || (favorite.tipo === 'offer' ? '/images/placeholder-offer.jpg' : '/images/placeholder-activity.jpg')} 
                      alt={item.titulo}
                    />
                    <div className="image-overlay">
                      {favorite.tipo === 'activity' && item.fecha && (
                        <div className="date-badge">
                          {formatDate(item.fecha)}
                        </div>
                      )}
                      {item.descuento && item.descuento > 0 && (
                        <div className="discount-badge">
                          -{item.descuento}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="card-content">
                    <div className="content-header">
                      <div className="category-tag">
                        <span className="category-icon">{getCategoryIcon(item.categoria)}</span>
                        <span className="category-name">{item.categoria}</span>
                      </div>
                      <h3 className="item-title">{item.titulo}</h3>
                      <p className="item-description">
                        {item.descripcion?.substring(0, 120)}...
                      </p>
                    </div>

                    {/* Información específica por tipo */}
                    <div className="item-details">
                      {favorite.tipo === 'offer' && (
                        <div className="pricing-info">
                          <div className="price-comparison">
                            {item.precioOriginal && item.precioDescuento && item.precioOriginal > item.precioDescuento ? (
                              <>
                                <span className="original-price">${item.precioOriginal?.toLocaleString()}</span>
                                <span className="current-price">${item.precioDescuento?.toLocaleString()}</span>
                              </>
                            ) : (
                              <span className="current-price solo">${item.precioDescuento?.toLocaleString()}</span>
                            )}
                          </div>
                          {item.precioOriginal && item.precioDescuento && item.precioOriginal > item.precioDescuento && (
                            <div className="savings">
                              Ahorras ${(item.precioOriginal - item.precioDescuento)?.toLocaleString()}
                            </div>
                          )}
                        </div>
                      )}

                      {favorite.tipo === 'activity' && (
                        <div className="activity-meta">
                          {item.fecha && (
                            <div className="meta-item">
                              <span className="meta-icon">📅</span>
                              <span className="meta-text">{formatDate(item.fecha)}</span>
                            </div>
                          )}
                          {item.hora && (
                            <div className="meta-item">
                              <span className="meta-icon">⏰</span>
                              <span className="meta-text">{item.hora}</span>
                            </div>
                          )}
                          {item.ubicacion && (
                            <div className="meta-item">
                              <span className="meta-icon">📍</span>
                              <span className="meta-text">{item.ubicacion}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Información del creador */}
                    {item.creador && (
                      <div className="creator-info">
                        <div className="creator-avatar">
                          {item.creador.empresa?.charAt(0).toUpperCase() || item.creador.nombre?.charAt(0).toUpperCase()}
                        </div>
                        <div className="creator-details">
                          <span className="creator-name">
                            {item.creador.empresa || item.creador.nombre}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer con acción */}
                  <div className="card-footer">
                    <Link 
                      to={getItemLink(favorite)} 
                      className="btn-modern primary full-width"
                    >
                      <span className="btn-icon">👁️</span>
                      Ver Detalles
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state large">
            <div className="empty-icon">❤️</div>
            <h3>No tienes favoritos</h3>
            <p>
              {activeTab === 'all' 
                ? 'Agrega ofertas y actividades a tus favoritos para verlos aquí.'
                : activeTab === 'offer'
                ? 'No tienes ofertas en favoritos. Explora las ofertas disponibles.'
                : 'No tienes actividades en favoritos. Descubre actividades interesantes.'
              }
            </p>
            <div className="action-buttons">
              <Link to="/offers" className="btn-modern success">
                <span className="btn-icon">🏷️</span>
                Explorar Ofertas
              </Link>
              <Link to="/activities" className="btn-modern warning">
                <span className="btn-icon">🎯</span>
                Descubrir Actividades
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;