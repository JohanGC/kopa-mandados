import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

// Importar componentes de gestión
import UsersManagement from '../components/admin/UsersManagement';
import OffersManagement from '../components/admin/OffersManagement';
import ActivitiesManagement from '../components/admin/ActivitiesManagement';
import OrdersManagement from '../components/admin/OrdersManagement';

const Admin = () => {
  const { currentUser, API_URL } = useAuth();
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOffers: 0,
    totalActivities: 0,
    totalOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser && currentUser.rol === 'administrador') {
      fetchStats();
    }
  }, [currentUser]);

  const fetchStats = async () => {
    try {
      // En una implementación real, estas serían llamadas a endpoints específicos
      const [usersResponse, offersResponse, activitiesResponse, ordersResponse] = await Promise.all([
        axios.get(`${API_URL}/users`),
        axios.get(`${API_URL}/offers`),
        axios.get(`${API_URL}/activities`),
        axios.get(`${API_URL}/orders`)
      ]);

      setStats({
        totalUsers: usersResponse.data.length,
        totalOffers: offersResponse.data.length,
        totalActivities: activitiesResponse.data.length,
        totalOrders: ordersResponse.data.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      addNotification('Error al cargar estadísticas', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Solo administradores pueden acceder
  if (!currentUser || currentUser.rol !== 'administrador') {
    return <Navigate to="/" replace />;
  }

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
    <div className="container-fluid mt-4">
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3">
          <div className="card shadow">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">👑 Panel de Administración</h5>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                <button
                  className={`list-group-item list-group-item-action ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  📊 Dashboard
                </button>
                <button
                  className={`list-group-item list-group-item-action ${activeTab === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveTab('users')}
                >
                  👥 Gestión de Usuarios
                </button>
                <button
                  className={`list-group-item list-group-item-action ${activeTab === 'offers' ? 'active' : ''}`}
                  onClick={() => setActiveTab('offers')}
                >
                  🏷️ Gestión de Ofertas
                </button>
                <button
                  className={`list-group-item list-group-item-action ${activeTab === 'activities' ? 'active' : ''}`}
                  onClick={() => setActiveTab('activities')}
                >
                  🎯 Gestión de Actividades
                </button>
                <button
                  className={`list-group-item list-group-item-action ${activeTab === 'orders' ? 'active' : ''}`}
                  onClick={() => setActiveTab('orders')}
                >
                  🛵 Gestión de Mandados
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9">
          {activeTab === 'dashboard' && <AdminDashboard stats={stats} />}
          {activeTab === 'users' && <UsersManagement />}
          {activeTab === 'offers' && <OffersManagement />}
          {activeTab === 'activities' && <ActivitiesManagement />}
          {activeTab === 'orders' && <OrdersManagement />}
        </div>
      </div>
    </div>
  );
};

// Componente del Dashboard
const AdminDashboard = ({ stats }) => {
  return (
    <div className="card shadow">
      <div className="card-header bg-primary text-white">
        <h4 className="mb-0">📊 Dashboard de Administración</h4>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-3 mb-4">
            <div className="card text-white bg-info">
              <div className="card-body">
                <h5 className="card-title">👥 Usuarios</h5>
                <h2 className="card-text">{stats.totalUsers}</h2>
                <p className="card-text">Total registrados</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-4">
            <div className="card text-white bg-success">
              <div className="card-body">
                <h5 className="card-title">🏷️ Ofertas</h5>
                <h2 className="card-text">{stats.totalOffers}</h2>
                <p className="card-text">En plataforma</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-4">
            <div className="card text-white bg-warning">
              <div className="card-body">
                <h5 className="card-title">🎯 Actividades</h5>
                <h2 className="card-text">{stats.totalActivities}</h2>
                <p className="card-text">Programadas</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-4">
            <div className="card text-white bg-secondary">
              <div className="card-body">
                <h5 className="card-title">🛵 Mandados</h5>
                <h2 className="card-text">{stats.totalOrders}</h2>
                <p className="card-text">Solicitados</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h6>⚡ Acciones Rápidas</h6>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <button className="btn btn-outline-primary">Crear Usuario</button>
                  <button className="btn btn-outline-success">Aprobar Ofertas</button>
                  <button className="btn btn-outline-warning">Ver Reportes</button>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h6>📈 Estadísticas Recientes</h6>
              </div>
              <div className="card-body">
                <p>📊 Usuarios nuevos esta semana: <strong>12</strong></p>
                <p>🆕 Ofertas pendientes: <strong>5</strong></p>
                <p>⏳ Mandados activos: <strong>8</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;