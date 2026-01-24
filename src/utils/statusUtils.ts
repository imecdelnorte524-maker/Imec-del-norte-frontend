// Utilidades para estados - Evitar duplicación
export const getStatusClass = (
  estado: string,
  classPrefix: string,
): string => {
  const normalized = estado.toLowerCase();

  switch (normalized) {
    case 'completado':
    case 'completada':
      return `${classPrefix}Completed`;

    case 'pendiente':
      return `${classPrefix}Pending`;

    case 'cancelado':
    case 'cancelada':
      return `${classPrefix}Cancelled`;

    case 'en proceso':
      return `${classPrefix}PendingAssigned`;

    default:
      return `${classPrefix}Pending`;
  }
};


export const getPriorityIcon = (prioridad?: string): string => {
  switch (prioridad?.toLowerCase()) {
    case 'alta':
      return '🔴';
    case 'media':
      return '🟡';
    case 'baja':
      return '🟢';
    default:
      return '🟡';
  }
};

export const formatDateTime = (date: Date | string | undefined): string => {
  if (!date) return 'No programada';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};