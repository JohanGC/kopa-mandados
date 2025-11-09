import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  tipo: {
    type: String,
    enum: ['offer', 'activity'],
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Evitar duplicados
favoriteSchema.index({ usuario: 1, itemId: 1, tipo: 1 }, { unique: true });

export default mongoose.model('Favorite', favoriteSchema);