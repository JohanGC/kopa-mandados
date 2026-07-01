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

  const getSavingsTotal = () => {
    return cartItems.reduce((total, item) => 
      total + ((item.precioOriginal - item.precioDescuento) * item.quantity), 0
    ).toLocaleString();
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-modern">
        <div className="cart-container">
          <div className="empty-cart-card">
            <div className="empty-cart-header">
              
              <h1 className="cart-title">Carrito de Compras</h1>
            </div>
            <div className="empty-cart-content">
              <div className="empty-cart-icon">📭</div>
              <h2 className="empty-title">Tu carrito está vacío</h2>
              <p className="empty-description">
                Explora nuestras ofertas y actividades para agregar items a tu carrito.
              </p>
              <div className="empty-actions">
                <button 
                  className="btn-modern primary"
                  onClick={handleContinueShopping}
                >
                  
                  Ver Ofertas
                </button>
                <Link to="/activities" className="btn-modern secondary">
                  
                  Ver Actividades
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-modern">
      <div className="cart-container">
        <div className="cart-card">
          {/* Header del carrito */}
          <div className="cart-header">
            <div className="header-content">
              <div className="cart-title-section">
                <div className="cart-icon-main">🛒</div>
                <div>
                  <h1 className="cart-title">Mi Carrito de Compras</h1>
                  <p className="cart-subtitle">{getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} en tu carrito</p>
                </div>
              </div>
              <div className="cart-badge">
                {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
              </div>
            </div>
          </div>

          <div className="cart-content">
            {/* Estadísticas rápidas */}
            <div className="stats-grid">
              <div className="stat-card total-items">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <div className="stat-number">{getTotalItems()}</div>
                  <div className="stat-label">Total Items</div>
                </div>
              </div>
              <div className="stat-card savings">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <div className="stat-number">${getSavingsTotal()}</div>
                  <div className="stat-label">Ahorro Total</div>
                </div>
              </div>
              <div className="stat-card offers">
                <div className="stat-icon">🏷️</div>
                <div className="stat-content">
                  <div className="stat-number">
                    {cartItems.filter(item => item.type === 'offer').length}
                  </div>
                  <div className="stat-label">Ofertas</div>
                </div>
              </div>
              <div className="stat-card activities">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <div className="stat-number">
                    {cartItems.filter(item => item.type === 'activity').length}
                  </div>
                  <div className="stat-label">Actividades</div>
                </div>
              </div>
            </div>

            {/* Lista de productos */}
            <div className="cart-items-section">
              <h3 className="section-title">Items en el Carrito</h3>
              <div className="cart-items-list">
                {cartItems.map(item => (
                  <div key={`${item.type}-${item._id}`} className="cart-item">
                    <div className="item-image">
                      <div className="item-icon">
                        {item.type === 'activity' ? '🎯' : '🏷️'}
                      </div>
                    </div>
                    <div className="item-details">
                      <h4 className="item-title">{item.titulo}</h4>
                      <div className="item-meta">
                        <span className="item-category">{item.categoria}</span>
                        <span className={`item-type ${item.type}`}>
                          {item.type === 'activity' ? 'Actividad' : 'Oferta'}
                        </span>
                        <span className="discount-badge">{item.descuento}% OFF</span>
                      </div>
                    </div>
                    <div className="item-pricing">
                      <div className="price-comparison">
                        <span className="original-price">${item.precioOriginal?.toLocaleString()}</span>
                        <span className="current-price">${item.precioDescuento?.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="item-quantity">
                      <div className="quantity-controls">
                        <button
                          className="quantity-btn"
                          onClick={() => handleQuantityChange(item._id, item.type, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <span className="quantity-value">{item.quantity}</span>
                        <button
                          className="quantity-btn"
                          onClick={() => handleQuantityChange(item._id, item.type, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="item-total">
                      <span className="total-price">${calculateItemTotal(item)}</span>
                    </div>
                    <div className="item-actions">
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveItem(item._id, item.type)}
                        title="Eliminar del carrito"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones y resumen */}
            <div className="cart-actions-section">
              <div className="actions-grid">
                <div className="cart-actions">
                  <button
                    className="btn-modern outline danger"
                    onClick={clearCart}
                  >
                    <span className="btn-icon">🗑️</span>
                    Vaciar Carrito
                  </button>
                  <button
                    className="btn-modern outline"
                    onClick={handleContinueShopping}
                  >
                    <span className="btn-icon">←</span>
                    Continuar Comprando
                  </button>
                </div>
                <div className="cart-summary">
                  <div className="summary-card">
                    <h3 className="summary-title">Resumen de Compra</h3>
                    
                    <div className="summary-row">
                      <span>Subtotal:</span>
                      <span>${getTotalPrice().toLocaleString()}</span>
                    </div>
                    
                    <div className="summary-row discount">
                      <span>Descuentos:</span>
                      <span className="discount-amount">-${getSavingsTotal()}</span>
                    </div>
                    
                    <div className="summary-row shipping">
                      <span>Envío:</span>
                      <span className="free-shipping">Gratis</span>
                    </div>
                    
                    <div className="summary-divider"></div>
                    
                    <div className="summary-row total">
                      <span>Total:</span>
                      <span className="total-amount">${getTotalPrice().toLocaleString()}</span>
                    </div>
                    
                    <button
                      className="checkout-btn"
                      onClick={handleCheckout}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="button-spinner"></span>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <span className="btn-icon">🎉</span>
                          Proceder al Pago
                        </>
                      )}
                    </button>
                    
                    <div className="security-features">
                      <div className="security-item">
                        <span className="security-icon">💳</span>
                        <span>Pago seguro</span>
                      </div>
                      <div className="security-item">
                        <span className="security-icon">🔒</span>
                        <span>Datos protegidos</span>
                      </div>
                      <div className="security-item">
                        <span className="security-icon">🚚</span>
                        <span>Envío gratis</span>
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