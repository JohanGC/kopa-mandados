import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import axios from 'axios';

const MyOffers = () => {
  const { currentUser, API_URL } = useAuth();
  const { addNotification } = useNotification();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (currentUser) {
      fetchMyOffers();
    }
  }, [currentUser]);

  const fetchMyOffers = async () => {
    try {
      const response = await axios.get(`${API_URL}/offers/user/my-offers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setOffers(response.data);
    } catch (error) {
      console.error('Error fetching my offers:', error);
      addNotification('Error al cargar tus ofertas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta oferta?')) {
      try {
        await axios.delete(`${API_URL}/offers/${offerId}`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
        });
        
        setOffers(prev => prev.filter(offer => offer._id !== offerId));
        addNotification('Oferta eliminada exitosamente', 'success');
      } catch (error) {
        console.error('Error deleting offer:', error);
        addNotification('Error al eliminar la oferta', 'error');
      }
    }
  };

  const getStatusBadge = (estado) => {
    const statuses = {
      pendiente: 'warning',
      aprobada: 'success',
      rechazada: 'danger'
    };
    return `badge bg-${statuses[estado]}`;
  };

  const filteredOffers = offers.filter(offer => {
    if (activeFilter === 'all') return true;
    return offer.estado === activeFilter;
  });

  const getStatusCount = (status) => {
    return offers.filter(offer => offer.estado === status).length;
  };

  if (!currentUser || (currentUser.rol !== 'oferente' && currentUser.rol !== 'administrador')) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning text-center">
          <h4>No tienes permisos para ver esta página</h4>
          <p>Solo los oferentes pueden gestionar sus ofertas.</p>
          <Link to="/offers" className="btn btn-primary">Ver Ofertas</Link>
        </div>
      </div>
    );
  }

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

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0">🏷️ Mis Ofertas</h4>
              <Link to="/create-offer" className="btn btn-light">
                ➕ Crear Nueva Oferta
              </Link>
            </div>
            <div className="card-body">
              {/* Estadísticas rápidas */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <div className="card text-white bg-primary">
                    <div className="card-body text-center">
                      <h5 className="card-title">{offers.length}</h5>
                      <p className="card-text">Total</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-white bg-success">
                    <div className="card-body text-center">
                      <h5 className="card-title">{getStatusCount('aprobada')}</h5>
                      <p className="card-text">Aprobadas</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-white bg-warning">
                    <div className="card-body text-center">
                      <h5 className="card-title">{getStatusCount('pendiente')}</h5>
                      <p className="card-text">Pendientes</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-white bg-danger">
                    <div className="card-body text-center">
                      <h5 className="card-title">{getStatusCount('rechazada')}</h5>
                      <p className="card-text">Rechazadas</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtros */}
              <div className="mb-4">
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn ${activeFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveFilter('all')}
                  >
                    Todas ({offers.length})
                  </button>
                  <button
                    type="button"
                    className={`btn ${activeFilter === 'aprobada' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => setActiveFilter('aprobada')}
                  >
                    Aprobadas ({getStatusCount('aprobada')})
                  </button>
                  <button
                    type="button"
                    className={`btn ${activeFilter === 'pendiente' ? 'btn-warning' : 'btn-outline-warning'}`}
                    onClick={() => setActiveFilter('pendiente')}
                  >
                    Pendientes ({getStatusCount('pendiente')})
                  </button>
                  <button
                    type="button"
                    className={`btn ${activeFilter === 'rechazada' ? 'btn-danger' : 'btn-outline-danger'}`}
                    onClick={() => setActiveFilter('rechazada')}
                  >
                    Rechazadas ({getStatusCount('rechazada')})
                  </button>
                </div>
              </div>

              {/* Lista de ofertas */}
              {filteredOffers.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Título</th>
                        <th>Precio</th>
                        <th>Descuento</th>
                        <th>Participantes</th>
                        <th>Fechas</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOffers.map(offer => (
                        <tr key={offer._id}>
                          <td>
                            <strong>{offer.titulo}</strong>
                            <br />
                            <small className="text-muted">{offer.categoria}</small>
                          </td>
                          <td>
                            <div>
                              <del className="text-muted">${offer.precioOriginal?.toLocaleString()}</del>
                              <br />
                              <strong className="text-success">${offer.precioDescuento?.toLocaleString()}</strong>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-info">{offer.descuento}%</span>
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {offer.participantes?.length || 0}/{offer.maxParticipantes || '∞'}
                            </span>
                          </td>
                          <td>
                            <small>
                              Inicio: {new Date(offer.fechaInicio).toLocaleDateString()}
                              <br />
                              Fin: {new Date(offer.fechaFin).toLocaleDateString()}
                            </small>
                          </td>
                          <td>
                            <span className={getStatusBadge(offer.estado)}>
                              {offer.estado}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <Link
                                to={`/offer/${offer._id}`}
                                className="btn btn-outline-primary"
                                title="Ver detalles"
                              >
                                👁️
                              </Link>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDeleteOffer(offer._id)}
                                title="Eliminar oferta"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="mb-4">
                    <span style={{ fontSize: '4rem' }}>🏷️</span>
                  </div>
                  <h4>No tienes ofertas</h4>
                  <p className="text-muted">
                    {activeFilter === 'all' 
                      ? 'Aún no has creado ninguna oferta.'
                      : `No tienes ofertas con estado "${activeFilter}".`
                    }
                  </p>
                  <div className="mt-3">
                    <Link to="/create-offer" className="btn btn-success">
                      ➕ Crear Mi Primera Oferta
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyOffers;