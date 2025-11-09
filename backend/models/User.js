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
    required: function() { return this.rol === 'oferente'; }
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
    required: function() { return this.rol === 'domiciliario'; }
  },
  tipoVehiculo: {
    type: String,
    enum: ['moto', 'bicicleta', 'carro', 'caminando'],
    required: function() { return this.rol === 'domiciliario'; }
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

export default mongoose.model('User', userSchema);