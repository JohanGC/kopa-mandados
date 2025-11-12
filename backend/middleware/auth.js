// middleware/auth.js - VERSIÓN CORREGIDA
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Acceso denegado. No hay token.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // ✅ CORREGIDO: Buscar usuario y validar estructura
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token no válido.' });
    }

    // ✅ CORREGIDO: Asegurar que el objeto user tenga estructura consistente
    req.user = {
      userId: user._id.toString(),
      _id: user._id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      empresa: user.empresa || '',
      telefono: user.telefono || '',
      direccion: user.direccion || '',
      placaVehiculo: user.placaVehiculo || '',
      tipoVehiculo: user.tipoVehiculo || '',
      ubicacionActual: user.ubicacionActual || null,
      disponible: user.disponible !== undefined ? user.disponible : true,
      isActive: user.isActive !== undefined ? user.isActive : true,
      fechaRegistro: user.fechaRegistro || user.createdAt
    };

    next();
  } catch (error) {
    console.error('❌ Error en middleware auth:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token no válido.' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado.' });
    }
    
    res.status(401).json({ message: 'Token no válido.' });
  }
};