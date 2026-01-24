import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../api/users";
import { QUERY_KEYS } from "../api/keys";

export const useUserPhoto = (userId: number | undefined) => {
  const queryClient = useQueryClient();

  // GET: Foto de perfil (cacheada)
  const { data: photo, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.users, userId, "photo"],
    queryFn: () => userId ? usersApi.getUserPhoto(userId) : Promise.resolve(null),
    enabled: !!userId,
    staleTime: 1000 * 60 * 60, // 1 hora (ajusta según tu necesidad)
    gcTime: 1000 * 60 * 60, // 1 hora
  });

  // SUBIR/ACTUALIZAR foto
  const uploadPhoto = useMutation({
    mutationFn: (file: File) => usersApi.uploadUserPhoto(userId!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users, userId, "photo"] });
    },
  });

  // ELIMINAR foto
  const deletePhoto = useMutation({
    mutationFn: () => usersApi.deleteUserPhoto(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users, userId, "photo"] });
    },
  });

  return {
    photo,
    isLoading,
    error,
    uploadPhoto: uploadPhoto.mutateAsync,
    deletePhoto: deletePhoto.mutateAsync,
    refetchPhoto: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users, userId, "photo"] }),
  };
};