import express from 'express';
import Review from '../models/Review.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Crear reseña
router.post('/', auth, async (req, res) => {
  try {
    const { tipo, itemId, calificacion, comentario } = req.body;
    const usuario = req.user.userId;

    // Verificar si ya existe una reseña del usuario para este item
    const existingReview = await Review.findOne({ 
      usuario, 
      itemId, 
      tipo 
    });

    if (existingReview) {
      return res.status(400).json({ message: 'Ya has calificado este item' });
    }

    const review = new Review({
      tipo,
      itemId,
      usuario,
      calificacion,
      comentario
    });

    await review.save();
    await review.populate('usuario', 'nombre email');
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener reseñas por item
router.get('/', async (req, res) => {
  try {
    const { tipo, itemId } = req.query;

    const reviews = await Review.find({ tipo, itemId })
      .populate('usuario', 'nombre email')
      .sort({ fecha: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener reseñas del usuario
router.get('/user', auth, async (req, res) => {
  try {
    const usuario = req.user.userId;
    const reviews = await Review.find({ usuario })
      .populate('itemId')
      .sort({ fecha: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;