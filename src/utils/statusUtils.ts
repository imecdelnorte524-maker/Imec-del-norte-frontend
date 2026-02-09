// Utilidades para estados - Evitar duplicación
export const getStatusClass = (
  estado: string,
  classPrefix: string,
): string => {
  if (!estado) return `${classPrefix}Pending`;

  const normalized = estado.toLowerCase().trim();

  switch (normalized) {
    // Completado
    case "completado":
    case "completada":
      return `${classPrefix}Completed`;

    // Pendiente (sin asignar o asignada, se puede usar el mismo estilo)
    case "pendiente":
    case "asignado":
    case "asignada":
      return `${classPrefix}Pending`;

    // Cancelado / Rechazado
    case "cancelado":
    case "cancelada":
    case "rechazado":
    case "rechazada":
      return `${classPrefix}Cancelled`;

    // En Proceso
    case "en proceso":
      return `${classPrefix}InProgress`;

    // 🔹 Pausada / En pausa
    case "pausada":
    case "en pausa":
      return `${classPrefix}Paused`;

    // Por defecto, tratar como pendiente
    default:
      return `${classPrefix}Pending`;
  }
};

export const getPriorityIcon = (prioridad?: string): string => {
  switch (prioridad?.toLowerCase()) {
    case "alta":
      return "🔴";
    case "media":
      return "🟡";
    case "baja":
      return "🟢";
    default:
      return "🟡";
  }
};

export const formatDateTime = (date: Date | string | undefined): string => {
  if (!date) return "No programada";

  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};