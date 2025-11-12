// components/MapaMandadosCercanos.js
import React, { useEffect, useRef, useState } from 'react';

const MapaMandadosCercanos = ({ mandados, onAceptar, disponible }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // Cargar Google Maps
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      script.onload = initMap;
    } else {
      initMap();
    }
  }, []);

  const initMap = () => {
    if (!mapRef.current) return;

    // Obtener ubicación del usuario
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userLoc);
          createMap(userLoc);
        },
        () => {
          // Ubicación por defecto si no se puede obtener
          const defaultLoc = { lat: 4.6097, lng: -74.0817 };
          setUserLocation(defaultLoc);
          createMap(defaultLoc);
        }
      );
    }
  };

  const createMap = (center) => {
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: 13,
      center: center,
      mapTypeControl: true,
      streetViewControl: true
    });

    setMap(mapInstance);
    addUserMarker(mapInstance, center);
    addMandadosMarkers(mapInstance);
  };

  const addUserMarker = (mapInstance, location) => {
    new window.google.maps.Marker({
      position: location,
      map: mapInstance,
      title: 'Tu ubicación',
      icon: {
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMwMDc1RkYiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
        scaledSize: new window.google.maps.Size(30, 30)
      }
    });
  };

  const addMandadosMarkers = (mapInstance) => {
    const newMarkers = mandados.map(mandado => {
      // Usar ubicación aleatoria cerca del usuario para demo
      const lat = userLocation.lat + (Math.random() - 0.5) * 0.02;
      const lng = userLocation.lng + (Math.random() - 0.5) * 0.02;

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstance,
        title: `Mandado: ${mandado.descripcion}`,
        icon: {
          url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIHZpZXdCb3g9IjAgMCAyNSAyNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIuNSIgY3k9IjEyLjUiIHI9IjEyIiBmaWxsPSIjMjhhNzQ1Ii8+Cjx0ZXh0IHg9IjEyLjUiIHk9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiPkQ8L3RleHQ+Cjwvc3ZnPg==',
          scaledSize: new window.google.maps.Size(25, 25)
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="min-width: 200px;">
            <h6>📦 Mandado Disponible</h6>
            <p><strong>${mandado.descripcion}</strong></p>
            <p>💰 $${mandado.precioOfertado.toLocaleString()}</p>
            <p>📍 ${mandado.ubicacionRecogida}</p>
            ${disponible ? 
              `<button onclick="window.acceptOrder('${mandado._id}')" 
                style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                ✅ Aceptar
              </button>` : 
              '<p style="color: orange;">⏸️ Activa tu disponibilidad</p>'
            }
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstance, marker);
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Función global para aceptar mandados desde el mapa
    window.acceptOrder = (orderId) => {
      onAceptar(orderId);
    };
  };

  useEffect(() => {
    return () => {
      // Limpiar función global
      delete window.acceptOrder;
    };
  }, []);

  if (!process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="alert alert-warning">
        <h6>⚠️ Mapa no disponible</h6>
        <p>Configura REACT_APP_GOOGLE_MAPS_API_KEY para ver el mapa</p>
      </div>
    );
  }

  return (
    <div>
      <div 
        ref={mapRef} 
        style={{ height: '500px', width: '100%', borderRadius: '8px' }}
      />
      <div className="mt-3">
        <small className="text-muted">
          💡 Haz clic en los marcadores verdes para ver detalles y aceptar mandados
        </small>
      </div>
    </div>
  );
};

export default MapaMandadosCercanos;