import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
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
    required: true
  },
  participantes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  fecha: {
    type: Date,
    required: true
  },
  hora: {
    type: String,
    required: true
  },
  duracion: {
    type: String,
    required: true
  },
  ubicacion: {
    type: String,
    required: true
  },
  requisitos: {
    type: String
  },
  imagen: {
    type: String
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

export default mongoose.model('Activity', activitySchema);