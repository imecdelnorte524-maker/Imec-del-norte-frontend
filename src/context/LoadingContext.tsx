// src/context/LoadingContext.tsx
import React, { createContext, useContext, type ReactNode } from "react";
import { useLoading } from "../hooks/useLoading";
import Loading from "../components/Loading";

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage?: string;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  withLoading: <T>(promise: Promise<T>, message?: string) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const loading = useLoading();

  return (
    <LoadingContext.Provider value={loading}>
      {children}
      {loading.isLoading && (
        <Loading fullScreen message={loading.loadingMessage} />
      )}
    </LoadingContext.Provider>
  );
};

export const useLoadingContext = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoadingContext debe usarse dentro de LoadingProvider");
  }
  return context;
};
