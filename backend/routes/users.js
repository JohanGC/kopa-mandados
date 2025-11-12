// routes/users.js
import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Obtener todos los usuarios (solo admin)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener usuario por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Solo el propio usuario o admin puede ver los datos
    if (req.user.rol !== 'administrador' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Actualizar usuario
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'administrador' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Eliminar usuario
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// =============================================
// NUEVAS RUTAS PARA DOMICILIARIOS Y UBICACIÓN
// =============================================

// Obtener domiciliarios disponibles - RUTA CORREGIDA
router.get('/domiciliarios/disponibles', async (req, res) => {
  try {
    console.log('📡 Solicitando domiciliarios disponibles...');
    
    const domiciliarios = await User.find({
      rol: 'domiciliario',
      disponible: true,
      isActive: true,
      'ubicacionActual.lat': { $exists: true, $ne: null },
      'ubicacionActual.lng': { $exists: true, $ne: null }
    }).select('-password -email -empresa -direccion -fechaRegistro');
    
    console.log(`✅ Encontrados ${domiciliarios.length} domiciliarios disponibles`);
    
    // Asegurarse de que la respuesta sea siempre un array
    res.json(domiciliarios || []);
  } catch (error) {
    console.error('❌ Error en /domiciliarios/disponibles:', error);
    // En caso de error, devolver array vacío para no romper el frontend
    res.status(500).json([]);
  }
});

// Obtener todos los domiciliarios (para admin)
router.get('/domiciliarios/todos', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const domiciliarios = await User.find({
      rol: 'domiciliario'
    }).select('-password');
    
    res.json(domiciliarios);
  } catch (error) {
    console.error('Error obteniendo todos los domiciliarios:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Actualizar ubicación del usuario (para domiciliarios)
router.put('/ubicacion/actual', auth, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    console.log('📍 Actualizando ubicación para usuario:', req.user.userId, { lat, lng });
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitud y longitud son requeridas' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        ubicacionActual: {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          ultimaActualizacion: new Date()
        }
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    console.log('✅ Ubicación actualizada para:', user.nombre);
    res.json(user);
  } catch (error) {
    console.error('❌ Error en /ubicacion/actual:', error);
    res.status(400).json({ 
      message: 'Error actualizando ubicación',
      error: error.message 
    });
  }
});

// Actualizar disponibilidad del domiciliario
router.put('/disponibilidad/actual', auth, async (req, res) => {
  try {
    const { disponible } = req.body;
    
    // Verificar que el usuario es domiciliario
    const user = await User.findById(req.user.userId);
    if (!user || user.rol !== 'domiciliario') {
      return res.status(403).json({ message: 'Solo los domiciliarios pueden actualizar disponibilidad' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { disponible: disponible },
      { new: true }
    ).select('-password');
    
    res.json({
      message: `Disponibilidad ${disponible ? 'activada' : 'desactivada'}`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error actualizando disponibilidad:', error);
    res.status(400).json({ 
      message: 'Error actualizando disponibilidad',
      error: error.message 
    });
  }
});

// Obtener estadísticas de domiciliarios
router.get('/domiciliarios/estadisticas', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const totalDomiciliarios = await User.countDocuments({ rol: 'domiciliario' });
    const domiciliariosDisponibles = await User.countDocuments({ 
      rol: 'domiciliario', 
      disponible: true 
    });
    const domiciliariosActivos = await User.countDocuments({
      rol: 'domiciliario',
      'ubicacionActual.ultimaActualizacion': { 
        $gte: new Date(Date.now() - 30 * 60 * 1000) // Últimos 30 minutos
      }
    });

    res.json({
      total: totalDomiciliarios,
      disponibles: domiciliariosDisponibles,
      activos: domiciliariosActivos
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;