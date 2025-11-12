import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import useWebSocket from '../hooks/useWebSocket';

// Componente para Mapa de Mandados Cercanos
const MapaMandadosCercanos = ({ mandados, onAceptar, disponible }) => {
  if (mandados.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-muted">
          <h5>🗺️ No hay mandados cercanos</h5>
          <p>No se encontraron mandados cerca de tu ubicación actual</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="alert alert-info">
        <small>📍 Mostrando {mandados.length} mandado{mandados.length !== 1 ? 's' : ''} cerca de ti</small>
      </div>
      <div className="row">
        {mandados.map(mandado => (
          <div key={mandado._id} className="col-md-6 col-lg-4 mb-3">
            <div className="card h-100 border-warning">
              <div className="card-header bg-warning text-dark">
                <small>#{mandado._id?.toString().slice(-6) || 'N/A'}</small>
                <span className="badge bg-success float-end">
                  📍 Cercano
                </span>
              </div>
              <div className="card-body">
                <h6 className="card-title">{mandado.descripcion}</h6>
                <div className="mb-2">
                  <strong>💰 Precio:</strong> <span className="text-success">${mandado.precioOfertado?.toLocaleString() || '0'}</span>
                </div>
                <div className="mb-2">
                  <strong>📍 Distancia:</strong> 
                  <small className="d-block text-muted">{mandado.distancia || 'Cercano'}</small>
                </div>
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => onAceptar(mandado._id)}
                    disabled={!disponible}
                  >
                    ✅ Aceptar Mandado
                  </button>
                  {!disponible && (
                    <small className="text-warning text-center">
                      Activa tu disponibilidad para aceptar mandados
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente para Lista de Mandados Cercanos
const ListaMandadosCercanos = ({ mandados, onAceptar, disponible }) => {
  if (mandados.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-muted">
          <h5>📋 No hay mandados cercanos</h5>
          <p>No se encontraron mandados cerca de tu ubicación actual</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Precio</th>
            <th>Distancia</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {mandados.map(mandado => (
            <tr key={mandado._id}>
              <td>
                <strong>{mandado.descripcion}</strong>
                <br />
                <small className="text-muted">
                  {mandado.ubicacionRecogida}
                </small>
              </td>
              <td>${mandado.precioOfertado?.toLocaleString() || '0'}</td>
              <td>
                <span className="badge bg-success">{mandado.distancia || 'Cercano'}</span>
              </td>
              <td>
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => onAceptar(mandado._id)}
                  disabled={!disponible}
                >
                  Aceptar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const DomiciliarioDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('disponibles');
  const [disponible, setDisponible] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { addNotification } = useNotification();
  const { notificaciones, estaConectado, limpiarNotificaciones } = useWebSocket();
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [showMapa, setShowMapa] = useState(false);
  const [mandadosCercanos, setMandadosCercanos] = useState([]);

  // DEBUG: Verificar estado de autenticación
  useEffect(() => {
    console.log('🔐 Estado de autenticación:', {
      user,
      authLoading,
      token: localStorage.getItem('token'),
      userRole: user?.rol || user?.role
    });
  }, [user, authLoading]);

  // Obtener mandados según la pestaña activa
  const getOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        addNotification('No hay token de autenticación', 'error');
        return;
      }

      const response = await fetch(`/api/orders/domiciliario/${activeTab}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else if (response.status === 401) {
        addNotification('Sesión expirada. Por favor inicia sesión nuevamente.', 'error');
        localStorage.removeItem('token');
      } else {
        console.error('Error obteniendo mandados:', response.status);
        addNotification('Error cargando mandados', 'error');
      }
    } catch (error) {
      console.error('Error obteniendo mandados:', error);
      addNotification('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Obtener estadísticas
  const getEstadisticas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders/domiciliario/estadisticas/resumen', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEstadisticas(data);
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
    }
  };

  // Actualizar disponibilidad
  const updateDisponibilidad = async (nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/disponibilidad/actual', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ disponible: nuevoEstado })
      });

      if (response.ok) {
        setDisponible(nuevoEstado);
        addNotification(
          nuevoEstado ? '🟢 Ahora estás disponible' : '🔴 No estás disponible',
          'success'
        );
        getOrders();
      }
    } catch (error) {
      console.error('Error actualizando disponibilidad:', error);
      addNotification('Error actualizando disponibilidad', 'error');
    }
  };

  // Aceptar mandado
  const aceptarMandado = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${orderId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        addNotification('✅ Mandado aceptado correctamente', 'success');
        getOrders();
        getEstadisticas();
      } else {
        const error = await response.json();
        addNotification(error.message || 'Error aceptando mandado', 'error');
      }
    } catch (error) {
      console.error('Error aceptando mandado:', error);
      addNotification('Error aceptando mandado', 'error');
    }
  };

  // Actualizar estado del mandado
  const actualizarEstado = async (orderId, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${orderId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (response.ok) {
        addNotification(`Estado actualizado a: ${nuevoEstado}`, 'success');
        getOrders();
        if (nuevoEstado === 'completado') {
          getEstadisticas();
        }
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      addNotification('Error actualizando estado', 'error');
    }
  };

  // Cancelar mandado
  const cancelarMandado = async (orderId) => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar este mandado?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${orderId}/cancelar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        addNotification('Mandado cancelado correctamente', 'success');
        getOrders();
        getEstadisticas();
      }
    } catch (error) {
      console.error('Error cancelando mandado:', error);
      addNotification('Error cancelando mandado', 'error');
    }
  };

  // Efecto para cargar datos cuando el usuario esté autenticado
  useEffect(() => {
    if (user && (user.rol === 'domiciliario' || user.role === 'domiciliario')) {
      console.log('✅ Usuario autenticado como domiciliario, cargando datos...');
      getOrders();
      getEstadisticas();
      
      // Obtener disponibilidad actual
      const token = localStorage.getItem('token');
      fetch('/api/users/disponibilidad/actual', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data.disponible !== undefined) {
            setDisponible(data.disponible);
          }
        })
        .catch(error => console.error('Error obteniendo disponibilidad:', error));
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (notificaciones.length > 0) {
      const ultimaNotificacion = notificaciones[notificaciones.length - 1];
      
      if (ultimaNotificacion.tipo === 'nuevo_mandado') {
        addNotification('📦 ¡Nuevo mandado disponible!', 'info');
        if (activeTab === 'disponibles' || activeTab === 'mapa') {
          getOrders();
        }
      }
    }
  }, [notificaciones]);

  // Función para obtener mandados cercanos
  const getMandadosCercanos = async (lat, lng) => {
    try {
      const token = localStorage.getItem('token');
      let url = '/api/orders/domiciliario/cercanos';
      if (lat && lng) {
        url += `?lat=${lat}&lng=${lng}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMandadosCercanos(data);
      }
    } catch (error) {
      console.error('Error obteniendo mandados cercanos:', error);
    }
  };

  // Mostrar loading mientras verifica autenticación
  if (authLoading) {
    return (
      <div className="container mt-4">
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Verificando autenticación...</span>
          </div>
          <p className="mt-2">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Verificación de acceso mejorada
  if (!user) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          <h4>🔐 Inicia sesión</h4>
          <p>Debes iniciar sesión para acceder al panel de domiciliario.</p>
          <button 
            className="btn btn-primary mt-2"
            onClick={() => window.location.href = '/login'}
          >
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  const userRole = user.rol || user.role;
  if (userRole !== 'domiciliario') {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4>🚫 Acceso restringido</h4>
          <p>Esta sección es solo para domiciliarios registrados.</p>
          <small className="text-muted">Tu rol actual es: <strong>{userRole}</strong></small>
          <br />
          <button 
            className="btn btn-secondary mt-2"
            onClick={() => window.location.href = '/'}
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Header del Dashboard con Estadísticas */}
      <div className="row mb-4">
        <div className="col-md-8">
          <h1>🛵 Panel de Domiciliario</h1>
          <p className="text-muted">Gestiona tus mandados y disponibilidad</p>
          
          {/* Tarjetas de Estadísticas Rápidas */}
          {estadisticas && (
            <div className="row mt-3">
              <div className="col-md-3">
                <div className="card text-white bg-success">
                  <div className="card-body color-back-3">
                    <h4>{estadisticas.resumen?.totalCompletados || 0}</h4>
                    <small>Completados</small>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card text-white">
                  <div className="card-body color-back-4">
                    <h4>${(estadisticas.finanzas?.ingresosTotales || 0).toLocaleString()}</h4>
                    <small>Ingresos Totales</small>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card text-white">
                  <div className="card-body color-back-5">
                    <h4>{estadisticas.resumen?.mandadosEsteMes || 0}</h4>
                    <small>Este Mes</small>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card text-white">
                  <div className="card-body color-back-2">
                    <h4>{estadisticas.reputacion?.calificacionPromedio || 0}★</h4>
                    <small>Calificación</small>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h6>Estado de Disponibilidad</h6>
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className={`btn ${disponible ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => updateDisponibilidad(true)}
                >
                  Disponible
                </button>
                <button
                  type="button"
                  className={`btn ${!disponible ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={() => updateDisponibilidad(false)}
                >
                  No Disponible
                </button>
              </div>
              
              {/* Indicador de conexión y notificaciones */}
              <div className="d-flex justify-content-between align-items-center mt-2">
                <small className={`text-${estaConectado ? 'success' : 'danger'}`}>
                  {estaConectado ? '🟢 En línea' : '🔴 Desconectado'}
                </small>
                
                <div className="position-relative">
                  <button
                    className="btn btn-outline-primary btn-sm position-relative"
                    onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
                  >
                    🔔
                    {notificaciones.length > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        {notificaciones.length}
                      </span>
                    )}
                  </button>
                  
                  {/* Componente de notificaciones */}
                  {mostrarNotificaciones && (
                    <div className="position-absolute top-100 end-0 mt-2 z-3" style={{ width: '300px' }}>
                      <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">🔔 Notificaciones</h6>
                          <button 
                            className="btn btn-sm btn-outline-secondary"
                            onClick={limpiarNotificaciones}
                          >
                            Limpiar
                          </button>
                        </div>
                        <div className="card-body p-0" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          {notificaciones.length === 0 ? (
                            <div className="p-3 text-center text-muted">
                              No hay notificaciones
                            </div>
                          ) : (
                            notificaciones.map((notif, index) => (
                              <div key={index} className="border-bottom p-3">
                                <div className="d-flex justify-content-between align-items-start">
                                  <div>
                                    <strong>{notif.titulo}</strong>
                                    <p className="mb-0 small">{notif.mensaje}</p>
                                  </div>
                                  <small className="text-muted">
                                    {new Date(notif.timestamp).toLocaleTimeString()}
                                  </small>
                                </div>
                              </div>
                            )).reverse()
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {!disponible && (
                <small className="text-muted d-block mt-2">
                  No recibirás nuevos mandados
                </small>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pestañas de navegación */}
      <nav>
        <div className="nav nav-tabs" id="nav-tab" role="tablist">
          <button
            className={`nav-link ${activeTab === 'disponibles' ? 'active' : ''}`}
            onClick={() => setActiveTab('disponibles')}
          >
            📦 Mandados Disponibles
            {activeTab === 'disponibles' && orders.length > 0 && (
              <span className="badge bg-primary ms-2">{orders.length}</span>
            )}
          </button>
          <button
            className={`nav-link ${activeTab === 'activos' ? 'active' : ''}`}
            onClick={() => setActiveTab('activos')}
          >
            🚀 Mis Mandados Activos
          </button>
          <button
            className={`nav-link ${activeTab === 'historial' ? 'active' : ''}`}
            onClick={() => setActiveTab('historial')}
          >
            📋 Historial
          </button>
          <button
            className={`nav-link ${activeTab === 'mapa' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('mapa');
              // Obtener ubicación para mandados cercanos
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    getMandadosCercanos(
                      position.coords.latitude,
                      position.coords.longitude
                    );
                  },
                  (error) => {
                    console.error('Error obteniendo ubicación:', error);
                    // Cargar mandados sin filtro de ubicación
                    getMandadosCercanos();
                  }
                );
              } else {
                getMandadosCercanos();
              }
            }}
          >
            🗺️ Mapa de Mandados
          </button>
        </div>
      </nav>

      {/* Contenido de las pestañas */}
      <div className="tab-content p-3 border border-top-0 rounded-bottom">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2">Cargando mandados...</p>
          </div>
        ) : (
          <>
            {/* Pestaña: Mandados Disponibles */}
            {activeTab === 'disponibles' && (
              <MandadosDisponibles 
                orders={orders}
                disponible={disponible}
                onAceptar={aceptarMandado}
              />
            )}

            {/* Pestaña: Mis Mandados Activos */}
            {activeTab === 'activos' && (
              <MandadosActivos 
                orders={orders}
                onEstadoChange={actualizarEstado}
                onCancelar={cancelarMandado}
              />
            )}

            {/* Pestaña: Historial */}
            {activeTab === 'historial' && (
              <HistorialMandados orders={orders} />
            )}
            
            {activeTab === 'mapa' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>🗺️ Mapa de Mandados Cercanos</h5>
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => setShowMapa(!showMapa)}
                  >
                    {showMapa ? '📋 Lista' : '🗺️ Mapa'}
                  </button>
                </div>
                
                {showMapa ? (
                  <MapaMandadosCercanos 
                    mandados={mandadosCercanos}
                    onAceptar={aceptarMandado}
                    disponible={disponible}
                  />
                ) : (
                  <ListaMandadosCercanos 
                    mandados={mandadosCercanos}
                    onAceptar={aceptarMandado}
                    disponible={disponible}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Componente para Mandados Disponibles
const MandadosDisponibles = ({ orders, disponible, onAceptar }) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-muted">
          <h5>📭 No hay mandados disponibles</h5>
          <p>Los nuevos mandados aparecerán aquí cuando estén disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Mandados Disponibles</h5>
        <small className="text-muted">
          {orders.length} mandado{orders.length !== 1 ? 's' : ''} disponible{orders.length !== 1 ? 's' : ''}
        </small>
      </div>
      <div className="row">
        {orders.map(order => (
          <div key={order._id} className="col-md-6 col-lg-4 mb-3">
            <div className="card h-100 border-primary">
              <div className="card-header bg-primary text-white">
                <small className="text-white-50">#{order._id?.toString().slice(-6) || 'N/A'}</small>
                <span className={`badge bg-${getCategoriaColor(order.categoria)} float-end`}>
                  {order.categoria}
                </span>
              </div>
              <div className="card-body">
                <h6 className="card-title">{truncateText(order.descripcion, 80)}</h6>
                <div className="mb-2">
                  <strong>💰 Precio:</strong> <span className="text-success">${order.precioOfertado?.toLocaleString() || '0'}</span>
                </div>
                <div className="mb-2">
                  <strong>📍 Recoger en:</strong> 
                  <small className="d-block text-muted">{truncateText(order.ubicacionRecogida, 60)}</small>
                </div>
                <div className="mb-2">
                  <strong>🎯 Entregar en:</strong>
                  <small className="d-block text-muted">{truncateText(order.ubicacionEntrega, 60)}</small>
                </div>
                <div className="mb-3">
                  <strong>⏰ Límite:</strong>
                  <small className="d-block text-muted">
                    {order.fechaLimite ? new Date(order.fechaLimite).toLocaleString() : 'No especificado'}
                  </small>
                </div>
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onAceptar(order._id)}
                    disabled={!disponible}
                  >
                    ✅ Aceptar Mandado
                  </button>
                  {!disponible && (
                    <small className="text-warning text-center">
                      Activa tu disponibilidad para aceptar mandados
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente para Mandados Activos
const MandadosActivos = ({ orders, onEstadoChange, onCancelar }) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-muted">
          <h5>🚀 No tienes mandados activos</h5>
          <p>Cuando aceptes un mandado, aparecerá aquí para que lo gestiones</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h5>Mis Mandados Activos</h5>
      <div className="row">
        {orders.map(order => (
          <div key={order._id} className="col-md-6 mb-3">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <small className="text-muted">#{order._id?.toString().slice(-6) || 'N/A'}</small>
                <span className={`badge bg-${getEstadoColor(order.estado)}`}>
                  {order.estado}
                </span>
              </div>
              <div className="card-body">
                <h6 className="card-title">{order.descripcion}</h6>
                <div className="mb-2">
                  <strong>💰 Precio:</strong> ${order.precioOfertado?.toLocaleString() || '0'}
                </div>
                <div className="mb-2">
                  <strong>📍 Recoger en:</strong> 
                  <small className="d-block text-muted">{order.ubicacionRecogida}</small>
                </div>
                <div className="mb-2">
                  <strong>🎯 Entregar en:</strong>
                  <small className="d-block text-muted">{order.ubicacionEntrega}</small>
                </div>
                <div className="mb-2">
                  <strong>📞 Contacto:</strong> {order.solicitante?.telefono || 'No disponible'}
                </div>
                
                <div className="mt-3">
                  <EstadoProgress order={order} onEstadoChange={onEstadoChange} />
                </div>
                
                <div className="mt-2">
                  <button
                    className="btn btn-outline-danger btn-sm w-100"
                    onClick={() => onCancelar(order._id)}
                  >
                    ❌ Cancelar Mandado
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente para Historial
const HistorialMandados = ({ orders }) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-muted">
          <h5>📋 No tienes historial de mandados</h5>
          <p>Tu historial aparecerá aquí cuando completes mandados</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h5>Historial de Mandados</h5>
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Calificación</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td>
                  <small>{truncateText(order.descripcion, 50)}</small>
                </td>
                <td>${order.precioOfertado?.toLocaleString() || '0'}</td>
                <td>
                  <span className={`badge ${
                    order.estado === 'completado' ? 'bg-success' :
                    order.estado === 'cancelado' ? 'bg-danger' : 'bg-secondary'
                  }`}>
                    {order.estado}
                  </span>
                </td>
                <td>
                  <small>{order.updatedAt ? new Date(order.updatedAt).toLocaleDateString() : 'N/A'}</small>
                </td>
                <td>
                  {order.calificacion ? (
                    <span className="text-warning">
                      {'★'.repeat(order.calificacion)}
                      {'☆'.repeat(5 - order.calificacion)}
                      <small className="text-muted ms-1">({order.calificacion})</small>
                    </span>
                  ) : (
                    <span className="text-muted">Sin calificar</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Componente para mostrar el progreso del estado
const EstadoProgress = ({ order, onEstadoChange }) => {
  const estados = [
    { value: 'aceptado', label: '✅ Aceptado', color: 'primary' },
    { value: 'en_camino', label: '🚗 En Camino', color: 'warning' },
    { value: 'en_proceso', label: '📦 En Proceso', color: 'info' },
    { value: 'completado', label: '🎉 Completado', color: 'success' }
  ];

  const estadoActualIndex = estados.findIndex(e => e.value === order.estado);

  return (
    <div>
      <div className="progress mb-2" style={{ height: '20px' }}>
        {estados.map((estado, index) => (
          <div
            key={estado.value}
            className={`progress-bar bg-${estado.color} ${index <= estadoActualIndex ? '' : 'opacity-25'}`}
            style={{ width: `${100 / estados.length}%` }}
            title={estado.label}
          >
            {index === estadoActualIndex && '●'}
          </div>
        ))}
      </div>
      <div className="btn-group w-100" role="group">
        {estados.map((estado, index) => (
          <button
            key={estado.value}
            type="button"
            className={`btn btn-outline-${estado.color} btn-sm ${index <= estadoActualIndex ? 'active' : ''}`}
            onClick={() => index > estadoActualIndex && onEstadoChange(order._id, estado.value)}
            disabled={index > estadoActualIndex + 1 || index <= estadoActualIndex}
          >
            {estado.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Funciones auxiliares
const getCategoriaColor = (categoria) => {
  const colores = {
    documentos: 'info',
    comida: 'success',
    farmacia: 'danger',
    mercado: 'warning',
    otros: 'secondary'
  };
  return colores[categoria] || 'secondary';
};

const getEstadoColor = (estado) => {
  const colores = {
    pendiente: 'secondary',
    aceptado: 'primary',
    en_camino: 'warning',
    en_proceso: 'info',
    completado: 'success',
    cancelado: 'danger'
  };
  return colores[estado] || 'secondary';
};

const truncateText = (text, maxLength) => {
  if (!text) return 'No disponible';
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

export default DomiciliarioDashboard;