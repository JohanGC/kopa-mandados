// components/GoogleMap.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const GoogleMap = () => {
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [domiciliarios, setDomiciliarios] = useState([]);
  const [userMarker, setUserMarker] = useState(null);
  const [domiciliarioMarkers, setDomiciliarioMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const { user } = useAuth();
  
  const mapRef = useRef(null);
  const scriptRef = useRef(null);
  const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  // Colores del diseño moderno
  const colors = {
    black: '#000000',
    lightGray: '#F0F0F0',
    primary: '#FF005A',
    secondary: '#FFC800',
    accent: '#A08CFA'
  };

  // Verificar si Google Maps está completamente cargado
  const isGoogleMapsLoaded = () => {
    return window.google && window.google.maps && window.google.maps.Map;
  };

  // Cargar Google Maps de forma más robusta
  const loadGoogleMaps = () => {
    if (isGoogleMapsLoaded()) {
      console.log('Google Maps ya está cargado');
      setMapsLoaded(true);
      setTimeout(initMap, 100);
      return;
    }

    // Limpiar script anterior si existe
    if (scriptRef.current) {
      document.head.removeChild(scriptRef.current);
    }

    // Verificar si ya hay un script cargando
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('Script de Google Maps ya está cargando...');
      const checkLoaded = setInterval(() => {
        if (isGoogleMapsLoaded()) {
          clearInterval(checkLoaded);
          setMapsLoaded(true);
          setTimeout(initMap, 100);
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.ref = scriptRef;
    
    script.onload = () => {
      console.log('Script de Google Maps cargado, verificando disponibilidad...');
      // Esperar a que todas las clases estén disponibles
      const checkMapsReady = setInterval(() => {
        if (isGoogleMapsLoaded()) {
          clearInterval(checkMapsReady);
          console.log('Google Maps completamente inicializado');
          setMapsLoaded(true);
          setTimeout(initMap, 100);
        }
      }, 50);
    };
    
    script.onerror = (err) => {
      console.error('Error cargando Google Maps:', err);
      setError('Error cargando Google Maps. Verifica tu API key.');
      setLoading(false);
    };
    
    document.head.appendChild(script);
    scriptRef.current = script;
  };

  // Inicializar el mapa con verificación mejorada
  const initMap = () => {
    console.log('Intentando inicializar mapa...');
    
    if (!isGoogleMapsLoaded()) {
      console.error('Google Maps no está completamente cargado');
      setError('Google Maps no se pudo cargar correctamente. Recargando...');
      // Reintentar después de un delay
      setTimeout(() => {
        if (isGoogleMapsLoaded()) {
          initMap();
        } else {
          setLoading(false);
        }
      }, 1000);
      return;
    }

    if (!mapRef.current) {
      console.error('Elemento del mapa no encontrado');
      setError('Elemento del mapa no disponible');
      setLoading(false);
      return;
    }

    try {
      const defaultLocation = { lat: 4.6097, lng: -74.0817 }; // Bogotá por defecto
      
      console.log('Creando instancia del mapa...');
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: defaultLocation,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        styles: [
          {
            "elementType": "geometry",
            "stylers": [{ "color": colors.lightGray }]
          },
          {
            "elementType": "labels.text.fill",
            "stylers": [{ "color": colors.black }]
          },
          {
            "elementType": "labels.text.stroke",
            "stylers": [{ "color": "#ffffff" }]
          },
          {
            "featureType": "poi",
            "elementType": "labels",
            "stylers": [{ "visibility": "on" }]
          }
        ]
      });

      setMap(mapInstance);
      setLoading(false);
      console.log('✅ Mapa inicializado correctamente');
    } catch (err) {
      console.error('Error inicializando mapa:', err);
      setError('Error al inicializar el mapa: ' + err.message);
      setLoading(false);
    }
  };

  // Obtener ubicación del usuario
  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('La geolocalización no es soportada por este navegador'));
        return;
      }

      setLoading(true);
      setError('');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('Ubicación obtenida:', location);
          setUserLocation(location);
          setLoading(false);
          resolve(location);
        },
        (err) => {
          let errorMessage = 'No se pudo obtener la ubicación';
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Permiso de ubicación denegado. Por favor habilita la ubicación en tu navegador.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Información de ubicación no disponible.';
              break;
            case err.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado para obtener la ubicación.';
              break;
            default:
              errorMessage = 'Error desconocido al obtener la ubicación.';
              break;
          }
          
          console.error('Error de geolocalización:', err);
          setError(errorMessage);
          setLoading(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        }
      );
    });
  };

  // Obtener domiciliarios disponibles
  const getDomiciliarios = async () => {
    try {
      console.log('Obteniendo domiciliarios...');
      
      // URL corregida usando el mismo método que Header.js
      const getApiUrl = () => {
        if (process.env.NODE_ENV === 'development') {
          return '';
        }
        return process.env.REACT_APP_API_URL || 'http://localhost:5000';
      };
      
      const API_BASE = getApiUrl();
      const url = `${API_BASE}/api/users/domiciliarios/disponibles`;
      
      console.log('URL de petición domiciliarios:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Respuesta no JSON recibida:', text.substring(0, 200));
        
        // Si recibimos HTML, usar datos de prueba
        if (text.includes('<!DOCTYPE html>')) {
          console.log('Usando datos de prueba para domiciliarios');
          const testData = generateTestDomiciliarios();
          setDomiciliarios(testData);
          updateDomiciliarioMarkers(testData);
          return;
        }
        
        throw new Error('El servidor devolvió una respuesta no válida');
      }
      
      const data = await response.json();
      
      console.log('Domiciliarios obtenidos:', data.length);
      setDomiciliarios(data);
      updateDomiciliarioMarkers(data);
    } catch (error) {
      console.error('Error obteniendo domiciliarios:', error);
      // Usar datos de prueba como fallback
      const testData = generateTestDomiciliarios();
      setDomiciliarios(testData);
      updateDomiciliarioMarkers(testData);
    }
  };

  // Generar datos de prueba para domiciliarios
  const generateTestDomiciliarios = () => {
    const tiposVehiculo = ['moto', 'bicicleta', 'carro', 'caminando'];
    const nombres = ['Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez', 'Pedro Rodríguez'];
    
    return nombres.map((nombre, index) => ({
      _id: `test-${index}`,
      nombre: nombre,
      tipoVehiculo: tiposVehiculo[index % tiposVehiculo.length],
      placaVehiculo: `ABC${index}${index}${index}`,
      telefono: `300${index}${index}${index}${index}${index}${index}`,
      disponible: true,
      ubicacionActual: {
        lat: 4.6097 + (Math.random() - 0.5) * 0.1,
        lng: -74.0817 + (Math.random() - 0.5) * 0.1,
        ultimaActualizacion: new Date()
      }
    }));
  };

  // Actualizar ubicación del domiciliario en la BD
  const updateDomiciliarioLocation = async (lat, lng) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('Usuario no autenticado, omitiendo actualización de ubicación');
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/users/ubicacion/actual`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lat,
          lng
        })
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      console.log('Ubicación actualizada en servidor');
    } catch (error) {
      console.error('Error actualizando ubicación:', error);
    }
  };

  // Crear marcador del usuario
  const createUserMarker = (location) => {
    if (!map || !isGoogleMapsLoaded()) {
      console.log('Mapa no disponible para crear marcador');
      return;
    }

    try {
      // Eliminar marcador anterior si existe
      if (userMarker) {
        userMarker.setMap(null);
      }

      const marker = new window.google.maps.Marker({
        position: location,
        map: map,
        title: 'Tu ubicación',
        icon: {
          url: `data:image/svg+xml;base64,${btoa(`
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="15" cy="15" r="12" fill="${colors.primary}" stroke="white" stroke-width="2"/>
              <circle cx="15" cy="15" r="6" fill="white"/>
              <circle cx="15" cy="15" r="3" fill="${colors.primary}"/>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(30, 30),
          anchor: new window.google.maps.Point(15, 15)
        },
        animation: window.google.maps.Animation.BOUNCE
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="modern-info-window">
            <div class="info-header" style="background: ${colors.primary}">
              <h6>📍 Tu ubicación</h6>
            </div>
            <div class="info-content">
              <p><strong>Lat:</strong> ${location.lat.toFixed(4)}</p>
              <p><strong>Lng:</strong> ${location.lng.toFixed(4)}</p>
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      setUserMarker(marker);
      
      // Centrar mapa en la ubicación del usuario
      map.setCenter(location);
      map.setZoom(14);
      
      console.log('Marcador de usuario creado');
    } catch (err) {
      console.error('Error creando marcador de usuario:', err);
    }
  };

  // Actualizar marcadores de domiciliarios
  const updateDomiciliarioMarkers = (domiciliariosList) => {
    if (!map || !isGoogleMapsLoaded()) {
      console.log('Mapa no disponible para actualizar marcadores');
      return;
    }

    try {
      // Limpiar marcadores anteriores
      domiciliarioMarkers.forEach(marker => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });

      const newMarkers = domiciliariosList
        .filter(domiciliario => domiciliario.ubicacionActual?.lat && domiciliario.ubicacionActual?.lng)
        .map(domiciliario => {
          try {
            const iconSvg = getVehicleIcon(domiciliario.tipoVehiculo);
            
            const marker = new window.google.maps.Marker({
              position: {
                lat: domiciliario.ubicacionActual.lat,
                lng: domiciliario.ubicacionActual.lng
              },
              map: map,
              title: `${domiciliario.nombre} - ${domiciliario.placaVehiculo}`,
              icon: {
                url: `data:image/svg+xml;base64,${btoa(iconSvg)}`,
                scaledSize: new window.google.maps.Size(28, 28),
                anchor: new window.google.maps.Point(14, 14)
              }
            });

            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div class="modern-info-window">
                  <div class="info-header" style="background: ${getVehicleColor(domiciliario.tipoVehiculo)}">
                    <h6>${getVehicleEmoji(domiciliario.tipoVehiculo)} ${domiciliario.nombre}</h6>
                  </div>
                  <div class="info-content">
                    <p><strong>Placa:</strong> ${domiciliario.placaVehiculo}</p>
                    <p><strong>Vehículo:</strong> ${domiciliario.tipoVehiculo}</p>
                    <p><strong>Estado:</strong> ${domiciliario.disponible ? '🟢 Disponible' : '🔴 Ocupado'}</p>
                    <p><strong>Tel:</strong> ${domiciliario.telefono}</p>
                  </div>
                </div>
              `
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });

            return marker;
          } catch (err) {
            console.error('Error creando marcador para domiciliario:', domiciliario._id, err);
            return null;
          }
        })
        .filter(marker => marker !== null);

      setDomiciliarioMarkers(newMarkers);
      console.log(`${newMarkers.length} marcadores de domiciliarios creados`);
    } catch (err) {
      console.error('Error actualizando marcadores de domiciliarios:', err);
    }
  };

  // Colores para diferentes tipos de vehículos
  const getVehicleColor = (tipoVehiculo) => {
    const vehicleColors = {
      moto: colors.secondary,
      bicicleta: colors.accent,
      carro: colors.primary,
      caminando: '#6c757d'
    };
    return vehicleColors[tipoVehiculo] || colors.primary;
  };

  // Iconos para diferentes tipos de vehículos
  const getVehicleIcon = (tipoVehiculo) => {
    const color = getVehicleColor(tipoVehiculo);
    const letter = getVehicleLetter(tipoVehiculo);

    return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="13" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="14" cy="14" r="10" fill="white" opacity="0.9"/>
      <text x="14" y="18" text-anchor="middle" fill="${color}" font-size="12" font-weight="bold">${letter}</text>
    </svg>`;
  };

  const getVehicleLetter = (tipoVehiculo) => {
    const letters = {
      moto: 'M',
      bicicleta: 'B',
      carro: 'C',
      caminando: 'W'
    };
    return letters[tipoVehiculo] || 'D';
  };

  const getVehicleEmoji = (tipoVehiculo) => {
    const emojis = {
      moto: '🏍️',
      bicicleta: '🚲',
      carro: '🚗',
      caminando: '🚶'
    };
    return emojis[tipoVehiculo] || '📍';
  };

  // Manejar actualización de ubicación
  const handleUpdateLocation = async () => {
    setError('');
    
    try {
      const location = await getUserLocation();
      
      if (map) {
        createUserMarker(location);
      }
      
      if (user && user.rol === 'domiciliario') {
        await updateDomiciliarioLocation(location.lat, location.lng);
      }
    } catch (err) {
      console.error('Error en handleUpdateLocation:', err);
    }
  };

  // Efectos
  useEffect(() => {
    if (API_KEY) {
      console.log('Iniciando carga de Google Maps...');
      loadGoogleMaps();
    } else {
      setError('API Key de Google Maps no configurada');
      setLoading(false);
    }

    // Cleanup
    return () => {
      if (scriptRef.current) {
        document.head.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, [API_KEY]);

  useEffect(() => {
    if (map && mapsLoaded) {
      console.log('Mapa listo, obteniendo domiciliarios...');
      getDomiciliarios();
      const interval = setInterval(getDomiciliarios, 30000);
      return () => clearInterval(interval);
    }
  }, [map, mapsLoaded]);

  useEffect(() => {
    if (userLocation && map && mapsLoaded) {
      createUserMarker(userLocation);
    }
  }, [userLocation, map, mapsLoaded]);

  if (!API_KEY) {
    return (
      <div className="modern-error-state">
        <div className="error-icon">❌</div>
        <h3>Error de configuración</h3>
        <p>
          La clave de Google Maps no está configurada. 
          Agrega <code>REACT_APP_GOOGLE_MAPS_API_KEY</code> a tu archivo <code>.env</code>
        </p>
        <small>
          Ejemplo: REACT_APP_GOOGLE_MAPS_API_KEY=tu_clave_aqui
        </small>
      </div>
    );
  }

  return (
    <div className="modern-map-container">
      <div className="modern-card">
        <div className="modern-card-header" style={{ background: colors.primary }}>
          <div className="header-content">
            <h3> Mapa de Domiciliarios</h3>
          </div>
          <button 
            className="modern-btn secondary"
            onClick={handleUpdateLocation}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Obteniendo...
              </>
            ) : (
              '📍 Actualizar mi ubicación'
            )}
          </button>
        </div>
        
        <div className="modern-card-body">
          {error && (
            <div className="modern-alert warning">
              <div className="alert-content">
                <span>{error}</span>
              </div>
              <button 
                className="modern-btn outline small"
                onClick={() => window.location.reload()}
              >
                Reintentar
              </button>
            </div>
          )}
          
          {loading && !mapsLoaded && (
            <div className="modern-loading">
              <div className="loading-content">
                <div className="loading-spinner large"></div>
                <p>Cargando mapa...</p>
              </div>
            </div>
          )}
          
          <div 
            ref={mapRef} 
            className="modern-map"
            style={{ 
              height: '450px', 
              width: '100%',
              minHeight: '450px',
              backgroundColor: colors.lightGray
            }}
          />
          
          <div className="map-footer">
            <div className="legend-grid">
              <div className="legend-item">
                <span className="legend-marker user"></span>
                <small>Tu ubicación</small>
              </div>
              <div className="legend-item">
                <span className="legend-marker moto"></span>
                <small>Moto</small>
              </div>
              <div className="legend-item">
                <span className="legend-marker bicicleta"></span>
                <small>Bicicleta</small>
              </div>
              <div className="legend-item">
                <span className="legend-marker carro"></span>
                <small>Carro</small>
              </div>
            </div>
            
            <div className="map-stats">
              <small>
                <strong>{domiciliarios.length}</strong> domiciliarios disponibles • 
                {userLocation ? ' 📍 Ubicación activa' : ' ❌ Sin ubicación'}
              </small>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modern-map-container {
          margin-bottom: 2rem;
        }

        .modern-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .modern-card-header {
          padding: 1.5rem;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-content h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .header-content p {
          margin: 0.25rem 0 0 0;
          opacity: 0.9;
          font-size: 0.9rem;
        }

        .modern-card-body {
          padding: 0;
        }

        .modern-map {
          border-radius: 0 0 16px 16px;
        }

        .map-footer {
          padding: 1.25rem;
          border-top: 1px solid ${colors.lightGray};
          background: white;
        }

        .legend-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .legend-marker {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .legend-marker.user {
          background: ${colors.primary};
        }

        .legend-marker.moto {
          background: ${colors.secondary};
        }

        .legend-marker.bicicleta {
          background: ${colors.accent};
        }

        .legend-marker.carro {
          background: ${colors.primary};
        }

        .map-stats {
          text-align: center;
          padding-top: 0.5rem;
          border-top: 1px solid ${colors.lightGray};
        }

        .modern-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .modern-btn.secondary {
          background: ${colors.secondary};
          color: ${colors.black};
        }

        .modern-btn.secondary:hover:not(:disabled) {
          background: #e6b400;
          transform: translateY(-2px);
        }

        .modern-btn.outline {
          background: transparent;
          border: 2px solid ${colors.primary};
          color: ${colors.primary};
        }

        .modern-btn.small {
          padding: 0.5rem 1rem;
          font-size: 0.8rem;
        }

        .modern-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .modern-alert {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          margin: 1rem;
          border-radius: 12px;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
        }

        .modern-alert.warning {
          background: #fff3cd;
          border-color: #ffeaa7;
        }

        .modern-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 3rem;
        }

        .loading-content {
          text-align: center;
        }

        .loading-spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid ${colors.lightGray};
          border-top: 3px solid ${colors.primary};
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        .loading-spinner.large {
          width: 3rem;
          height: 3rem;
        }

        .modern-error-state {
          text-align: center;
          padding: 3rem 2rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .error-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .modern-card-header {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
          }

          .header-content {
            margin-bottom: 1rem;
          }

          .legend-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default GoogleMap;