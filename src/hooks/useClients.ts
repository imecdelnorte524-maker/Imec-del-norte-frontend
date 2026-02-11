// src/hooks/useClients.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clients as clientsAPI } from "../api/clients";
import { QUERY_KEYS } from "../api/keys";
import { useSocketEvent } from "./useSocketEvent";
import { useSocket } from "../context/SocketContext";

export const useClients = () => {
  const queryClient = useQueryClient();
  const socket = useSocket(); // <-- NUEVO

  const {
    data: clients,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.clients],
    queryFn: clientsAPI.getAllClients,
  });

  // 🔴 Tiempo real: invalidar lista ante cambios en el backend
  useSocketEvent(socket, "clients.created", () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clients] });
  });

  useSocketEvent(socket, "clients.updated", () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clients] });
  });

  useSocketEvent(socket, "clients.deleted", () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clients] });
  });

  // CREATE
  const createClient = useMutation({
    mutationFn: clientsAPI.createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clients] });
    },
  });

  // UPDATE
  const updateClient = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      clientsAPI.updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clients] });
    },
  });

  // DELETE
  const deleteClient = useMutation({
    mutationFn: clientsAPI.deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clients] });
    },
  });

  return {
    clients,
    isLoading,
    error,
    createClient: createClient.mutateAsync,
    updateClient: updateClient.mutateAsync,
    deleteClient: deleteClient.mutateAsync,
    refreshClients: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clients] }),
  };
};
