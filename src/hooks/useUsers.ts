import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../api/users";
import { rolesApi } from "../api/roles";
import { QUERY_KEYS } from "../api/keys";
import type { UpdateUsuarioDto } from "../interfaces/UserInterfaces";

export const useUsers = () => {
  const queryClient = useQueryClient();

  // 1. Obtener Usuarios
  const { data: usuarios = [], isLoading: loadingUsers, error: errorUsers } = useQuery({
    queryKey: [QUERY_KEYS.users],
    queryFn: usersApi.getAllUsers,
  });

  // 2. Obtener Roles (necesario para formularios de usuarios)
  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: [QUERY_KEYS.roles],
    queryFn: rolesApi.getAllRoles,
  });

  // --- MUTATIONS ---

  const createUserMutation = useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUsuarioDto }) =>
      usersApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      isActive ? usersApi.deactivateUser(id) : usersApi.activateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] });
    },
  });

  const loading = loadingUsers || loadingRoles;
  const error = errorUsers ? (errorUsers as Error).message : null;

  return {
    usuarios,
    roles,
    loading,
    error,
    
    createUser: createUserMutation.mutateAsync,
    updateUser: (id: number, data: UpdateUsuarioDto) => updateUserMutation.mutateAsync({ id, data }),
    toggleUserStatus: (id: number, isActive: boolean) => toggleStatusMutation.mutateAsync({ id, isActive }),
    
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.roles] });
    },
  };
};