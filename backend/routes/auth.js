import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Registro
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, rol, empresa, telefono, direccion } = req.body;

    console.log('📝 Datos recibidos en registro:', { nombre, email, rol, empresa, telefono, direccion });

    // Validaciones básicas
    if (!nombre || !email || !password || !telefono || !direccion) {
      return res.status(400).json({ 
        message: 'Todos los campos obligatorios deben ser llenados',
        camposFaltantes: {
          nombre: !nombre,
          email: !email,
          password: !password,
          telefono: !telefono,
          direccion: !direccion
        }
      });
    }

    // Validación específica para oferentes
    if (rol === 'oferente' && (!empresa || empresa.trim() === '')) {
      return res.status(400).json({ 
        message: 'El campo empresa es requerido para oferentes' 
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Ya existe un usuario registrado con este email' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario con datos limpios
    const userData = {
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      rol: rol || 'usuario',
      telefono: telefono.trim(),
      direccion: direccion.trim()
    };

    // Solo agregar empresa si es oferente y está presente
    if (rol === 'oferente' && empresa) {
      userData.empresa = empresa.trim();
    }

    const user = new User(userData);
    await user.save();

    // Generar token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        rol: user.rol 
      },
      process.env.JWT_SECRET || 'fallback_secret_desarrollo',
      { expiresIn: '24h' }
    );

    console.log('✅ Usuario registrado exitosamente:', user.email);

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        empresa: user.empresa,
        telefono: user.telefono
      }
    });

  } catch (error) {
    console.error('❌ Error en registro:', error);
    
    // Manejar errores de MongoDB
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Error de validación', 
        errors 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'El email ya está registrado' 
      });
    }

    res.status(500).json({ 
      message: 'Error interno del servidor', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Contacte al administrador'
    });
  }
});

// Login (ya está correcto)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar usuario
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // Verificar password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // Generar token
    const token = jwt.sign(
      { userId: user._id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET || 'fallback_secret_desarrollo',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        empresa: user.empresa
      }
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ 
      message: 'Error en el servidor', 
      error: error.message 
    });
  }
});

export default router;