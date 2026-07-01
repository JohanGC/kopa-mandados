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

      const [usersResponse, offersResponse, activitiesResponse, ordersResponse] = await Promise.allSettled([
        axios.get(`${API_URL}/users`, { headers }),
        axios.get(`${API_URL}/offers`, { headers }),
        axios.get(`${API_URL}/activities`, { headers }),
        axios.get(`${API_URL}/orders`, { headers })
      ]);

      const newStats = {
        totalUsers: 0,
        totalOffers: 0,
        totalActivities: 0,
        totalOrders: 0,
        pendingOffers: 0,
        pendingActivities: 0
      };

      if (usersResponse.status === 'fulfilled') {
        newStats.totalUsers = usersResponse.value.data?.length || 0;
      }

      if (offersResponse.status === 'fulfilled') {
        const offers = offersResponse.value.data || [];
        newStats.totalOffers = offers.length;
        newStats.pendingOffers = offers.filter(offer => offer.estado === 'pendiente').length;
      }

      if (activitiesResponse.status === 'fulfilled') {
        const activities = activitiesResponse.value.data || [];
        newStats.totalActivities = activities.length;
        newStats.pendingActivities = activities.filter(activity => activity.estado === 'pendiente').length;
      }

      if (ordersResponse.status === 'fulfilled') {
        newStats.totalOrders = ordersResponse.value.data?.length || 0;
      }

      setStats(newStats);

    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      addNotification('Error al cargar estadísticas del dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStats = () => {
    setLoading(true);
    fetchStats();
  };

  if (!currentUser || currentUser.rol !== 'administrador') {
    addNotification('Acceso denegado. Se requiere rol de administrador.', 'warning');
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="modern-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="admin-layout">
        {/* Sidebar */}
        <div className="admin-sidebar">
          <div className="sidebar-header">
            <div className="admin-avatar">
              {currentUser.nombre?.charAt(0).toUpperCase()}
            </div>
            <div className="admin-info">
              <h3>Panel Admin</h3>
              <p>{currentUser.nombre}</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-label">Dashboard</span>
            </button>

            <button
              className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span className="nav-icon">👥</span>
              <span className="nav-label">Usuarios</span>
              {stats.totalUsers > 0 && (
                <span className="nav-badge">{stats.totalUsers}</span>
              )}
            </button>

            <button
              className={`nav-item ${activeTab === 'offers' ? 'active' : ''}`}
              onClick={() => setActiveTab('offers')}
            >
              <span className="nav-icon">🏷️</span>
              <span className="nav-label">Ofertas</span>
              {stats.pendingOffers > 0 && (
                <span className="nav-badge warning">{stats.pendingOffers}</span>
              )}
            </button>

            <button
              className={`nav-item ${activeTab === 'activities' ? 'active' : ''}`}
              onClick={() => setActiveTab('activities')}
            >
              <span className="nav-icon">🎯</span>
              <span className="nav-label">Actividades</span>
              {stats.pendingActivities > 0 && (
                <span className="nav-badge warning">{stats.pendingActivities}</span>
              )}
            </button>

            <button
              className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <span className="nav-icon">🛵</span>
              <span className="nav-label">Mandados</span>
              {stats.totalOrders > 0 && (
                <span className="nav-badge">{stats.totalOrders}</span>
              )}
            </button>
          </nav>

          <div className="sidebar-footer">
            <button 
              className="btn-modern outline small full-width"
              onClick={handleRefreshStats}
              disabled={loading}
            >
              <span className="btn-icon">🔄</span>
              Actualizar Datos
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="admin-content">
          <div className="content-header">
            <div className="header-title">
              <h1>
                {activeTab === 'dashboard' && '📊 Dashboard'}
                {activeTab === 'users' && '👥 Gestión de Usuarios'}
                {activeTab === 'offers' && '🏷️ Gestión de Ofertas'}
                {activeTab === 'activities' && '🎯 Gestión de Actividades'}
                {activeTab === 'orders' && '🛵 Gestión de Mandados'}
              </h1>
              <p>
                {activeTab === 'dashboard' && 'Resumen general del sistema'}
                {activeTab === 'users' && 'Administrar usuarios y permisos'}
                {activeTab === 'offers' && 'Gestionar ofertas y promociones'}
                {activeTab === 'activities' && 'Administrar actividades y eventos'}
                {activeTab === 'orders' && 'Supervisar mandados y entregas'}
              </p>
            </div>
            <div className="header-actions">
              <button className="btn-modern outline">
                <span className="btn-icon">📊</span>
                Reportes
              </button>
              <button className="btn-modern primary">
                <span className="btn-icon">⚡</span>
                Acciones Rápidas
              </button>
            </div>
          </div>

          <div className="content-area">
            {activeTab === 'dashboard' && <AdminDashboard stats={stats} onRefresh={handleRefreshStats} />}
            {activeTab === 'users' && <UsersManagement />}
            {activeTab === 'offers' && <OffersManagement />}
            {activeTab === 'activities' && <ActivitiesManagement />}
            {activeTab === 'orders' && <OrdersManagement />}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente del Dashboard Modernizado
const AdminDashboard = ({ stats, onRefresh }) => {
  const totalPending = stats.pendingOffers + stats.pendingActivities;
  const totalElements = stats.totalUsers + stats.totalOffers + stats.totalActivities + stats.totalOrders;

  const statCards = [
    {
      icon: '👥',
      value: stats.totalUsers,
      label: 'Usuarios Totales',
      color: 'primary',
      trend: '+12%'
    },
    {
      icon: '🏷️',
      value: stats.totalOffers,
      label: 'Ofertas Totales',
      color: 'success',
      subValue: stats.pendingOffers > 0 ? `${stats.pendingOffers} pendientes` : null,
      trend: '+8%'
    },
    {
      icon: '🎯',
      value: stats.totalActivities,
      label: 'Actividades Totales',
      color: 'warning',
      subValue: stats.pendingActivities > 0 ? `${stats.pendingActivities} pendientes` : null,
      trend: '+15%'
    },
    {
      icon: '🛵',
      value: stats.totalOrders,
      label: 'Mandados Totales',
      color: 'info',
      trend: '+20%'
    },
    {
      icon: '⏳',
      value: totalPending,
      label: 'Pendientes de Revisión',
      color: 'error',
      trend: '-5%'
    },
    {
      icon: '📈',
      value: totalElements,
      label: 'Total Elementos',
      color: 'purple',
      trend: '+14%'
    }
  ];

  const quickActions = [
    { icon: '👤', label: 'Crear Usuario', color: 'primary' },
    { icon: '🏷️', label: 'Revisar Ofertas', color: 'success' },
    { icon: '🎯', label: 'Aprobar Actividades', color: 'warning' },
    { icon: '📊', label: 'Ver Reportes', color: 'info' },
    { icon: '⚙️', label: 'Configuración', color: 'secondary' },
    { icon: '🔔', label: 'Notificaciones', color: 'purple' }
  ];

  return (
    <div className="dashboard-container">
      {/* Estadísticas Principales */}
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.color}`}>
            <div className="stat-header">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-trend">{stat.trend}</div>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              {stat.subValue && (
                <div className="stat-subvalue">{stat.subValue}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Contenido Secundario */}
      <div className="dashboard-content">
        {/* Acciones Rápidas */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>⚡ Acciones Rápidas</h3>
            <p>Accesos directos a funciones frecuentes</p>
          </div>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <button key={index} className={`quick-action-btn ${action.color}`}>
                <span className="action-icon">{action.icon}</span>
                <span className="action-label">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Resumen de Actividad */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>📈 Resumen de Actividad</h3>
            <p>Estado actual del sistema</p>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-info">
                <span className="activity-icon">👥</span>
                <div>
                  <div className="activity-title">Usuarios registrados</div>
                  <div className="activity-subtitle">Total de usuarios en la plataforma</div>
                </div>
              </div>
              <div className="activity-value">{stats.totalUsers}</div>
            </div>
            
            <div className="activity-item">
              <div className="activity-info">
                <span className="activity-icon">🏷️</span>
                <div>
                  <div className="activity-title">Ofertas pendientes</div>
                  <div className="activity-subtitle">Esperando aprobación</div>
                </div>
              </div>
              <div className="activity-value warning">{stats.pendingOffers}</div>
            </div>
            
            <div className="activity-item">
              <div className="activity-info">
                <span className="activity-icon">🎯</span>
                <div>
                  <div className="activity-title">Actividades pendientes</div>
                  <div className="activity-subtitle">Esperando revisión</div>
                </div>
              </div>
              <div className="activity-value warning">{stats.pendingActivities}</div>
            </div>
            
            <div className="activity-item">
              <div className="activity-info">
                <span className="activity-icon">🛵</span>
                <div>
                  <div className="activity-title">Mandados totales</div>
                  <div className="activity-subtitle">Solicitudes de servicio</div>
                </div>
              </div>
              <div className="activity-value info">{stats.totalOrders}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje de Bienvenida */}
      <div className="welcome-card">
        <div className="welcome-content">
          <div className="welcome-icon">👑</div>
          <div className="welcome-text">
            <h3>¡Bienvenido al Panel de Administración!</h3>
            <p>
              Desde aquí puedes gestionar todos los aspectos de la plataforma KopaMandados.
              Utiliza el menú lateral para navegar entre las diferentes secciones de administración.
            </p>
          </div>
        </div>
        <div className="welcome-badges">
          <span className="welcome-badge success">Seguro</span>
          <span className="welcome-badge info">En Tiempo Real</span>
          <span className="welcome-badge warning">Administrativo</span>
        </div>
      </div>
    </div>
  );
};

export default Admin;