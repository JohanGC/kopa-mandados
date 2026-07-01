import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, API_URL } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    if (!currentUser || currentUser.rol !== 'domiciliario') {
      alert('Solo los domiciliarios pueden aceptar mandados');
      return;
    }

    try {
      await axios.put(`${API_URL}/orders/${orderId}/accept`);
      // Recargar los mandados
      fetchOrders();
    } catch (error) {
      console.error('Error aceptando mandado:', error);
      alert('Error al aceptar el mandado');
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
        <h1>Mandados Disponibles</h1>
        <Link to="/create-order" className="btn btn-primary">
          🛵 Solicitar Mandado
        </Link>
      </div>

      <div className="row">
  {orders.map((order, index) => (
    <div key={order._id} className="col-xl-6 col-md-12 mb-4">
      <div className="card h-100 order-card modern-card">
        {/* Header con categoría y estado */}
        <div className="card-header-custom position-relative">
          <div className="d-flex justify-content-between align-items-start">
            <div className="category-badge">
              <span className="badge category-pill bg-primary bg-opacity-10 text-primary">
                <i className="bi bi-cart3 me-2"></i>
                {order.categoria}
              </span>
            </div>
            <div className="status-indicator">
              <span className={`status-badge ${
                order.estado === 'pendiente' ? 'status-pending' :
                order.estado === 'aceptado' ? 'status-accepted' :
                order.estado === 'completado' ? 'status-completed' : 'status-other'
              }`}>
                <i className={`bi ${
                  order.estado === 'pendiente' ? 'bi-clock' :
                  order.estado === 'aceptado' ? 'bi-check-circle' :
                  order.estado === 'completado' ? 'bi-check-circle-fill' : 'bi-dash-circle'
                } me-1`}></i>
                {order.estado?.charAt(0).toUpperCase() + order.estado?.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="card-body d-flex flex-column">
          {/* Información principal */}
          <div className="mb-4">
            <h5 className="card-title fw-bold text-dark mb-3">Mandado - {order.categoria}</h5>
            <p className="card-text description-text text-muted">
              {order.descripcion}
            </p>
          </div>

          {/* Ruta del mandado */}
          <div className="route-section mb-4">
            <div className="route-step mb-3">
              <div className="step-icon bg-success bg-opacity-10 text-success rounded-circle d-inline-flex align-items-center justify-content-center me-3">
                <i className="bi bi-geo-alt-fill"></i>
              </div>
              <div className="step-content">
                <small className="text-muted fw-semibold d-block">Recoger en</small>
                <span className="text-dark">{order.ubicacionRecogida}</span>
              </div>
            </div>
            
            <div className="route-connector ms-3 ps-4 border-start border-2 border-success">
              <i className="bi bi-arrow-down text-success"></i>
            </div>

            <div className="route-step mt-2">
              <div className="step-icon bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center me-3">
                <i className="bi bi-house-door-fill"></i>
              </div>
              <div className="step-content">
                <small className="text-muted fw-semibold d-block">Entregar en</small>
                <span className="text-dark">{order.ubicacionEntrega}</span>
              </div>
            </div>
          </div>

          {/* Información adicional en grid */}
          <div className="order-info-grid mb-4">
            <div className="info-item">
              <div className="d-flex align-items-center">
                <i className="bi bi-currency-dollar text-warning me-2"></i>
                <div>
                  <small className="text-muted d-block">Precio ofertado</small>
                  <strong className="text-dark h5">${order.precioOfertado?.toLocaleString()}</strong>
                </div>
              </div>
            </div>
            
            {order.fechaLimite && (
              <div className="info-item">
                <div className="d-flex align-items-center">
                  <i className="bi bi-calendar-x text-danger me-2"></i>
                  <div>
                    <small className="text-muted d-block">Fecha límite</small>
                    <strong className="text-dark">{new Date(order.fechaLimite).toLocaleDateString()}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Información del solicitante */}
          {order.solicitante && (
            <div className="requester-info mb-3 p-3 bg-light rounded">
              <div className="d-flex align-items-center">
                <div className="requester-avatar bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center me-3">
                  <i className="bi bi-person-fill"></i>
                </div>
                <div>
                  <small className="text-muted d-block">Solicitante</small>
                  <strong className="text-dark">{order.solicitante.nombre}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="card-footer-custom bg-transparent border-top-0 pt-0">
          <div className="action-buttons">
            {currentUser?.rol === 'domiciliario' && order.estado === 'pendiente' && (
              <button 
                className="btn btn-success w-100 fw-semibold py-2 accept-btn mb-2"
                onClick={() => handleAcceptOrder(order._id)}
              >
                <i className="bi bi-check-lg me-2"></i>
                Aceptar Mandado
              </button>
            )}
            
            {order.estado !== 'pendiente' && (
              <button className="btn btn-outline-secondary w-100 py-2 status-disabled mb-2" disabled>
                <i className={`bi ${
                  order.estado === 'aceptado' ? 'bi-hourglass-split' : 'bi-check-all'
                } me-2`}></i>
                {order.estado === 'aceptado' ? 'Mandado en Progreso' : 'Completado'}
              </button>
            )}
            
            <Link 
              to={`/order/${order._id}`} 
              className="btn btn-outline-primary w-100 fw-semibold py-2 details-btn"
            >
              <i className="bi bi-eye me-2"></i>
              Ver Detalles Completos
            </Link>
          </div>
        </div>
      </div>
    </div>
  ))}
</div>

      {orders.length === 0 && (
        <div className="text-center py-5">
          <h3>No hay mandados disponibles en este momento</h3>
          <p>Vuelve pronto para ver nuevos mandados</p>
        </div>
      )}
    </div>
  );
};

export default Orders;