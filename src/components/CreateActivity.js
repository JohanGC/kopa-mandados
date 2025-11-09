import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import axios from 'axios';

const CreateActivity = () => {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'taller',
    precioOriginal: '',
    descuento: '',
    maxParticipantes: '',
    fecha: '',
    hora: '',
    duracion: '',
    ubicacion: '',
    requisitos: '',
    imagen: ''
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
      setError('Solo los oferentes pueden crear actividades');
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

    if (!formData.maxParticipantes || formData.maxParticipantes < 1) {
      setError('El número máximo de participantes es requerido');
      setLoading(false);
      return;
    }

    try {
      const precioDescuento = calculateDiscountPrice();
      
      const activityData = {
        ...formData,
        precioOriginal: parseFloat(formData.precioOriginal),
        descuento: parseFloat(formData.descuento),
        precioDescuento: precioDescuento,
        maxParticipantes: parseInt(formData.maxParticipantes),
        fecha: new Date(formData.fecha),
        estado: 'pendiente'
      };

      const response = await axios.post(`${API_URL}/activities`, activityData);
      
      addNotification('✅ Actividad creada exitosamente. Está pendiente de aprobación.', 'success');
      navigate('/activities');
      
    } catch (error) {
      console.error('Error creando actividad:', error);
      const message = error.response?.data?.message || 'Error al crear la actividad';
      setError(message);
      addNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || (currentUser.rol !== 'oferente' && currentUser.rol !== 'administrador')) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning text-center">
          <h4>No tienes permisos para crear actividades</h4>
          <p>Solo los usuarios oferentes pueden crear actividades.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card shadow">
            <div className="card-header bg-warning text-dark">
              <h4 className="mb-0">🎯 Crear Nueva Actividad</h4>
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
                  <h6>🏢 Información del Organizador</h6>
                  <p className="mb-1"><strong>Empresa:</strong> {currentUser.empresa || currentUser.nombre}</p>
                  <p className="mb-0"><strong>Email:</strong> {currentUser.email}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-8">
                    <div className="mb-3">
                      <label htmlFor="titulo" className="form-label">Título de la Actividad *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="titulo"
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleChange}
                        placeholder="Ej: Taller de Cocina Italiana para Principiantes"
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
                        <option value="taller">Taller</option>
                        <option value="tour">Tour</option>
                        <option value="clase">Clase</option>
                        <option value="workshop">Workshop</option>
                        <option value="evento">Evento</option>
                        <option value="curso">Curso</option>
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
                    placeholder="Describe detalladamente la actividad, lo que aprenderán los participantes, beneficios, etc."
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
                          placeholder="80000"
                          min="0"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="descuento" className="form-label">Descuento (%)</label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          id="descuento"
                          name="descuento"
                          value={formData.descuento}
                          onChange={handleChange}
                          placeholder="25"
                          min="0"
                          max="100"
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
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="fecha" className="form-label">Fecha *</label>
                      <input
                        type="date"
                        className="form-control"
                        id="fecha"
                        name="fecha"
                        value={formData.fecha}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="hora" className="form-label">Hora *</label>
                      <input
                        type="time"
                        className="form-control"
                        id="hora"
                        name="hora"
                        value={formData.hora}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="duracion" className="form-label">Duración *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="duracion"
                        name="duracion"
                        value={formData.duracion}
                        onChange={handleChange}
                        placeholder="3 horas"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="ubicacion" className="form-label">Ubicación *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="ubicacion"
                    name="ubicacion"
                    value={formData.ubicacion}
                    onChange={handleChange}
                    placeholder="Calle Gourmet 123, Ciudad - Escuela de Cocina 'Sabor Italiano'"
                    required
                  />
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="maxParticipantes" className="form-label">Máximo de Participantes *</label>
                      <input
                        type="number"
                        className="form-control"
                        id="maxParticipantes"
                        name="maxParticipantes"
                        value={formData.maxParticipantes}
                        onChange={handleChange}
                        placeholder="15"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="imagen" className="form-label">URL de la Imagen (Opcional)</label>
                      <input
                        type="url"
                        className="form-control"
                        id="imagen"
                        name="imagen"
                        value={formData.imagen}
                        onChange={handleChange}
                        placeholder="https://ejemplo.com/imagen-actividad.jpg"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="requisitos" className="form-label">Requisitos y Recomendaciones</label>
                  <textarea
                    className="form-control"
                    id="requisitos"
                    name="requisitos"
                    rows="3"
                    value={formData.requisitos}
                    onChange={handleChange}
                    placeholder="Materiales que deben traer los participantes, nivel de experiencia requerido, etc."
                  ></textarea>
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button 
                    type="button" 
                    className="btn btn-secondary me-2"
                    onClick={() => navigate('/activities')}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-warning"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creando Actividad...
                      </>
                    ) : (
                      '🚀 Publicar Actividad'
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

export default CreateActivity;