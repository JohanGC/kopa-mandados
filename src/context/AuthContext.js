// AuthContext.js - VERSIÓN CORREGIDA Y MEJORADA
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ CORREGIDO: URLs base correctas
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const API_URL = `${API_BASE_URL}/api`;

  // Configurar axios por defecto
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    axios.defaults.baseURL = API_BASE_URL;
  }, [API_BASE_URL]);

  // ✅ CORREGIDO: Verificar autenticación con el servidor
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Verificar token con el servidor
        const response = await axios.get(`${API_URL}/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.valid) {
          const userData = response.data.user;
          const normalizedUser = normalizeUserData(userData);
          
          setCurrentUser(normalizedUser);
          localStorage.setItem('user', JSON.stringify(normalizedUser));
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          console.log('✅ Usuario verificado con servidor:', normalizedUser);
        } else {
          // Token inválido
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
        }
      } catch (error) {
        console.error('❌ Error verificando autenticación:', error);
        
        // Si falla la verificación con servidor, intentar con datos locales
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            const normalizedUser = normalizeUserData(userData);
            setCurrentUser(normalizedUser);
            console.log('⚠️ Usando datos locales (fallback):', normalizedUser);
          } catch (parseError) {
            console.error('❌ Error parseando usuario local:', parseError);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
        }
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [API_URL]);

  // ✅ FUNCIÓN: Normalizar datos del usuario
  const normalizeUserData = (userData) => {
    // Asegurar compatibilidad con diferentes estructuras de respuesta
    return {
      _id: userData._id || userData.userId || userData.id || '',
      nombre: userData.nombre || userData.name || 'Usuario',
      email: userData.email || '',
      // ✅ CRÍTICO: Compatibilidad con 'rol' y 'role'
      rol: userData.rol || userData.role || 'usuario',
      role: userData.role || userData.rol || 'usuario', // Doble asignación para compatibilidad
      empresa: userData.empresa || userData.company || '',
      telefono: userData.telefono || userData.phone || '',
      direccion: userData.direccion || userData.address || '',
      placaVehiculo: userData.placaVehiculo || userData.vehiclePlate || '',
      tipoVehiculo: userData.tipoVehiculo || userData.vehicleType || '',
      ubicacionActual: userData.ubicacionActual || userData.currentLocation || null,
      disponible: userData.disponible !== undefined ? userData.disponible : true,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      fechaRegistro: userData.fechaRegistro || userData.createdAt || userData.registrationDate || new Date(),
      // Campos adicionales para compatibilidad
      ...userData
    };
  };

  const login = async (email, password) => {
    try {
      console.log('🔑 Intentando login con:', { email });
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Respuesta de login inválida');
      }

      const normalizedUser = normalizeUserData(user);
      
      // Guardar en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      // Configurar axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Actualizar estado
      setCurrentUser(normalizedUser);
      
      console.log('✅ Login exitoso:', normalizedUser);
      return { success: true, user: normalizedUser };
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      let message = 'Error en el login';
      
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      } else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        message = 'Error de conexión. Verifica tu internet.';
      }
      
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Intentando registro con:', userData);
      
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      const { token, user } = response.data;
      
      const normalizedUser = normalizeUserData(user);
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setCurrentUser(normalizedUser);
      
      console.log('✅ Registro exitoso:', normalizedUser);
      return { success: true, user: normalizedUser };
    } catch (error) {
      console.error('❌ Error en registro:', error);
      
      let message = 'Error en el registro';
      
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.data?.errors) {
        message = error.response.data.errors.join(', ');
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      } else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        message = 'Error de conexión. Verifica tu internet.';
      }
      
      return { success: false, message };
    }
  };

  const logout = () => {
    console.log('🚪 Cerrando sesión');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    
    // Opcional: Redirigir a login
    window.location.href = '/login';
  };

  // ✅ MEJORADO: Obtener usuario de forma segura
  const getCurrentUser = () => {
    return currentUser;
  };

  // ✅ MEJORADO: Verificar autenticación
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!(token && currentUser);
  };

  // ✅ NUEVA FUNCIÓN: Actualizar datos del usuario
  const updateUser = (updatedData) => {
    const normalizedUser = normalizeUserData({
      ...currentUser,
      ...updatedData
    });
    
    setCurrentUser(normalizedUser);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
  };

  // ✅ NUEVA FUNCIÓN: Refrescar datos del usuario desde el servidor
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.valid) {
        const userData = response.data.user;
        const normalizedUser = normalizeUserData(userData);
        
        setCurrentUser(normalizedUser);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        return normalizedUser;
      }
    } catch (error) {
      console.error('❌ Error refrescando usuario:', error);
    }
  };

  const value = {
    // ✅ CORREGIDO: Usar 'user' en lugar de 'currentUser' para compatibilidad
    user: currentUser,
    currentUser, // También mantener currentUser por compatibilidad
    login,
    register,
    logout,
    getCurrentUser,
    updateUser,
    refreshUser,
    isAuthenticated: isAuthenticated(),
    loading,
    API_URL,
    API_BASE_URL
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};