import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, API_URL } = useAuth();

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await axios.get(`${API_URL}/activities`);
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Actividades Disponibles</h1>
        {currentUser && (currentUser.rol === 'oferente' || currentUser.rol === 'administrador') && (
          <Link to="/create-activity" className="btn btn-warning">
            🎯 Crear Nueva Actividad
          </Link>
        )}
      </div>

      <div className="row">
        {activities.map(activity => (
          <div key={activity._id} className="col-md-4 mb-4">
            <div className="card h-100">
              <div 
                className="card-img-top bg-secondary d-flex align-items-center justify-content-center text-white"
                style={{ height: '200px' }}
              >
                {activity.imagen ? (
                  <img 
                    src={activity.imagen} 
                    alt={activity.titulo}
                    className="img-fluid w-100 h-100"
                    style={{objectFit: 'cover'}}
                  />
                ) : (
                  <span>Imagen de actividad</span>
                )}
              </div>
              <div className="card-body">
                <h5 className="card-title">{activity.titulo}</h5>
                <p className="card-text">{activity.descripcion}</p>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted text-decoration-line-through">
                    ${activity.precioOriginal?.toLocaleString()}
                  </span>
                  <span className="h5 text-success">
                    ${activity.precioDescuento?.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2">
                  <small className="text-muted">
                    Fecha: {new Date(activity.fecha).toLocaleDateString()} | 
                    Hora: {activity.hora}
                  </small>
                </div>
                <div className="mt-1">
                  <small className="text-muted">
                    Ubicación: {activity.ubicacion}
                  </small>
                </div>
                {activity.creador && (
                  <div className="mt-2">
                    <small className="text-muted">
                      Por: {activity.creador.empresa || activity.creador.nombre}
                    </small>
                  </div>
                )}
              </div>
              <div className="card-footer">
                <Link to={`/activity/${activity._id}`} className="btn btn-1 btn-primary w-100">
                  Ver Detalles
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-5">
          <h3>No hay actividades disponibles en este momento</h3>
          <p>Vuelve pronto para descubrir nuevas actividades</p>
        </div>
      )}
    </div>
  );
};

export default Activities;