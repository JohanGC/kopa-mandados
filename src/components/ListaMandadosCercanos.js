// components/ListaMandadosCercanos.js
import React from 'react';

const ListaMandadosCercanos = ({ mandados, onAceptar, disponible }) => {
  if (mandados.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted">No hay mandados cercanos en este momento</p>
      </div>
    );
  }

  return (
    <div>
      <h6>📋 Mandados Cercanos ({mandados.length})</h6>
      <div className="row">
        {mandados.map(mandado => (
          <div key={mandado._id} className="col-md-6 mb-3">
            <div className="card">
              <div className="card-body">
                <h6>{mandado.descripcion}</h6>
                <p className="mb-1">
                  <strong>💰 ${mandado.precioOfertado.toLocaleString()}</strong>
                </p>
                <p className="mb-1">
                  <small>{mandado.ubicacionRecogida}</small>
                </p>
                <button
                  className="btn btn-primary btn-sm w-100"
                  onClick={() => onAceptar(mandado._id)}
                  disabled={!disponible}
                >
                  ✅ Aceptar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListaMandadosCercanos;