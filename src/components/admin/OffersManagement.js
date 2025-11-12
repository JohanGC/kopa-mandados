// OffersManagement.js - VERSIÓN COMPLETA CORREGIDA
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import axios from 'axios';

const OffersManagement = () => {
  const { API_URL } = useAuth();
  const { addNotification } = useNotification();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/offers`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setOffers(response.data);
    } catch (error) {
      console.error('Error fetching offers:', error);
      addNotification('Error al cargar ofertas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (offerId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/offers/${offerId}`, 
        { estado: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      addNotification(`Oferta ${newStatus === 'aprobada' ? 'aprobada' : 'rechazada'}`, 'success');
      fetchOffers();
    } catch (error) {
      console.error('Error updating offer status:', error);
      addNotification('Error al actualizar oferta', 'error');
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta oferta?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/offers/${offerId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        addNotification('Oferta eliminada exitosamente', 'success');
        fetchOffers();
      } catch (error) {
        console.error('Error deleting offer:', error);
        addNotification('Error al eliminar oferta', 'error');
      }
    }
  };

  const getStatusBadge = (estado) => {
    const statuses = {
      pendiente: 'warning',
      aprobada: 'success',
      rechazada: 'danger'
    };
    return `badge bg-${statuses[estado]}`;
  };

  const filteredOffers = offers.filter(offer => {
    if (filter === 'all') return true;
    return offer.estado === filter;
  });

  if (loading) {
    return (
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow">
      <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
        <h4 className="mb-0">🏷️ Gestión de Ofertas</h4>
        <div>
          <select
            className="form-select form-select-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todas las ofertas</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
          </select>
        </div>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Título</th>
                <th>Creador</th>
                <th>Precio</th>
                <th>Descuento</th>
                <th>Fechas</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOffers.map(offer => (
                <tr key={offer._id}>
                  <td>
                    <strong>{offer.titulo}</strong>
                    <br />
                    <small className="text-muted">{offer.categoria}</small>
                  </td>
                  <td>
                    {offer.creador?.nombre || 'N/A'}
                    <br />
                    <small className="text-muted">{offer.creador?.empresa}</small>
                  </td>
                  <td>
                    <div>
                      <del>${offer.precioOriginal?.toLocaleString()}</del>
                      <br />
                      <strong className="text-success">${offer.precioDescuento?.toLocaleString()}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-info">{offer.descuento}%</span>
                  </td>
                  <td>
                    <small>
                      Inicio: {new Date(offer.fechaInicio).toLocaleDateString()}
                      <br />
                      Fin: {new Date(offer.fechaFin).toLocaleDateString()}
                    </small>
                  </td>
                  <td>
                    <span className={getStatusBadge(offer.estado)}>
                      {offer.estado}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      {offer.estado === 'pendiente' && (
                        <>
                          <button
                            className="btn btn-outline-success"
                            onClick={() => handleStatusChange(offer._id, 'aprobada')}
                            title="Aprobar oferta"
                          >
                            ✅
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleStatusChange(offer._id, 'rechazada')}
                            title="Rechazar oferta"
                          >
                            ❌
                          </button>
                        </>
                      )}
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDeleteOffer(offer._id)}
                        title="Eliminar oferta"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOffers.length === 0 && (
          <div className="text-center py-4">
            <p className="text-muted">No hay ofertas {filter !== 'all' ? `con estado ${filter}` : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ EXPORT DEFAULT CORRECTO
export default OffersManagement;