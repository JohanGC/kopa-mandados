import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['offer', 'activity', 'order'],
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  calificacion: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comentario: {
    type: String,
    trim: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Evitar duplicados
reviewSchema.index({ usuario: 1, itemId: 1, tipo: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);