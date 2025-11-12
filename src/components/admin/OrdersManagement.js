// OrdersManagement.js - VERSIÓN COMPLETA CORREGIDA
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import axios from 'axios';

const OrdersManagement = () => {
  const { API_URL } = useAuth();
  const { addNotification } = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      addNotification('Error al cargar mandados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/orders/${orderId}`, 
        { estado: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      addNotification(`Estado del mandado actualizado a ${newStatus}`, 'success');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      addNotification('Error al actualizar mandado', 'error');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este mandado?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        addNotification('Mandado eliminado exitosamente', 'success');
        fetchOrders();
      } catch (error) {
        console.error('Error deleting order:', error);
        addNotification('Error al eliminar mandado', 'error');
      }
    }
  };

  const getStatusBadge = (estado) => {
    const statuses = {
      pendiente: 'warning',
      aceptado: 'primary',
      en_proceso: 'info',
      completado: 'success',
      cancelado: 'danger'
    };
    return `badge bg-${statuses[estado]}`;
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.estado === filter;
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
      <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
        <h4 className="mb-0">🛵 Gestión de Mandados</h4>
        <div>
          <select
            className="form-select form-select-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todos los mandados</option>
            <option value="pendiente">Pendientes</option>
            <option value="aceptado">Aceptados</option>
            <option value="en_proceso">En proceso</option>
            <option value="completado">Completados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Solicitante</th>
                <th>Ejecutante</th>
                <th>Precio</th>
                <th>Ubicaciones</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order._id}>
                  <td>
                    <div>
                      <strong>{order.descripcion}</strong>
                      {order.notasAdicionales && (
                        <div>
                          <br />
                          <small className="text-muted">Notas: {order.notasAdicionales}</small>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark">{order.categoria}</span>
                  </td>
                  <td>
                    <div>
                      <div>{order.solicitante?.nombre || 'N/A'}</div>
                      <small className="text-muted">{order.solicitante?.telefono}</small>
                    </div>
                  </td>
                  <td>
                    {order.ejecutante?.nombre || 'Pendiente'}
                  </td>
                  <td>
                    <strong className="text-success">${order.precioOfertado?.toLocaleString()}</strong>
                  </td>
                  <td>
                    <div>
                      <div>
                        <small>
                          <strong>Recoger:</strong> {order.ubicacionRecogida}
                        </small>
                      </div>
                      <div>
                        <small>
                          <strong>Entregar:</strong> {order.ubicacionEntrega}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={getStatusBadge(order.estado)}>
                      {order.estado}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <select
                        className="form-select form-select-sm"
                        value={order.estado}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="aceptado">Aceptado</option>
                        <option value="en_proceso">En proceso</option>
                        <option value="completado">Completado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDeleteOrder(order._id)}
                        title="Eliminar mandado"
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

        {filteredOrders.length === 0 && (
          <div className="text-center py-4">
            <p className="text-muted">No hay mandados {filter !== 'all' ? `con estado ${filter}` : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ EXPORT DEFAULT CORRECTO
export default OrdersManagement;