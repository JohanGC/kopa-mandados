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
        {orders.map(order => (
          <div key={order._id} className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">Mandado - {order.categoria}</h5>
                <p className="card-text">{order.descripcion}</p>
                
                <div className="mb-2">
                  <strong>Recoger en:</strong> {order.ubicacionRecogida}
                </div>
                <div className="mb-2">
                  <strong>Entregar en:</strong> {order.ubicacionEntrega}
                </div>
                <div className="mb-2">
                  <strong>Precio ofertado:</strong> ${order.precioOfertado?.toLocaleString()}
                </div>
                <div className="mb-2">
                  <strong>Estado:</strong> 
                  <span className={`badge ${
                    order.estado === 'pendiente' ? 'bg-warning' :
                    order.estado === 'aceptado' ? 'bg-primary' :
                    order.estado === 'completado' ? 'bg-success' : 'bg-secondary'
                  } ms-2`}>
                    {order.estado}
                  </span>
                </div>
                {order.fechaLimite && (
                  <div className="mb-2">
                    <strong>Fecha límite:</strong> {new Date(order.fechaLimite).toLocaleString()}
                  </div>
                )}
                {order.solicitante && (
                  <div className="mb-2">
                    <strong>Solicitante:</strong> {order.solicitante.nombre}
                  </div>
                )}
              </div>
              <div className="card-footer">
                {currentUser?.rol === 'domiciliario' && order.estado === 'pendiente' && (
                  <button 
                    className="btn btn-success w-100"
                    onClick={() => handleAcceptOrder(order._id)}
                  >
                    Aceptar Mandado
                  </button>
                )}
                {order.estado !== 'pendiente' && (
                  <button className="btn btn-outline-secondary w-100" disabled>
                    {order.estado === 'aceptado' ? 'Mandado Aceptado' : 'Completado'}
                  </button>
                )}
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