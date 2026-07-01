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
      <div className="main-content">
        <div className="container mt-4">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
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
            <div key={activity._id} className="col-xl-4 col-md-6 mb-4">
              <div className="card h-100 activity-card modern-card">
                <div className="card-image-container position-relative overflow-hidden">
                  <div 
                    className="card-img-top d-flex align-items-center justify-content-center"
                    style={{ height: '220px', backgroundColor: '#f8f9fa' }}
                  >
                    {activity.imagen ? (
                      <img 
                        src={activity.imagen} 
                        alt={activity.titulo}
                        className="img-fluid w-100 h-100 transition-transform"
                        style={{objectFit: 'cover'}}
                      />
                    ) : (
                      <div className="text-center text-muted">
                        <i className="bi bi-calendar-event fs-1 mb-2 d-block"></i>
                        <span>Imagen no disponible</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Badge de fecha */}
                  <div className="date-badge position-absolute top-0 start-0 m-3">
                    <div className="badge date-pill bg-dark bg-opacity-75 text-white px-3 py-2">
                      <div className="d-flex flex-column align-items-center">
                        <small className="fw-bold">{new Date(activity.fecha).toLocaleDateString('es-ES', { day: 'numeric' })}</small>
                        <small className="text-uppercase">
                          {new Date(activity.fecha).toLocaleDateString('es-ES', { month: 'short' })}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-body d-flex flex-column">
                  <div className="mb-3">
                    <h5 className="card-title fw-bold text-dark mb-2">{activity.titulo}</h5>
                    <p className="card-text text-muted line-clamp-2" style={{minHeight: '48px'}}>
                      {activity.descripcion}
                    </p>
                  </div>

                  {/* Información de precio */}
                  <div className="price-section mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      {activity.precioOriginal > activity.precioDescuento ? (
                        <>
                          <span className="text-muted text-decoration-line-through fs-6">
                            ${activity.precioOriginal?.toLocaleString()}
                          </span>
                          <span className="h4 fw-bold text-success">
                            ${activity.precioDescuento?.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="h4 fw-bold text-primary ms-auto">
                          ${activity.precioDescuento?.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {activity.precioOriginal > activity.precioDescuento && (
                      <div className="savings-badge mt-1">
                        <small className="text-success fw-semibold">
                          Ahorras ${(activity.precioOriginal - activity.precioDescuento)?.toLocaleString()}
                        </small>
                      </div>
                    )}
                  </div>

                  {/* Información del evento */}
                  <div className="event-info mt-auto">
                    <div className="info-grid mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-clock text-primary me-2"></i>
                        <small className="text-muted fw-semibold">{activity.hora}</small>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-geo-alt text-primary me-2"></i>
                        <small className="text-muted line-clamp-1">{activity.ubicacion}</small>
                      </div>
                    </div>
                    
                    {activity.creador && (
                      <div className="creator-info border-top pt-2">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-person-circle text-muted me-2"></i>
                          <small className="text-muted">
                            Organizado por: {activity.creador.empresa || activity.creador.nombre}
                          </small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-footer bg-transparent border-top-0 pt-0">
                  <Link 
                    to={`/activity/${activity._id}`} 
                    className="btn btn-primary w-100 fw-semibold py-2 modern-btn"
                  >
                    <i className="bi bi-ticket-perforated me-2"></i>
                    Reservar Ahora
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
    </div>
  );
};

export default Activities;