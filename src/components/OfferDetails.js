import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const OfferDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, API_URL } = useAuth();
  const { addNotification } = useNotification();
  const { addToCart } = useCart();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isParticipating, setIsParticipating] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchOfferDetails();
    checkFavoriteStatus();
    checkParticipationStatus();
    fetchReviews();
  }, [id]);

  const fetchOfferDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/offers/${id}`);
      setOffer(response.data);
    } catch (error) {
      console.error('Error fetching offer details:', error);
      addNotification('Error al cargar los detalles de la oferta', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!currentUser) return;
    try {
      const response = await axios.get(`${API_URL}/favorites/check`, {
        params: { itemId: id, tipo: 'offer' },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setIsFavorite(response.data.isFavorite);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const checkParticipationStatus = async () => {
    if (!currentUser) return;
    try {
      const response = await axios.get(`${API_URL}/offers/${id}/participation`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setIsParticipating(response.data.isParticipating);
    } catch (error) {
      console.error('Error checking participation status:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/reviews`, {
        params: { tipo: 'offer', itemId: id }
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
            tipo: 'offer' 
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
          tipo: 'offer'
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

  const handleParticipate = async () => {
    if (!currentUser) {
      addNotification('Debes iniciar sesión para participar', 'warning');
      navigate('/login');
      return;
    }

    try {
      await axios.post(`${API_URL}/offers/${id}/participate`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setIsParticipating(true);
      addNotification('¡Te has inscrito en esta oferta!', 'success');
    } catch (error) {
      console.error('Error participating in offer:', error);
      addNotification('Error al inscribirse en la oferta', 'error');
    }
  };

  const handleAddToCart = () => {
    if (!currentUser) {
      addNotification('Debes iniciar sesión para agregar al carrito', 'warning');
      navigate('/login');
      return;
    }

    if (!offer) return;

    const cartItem = {
      _id: offer._id,
      titulo: offer.titulo,
      descripcion: offer.descripcion,
      categoria: offer.categoria,
      precioOriginal: offer.precioOriginal,
      precioDescuento: offer.precioDescuento,
      descuento: offer.descuento,
      imagen: offer.imagen,
      type: 'offer',
      fechaInicio: offer.fechaInicio,
      fechaFin: offer.fechaFin,
      condiciones: offer.condiciones,
      tipoOferta: offer.tipoOferta
    };

    addToCart(cartItem);
    addNotification('Oferta agregada al carrito', 'success');
  };

  if (loading) {
    return (
      <div className="modern-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando oferta...</p>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="modern-container">
        <div className="error-state">
          <div className="error-icon">😕</div>
          <h2>Oferta no encontrada</h2>
          <p>La oferta que buscas no existe o ha sido eliminada.</p>
          <Link to="/offers" className="btn-modern primary">
            Volver a ofertas
          </Link>
        </div>
      </div>
    );
  }

  const savings = offer.precioOriginal - offer.precioDescuento;
  const participantsCount = offer.participantes?.length || 0;
  const availableSpots = offer.maxParticipantes ? (offer.maxParticipantes - participantsCount) : null;

  return (
    <div className="modern-container">
      {/* Header de la oferta */}
      <div className="offer-header">
        <div className="breadcrumb">
          <Link to="/offers" className="breadcrumb-link">Ofertas</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{offer.titulo}</span>
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

      <div className="offer-layout">
        {/* Contenido principal */}
        <div className="offer-main">
          {/* Imagen principal */}
          <div className="offer-image-section">
            <img
              src={offer.imagen || '/images/placeholder-offer.jpg'}
              alt={offer.titulo}
              className="offer-image"
            />
            {offer.descuento > 0 && (
              <div className="discount-badge">
                -{offer.descuento}%
              </div>
            )}
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
              className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reseñas ({reviews.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'provider' ? 'active' : ''}`}
              onClick={() => setActiveTab('provider')}
            >
              Oferente
            </button>
          </div>

          {/* Contenido de pestañas */}
          <div className="tab-content">
            {activeTab === 'details' && (
              <div className="tab-panel">
                <h1 className="offer-title">{offer.titulo}</h1>
                <p className="offer-description">{offer.descripcion}</p>

                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-icon">📅</div>
                    <div className="info-content">
                      <label>Fecha de inicio</label>
                      <span>{new Date(offer.fechaInicio).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-icon">⏰</div>
                    <div className="info-content">
                      <label>Fecha de fin</label>
                      <span>{new Date(offer.fechaFin).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-icon">📊</div>
                    <div className="info-content">
                      <label>Categoría</label>
                      <span>{offer.categoria}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-icon">🎯</div>
                    <div className="info-content">
                      <label>Tipo de oferta</label>
                      <span>{offer.tipoOferta}</span>
                    </div>
                  </div>
                </div>

                {offer.condiciones && (
                  <div className="conditions-section">
                    <h3>Condiciones</h3>
                    <p>{offer.condiciones}</p>
                  </div>
                )}
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
                    <p>Aún no hay reseñas para esta oferta.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'provider' && offer.creador && (
              <div className="tab-panel">
                <div className="provider-card">
                  <h3>Información del Oferente</h3>
                  <div className="provider-info">
                    <div className="provider-avatar">
                      {offer.creador.empresa?.charAt(0).toUpperCase()}
                    </div>
                    <div className="provider-details">
                      <h4>{offer.creador.empresa}</h4>
                      <div className="provider-contact">
                        <div className="contact-item">
                          <span className="contact-icon">📞</span>
                          <span>{offer.creador.telefono}</span>
                        </div>
                        <div className="contact-item">
                          <span className="contact-icon">✉️</span>
                          <span>{offer.creador.email}</span>
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
        <div className="offer-sidebar">
          <div className="pricing-card">
            <div className="pricing-header">
              <div className="price-comparison">
                <span className="original-price">${offer.precioOriginal?.toLocaleString()}</span>
                <span className="discount-price">${offer.precioDescuento?.toLocaleString()}</span>
              </div>
              {savings > 0 && (
                <div className="savings-badge">
                  Ahorras ${savings.toLocaleString()}
                </div>
              )}
            </div>

            <div className="action-buttons">
              {!isParticipating ? (
                <button
                  className={`btn-modern success ${offer.estado !== 'aprobada' ? 'disabled' : ''}`}
                  onClick={handleParticipate}
                  disabled={offer.estado !== 'aprobada'}
                >
                  <span className="btn-icon">🎯</span>
                  Inscribirse en la Oferta
                </button>
              ) : (
                <button className="btn-modern success-outline" disabled>
                  <span className="btn-icon">✅</span>
                  Ya estás inscrito
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
                onClick={() => navigate('/offers')}
              >
                <span className="btn-icon">←</span>
                Volver a Ofertas
              </button>
            </div>

            <div className="offer-meta">
              <div className="meta-item">
                <span className="meta-label">Estado</span>
                <span className={`meta-value status-${offer.estado}`}>
                  {offer.estado}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Participantes</span>
                <span className="meta-value">{participantsCount}</span>
              </div>
              {availableSpots !== null && (
                <div className="meta-item">
                  <span className="meta-label">Cupos disponibles</span>
                  <span className="meta-value">{availableSpots}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferDetails;