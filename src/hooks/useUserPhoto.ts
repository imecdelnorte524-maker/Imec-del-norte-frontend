// src/hooks/useUserPhoto.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../api/users";
import { QUERY_KEYS } from "../api/keys";
import { useSocket } from "../context/SocketContext"; // <-- NUEVO
import { useSocketEvent } from "./useSocketEvent"; // <-- NUEVO

export const useUserPhoto = (userId: number | undefined) => {
  const queryClient = useQueryClient();
  const socket = useSocket(); // <-- NUEVO

  const {
    data: photo,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.users, userId, "photo"],
    queryFn: () =>
      userId ? usersApi.getUserPhoto(userId) : Promise.resolve(null),
    enabled: !!userId,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60,
  });

  // Tiempo real: si llega un evento de foto actualizada para este usuario
  useSocketEvent<{ userId: number; image: any | null }>(
    socket,
    "users.profilePhotoUpdated",
    (payload) => {
      if (!userId || payload.userId !== userId) return;
      // invalidar y recargar
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.users, userId, "photo"],
      });
    },
  );

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => usersApi.uploadUserPhoto(userId!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.users, userId, "photo"],
      });
    },
  });

  const deletePhoto = useMutation({
    mutationFn: () => usersApi.deleteUserPhoto(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.users, userId, "photo"],
      });
    },
  });

  return {
    photo,
    isLoading,
    error,
    uploadPhoto: uploadPhoto.mutateAsync,
    deletePhoto: deletePhoto.mutateAsync,
    refetchPhoto: () =>
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.users, userId, "photo"],
      }),
  };
};
