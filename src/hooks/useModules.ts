import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { modulesApi } from "../api/modules";
import { QUERY_KEYS } from "../api/keys";
import type { UpdateModuleDto } from "../interfaces/ModulesInterfaces";

export const useModules = () => {
  const queryClient = useQueryClient();

  const { data: modules = [], isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.modules],
    queryFn: modulesApi.getAllModules,
  });

  const createModuleMutation = useMutation({
    mutationFn: modulesApi.createModule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.modules] }),
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateModuleDto }) =>
      modulesApi.updateModule(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.modules] }),
  });

  const deleteModuleMutation = useMutation({
    mutationFn: modulesApi.deleteModule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.modules] }),
  });

  return {
    modules,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    
    createModule: createModuleMutation.mutateAsync,
    updateModule: (id: number, data: UpdateModuleDto) => updateModuleMutation.mutateAsync({ id, data }),
    deleteModule: deleteModuleMutation.mutateAsync,
    
    refreshModules: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.modules] }),
  };
};