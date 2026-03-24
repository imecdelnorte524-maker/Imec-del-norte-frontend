import { useState, useCallback, useRef } from "react";

interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export const useLoading = (initialState: boolean = false) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: initialState,
    message: undefined,
  });

  // Contador para manejar múltiples cargas simultáneas
  const loadingCountRef = useRef(0);

  const startLoading = useCallback((message?: string) => {
    loadingCountRef.current += 1;

    setLoadingState((prev) => ({
      isLoading: true,
      // Si llega un mensaje nuevo, lo usamos. Si no, mantenemos el anterior.
      message: message ?? prev.message ?? "Cargando...",
    }));
  }, []);

  const stopLoading = useCallback(() => {
    loadingCountRef.current = Math.max(0, loadingCountRef.current - 1);

    // Solo detener el loading si no hay más cargas pendientes
    if (loadingCountRef.current === 0) {
      setLoadingState({ isLoading: false, message: undefined });
    }
  }, []);

  const withLoading = useCallback(
    async <T>(promise: Promise<T>, message?: string): Promise<T> => {
      startLoading(message);
      try {
        return await promise;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading],
  );

  return {
    isLoading: loadingState.isLoading,
    loadingMessage: loadingState.message,
    startLoading,
    stopLoading,
    withLoading,
  };
};
