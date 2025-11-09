import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getTotalPrice,
    getTotalItems
  } = useCart();
  
  const { addNotification } = useNotification();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!currentUser) {
      addNotification('Debes iniciar sesión para realizar la compra', 'warning');
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      addNotification('El carrito está vacío', 'warning');
      return;
    }

    setLoading(true);
    try {
      // Simular proceso de pago
      setTimeout(() => {
        addNotification('¡Compra realizada con éxito!', 'success');
        clearCart();
        setLoading(false);
        navigate('/orders');
      }, 2000);
    } catch (error) {
      addNotification('Error al procesar la compra', 'error');
      setLoading(false);
    }
  };

  const handleContinueShopping = () => {
    navigate('/offers');
  };

  const handleRemoveItem = (itemId, itemType) => {
    removeFromCart(itemId, itemType);
    addNotification('Producto eliminado del carrito', 'info');
  };

  const handleQuantityChange = (itemId, itemType, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId, itemType);
      return;
    }
    updateQuantity(itemId, itemType, newQuantity);
  };

  const calculateItemTotal = (item) => {
    return (item.precioDescuento * item.quantity).toLocaleString();
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">🛒 Carrito de Compras</h4>
              </div>
              <div className="card-body text-center py-5">
                <div className="mb-4">
                  <span style={{ fontSize: '6rem' }}>🛒</span>
                </div>
                <h3 className="card-title mb-3">Tu carrito está vacío</h3>
                <p className="card-text text-muted mb-4">
                  Explora nuestras ofertas y actividades para agregar items a tu carrito.
                </p>
                <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                  <button 
                    className="btn btn-primary btn-lg me-md-2"
                    onClick={handleContinueShopping}
                  >
                    🏷️ Ver Ofertas
                  </button>
                  <Link to="/activities" className="btn btn-warning btn-lg">
                    🎯 Ver Actividades
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0">🛒 Mi Carrito de Compras</h4>
              <span className="badge bg-light text-primary fs-6">
                {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div className="card-body">
              {/* Resumen rápido */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <div className="card text-white bg-info">
                    <div className="card-body text-center py-3">
                      <h6 className="card-title">Total Items</h6>
                      <h4 className="mb-0">{getTotalItems()}</h4>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-white bg-success">
                    <div className="card-body text-center py-3">
                      <h6 className="card-title">Ahorro Total</h6>
                      <h4 className="mb-0">
                        ${cartItems.reduce((total, item) => 
                          total + ((item.precioOriginal - item.precioDescuento) * item.quantity), 0
                        ).toLocaleString()}
                      </h4>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-white bg-warning">
                    <div className="card-body text-center py-3">
                      <h6 className="card-title">Ofertas</h6>
                      <h4 className="mb-0">
                        {cartItems.filter(item => item.type === 'offer').length}
                      </h4>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-white bg-danger">
                    <div className="card-body text-center py-3">
                      <h6 className="card-title">Actividades</h6>
                      <h4 className="mb-0">
                        {cartItems.filter(item => item.type === 'activity').length}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de productos */}
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Producto</th>
                      <th>Precio</th>
                      <th>Cantidad</th>
                      <th>Subtotal</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map(item => (
                      <tr key={`${item.type}-${item._id}`}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="me-3">
                              <span style={{ fontSize: '2rem' }}>
                                {item.type === 'activity' ? '🎯' : '🏷️'}
                              </span>
                            </div>
                            <div>
                              <h6 className="mb-1">{item.titulo}</h6>
                              <small className="text-muted">
                                {item.type === 'activity' ? 'Actividad' : 'Oferta'} • {item.categoria}
                              </small>
                              <div className="mt-1">
                                <span className="badge bg-success me-1">
                                  {item.descuento}% OFF
                                </span>
                                <span className={`badge ${item.type === 'activity' ? 'bg-info' : 'bg-primary'}`}>
                                  {item.type === 'activity' ? 'Actividad' : 'Oferta'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <del className="text-muted small">
                              ${item.precioOriginal?.toLocaleString()}
                            </del>
                            <div className="text-success fw-bold">
                              ${item.precioDescuento?.toLocaleString()}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleQuantityChange(item._id, item.type, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <span className="mx-3 fw-bold">{item.quantity}</span>
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleQuantityChange(item._id, item.type, item.quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td>
                          <strong className="text-primary">
                            ${calculateItemTotal(item)}
                          </strong>
                        </td>
                        <td>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleRemoveItem(item._id, item.type)}
                            title="Eliminar del carrito"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Acciones y resumen */}
              <div className="row mt-4">
                <div className="col-md-8">
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-danger"
                      onClick={clearCart}
                    >
                      🗑️ Vaciar Carrito
                    </button>
                    <button
                      className="btn btn-outline-primary"
                      onClick={handleContinueShopping}
                    >
                      ← Continuar Comprando
                    </button>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card border-0 bg-light">
                    <div className="card-body">
                      <h5 className="card-title mb-3">Resumen de Compra</h5>
                      
                      <div className="d-flex justify-content-between mb-2">
                        <span>Subtotal:</span>
                        <span>${getTotalPrice().toLocaleString()}</span>
                      </div>
                      
                      <div className="d-flex justify-content-between mb-2">
                        <span>Descuentos:</span>
                        <span className="text-success">
                          -${cartItems.reduce((total, item) => 
                            total + ((item.precioOriginal - item.precioDescuento) * item.quantity), 0
                          ).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="d-flex justify-content-between mb-2">
                        <span>Envío:</span>
                        <span className="text-success">Gratis</span>
                      </div>
                      
                      <hr />
                      
                      <div className="d-flex justify-content-between mb-3">
                        <strong>Total:</strong>
                        <strong className="text-primary fs-5">
                          ${getTotalPrice().toLocaleString()}
                        </strong>
                      </div>
                      
                      <button
                        className="btn btn-success w-100 btn-lg"
                        onClick={handleCheckout}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Procesando...
                          </>
                        ) : (
                          '🎉 Proceder al Pago'
                        )}
                      </button>
                      
                      <div className="mt-3 text-center">
                        <small className="text-muted">
                          💳 Pago seguro • 🔒 Datos protegidos • 🚚 Envío gratis
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;