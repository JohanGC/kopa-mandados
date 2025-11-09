import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const LocationMap = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [domiciliarios, setDomiciliarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Obtener ubicación del usuario
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setError('La geolocalización no es soportada por este navegador');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
        
        // Si el usuario es domiciliario, actualizar su ubicación en la BD
        if (user && user.rol === 'domiciliario') {
          updateDomiciliarioLocation(position.coords.latitude, position.coords.longitude);
        }
      },
      (err) => {
        setError('No se pudo obtener la ubicación: ' + err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Actualizar ubicación del domiciliario en la BD
  const updateDomiciliarioLocation = async (lat, lng) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/users/location', {
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
    } catch (error) {
      console.error('Error actualizando ubicación:', error);
    }
  };

  // Obtener domiciliarios disponibles
  const getDomiciliarios = async () => {
    try {
      const response = await fetch('/api/users/domiciliarios');
      const data = await response.json();
      if (response.ok) {
        setDomiciliarios(data);
      }
    } catch (error) {
      console.error('Error obteniendo domiciliarios:', error);
    }
  };

  useEffect(() => {
    getDomiciliarios();
    
    // Actualizar domiciliarios cada 30 segundos
    const interval = setInterval(getDomiciliarios, 30000);
    return () => clearInterval(interval);
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (userLocation || domiciliarios.length > 0) {
      initMap();
    }
  }, [userLocation, domiciliarios]);

  const initMap = () => {
    // Aquí integrarías con Google Maps o Leaflet
    // Por ahora mostraremos una representación simple
    console.log('Inicializando mapa con:', { userLocation, domiciliarios });
  };

  const getVehicleIcon = (tipoVehiculo) => {
    switch (tipoVehiculo) {
      case 'moto': return '🏍️';
      case 'bicicleta': return '🚲';
      case 'carro': return '🚗';
      case 'caminando': return '🚶';
      default: return '📍';
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">🛵 Domiciliarios Disponibles</h5>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-warning" role="alert">
            {error}
          </div>
        )}
        
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="text-muted">
            {domiciliarios.length} domiciliarios disponibles
          </span>
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={getUserLocation}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Obteniendo ubicación...
              </>
            ) : (
              '📍 Actualizar mi ubicación'
            )}
          </button>
        </div>

        {/* Mapa simplificado - integrar con Google Maps/Leaflet después */}
        <div className="bg-light rounded p-4 text-center mb-3" style={{ height: '300px' }}>
          <div className="d-flex justify-content-center align-items-center h-100">
            <div>
              <h6>🗺️ Mapa de Ubicaciones</h6>
              <p className="text-muted mb-3">
                {userLocation 
                  ? 'Tu ubicación y domiciliarios disponibles se mostrarán aquí' 
                  : 'Activa tu ubicación para ver el mapa'
                }
              </p>
              
              {/* Indicador de ubicación del usuario */}
              {userLocation && (
                <div className="mb-2">
                  <span className="badge bg-primary">📍 Tu ubicación</span>
                  <small className="text-muted d-block">
                    Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)}
                  </small>
                </div>
              )}
              
              {/* Lista de domiciliarios */}
              {domiciliarios.map(domiciliario => (
                <div key={domiciliario._id} className="mb-2">
                  <span className="badge bg-success">
                    {getVehicleIcon(domiciliario.tipoVehiculo)} {domiciliario.nombre}
                  </span>
                  <small className="text-muted d-block">
                    {domiciliario.placaVehiculo} • {domiciliario.disponible ? '🟢 Disponible' : '🔴 Ocupado'}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="row text-center">
          <div className="col-md-3">
            <span className="badge bg-primary">📍</span>
            <small className="d-block">Tu ubicación</small>
          </div>
          <div className="col-md-3">
            <span className="badge bg-success">🏍️</span>
            <small className="d-block">Domiciliarios</small>
          </div>
          <div className="col-md-3">
            <span className="badge bg-warning">🟢</span>
            <small className="d-block">Disponible</small>
          </div>
          <div className="col-md-3">
            <span className="badge bg-danger">🔴</span>
            <small className="d-block">Ocupado</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationMap;