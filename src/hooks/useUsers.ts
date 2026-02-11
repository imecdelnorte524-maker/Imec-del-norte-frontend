// src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../api/users";
import { rolesApi } from "../api/roles";
import { QUERY_KEYS } from "../api/keys";
import type { UpdateUsuarioDto } from "../interfaces/UserInterfaces";
import { useSocket } from "../context/SocketContext"; // <-- NUEVO
import { useSocketEvent } from "./useSocketEvent"; // <-- NUEVO

export const useUsers = () => {
  const queryClient = useQueryClient();
  const socket = useSocket(); // <-- NUEVO

  const {
    data: usuarios = [],
    isLoading: loadingUsers,
    error: errorUsers,
  } = useQuery({
    queryKey: [QUERY_KEYS.users],
    queryFn: usersApi.getAllUsers,
  });

  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: [QUERY_KEYS.roles],
    queryFn: rolesApi.getAllRoles,
  });

  // Tiempo real
  useSocketEvent(socket, "users.created", () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] });
  });
  useSocketEvent(socket, "users.updated", () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] });
  });
  useSocketEvent(socket, "users.deleted", () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] });
  });

  // Mutations como ya las tienes
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
    updateUser: (id: number, data: UpdateUsuarioDto) =>
      updateUserMutation.mutateAsync({ id, data }),
    toggleUserStatus: (id: number, isActive: boolean) =>
      toggleStatusMutation.mutateAsync({ id, isActive }),
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.roles] });
    },
  };
};
