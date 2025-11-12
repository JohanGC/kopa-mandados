// routes/favorites.js - CORREGIDO
import express from 'express';
import Favorite from '../models/Favorite.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// ✅ NUEVA RUTA: Obtener contador de favoritos del usuario
router.get('/user/count', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const count = await Favorite.countDocuments({ 
      usuario: userId 
    });

    console.log(`📊 Contador de favoritos para usuario ${userId}: ${count}`);
    
    res.json({ 
      count: count,
      message: `Tienes ${count} favoritos`
    });
  } catch (error) {
    console.error('❌ Error obteniendo contador de favoritos:', error);
    res.status(500).json({ 
      message: 'Error obteniendo contador de favoritos',
      error: error.message 
    });
  }
});

// ✅ RUTA MEJORADA: Obtener favoritos del usuario con populate
router.get('/user', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log(`🔍 Obteniendo favoritos para usuario: ${userId}`);
    
    const favorites = await Favorite.find({ usuario: userId })
      .populate('usuario', 'nombre email')
      .sort({ createdAt: -1 });

    console.log(`✅ Encontrados ${favorites.length} favoritos`);
    
    res.json(favorites);
  } catch (error) {
    console.error('❌ Error obteniendo favoritos:', error);
    res.status(500).json({ 
      message: 'Error obteniendo favoritos',
      error: error.message 
    });
  }
});

// ✅ RUTA MEJORADA: Agregar a favoritos con validación mejorada
router.post('/', auth, async (req, res) => {
  try {
    const { itemId, tipo } = req.body;
    const userId = req.user.userId;

    // Validaciones
    if (!itemId || !tipo) {
      return res.status(400).json({ 
        message: 'itemId y tipo son requeridos' 
      });
    }

    if (!['offer', 'activity'].includes(tipo)) {
      return res.status(400).json({ 
        message: 'Tipo debe ser "offer" o "activity"' 
      });
    }

    const existingFavorite = await Favorite.findOne({ 
      usuario: userId, 
      itemId, 
      tipo 
    });

    if (existingFavorite) {
      return res.status(400).json({ 
        message: 'Ya está en favoritos',
        favorite: existingFavorite 
      });
    }

    const favorite = new Favorite({
      usuario: userId,
      itemId,
      tipo
    });

    await favorite.save();
    
    // Populate para respuesta
    await favorite.populate('usuario', 'nombre email');
    
    console.log(`✅ Agregado a favoritos: ${tipo} ${itemId}`);
    
    res.status(201).json({
      message: 'Agregado a favoritos correctamente',
      favorite: favorite
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Ya está en favoritos' 
      });
    }
    console.error('❌ Error agregando a favoritos:', error);
    res.status(500).json({ 
      message: 'Error agregando a favoritos',
      error: error.message 
    });
  }
});

// ✅ RUTA MEJORADA: Eliminar de favoritos
router.delete('/', auth, async (req, res) => {
  try {
    const { itemId, tipo } = req.body;
    const userId = req.user.userId;

    if (!itemId || !tipo) {
      return res.status(400).json({ 
        message: 'itemId y tipo son requeridos' 
      });
    }

    const favorite = await Favorite.findOneAndDelete({ 
      usuario: userId, 
      itemId, 
      tipo 
    });

    if (!favorite) {
      return res.status(404).json({ 
        message: 'No encontrado en favoritos' 
      });
    }

    console.log(`🗑️ Eliminado de favoritos: ${tipo} ${itemId}`);
    
    res.json({ 
      message: 'Eliminado de favoritos correctamente',
      deleted: favorite 
    });
  } catch (error) {
    console.error('❌ Error eliminando de favoritos:', error);
    res.status(500).json({ 
      message: 'Error eliminando de favoritos',
      error: error.message 
    });
  }
});

// ✅ RUTA MEJORADA: Eliminar favorito por ID
router.delete('/:id', auth, async (req, res) => {
  try {
    const favorite = await Favorite.findOneAndDelete({
      _id: req.params.id,
      usuario: req.user.userId
    });

    if (!favorite) {
      return res.status(404).json({ 
        message: 'Favorito no encontrado' 
      });
    }

    console.log(`🗑️ Eliminado favorito por ID: ${req.params.id}`);
    
    res.json({ 
      message: 'Favorito eliminado correctamente',
      deleted: favorite 
    });
  } catch (error) {
    console.error('❌ Error eliminando favorito por ID:', error);
    res.status(500).json({ 
      message: 'Error eliminando favorito',
      error: error.message 
    });
  }
});

// ✅ RUTA MEJORADA: Verificar si está en favoritos
router.get('/check', auth, async (req, res) => {
  try {
    const { itemId, tipo } = req.query;
    const userId = req.user.userId;

    if (!itemId || !tipo) {
      return res.status(400).json({ 
        message: 'itemId y tipo son requeridos' 
      });
    }

    const favorite = await Favorite.findOne({ 
      usuario: userId, 
      itemId, 
      tipo 
    });

    console.log(`🔍 Verificando favorito: ${tipo} ${itemId} - ${!!favorite}`);
    
    res.json({ 
      isFavorite: !!favorite,
      favorite: favorite 
    });
  } catch (error) {
    console.error('❌ Error verificando favorito:', error);
    res.status(500).json({ 
      message: 'Error verificando favorito',
      error: error.message 
    });
  }
});

export default router;