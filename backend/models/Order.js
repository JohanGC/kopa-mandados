// models/Order.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  precioOfertado: {
    type: Number,
    required: true,
    min: 0
  },
  categoria: {
    type: String,
    required: true,
    enum: ['documentos', 'comida', 'farmacia', 'mercado', 'otros'],
    default: 'otros'
  },
  notasAdicionales: {
    type: String,
    trim: true
  },
  ubicacionRecogida: {
    type: String,
    required: true
  },
  ubicacionEntrega: {
    type: String,
    required: true
  },
  // Nuevos campos para geolocalización
  coordenadasRecogida: {
    lat: { type: Number },
    lng: { type: Number }
  },
  coordenadasEntrega: {
    lat: { type: Number },
    lng: { type: Number }
  },
  fechaLimite: {
    type: Date,
    required: true
  },
  solicitante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ejecutante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Estado expandido para mejor seguimiento
  estado: {
    type: String,
    enum: ['pendiente', 'aceptado', 'en_camino', 'en_proceso', 'completado', 'cancelado'],
    default: 'pendiente'
  },
  // Nuevos campos para tracking de tiempos
  fechaAceptado: {
    type: Date
  },
  fechaEnCamino: {
    type: Date
  },
  fechaCompletado: {
    type: Date
  },
  // Sistema de calificaciones
  calificacion: {
    type: Number,
    min: 1,
    max: 5
  },
  comentarioSolicitante: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
    calificacionSolicitante: {
    type: Number,
    min: 1,
    max: 5
  },
  comentarioSolicitante: {
    type: String,
    trim: true
  },
  calificacionDomiciliario: {
    type: Number,
    min: 1,
    max: 5
  },
  comentarioDomiciliario: {
    type: String,
    trim: true
  },
  fechaCalificacionSolicitante: {
    type: Date
  },
  fechaCalificacionDomiciliario: {
    type: Date
  }
}, {
  timestamps: true
});

// Método para calificar desde el solicitante
orderSchema.methods.calificarComoSolicitante = function(calificacion, comentario) {
  this.calificacionSolicitante = calificacion;
  this.comentarioSolicitante = comentario;
  this.fechaCalificacionSolicitante = new Date();
  return this.save();
};

// Método para calificar desde el domiciliario
orderSchema.methods.calificarComoDomiciliario = function(calificacion, comentario) {
  this.calificacionDomiciliario = calificacion;
  this.comentarioDomiciliario = comentario;
  this.fechaCalificacionDomiciliario = new Date();
  return this.save();
};

// Virtual para calificación promedio
orderSchema.virtual('calificacionPromedio').get(function() {
  const calificaciones = [];
  if (this.calificacionSolicitante) calificaciones.push(this.calificacionSolicitante);
  if (this.calificacionDomiciliario) calificaciones.push(this.calificacionDomiciliario);
  
  if (calificaciones.length === 0) return null;
  return calificaciones.reduce((a, b) => a + b) / calificaciones.length;
});

// Índices para mejor performance
orderSchema.index({ estado: 1, isActive: 1 });
orderSchema.index({ ejecutante: 1, estado: 1 });
orderSchema.index({ solicitante: 1 });
orderSchema.index({ fechaLimite: 1 });

// Método para verificar si el mandado está disponible
orderSchema.methods.estaDisponible = function() {
  return this.estado === 'pendiente' && 
         this.isActive && 
         this.fechaLimite > new Date();
};

// Método para verificar si puede ser aceptado por un domiciliario
orderSchema.methods.puedeSerAceptado = function() {
  return this.estaDisponible() && !this.ejecutante;
};

// Método para calcular duración total
orderSchema.virtual('duracionTotal').get(function() {
  if (this.fechaCompletado && this.fechaAceptado) {
    return this.fechaCompletado - this.fechaAceptado;
  }
  return null;
});

// Método para obtener el tiempo transcurrido desde la aceptación
orderSchema.methods.tiempoTranscurrido = function() {
  if (this.fechaAceptado) {
    return Date.now() - this.fechaAceptado.getTime();
  }
  return null;
};

export default mongoose.model('Order', orderSchema);