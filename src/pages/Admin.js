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
    totalOrders: 0,
    pendingOffers: 0,
    pendingActivities: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser && currentUser.rol === 'administrador') {
      fetchStats();
    }
  }, [currentUser]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const headers = {
        Authorization: `Bearer ${token}`
      };

      console.log('📊 Obteniendo estadísticas del dashboard...');

      // ✅ CORREGIDO: Usar Promise.allSettled para manejar errores individuales
      const [usersResponse, offersResponse, activitiesResponse, ordersResponse] = await Promise.allSettled([
        axios.get(`${API_URL}/users`, { headers }),
        axios.get(`${API_URL}/offers`, { headers }),
        axios.get(`${API_URL}/activities`, { headers }),
        axios.get(`${API_URL}/orders`, { headers })
      ]);

      // ✅ CORREGIDO: Manejar cada respuesta individualmente
      const newStats = {
        totalUsers: 0,
        totalOffers: 0,
        totalActivities: 0,
        totalOrders: 0,
        pendingOffers: 0,
        pendingActivities: 0
      };

      // Procesar respuesta de usuarios
      if (usersResponse.status === 'fulfilled') {
        newStats.totalUsers = usersResponse.value.data?.length || 0;
      } else {
        console.error('❌ Error cargando usuarios:', usersResponse.reason);
      }

      // Procesar respuesta de ofertas
      if (offersResponse.status === 'fulfilled') {
        const offers = offersResponse.value.data || [];
        newStats.totalOffers = offers.length;
        newStats.pendingOffers = offers.filter(offer => offer.estado === 'pendiente').length;
      } else {
        console.error('❌ Error cargando ofertas:', offersResponse.reason);
      }

      // Procesar respuesta de actividades
      if (activitiesResponse.status === 'fulfilled') {
        const activities = activitiesResponse.value.data || [];
        newStats.totalActivities = activities.length;
        newStats.pendingActivities = activities.filter(activity => activity.estado === 'pendiente').length;
      } else {
        console.error('❌ Error cargando actividades:', activitiesResponse.reason);
      }

      // Procesar respuesta de mandados
      if (ordersResponse.status === 'fulfilled') {
        newStats.totalOrders = ordersResponse.value.data?.length || 0;
      } else {
        console.error('❌ Error cargando mandados:', ordersResponse.reason);
      }

      setStats(newStats);
      
      console.log('✅ Estadísticas cargadas:', newStats);

    } catch (error) {
      console.error('❌ Error general cargando estadísticas:', error);
      addNotification('Error al cargar estadísticas del dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStats = () => {
    setLoading(true);
    fetchStats();
  };

  // Solo administradores pueden acceder
  if (!currentUser || currentUser.rol !== 'administrador') {
    addNotification('Acceso denegado. Se requiere rol de administrador.', 'warning');
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando panel de administración...</span>
          </div>
          <p className="mt-2 text-muted">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3 col-lg-2">
          <div className="card shadow sticky-top" style={{top: '20px'}}>
            <div className="card-header bg-dark text-white text-center">
              <h5 className="mb-0">👑 Panel Admin</h5>
              <small className="text-light">Bienvenido, {currentUser.nombre}</small>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <span className="me-2">📊</span>
                  Dashboard
                </button>
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${activeTab === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveTab('users')}
                >
                  <span className="me-2">👥</span>
                  Usuarios
                  {stats.totalUsers > 0 && (
                    <span className="badge bg-primary ms-auto">{stats.totalUsers}</span>
                  )}
                </button>
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${activeTab === 'offers' ? 'active' : ''}`}
                  onClick={() => setActiveTab('offers')}
                >
                  <span className="me-2">🏷️</span>
                  Ofertas
                  {stats.pendingOffers > 0 && (
                    <span className="badge bg-warning ms-auto">{stats.pendingOffers}</span>
                  )}
                </button>
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${activeTab === 'activities' ? 'active' : ''}`}
                  onClick={() => setActiveTab('activities')}
                >
                  <span className="me-2">🎯</span>
                  Actividades
                  {stats.pendingActivities > 0 && (
                    <span className="badge bg-warning ms-auto">{stats.pendingActivities}</span>
                  )}
                </button>
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${activeTab === 'orders' ? 'active' : ''}`}
                  onClick={() => setActiveTab('orders')}
                >
                  <span className="me-2">🛵</span>
                  Mandados
                  {stats.totalOrders > 0 && (
                    <span className="badge bg-info ms-auto">{stats.totalOrders}</span>
                  )}
                </button>
              </div>
            </div>
            <div className="card-footer bg-light">
              <button 
                className="btn btn-sm btn-outline-primary w-100"
                onClick={handleRefreshStats}
                disabled={loading}
              >
                🔄 Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9 col-lg-10">
          <div className="mb-3">
            <h2 className="text-primary">
              {activeTab === 'dashboard' && '📊 Dashboard'}
              {activeTab === 'users' && '👥 Gestión de Usuarios'}
              {activeTab === 'offers' && '🏷️ Gestión de Ofertas'}
              {activeTab === 'activities' && '🎯 Gestión de Actividades'}
              {activeTab === 'orders' && '🛵 Gestión de Mandados'}
            </h2>
            <p className="text-muted">
              {activeTab === 'dashboard' && 'Resumen general del sistema'}
              {activeTab === 'users' && 'Administrar usuarios y permisos'}
              {activeTab === 'offers' && 'Gestionar ofertas y promociones'}
              {activeTab === 'activities' && 'Administrar actividades y eventos'}
              {activeTab === 'orders' && 'Supervisar mandados y entregas'}
            </p>
          </div>

          {activeTab === 'dashboard' && <AdminDashboard stats={stats} onRefresh={handleRefreshStats} />}
          {activeTab === 'users' && <UsersManagement />}
          {activeTab === 'offers' && <OffersManagement />}
          {activeTab === 'activities' && <ActivitiesManagement />}
          {activeTab === 'orders' && <OrdersManagement />}
        </div>
      </div>
    </div>
  );
};

// Componente del Dashboard Mejorado
const AdminDashboard = ({ stats, onRefresh }) => {
  return (
    <div className="card shadow">
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h4 className="mb-0">📊 Resumen del Sistema</h4>
        <button 
          className="btn btn-light btn-sm"
          onClick={onRefresh}
          title="Actualizar estadísticas"
        >
          🔄 Actualizar
        </button>
      </div>
      <div className="card-body">
        {/* Tarjetas de Estadísticas */}
        <div className="row">
          <div className="col-xl-2 col-md-4 col-sm-6 mb-4">
            <div className="card border-info">
              <div className="card-body text-center">
                <div className="text-info mb-2">
                  <i className="fs-1">👥</i>
                </div>
                <h3 className="card-title text-info">{stats.totalUsers}</h3>
                <p className="card-text text-muted">Usuarios Totales</p>
              </div>
            </div>
          </div>
          
          <div className="col-xl-2 col-md-4 col-sm-6 mb-4">
            <div className="card border-success">
              <div className="card-body text-center">
                <div className="text-success mb-2">
                  <i className="fs-1">🏷️</i>
                </div>
                <h3 className="card-title text-success">{stats.totalOffers}</h3>
                <p className="card-text text-muted">Ofertas Totales</p>
                {stats.pendingOffers > 0 && (
                  <small className="text-warning">
                    <strong>{stats.pendingOffers} pendientes</strong>
                  </small>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-xl-2 col-md-4 col-sm-6 mb-4">
            <div className="card border-warning">
              <div className="card-body text-center">
                <div className="text-warning mb-2">
                  <i className="fs-1">🎯</i>
                </div>
                <h3 className="card-title text-warning">{stats.totalActivities}</h3>
                <p className="card-text text-muted">Actividades Totales</p>
                {stats.pendingActivities > 0 && (
                  <small className="text-warning">
                    <strong>{stats.pendingActivities} pendientes</strong>
                  </small>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-xl-2 col-md-4 col-sm-6 mb-4">
            <div className="card border-secondary">
              <div className="card-body text-center">
                <div className="text-secondary mb-2">
                  <i className="fs-1">🛵</i>
                </div>
                <h3 className="card-title text-secondary">{stats.totalOrders}</h3>
                <p className="card-text text-muted">Mandados Totales</p>
              </div>
            </div>
          </div>
          
          <div className="col-xl-2 col-md-4 col-sm-6 mb-4">
            <div className="card border-danger">
              <div className="card-body text-center">
                <div className="text-danger mb-2">
                  <i className="fs-1">⏳</i>
                </div>
                <h3 className="card-title text-danger">{stats.pendingOffers + stats.pendingActivities}</h3>
                <p className="card-text text-muted">Pendientes de Revisión</p>
              </div>
            </div>
          </div>
          
          <div className="col-xl-2 col-md-4 col-sm-6 mb-4">
            <div className="card border-primary">
              <div className="card-body text-center">
                <div className="text-primary mb-2">
                  <i className="fs-1">📈</i>
                </div>
                <h3 className="card-title text-primary">
                  {stats.totalUsers + stats.totalOffers + stats.totalActivities + stats.totalOrders}
                </h3>
                <p className="card-text text-muted">Total Elementos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Secciones de Acciones Rápidas y Estadísticas */}
        <div className="row mt-4">
          <div className="col-lg-6 mb-4">
            <div className="card h-100">
              <div className="card-header bg-light">
                <h6 className="mb-0">⚡ Acciones Rápidas</h6>
              </div>
              <div className="card-body">
                <div className="row g-2">
                  <div className="col-md-6">
                    <button className="btn btn-outline-primary w-100 mb-2">
                      👤 Crear Usuario
                    </button>
                  </div>
                  <div className="col-md-6">
                    <button className="btn btn-outline-success w-100 mb-2">
                      🏷️ Revisar Ofertas
                    </button>
                  </div>
                  <div className="col-md-6">
                    <button className="btn btn-outline-warning w-100 mb-2">
                      🎯 Aprobar Actividades
                    </button>
                  </div>
                  <div className="col-md-6">
                    <button className="btn btn-outline-info w-100 mb-2">
                      📊 Ver Reportes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-lg-6 mb-4">
            <div className="card h-100">
              <div className="card-header bg-light">
                <h6 className="mb-0">📈 Resumen de Actividad</h6>
              </div>
              <div className="card-body">
                <div className="list-group list-group-flush">
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <span>👥 Usuarios registrados</span>
                    <span className="badge bg-primary rounded-pill">{stats.totalUsers}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <span>🏷️ Ofertas pendientes</span>
                    <span className="badge bg-warning rounded-pill">{stats.pendingOffers}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <span>🎯 Actividades pendientes</span>
                    <span className="badge bg-warning rounded-pill">{stats.pendingActivities}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <span>🛵 Mandados totales</span>
                    <span className="badge bg-info rounded-pill">{stats.totalOrders}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje de bienvenida */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card bg-light">
              <div className="card-body text-center">
                <h5 className="card-title text-primary">¡Bienvenido al Panel de Administración!</h5>
                <p className="card-text">
                  Desde aquí puedes gestionar todos los aspectos de la plataforma KopaMandados.
                  Utiliza el menú lateral para navegar entre las diferentes secciones de administración.
                </p>
                <div className="mt-3">
                  <span className="badge bg-success me-2">Seguro</span>
                  <span className="badge bg-info me-2">En Tiempo Real</span>
                  <span className="badge bg-warning">Administrativo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;