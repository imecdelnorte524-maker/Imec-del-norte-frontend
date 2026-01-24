// src/hooks/useClients.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clients as clientsAPI } from "../api/clients";
import { QUERY_KEYS } from "../api/keys";

export const useClients = () => {
  const queryClient = useQueryClient();

  // GET: Lista de clientes (cacheada)
  const { data: clients, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.clients],
    queryFn: clientsAPI.getAllClients,
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
    refreshClients: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.clients] }),
  };
};