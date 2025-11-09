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

  const getStatusBadge = (estado) => {
    const statuses = {
      pendiente: 'warning',
      aprobada: 'success',
      rechazada: 'danger'
    };
    return `badge bg-${statuses[estado]}`;
  };

  const filteredActivities = activities.filter(activity => {
    if (activeFilter === 'all') return true;
    return activity.estado === activeFilter;
  });

  const getStatusCount = (status) => {
    return activities.filter(activity => activity.estado === status).length;
  };

  if (!currentUser || (currentUser.rol !== 'oferente' && currentUser.rol !== 'administrador')) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning text-center">
          <h4>No tienes permisos para ver esta página</h4>
          <p>Solo los oferentes pueden gestionar sus actividades.</p>
          <Link to="/activities" className="btn btn-primary">Ver Actividades</Link>
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
            <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
              <h4 className="mb-0">🎯 Mis Actividades</h4>
              <Link to="/create-activity" className="btn btn-dark">
                ➕ Crear Nueva Actividad
              </Link>
            </div>
            <div className="card-body">
              {/* Estadísticas rápidas */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <div className="card text-white bg-primary">
                    <div className="card-body text-center">
                      <h5 className="card-title">{activities.length}</h5>
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
                    Todas ({activities.length})
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

              {/* Lista de actividades */}
              {filteredActivities.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Título</th>
                        <th>Precio</th>
                        <th>Fecha y Hora</th>
                        <th>Participantes</th>
                        <th>Ubicación</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredActivities.map(activity => (
                        <tr key={activity._id}>
                          <td>
                            <strong>{activity.titulo}</strong>
                            <br />
                            <small className="text-muted">{activity.categoria}</small>
                          </td>
                          <td>
                            <div>
                              <del className="text-muted">${activity.precioOriginal?.toLocaleString()}</del>
                              <br />
                              <strong className="text-success">${activity.precioDescuento?.toLocaleString()}</strong>
                            </div>
                          </td>
                          <td>
                            <small>
                              {new Date(activity.fecha).toLocaleDateString()}
                              <br />
                              {activity.hora} - {activity.duracion}
                            </small>
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {activity.participantes?.length || 0}/{activity.maxParticipantes}
                            </span>
                          </td>
                          <td>
                            <small>{activity.ubicacion}</small>
                          </td>
                          <td>
                            <span className={getStatusBadge(activity.estado)}>
                              {activity.estado}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <Link
                                to={`/activity/${activity._id}`}
                                className="btn btn-outline-primary"
                                title="Ver detalles"
                              >
                                👁️
                              </Link>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDeleteActivity(activity._id)}
                                title="Eliminar actividad"
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
                    <span style={{ fontSize: '4rem' }}>🎯</span>
                  </div>
                  <h4>No tienes actividades</h4>
                  <p className="text-muted">
                    {activeFilter === 'all' 
                      ? 'Aún no has creado ninguna actividad.'
                      : `No tienes actividades con estado "${activeFilter}".`
                    }
                  </p>
                  <div className="mt-3">
                    <Link to="/create-activity" className="btn btn-warning">
                      ➕ Crear Mi Primera Actividad
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

export default MyActivities;