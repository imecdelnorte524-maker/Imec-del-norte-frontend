// Utilidades para estados - Evitar duplicación
export const getStatusColor = (estado: string): string => {
  switch (estado.toLowerCase()) {
    case 'completado':
    case 'completada':
      return 'statusCompleted';
    case 'en proceso':
      return 'statusInProgress';
    case 'pendiente':
      return 'statusPending';
    case 'cancelado':
    case 'cancelada':
      return 'statusCancelled';
    case 'rechazada':
      return 'statusRejected';
    default:
      return 'statusPending';
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