import express from 'express';
import Activity from '../models/Activity.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Obtener todas las actividades aprobadas
router.get('/', async (req, res) => {
  try {
    const activities = await Activity.find({ estado: 'aprobada', isActive: true })
      .populate('creador', 'nombre empresa')
      .sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener actividad por ID
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('creador', 'nombre empresa telefono')
      .populate('participantes', 'nombre email');
    if (!activity) {
      return res.status(404).json({ message: 'Actividad no encontrada' });
    }
    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear actividad (solo oferentes)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'oferente' && req.user.rol !== 'administrador') {
      return res.status(403).json({ message: 'No autorizado para crear actividades' });
    }

    const activity = new Activity({
      ...req.body,
      creador: req.user.userId
    });

    await activity.save();
    await activity.populate('creador', 'nombre empresa');
    res.status(201).json(activity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;