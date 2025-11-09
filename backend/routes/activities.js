import express from 'express';
import Activity from '../models/Activity.js';
import { auth } from '../middleware/auth.js'; // ✅ Cambiado

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

// Obtener actividades del usuario actual - ESTA RUTA DEBE IR ANTES DE /:id
router.get('/user/my-activities', auth, async (req, res) => {
  try {
    console.log('Fetching activities for user:', req.user.userId);
    const activities = await Activity.find({ creador: req.user.userId })
      .populate('participantes', 'nombre email')
      .sort({ createdAt: -1 });
    console.log('Found activities:', activities.length);
    res.json(activities);
  } catch (error) {
    console.error('Error in /user/my-activities:', error);
    res.status(500).json({ message: error.message });
  }
});

// Obtener actividad por ID
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('creador', 'nombre empresa telefono email')
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

// Eliminar actividad
router.delete('/:id', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ message: 'Actividad no encontrada' });
    }

    // Verificar que el usuario es el creador o un administrador
    if (activity.creador.toString() !== req.user.userId && req.user.rol !== 'administrador') {
      return res.status(403).json({ message: 'No autorizado para eliminar esta actividad' });
    }

    await Activity.findByIdAndDelete(req.params.id);
    res.json({ message: 'Actividad eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Registrarse en actividad
router.post('/:id/register', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ message: 'Actividad no encontrada' });
    }

    if (activity.estado !== 'aprobada') {
      return res.status(400).json({ message: 'La actividad no está disponible' });
    }

    if (activity.participantes.length >= activity.maxParticipantes) {
      return res.status(400).json({ message: 'No hay cupos disponibles' });
    }

    // Verificar si ya está registrado
    if (activity.participantes.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Ya estás registrado en esta actividad' });
    }

    activity.participantes.push(req.user.userId);
    await activity.save();

    res.json({ message: 'Te has registrado en la actividad exitosamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verificar registro
router.get('/:id/registration', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ message: 'Actividad no encontrada' });
    }

    const isRegistered = activity.participantes.includes(req.user.userId);
    res.json({ isRegistered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;