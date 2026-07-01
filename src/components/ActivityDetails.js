import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const ActivityDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, API_URL } = useAuth();
  const { addNotification } = useNotification();
  const { addToCart } = useCart();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchActivityDetails();
    checkFavoriteStatus();
    checkRegistrationStatus();
    fetchReviews();
  }, [id]);

  const fetchActivityDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/activities/${id}`);
      setActivity(response.data);
    } catch (error) {
      console.error('Error fetching activity details:', error);
      addNotification('Error al cargar los detalles de la actividad', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!currentUser) return;
    try {
      const response = await axios.get(`${API_URL}/favorites/check`, {
        params: { itemId: id, tipo: 'activity' },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setIsFavorite(response.data.isFavorite);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const checkRegistrationStatus = async () => {
    if (!currentUser) return;
    try {
      const response = await axios.get(`${API_URL}/activities/${id}/registration`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setIsRegistered(response.data.isRegistered);
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/reviews`, {
        params: { tipo: 'activity', itemId: id }
      });
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleAddToFavorites = async () => {
    if (!currentUser) {
      addNotification('Debes iniciar sesión para agregar a favoritos', 'warning');
      navigate('/login');
      return;
    }

    try {
      if (isFavorite) {
        await axios.delete(`${API_URL}/favorites`, {
          data: { 
            itemId: id, 
            tipo: 'activity'
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setIsFavorite(false);
        addNotification('Eliminado de favoritos', 'success');
      } else {
        await axios.post(`${API_URL}/favorites`, {
          itemId: id,
          tipo: 'activity'
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setIsFavorite(true);
        addNotification('Agregado a favoritos', 'success');
      }
      
      window.dispatchEvent(new Event('favoritesUpdated'));
    } catch (error) {
      console.error('Error updating favorites:', error);
      addNotification('Error al actualizar favoritos', 'error');
    }
  };

  const handleRegister = async () => {
    if (!currentUser) {
      addNotification('Debes iniciar sesión para registrarte', 'warning');
      navigate('/login');
      return;
    }

    try {
      await axios.post(`${API_URL}/activities/${id}/register`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setIsRegistered(true);
      addNotification('¡Te has registrado en esta actividad!', 'success');
    } catch (error) {
      console.error('Error registering for activity:', error);
      addNotification('Error al registrarse en la actividad', 'error');
    }
  };

  const handleAddToCart = () => {
    if (!currentUser) {
      addNotification('Debes iniciar sesión para agregar al carrito', 'warning');
      navigate('/login');
      return;
    }

    if (!activity) return;

    const cartItem = {
      _id: activity._id,
      titulo: activity.titulo,
      descripcion: activity.descripcion,
      categoria: activity.categoria,
      precioOriginal: activity.precioOriginal,
      precioDescuento: activity.precioDescuento,
      descuento: activity.descuento,
      imagen: activity.imagen,
      type: 'activity',
      fecha: activity.fecha,
      hora: activity.hora,
      ubicacion: activity.ubicacion
    };

    addToCart(cartItem);
    addNotification('Actividad agregada al carrito', 'success');
  };

  const getActivityTypeIcon = (categoria) => {
    const icons = {
      deporte: '⚽',
      cultural: '🎭',
      educativa: '📚',
      social: '👥',
      recreativa: '🎮',
      gastronomica: '🍽️',
      musical: '🎵',
      arte: '🎨',
      tecnologia: '💻',
      bienestar: '🧘'
    };
    return icons[categoria] || '🎯';
  };

  const formatDateTime = (fecha, hora) => {
    const date = new Date(fecha);
    return {
      date: date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: hora,
      shortDate: date.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })
    };
  };

  if (loading) {
    return (
      <div className="modern-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Cargando actividad...</p>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="modern-container">
        <div className="error-state">
          <div className="error-icon">😕</div>
          <h2>Actividad no encontrada</h2>
          <p>La actividad que buscas no existe o ha sido eliminada.</p>
          <Link to="/activities" className="btn-modern primary">
            Volver a actividades
          </Link>
        </div>
      </div>
    );
  }

  const dateTime = formatDateTime(activity.fecha, activity.hora);
  const participantsCount = activity.participantes?.length || 0;
  const availableSpots = activity.maxParticipantes - participantsCount;
  const progressPercentage = (participantsCount / activity.maxParticipantes) * 100;
  const savings = activity.precioOriginal - activity.precioDescuento;

  return (
    <div className="main-content">
      <div className="modern-container">
        {/* Header de la actividad */}
        <div className="activity-header">
          <div className="breadcrumb">
            <Link to="/activities" className="breadcrumb-link">Actividades</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{activity.titulo}</span>
          </div>
          
          <div className="header-actions">
            <button
              className={`favorite-btn ${isFavorite ? 'active' : ''}`}
              onClick={handleAddToFavorites}
              title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                {isFavorite ? (
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                ) : (
                  <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>
                )}
              </svg>
            </button>
          </div>
        </div>

        <div className="activity-layout">
          {/* Contenido principal */}
          <div className="activity-main">
            {/* Imagen principal */}
            <div className="activity-image-section">
              <img
                src={activity.imagen || '/images/placeholder-activity.jpg'}
                alt={activity.titulo}
                className="activity-image"
              />
              <div className="image-overlay">
                <div className="date-badge">
                  <div className="date-day">{dateTime.shortDate}</div>
                  <div className="date-time">{activity.hora}</div>
                </div>
                {activity.descuento > 0 && (
                  <div className="discount-badge">
                    -{activity.descuento}%
                  </div>
                )}
              </div>
            </div>

            {/* Navegación por pestañas */}
            <div className="tab-navigation">
              <button 
                className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                Detalles
              </button>
              <button 
                className={`tab-btn ${activeTab === 'location' ? 'active' : ''}`}
                onClick={() => setActiveTab('location')}
              >
                Ubicación
              </button>
              <button 
                className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reseñas ({reviews.length})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'organizer' ? 'active' : ''}`}
                onClick={() => setActiveTab('organizer')}
              >
                Organizador
              </button>
            </div>

            {/* Contenido de pestañas */}
            <div className="tab-content">
              {activeTab === 'details' && (
                <div className="tab-panel">
                  <div className="activity-title-section">
                    <div className="activity-type">
                      <span className="type-icon">{getActivityTypeIcon(activity.categoria)}</span>
                      <span className="type-category">{activity.categoria}</span>
                    </div>
                    <h1 className="activity-title">{activity.titulo}</h1>
                    <p className="activity-description">{activity.descripcion}</p>
                  </div>

                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-icon">📅</div>
                      <div className="info-content">
                        <label>Fecha del evento</label>
                        <span>{dateTime.date}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">⏰</div>
                      <div className="info-content">
                        <label>Hora de inicio</label>
                        <span>{activity.hora}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">⏱️</div>
                      <div className="info-content">
                        <label>Duración</label>
                        <span>{activity.duracion}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">👥</div>
                      <div className="info-content">
                        <label>Capacidad</label>
                        <span>{activity.maxParticipantes} participantes</span>
                      </div>
                    </div>
                  </div>

                  {activity.requisitos && (
                    <div className="requirements-section">
                      <h3>Requisitos de Participación</h3>
                      <p>{activity.requisitos}</p>
                    </div>
                  )}

                  <div className="progress-section">
                    <div className="progress-header">
                      <span>Inscripciones</span>
                      <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    <div className="progress-text">
                      {participantsCount} de {activity.maxParticipantes} cupos ocupados
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'location' && (
                <div className="tab-panel">
                  <h3>📍 Ubicación del Evento</h3>
                  <div className="location-card">
                    <div className="location-icon">🏢</div>
                    <div className="location-details">
                      <h4>{activity.ubicacion}</h4>
                      <p>Lugar donde se realizará la actividad</p>
                    </div>
                  </div>
                  <div className="map-placeholder">
                    <div className="map-icon">🗺️</div>
                    <p>Mapa de ubicación disponible próximamente</p>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="tab-panel">
                  <div className="reviews-header">
                    <h3>Reseñas y Calificaciones</h3>
                    <div className="reviews-stats">
                      <span className="reviews-count">{reviews.length} reseñas</span>
                    </div>
                  </div>

                  {reviews.length > 0 ? (
                    <div className="reviews-list">
                      {reviews.map(review => (
                        <div key={review._id} className="review-card">
                          <div className="review-header">
                            <div className="reviewer-info">
                              <div className="reviewer-avatar">
                                {review.usuario?.nombre?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong>{review.usuario?.nombre}</strong>
                                <div className="review-rating">
                                  {'★'.repeat(review.calificacion)}
                                  {'☆'.repeat(5 - review.calificacion)}
                                </div>
                              </div>
                            </div>
                            <span className="review-date">
                              {new Date(review.fecha).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="review-comment">{review.comentario}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-reviews">
                      <div className="no-reviews-icon">💬</div>
                      <p>Aún no hay reseñas para esta actividad.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'organizer' && activity.creador && (
                <div className="tab-panel">
                  <div className="organizer-card">
                    <h3>Información del Organizador</h3>
                    <div className="organizer-info">
                      <div className="organizer-avatar">
                        {activity.creador.empresa?.charAt(0).toUpperCase()}
                      </div>
                      <div className="organizer-details">
                        <h4>{activity.creador.empresa}</h4>
                        <div className="organizer-contact">
                          <div className="contact-item">
                            <span className="contact-icon">📞</span>
                            <a href={`tel:${activity.creador.telefono}`} className="contact-link">
                              {activity.creador.telefono}
                            </a>
                          </div>
                          <div className="contact-item">
                            <span className="contact-icon">✉️</span>
                            <a href={`mailto:${activity.creador.email}`} className="contact-link">
                              {activity.creador.email}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar de acciones */}
          <div className="activity-sidebar">
            <div className="pricing-card">
              <div className="pricing-header">
                <div className="price-comparison">
                  {activity.precioOriginal > activity.precioDescuento ? (
                    <>
                      <span className="original-price">${activity.precioOriginal?.toLocaleString()}</span>
                      <span className="current-price">${activity.precioDescuento?.toLocaleString()}</span>
                    </>
                  ) : (
                    <span className="current-price solo">${activity.precioDescuento?.toLocaleString()}</span>
                  )}
                </div>
                {savings > 0 && (
                  <div className="savings-badge">
                    Ahorras ${savings.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="action-buttons">
                {!isRegistered ? (
                  <button
                    className={`btn-modern warning ${activity.estado !== 'aprobada' ? 'disabled' : ''}`}
                    onClick={handleRegister}
                    disabled={activity.estado !== 'aprobada'}
                  >
                    <span className="btn-icon">🎯</span>
                    Registrarse en la Actividad
                  </button>
                ) : (
                  <button className="btn-modern warning-outline" disabled>
                    <span className="btn-icon">✅</span>
                    Ya estás registrado
                  </button>
                )}

                <button
                  className="btn-modern primary"
                  onClick={handleAddToCart}
                >
                  <span className="btn-icon">🛒</span>
                  Agregar al Carrito
                </button>

                <button
                  className="btn-modern outline"
                  onClick={() => navigate('/activities')}
                >
                  <span className="btn-icon">←</span>
                  Volver a Actividades
                </button>
              </div>

              <div className="activity-meta">
                <div className="meta-item">
                  <span className="meta-label">Estado</span>
                  <span className={`meta-value status-${activity.estado}`}>
                    {activity.estado}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Participantes</span>
                  <span className="meta-value">{participantsCount}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Cupos disponibles</span>
                  <span className="meta-value">{availableSpots}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetails;