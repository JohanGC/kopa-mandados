// pages/MyOrders.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import axios from 'axios';
import useWebSocket from '../hooks/useWebSocket';

const MyOrders = () => {
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  const getApiUrl = () => {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  };

  // Cargar Google Maps
  const loadGoogleMaps = () => {
    if (window.google && window.google.maps) {
      setMapsLoaded(true);
      return;
    }

    const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!API_KEY) {
      console.warn('Google Maps API Key no configurada');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('✅ Google Maps cargado en MyOrders');
      setMapsLoaded(true);
    };
    script.onerror = () => {
      console.error('❌ Error cargando Google Maps');
    };
    document.head.appendChild(script);
  };

  const fetchMyOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE = getApiUrl();
      
      const response = await axios.get(`${API_BASE}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filtrar órdenes del usuario actual
      const myOrders = response.data.filter(order => 
        order.solicitante && order.solicitante._id === currentUser._id
      );
      
      setOrders(myOrders);
    } catch (error) {
      console.error('Error cargando mis mandados:', error);
      showNotification('error', 'Error al cargar tus mandados');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (estado) => {
    const statusConfig = {
      pendiente: { label: 'Pendiente', class: 'warning', icon: '⏳' },
      aceptado: { label: 'Aceptado', class: 'info', icon: '👍' },
      en_camino: { label: 'En camino', class: 'primary', icon: '🛵' },
      en_proceso: { label: 'En proceso', class: 'info', icon: '📦' },
      completado: { label: 'Completado', class: 'success', icon: '✅' },
      cancelado: { label: 'Cancelado', class: 'danger', icon: '❌' }
    };

    const config = statusConfig[estado] || statusConfig.pendiente;
    return (
      <span className={`badge bg-${config.class} d-flex align-items-center`}>
        <span className="me-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getCategoryIcon = (categoria) => {
    const icons = {
      documentos: '📄',
      comida: '🍕',
      farmacia: '💊',
      mercado: '🛒',
      otros: '📦'
    };
    return icons[categoria] || '📦';
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'todos') return true;
    if (filter === 'activos') return !['completado', 'cancelado'].includes(order.estado);
    if (filter === 'completados') return order.estado === 'completado';
    return order.estado === filter;
  });

  // Componente para mostrar el mapa de seguimiento - VERSIÓN CORREGIDA
  const OrderTrackingMap = ({ order, domiciliario }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [mapInitialized, setMapInitialized] = useState(false);
    const [domiciliarioLocation, setDomiciliarioLocation] = useState(null);

    useEffect(() => {
      if (domiciliario?.ubicacionActual) {
        setDomiciliarioLocation({
          lat: domiciliario.ubicacionActual.lat,
          lng: domiciliario.ubicacionActual.lng
        });
      }
    }, [domiciliario]);

    // Inicializar mapa cuando el componente esté montado y los datos listos
    useEffect(() => {
      if (!mapsLoaded || !order || mapInitialized) return;

      // Pequeño delay para asegurar que el DOM esté listo
      const timer = setTimeout(() => {
        initializeMap();
      }, 100);

      return () => clearTimeout(timer);
    }, [mapsLoaded, order, mapInitialized]);

    const initializeMap = () => {
      if (!mapRef.current) {
        console.error('❌ mapRef.current no está disponible');
        return;
      }

      if (!window.google || !window.google.maps) {
        console.error('❌ Google Maps no está disponible');
        return;
      }

      try {
        console.log('🗺️ Inicializando mapa para orden:', order._id);
        
        // Ubicación por defecto o del domiciliario
        const defaultLocation = domiciliarioLocation || 
          (order.coordenadasEntrega ? order.coordenadasEntrega : { lat: 4.6097, lng: -74.0817 });
        
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          zoom: 13,
          center: defaultLocation,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "on" }]
            }
          ]
        });

        setMap(mapInstance);
        setMapInitialized(true);

        // Marcador de entrega
        if (order.coordenadasEntrega) {
          new window.google.maps.Marker({
            position: order.coordenadasEntrega,
            map: mapInstance,
            title: '📍 Punto de entrega',
            icon: {
              url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMyOGE3NDUiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
              scaledSize: new window.google.maps.Size(25, 25),
              anchor: new window.google.maps.Point(12.5, 12.5)
            }
          });
        }

        // Marcador del domiciliario
        if (domiciliarioLocation) {
          new window.google.maps.Marker({
            position: domiciliarioLocation,
            map: mapInstance,
            title: `🛵 ${domiciliario?.nombre || 'Domiciliario'}`,
            icon: {
              url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNmZjY2MDAiLz4KPHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxMy4xN2w3LjU5LTcuNTlMMTkgN2wtOSA5eiIvPjwvc3ZnPgo8L3N2Zz4=',
              scaledSize: new window.google.maps.Size(25, 25),
              anchor: new window.google.maps.Point(12.5, 12.5)
            }
          });

          // Ajustar vista para mostrar ambos puntos
          if (order.coordenadasEntrega) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(domiciliarioLocation);
            bounds.extend(order.coordenadasEntrega);
            mapInstance.fitBounds(bounds);
          }
        }

        console.log('✅ Mapa inicializado correctamente');

      } catch (error) {
        console.error('❌ Error inicializando mapa:', error);
      }
    };

    // Re-inicializar mapa cuando cambia la ubicación del domiciliario
    useEffect(() => {
      if (map && domiciliarioLocation) {
        // Aquí podrías actualizar la posición del marcador del domiciliario
        // Por simplicidad, re-inicializamos el mapa
        setMapInitialized(false);
        setTimeout(() => {
          initializeMap();
        }, 500);
      }
    }, [domiciliarioLocation]);

    if (!mapsLoaded) {
      return (
        <div className="text-center py-4">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Cargando mapa...</span>
          </div>
          <small className="text-muted d-block mt-2">Cargando mapa...</small>
        </div>
      );
    }

    if (!process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
      return (
        <div className="text-center py-4 bg-light rounded">
          <small className="text-muted">
            🔧 Mapa no disponible - Configura la API Key de Google Maps
          </small>
        </div>
      );
    }

    return (
      <div className="mt-3">
        <div 
          ref={mapRef}
          style={{ 
            height: '200px', 
            width: '100%',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}
        />
        <div className="mt-2 text-center">
          <small className="text-muted">
            {domiciliarioLocation ? '📍 Seguimiento en tiempo real' : '⏳ Esperando ubicación del domiciliario'}
          </small>
        </div>
      </div>
    );
  };

  // Componente para información expandida del mandado
  const ExpandedOrderDetails = ({ order }) => {
    const [domiciliario, setDomiciliario] = useState(null);
    const [loadingDomiciliario, setLoadingDomiciliario] = useState(false);

    useEffect(() => {
      const fetchDomiciliario = async () => {
        if (order.ejecutante) {
          setLoadingDomiciliario(true);
          try {
            const token = localStorage.getItem('token');
            const API_BASE = getApiUrl();
            
            const response = await axios.get(`${API_BASE}/api/users/${order.ejecutante._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setDomiciliario(response.data);
          } catch (error) {
            console.error('Error cargando domiciliario:', error);
          } finally {
            setLoadingDomiciliario(false);
          }
        }
      };

      fetchDomiciliario();
    }, [order.ejecutante]);

    return (
      <div className="card mt-3 border-primary">
        <div className="card-body">
          <div className="row">
            {/* Información del Domiciliario */}
            <div className="col-md-6">
              <h6 className="text-primary mb-3">🛵 Información del Domiciliario</h6>
              
              {loadingDomiciliario ? (
                <div className="text-center">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <small className="text-muted d-block mt-2">Cargando información...</small>
                </div>
              ) : domiciliario ? (
                <div className="domiciliario-info">
                  <div className="mb-2">
                    <strong>Nombre:</strong> {domiciliario.nombre}
                  </div>
                  <div className="mb-2">
                    <strong>Teléfono:</strong> 
                    <a href={`tel:${domiciliario.telefono}`} className="ms-2 text-decoration-none">
                      📞 {domiciliario.telefono}
                    </a>
                  </div>
                  <div className="mb-2">
                    <strong>Vehículo:</strong> 
                    <span className="ms-2">
                      {domiciliario.tipoVehiculo === 'moto' && '🏍️ Moto'}
                      {domiciliario.tipoVehiculo === 'bicicleta' && '🚲 Bicicleta'}
                      {domiciliario.tipoVehiculo === 'carro' && '🚗 Carro'}
                      {domiciliario.tipoVehiculo === 'caminando' && '🚶 Caminando'}
                      {!domiciliario.tipoVehiculo && 'No especificado'}
                    </span>
                  </div>
                  <div className="mb-2">
                    <strong>Placa:</strong> 
                    <span className="ms-2">{domiciliario.placaVehiculo || 'N/A'}</span>
                  </div>
                  <div>
                    <strong>Estado:</strong>
                    <span className={`badge ${domiciliario.disponible ? 'bg-success' : 'bg-warning'} ms-2`}>
                      {domiciliario.disponible ? '🟢 Disponible' : '🟡 Ocupado'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted py-3">
                  <div className="fs-4">⏳</div>
                  <p className="mb-0">Esperando que un domiciliario acepte el mandado</p>
                </div>
              )}
            </div>

            {/* Mapa de Seguimiento */}
            <div className="col-md-6">
              <h6 className="text-primary mb-3">🗺️ Seguimiento en Tiempo Real</h6>
              <OrderTrackingMap order={order} domiciliario={domiciliario} />
            </div>
          </div>

          {/* Información Detallada del Mandado */}
          <div className="row mt-4">
            <div className="col-12">
              <h6 className="text-primary mb-3">📦 Detalles del Mandado</h6>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-2">
                    <strong>Descripción completa:</strong>
                    <p className="mb-0 text-muted">{order.descripcion}</p>
                  </div>
                  {order.notasAdicionales && (
                    <div className="mb-2">
                      <strong>Notas adicionales:</strong>
                      <p className="mb-0 text-muted">{order.notasAdicionales}</p>
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <div className="mb-2">
                    <strong>📍 Recogida:</strong> 
                    <span className="text-muted"> {order.ubicacionRecogida}</span>
                  </div>
                  <div className="mb-2">
                    <strong>🎯 Entrega:</strong> 
                    <span className="text-muted"> {order.ubicacionEntrega}</span>
                  </div>
                  <div className="mb-2">
                    <strong>⏰ Fecha límite:</strong> 
                    <span className="text-muted"> {new Date(order.fechaLimite).toLocaleString()}</span>
                  </div>
                  <div className="mb-2">
                    <strong>💰 Precio:</strong> 
                    <span className="text-success fw-bold ms-2">
                      ${order.precioOfertado?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="d-flex gap-2 flex-wrap">
                <Link 
                  to={`/order/${order._id}`} 
                  className="btn btn-outline-primary btn-sm"
                >
                  📋 Ver detalles completos
                </Link>
                {order.ejecutante && order.estado !== 'completado' && order.estado !== 'cancelado' && (
                  <Link 
                    to={`/order-tracking/${order._id}`} 
                    className="btn btn-primary btn-sm"
                  >
                    🛵 Seguimiento avanzado
                  </Link>
                )}
                {domiciliario && (
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => window.open(`tel:${domiciliario.telefono}`)}
                  >
                    📞 Llamar al domiciliario
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (currentUser) {
      fetchMyOrders();
      loadGoogleMaps();
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando tus mandados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📦 Mis Mandados</h2>
        <Link to="/create-order" className="btn btn-primary">
          + Crear Nuevo Mandado
        </Link>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-8">
              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn btn-outline-primary ${filter === 'todos' ? 'active' : ''}`}
                  onClick={() => setFilter('todos')}
                >
                  Todos
                </button>
                <button
                  type="button"
                  className={`btn btn-outline-primary ${filter === 'activos' ? 'active' : ''}`}
                  onClick={() => setFilter('activos')}
                >
                  Activos
                </button>
                <button
                  type="button"
                  className={`btn btn-outline-primary ${filter === 'completados' ? 'active' : ''}`}
                  onClick={() => setFilter('completados')}
                >
                  Completados
                </button>
              </div>
            </div>
            <div className="col-md-4 text-end">
              <small className="text-muted">
                {filteredOrders.length} de {orders.length} mandados
              </small>
            </div>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-5">
          <div className="fs-1 mb-3">📦</div>
          <h4>No hay mandados</h4>
          <p className="text-muted">
            {filter !== 'todos' 
              ? `No tienes mandados ${filter}.`
              : "Aún no has creado ningún mandado."
            }
          </p>
          {filter === 'todos' && (
            <Link to="/create-order" className="btn btn-primary">
              Crear mi primer mandado
            </Link>
          )}
        </div>
      ) : (
        <div className="row">
          {filteredOrders.map(order => (
            <div key={order._id} className="col-12 mb-4">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    {getCategoryIcon(order.categoria)} 
                    <strong className="ms-2">{order.categoria}</strong>
                    <span className="ms-3 text-muted">
                      #{order._id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {getStatusBadge(order.estado)}
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => toggleOrderExpansion(order._id)}
                    >
                      {expandedOrder === order._id ? '▲' : '▼'}
                    </button>
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-8">
                      <h6 className="card-title">{order.descripcion}</h6>
                      <div className="row mt-2">
                        <div className="col-sm-6">
                          <small className="text-muted">
                            <strong>💰 Precio:</strong> ${order.precioOfertado?.toLocaleString()}
                          </small>
                        </div>
                        <div className="col-sm-6">
                          <small className="text-muted">
                            <strong>🎯 Entrega:</strong> {order.ubicacionEntrega}
                          </small>
                        </div>
                      </div>
                      {order.ejecutante && (
                        <div className="mt-2">
                          <small className="text-muted">
                            <strong>🛵 Domiciliario:</strong> {order.ejecutante.nombre}
                          </small>
                        </div>
                      )}
                      <div className="mt-2">
                        <small className="text-muted">
                          <strong>📅 Creado:</strong> {new Date(order.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                    <div className="col-md-4 text-end">
                      <div className="d-flex flex-column gap-2">
                        <Link 
                          to={`/order/${order._id}`} 
                          className="btn btn-outline-primary btn-sm"
                        >
                          Ver detalles
                        </Link>
                        {order.ejecutante && order.estado !== 'completado' && order.estado !== 'cancelado' && (
                          <Link 
                            to={`/order-tracking/${order._id}`} 
                            className="btn btn-primary btn-sm"
                          >
                            🛵 Seguir en vivo
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Información expandida */}
                  {expandedOrder === order._id && (
                    <ExpandedOrderDetails order={order} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;