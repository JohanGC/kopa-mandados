import express from 'express';
import Offer from '../models/Offer.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Obtener todas las ofertas aprobadas
router.get('/', async (req, res) => {
  try {
    const offers = await Offer.find({ estado: 'aprobada', isActive: true })
      .populate('creador', 'nombre empresa')
      .sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener oferta por ID
router.get('/:id', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate('creador', 'nombre empresa telefono');
    if (!offer) {
      return res.status(404).json({ message: 'Oferta no encontrada' });
    }
    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear oferta (solo oferentes)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'oferente' && req.user.rol !== 'administrador') {
      return res.status(403).json({ message: 'No autorizado para crear ofertas' });
    }

    const offer = new Offer({
      ...req.body,
      creador: req.user.userId
    });

    await offer.save();
    await offer.populate('creador', 'nombre empresa');
    res.status(201).json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Obtener ofertas del usuario (para oferentes)
router.get('/user/my-offers', auth, async (req, res) => {
  try {
    const offers = await Offer.find({ creador: req.user.userId })
      .sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;