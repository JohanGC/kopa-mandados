import express from 'express';
import Favorite from '../models/Favorite.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Agregar a favoritos
router.post('/', auth, async (req, res) => {
  try {
    const { itemId, tipo } = req.body;
    const userId = req.user.userId;

    const existingFavorite = await Favorite.findOne({ 
      usuario: userId, 
      itemId, 
      tipo 
    });

    if (existingFavorite) {
      return res.status(400).json({ message: 'Ya está en favoritos' });
    }

    const favorite = new Favorite({
      usuario: userId,
      itemId,
      tipo
    });

    await favorite.save();
    res.status(201).json(favorite);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Ya está en favoritos' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Eliminar de favoritos
router.delete('/', auth, async (req, res) => {
  try {
    const { itemId, tipo } = req.body;
    const userId = req.user.userId;

    const favorite = await Favorite.findOneAndDelete({ 
      usuario: userId, 
      itemId, 
      tipo 
    });

    if (!favorite) {
      return res.status(404).json({ message: 'No encontrado en favoritos' });
    }

    res.json({ message: 'Eliminado de favoritos' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Eliminar favorito por ID (nueva ruta)
router.delete('/:id', auth, async (req, res) => {
  try {
    const favorite = await Favorite.findOneAndDelete({
      _id: req.params.id,
      usuario: req.user.userId
    });

    if (!favorite) {
      return res.status(404).json({ message: 'Favorito no encontrado' });
    }

    res.json({ message: 'Favorito eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verificar si está en favoritos
router.get('/check', auth, async (req, res) => {
  try {
    const { itemId, tipo } = req.query;
    const userId = req.user.userId;

    const favorite = await Favorite.findOne({ 
      usuario: userId, 
      itemId, 
      tipo 
    });

    res.json({ isFavorite: !!favorite });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener favoritos del usuario
router.get('/user', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const favorites = await Favorite.find({ usuario: userId })
      .sort({ fecha: -1 });

    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;