// contexts/ModalContext.tsx
import React, { createContext, useContext, useState, type ReactNode } from "react";

export type ModalType = "info" | "success" | "warning" | "error" | "conflict";

export interface ModalButton {
  text: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  autoClose?: boolean;
}

export interface ModalConfig {
  type: ModalType;
  title: string;
  message: string | ReactNode;
  buttons?: ModalButton[];
  size?: "small" | "medium" | "large";
  closeOnClickOutside?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
  // Para conflictos específicos
  conflicts?: Array<{
    id: string | number;
    title: string;
    description?: string;
    details?: Record<string, any>;
    icon?: ReactNode;
  }>;
}

interface ModalContextType {
  showModal: (config: ModalConfig) => void;
  hideModal: () => void;
  updateModal: (config: Partial<ModalConfig>) => void;
  isOpen: boolean;
  modalConfig: ModalConfig | null;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);

  const showModal = (config: ModalConfig) => {
    setModalConfig(config);
    setIsOpen(true);
  };

  const hideModal = () => {
    setIsOpen(false);
    if (modalConfig?.onClose) {
      modalConfig.onClose();
    }
    // Limpiar después de la animación
    setTimeout(() => {
      setModalConfig(null);
    }, 300);
  };

  const updateModal = (config: Partial<ModalConfig>) => {
    if (modalConfig) {
      setModalConfig({ ...modalConfig, ...config });
    }
  };

  return (
    <ModalContext.Provider
      value={{ showModal, hideModal, updateModal, isOpen, modalConfig }}
    >
      {children}
    </ModalContext.Provider>
  );
};
