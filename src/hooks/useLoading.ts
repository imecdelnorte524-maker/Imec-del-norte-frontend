// src/hooks/useLoading.ts
import { useState, useCallback } from "react";

interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export const useLoading = (initialState: boolean = false) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: initialState,
    message: undefined,
  });

  const startLoading = useCallback((message?: string) => {
    setLoadingState({ isLoading: true, message });
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingState({ isLoading: false, message: undefined });
  }, []);

  const withLoading = useCallback(
    async <T>(promise: Promise<T>, message?: string): Promise<T> => {
      try {
        startLoading(message);
        const result = await promise;
        return result;
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
