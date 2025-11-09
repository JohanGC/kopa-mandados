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

  const getItemTypeLabel = (tipo) => {
    return tipo === 'offer' ? '🏷️ Oferta' : '🎯 Actividad';
  };

  if (!currentUser) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning text-center">
          <h4>Debes iniciar sesión para ver tus favoritos</h4>
          <p>Inicia sesión para acceder a tu lista de favoritos.</p>
          <Link to="/login" className="btn btn-primary">Iniciar Sesión</Link>
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
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">❤️ Mis Favoritos</h4>
            </div>
            <div className="card-body">
              {/* Filtros */}
              <div className="mb-4">
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveTab('all')}
                  >
                    Todos ({favorites.length})
                  </button>
                  <button
                    type="button"
                    className={`btn ${activeTab === 'offer' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => setActiveTab('offer')}
                  >
                    🏷️ Ofertas ({favorites.filter(f => f.tipo === 'offer').length})
                  </button>
                  <button
                    type="button"
                    className={`btn ${activeTab === 'activity' ? 'btn-warning' : 'btn-outline-warning'}`}
                    onClick={() => setActiveTab('activity')}
                  >
                    🎯 Actividades ({favorites.filter(f => f.tipo === 'activity').length})
                  </button>
                </div>
              </div>

              {/* Lista de favoritos */}
              {filteredFavorites.length > 0 ? (
                <div className="row">
                  {filteredFavorites.map(favorite => {
                    const item = getItemDetails(favorite);
                    return (
                      <div key={favorite._id} className="col-md-6 mb-4">
                        <div className="card h-100">
                          <div className="card-header d-flex justify-content-between align-items-center">
                            <span className="badge bg-secondary">
                              {getItemTypeLabel(favorite.tipo)}
                            </span>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRemoveFavorite(favorite._id, item._id, favorite.tipo)}
                              title="Eliminar de favoritos"
                            >
                              ❌
                            </button>
                          </div>
                          
                          <div className="card-body">
                            <h5 className="card-title">{item.titulo}</h5>
                            <p className="card-text text-muted small">
                              {item.descripcion?.substring(0, 100)}...
                            </p>
                            
                            {favorite.tipo === 'offer' && (
                              <div className="mb-2">
                                <div className="d-flex justify-content-between align-items-center">
                                  {item.precioOriginal && item.precioDescuento && (
                                    <>
                                      <del className="text-muted">${item.precioOriginal?.toLocaleString()}</del>
                                      <strong className="text-success h5 mb-0">
                                        ${item.precioDescuento?.toLocaleString()}
                                      </strong>
                                    </>
                                  )}
                                </div>
                                {item.descuento && (
                                  <span className="badge bg-warning text-dark">
                                    {item.descuento}% OFF
                                  </span>
                                )}
                              </div>
                            )}

                            {favorite.tipo === 'activity' && (
                              <div className="mb-2">
                                {item.fecha && (
                                  <p className="mb-1">
                                    <small>
                                      <strong>Fecha:</strong> {new Date(item.fecha).toLocaleDateString()}
                                    </small>
                                  </p>
                                )}
                                {item.hora && (
                                  <p className="mb-1">
                                    <small>
                                      <strong>Hora:</strong> {item.hora}
                                    </small>
                                  </p>
                                )}
                                {item.ubicacion && (
                                  <p className="mb-1">
                                    <small>
                                      <strong>Ubicación:</strong> {item.ubicacion}
                                    </small>
                                  </p>
                                )}
                              </div>
                            )}

                            {item.creador && (
                              <p className="mb-2">
                                <small className="text-muted">
                                  <strong>Por:</strong> {item.creador.empresa || item.creador.nombre}
                                </small>
                              </p>
                            )}
                          </div>
                          
                          <div className="card-footer">
                            <div className="d-grid gap-2">
                              <Link 
                                to={getItemLink(favorite)} 
                                className="btn btn-primary btn-sm"
                              >
                                Ver Detalles
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="mb-4">
                    <span style={{ fontSize: '4rem' }}>❤️</span>
                  </div>
                  <h4>No tienes favoritos</h4>
                  <p className="text-muted">
                    {activeTab === 'all' 
                      ? 'Agrega ofertas y actividades a tus favoritos para verlos aquí.'
                      : activeTab === 'offer'
                      ? 'No tienes ofertas en favoritos. Explora las ofertas disponibles.'
                      : 'No tienes actividades en favoritos. Descubre actividades interesantes.'
                    }
                  </p>
                  <div className="mt-3">
                    <Link to="/offers" className="btn btn-success me-2">
                      🏷️ Ver Ofertas
                    </Link>
                    <Link to="/activities" className="btn btn-warning">
                      🎯 Ver Actividades
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

export default Favorites;