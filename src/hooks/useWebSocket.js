// src/hooks/useWebSocket.js
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const useWebSocket = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [estaConectado, setEstaConectado] = useState(false);
  const [socket, setSocket] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    // Conectar al servidor Socket.io
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'] // Soporte para diferentes transportes
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Conectado a Socket.io');
      setEstaConectado(true);
      
      // Autenticar con el servidor
      newSocket.emit('auth', {
        userId: currentUser.id,
        userRole: currentUser.rol
      });

      console.log(`🔐 Autenticado como ${currentUser.rol}`);
    });

    newSocket.on('notificacion', (data) => {
      console.log('📨 Nueva notificación recibida:', data);
      
      const nuevaNotificacion = {
        id: Date.now(),
        ...data,
        timestamp: new Date(data.timestamp || Date.now())
      };

      setNotificaciones(prev => [...prev, nuevaNotificacion]);

      // Mostrar notificación del sistema
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.titulo || 'Nueva notificación', {
          body: data.mensaje,
          icon: '/images/logo192.png'
        });
      }

      // Emitir evento personalizado para otros componentes
      window.dispatchEvent(new CustomEvent('socketNotificacion', { 
        detail: nuevaNotificacion 
      }));
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Desconectado de Socket.io');
      setEstaConectado(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Error de conexión Socket.io:', error);
      setEstaConectado(false);
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [currentUser]);

  const enviarMensaje = (tipo, datos) => {
    if (socket && estaConectado) {
      socket.emit(tipo, datos);
      return true;
    }
    console.warn('⚠️ Socket no conectado, no se puede enviar mensaje');
    return false;
  };

  const limpiarNotificaciones = () => {
    setNotificaciones([]);
  };

  return {
    notificaciones,
    estaConectado,
    enviarMensaje,
    limpiarNotificaciones,
    socket
  };
};

export default useWebSocket;