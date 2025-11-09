import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import axios from 'axios';

const CreateOrder = () => {
  const [formData, setFormData] = useState({
    descripcion: '',
    precioOfertado: '',
    categoria: 'otros',
    notasAdicionales: '',
    ubicacionRecogida: '',
    ubicacionEntrega: '',
    fechaLimite: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { currentUser, API_URL } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!currentUser) {
      setError('Debes iniciar sesión para crear un mandado');
      setLoading(false);
      return;
    }

    if (!formData.descripcion.trim()) {
      setError('La descripción del mandado es requerida');
      setLoading(false);
      return;
    }

    if (!formData.precioOfertado || formData.precioOfertado < 1000) {
      setError('El precio ofertado debe ser mínimo $1.000');
      setLoading(false);
      return;
    }

    try {
      const orderData = {
        ...formData,
        precioOfertado: parseInt(formData.precioOfertado),
        fechaLimite: formData.fechaLimite ? new Date(formData.fechaLimite) : null
      };

      const response = await axios.post(`${API_URL}/orders`, orderData);
      
      addNotification('✅ Mandado creado exitosamente', 'success');
      navigate('/orders');
      
    } catch (error) {
      console.error('Error creando mandado:', error);
      const message = error.response?.data?.message || 'Error al crear el mandado';
      setError(message);
      addNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning text-center">
          <h4>Debes iniciar sesión para crear un mandado</h4>
          <button 
            className="btn btn-primary mt-3"
            onClick={() => navigate('/login')}
          >
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">🛵 Crear Nuevo Mandado</h4>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {/* Información del usuario */}
              <div className="card mb-4">
                <div className="card-body bg-light">
                  <h6>👤 Información del Solicitante</h6>
                  <p className="mb-1"><strong>Nombre:</strong> {currentUser.nombre}</p>
                  <p className="mb-0"><strong>Teléfono:</strong> {currentUser.telefono || 'No registrado'}</p>
                  {!currentUser.telefono && (
                    <small className="text-warning">
                      Actualiza tu teléfono en tu perfil para recibir llamadas
                    </small>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="categoria" className="form-label">Categoría del Mandado</label>
                  <select
                    className="form-select"
                    id="categoria"
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    required
                  >
                    <option value="comida">🍕 Comida a Domicilio</option>
                    <option value="mercado">🛒 Mercado/Compras</option>
                    <option value="farmacia">💊 Farmacia</option>
                    <option value="paqueteria">📦 Paquetería</option>
                    <option value="documentos">📄 Documentos</option>
                    <option value="otros">🎯 Otros Servicios</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="descripcion" className="form-label">
                    📝 Descripción del Mandado *
                  </label>
                  <textarea
                    className="form-control"
                    id="descripcion"
                    name="descripcion"
                    rows="4"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Describe detalladamente lo que necesitas que haga el mandadito. Ej: 'Recoger un paquete en la Cra 15 #45-60 y llevarlo a la Cra 20 #35-25'"
                    required
                    maxLength="500"
                  ></textarea>
                  <div className="form-text">
                    {formData.descripcion.length}/500 caracteres
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="precioOfertado" className="form-label">
                        💰 Precio Ofertado (COP) *
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          className="form-control"
                          id="precioOfertado"
                          name="precioOfertado"
                          value={formData.precioOfertado}
                          onChange={handleChange}
                          placeholder="5000"
                          min="1000"
                          step="500"
                          required
                        />
                      </div>
                      <div className="form-text">Mínimo $1.000</div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="fechaLimite" className="form-label">
                        ⏰ Fecha Límite (Opcional)
                      </label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        id="fechaLimite"
                        name="fechaLimite"
                        value={formData.fechaLimite}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="ubicacionRecogida" className="form-label">
                        📍 Lugar de Recogida (Opcional)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="ubicacionRecogida"
                        name="ubicacionRecogida"
                        value={formData.ubicacionRecogida}
                        onChange={handleChange}
                        placeholder="Dirección donde debe recoger el mandadito"
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="ubicacionEntrega" className="form-label">
                        🏠 Lugar de Entrega (Opcional)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="ubicacionEntrega"
                        name="ubicacionEntrega"
                        value={formData.ubicacionEntrega}
                        onChange={handleChange}
                        placeholder="Dirección donde debe entregar el mandadito"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="notasAdicionales" className="form-label">
                    📋 Notas Adicionales (Opcional)
                  </label>
                  <textarea
                    className="form-control"
                    id="notasAdicionales"
                    name="notasAdicionales"
                    rows="2"
                    value={formData.notasAdicionales}
                    onChange={handleChange}
                    placeholder="Instrucciones especiales, horarios, etc."
                  ></textarea>
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button 
                    type="button" 
                    className="btn btn-secondary me-2"
                    onClick={() => navigate('/orders')}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Publicando Mandado...
                      </>
                    ) : (
                      '🚀 Publicar Mandado'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;