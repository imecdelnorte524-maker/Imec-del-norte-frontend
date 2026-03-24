import React, {
  createContext,
  useContext,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { useLoading } from "../hooks/useLoading";
import Loading from "../components/Loading";

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage?: string;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  withLoading: <T>(promise: Promise<T>, message?: string) => Promise<T>;
}

type GlobalLoadingEventDetail =
  | boolean
  | {
      active?: boolean;
      message?: string;
      source?: "http" | "lazy" | string;
    };

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

const SHOW_DELAY_MS = 150; // evita parpadeo en requests ultrarrápidos
const MIN_VISIBLE_MS = 250; // si se mostró, que dure un mínimo

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const loading = useLoading();

  // Control visual (anti-flicker)
  const [visible, setVisible] = useState(false);
  const shownAtRef = useRef<number | null>(null);
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  // 1) Escuchar eventos globalLoading (Axios / Lazy)
  useEffect(() => {
    const handler = (event: Event) => {
      const e = event as CustomEvent<GlobalLoadingEventDetail>;
      const detail = e.detail;

      if (typeof detail === "boolean") {
        if (detail) loading.startLoading();
        else loading.stopLoading();
        return;
      }

      const active = detail?.active;
      const message = detail?.message;

      if (active) loading.startLoading(message);
      else loading.stopLoading();
    };

    window.addEventListener("globalLoading", handler as EventListener);

    return () => {
      window.removeEventListener("globalLoading", handler as EventListener);
    };
  }, [loading]);

  // 2) Mostrar/ocultar overlay con delay y mínimo visible
  useEffect(() => {
    // limpiar timers previos
    if (showTimerRef.current) window.clearTimeout(showTimerRef.current);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);

    if (loading.isLoading) {
      showTimerRef.current = window.setTimeout(() => {
        shownAtRef.current = Date.now();
        setVisible(true);
      }, SHOW_DELAY_MS);
      return;
    }

    // si no está loading, ocultar:
    if (!visible) {
      setVisible(false);
      return;
    }

    const shownAt = shownAtRef.current ?? Date.now();
    const elapsed = Date.now() - shownAt;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

    hideTimerRef.current = window.setTimeout(() => {
      setVisible(false);
      shownAtRef.current = null;
    }, remaining);
  }, [loading.isLoading, visible]);

  const value = useMemo<LoadingContextType>(() => loading, [loading]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {visible && <Loading fullScreen message={loading.loadingMessage} />}
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
