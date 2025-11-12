// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  rol: {
    type: String,
    enum: ['usuario', 'oferente', 'domiciliario', 'administrador'],
    default: 'usuario'
  },
  empresa: {
    type: String,
    default: '' // Cambiado a no requerido por defecto
  },
  telefono: {
    type: String,
    required: true
  },
  direccion: {
    type: String,
    required: true
  },
  // Nuevos campos específicos para domiciliarios
  placaVehiculo: {
    type: String,
    default: '' // Cambiado a no requerido por defecto
  },
  tipoVehiculo: {
    type: String,
    enum: ['moto', 'bicicleta', 'carro', 'caminando', ''],
    default: '' // Cambiado a no requerido por defecto
  },
  ubicacionActual: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    ultimaActualizacion: { type: Date, default: null }
  },
  disponible: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Validación personalizada para empresa cuando es oferente
userSchema.pre('save', function(next) {
  if (this.rol === 'oferente' && (!this.empresa || this.empresa.trim() === '')) {
    return next(new Error('El campo empresa es requerido para oferentes'));
  }
  next();
});

export default mongoose.model('User', userSchema);