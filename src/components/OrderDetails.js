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

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4>Mandado no encontrado</h4>
          <p>El mandado que buscas no existe o ha sido eliminado.</p>
          <Link to="/orders" className="btn btn-primary">Volver a mandados</Link>
        </div>
      </div>
    );
  }

  const canAccept = currentUser?.rol === 'domiciliario' && order.estado === 'pendiente';
  const canComplete = currentUser?.id === order.solicitante?._id && order.estado === 'aceptado';
  const canReview = currentUser?.id === order.solicitante?._id && order.estado === 'completado';

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">🛵 Detalles del Mandado</h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-6">
                  <h5>📋 Información del Mandado</h5>
                  <p><strong>Categoría:</strong> {order.categoria}</p>
                  <p><strong>Estado:</strong> 
                    <span className={`badge ${
                      order.estado === 'pendiente' ? 'bg-warning' :
                      order.estado === 'aceptado' ? 'bg-primary' :
                      order.estado === 'completado' ? 'bg-success' : 'bg-secondary'
                    } ms-2`}>
                      {order.estado}
                    </span>
                  </p>
                  <p><strong>Precio ofertado:</strong> 
                    <span className="h5 text-success ms-2">${order.precioOfertado?.toLocaleString()}</span>
                  </p>
                </div>
                <div className="col-md-6">
                  <h5>⏰ Tiempo</h5>
                  <p><strong>Creación:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                  {order.fechaLimite && (
                    <p><strong>Límite:</strong> {new Date(order.fechaLimite).toLocaleString()}</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h5>📝 Descripción</h5>
                <p className="lead">{order.descripcion}</p>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <h5>📍 Recoger en</h5>
                  <p>{order.ubicacionRecogida}</p>
                </div>
                <div className="col-md-6">
                  <h5>🏠 Entregar en</h5>
                  <p>{order.ubicacionEntrega}</p>
                </div>
              </div>

              {order.notasAdicionales && (
                <div className="mb-4">
                  <h5>📋 Notas Adicionales</h5>
                  <p>{order.notasAdicionales}</p>
                </div>
              )}

              <div className="row">
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6>👤 Solicitante</h6>
                      <p className="mb-1"><strong>Nombre:</strong> {order.solicitante?.nombre}</p>
                      <p className="mb-1"><strong>Teléfono:</strong> {order.solicitante?.telefono}</p>
                      <p className="mb-0"><strong>Email:</strong> {order.solicitante?.email}</p>
                    </div>
                  </div>
                </div>
                {order.ejecutante && (
                  <div className="col-md-6">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6>🚴 Domiciliario</h6>
                        <p className="mb-1"><strong>Nombre:</strong> {order.ejecutante?.nombre}</p>
                        <p className="mb-1"><strong>Teléfono:</strong> {order.ejecutante?.telefono}</p>
                        <p className="mb-0"><strong>Email:</strong> {order.ejecutante?.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow sticky-top" style={{ top: '20px' }}>
            <div className="card-body">
              <h5>🎯 Acciones</h5>
              
              <div className="d-grid gap-2 mb-3">
                {canAccept && (
                  <button
                    className="btn btn-success btn-lg"
                    onClick={handleAcceptOrder}
                  >
                    ✅ Aceptar Mandado
                  </button>
                )}

                {canComplete && (
                  <button
                    className="btn btn-warning btn-lg"
                    onClick={handleCompleteOrder}
                  >
                    🏁 Marcar como Completado
                  </button>
                )}

                {canReview && (
                  <button
                    className="btn btn-info btn-lg"
                    onClick={() => setShowReviewModal(true)}
                  >
                    ⭐ Calificar Servicio
                  </button>
                )}

                <button
                  className="btn btn-outline-primary"
                  onClick={() => navigate('/orders')}
                >
                  ← Volver a Mandados
                </button>
              </div>

              <div className="alert alert-info">
                <small>
                  <strong>Estado actual:</strong> {order.estado}<br />
                  {order.ejecutante && (
                    <><strong>Domiciliario:</strong> {order.ejecutante.nombre}</>
                  )}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Calificación */}
      {showReviewModal && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">⭐ Calificar Servicio</h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowReviewModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-3">
                  <h6>¿Cómo calificarías el servicio del domiciliario?</h6>
                  <div className="my-3">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        className="btn btn-link p-1"
                        onClick={() => setReview(prev => ({ ...prev, calificacion: star }))}
                      >
                        <span style={{ fontSize: '2rem', color: star <= review.calificacion ? '#ffc107' : '#e4e5e9' }}>
                          {star <= review.calificacion ? '⭐' : '☆'}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p>{review.calificacion} de 5 estrellas</p>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Comentario (opcional)</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={review.comentario}
                    onChange={(e) => setReview(prev => ({ ...prev, comentario: e.target.value }))}
                    placeholder="Comparte tu experiencia con el servicio..."
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowReviewModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleSubmitReview}
                >
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