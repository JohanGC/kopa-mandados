import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, API_URL } = useAuth();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await axios.get(`${API_URL}/offers`);
      setOffers(response.data);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Ofertas Disponibles</h1>
        {currentUser && (currentUser.rol === 'oferente' || currentUser.rol === 'administrador') && (
          <Link to="/create-offer" className="btn btn-success">
            🏷️ Crear Nueva Oferta
          </Link>
        )}
      </div>

      <div className="row">
        {offers.map(offer => (
          <div key={offer._id} className="col-md-4 mb-4">
            <div className="card h-100">
              <div 
                className="card-img-top bg-secondary d-flex align-items-center justify-content-center text-white"
                style={{ height: '200px' }}
              >
                {offer.imagen ? (
                  <img 
                    src={offer.imagen} 
                    alt={offer.titulo}
                    className="img-fluid w-100 h-100"
                    style={{objectFit: 'cover'}}
                  />
                ) : (
                  <span>Imagen de oferta</span>
                )}
              </div>
              <div className="card-body">
                <h5 className="card-title">{offer.titulo}</h5>
                <p className="card-text">{offer.descripcion}</p>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted text-decoration-line-through">
                    ${offer.precioOriginal?.toLocaleString()}
                  </span>
                  <span className="h5 text-success">
                    ${offer.precioDescuento?.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2">
                  <small className="text-muted">
                    Descuento: {offer.descuento}% | 
                    Válido hasta: {new Date(offer.fechaFin).toLocaleDateString()}
                  </small>
                </div>
                {offer.creador && (
                  <div className="mt-2">
                    <small className="text-muted">
                      Por: {offer.creador.empresa || offer.creador.nombre}
                    </small>
                  </div>
                )}
              </div>
              <div className="card-footer">
                <Link to={`/offer/${offer._id}`} className="btn btn-primary w-100">
                  Ver Detalles
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {offers.length === 0 && (
        <div className="text-center py-5">
          <h3>No hay ofertas disponibles en este momento</h3>
          <p>Vuelve pronto para descubrir nuevas ofertas</p>
        </div>
      )}
    </div>
  );
};

export default Offers;