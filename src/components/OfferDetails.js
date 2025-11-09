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

    // Crear item para el carrito con la estructura correcta
    const cartItem = {
      _id: offer._id,
      titulo: offer.titulo,
      descripcion: offer.descripcion,
      categoria: offer.categoria,
      precioOriginal: offer.precioOriginal,
      precioDescuento: offer.precioDescuento,
      descuento: offer.descuento,
      imagen: offer.imagen,
      type: 'offer',  // Tipo específico para identificar en el carrito
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
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4>Oferta no encontrada</h4>
          <p>La oferta que buscas no existe o ha sido eliminada.</p>
          <Link to="/offers" className="btn btn-primary">Volver a ofertas</Link>
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
                <h1 className="card-title">{offer.titulo}</h1>
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
                  src={offer.imagen || '/images/placeholder-offer.jpg'}
                  alt={offer.titulo}
                  className="img-fluid rounded"
                  style={{ maxHeight: '400px', width: '100%', objectFit: 'cover' }}
                />
              </div>

              <div className="mb-4">
                <h4>Descripción</h4>
                <p className="lead">{offer.descripcion}</p>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <h5>📅 Fechas</h5>
                  <p>
                    <strong>Inicio:</strong> {new Date(offer.fechaInicio).toLocaleDateString()}<br />
                    <strong>Fin:</strong> {new Date(offer.fechaFin).toLocaleDateString()}
                  </p>
                </div>
                <div className="col-md-6">
                  <h5>📊 Información</h5>
                  <p>
                    <strong>Categoría:</strong> {offer.categoria}<br />
                    <strong>Tipo:</strong> {offer.tipoOferta}<br />
                    <strong>Participantes:</strong> {offer.participantes?.length || 0}/{offer.maxParticipantes || 'Ilimitado'}
                  </p>
                </div>
              </div>

              {offer.condiciones && (
                <div className="mb-4">
                  <h5>📝 Condiciones</h5>
                  <p>{offer.condiciones}</p>
                </div>
              )}

              {offer.creador && (
                <div className="card bg-light">
                  <div className="card-body">
                    <h6>🏢 Información del Oferente</h6>
                    <p className="mb-1"><strong>Empresa:</strong> {offer.creador.empresa}</p>
                    <p className="mb-1"><strong>Contacto:</strong> {offer.creador.telefono}</p>
                    <p className="mb-0"><strong>Email:</strong> {offer.creador.email}</p>
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
                <p className="text-muted">Aún no hay reseñas para esta oferta.</p>
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
                  <del className="text-muted h5">${offer.precioOriginal?.toLocaleString()}</del>
                </div>
                <div className="h2 text-success mb-0">${offer.precioDescuento?.toLocaleString()}</div>
                <div className="text-warning h5">
                  {offer.descuento}% DE DESCUENTO
                </div>
              </div>

              <div className="d-grid gap-2">
                {!isParticipating ? (
                  <button
                    className="btn btn-success btn-lg"
                    onClick={handleParticipate}
                    disabled={offer.estado !== 'aprobada'}
                  >
                    🎯 Inscribirse en la Oferta
                  </button>
                ) : (
                  <button className="btn btn-outline-success btn-lg" disabled>
                    ✅ Ya estás inscrito
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
                  onClick={() => navigate('/offers')}
                >
                  ← Volver a Ofertas
                </button>
              </div>

              <div className="mt-4">
                <div className="alert alert-info">
                  <small>
                    <strong>Estado:</strong> {offer.estado}<br />
                    <strong>Participantes:</strong> {offer.participantes?.length || 0}<br />
                    <strong>Cupos disponibles:</strong> {offer.maxParticipantes ? (offer.maxParticipantes - (offer.participantes?.length || 0)) : 'Ilimitados'}
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

export default OfferDetails;