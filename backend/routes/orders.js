import express from 'express';
import Order from '../models/Order.js';
import { auth } from '../middleware/auth.js'; // ✅ Cambiado

const router = express.Router();

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
        estado: 'aceptado'
      },
      { new: true }
    ).populate('solicitante', 'nombre email')
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
      return res.status(404).json({ message: 'Mandado no encontrada' });
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

export default router;