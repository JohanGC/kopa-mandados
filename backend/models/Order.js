import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  descripcion: {
    type: String,
    required: true
  },
  precioOfertado: {
    type: Number,
    required: true
  },
  categoria: {
    type: String,
    required: true,
    enum: ['documentos', 'comida', 'farmacia', 'mercado', 'otros']
  },
  notasAdicionales: {
    type: String
  },
  ubicacionRecogida: {
    type: String,
    required: true
  },
  ubicacionEntrega: {
    type: String,
    required: true
  },
  fechaLimite: {
    type: Date
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
  estado: {
    type: String,
    enum: ['pendiente', 'aceptado', 'en_proceso', 'completado', 'cancelado'],
    default: 'pendiente'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Order', orderSchema);