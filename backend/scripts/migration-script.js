// migration-script.js (ejecutar una vez)
import mongoose from 'mongoose';
import Order from './models/Order.js';

const migrateOrders = async () => {
  try {
    // Actualizar mandados aceptados para tener fechaAceptado
    await Order.updateMany(
      { estado: 'aceptado', fechaAceptado: { $exists: false } },
      { $set: { fechaAceptado: new Date() } }
    );

    // Actualizar mandados completados para tener fechaCompletado
    await Order.updateMany(
      { estado: 'completado', fechaCompletado: { $exists: false } },
      { $set: { fechaCompletado: new Date() } }
    );

    console.log('Migración completada exitosamente');
  } catch (error) {
    console.error('Error en migración:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Ejecutar migración
migrateOrders();