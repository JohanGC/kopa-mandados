import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import axios from 'axios';

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();
  
  const [order, setOrder] = useState(null);
  const [domiciliario, setDomiciliario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [domiciliarioLocation, setDomiciliarioLocation] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [map, setMap] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('tracking');
  
  const intervalRef = useRef();
  const mapRef = useRef(null);
  const scriptRef = useRef(null);

  const getApiUrl = () => {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  };

  const isGoogleMapsLoaded = () => {
    return window.google && window.google.maps && window.google.maps.Map;
  };

  const loadGoogleMaps = () => {
    if (isGoogleMapsLoaded()) {
      setMapsLoaded(true);
      initMap();
      return;
    }

    const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!API_KEY) {
      setError('Google Maps no está configurado. Contacta al administrador.');
      return;
    }

    if (scriptRef.current) {
      document.head.removeChild(scriptRef.current);
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.ref = scriptRef;
    
    script.onload = () => {
      const checkReady = setInterval(() => {
        if (isGoogleMapsLoaded()) {
          clearInterval(checkReady);
          setMapsLoaded(true);
          initMap();
        }
      }, 100);
    };
    
    script.onerror = (err) => {
      setError('Error cargando el mapa. Verifica tu conexión.');
      setLoading(false);
    };
    
    document.head.appendChild(script);
    scriptRef.current = script;
  };

  const initMap = () => {
    if (!mapRef.current || !isGoogleMapsLoaded()) return;

    try {
      const defaultLocation = { lat: 4.6097, lng: -74.0817 };
      
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: defaultLocation,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "on" }]
          }
        ]
      });

      setMap(mapInstance);
      setTimeout(updateMapMarkers, 500);
      
    } catch (err) {
      setError('Error al inicializar el mapa: ' + err.message);
    }
  };

  const updateMapMarkers = () => {
    if (!map || !isGoogleMapsLoaded()) return;

    try {
      if (order?.coordenadasEntrega) {
        new window.google.maps.Marker({
          position: order.coordenadasEntrega,
          map: map,
          title: '📍 Punto de entrega',
          icon: {
            url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMyOGE3NDUiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
            scaledSize: new window.google.maps.Size(30, 30),
            anchor: new window.google.maps.Point(15, 15)
          }
        });

        map.setCenter(order.coordenadasEntrega);
        map.setZoom(15);
      }

      if (domiciliarioLocation) {
        const domiMarker = new window.google.maps.Marker({
          position: domiciliarioLocation,
          map: map,
          title: `🛵 ${domiciliario?.nombre || 'Domiciliario'}`,
          icon: {
            url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNmZjY2MDAiLz4KPHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxMy4xN2w3LjU5LTcuNTlMMTkgN2wtOSA5eiIvPjwvc3ZnPgo8L3N2Zz4=',
            scaledSize: new window.google.maps.Size(30, 30),
            anchor: new window.google.maps.Point(15, 15)
          }
        });

        if (order?.coordenadasEntrega) {
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(domiciliarioLocation);
          bounds.extend(order.coordenadasEntrega);
          map.fitBounds(bounds);
        }
      }
      
    } catch (err) {
      console.error('Error actualizando marcadores:', err);
    }
  };

  const fetchOrderData = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE = getApiUrl();
      
      const response = await axios.get(`${API_BASE}/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setOrder(response.data);
      
      if (response.data.ejecutante && response.data.estado !== 'pendiente') {
        fetchDomiciliarioData(response.data.ejecutante._id);
      }
      
    } catch (error) {
      setError('No se pudo cargar la información del mandado');
      showNotification('error', 'Error al cargar el mandado');
    } finally {
      setLoading(false);
    }
  };

  const fetchDomiciliarioData = async (domiciliarioId) => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE = getApiUrl();
      
      const response = await axios.get(`${API_BASE}/api/users/${domiciliarioId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDomiciliario(response.data);
      
      if (response.data.ubicacionActual) {
        const newLocation = {
          lat: response.data.ubicacionActual.lat,
          lng: response.data.ubicacionActual.lng
        };
        setDomiciliarioLocation(newLocation);
      }
      
    } catch (error) {
      console.error('Error cargando domiciliario:', error);
    }
  };

  const startLocationUpdates = () => {
    if (order?.ejecutante && order.estado !== 'completado' && order.estado !== 'cancelado') {
      intervalRef.current = setInterval(() => {
        if (order.ejecutante) {
          fetchDomiciliarioData(order.ejecutante._id);
        }
      }, 15000);
    }
  };

  const calculateEstimatedTime = (domiciliarioLoc, destination) => {
    if (!domiciliarioLoc || !destination) return null;
    
    const R = 6371;
    const dLat = (destination.lat - domiciliarioLoc.lat) * Math.PI / 180;
    const dLon = (destination.lng - domiciliarioLoc.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(domiciliarioLoc.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    const timeInMinutes = Math.round((distance / 20) * 60);
    
    return timeInMinutes > 1 ? timeInMinutes : 5;
  };

  useEffect(() => {
    fetchOrderData();
    loadGoogleMaps();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    if (order) {
      startLocationUpdates();
    }
  }, [order]);

  useEffect(() => {
    if (mapsLoaded && map) {
      updateMapMarkers();
    }
  }, [domiciliarioLocation, order, map, mapsLoaded]);

  useEffect(() => {
    if (domiciliarioLocation && order?.coordenadasEntrega) {
      const time = calculateEstimatedTime(domiciliarioLocation, order.coordenadasEntrega);
      setEstimatedTime(time);
    }
  }, [domiciliarioLocation, order]);

  const renderStatusCard = () => {
    if (!order) return null;

    const statusConfig = {
      pendiente: { 
        label: 'Pendiente', 
        color: 'status-pending', 
        icon: '⏳',
        description: 'Esperando a que un domiciliario acepte tu mandado'
      },
      aceptado: { 
        label: 'Aceptado', 
        color: 'status-accepted', 
        icon: '👍',
        description: 'Tu mandado ha sido aceptado'
      },
      en_camino: { 
        label: 'En camino', 
        color: 'status-route', 
        icon: '🛵',
        description: 'El domiciliario está en camino'
      },
      en_proceso: { 
        label: 'En proceso', 
        color: 'status-process', 
        icon: '📦',
        description: 'El domiciliario está realizando tu mandado'
      },
      completado: { 
        label: 'Completado', 
        color: 'status-completed', 
        icon: '✅',
        description: 'Mandado entregado exitosamente'
      },
      cancelado: { 
        label: 'Cancelado', 
        color: 'status-cancelled', 
        icon: '❌',
        description: 'Este mandado ha sido cancelado'
      }
    };

    const status = statusConfig[order.estado] || statusConfig.pendiente;

    return (
      <div className={`status-card ${status.color}`}>
        <div className="status-header">
          <div className="status-icon">{status.icon}</div>
          <div className="status-info">
            <h3 className="status-title">{status.label}</h3>
            <p className="status-description">{status.description}</p>
          </div>
        </div>
        
        {order.estado === 'en_camino' && estimatedTime && (
          <div className="eta-display">
            <div className="eta-icon">⏱️</div>
            <div className="eta-info">
              <span className="eta-label">Tiempo estimado</span>
              <span className="eta-time">{estimatedTime} min</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTimeline = () => {
    if (!order) return null;

    const timelineSteps = [
      { 
        key: 'created', 
        label: 'Solicitado', 
        date: order.createdAt,
        icon: '📝',
        active: true
      },
      { 
        key: 'accepted', 
        label: 'Aceptado', 
        date: order.fechaAceptado,
        icon: '✅',
        active: !!order.fechaAceptado
      },
      { 
        key: 'onway', 
        label: 'En camino', 
        date: order.fechaEnCamino,
        icon: '🛵',
        active: !!order.fechaEnCamino
      },
      { 
        key: 'completed', 
        label: 'Completado', 
        date: order.fechaCompletado,
        icon: '🎉',
        active: !!order.fechaCompletado
      }
    ];

    return (
      <div className="timeline-modern">
        {timelineSteps.map((step, index) => (
          <div key={step.key} className={`timeline-step ${step.active ? 'active' : ''}`}>
            <div className="step-indicator">
              <div className="step-icon">{step.icon}</div>
              {index < timelineSteps.length - 1 && <div className="step-connector"></div>}
            </div>
            <div className="step-content">
              <div className="step-label">{step.label}</div>
              <div className="step-date">
                {step.date ? new Date(step.date).toLocaleString() : 'Pendiente'}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDomiciliarioCard = () => {
    if (!domiciliario) {
      return (
        <div className="info-card waiting">
          <div className="card-icon">⏳</div>
          <div className="card-content">
            <h4>Esperando domiciliario</h4>
            <p>Tu mandado está esperando a que un domiciliario lo acepte.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="info-card domiciliario">
        <div className="card-header">
          <div className="card-icon">🛵</div>
          <h4>Domiciliario asignado</h4>
        </div>
        <div className="card-body">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Nombre</span>
              <span className="info-value">{domiciliario.nombre}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Teléfono</span>
              <span className="info-value">{domiciliario.telefono}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Vehículo</span>
              <span className="info-value">{domiciliario.tipoVehiculo || 'No especificado'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Placa</span>
              <span className="info-value">{domiciliario.placaVehiculo || 'N/A'}</span>
            </div>
          </div>
          
          <div className="status-badge">
            <span className={`availability ${domiciliario.disponible ? 'available' : 'busy'}`}>
              {domiciliario.disponible ? '🟢 Disponible' : '🟡 Ocupado'}
            </span>
          </div>

          {domiciliarioLocation && (
            <div className="location-update">
              <small>📍 Ubicación actualizada: {new Date().toLocaleTimeString()}</small>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando información del mandado...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="main-content">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Mandado no encontrado</h3>
          <p>El mandado solicitado no existe o no tienes permisos para verlo.</p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/my-orders')}
          >
            Volver a mis mandados
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="order-tracking-container">
        {/* Header */}
        <div className="tracking-header">
          <div className="header-content">
            <h1>Seguimiento de Mandado</h1>
            <p>ID: #{order._id.slice(-8).toUpperCase()}</p>
          </div>
          <button 
            className="back-button"
            onClick={() => navigate('/my-orders')}
          >
            ← Volver
          </button>
        </div>

        {/* Status Card */}
        {renderStatusCard()}

        {/* Navigation Tabs */}
        <div className="tracking-tabs">
          <button 
            className={`tab-button ${activeTab === 'tracking' ? 'active' : ''}`}
            onClick={() => setActiveTab('tracking')}
          >
            🗺️ Seguimiento
          </button>
          <button 
            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            📋 Detalles
          </button>
          <button 
            className={`tab-button ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            🕒 Historial
          </button>
        </div>

        <div className="tracking-content">
          {/* Tracking Tab */}
          {activeTab === 'tracking' && (
            <div className="tab-content">
              <div className="map-section">
                <div className="map-header">
                  <h3>Mapa de seguimiento</h3>
                  {!mapsLoaded && <div className="loading-dots">Cargando mapa</div>}
                </div>
                
                {error && (
                  <div className="map-error">
                    <div className="error-icon">⚠️</div>
                    <p>{error}</p>
                  </div>
                )}
                
                <div 
                  ref={mapRef}
                  className="map-container"
                />
                
                <div className="map-legend">
                  <div className="legend-item">
                    <span className="legend-marker delivery">📍</span>
                    <span>Punto de entrega</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-marker driver">🛵</span>
                    <span>Domiciliario</span>
                  </div>
                </div>
              </div>

              <div className="sidebar">
                {renderDomiciliarioCard()}
                
                <div className="action-card">
                  <h4>Acciones rápidas</h4>
                  <div className="action-buttons">
                    {domiciliario && (
                      <button 
                        className="btn-action call"
                        onClick={() => window.open(`tel:${domiciliario.telefono}`)}
                      >
                        📞 Llamar al domiciliario
                      </button>
                    )}
                    
                    <button 
                      className="btn-action details"
                      onClick={() => navigate(`/order/${order._id}`)}
                    >
                      📋 Ver detalles completos
                    </button>
                    
                    {order.estado === 'completado' && (
                      <button 
                        className="btn-action rate"
                        onClick={() => showNotification('info', 'Funcionalidad de calificación en desarrollo')}
                      >
                        ⭐ Calificar servicio
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="tab-content">
              <div className="details-grid">
                <div className="detail-card">
                  <h4>📦 Información del mandado</h4>
                  <div className="detail-list">
                    <div className="detail-item">
                      <span className="detail-label">Descripción</span>
                      <span className="detail-value">{order.descripcion}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Categoría</span>
                      <span className="detail-tag">{order.categoria}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Precio</span>
                      <span className="detail-price">${order.precioOfertado?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-card">
                  <h4>📍 Ubicaciones</h4>
                  <div className="detail-list">
                    <div className="detail-item">
                      <span className="detail-label">Recogida</span>
                      <span className="detail-value">{order.ubicacionRecogida}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Entrega</span>
                      <span className="detail-value">{order.ubicacionEntrega}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Fecha límite</span>
                      <span className="detail-value">{new Date(order.fechaLimite).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {order.notasAdicionales && (
                  <div className="detail-card notes">
                    <h4>📝 Notas adicionales</h4>
                    <p>{order.notasAdicionales}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="tab-content">
              {renderTimeline()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;