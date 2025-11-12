// models/Favorite.js - CORREGIDO
import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // ✅ MEJORA: Índice para mejor performance
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true // ✅ MEJORA: Índice para mejor performance
  },
  tipo: {
    type: String,
    enum: ['offer', 'activity'],
    required: true,
    index: true // ✅ MEJORA: Índice para mejor performance
  },
  // ✅ NUEVO: Metadatos adicionales para mejor UX
  itemNombre: {
    type: String,
    default: ''
  },
  itemImagen: {
    type: String,
    default: ''
  },
  itemPrecio: {
    type: Number,
    default: 0
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // ✅ MEJORA: created_at y updated_at automáticos
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ MEJORA: Índice compuesto para evitar duplicados y mejor performance
favoriteSchema.index({ usuario: 1, itemId: 1, tipo: 1 }, { 
  unique: true,
  name: 'favorite_unique_index'
});

// ✅ MEJORA: Índices individuales para búsquedas rápidas
favoriteSchema.index({ usuario: 1, fecha: -1 });
favoriteSchema.index({ tipo: 1, fecha: -1 });

// ✅ MEJORA: Virtual para obtener el item poblado (si es necesario)
favoriteSchema.virtual('item').get(function() {
  // Esto puede ser implementado según necesites
  return null;
});

// ✅ MEJORA: Método estático para obtener favoritos por usuario
favoriteSchema.statics.findByUser = function(userId, options = {}) {
  const { limit = 50, skip = 0, sort = { fecha: -1 } } = options;
  
  return this.find({ usuario: userId })
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .populate('usuario', 'nombre email');
};

// ✅ MEJORA: Método estático para contar favoritos por usuario
favoriteSchema.statics.countByUser = function(userId) {
  return this.countDocuments({ usuario: userId });
};

export default mongoose.model('Favorite', favoriteSchema);