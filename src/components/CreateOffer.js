import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import axios from 'axios';

const CreateOffer = () => {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'temporada',
    precioOriginal: '',
    descuento: '',
    maxParticipantes: '',
    fechaInicio: '',
    fechaFin: '',
    condiciones: '',
    imagen: '',
    tipoOferta: 'general'
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

  const calculateDiscountPrice = () => {
    if (formData.precioOriginal && formData.descuento) {
      const precio = parseFloat(formData.precioOriginal);
      const descuento = parseFloat(formData.descuento);
      return precio - (precio * descuento / 100);
    }
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validaciones
    if (!currentUser || (currentUser.rol !== 'oferente' && currentUser.rol !== 'administrador')) {
      setError('Solo los oferentes pueden crear ofertas');
      setLoading(false);
      return;
    }

    if (!formData.titulo.trim() || !formData.descripcion.trim()) {
      setError('El título y descripción son requeridos');
      setLoading(false);
      return;
    }

    if (!formData.precioOriginal || formData.precioOriginal < 0) {
      setError('El precio original debe ser mayor a 0');
      setLoading(false);
      return;
    }

    if (!formData.descuento || formData.descuento < 0 || formData.descuento > 100) {
      setError('El descuento debe estar entre 0% y 100%');
      setLoading(false);
      return;
    }

    try {
      const precioDescuento = calculateDiscountPrice();
      
      const offerData = {
        ...formData,
        precioOriginal: parseFloat(formData.precioOriginal),
        descuento: parseFloat(formData.descuento),
        precioDescuento: precioDescuento,
        maxParticipantes: formData.maxParticipantes ? parseInt(formData.maxParticipantes) : null,
        fechaInicio: new Date(formData.fechaInicio),
        fechaFin: new Date(formData.fechaFin),
        estado: 'pendiente'
      };

      const response = await axios.post(`${API_URL}/offers`, offerData);
      
      addNotification('✅ Oferta creada exitosamente. Está pendiente de aprobación.', 'success');
      navigate('/offers');
      
    } catch (error) {
      console.error('Error creando oferta:', error);
      const message = error.response?.data?.message || 'Error al crear la oferta';
      setError(message);
      addNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };
  navigate('/my-offers');

  if (!currentUser || (currentUser.rol !== 'oferente' && currentUser.rol !== 'administrador')) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning text-center">
          <h4>No tienes permisos para crear ofertas</h4>
          <p>Solo los usuarios oferentes pueden crear ofertas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card shadow">
            <div className="card-header bg-success text-white">
              <h4 className="mb-0">🏷️ Crear Nueva Oferta</h4>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {/* Información del oferente */}
              <div className="card mb-4">
                <div className="card-body bg-light">
                  <h6>🏢 Información del Oferente</h6>
                  <p className="mb-1"><strong>Empresa:</strong> {currentUser.empresa || currentUser.nombre}</p>
                  <p className="mb-0"><strong>Email:</strong> {currentUser.email}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-8">
                    <div className="mb-3">
                      <label htmlFor="titulo" className="form-label">Título de la Oferta *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="titulo"
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleChange}
                        placeholder="Ej: Oferta Especial de Verano 2024"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="categoria" className="form-label">Categoría *</label>
                      <select
                        className="form-select"
                        id="categoria"
                        name="categoria"
                        value={formData.categoria}
                        onChange={handleChange}
                        required
                      >
                        <option value="temporada">Temporada</option>
                        <option value="nocturna">Nocturna</option>
                        <option value="fin-de-semana">Fin de Semana</option>
                        <option value="flash">Flash</option>
                        <option value="general">General</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="descripcion" className="form-label">Descripción *</label>
                  <textarea
                    className="form-control"
                    id="descripcion"
                    name="descripcion"
                    rows="4"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Describe detalladamente la oferta, beneficios, productos incluidos, etc."
                    required
                  ></textarea>
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="precioOriginal" className="form-label">Precio Original (COP) *</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          className="form-control"
                          id="precioOriginal"
                          name="precioOriginal"
                          value={formData.precioOriginal}
                          onChange={handleChange}
                          placeholder="100000"
                          min="0"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="descuento" className="form-label">Descuento (%) *</label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          id="descuento"
                          name="descuento"
                          value={formData.descuento}
                          onChange={handleChange}
                          placeholder="20"
                          min="0"
                          max="100"
                          required
                        />
                        <span className="input-group-text">%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="precioDescuento" className="form-label">Precio con Descuento</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="text"
                          className="form-control"
                          id="precioDescuento"
                          value={calculateDiscountPrice().toLocaleString()}
                          disabled
                          style={{backgroundColor: '#f8f9fa'}}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="fechaInicio" className="form-label">Fecha de Inicio *</label>
                      <input
                        type="date"
                        className="form-control"
                        id="fechaInicio"
                        name="fechaInicio"
                        value={formData.fechaInicio}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="fechaFin" className="form-label">Fecha de Fin *</label>
                      <input
                        type="date"
                        className="form-control"
                        id="fechaFin"
                        name="fechaFin"
                        value={formData.fechaFin}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="maxParticipantes" className="form-label">Máximo de Participantes</label>
                      <input
                        type="number"
                        className="form-control"
                        id="maxParticipantes"
                        name="maxParticipantes"
                        value={formData.maxParticipantes}
                        onChange={handleChange}
                        placeholder="50"
                        min="1"
                      />
                      <div className="form-text">Dejar vacío para ilimitado</div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="tipoOferta" className="form-label">Tipo de Oferta</label>
                      <select
                        className="form-select"
                        id="tipoOferta"
                        name="tipoOferta"
                        value={formData.tipoOferta}
                        onChange={handleChange}
                      >
                        <option value="general">General</option>
                        <option value="exclusiva">Exclusiva</option>
                        <option value="flash">Flash</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="condiciones" className="form-label">Condiciones y Restricciones</label>
                  <textarea
                    className="form-control"
                    id="condiciones"
                    name="condiciones"
                    rows="3"
                    value={formData.condiciones}
                    onChange={handleChange}
                    placeholder="Términos y condiciones de la oferta..."
                  ></textarea>
                </div>

                <div className="mb-3">
                  <label htmlFor="imagen" className="form-label">URL de la Imagen (Opcional)</label>
                  <input
                    type="url"
                    className="form-control"
                    id="imagen"
                    name="imagen"
                    value={formData.imagen}
                    onChange={handleChange}
                    placeholder="https://ejemplo.com/imagen-oferta.jpg"
                  />
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button 
                    type="button" 
                    className="btn btn-secondary me-2"
                    onClick={() => navigate('/offers')}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-success"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creando Oferta...
                      </>
                    ) : (
                      '🚀 Publicar Oferta'
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

export default CreateOffer;