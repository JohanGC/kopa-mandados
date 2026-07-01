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
  const [selectedOffer, setSelectedOffer] = useState(null);

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

  const getStatusConfig = (estado) => {
    const statusConfig = {
      pendiente: { label: 'Pendiente', color: 'warning', icon: '⏳' },
      aprobada: { label: 'Aprobada', color: 'success', icon: '✅' },
      rechazada: { label: 'Rechazada', color: 'error', icon: '❌' }
    };
    return statusConfig[estado] || statusConfig.pendiente;
  };

  const filteredOffers = offers.filter(offer => {
    if (activeFilter === 'all') return true;
    return offer.estado === activeFilter;
  });

  const getStatusCount = (status) => {
    return offers.filter(offer => offer.estado === status).length;
  };

  const getProgressPercentage = (offer) => {
    if (!offer.maxParticipantes) return 0;
    const participants = offer.participantes?.length || 0;
    return Math.min((participants / offer.maxParticipantes) * 100, 100);
  };

  if (!currentUser || (currentUser.rol !== 'oferente' && currentUser.rol !== 'administrador')) {
    return (
      <div className="modern-container">
        <div className="error-state">
          <div className="error-icon">🚫</div>
          <h2>Acceso restringido</h2>
          <p>Solo los oferentes pueden gestionar sus ofertas.</p>
          <Link to="/offers" className="btn-modern primary">
            Ver Ofertas Públicas
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
          <p>Cargando tus ofertas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="modern-container">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>Mis Ofertas</h1>
            <p>Gestiona y monitorea el rendimiento de tus ofertas</p>
          </div>
          <Link to="/create-offer" className="btn-modern primary">
            <span className="btn-icon">+</span>
            Crear Nueva Oferta
          </Link>
        </div>

        {/* Estadísticas */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">🏷️</div>
            <div className="stat-content">
              <div className="stat-number">{offers.length}</div>
              <div className="stat-label">Total Ofertas</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon approved">✅</div>
            <div className="stat-content">
              <div className="stat-number">{getStatusCount('aprobada')}</div>
              <div className="stat-label">Aprobadas</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon pending">⏳</div>
            <div className="stat-content">
              <div className="stat-number">{getStatusCount('pendiente')}</div>
              <div className="stat-label">Pendientes</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon rejected">❌</div>
            <div className="stat-content">
              <div className="stat-number">{getStatusCount('rechazada')}</div>
              <div className="stat-label">Rechazadas</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="filters-section">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              Todas ({offers.length})
            </button>
            <button
              className={`filter-tab ${activeFilter === 'aprobada' ? 'active' : ''}`}
              onClick={() => setActiveFilter('aprobada')}
            >
              Aprobadas ({getStatusCount('aprobada')})
            </button>
            <button
              className={`filter-tab ${activeFilter === 'pendiente' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pendiente')}
            >
              Pendientes ({getStatusCount('pendiente')})
            </button>
            <button
              className={`filter-tab ${activeFilter === 'rechazada' ? 'active' : ''}`}
              onClick={() => setActiveFilter('rechazada')}
            >
              Rechazadas ({getStatusCount('rechazada')})
            </button>
          </div>
        </div>

        {/* Lista de Ofertas */}
        {filteredOffers.length > 0 ? (
          <div className="offers-grid">
            {filteredOffers.map(offer => {
              const statusConfig = getStatusConfig(offer.estado);
              const progress = getProgressPercentage(offer);
              const participants = offer.participantes?.length || 0;
              
              return (
                <div key={offer._id} className="offer-card">
                  <div className="offer-header">
                    <div className="offer-title">
                      <h3>{offer.titulo}</h3>
                      <span className="offer-category">{offer.categoria}</span>
                    </div>
                    <div className={`status-badge ${statusConfig.color}`}>
                      <span className="status-icon">{statusConfig.icon}</span>
                      {statusConfig.label}
                    </div>
                  </div>

                  <div className="offer-content">
                    <div className="offer-image">
                      <img 
                        src={offer.imagen || '/images/placeholder-offer.jpg'} 
                        alt={offer.titulo}
                      />
                      {offer.descuento > 0 && (
                        <div className="discount-badge">-{offer.descuento}%</div>
                      )}
                    </div>

                    <div className="offer-details">
                      <p className="offer-description">{offer.descripcion}</p>
                      
                      <div className="pricing-info">
                        <div className="price-comparison">
                          <span className="original-price">${offer.precioOriginal?.toLocaleString()}</span>
                          <span className="current-price">${offer.precioDescuento?.toLocaleString()}</span>
                        </div>
                        <div className="savings">
                          Ahorras ${(offer.precioOriginal - offer.precioDescuento)?.toLocaleString()}
                        </div>
                      </div>

                      <div className="offer-meta">
                        <div className="meta-item">
                          <span className="meta-icon">👥</span>
                          <span className="meta-text">
                            {participants} / {offer.maxParticipantes || '∞'} participantes
                          </span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-icon">📅</span>
                          <span className="meta-text">
                            Hasta {new Date(offer.fechaFin).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {offer.maxParticipantes && (
                        <div className="progress-section">
                          <div className="progress-header">
                            <span>Progreso de participación</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="offer-actions">
                    <Link 
                      to={`/offer/${offer._id}`} 
                      className="btn-modern outline small"
                    >
                      <span className="btn-icon">👁️</span>
                      Ver Detalles
                    </Link>
                    <Link 
                      to={`/edit-offer/${offer._id}`} 
                      className="btn-modern primary small"
                    >
                      <span className="btn-icon">✏️</span>
                      Editar
                    </Link>
                    <button 
                      className="btn-modern error small"
                      onClick={() => handleDeleteOffer(offer._id)}
                    >
                      <span className="btn-icon">🗑️</span>
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state large">
            
            <h3>No tienes ofertas</h3>
            <p>
              {activeFilter === 'all' 
                ? 'Aún no has creado ninguna oferta.'
                : `No tienes ofertas con estado "${activeFilter}".`
              }
            </p>
            <div className="mt-3">
              <Link to="/create-offer" className="btn-modern primary">
                ➕ Crear Mi Primera Oferta
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOffers;