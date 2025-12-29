import { useState, useEffect } from 'react';
import { users as usersAPI } from '../api/users';
import type { Usuario, CreateUsuarioDto, UpdateUsuarioDto, Rol } from '../interfaces/UserInterfaces';
import { playErrorSound } from '../utils/sounds';

export const useUsers = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar todos los usuarios
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersAPI.getAllUsers();
      setUsuarios(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar roles
  const loadRoles = async () => {
    try {
      setError(null);
      const rolesData = await usersAPI.getActiveRoles();
      setRoles(rolesData);
    } catch (err: any) {
      console.error('Error cargando roles:', err);
      setError('Error al cargar los roles');
      playErrorSound();
      setRoles([]);
    }
  };

  // Cargar datos al inicializar
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadUsers(), loadRoles()]);
      } catch (err: any) {
        setError(err.message || 'Error al inicializar datos');
        playErrorSound();
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // ✅ CREAR USUARIO - Con recarga automática
  const createUser = async (userData: CreateUsuarioDto) => {
    try {
      setError(null);
      const newUser = await usersAPI.createUser(userData);
      
      // 🔄 RECARGAR lista completa después de crear
      await loadUsers();
      
      return newUser;
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario');
      playErrorSound();
      throw err;
    }
  };

  // ✅ ACTUALIZAR USUARIO - Con recarga automática
  const updateUser = async (id: number, userData: UpdateUsuarioDto) => {
    try {
      setError(null);
      const updatedUser = await usersAPI.updateUser(id, userData);
      
      // 🔄 RECARGAR lista completa después de actualizar
      await loadUsers();
      
      return updatedUser;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar usuario');
      playErrorSound();
      throw err;
    }
  };

  // ✅ CAMBIAR ESTADO - Con recarga automática
  const toggleUserStatus = async (id: number, currentStatus: boolean) => {
    try {
      setError(null);
      let updatedUser;
      
      if (currentStatus) {
        updatedUser = await usersAPI.deactivateUser(id);
      } else {
        updatedUser = await usersAPI.activateUser(id);
      }
      
      // 🔄 RECARGAR lista completa después de cambiar estado
      await loadUsers();
      
      return updatedUser;
    } catch (err: any) {
      setError(err.message || 'Error al cambiar estado del usuario');
      playErrorSound();
      throw err;
    }
  };

  const refreshUsers = async () => {
    await loadUsers();
  };

  const refreshRoles = async () => {
    await loadRoles();
  };

  return {
    usuarios,
    roles,
    loading,
    error,
    refreshUsers,
    refreshRoles,
    createUser,
    updateUser,
    toggleUserStatus
  };
};