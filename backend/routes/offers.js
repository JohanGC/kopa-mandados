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

// Obtener ofertas del usuario actual - ESTA RUTA DEBE IR ANTES DE /:id
router.get('/user/my-offers', auth, async (req, res) => {
  try {
    console.log('Fetching offers for user:', req.user.userId);
    const offers = await Offer.find({ creador: req.user.userId })
      .populate('participantes', 'nombre email')
      .sort({ createdAt: -1 });
    console.log('Found offers:', offers.length);
    res.json(offers);
  } catch (error) {
    console.error('Error in /user/my-offers:', error);
    res.status(500).json({ message: error.message });
  }
});

// Obtener oferta por ID
router.get('/:id', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate('creador', 'nombre empresa telefono email')
      .populate('participantes', 'nombre email');
    
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

// Eliminar oferta
router.delete('/:id', auth, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({ message: 'Oferta no encontrada' });
    }

    // Verificar que el usuario es el creador o un administrador
    if (offer.creador.toString() !== req.user.userId && req.user.rol !== 'administrador') {
      return res.status(403).json({ message: 'No autorizado para eliminar esta oferta' });
    }

    await Offer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Oferta eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Participar en oferta
router.post('/:id/participate', auth, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({ message: 'Oferta no encontrada' });
    }

    if (offer.estado !== 'aprobada') {
      return res.status(400).json({ message: 'La oferta no está disponible' });
    }

    if (offer.maxParticipantes && offer.participantes.length >= offer.maxParticipantes) {
      return res.status(400).json({ message: 'No hay cupos disponibles' });
    }

    // Verificar si ya está participando
    if (offer.participantes.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Ya estás participando en esta oferta' });
    }

    offer.participantes.push(req.user.userId);
    await offer.save();

    res.json({ message: 'Te has inscrito en la oferta exitosamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verificar participación
router.get('/:id/participation', auth, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({ message: 'Oferta no encontrada' });
    }

    const isParticipating = offer.participantes.includes(req.user.userId);
    res.json({ isParticipating });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;