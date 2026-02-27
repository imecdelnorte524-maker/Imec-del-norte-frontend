// hooks/useErrorHandler.ts
import { useModal } from "../context/ModalContext";

interface ConflictError {
  equipmentId?: number;
  code?: string;
  category?: string;
  area?: string;
  subArea?: string;
  conflictingOrderId?: number;
  conflictingOrderStatus?: string;
  message?: string;
}

export const useErrorHandler = () => {
  const { showModal } = useModal();

  const handleError = (error: any) => {
    console.error("Error:", error);

    if (error.response?.status === 400) {
      showModal({
        type: "warning",
        title: "Datos inválidos",
        message:
          error.response.data?.message ||
          "Por favor verifica la información ingresada",
        buttons: [{ text: "Entendido", variant: "primary" }],
      });
      return;
    }

    if (error.response?.data?.conflicts) {
      const conflicts = error.response.data.conflicts.map(
        (c: ConflictError) => ({
          id: c.equipmentId || c.conflictingOrderId || Math.random(),
          title: c.code ? `Equipo ${c.code}` : `Equipo #${c.equipmentId}`,
          description: c.message || `Este equipo está en uso en otra orden`,
          details: {
            Categoría: c.category,
            Ubicación: c.subArea || c.area || "No especificada",
            "Orden en conflicto": c.conflictingOrderId
              ? `#${c.conflictingOrderId}`
              : "No disponible",
            Estado: c.conflictingOrderStatus || "Activa",
          },
        }),
      );

      showModal({
        type: "conflict",
        title: "Equipos no disponibles",
        message: "Los siguientes equipos no pueden ser asignados:",
        conflicts,
        size: "large",
        buttons: [{ text: "Entendido", variant: "primary" }],
      });
      return;
    }

    if (error.response?.status === 401) {
      showModal({
        type: "error",
        title: "Sesión expirada",
        message: "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
        buttons: [
          {
            text: "Ir al login",
            variant: "primary",
            onClick: () => {
              window.location.href = "/login";
            },
          },
        ],
      });
      return;
    }

    if (error.response?.status === 403) {
      showModal({
        type: "error",
        title: "Acceso denegado",
        message: "No tienes permisos para realizar esta acción",
        buttons: [{ text: "Entendido", variant: "primary" }],
      });
      return;
    }

    if (error.response?.status >= 500) {
      showModal({
        type: "error",
        title: "Error del servidor",
        message:
          "Ha ocurrido un error en el servidor. Por favor intenta más tarde.",
        buttons: [{ text: "Cerrar", variant: "primary" }],
      });
      return;
    }

    showModal({
      type: "error",
      title: "Error",
      message: error.message || "Ha ocurrido un error inesperado",
      buttons: [{ text: "Cerrar", variant: "primary" }],
    });
  };

  const showSuccess = (message: string, title = "Éxito") => {
    showModal({
      type: "success",
      title,
      message,
      buttons: [{ text: "Aceptar", variant: "primary" }],
    });
  };

  const showWarning = (message: string, title = "Advertencia") => {
    showModal({
      type: "warning",
      title,
      message,
      buttons: [{ text: "Entendido", variant: "primary" }],
    });
  };

  const showConfirmation = (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    title = "Confirmar acción",
  ) => {
    showModal({
      type: "warning",
      title,
      message,
      buttons: [
        {
          text: "Cancelar",
          variant: "secondary",
          onClick: onCancel,
        },
        {
          text: "Confirmar",
          variant: "danger",
          onClick: onConfirm,
        },
      ],
    });
  };

  return {
    handleError,
    showSuccess,
    showWarning,
    showConfirmation,
  };
};
