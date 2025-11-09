import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar rutas
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import offerRoutes from './routes/offers.js';
import activityRoutes from './routes/activities.js';
import orderRoutes from './routes/orders.js';
import favoriteRoutes from './routes/favorites.js';
import reviewRoutes from './routes/reviews.js';
// Elimina esta línea duplicada: import favoritesRoutes from './routes/favorites.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/favorites', favoriteRoutes); // Solo una vez
app.use('/api/reviews', reviewRoutes);
// Elimina esta línea duplicada: app.use('/api/favorites', favoritesRoutes);

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend de KopaMandados funcionando!' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kopamandados', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('✅ Conectado a MongoDB');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});