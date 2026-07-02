// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Importar rutas
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import offerRoutes from './routes/offers.js';
import activityRoutes from './routes/activities.js';
import orderRoutes from './routes/orders.js';
import favoriteRoutes from './routes/favorites.js';
import reviewRoutes from './routes/reviews.js';

dotenv.config();

const app = express();
const server = createServer(app);

// Configuración de CORS para Express
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json());

// Configuración de Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Almacenar conexiones de usuarios
const connectedUsers = new Map();

// Configuración de Socket.io
io.on('connection', (socket) => {
  console.log('✅ Usuario conectado via Socket.io:', socket.id);

  // Autenticar usuario
  socket.on('auth', (userData) => {
    const { userId, userRole } = userData;
    socket.userId = userId;
    socket.userRole = userRole;
    
    connectedUsers.set(userId, socket);
    console.log(`🔐 Usuario ${userId} (${userRole}) autenticado`);

    // Si es domiciliario, unirse a la sala de domiciliarios
    if (userRole === 'domiciliario') {
      socket.join('domiciliarios');
      console.log(`🛵 Domiciliario ${userId} unido a la sala`);
    }
  });

  // Manejar desconexión
  socket.on('disconnect', () => {
    console.log('🔌 Usuario desconectado:', socket.id);
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
    }
  });

  // Manejar errores
  socket.on('error', (error) => {
    console.error('❌ Error de Socket.io:', error);
  });
});

// Función para notificar a todos los domiciliarios
const notificarDomiciliarios = (notificacion) => {
  io.to('domiciliarios').emit('notificacion', notificacion);
  console.log('📤 Notificación enviada a domiciliarios:', notificacion);
  return true;
};

// Función para notificar a un usuario específico
const notificarUsuario = (userId, notificacion) => {
  const userSocket = connectedUsers.get(userId);
  if (userSocket) {
    userSocket.emit('notificacion', notificacion);
    console.log(`📤 Notificación enviada a usuario ${userId}:`, notificacion);
    return true;
  }
  console.log(`⚠️ Usuario ${userId} no conectado`);
  return false;
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend de KopaMandados funcionando!',
    websocket: 'Socket.io activo',
    connectedUsers: connectedUsers.size
  });
});

// Ruta para probar notificaciones
app.post('/api/notificaciones/test', (req, res) => {
  const { userId, mensaje } = req.body;
  
  if (userId) {
    notificarUsuario(userId, {
      tipo: 'test',
      titulo: '🔔 Notificación de prueba',
      mensaje: mensaje || 'Esta es una notificación de prueba',
      timestamp: new Date()
    });
  } else {
    notificarDomiciliarios({
      tipo: 'test',
      titulo: '🔔 Notificación general',
      mensaje: mensaje || 'Notificación para todos los domiciliarios',
      timestamp: new Date()
    });
  }
  
  res.json({ 
    message: 'Notificación enviada',
    enviada: true
  });
});

// MongoDB Connection

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('❌ Error: La variable MONGODB_URI no está definida en el entorno.');
  process.exit(1); // Detiene la app si falta la variable crucial
}

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas con éxito'))
  .catch((err) => {
    console.error('❌ Error de conexión a MongoDB:', err.message);
    process.exit(1);
  });

const db = mongoose.connection;

// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kopamandados', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// const db = mongoose.connection;
// db.on('error', console.error.bind(console, '❌ Error de conexión a MongoDB:'));
// db.once('open', () => {
//   console.log('✅ Conectado a MongoDB');
// });

// const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔌 Socket.io disponible en http://localhost:${PORT}`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Exportar las funciones para usar en otras rutas
export { notificarDomiciliarios, notificarUsuario };