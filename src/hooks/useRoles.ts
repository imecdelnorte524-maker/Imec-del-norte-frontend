import { useState, useEffect } from 'react';
import { users } from '../api/users';
import type { Rol, CreateRolDto, UpdateRolDto } from '../interfaces/UserInterfaces';

export const useRoles = () => {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar todos los roles
  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const rolesData = await users.getAllRoles();
      setRoles(rolesData);
    } catch (err: any) {
      setError(err.message);
      console.error('Error cargando roles:', err);
    } finally {
      setLoading(false);
    }
  };

  // Crear rol y recargar lista
  const createRole = async (roleData: CreateRolDto): Promise<Rol> => {
    try {
      setError(null);
      const newRole = await users.createRole(roleData);
      await loadRoles();
      return newRole;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Actualizar rol y recargar lista
  const updateRole = async (id: number, roleData: UpdateRolDto): Promise<Rol> => {
    try {
      setError(null);
      const updatedRole = await users.updateRole(id, roleData);
      await loadRoles();
      return updatedRole;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Eliminar rol y recargar lista
  const deleteRole = async (id: number): Promise<void> => {
    try {
      setError(null);
      await users.deleteRole(id);
      await loadRoles();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Cargar roles al montar el componente
  useEffect(() => {
    loadRoles();
  }, []);

  return {
    roles,
    loading,
    error,
    createRole,
    updateRole,
    deleteRole,
    refreshRoles: loadRoles
  };
};