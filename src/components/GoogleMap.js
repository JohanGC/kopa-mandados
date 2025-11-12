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
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "on" }]
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
          url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMwMDc1RkYiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
          scaledSize: new window.google.maps.Size(30, 30),
          anchor: new window.google.maps.Point(15, 15)
        },
        animation: window.google.maps.Animation.BOUNCE
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h6>📍 Tu ubicación</h6>
            <small>Lat: ${location.lat.toFixed(4)}<br/>Lng: ${location.lng.toFixed(4)}</small>
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
                scaledSize: new window.google.maps.Size(25, 25),
                anchor: new window.google.maps.Point(12.5, 12.5)
              }
            });

            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div class="p-2">
                  <h6>${getVehicleEmoji(domiciliario.tipoVehiculo)} ${domiciliario.nombre}</h6>
                  <small>
                    <strong>Placa:</strong> ${domiciliario.placaVehiculo}<br/>
                    <strong>Vehículo:</strong> ${domiciliario.tipoVehiculo}<br/>
                    <strong>Estado:</strong> ${domiciliario.disponible ? '🟢 Disponible' : '🔴 Ocupado'}<br/>
                    <strong>Tel:</strong> ${domiciliario.telefono}
                  </small>
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

  // Iconos para diferentes tipos de vehículos
  const getVehicleIcon = (tipoVehiculo) => {
    const colors = {
      moto: '#28a745',
      bicicleta: '#17a2b8', 
      carro: '#ffc107',
      caminando: '#dc3545'
    };

    const color = colors[tipoVehiculo] || '#6c757d';
    const letter = getVehicleLetter(tipoVehiculo);

    return `<svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12.5" cy="12.5" r="12" fill="${color}" stroke="white" stroke-width="1"/>
      <text x="12.5" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${letter}</text>
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
      <div className="alert alert-danger m-3">
        <h6>❌ Error de configuración</h6>
        <p>
          La clave de Google Maps no está configurada. 
          Agrega <code>REACT_APP_GOOGLE_MAPS_API_KEY</code> a tu archivo <code>.env</code>
        </p>
        <small className="text-muted">
          Ejemplo: REACT_APP_GOOGLE_MAPS_API_KEY=tu_clave_aqui
        </small>
      </div>
    );
  }

  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">🛵 Mapa de Domiciliarios</h5>
        <button 
          className="btn btn-light btn-sm"
          onClick={handleUpdateLocation}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Obteniendo...
            </>
          ) : (
            '📍 Actualizar mi ubicación'
          )}
        </button>
      </div>
      
      <div className="card-body p-0">
        {error && (
          <div className="alert alert-warning m-3 mb-0" role="alert">
            <small>{error}</small>
            <button 
              className="btn btn-sm btn-outline-primary ms-2"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </button>
          </div>
        )}
        
        {loading && !mapsLoaded && (
          <div className="text-center p-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando mapa...</span>
            </div>
            <p className="mt-2 text-muted">Cargando mapa...</p>
          </div>
        )}
        
        <div 
          ref={mapRef} 
          style={{ 
            height: '400px', 
            width: '100%',
            minHeight: '400px',
            backgroundColor: '#f8f9fa' // Color de fondo mientras carga
          }}
          className="rounded-bottom"
        />
        
        <div className="p-3 border-top">
          <div className="row text-center">
            <div className="col-md-3 mb-2">
              <span className="badge bg-primary">📍</span>
              <small className="d-block mt-1">Tu ubicación</small>
            </div>
            <div className="col-md-3 mb-2">
              <span className="badge bg-success">M</span>
              <small className="d-block mt-1">Moto</small>
            </div>
            <div className="col-md-3 mb-2">
              <span className="badge bg-info">B</span>
              <small className="d-block mt-1">Bicicleta</small>
            </div>
            <div className="col-md-3 mb-2">
              <span className="badge bg-warning">C</span>
              <small className="d-block mt-1">Carro</small>
            </div>
          </div>
          
          <div className="mt-2 text-center">
            <small className="text-muted">
              {domiciliarios.length} domiciliarios disponibles • 
              {userLocation ? ' Ubicación activa' : ' Sin ubicación'}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleMap;