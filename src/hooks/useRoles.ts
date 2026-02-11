// src/hooks/useRoles.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesApi } from "../api/roles";
import { QUERY_KEYS } from "../api/keys";
import type { UpdateRolDto } from "../interfaces/RolesInterfaces";
import { useSocket } from "../context/SocketContext"; // <-- NUEVO
import { useSocketEvent } from "./useSocketEvent"; // <-- NUEVO

export const useRoles = () => {
  const queryClient = useQueryClient();
  const socket = useSocket(); // <-- NUEVO

  const {
    data: roles = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.roles],
    queryFn: rolesApi.getAllRoles,
  });

  // Tiempo real
  useSocketEvent(socket, "roles.created", () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.roles] });
  });
  useSocketEvent(socket, "roles.updated", () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.roles] });
  });
  useSocketEvent(socket, "roles.deleted", () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.roles] });
  });

  const createRoleMutation = useMutation({
    mutationFn: rolesApi.createRole,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.roles] }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRolDto }) =>
      rolesApi.updateRole(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.roles] }),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: rolesApi.deleteRole,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.roles] }),
  });

  return {
    roles,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    createRole: createRoleMutation.mutateAsync,
    updateRole: (id: number, data: UpdateRolDto) =>
      updateRoleMutation.mutateAsync({ id, data }),
    deleteRole: deleteRoleMutation.mutateAsync,
    refreshRoles: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.roles] }),
  };
};
