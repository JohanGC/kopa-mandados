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

    // Crear item para el carrito con la estructura correcta
    const cartItem = {
      _id: activity._id,
      titulo: activity.titulo,
      descripcion: activity.descripcion,
      categoria: activity.categoria,
      precioOriginal: activity.precioOriginal,
      precioDescuento: activity.precioDescuento,
      descuento: activity.descuento,
      imagen: activity.imagen,
      type: 'activity',  // Tipo específico para identificar en el carrito
      fecha: activity.fecha,
      hora: activity.hora,
      ubicacion: activity.ubicacion
    };

    addToCart(cartItem);
    addNotification('Actividad agregada al carrito', 'success');
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

  if (!activity) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4>Actividad no encontrada</h4>
          <p>La actividad que buscas no existe o ha sido eliminada.</p>
          <Link to="/activities" className="btn btn-primary">Volver a actividades</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <h1 className="card-title">{activity.titulo}</h1>
                <button
                  className={`btn ${isFavorite ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={handleAddToFavorites}
                  title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >
                  {isFavorite ? '❤️' : '🤍'}
                </button>
              </div>

              <div className="mb-4">
                <img
                  src={activity.imagen || '/images/placeholder-activity.jpg'}
                  alt={activity.titulo}
                  className="img-fluid rounded"
                  style={{ maxHeight: '400px', width: '100%', objectFit: 'cover' }}
                />
              </div>

              <div className="mb-4">
                <h4>Descripción</h4>
                <p className="lead">{activity.descripcion}</p>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <h5>📅 Fecha y Hora</h5>
                  <p>
                    <strong>Fecha:</strong> {new Date(activity.fecha).toLocaleDateString()}<br />
                    <strong>Hora:</strong> {activity.hora}<br />
                    <strong>Duración:</strong> {activity.duracion}
                  </p>
                </div>
                <div className="col-md-6">
                  <h5>📍 Ubicación</h5>
                  <p>{activity.ubicacion}</p>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <h5>📊 Información</h5>
                  <p>
                    <strong>Categoría:</strong> {activity.categoria}<br />
                    <strong>Participantes:</strong> {activity.participantes?.length || 0}/{activity.maxParticipantes}
                  </p>
                </div>
                <div className="col-md-6">
                  <h5>🎯 Requisitos</h5>
                  <p>{activity.requisitos || 'No se requieren conocimientos previos'}</p>
                </div>
              </div>

              {activity.creador && (
                <div className="card bg-light">
                  <div className="card-body">
                    <h6>🏢 Información del Organizador</h6>
                    <p className="mb-1"><strong>Empresa:</strong> {activity.creador.empresa}</p>
                    <p className="mb-1"><strong>Contacto:</strong> {activity.creador.telefono}</p>
                    <p className="mb-0"><strong>Email:</strong> {activity.creador.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sección de Reseñas */}
          <div className="card shadow mt-4">
            <div className="card-body">
              <h4>⭐ Reseñas y Calificaciones</h4>
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <div key={review._id} className="border-bottom pb-3 mb-3">
                    <div className="d-flex justify-content-between">
                      <strong>{review.usuario?.nombre}</strong>
                      <div>
                        {'⭐'.repeat(review.calificacion)}
                        {'☆'.repeat(5 - review.calificacion)}
                      </div>
                    </div>
                    <p className="mb-1">{review.comentario}</p>
                    <small className="text-muted">
                      {new Date(review.fecha).toLocaleDateString()}
                    </small>
                  </div>
                ))
              ) : (
                <p className="text-muted">Aún no hay reseñas para esta actividad.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow sticky-top" style={{ top: '20px' }}>
            <div className="card-body">
              <div className="text-center mb-4">
                <h3 className="text-success">Precios</h3>
                <div className="mb-2">
                  <del className="text-muted h5">${activity.precioOriginal?.toLocaleString()}</del>
                </div>
                <div className="h2 text-success mb-0">${activity.precioDescuento?.toLocaleString()}</div>
                <div className="text-warning h5">
                  {activity.descuento}% DE DESCUENTO
                </div>
              </div>

              <div className="d-grid gap-2">
                {!isRegistered ? (
                  <button
                    className="btn btn-warning btn-lg"
                    onClick={handleRegister}
                    disabled={activity.estado !== 'aprobada'}
                  >
                    🎯 Registrarse en la Actividad
                  </button>
                ) : (
                  <button className="btn btn-outline-warning btn-lg" disabled>
                    ✅ Ya estás registrado
                  </button>
                )}

                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleAddToCart}
                >
                  🛒 Agregar al Carrito
                </button>

                <button
                  className="btn btn-outline-primary"
                  onClick={() => navigate('/activities')}
                >
                  ← Volver a Actividades
                </button>
              </div>

              <div className="mt-4">
                <div className="alert alert-info">
                  <small>
                    <strong>Estado:</strong> {activity.estado}<br />
                    <strong>Participantes:</strong> {activity.participantes?.length || 0}<br />
                    <strong>Cupos disponibles:</strong> {activity.maxParticipantes - (activity.participantes?.length || 0)}
                  </small>
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