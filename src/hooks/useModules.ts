import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { modulesApi } from "../api/modules";
import { QUERY_KEYS } from "../api/keys";
import type { UpdateModuleDto } from "../interfaces/ModulesInterfaces";
import { useSocketEvent } from "./useSocketEvent";
import { useSocket } from "../context/SocketContext";

export const useModules = () => {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const {
    data: modules = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.modules],
    queryFn: modulesApi.getAllModules,
  });

  // Tiempo real: refrescar lista cuando cambie algo en módulos
  useSocketEvent(socket, "modules.created", () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.modules] });
  });
  useSocketEvent(socket, "modules.updated", () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.modules] });
  });
  useSocketEvent(socket, "modules.deleted", () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.modules] });
  });

  const createModuleMutation = useMutation({
    mutationFn: modulesApi.createModule,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.modules] }),
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateModuleDto }) =>
      modulesApi.updateModule(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.modules] }),
  });

  const deleteModuleMutation = useMutation({
    mutationFn: modulesApi.deleteModule,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.modules] }),
  });

  return {
    modules,
    loading: isLoading,
    error: error ? (error as Error).message : null,

    createModule: createModuleMutation.mutateAsync,
    updateModule: (id: number, data: UpdateModuleDto) =>
      updateModuleMutation.mutateAsync({ id, data }),
    deleteModule: deleteModuleMutation.mutateAsync,

    refreshModules: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.modules] }),
  };
};
