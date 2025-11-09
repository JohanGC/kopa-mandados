import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true
  },
  categoria: {
    type: String,
    required: true
  },
  precioOriginal: {
    type: Number,
    required: true
  },
  descuento: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  precioDescuento: {
    type: Number,
    required: true
  },
  maxParticipantes: {
    type: Number,
    default: null
  },
  participantes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  fechaInicio: {
    type: Date,
    required: true
  },
  fechaFin: {
    type: Date,
    required: true
  },
  condiciones: {
    type: String
  },
  imagen: {
    type: String
  },
  tipoOferta: {
    type: String,
    enum: ['general', 'exclusiva', 'flash'],
    default: 'general'
  },
  creador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aprobada', 'rechazada'],
    default: 'pendiente'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Offer', offerSchema);