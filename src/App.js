import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Offers from './pages/Offers';
import Activities from './pages/Activities';
import Orders from './pages/Orders';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import CreateOffer from './components/CreateOffer';
import CreateActivity from './components/CreateActivity';
import CreateOrder from './components/CreateOrder';
import Favorites from './pages/Favorites';
import MyOffers from './pages/MyOffers';
import MyActivities from './pages/MyActivities';
import Cart from './pages/Cart';

// Importar componentes de detalles
import OfferDetails from './components/OfferDetails';
import ActivityDetails from './components/ActivityDetails';
import OrderDetails from './components/OrderDetails';

// Importar componentes de administración
import UsersManagement from './components/admin/UsersManagement';
import OffersManagement from './components/admin/OffersManagement';
import ActivitiesManagement from './components/admin/ActivitiesManagement';
import OrdersManagement from './components/admin/OrdersManagement';

import ErrorBoundary from './components/ErrorBoundary';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './styles/custom.css';

// Componente de notificaciones
const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();
  
  return (
    <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`alert alert-${notification.type} alert-dismissible fade show mb-2`}
          role="alert"
        >
          {notification.message}
          <button
            type="button"
            className="btn-close"
            onClick={() => removeNotification(notification.id)}
          ></button>
        </div>
      ))}
    </div>
  );
};

// Componente principal
const AppContent = () => {
  return (
    <Router>
      <div className="App d-flex flex-column min-vh-100">
        <Header />
        <main className="flex-grow-1">
          <NotificationContainer />
          <Routes>
            {/* Rutas principales */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Rutas de ofertas */}
            <Route path="/offers" element={<Offers />} />
            <Route path="/offer/:id" element={<OfferDetails />} />
            <Route path="/create-offer" element={<CreateOffer />} />
            
            {/* Rutas de actividades */}
            <Route path="/activities" element={<Activities />} />
            <Route path="/activity/:id" element={<ActivityDetails />} />
            <Route path="/create-activity" element={<CreateActivity />} />
            
            {/* Rutas de mandados */}
            <Route path="/orders" element={<Orders />} />
            <Route path="/order/:id" element={<OrderDetails />} />
            <Route path="/create-order" element={<CreateOrder />} />
            
            {/* Rutas de usuario */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/my-offers" element={<MyOffers />} />
            <Route path="/my-activities" element={<MyActivities />} />
            
            {/* Rutas de páginas en desarrollo */}
            <Route path="/my-offers" element={<div className="container mt-4"><h1>Mis Ofertas</h1><p>Página en desarrollo</p></div>} />
            <Route path="/my-activities" element={<div className="container mt-4"><h1>Mis Actividades</h1><p>Página en desarrollo</p></div>} />
            <Route path="/favorites" element={<div className="container mt-4"><h1>Mis Favoritos</h1><p>Página en desarrollo</p></div>} />
            <Route path="/settings" element={<div className="container mt-4"><h1>Configuración</h1><p>Página en desarrollo</p></div>} />
            <Route path="/my-orders" element={<div className="container mt-4"><h1>Mis Mandados</h1><p>Página en desarrollo</p></div>} />

            {/* Carrito de compras - Nueva ruta */}
            <Route path="/cart" element={<Cart />} />
            
            {/* Ruta 404 */}
            <Route path="*" element={<div className="container mt-5"><h1>404 - Página no encontrada</h1></div>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;