// components/OrderTracking.js
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
  
  const intervalRef = useRef();
  const mapRef = useRef(null);
  const scriptRef = useRef(null);

  // Obtener URL de la API
  const getApiUrl = () => {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  };

  // Verificar si Google Maps está cargado
  const isGoogleMapsLoaded = () => {
    return window.google && window.google.maps && window.google.maps.Map;
  };

  // Cargar Google Maps
  const loadGoogleMaps = () => {
    if (isGoogleMapsLoaded()) {
      console.log('✅ Google Maps ya está cargado');
      setMapsLoaded(true);
      initMap();
      return;
    }

    const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!API_KEY) {
      console.error('❌ Google Maps API Key no configurada');
      setError('Google Maps no está configurado. Contacta al administrador.');
      return;
    }

    // Limpiar script anterior si existe
    if (scriptRef.current) {
      document.head.removeChild(scriptRef.current);
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.ref = scriptRef;
    
    script.onload = () => {
      console.log('✅ Script de Google Maps cargado');
      // Esperar a que esté completamente disponible
      const checkReady = setInterval(() => {
        if (isGoogleMapsLoaded()) {
          clearInterval(checkReady);
          setMapsLoaded(true);
          initMap();
        }
      }, 100);
    };
    
    script.onerror = (err) => {
      console.error('❌ Error cargando Google Maps:', err);
      setError('Error cargando el mapa. Verifica tu conexión.');
      setLoading(false);
    };
    
    document.head.appendChild(script);
    scriptRef.current = script;
  };

  // Inicializar mapa
  const initMap = () => {
    console.log('🗺️ Inicializando mapa...');
    
    if (!mapRef.current) {
      console.error('❌ Elemento del mapa no encontrado');
      return;
    }

    if (!isGoogleMapsLoaded()) {
      console.error('❌ Google Maps no disponible');
      return;
    }

    try {
      // Ubicación por defecto (Bogotá)
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
      console.log('✅ Mapa inicializado correctamente');
      
      // Actualizar marcadores después de inicializar el mapa
      setTimeout(updateMapMarkers, 500);
      
    } catch (err) {
      console.error('❌ Error inicializando mapa:', err);
      setError('Error al inicializar el mapa: ' + err.message);
    }
  };

  // Actualizar marcadores en el mapa
  const updateMapMarkers = () => {
    if (!map || !isGoogleMapsLoaded()) {
      console.log('⚠️ Mapa no disponible para actualizar marcadores');
      return;
    }

    console.log('📍 Actualizando marcadores...');

    try {
      // Limpiar marcadores existentes (en una implementación real guardarías referencias)
      // Por ahora, el mapa se encarga de limpiar automáticamente

      // Marcador de ubicación de entrega
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

        // Centrar en el punto de entrega inicialmente
        map.setCenter(order.coordenadasEntrega);
        map.setZoom(15);
      }

      // Marcador del domiciliario
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

        // Ajustar vista para mostrar ambos puntos
        if (order?.coordenadasEntrega) {
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(domiciliarioLocation);
          bounds.extend(order.coordenadasEntrega);
          map.fitBounds(bounds);
        }
      }

      console.log('✅ Marcadores actualizados');
      
    } catch (err) {
      console.error('❌ Error actualizando marcadores:', err);
    }
  };

  // Cargar datos del mandado
  const fetchOrderData = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE = getApiUrl();
      
      console.log('📦 Cargando datos del mandado...');
      const response = await axios.get(`${API_BASE}/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setOrder(response.data);
      console.log('✅ Mandado cargado:', response.data.estado);
      
      // Si hay un domiciliario asignado, cargar sus datos
      if (response.data.ejecutante && response.data.estado !== 'pendiente') {
        fetchDomiciliarioData(response.data.ejecutante._id);
      }
      
    } catch (error) {
      console.error('❌ Error cargando mandado:', error);
      setError('No se pudo cargar la información del mandado');
      showNotification('error', 'Error al cargar el mandado');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos del domiciliario
  const fetchDomiciliarioData = async (domiciliarioId) => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE = getApiUrl();
      
      console.log('🛵 Cargando datos del domiciliario...');
      const response = await axios.get(`${API_BASE}/api/users/${domiciliarioId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDomiciliario(response.data);
      console.log('✅ Domiciliario cargado:', response.data.nombre);
      
      // Si el domiciliario tiene ubicación, actualizar en el mapa
      if (response.data.ubicacionActual) {
        const newLocation = {
          lat: response.data.ubicacionActual.lat,
          lng: response.data.ubicacionActual.lng
        };
        setDomiciliarioLocation(newLocation);
        console.log('📍 Ubicación del domiciliario:', newLocation);
      }
      
    } catch (error) {
      console.error('❌ Error cargando domiciliario:', error);
    }
  };

  // Actualizar ubicación del domiciliario periódicamente
  const startLocationUpdates = () => {
    if (order?.ejecutante && order.estado !== 'completado' && order.estado !== 'cancelado') {
      console.log('🔄 Iniciando actualizaciones de ubicación...');
      intervalRef.current = setInterval(() => {
        if (order.ejecutante) {
          fetchDomiciliarioData(order.ejecutante._id);
        }
      }, 15000); // Actualizar cada 15 segundos
    }
  };

  // Calcular tiempo estimado de entrega
  const calculateEstimatedTime = (domiciliarioLoc, destination) => {
    if (!domiciliarioLoc || !destination) return null;
    
    // Simulación simple de cálculo de tiempo
    const R = 6371; // Radio de la Tierra en km
    const dLat = (destination.lat - domiciliarioLoc.lat) * Math.PI / 180;
    const dLon = (destination.lng - domiciliarioLoc.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(domiciliarioLoc.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distancia en km
    
    // Suponiendo velocidad promedio de 20 km/h en ciudad
    const timeInMinutes = Math.round((distance / 20) * 60);
    
    return timeInMinutes > 1 ? timeInMinutes : 5; // Mínimo 5 minutos
  };

  // Efectos
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
    // Calcular tiempo estimado cuando hay ubicación del domiciliario
    if (domiciliarioLocation && order?.coordenadasEntrega) {
      const time = calculateEstimatedTime(domiciliarioLocation, order.coordenadasEntrega);
      setEstimatedTime(time);
    }
  }, [domiciliarioLocation, order]);

  // Renderizar estado del mandado
  const renderStatus = () => {
    if (!order) return null;

    const statusConfig = {
      pendiente: { label: '🕒 Pendiente', color: 'warning', icon: '⏳' },
      aceptado: { label: '✅ Aceptado', color: 'info', icon: '👍' },
      en_camino: { label: '🚗 En camino', color: 'primary', icon: '🛵' },
      en_proceso: { label: '📦 En proceso', color: 'info', icon: '📦' },
      completado: { label: '🎉 Completado', color: 'success', icon: '✅' },
      cancelado: { label: '❌ Cancelado', color: 'danger', icon: '❌' }
    };

    const status = statusConfig[order.estado] || statusConfig.pendiente;

    return (
      <div className={`alert alert-${status.color} d-flex align-items-center`}>
        <span className="fs-4 me-2">{status.icon}</span>
        <div>
          <strong>{status.label}</strong>
          {order.estado === 'en_camino' && estimatedTime && (
            <div className="small">
              Tiempo estimado: <strong>{estimatedTime} minutos</strong>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderizar información del domiciliario
  const renderDomiciliarioInfo = () => {
    if (!domiciliario) {
      return (
        <div className="alert alert-info">
          <strong>⏳ Esperando domiciliario...</strong>
          <p className="mb-0 small">Tu mandado está esperando a que un domiciliario lo acepte.</p>
        </div>
      );
    }

    return (
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h6 className="mb-0">🛵 Domiciliario asignado</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Nombre:</strong> {domiciliario.nombre}</p>
              <p><strong>Teléfono:</strong> {domiciliario.telefono}</p>
              <p><strong>Vehículo:</strong> {domiciliario.tipoVehiculo || 'No especificado'}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Placa:</strong> {domiciliario.placaVehiculo || 'N/A'}</p>
              <p><strong>Estado:</strong> 
                <span className={`badge ${domiciliario.disponible ? 'bg-success' : 'bg-warning'} ms-2`}>
                  {domiciliario.disponible ? 'Disponible' : 'Ocupado'}
                </span>
              </p>
              {domiciliarioLocation && (
                <p><strong>📍 Ubicación activa</strong></p>
              )}
            </div>
          </div>
          
          {domiciliarioLocation && (
            <div className="mt-3 p-3 bg-light rounded">
              <small className="text-muted">
                <strong>Última actualización:</strong> {new Date().toLocaleTimeString()}
              </small>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderizar información del mandado
  const renderOrderInfo = () => {
    if (!order) return null;

    return (
      <div className="card mb-4">
        <div className="card-header bg-secondary text-white">
          <h6 className="mb-0">📦 Información del mandado</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Descripción:</strong> {order.descripcion}</p>
              <p><strong>Categoría:</strong> 
                <span className="badge bg-info ms-2">{order.categoria}</span>
              </p>
              <p><strong>Precio ofertado:</strong> 
                <span className="text-success fw-bold ms-2">
                  ${order.precioOfertado?.toLocaleString()}
                </span>
              </p>
            </div>
            <div className="col-md-6">
              <p><strong>Recogida:</strong> {order.ubicacionRecogida}</p>
              <p><strong>Entrega:</strong> {order.ubicacionEntrega}</p>
              <p><strong>Fecha límite:</strong> {new Date(order.fechaLimite).toLocaleString()}</p>
            </div>
          </div>
          
          {order.notasAdicionales && (
            <div className="mt-3 p-3 bg-light rounded">
              <strong>Notas adicionales:</strong>
              <p className="mb-0">{order.notasAdicionales}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderizar mensaje de error del mapa
  const renderMapError = () => {
    if (!error) return null;

    return (
      <div className="alert alert-warning">
        <h6>⚠️ Problema con el mapa</h6>
        <p className="mb-2">{error}</p>
        <small className="text-muted">
          {!process.env.REACT_APP_GOOGLE_MAPS_API_KEY && 
            "Verifica que la variable REACT_APP_GOOGLE_MAPS_API_KEY esté configurada en tu archivo .env"
          }
        </small>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando información del mandado...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          <h5>⚠️ Mandado no encontrado</h5>
          <p>El mandado solicitado no existe o no tienes permisos para verlo.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/my-orders')}
          >
            Volver a mis mandados
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>📦 Seguimiento de Mandado</h2>
            <button 
              className="btn btn-outline-secondary"
              onClick={() => navigate('/my-orders')}
            >
              ← Volver
            </button>
          </div>

          {renderStatus()}
          
          {/* Mapa */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">🗺️ Mapa de seguimiento</h6>
              {!mapsLoaded && (
                <div className="spinner-border spinner-border-sm text-light" role="status">
                  <span className="visually-hidden">Cargando mapa...</span>
                </div>
              )}
            </div>
            <div className="card-body p-0">
              {renderMapError()}
              
              {!process.env.REACT_APP_GOOGLE_MAPS_API_KEY && (
                <div className="alert alert-danger m-3">
                  <strong>❌ API Key no configurada</strong>
                  <p className="mb-0">
                    Agrega REACT_APP_GOOGLE_MAPS_API_KEY a tu archivo .env
                  </p>
                </div>
              )}
              
              <div 
                ref={mapRef}
                style={{ 
                  height: '400px', 
                  width: '100%',
                  backgroundColor: '#f8f9fa',
                  minHeight: '400px'
                }}
                className="rounded-bottom"
              />
              <div className="p-3 border-top">
                <div className="row text-center">
                  <div className="col-md-4">
                    <span className="badge bg-success me-2">📍</span>
                    <small>Punto de entrega</small>
                  </div>
                  <div className="col-md-4">
                    <span className="badge bg-warning me-2">🛵</span>
                    <small>Domiciliario</small>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted">
                      {domiciliarioLocation ? 'Seguimiento activo' : 'Esperando ubicación'}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {renderOrderInfo()}
        </div>

        <div className="col-md-4">
          {renderDomiciliarioInfo()}
          
          {/* Acciones */}
          <div className="card mt-4">
            <div className="card-header bg-info text-white">
              <h6 className="mb-0">⚡ Acciones</h6>
            </div>
            <div className="card-body">
              {domiciliario && (
                <button 
                  className="btn btn-outline-primary w-100 mb-2"
                  onClick={() => window.open(`tel:${domiciliario.telefono}`)}
                >
                  📞 Llamar al domiciliario
                </button>
              )}
              
              <button 
                className="btn btn-outline-secondary w-100 mb-2"
                onClick={() => navigate(`/order/${order._id}`)}
              >
                📋 Ver detalles completos
              </button>
              
              {order.estado === 'completado' && (
                <button 
                  className="btn btn-success w-100"
                  onClick={() => showNotification('info', 'Funcionalidad de calificación en desarrollo')}
                >
                  ⭐ Calificar servicio
                </button>
              )}
            </div>
          </div>

          {/* Información de tiempos */}
          <div className="card mt-4">
            <div className="card-header bg-light">
              <h6 className="mb-0">🕒 Historial de tiempos</h6>
            </div>
            <div className="card-body">
              <div className="timeline">
                <div className="timeline-item">
                  <small className="text-muted">Creado:</small>
                  <div>{new Date(order.createdAt).toLocaleString()}</div>
                </div>
                {order.fechaAceptado && (
                  <div className="timeline-item">
                    <small className="text-muted">Aceptado:</small>
                    <div>{new Date(order.fechaAceptado).toLocaleString()}</div>
                  </div>
                )}
                {order.fechaEnCamino && (
                  <div className="timeline-item">
                    <small className="text-muted">En camino:</small>
                    <div>{new Date(order.fechaEnCamino).toLocaleString()}</div>
                  </div>
                )}
                {order.fechaCompletado && (
                  <div className="timeline-item">
                    <small className="text-muted">Completado:</small>
                    <div>{new Date(order.fechaCompletado).toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;