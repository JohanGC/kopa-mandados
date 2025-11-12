// ActivitiesManagement.js - VERSIÓN COMPLETA CORREGIDA
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import axios from 'axios';

const ActivitiesManagement = () => {
  const { API_URL } = useAuth();
  const { addNotification } = useNotification();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/activities`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      addNotification('Error al cargar actividades', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (activityId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/activities/${activityId}`, 
        { estado: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      addNotification(`Actividad ${newStatus === 'aprobada' ? 'aprobada' : 'rechazada'}`, 'success');
      fetchActivities();
    } catch (error) {
      console.error('Error updating activity status:', error);
      addNotification('Error al actualizar actividad', 'error');
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/activities/${activityId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        addNotification('Actividad eliminada exitosamente', 'success');
        fetchActivities();
      } catch (error) {
        console.error('Error deleting activity:', error);
        addNotification('Error al eliminar actividad', 'error');
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
    if (filter === 'all') return true;
    return activity.estado === filter;
  });

  if (loading) {
    return (
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow">
      <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
        <h4 className="mb-0">🎯 Gestión de Actividades</h4>
        <div>
          <select
            className="form-select form-select-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todas las actividades</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
          </select>
        </div>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Título</th>
                <th>Organizador</th>
                <th>Precio</th>
                <th>Fecha y Hora</th>
                <th>Ubicación</th>
                <th>Participantes</th>
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
                    {activity.creador?.nombre || 'N/A'}
                    <br />
                    <small className="text-muted">{activity.creador?.empresa}</small>
                  </td>
                  <td>
                    <div>
                      <del>${activity.precioOriginal?.toLocaleString()}</del>
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
                    <small>{activity.ubicacion}</small>
                  </td>
                  <td>
                    <span className="badge bg-info">
                      {activity.participantes?.length || 0}/{activity.maxParticipantes}
                    </span>
                  </td>
                  <td>
                    <span className={getStatusBadge(activity.estado)}>
                      {activity.estado}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      {activity.estado === 'pendiente' && (
                        <>
                          <button
                            className="btn btn-outline-success"
                            onClick={() => handleStatusChange(activity._id, 'aprobada')}
                            title="Aprobar actividad"
                          >
                            ✅
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleStatusChange(activity._id, 'rechazada')}
                            title="Rechazar actividad"
                          >
                            ❌
                          </button>
                        </>
                      )}
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

        {filteredActivities.length === 0 && (
          <div className="text-center py-4">
            <p className="text-muted">No hay actividades {filter !== 'all' ? `con estado ${filter}` : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ EXPORT DEFAULT CORRECTO
export default ActivitiesManagement;