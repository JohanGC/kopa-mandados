// components/CalificacionModal.js
import React, { useState } from 'react';

const CalificacionModal = ({ 
  isOpen, 
  onClose, 
  onCalificar, 
  tipo, 
  orderId,
  usuarioActual 
}) => {
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (calificacion === 0) {
      alert('Por favor selecciona una calificación');
      return;
    }

    setLoading(true);
    try {
      await onCalificar(orderId, calificacion, comentario);
      setCalificacion(0);
      setComentario('');
      onClose();
    } catch (error) {
      console.error('Error calificando:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const titulo = tipo === 'solicitante' 
    ? 'Calificar al Domiciliario' 
    : 'Calificar al Solicitante';

  const placeholder = tipo === 'solicitante'
    ? '¿Cómo fue tu experiencia con el domiciliario?'
    : '¿Cómo fue tu experiencia con el solicitante?';

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{titulo}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Selector de estrellas */}
              <div className="text-center mb-3">
                <h6>Selecciona una calificación:</h6>
                <div className="d-flex justify-content-center">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className="btn btn-link p-1"
                      onClick={() => setCalificacion(star)}
                    >
                      <span style={{ fontSize: '2rem' }}>
                        {star <= calificacion ? '★' : '☆'}
                      </span>
                    </button>
                  ))}
                </div>
                <small className="text-muted">
                  {calificacion === 0 ? 'Sin calificar' : `${calificacion} estrella${calificacion !== 1 ? 's' : ''}`}
                </small>
              </div>

              {/* Comentario */}
              <div className="mb-3">
                <label htmlFor="comentario" className="form-label">Comentario (opcional):</label>
                <textarea
                  id="comentario"
                  className="form-control"
                  rows="3"
                  placeholder={placeholder}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Calificación'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CalificacionModal;