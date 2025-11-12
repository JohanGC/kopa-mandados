// routes/orders.js
import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// =============================================
// RUTAS EXISTENTES (NO MODIFICAR)
// =============================================

// Obtener todos los mandados
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({ isActive: true })
      .populate('solicitante', 'nombre email telefono')
      .populate('ejecutante', 'nombre email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear mandado
router.post('/', auth, async (req, res) => {
  try {
    const order = new Order({
      ...req.body,
      solicitante: req.user.userId
    });

    await order.save();
    await order.populate('solicitante', 'nombre email');

    // 🔔 Enviar notificación a domiciliarios via Socket.io
    try {
      const { notificarDomiciliarios } = await import('../server.js');
      
      notificarDomiciliarios({
        tipo: 'nuevo_mandado',
        titulo: '📦 Nuevo mandado disponible',
        mensaje: `Nuevo mandado de ${order.categoria} por $${order.precioOfertado.toLocaleString()}`,
        orderId: order._id,
        categoria: order.categoria,
        precio: order.precioOfertado,
        timestamp: new Date()
      });
    } catch (wsError) {
      console.log('⚠️ No se pudo enviar notificación Socket.io:', wsError.message);
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Aceptar mandado (solo domiciliarios)
router.put('/:id/accept', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'domiciliario') {
      return res.status(403).json({ message: 'Solo domiciliarios pueden aceptar mandados' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        ejecutante: req.user.userId,
        estado: 'aceptado',
        fechaAceptado: new Date()
      },
      { new: true }
    ).populate('solicitante', 'nombre email telefono')
     .populate('ejecutante', 'nombre email');

    if (!order) {
      return res.status(404).json({ message: 'Mandado no encontrado' });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Obtener mandado por ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('solicitante', 'nombre telefono email')
      .populate('ejecutante', 'nombre telefono email');
    
    if (!order) {
      return res.status(404).json({ message: 'Mandado no encontrado' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar estado del mandado
router.put('/:id', auth, async (req, res) => {
  try {
    const { estado } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    ).populate('solicitante', 'nombre telefono email')
     .populate('ejecutante', 'nombre telefono email');

    if (!order) {
      return res.status(404).json({ message: 'Mandado no encontrado' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================
// NUEVAS RUTAS PARA GESTIÓN DE DOMICILIARIOS
// =============================================

// Obtener mandados para domiciliarios según tipo
router.get('/domiciliario/:tipo', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'domiciliario') {
      return res.status(403).json({ message: 'Solo domiciliarios pueden acceder' });
    }

    const { tipo } = req.params;
    let query = {};

    switch (tipo) {
      case 'disponibles':
        query = { 
          estado: 'pendiente', 
          isActive: true,
          fechaLimite: { $gt: new Date() }
        };
        break;
      case 'activos':
        query = { 
          ejecutante: req.user.userId,
          estado: { $in: ['aceptado', 'en_camino', 'en_proceso'] },
          isActive: true
        };
        break;
      case 'historial':
        query = { 
          ejecutante: req.user.userId,
          estado: { $in: ['completado', 'cancelado'] }
        };
        break;
      default:
        return res.status(400).json({ message: 'Tipo no válido' });
    }

    const orders = await Order.find(query)
      .populate('solicitante', 'nombre telefono email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error obteniendo mandados para domiciliario:', error);
    res.status(500).json({ message: error.message });
  }
});

// Actualizar estado del mandado (para domiciliarios)
router.put('/:id/estado', auth, async (req, res) => {
  try {
    const { estado } = req.body;
    const orderId = req.params.id;

    // Verificar que el domiciliario es el ejecutante del mandado
    const order = await Order.findOne({
      _id: orderId,
      ejecutante: req.user.userId
    });

    if (!order) {
      return res.status(404).json({ message: 'Mandado no encontrado o no autorizado' });
    }

    // Validar transición de estado
    const estadosValidos = ['pendiente', 'aceptado', 'en_camino', 'en_proceso', 'completado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ message: 'Estado no válido' });
    }

    // Actualizar estado y fecha correspondiente
    const updateData = { estado };
    
    if (estado === 'en_camino' && !order.fechaEnCamino) {
      updateData.fechaEnCamino = new Date();
    } else if (estado === 'completado' && !order.fechaCompletado) {
      updateData.fechaCompletado = new Date();
    } else if (estado === 'cancelado') {
      // Si se cancela, liberar el domiciliario
      updateData.ejecutante = null;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    ).populate('solicitante', 'nombre telefono email')
     .populate('ejecutante', 'nombre telefono');

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ message: error.message });
  }
});

// Obtener estadísticas del domiciliario
router.get('/domiciliario/estadisticas/resumen', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'domiciliario') {
      return res.status(403).json({ message: 'Solo domiciliarios pueden acceder' });
    }

    const domiciliarioId = req.user.userId;

    // Contar mandados por estado
    const totalCompletados = await Order.countDocuments({
      ejecutante: domiciliarioId,
      estado: 'completado'
    });

    const totalActivos = await Order.countDocuments({
      ejecutante: domiciliarioId,
      estado: { $in: ['aceptado', 'en_camino', 'en_proceso'] }
    });

    const totalCancelados = await Order.countDocuments({
      ejecutante: domiciliarioId,
      estado: 'cancelado'
    });

    // Calcular ingresos totales
    const ingresosTotales = await Order.aggregate([
      {
        $match: {
          ejecutante: new mongoose.Types.ObjectId(domiciliarioId),
          estado: 'completado'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$precioOfertado' }
        }
      }
    ]);

    // Calcular calificación promedio
    const calificacionPromedio = await Order.aggregate([
      {
        $match: {
          ejecutante: new mongoose.Types.ObjectId(domiciliarioId),
          estado: 'completado',
          calificacion: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          promedio: { $avg: '$calificacion' },
          totalCalificaciones: { $sum: 1 }
        }
      }
    ]);

    // Mandados del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const mandadosEsteMes = await Order.countDocuments({
      ejecutante: domiciliarioId,
      estado: 'completado',
      fechaCompletado: { $gte: inicioMes }
    });

    res.json({
      resumen: {
        totalCompletados,
        totalActivos,
        totalCancelados,
        mandadosEsteMes
      },
      finanzas: {
        ingresosTotales: ingresosTotales[0]?.total || 0,
        ingresosEsteMes: await calcularIngresosMes(domiciliarioId, inicioMes)
      },
      reputacion: {
        calificacionPromedio: calificacionPromedio[0]?.promedio?.toFixed(1) || '0.0',
        totalCalificaciones: calificacionPromedio[0]?.totalCalificaciones || 0
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ message: error.message });
  }
});

// Función auxiliar para calcular ingresos del mes
async function calcularIngresosMes(domiciliarioId, inicioMes) {
  try {
    const ingresosMes = await Order.aggregate([
      {
        $match: {
          ejecutante: new mongoose.Types.ObjectId(domiciliarioId),
          estado: 'completado',
          fechaCompletado: { $gte: inicioMes }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$precioOfertado' }
        }
      }
    ]);
    
    return ingresosMes[0]?.total || 0;
  } catch (error) {
    console.error('Error calculando ingresos del mes:', error);
    return 0;
  }
}

// Obtener mandados recientes del domiciliario (para dashboard)
router.get('/domiciliario/recientes', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'domiciliario') {
      return res.status(403).json({ message: 'Solo domiciliarios pueden acceder' });
    }

    const orders = await Order.find({
      ejecutante: req.user.userId
    })
      .populate('solicitante', 'nombre telefono')
      .sort({ updatedAt: -1 })
      .limit(5);

    res.json(orders);
  } catch (error) {
    console.error('Error obteniendo mandados recientes:', error);
    res.status(500).json({ message: error.message });
  }
});

// Cancelar mandado (por domiciliario)
router.put('/:id/cancelar', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'domiciliario') {
      return res.status(403).json({ message: 'Solo domiciliarios pueden cancelar mandados' });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      ejecutante: req.user.userId,
      estado: { $in: ['aceptado', 'en_camino', 'en_proceso'] }
    });

    if (!order) {
      return res.status(404).json({ message: 'Mandado no encontrado o no se puede cancelar' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        estado: 'cancelado',
        ejecutante: null // Liberar el domiciliario
      },
      { new: true }
    ).populate('solicitante', 'nombre telefono email');

    res.json({
      message: 'Mandado cancelado exitosamente',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error cancelando mandado:', error);
    res.status(500).json({ message: error.message });
  }
});

// Obtener mandados disponibles cerca (usando ubicación)
router.get('/domiciliario/cercanos', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'domiciliario') {
      return res.status(403).json({ message: 'Solo domiciliarios pueden acceder' });
    }

    const { lat, lng, radio = 5 } = req.query; // radio en kilómetros

    if (!lat || !lng) {
      // Si no hay coordenadas, devolver todos los disponibles
      const orders = await Order.find({
        estado: 'pendiente',
        isActive: true,
        fechaLimite: { $gt: new Date() }
      })
        .populate('solicitante', 'nombre telefono')
        .sort({ createdAt: -1 })
        .limit(20);

      return res.json(orders);
    }

    // Aquí podrías implementar búsqueda por proximidad si tienes coordenadas en los mandados
    const orders = await Order.find({
      estado: 'pendiente',
      isActive: true,
      fechaLimite: { $gt: new Date() }
    })
      .populate('solicitante', 'nombre telefono')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(orders);
  } catch (error) {
    console.error('Error obteniendo mandados cercanos:', error);
    res.status(500).json({ message: error.message });
  }
});
// Calificar mandado como solicitante
router.put('/:id/calificar/solicitante', auth, async (req, res) => {
  try {
    const { calificacion, comentario } = req.body;
    const orderId = req.params.id;

    const order = await Order.findOne({
      _id: orderId,
      solicitante: req.user.userId,
      estado: 'completado'
    });

    if (!order) {
      return res.status(404).json({ message: 'Mandado no encontrado o no autorizado' });
    }

    await order.calificarComoSolicitante(calificacion, comentario);
    
    res.json({
      message: 'Calificación enviada exitosamente',
      order: await Order.findById(orderId)
        .populate('solicitante', 'nombre telefono email')
        .populate('ejecutante', 'nombre telefono email')
    });
  } catch (error) {
    console.error('Error calificando como solicitante:', error);
    res.status(500).json({ message: error.message });
  }
});

// Calificar mandado como domiciliario
router.put('/:id/calificar/domiciliario', auth, async (req, res) => {
  try {
    const { calificacion, comentario } = req.body;
    const orderId = req.params.id;

    const order = await Order.findOne({
      _id: orderId,
      ejecutante: req.user.userId,
      estado: 'completado'
    });

    if (!order) {
      return res.status(404).json({ message: 'Mandado no encontrado o no autorizado' });
    }

    await order.calificarComoDomiciliario(calificacion, comentario);
    
    res.json({
      message: 'Calificación enviada exitosamente',
      order: await Order.findById(orderId)
        .populate('solicitante', 'nombre telefono email')
        .populate('ejecutante', 'nombre telefono email')
    });
  } catch (error) {
    console.error('Error calificando como domiciliario:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;