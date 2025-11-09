import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import axios from 'axios';

const UsersManagement = () => {
  const { API_URL } = useAuth();
  const { addNotification } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      addNotification('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (userData) => {
    try {
      await axios.put(`${API_URL}/users/${editingUser._id}`, userData);
      addNotification('Usuario actualizado exitosamente', 'success');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      addNotification('Error al actualizar usuario', 'error');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.put(`${API_URL}/users/${userId}`, { isActive: !currentStatus });
      addNotification(`Usuario ${!currentStatus ? 'activado' : 'desactivado'}`, 'success');
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      addNotification('Error al cambiar estado del usuario', 'error');
    }
  };

  const getRoleBadge = (rol) => {
    const roles = {
      administrador: 'danger',
      oferente: 'warning',
      domiciliario: 'success',
      usuario: 'info'
    };
    return `badge bg-${roles[rol]}`;
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow">
      <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
        <h4 className="mb-0">👥 Gestión de Usuarios</h4>
        <span className="badge bg-light text-dark">{users.length} usuarios</span>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Teléfono</th>
                <th>Empresa</th>
                <th>Registro</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>
                    <strong>{user.nombre}</strong>
                    {user.rol === 'administrador' && ' 👑'}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={getRoleBadge(user.rol)}>
                      {user.rol}
                    </span>
                  </td>
                  <td>{user.telefono || 'N/A'}</td>
                  <td>{user.empresa || 'N/A'}</td>
                  <td>
                    {new Date(user.fechaRegistro).toLocaleDateString('es-ES')}
                  </td>
                  <td>
                    <span className={`badge ${user.isActive ? 'bg-success' : 'bg-danger'}`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => handleEditUser(user)}
                        title="Editar usuario"
                      >
                        ✏️
                      </button>
                      <button
                        className={`btn ${user.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                        onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                        title={user.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {user.isActive ? '⏸️' : '▶️'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-4">
            <p className="text-muted">No hay usuarios registrados</p>
          </div>
        )}
      </div>

      {/* Modal de Edición */}
      {showEditModal && editingUser && (
        <EditUserModal
          user={editingUser}
          onSave={handleUpdateUser}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
};

// Modal para editar usuario
const EditUserModal = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    telefono: user.telefono || '',
    empresa: user.empresa || '',
    direccion: user.direccion || '',
    isActive: user.isActive
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">✏️ Editar Usuario: {user.nombre}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Nombre Completo *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Rol *</label>
                    <select
                      className="form-select"
                      name="rol"
                      value={formData.rol}
                      onChange={handleChange}
                      required
                    >
                      <option value="usuario">Usuario</option>
                      <option value="oferente">Oferente</option>
                      <option value="domiciliario">Domiciliario</option>
                      <option value="administrador">Administrador</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {formData.rol === 'oferente' && (
                <div className="mb-3">
                  <label className="form-label">Empresa</label>
                  <input
                    type="text"
                    className="form-control"
                    name="empresa"
                    value={formData.empresa}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  className="form-control"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                />
              </div>

              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                <label className="form-check-label">
                  Usuario activo en el sistema
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;