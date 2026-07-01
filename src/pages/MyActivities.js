import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import axios from 'axios';

const MyActivities = () => {
  const { currentUser, API_URL } = useAuth();
  const { addNotification } = useNotification();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (currentUser) {
      fetchMyActivities();
    }
  }, [currentUser]);

  const fetchMyActivities = async () => {
    try {
      const response = await axios.get(`${API_URL}/activities/user/my-activities`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching my activities:', error);
      addNotification('Error al cargar tus actividades', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
      try {
        await axios.delete(`${API_URL}/activities/${activityId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        setActivities(prev => prev.filter(activity => activity._id !== activityId));
        addNotification('Actividad eliminada exitosamente', 'success');
      } catch (error) {
        console.error('Error deleting activity:', error);
        addNotification('Error al eliminar la actividad', 'error');
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

  const filteredActivities = activities.filter(activity => {
    if (activeFilter === 'all') return true;
    return activity.estado === activeFilter;
  });

  const getStatusCount = (status) => {
    return activities.filter(activity => activity.estado === status).length;
  };

  const getProgressPercentage = (activity) => {
    const participants = activity.participantes?.length || 0;
    return Math.min((participants / activity.maxParticipantes) * 100, 100);
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
      date: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
      time: hora,
      fullDate: date.toLocaleDateString('es-ES')
    };
  };

  if (!currentUser || (currentUser.rol !== 'oferente' && currentUser.rol !== 'administrador')) {
    return (
      <div className="modern-container">
        <div className="error-state">
          <div className="error-icon">🚫</div>
          <h2>Acceso restringido</h2>
          <p>Solo los oferentes pueden gestionar sus actividades.</p>
          <Link to="/activities" className="btn-modern primary">
            Ver Actividades Públicas
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
          <p>Cargando tus actividades...</p>
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
            <h1>Mis Actividades</h1>
            <p>Organiza y gestiona tus experiencias y eventos</p>
          </div>
          <Link to="/create-activity" className="btn-modern warning">
            <span className="btn-icon">+</span>
            Crear Nueva Actividad
          </Link>
        </div>

        {/* Estadísticas */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">🎯</div>
            <div className="stat-content">
              <div className="stat-number">{activities.length}</div>
              <div className="stat-label">Total Actividades</div>
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
              Todas ({activities.length})
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

        {/* Lista de Actividades */}
        {filteredActivities.length > 0 ? (
          <div className="activities-grid">
            {filteredActivities.map(activity => {
              const statusConfig = getStatusConfig(activity.estado);
              const progress = getProgressPercentage(activity);
              const participants = activity.participantes?.length || 0;
              const dateTime = formatDateTime(activity.fecha, activity.hora);
              
              return (
                <div key={activity._id} className="activity-card">
                  <div className="activity-header">
                    <div className="activity-title">
                      <div className="activity-type">
                        <span className="type-icon">{getActivityTypeIcon(activity.categoria)}</span>
                        <span className="type-category">{activity.categoria}</span>
                      </div>
                      <h3>{activity.titulo}</h3>
                    </div>
                    <div className={`status-badge ${statusConfig.color}`}>
                      <span className="status-icon">{statusConfig.icon}</span>
                      {statusConfig.label}
                    </div>
                  </div>

                  <div className="activity-content">
                    <div className="activity-image">
                      <img 
                        src={activity.imagen || '/images/placeholder-activity.jpg'} 
                        alt={activity.titulo}
                      />
                      <div className="date-badge">
                        <div className="date-day">{dateTime.date}</div>
                        <div className="date-time">{activity.hora}</div>
                      </div>
                    </div>

                    <div className="activity-details">
                      <p className="activity-description">{activity.descripcion}</p>
                      
                      <div className="pricing-info">
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
                        {activity.precioOriginal > activity.precioDescuento && (
                          <div className="savings">
                            Ahorras ${(activity.precioOriginal - activity.precioDescuento)?.toLocaleString()}
                          </div>
                        )}
                      </div>

                      <div className="activity-meta">
                        <div className="meta-item">
                          <span className="meta-icon">👥</span>
                          <span className="meta-text">
                            {participants} / {activity.maxParticipantes} participantes
                          </span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-icon">📍</span>
                          <span className="meta-text">{activity.ubicacion}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-icon">⏱️</span>
                          <span className="meta-text">{activity.duracion}</span>
                        </div>
                      </div>

                      <div className="progress-section">
                        <div className="progress-header">
                          <span>Inscripciones</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="progress-text">
                          {participants} de {activity.maxParticipantes} cupos ocupados
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="activity-actions">
                    <Link 
                      to={`/activity/${activity._id}`} 
                      className="btn-modern outline small"
                    >
                      <span className="btn-icon">👁️</span>
                      Ver Detalles
                    </Link>
                    <Link 
                      to={`/edit-activity/${activity._id}`} 
                      className="btn-modern primary small"
                    >
                      <span className="btn-icon">✏️</span>
                      Editar
                    </Link>
                    <button 
                      className="btn-modern error small"
                      onClick={() => handleDeleteActivity(activity._id)}
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
            
            <h3>No tienes actividades</h3>
            <p>
              {activeFilter === 'all' 
                ? 'Aún no has creado ninguna actividad.'
                : `No tienes actividades con estado "${activeFilter}".`
              }
            </p>
            <div className="mt-3">
              <Link to="/create-activity" className="btn-modern warning">
                ➕ Crear Mi Primera Actividad
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyActivities;