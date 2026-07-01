// pages/MyOrders.js - VERSIÓN MODERNA
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import axios from 'axios';

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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapsLoaded(true);
    };
    script.onerror = () => {
      console.error('Error cargando Google Maps');
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

  const getStatusConfig = (estado) => {
    const statusConfig = {
      pendiente: { label: 'Pendiente', color: 'warning', icon: '⏳' },
      aceptado: { label: 'Aceptado', color: 'info', icon: '👍' },
      en_camino: { label: 'En camino', color: 'primary', icon: '🛵' },
      en_proceso: { label: 'En proceso', color: 'info', icon: '📦' },
      completado: { label: 'Completado', color: 'success', icon: '✅' },
      cancelado: { label: 'Cancelado', color: 'error', icon: '❌' }
    };
    return statusConfig[estado] || statusConfig.pendiente;
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

  // Componente para mostrar el mapa de seguimiento
  const OrderTrackingMap = ({ order, domiciliario }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [mapInitialized, setMapInitialized] = useState(false);

    useEffect(() => {
      if (mapsLoaded && order && !mapInitialized) {
        const timer = setTimeout(() => {
          initializeMap();
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [mapsLoaded, order, mapInitialized]);

    const initializeMap = () => {
      if (!mapRef.current || !window.google?.maps) return;

      try {
        const defaultLocation = domiciliario?.ubicacionActual || 
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
            title: 'Punto de entrega',
            icon: {
              url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMyOGE3NDUiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
              scaledSize: new window.google.maps.Size(25, 25),
            }
          });
        }

        // Marcador del domiciliario
        if (domiciliario?.ubicacionActual) {
          new window.google.maps.Marker({
            position: domiciliario.ubicacionActual,
            map: mapInstance,
            title: `Domiciliario: ${domiciliario?.nombre}`,
            icon: {
              url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNmZjY2MDAiLz4KPHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxMy4xN2w3LjU5LTcuNTlMMTkgN2wtOSA5eiIvPjwvc3ZnPgo8L3N2Zz4=',
              scaledSize: new window.google.maps.Size(25, 25),
            }
          });

          if (order.coordenadasEntrega) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(domiciliario.ubicacionActual);
            bounds.extend(order.coordenadasEntrega);
            mapInstance.fitBounds(bounds);
          }
        }

      } catch (error) {
        console.error('Error inicializando mapa:', error);
      }
    };

    if (!mapsLoaded) {
      return (
        <div className="map-loading">
          <div className="loading-spinner small"></div>
          <span>Cargando mapa...</span>
        </div>
      );
    }

    if (!process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
      return (
        <div className="map-placeholder">
          <span>🔧 Mapa no disponible</span>
        </div>
      );
    }

    return (
      <div className="tracking-map-container">
        <div ref={mapRef} className="tracking-map" />
        <div className="map-status">
          {domiciliario?.ubicacionActual ? '📍 Seguimiento en tiempo real' : '⏳ Esperando ubicación'}
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

    const getVehicleIcon = (tipo) => {
      const icons = {
        moto: '🏍️',
        bicicleta: '🚲',
        carro: '🚗',
        caminando: '🚶'
      };
      return icons[tipo] || '🚗';
    };

    return (
      <div className="expanded-details">
        <div className="details-grid">
          {/* Información del Domiciliario */}
          <div className="detail-section">
            <h4>Información del Domiciliario</h4>
            
            {loadingDomiciliario ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <span>Cargando información...</span>
              </div>
            ) : domiciliario ? (
              <div className="domiciliario-card">
                <div className="domiciliario-header">
                  <div className="domiciliario-avatar">
                    {domiciliario.nombre?.charAt(0).toUpperCase()}
                  </div>
                  <div className="domiciliario-info">
                    <h5>{domiciliario.nombre}</h5>
                    <div className={`status-badge ${domiciliario.disponible ? 'available' : 'busy'}`}>
                      {domiciliario.disponible ? '🟢 Disponible' : '🟡 Ocupado'}
                    </div>
                  </div>
                </div>
                
                <div className="domiciliario-details">
                  <div className="detail-item">
                    <span className="detail-icon">📞</span>
                    <a href={`tel:${domiciliario.telefono}`} className="detail-link">
                      {domiciliario.telefono}
                    </a>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">{getVehicleIcon(domiciliario.tipoVehiculo)}</span>
                    <span>{domiciliario.tipoVehiculo || 'No especificado'}</span>
                  </div>
                  {domiciliario.placaVehiculo && (
                    <div className="detail-item">
                      <span className="detail-icon">🔢</span>
                      <span>{domiciliario.placaVehiculo}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">⏳</div>
                <p>Esperando que un domiciliario acepte el mandado</p>
              </div>
            )}
          </div>

          {/* Mapa de Seguimiento */}
          <div className="detail-section">
            <h4>Seguimiento en Tiempo Real</h4>
            <OrderTrackingMap order={order} domiciliario={domiciliario} />
          </div>
        </div>

        {/* Información Detallada del Mandado */}
        <div className="detail-section">
          <h4>Detalles del Mandado</h4>
          <div className="order-details-grid">
            <div className="detail-column">
              <div className="detail-group">
                <label>Descripción completa</label>
                <p>{order.descripcion}</p>
              </div>
              {order.notasAdicionales && (
                <div className="detail-group">
                  <label>Notas adicionales</label>
                  <p>{order.notasAdicionales}</p>
                </div>
              )}
            </div>
            <div className="detail-column">
              <div className="detail-group">
                <label>📍 Recogida</label>
                <span>{order.ubicacionRecogida}</span>
              </div>
              <div className="detail-group">
                <label>🎯 Entrega</label>
                <span>{order.ubicacionEntrega}</span>
              </div>
              <div className="detail-group">
                <label>⏰ Fecha límite</label>
                <span>{new Date(order.fechaLimite).toLocaleString()}</span>
              </div>
              <div className="detail-group">
                <label>💰 Precio</label>
                <span className="price">${order.precioOfertado?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="actions-section">
          <div className="action-buttons">
            <Link to={`/order/${order._id}`} className="btn-modern outline">
              📋 Ver detalles completos
            </Link>
            {order.ejecutante && order.estado !== 'completado' && order.estado !== 'cancelado' && (
              <Link to={`/order-tracking/${order._id}`} className="btn-modern primary">
                🛵 Seguimiento avanzado
              </Link>
            )}
            {domiciliario && (
              <button 
                className="btn-modern success"
                onClick={() => window.open(`tel:${domiciliario.telefono}`)}
              >
                📞 Llamar al domiciliario
              </button>
            )}
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
      <div className="modern-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Cargando tus mandados...</p>
        </div>
      </div>
    );
  }

  return (
     <div className="main-content"> {/* ← Agrega esta línea */}
    <div className="modern-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Mis Mandados</h1>
          <p>Gestiona y da seguimiento a tus mandados activos</p>
        </div>
        <Link to="/create-order" className="btn-modern primary">
          <span className="btn-icon">+</span>
          Crear Nuevo Mandado
        </Link>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'todos' ? 'active' : ''}`}
            onClick={() => setFilter('todos')}
          >
            Todos
          </button>
          <button
            className={`filter-tab ${filter === 'activos' ? 'active' : ''}`}
            onClick={() => setFilter('activos')}
          >
            Activos
          </button>
          <button
            className={`filter-tab ${filter === 'completados' ? 'active' : ''}`}
            onClick={() => setFilter('completados')}
          >
            Completados
          </button>
        </div>
        <div className="orders-count">
          {filteredOrders.length} de {orders.length} mandados
        </div>
      </div>

      {/* Lista de Mandados */}
      {filteredOrders.length === 0 ? (
        <div className="empty-state large">
          <div className="empty-icon">📦</div>
          <h3>No hay mandados</h3>
          <p>
            {filter !== 'todos' 
              ? `No tienes mandados ${filter}.`
              : "Aún no has creado ningún mandado."
            }
          </p>
          {filter === 'todos' && (
            <Link to="/create-order" className="btn-modern primary">
              Crear mi primer mandado
            </Link>
          )}
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map(order => {
            const statusConfig = getStatusConfig(order.estado);
            
            return (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-title">
                    <span className="category-icon">
                      {getCategoryIcon(order.categoria)}
                    </span>
                    <div className="order-info">
                      <h3>{order.categoria}</h3>
                      <span className="order-id">#{order._id.slice(-6).toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="order-actions">
                    <div className={`status-badge ${statusConfig.color}`}>
                      <span className="status-icon">{statusConfig.icon}</span>
                      {statusConfig.label}
                    </div>
                    <button 
                      className="expand-btn"
                      onClick={() => toggleOrderExpansion(order._id)}
                    >
                      {expandedOrder === order._id ? '▲' : '▼'}
                    </button>
                  </div>
                </div>
                
                <div className="order-content">
                  <div className="order-details">
                    <h4>{order.descripcion}</h4>
                    <div className="order-meta">
                      <div className="meta-item">
                        <span className="meta-label">💰 Precio:</span>
                        <span className="meta-value">${order.precioOfertado?.toLocaleString()}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">🎯 Entrega:</span>
                        <span className="meta-value">{order.ubicacionEntrega}</span>
                      </div>
                      {order.ejecutante && (
                        <div className="meta-item">
                          <span className="meta-label">🛵 Domiciliario:</span>
                          <span className="meta-value">{order.ejecutante.nombre}</span>
                        </div>
                      )}
                      <div className="meta-item">
                        <span className="meta-label">📅 Creado:</span>
                        <span className="meta-value">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="order-cta">
                    <Link to={`/order/${order._id}`} className="btn-modern outline small">
                      Ver detalles
                    </Link>
                    {order.ejecutante && order.estado !== 'completado' && order.estado !== 'cancelado' && (
                      <Link to={`/order-tracking/${order._id}`} className="btn-modern primary small">
                        🛵 Seguir en vivo
                      </Link>
                    )}
                  </div>
                </div>

                {/* Información expandida */}
                {expandedOrder === order._id && (
                  <ExpandedOrderDetails order={order} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
    </div>
  );
};

export default MyOrders;