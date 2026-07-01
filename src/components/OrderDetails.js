import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import axios from 'axios';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, API_URL } = useAuth();
  const { addNotification } = useNotification();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [review, setReview] = useState({ calificacion: 5, comentario: '' });
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      addNotification('Error al cargar los detalles del mandado', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async () => {
    if (!currentUser || currentUser.rol !== 'domiciliario') {
      addNotification('Solo los domiciliarios pueden aceptar mandados', 'warning');
      return;
    }

    try {
      await axios.put(`${API_URL}/orders/${id}/accept`);
      addNotification('¡Has aceptado el mandado!', 'success');
      fetchOrderDetails();
    } catch (error) {
      console.error('Error accepting order:', error);
      addNotification('Error al aceptar el mandado', 'error');
    }
  };

  const handleCompleteOrder = async () => {
    try {
      await axios.put(`${API_URL}/orders/${id}`, { estado: 'completado' });
      addNotification('Mandado marcado como completado', 'success');
      fetchOrderDetails();
      setShowReviewModal(true);
    } catch (error) {
      console.error('Error completing order:', error);
      addNotification('Error al completar el mandado', 'error');
    }
  };

  const handleSubmitReview = async () => {
    if (!review.comentario.trim()) {
      addNotification('Por favor escribe un comentario', 'warning');
      return;
    }

    try {
      await axios.post(`${API_URL}/reviews`, {
        tipo: 'order',
        itemId: id,
        usuario: currentUser.id,
        calificacion: review.calificacion,
        comentario: review.comentario
      });
      addNotification('¡Gracias por tu reseña!', 'success');
      setShowReviewModal(false);
      setReview({ calificacion: 5, comentario: '' });
    } catch (error) {
      console.error('Error submitting review:', error);
      addNotification('Error al enviar la reseña', 'error');
    }
  };

  const getStatusConfig = (estado) => {
    const statusConfig = {
      pendiente: { label: 'Pendiente', color: 'warning', icon: '⏳' },
      aceptado: { label: 'Aceptado', color: 'primary', icon: '👍' },
      en_camino: { label: 'En camino', color: 'info', icon: '🛵' },
      completado: { label: 'Completado', color: 'success', icon: '✅' },
      cancelado: { label: 'Cancelado', color: 'error', icon: '❌' }
    };
    return statusConfig[estado] || statusConfig.pendiente;
  };

  const getCategoryIcon = (categoria) => {
    const icons = {
      documentos: '📄',
      comida: '🍕',
      farmacia: '💊',
      mercado: '🛒',
      otros: '📦'
    };
    return icons[categoria] || '📦';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'No especificada';
    const date = new Date(dateString);
    return {
      full: date.toLocaleString('es-ES'),
      date: date.toLocaleDateString('es-ES'),
      time: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="modern-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Cargando detalles del mandado...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="modern-container">
        <div className="error-state">
          <div className="error-icon">😕</div>
          <h2>Mandado no encontrado</h2>
          <p>El mandado que buscas no existe o ha sido eliminado.</p>
          <Link to="/orders" className="btn-modern primary">
            Volver a mandados
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.estado);
  const creationDate = formatDateTime(order.createdAt);
  const limitDate = formatDateTime(order.fechaLimite);
  
  const canAccept = currentUser?.rol === 'domiciliario' && order.estado === 'pendiente';
  const canComplete = currentUser?.id === order.solicitante?._id && order.estado === 'aceptado';
  const canReview = currentUser?.id === order.solicitante?._id && order.estado === 'completado';

  return (
    <div className="main-content">
      <div className="modern-container">
        {/* Header del mandado */}
        <div className="order-header">
          <div className="breadcrumb">
            <Link to="/orders" className="breadcrumb-link">Mandados</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">#{order._id?.slice(-6).toUpperCase()}</span>
          </div>
          
          <div className="order-status">
            <div className={`status-badge ${statusConfig.color}`}>
              <span className="status-icon">{statusConfig.icon}</span>
              {statusConfig.label}
            </div>
          </div>
        </div>

        <div className="order-layout">
          {/* Contenido principal */}
          <div className="order-main">
            {/* Información principal */}
            <div className="order-card">
              <div className="order-title-section">
                <div className="order-category">
                  <span className="category-icon">{getCategoryIcon(order.categoria)}</span>
                  <span className="category-name">{order.categoria}</span>
                </div>
                <h1 className="order-title">{order.descripcion}</h1>
                <div className="order-price">
                  ${order.precioOfertado?.toLocaleString()}
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
                  className={`tab-btn ${activeTab === 'route' ? 'active' : ''}`}
                  onClick={() => setActiveTab('route')}
                >
                  Ruta
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveTab('users')}
                >
                  Personas
                </button>
              </div>

              {/* Contenido de pestañas */}
              <div className="tab-content">
                {activeTab === 'details' && (
                  <div className="tab-panel">
                    <div className="details-grid">
                      <div className="detail-section">
                        <h3>📋 Información General</h3>
                        <div className="detail-item">
                          <label>Categoría</label>
                          <span>{order.categoria}</span>
                        </div>
                        <div className="detail-item">
                          <label>Precio</label>
                          <span className="price-value">${order.precioOfertado?.toLocaleString()}</span>
                        </div>
                        <div className="detail-item">
                          <label>Fecha de creación</label>
                          <span>{creationDate.full}</span>
                        </div>
                        {order.fechaLimite && (
                          <div className="detail-item">
                            <label>Fecha límite</label>
                            <span>{limitDate.full}</span>
                          </div>
                        )}
                      </div>

                      <div className="detail-section">
                        <h3>📝 Descripción</h3>
                        <p className="order-description">{order.descripcion}</p>
                        
                        {order.notasAdicionales && (
                          <>
                            <h4>Notas Adicionales</h4>
                            <p className="order-notes">{order.notasAdicionales}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'route' && (
                  <div className="tab-panel">
                    <div className="route-visualization">
                      <div className="route-step">
                        <div className="step-icon pickup">📍</div>
                        <div className="step-content">
                          <h4>Punto de Recogida</h4>
                          <p>{order.ubicacionRecogida}</p>
                        </div>
                      </div>
                      
                      <div className="route-connector">
                        <div className="connector-line"></div>
                        <div className="connector-arrow">↓</div>
                      </div>

                      <div className="route-step">
                        <div className="step-icon delivery">🏠</div>
                        <div className="step-content">
                          <h4>Punto de Entrega</h4>
                          <p>{order.ubicacionEntrega}</p>
                        </div>
                      </div>
                    </div>

                    <div className="map-placeholder">
                      <div className="map-icon">🗺️</div>
                      <p>Mapa de ruta disponible próximamente</p>
                    </div>
                  </div>
                )}

                {activeTab === 'users' && (
                  <div className="tab-panel">
                    <div className="users-grid">
                      {/* Solicitante */}
                      <div className="user-card">
                        <div className="user-header">
                          <div className="user-avatar">
                            {order.solicitante?.nombre?.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-info">
                            <h4>{order.solicitante?.nombre}</h4>
                            <span className="user-role">Solicitante</span>
                          </div>
                        </div>
                        <div className="user-contact">
                          <div className="contact-item">
                            <span className="contact-icon">📞</span>
                            <a href={`tel:${order.solicitante?.telefono}`} className="contact-link">
                              {order.solicitante?.telefono}
                            </a>
                          </div>
                          <div className="contact-item">
                            <span className="contact-icon">✉️</span>
                            <a href={`mailto:${order.solicitante?.email}`} className="contact-link">
                              {order.solicitante?.email}
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Domiciliario */}
                      {order.ejecutante ? (
                        <div className="user-card">
                          <div className="user-header">
                            <div className="user-avatar">
                              {order.ejecutante?.nombre?.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-info">
                              <h4>{order.ejecutante?.nombre}</h4>
                              <span className="user-role">Domiciliario</span>
                            </div>
                          </div>
                          <div className="user-contact">
                            <div className="contact-item">
                              <span className="contact-icon">📞</span>
                              <a href={`tel:${order.ejecutante?.telefono}`} className="contact-link">
                                {order.ejecutante?.telefono}
                              </a>
                            </div>
                            <div className="contact-item">
                              <span className="contact-icon">✉️</span>
                              <a href={`mailto:${order.ejecutante?.email}`} className="contact-link">
                                {order.ejecutante?.email}
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="user-card empty">
                          <div className="user-header">
                            <div className="user-avatar">👤</div>
                            <div className="user-info">
                              <h4>Esperando domiciliario</h4>
                              <span className="user-role">Pendiente de asignación</span>
                            </div>
                          </div>
                          <p className="empty-message">
                            Este mandado está esperando que un domiciliario lo acepte.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar de acciones */}
          <div className="order-sidebar">
            <div className="action-card">
              <div className="action-header">
                <h3>🎯 Acciones</h3>
                <p>Gestiona este mandado</p>
              </div>

              <div className="action-buttons">
                {canAccept && (
                  <button
                    className="btn-modern success"
                    onClick={handleAcceptOrder}
                  >
                    <span className="btn-icon">✅</span>
                    Aceptar Mandado
                  </button>
                )}

                {canComplete && (
                  <button
                    className="btn-modern warning"
                    onClick={handleCompleteOrder}
                  >
                    <span className="btn-icon">🏁</span>
                    Marcar como Completado
                  </button>
                )}

                {canReview && (
                  <button
                    className="btn-modern info"
                    onClick={() => setShowReviewModal(true)}
                  >
                    <span className="btn-icon">⭐</span>
                    Calificar Servicio
                  </button>
                )}

                <button
                  className="btn-modern outline"
                  onClick={() => navigate('/orders')}
                >
                  <span className="btn-icon">←</span>
                  Volver a Mandados
                </button>
              </div>

              <div className="order-summary">
                <div className="summary-item">
                  <span className="summary-label">Estado actual</span>
                  <span className={`summary-value status-${order.estado}`}>
                    {statusConfig.label}
                  </span>
                </div>
                {order.ejecutante && (
                  <div className="summary-item">
                    <span className="summary-label">Domiciliario asignado</span>
                    <span className="summary-value">{order.ejecutante.nombre}</span>
                  </div>
                )}
                <div className="summary-item">
                  <span className="summary-label">ID del mandado</span>
                  <span className="summary-value order-id">#{order._id?.slice(-6).toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Calificación Moderno */}
      {showReviewModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-title">
                  <span className="modal-icon">⭐</span>
                  <h3>Calificar Servicio</h3>
                </div>
                <button 
                  className="modal-close"
                  onClick={() => setShowReviewModal(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="modal-body">
                <div className="rating-section">
                  <h4>¿Cómo calificarías el servicio del domiciliario?</h4>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        className={`star-btn ${star <= review.calificacion ? 'active' : ''}`}
                        onClick={() => setReview(prev => ({ ...prev, calificacion: star }))}
                      >
                        <span className="star-icon">
                          {star <= review.calificacion ? '★' : '☆'}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="rating-text">
                    <span className="rating-score">{review.calificacion}</span>
                    <span className="rating-max">/5 estrellas</span>
                  </div>
                </div>
                
                <div className="comment-section">
                  <label className="form-label">Comentario (opcional)</label>
                  <textarea
                    className="modern-textarea"
                    rows="4"
                    value={review.comentario}
                    onChange={(e) => setReview(prev => ({ ...prev, comentario: e.target.value }))}
                    placeholder="Comparte tu experiencia con el servicio..."
                  ></textarea>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  className="btn-modern outline"
                  onClick={() => setShowReviewModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="btn-modern primary"
                  onClick={handleSubmitReview}
                >
                  <span className="btn-icon">📨</span>
                  Enviar Reseña
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;